import { AccountType, SpecialAccountType } from '../domain/account.domain';
import { omitUndefined, hasKey, isNonEmpty } from '../utils';
import { 
  createValidationError, 
  createBusinessError,
  type ErrorContext 
} from '../utils/error-utilities';

export interface CreateAccountCommandProperties {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly parentAccountCode?: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly specialAccountType?: SpecialAccountType;
  readonly postingAllowed?: boolean;
  readonly companionLinks?: {
    accumulatedDepreciationCode?: string;
    depreciationExpenseCode?: string;
    allowanceAccountCode?: string;
  };
}

export class CreateAccountCommand {
  public readonly accountCode: string;
  public readonly accountName: string;
  public readonly accountType: AccountType;
  public readonly parentAccountCode?: string;
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly specialAccountType: SpecialAccountType;
  public readonly postingAllowed: boolean;
  public readonly companionLinks?: {
    accumulatedDepreciationCode?: string;
    depreciationExpenseCode?: string;
    allowanceAccountCode?: string;
  };

  constructor(properties: CreateAccountCommandProperties) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanProperties = omitUndefined({
      accountCode: properties.accountCode?.trim(),
      accountName: properties.accountName?.trim(),
      accountType: properties.accountType,
      parentAccountCode: properties.parentAccountCode?.trim(),
      tenantId: properties.tenantId?.trim(),
      userId: properties.userId?.trim(),
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
    this.userId = cleanProperties.userId;
    this.specialAccountType = cleanProperties.specialAccountType;
    this.postingAllowed = cleanProperties.postingAllowed;
    this.companionLinks = cleanProperties.companionLinks;

    // Enforce invariants on construction
    this.validate();
    // Prevent post-construct mutation
    Object.freeze(this);
  }

  public validate(): void {
    const context: ErrorContext = {
      operation: 'create-account-validation',
      userId: this.userId,
      tenantId: this.tenantId,
      data: { accountCode: this.accountCode, accountType: this.accountType }
    };

    if (!isNonEmpty(this.accountCode)) {
      throw createValidationError('accountCode', 'Account code is required', this.accountCode, context);
    }

    if (!isNonEmpty(this.accountName)) {
      throw createValidationError('accountName', 'Account name is required', this.accountName, context);
    }

    if (!isValidAccountType(this.accountType)) {
      throw createValidationError('accountType', 'Invalid account type', this.accountType, context);
    }

    if (!isNonEmpty(this.tenantId)) {
      throw createValidationError('tenantId', 'Tenant ID is required', this.tenantId, context);
    }

    if (!isNonEmpty(this.userId)) {
      throw createValidationError('userId', 'User ID is required', this.userId, context);
    }

    // Validate account code format (alphanumeric, 4-10 characters)
    if (!/^[A-Z0-9]{4,10}$/.test(this.accountCode)) {
      throw createValidationError(
        'accountCode', 
        'Account code must be 4-10 alphanumeric characters', 
        this.accountCode, 
        context
      );
    }

    // Defensive: parent cannot equal self (avoid trivial cycles)
    if (this.parentAccountCode && this.parentAccountCode === this.accountCode) {
      throw createBusinessError(
        'PARENT_SELF_REFERENCE',
        'Parent account code cannot be the same as account code',
        'CreateAccountCommand',
        context
      );
    }

    // Basic sanity for companions (if partially provided)
    const links = this.companionLinks;
    if (links) {
      const hasAccumulatorDep = !!links.accumulatedDepreciationCode;
      const hasDepExp = !!links.depreciationExpenseCode;
      if (hasAccumulatorDep !== hasDepExp) {
        throw createBusinessError(
          'INCOMPLETE_COMPANION_LINKS',
          'Both accumulatedDepreciationCode and depreciationExpenseCode must be provided together',
          'CreateAccountCommand',
          context
        );
      }
    }
  }
}

// ---- Local helpers (kept minimal to avoid drift) ----

function isValidAccountType(value: unknown): value is AccountType {
  // Works for both string and numeric enums
  return (
    hasKey(AccountType, value as PropertyKey) ||
    Object.values(AccountType as unknown as Record<string, unknown>).includes(value as never)
  );
}
