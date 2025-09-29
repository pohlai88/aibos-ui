// DomainEvent import removed as it's not used in this file
import { omitUndefined, ACCOUNT_TYPES, AccountType, assert, round2, isNonEmpty } from '../utils';
import { 
  createBusinessError, 
  createValidationError,
  type ErrorContext 
} from '../utils/error-utilities';

// Re-export the centralized AccountType from utilities
export { ACCOUNT_TYPES, AccountType };

export enum SpecialAccountType {
  NONE = 'None',
  // Contra & provisioning
  ACCUMULATED_DEPRECIATION = 'AccumulatedDepreciation', // Contra-asset
  ALLOWANCE_FOR_DOUBTFUL_ACCOUNTS = 'AllowanceForDoubtfulAccounts', // Contra-asset (AR)
  PROVISION = 'Provision', // Generic provisioning (usually Liability)
  // Control / system
  CONTROL_RETAINED_EARNINGS = 'ControlRetainedEarnings',
  CONTROL_AR = 'ControlAR',
  CONTROL_AP = 'ControlAP',
  CLEARING = 'Clearing',
  SUSPENSE = 'Suspense',
  ROUNDING = 'Rounding',
  // Tax
  TAX_PAYABLE = 'TaxPayable',
  TAX_RECEIVABLE = 'TaxReceivable',
  // FX revaluation
  FX_GAIN = 'FxGain',
  FX_LOSS = 'FxLoss',
  // Intercompany
  INTERCO_RECEIVABLE = 'IntercompanyReceivable',
  INTERCO_PAYABLE = 'IntercompanyPayable',
  // Depreciation expense marker (for companion linking clarity)
  DEPRECIATION_EXPENSE = 'DepreciationExpense',
  // Consolidation & Group accounts (MFRS/IFRS aligned)
  ELIMINATION_RESERVE = 'EliminationReserve',
  CTA_EQUITY = 'CtaEquity',
  NCI_EQUITY = 'NciEquity',
  GOODWILL = 'Goodwill',
  UNREALIZED_PROFIT_INVENTORY = 'UnrealizedProfitInventory',
}

export interface AccountProperties {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly parentAccountCode?: string;
  readonly tenantId: string;
  readonly isActive: boolean;
  readonly balance: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly specialAccountType?: SpecialAccountType;
  readonly postingAllowed?: boolean; // default true for leaves, false for headers/controls
  readonly companionLinks?: {
    accumulatedDepreciationCode?: string;
    depreciationExpenseCode?: string;
    allowanceAccountCode?: string; // for AR ECL
  };
}

export class Account {
  public readonly accountCode: string;
  public readonly accountName: string;
  public readonly accountType: AccountType;
  public readonly parentAccountCode?: string;
  public readonly tenantId: string;
  public readonly isActive: boolean;
  public readonly balance: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly specialAccountType: SpecialAccountType;
  public readonly postingAllowed: boolean;
  public readonly companionLinks?: {
    accumulatedDepreciationCode?: string;
    depreciationExpenseCode?: string;
    allowanceAccountCode?: string;
  };

  constructor(properties: AccountProperties) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanProperties = omitUndefined({
      accountCode: properties.accountCode?.trim(),
      accountName: properties.accountName?.trim(),
      accountType: properties.accountType,
      parentAccountCode: properties.parentAccountCode?.trim(),
      tenantId: properties.tenantId?.trim(),
      isActive: properties.isActive,
      balance: round2(properties.balance),
      createdAt: properties.createdAt,
      updatedAt: properties.updatedAt,
      specialAccountType: properties.specialAccountType ?? SpecialAccountType.NONE,
      postingAllowed: properties.postingAllowed ?? true,
      companionLinks: properties.companionLinks,
    });

    // Assign from cleaned properties
    this.accountCode = cleanProperties.accountCode;
    this.accountName = cleanProperties.accountName;
    this.accountType = cleanProperties.accountType;
    this.parentAccountCode = cleanProperties.parentAccountCode;
    this.tenantId = cleanProperties.tenantId;
    this.isActive = cleanProperties.isActive;
    this.balance = cleanProperties.balance;
    this.createdAt = cleanProperties.createdAt;
    this.updatedAt = cleanProperties.updatedAt;
    this.specialAccountType = cleanProperties.specialAccountType;
    this.postingAllowed = cleanProperties.postingAllowed;
    this.companionLinks = cleanProperties.companionLinks;

