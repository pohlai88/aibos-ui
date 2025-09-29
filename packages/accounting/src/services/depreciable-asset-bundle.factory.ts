import { CreateAccountCommand } from '../commands/create-account.command';
import { type Account, AccountType, SpecialAccountType } from '../domain/account.domain';
import { type ChartOfAccounts } from '../domain/chart-of-accounts.domain';
import { omitUndefined } from '../utils';
import { createBusinessError } from '../utils/error-utilities';

// Constants for error messages
const ASSET_NOT_DEPRECIABLE_MESSAGE = 'Asset {assetCode} is not configured as a depreciable asset (missing companion links)';
const VALIDATE_DEPRECIABLE_ASSET_OPERATION = 'validate-depreciable-asset';

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
      throw createBusinessError(
        'INVALID_DEPRECIABLE_ASSET_BUNDLE',
        `Asset account ${assetCode} not found`,
        assetCode,
        { operation: 'validate-asset-account' }
      );
    }

    if (
      !asset.companionLinks?.accumulatedDepreciationCode ||
      !asset.companionLinks?.depreciationExpenseCode
    ) {
      throw createBusinessError(
        'ASSET_NOT_DEPRECIABLE',
        ASSET_NOT_DEPRECIABLE_MESSAGE.replace('{assetCode}', assetCode),
        assetCode,
        { operation: VALIDATE_DEPRECIABLE_ASSET_OPERATION }
      );
    }

    const accumulatedDepreciation = coa.getAccount(
      asset.companionLinks.accumulatedDepreciationCode,
    );
    const depreciationExpense = coa.getAccount(asset.companionLinks.depreciationExpenseCode);

    if (!accumulatedDepreciation) {
      throw createBusinessError(
        'ACCUMULATED_DEPRECIATION_ACCOUNT_NOT_FOUND',
        `Accumulated Depreciation account ${asset.companionLinks.accumulatedDepreciationCode} not found`,
        asset.companionLinks.accumulatedDepreciationCode,
        { operation: VALIDATE_DEPRECIABLE_ASSET_OPERATION }
      );
    }

    if (!depreciationExpense) {
      throw createBusinessError(
        'DEPRECIATION_EXPENSE_ACCOUNT_NOT_FOUND',
        `Depreciation Expense account ${asset.companionLinks.depreciationExpenseCode} not found`,
        asset.companionLinks.depreciationExpenseCode,
        { operation: VALIDATE_DEPRECIABLE_ASSET_OPERATION }
      );
    }

    // Validate special account types
    if (
      accumulatedDepreciation.specialAccountType !== SpecialAccountType.ACCUMULATED_DEPRECIATION
    ) {
      throw createBusinessError(
        'INVALID_ACCUMULATED_DEPRECIATION_TYPE',
        `Account ${accumulatedDepreciation.accountCode} is not an Accumulated Depreciation account`,
        accumulatedDepreciation.accountCode,
        { operation: VALIDATE_DEPRECIABLE_ASSET_OPERATION }
      );
    }

    if (depreciationExpense.specialAccountType !== SpecialAccountType.DEPRECIATION_EXPENSE) {
      throw createBusinessError(
        'INVALID_DEPRECIATION_EXPENSE_TYPE',
        `Account ${depreciationExpense.accountCode} is not a Depreciation Expense account`,
        depreciationExpense.accountCode,
        { operation: VALIDATE_DEPRECIABLE_ASSET_OPERATION }
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
      throw createBusinessError(
        'INVALID_DEPRECIABLE_ASSET_BUNDLE',
        'Depreciation amount must be positive',
        depreciationAmount.toString(),
        { operation: 'validate-depreciation-amount' }
      );
    }

    return {
      debitAccount: bundle.depreciationExpense.accountCode,
      creditAccount: bundle.accumulatedDepreciation.accountCode,
      amount: depreciationAmount,
      description,
    };
  }
}
