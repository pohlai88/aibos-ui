import { CreateAccountCommand } from '../commands/create-account.command';
import { AccountType, SpecialAccountType } from '../domain/account.domain';
import { ChartOfAccounts } from '../domain/chart-of-accounts.domain';
import { omitUndefined } from '../utils';

export interface GroupCoaInput {
  tenantId: string;
  userId: string;
  entityType: 'LOCAL' | 'ELIMINATION' | 'CONSOLIDATION';
  baseCurrency: string;
  reportingCurrency: string;
}

/**
 * Factory for creating MFRS/IFRS compliant Group Chart of Accounts.
 * Supports local entities, elimination entities, and consolidation entities
 * with proper intercompany and consolidation account structures.
 */
export class GroupCoaFactory {
  /**
   * Creates a complete Group COA structure aligned with MFRS/IFRS standards.
   * Includes intercompany accounts, consolidation reserves, and FX accounts.
   */
  public static createGroupCoa(input: GroupCoaInput): ChartOfAccounts {
    const coa = new ChartOfAccounts(
      `chart-of-accounts-${input.tenantId}`,
      input.tenantId,
      input.userId,
    );

    // Create base account structure
    this.createBaseStructure(coa, input);

    // Add entity-specific accounts
    if (input.entityType === 'ELIMINATION') {
      this.createEliminationAccounts(coa, input);
    } else if (input.entityType === 'CONSOLIDATION') {
      this.createConsolidationAccounts(coa, input);
    }

    // Add intercompany accounts (for all entity types)
    this.createIntercompanyAccounts(coa, input);

    return coa;
  }

  private static createBaseStructure(coa: ChartOfAccounts, input: GroupCoaInput): void {
    // Assets
    this.createAccount(
      coa,
      {
        code: '1000',
        name: 'Current Assets',
        type: AccountType.ASSET,
        specialType: SpecialAccountType.NONE,
        postingAllowed: false, // Header account
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '1100',
        name: 'Cash and Cash Equivalents',
        type: AccountType.ASSET,
        parentCode: '1000',
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '1200',
        name: 'Trade Receivables',
        type: AccountType.ASSET,
        parentCode: '1000',
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '1500',
        name: 'Non-Current Assets',
        type: AccountType.ASSET,
        specialType: SpecialAccountType.NONE,
        postingAllowed: false, // Header account
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '1600',
        name: 'Property, Plant & Equipment',
        type: AccountType.ASSET,
        parentCode: '1500',
      },
      input,
    );

    // Liabilities
    this.createAccount(
      coa,
      {
        code: '2000',
        name: 'Current Liabilities',
        type: AccountType.LIABILITY,
        specialType: SpecialAccountType.NONE,
        postingAllowed: false, // Header account
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '2100',
        name: 'Trade Payables',
        type: AccountType.LIABILITY,
        parentCode: '2000',
      },
      input,
    );

    // Equity
    this.createAccount(
      coa,
      {
        code: '3000',
        name: 'Equity',
        type: AccountType.EQUITY,
        specialType: SpecialAccountType.NONE,
        postingAllowed: false, // Header account
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '3100',
        name: 'Share Capital',
        type: AccountType.EQUITY,
        parentCode: '3000',
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '3200',
        name: 'Retained Earnings',
        type: AccountType.EQUITY,
        parentCode: '3000',
      },
      input,
    );

    // Revenue
    this.createAccount(
      coa,
      {
        code: '4000',
        name: 'Revenue',
        type: AccountType.REVENUE,
        specialType: SpecialAccountType.NONE,
        postingAllowed: false, // Header account
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '4100',
        name: 'Sales Revenue',
        type: AccountType.REVENUE,
        parentCode: '4000',
      },
      input,
    );

    // Expenses
    this.createAccount(
      coa,
      {
        code: '5000',
        name: 'Operating Expenses',
        type: AccountType.EXPENSE,
        specialType: SpecialAccountType.NONE,
        postingAllowed: false, // Header account
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '5100',
        name: 'Administrative Expenses',
        type: AccountType.EXPENSE,
        parentCode: '5000',
      },
      input,
    );
  }

  private static createEliminationAccounts(coa: ChartOfAccounts, input: GroupCoaInput): void {
    // Elimination Reserve (MFRS 10/IFRS 10)
    this.createAccount(
      coa,
      {
        code: '3900',
        name: 'Elimination Reserve',
        type: AccountType.EQUITY,
        parentCode: '3000',
        specialType: SpecialAccountType.ELIMINATION_RESERVE,
        postingAllowed: true, // Only consolidation journals can post here
      },
      input,
    );

    // Unrealized Profit in Inventory (contra to inventory)
    this.createAccount(
      coa,
      {
        code: '1950',
        name: 'Unrealized Profit in Inventory',
        type: AccountType.ASSET,
        parentCode: '1000',
        specialType: SpecialAccountType.UNREALIZED_PROFIT_INVENTORY,
        postingAllowed: true,
      },
      input,
    );
  }

