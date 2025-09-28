import { CreateAccountCommand } from '../commands/create-account.command';
import { type Account, AccountType, SpecialAccountType } from '../domain/account.domain';
import { type ChartOfAccounts } from '../domain/chart-of-accounts.domain';
import { omitUndefined } from '../utils';

export interface DepreciableAssetBundleInput {
  asset: { code: string; name: string; parentCode?: string };
  accumulatedDepreciation: { code: string; name: string; parentCode?: string };
  depreciationExpense: { code: string; name: string; parentCode?: string };
  tenantId: string;
  userId: string;
}

/**
 * Factory service for creating depreciable asset bundles atomically.
 * Creates Asset, Accumulated Depreciation (contra-asset), and Depreciation Expense
 * with proper type validation, special account types, and companion links.
 */
export class DepreciableAssetBundleFactory {
  /**
   * Creates a complete depreciable asset bundle with all three required accounts.
   * The accounts are created in dependency order to satisfy companion validation.
   */
  public static createDepreciableAssetBundle(
    coa: ChartOfAccounts,
    input: DepreciableAssetBundleInput,
  ): void {
    const baseProperties = {
      tenantId: input.tenantId,
      userId: input.userId,
    };

    // 1) Create Accumulated Depreciation (contra-asset) first
    const accumulatorDepCommand = new CreateAccountCommand(
      omitUndefined({
        ...baseProperties,
        accountCode: input.accumulatedDepreciation.code,
        accountName: input.accumulatedDepreciation.name,
        accountType: AccountType.ASSET,
        parentAccountCode: input.accumulatedDepreciation.parentCode,
        specialAccountType: SpecialAccountType.ACCUMULATED_DEPRECIATION,
        postingAllowed: true,
      }),
    );
    coa.createAccount(accumulatorDepCommand);

    // 2) Create Depreciation Expense
    const depExpCommand = new CreateAccountCommand(
      omitUndefined({
        ...baseProperties,
        accountCode: input.depreciationExpense.code,
        accountName: input.depreciationExpense.name,
        accountType: AccountType.EXPENSE,
        parentAccountCode: input.depreciationExpense.parentCode,
        specialAccountType: SpecialAccountType.DEPRECIATION_EXPENSE,
        postingAllowed: true,
      }),
    );
    coa.createAccount(depExpCommand);

    // 3) Create Asset with companion links (now that companions exist)
    const assetCommand = new CreateAccountCommand(
      omitUndefined({
        ...baseProperties,
        accountCode: input.asset.code,
        accountName: input.asset.name,
        accountType: AccountType.ASSET,
        parentAccountCode: input.asset.parentCode,
        specialAccountType: SpecialAccountType.NONE,
        postingAllowed: true,
        companionLinks: {
          accumulatedDepreciationCode: input.accumulatedDepreciation.code,
          depreciationExpenseCode: input.depreciationExpense.code,
        },
      }),
    );
    coa.createAccount(assetCommand);
  }

  /**
   * Validates that a depreciable asset bundle exists and is properly configured.
   * Useful for verification before creating depreciation journal entries.
   */
  public static validateDepreciableAssetBundle(
    coa: ChartOfAccounts,
    assetCode: string,
  ): {
    asset: Account;
    accumulatedDepreciation: Account;
    depreciationExpense: Account;
  } {
    const asset = coa.getAccount(assetCode);
    if (!asset) {
      throw new Error(`Asset account ${assetCode} not found`);
    }

    if (
      !asset.companionLinks?.accumulatedDepreciationCode ||
      !asset.companionLinks?.depreciationExpenseCode
    ) {
      throw new Error(
        `Asset ${assetCode} is not configured as a depreciable asset (missing companion links)`,
      );
    }

    const accumulatedDepreciation = coa.getAccount(
      asset.companionLinks.accumulatedDepreciationCode,
    );
    const depreciationExpense = coa.getAccount(asset.companionLinks.depreciationExpenseCode);

    if (!accumulatedDepreciation) {
      throw new Error(
        `Accumulated Depreciation account ${asset.companionLinks.accumulatedDepreciationCode} not found`,
      );
    }

    if (!depreciationExpense) {
      throw new Error(
        `Depreciation Expense account ${asset.companionLinks.depreciationExpenseCode} not found`,
      );
    }

    // Validate special account types
    if (
      accumulatedDepreciation.specialAccountType !== SpecialAccountType.ACCUMULATED_DEPRECIATION
    ) {
      throw new Error(
        `Account ${accumulatedDepreciation.accountCode} is not an Accumulated Depreciation account`,
      );
    }

    if (depreciationExpense.specialAccountType !== SpecialAccountType.DEPRECIATION_EXPENSE) {
      throw new Error(
        `Account ${depreciationExpense.accountCode} is not a Depreciation Expense account`,
      );
    }

    return {
      asset,
      accumulatedDepreciation,
      depreciationExpense,
    };
  }

  /**
   * Creates a depreciation journal entry command for the given asset.
   * This is a helper method that can be used with the JournalEntry aggregate.
   */
  public static createDepreciationJournalEntry(
    coa: ChartOfAccounts,
    assetCode: string,
    depreciationAmount: number,
    description: string = 'Monthly depreciation',
  ): {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
  } {
    const bundle = this.validateDepreciableAssetBundle(coa, assetCode);

    if (depreciationAmount <= 0) {
      throw new Error('Depreciation amount must be positive');
    }

    return {
      debitAccount: bundle.depreciationExpense.accountCode,
      creditAccount: bundle.accumulatedDepreciation.accountCode,
      amount: depreciationAmount,
      description,
    };
  }
}