    this.validate();
    Object.freeze(this);
  }

  public updateBalance(amount: number): Account {
    const next = round2(this.balance + amount);
    const now = new Date();
    const nextAccount = new Account({
      ...this.toProps(),
      balance: next,
      updatedAt: now,
    });
    // Ensure polarity invariants still hold after the change
    nextAccount.validateBalance();
    return nextAccount;
  }

  public deactivate(): Account {
    if (!this.isActive) return this;
    return new Account({ ...this.toProps(), isActive: false, updatedAt: new Date() });
  }

  public activate(): Account {
    if (this.isActive) return this;
    return new Account({ ...this.toProps(), isActive: true, updatedAt: new Date() });
  }

  public isDebitAccount(): boolean {
    return this.accountType === AccountType.ASSET || this.accountType === AccountType.EXPENSE;
  }

  public isCreditAccount(): boolean {
    return (
      this.accountType === AccountType.LIABILITY ||
      this.accountType === AccountType.EQUITY ||
      this.accountType === AccountType.REVENUE
    );
  }

  public validateBalance(): void {
    const context: ErrorContext = {
      operation: 'account-balance-validation',
      data: { accountCode: this.accountCode, accountType: this.accountType, balance: this.balance }
    };

    if (this.isDebitAccount() && this.balance < 0) {
      throw createBusinessError(
        'NEGATIVE_DEBIT_BALANCE',
        `Debit account ${this.accountCode} cannot have negative balance`,
        'Account',
        context
      );
    }

    if (this.isCreditAccount() && this.balance > 0) {
      throw createBusinessError(
        'POSITIVE_CREDIT_BALANCE',
        `Credit account ${this.accountCode} cannot have positive balance`,
        'Account',
        context
      );
    }
  }

  private validateSpecials(): void {
    const context: ErrorContext = {
      operation: 'account-special-validation',
      data: { accountCode: this.accountCode, specialAccountType: this.specialAccountType, accountType: this.accountType }
    };

    // Polarity expectations for common specials
    if (this.specialAccountType === SpecialAccountType.ACCUMULATED_DEPRECIATION) {
      if (this.accountType !== AccountType.ASSET) {
        throw createBusinessError(
          'INVALID_ACCUMULATED_DEPRECIATION_TYPE',
          'Accumulated Depreciation must be of base type Asset (contra-asset).',
          'Account',
          context
        );
      }
      // Normally carries a credit balance (contra-asset)
      if (this.balance > 0) {
        throw createBusinessError(
          'INVALID_ACCUMULATED_DEPRECIATION_BALANCE',
          'Accumulated Depreciation should not carry a positive (debit) balance.',
          'Account',
          context
        );
      }
    }
    if (this.specialAccountType === SpecialAccountType.DEPRECIATION_EXPENSE) {
      if (this.accountType !== AccountType.EXPENSE) {
        throw createBusinessError(
          'INVALID_DEPRECIATION_EXPENSE_TYPE',
          'Depreciation Expense must be an Expense account.',
          'Account',
          context
        );
      }
    }
    if (this.specialAccountType === SpecialAccountType.CLEARING && !this.postingAllowed) {
      // Clearing accounts are usually posted to, then cleared
      throw createBusinessError(
        'CLEARING_ACCOUNT_POSTING_DISABLED',
        'Clearing accounts should allow postings.',
        'Account',
        context
      );
    }
  }

  public updateDetails(
    _accountName: string,
    _accountType: AccountType,
    _parentAccountCode?: string,
  ): void {
    // Note: In a real implementation, this would create a new Account instance
    // since the properties are readonly. For now, we'll throw an error to indicate
    // that account updates should be handled through domain events.
    const context: ErrorContext = {
      operation: 'account-update-attempt',
      data: { accountCode: this.accountCode, tenantId: this.tenantId }
    };
    
    throw createBusinessError(
      'IMMUTABLE_ACCOUNT_UPDATE',
      'Account updates must be handled through domain events',
      'Account',
      context
    );
  }

  // ---- Validation & helpers -------------------------------------------------
  private validate(): void {
    const context: ErrorContext = {
      operation: 'account-validation',
      data: { accountCode: this.accountCode, tenantId: this.tenantId }
    };

    // Basic presence
    assert(isNonEmpty(this.accountCode), 'Account code is required');
    assert(isNonEmpty(this.accountName), 'Account name is required');
    assert(isNonEmpty(this.tenantId), 'Tenant ID is required');
    // Code format: alphanumeric (3-20 characters)
    const accountCodePattern = /^[A-Z0-9]{3,20}$/;
    assert(accountCodePattern.test(this.accountCode), 'Account code must be 3-20 alphanumeric characters');
    // Parent cannot equal self
    if (this.parentAccountCode && this.parentAccountCode === this.accountCode) {
      throw createBusinessError(
        'PARENT_SELF_REFERENCE',
        'Parent account code cannot equal account code',
        'Account',
        context
      );
    }
    // Dates sanity
    if (!(this.createdAt instanceof Date) || isNaN(this.createdAt.valueOf())) {
      throw new TypeError('createdAt must be a valid Date');
    }
    if (!(this.updatedAt instanceof Date) || isNaN(this.updatedAt.valueOf())) {
      throw new TypeError('updatedAt must be a valid Date');
    }
    if (this.updatedAt.valueOf() < this.createdAt.valueOf()) {
      throw createValidationError(
        'updatedAt',
        'updatedAt cannot be earlier than createdAt',
        this.updatedAt,
        context
      );
    }
    // Balance must be finite and <= 2 decimals
    if (!Number.isFinite(this.balance)) {
      throw new TypeError('Balance must be a finite number');
    }
    if (!isMaxTwoDecimals(this.balance)) {
      throw createValidationError(
        'balance',
        'Balance must have at most two decimal places',
        this.balance,
        context
      );
    }
    // Polarity rules
    this.validateBalance();
    // Special account rules
    this.validateSpecials();
  }

  private toProps(): AccountProperties {
    return omitUndefined({
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
      parentAccountCode: this.parentAccountCode,
      tenantId: this.tenantId,
      isActive: this.isActive,
      balance: this.balance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      specialAccountType: this.specialAccountType,
      postingAllowed: this.postingAllowed,
      companionLinks: this.companionLinks,
    });
  }
}

// ---- Local pure helpers -----------------------------------------------------
function isMaxTwoDecimals(n: number): boolean {
  return Math.round(n * 100) === n * 100;
}