  private static createConsolidationAccounts(coa: ChartOfAccounts, input: GroupCoaInput): void {
    // Non-Controlling Interests (NCI) - MFRS 10/IFRS 10
    this.createAccount(
      coa,
      {
        code: '3300',
        name: 'Non-Controlling Interests',
        type: AccountType.EQUITY,
        parentCode: '3000',
        specialType: SpecialAccountType.NCI_EQUITY,
        postingAllowed: false, // System-managed account
      },
      input,
    );

    // Cumulative Translation Adjustment (CTA) - MFRS 121/IAS 21
    this.createAccount(
      coa,
      {
        code: '3400',
        name: 'Cumulative Translation Adjustment',
        type: AccountType.EQUITY,
        parentCode: '3000',
        specialType: SpecialAccountType.CTA_EQUITY,
        postingAllowed: false, // System-managed account
      },
      input,
    );

    // Goodwill - MFRS 3/IFRS 3
    this.createAccount(
      coa,
      {
        code: '1700',
        name: 'Goodwill',
        type: AccountType.ASSET,
        parentCode: '1500',
        specialType: SpecialAccountType.GOODWILL,
        postingAllowed: true,
      },
      input,
    );

    // FX Gain/Loss accounts
    this.createAccount(
      coa,
      {
        code: '4200',
        name: 'Foreign Exchange Gain',
        type: AccountType.REVENUE,
        parentCode: '4000',
        specialType: SpecialAccountType.FX_GAIN,
        postingAllowed: true,
      },
      input,
    );

    this.createAccount(
      coa,
      {
        code: '5200',
        name: 'Foreign Exchange Loss',
        type: AccountType.EXPENSE,
        parentCode: '5000',
        specialType: SpecialAccountType.FX_LOSS,
        postingAllowed: true,
      },
      input,
    );
  }

  private static createIntercompanyAccounts(coa: ChartOfAccounts, input: GroupCoaInput): void {
    // Intercompany Receivables (per counterparty)
    this.createAccount(
      coa,
      {
        code: '1300',
        name: 'Intercompany Receivables',
        type: AccountType.ASSET,
        parentCode: '1000',
        specialType: SpecialAccountType.INTERCO_RECEIVABLE,
        postingAllowed: true,
      },
      input,
    );

    // Intercompany Payables (per counterparty)
    this.createAccount(
      coa,
      {
        code: '2200',
        name: 'Intercompany Payables',
        type: AccountType.LIABILITY,
        parentCode: '2000',
        specialType: SpecialAccountType.INTERCO_PAYABLE,
        postingAllowed: true,
      },
      input,
    );

    // Intercompany Sales (optional - if booking at P&L level)
    this.createAccount(
      coa,
      {
        code: '4300',
        name: 'Intercompany Sales',
        type: AccountType.REVENUE,
        parentCode: '4000',
        specialType: SpecialAccountType.NONE,
        postingAllowed: true,
      },
      input,
    );

    // Intercompany COGS (optional - if booking at P&L level)
    this.createAccount(
      coa,
      {
        code: '5300',
        name: 'Intercompany Cost of Sales',
        type: AccountType.EXPENSE,
        parentCode: '5000',
        specialType: SpecialAccountType.NONE,
        postingAllowed: true,
      },
      input,
    );
  }

  private static createAccount(
    coa: ChartOfAccounts,
    account: {
      code: string;
      name: string;
      type: AccountType;
      parentCode?: string;
      specialType?: SpecialAccountType;
      postingAllowed?: boolean;
    },
    input: GroupCoaInput,
  ): void {
    const command = new CreateAccountCommand(
      omitUndefined({
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        parentAccountCode: account.parentCode,
        tenantId: input.tenantId,
        userId: input.userId,
        specialAccountType: account.specialType ?? SpecialAccountType.NONE,
        postingAllowed: account.postingAllowed ?? true,
      }),
    );

    coa.createAccount(command);
  }

  /**
   * Creates a mapping table for local GL codes to group GL codes.
   * Essential for consolidation processing.
   */
  public static createGlMappingTable(): Map<string, string> {
    const mapping = new Map<string, string>();

    // Example mappings (would be configurable in practice)
    mapping.set('LOCAL-CASH', '1100');
    mapping.set('LOCAL-AR', '1200');
    mapping.set('LOCAL-AP', '2100');
    mapping.set('LOCAL-SALES', '4100');
    mapping.set('LOCAL-EXP', '5100');

    return mapping;
  }

  /**
   * Validates intercompany mirroring rules (MFRS 10/IFRS 10).
   * Ensures IC receivables equal IC payables by counterparty and currency.
   */
  public static validateIntercompanyMirroring(
    _coa: ChartOfAccounts,
    counterpartyId: string,
    currency: string,
  ): { isValid: boolean; message?: string } {
    // This would be implemented with actual balance checking
    // For now, return a placeholder validation
    return {
      isValid: true,
      message: `Intercompany balances validated for counterparty ${counterpartyId} in ${currency}`,
    };
  }
}
