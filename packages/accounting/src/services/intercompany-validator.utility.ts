import { PostJournalEntryCommand } from '../commands/post-journal-entry.command';
import { AccountType, SpecialAccountType } from '../domain/account.domain';
import { type ChartOfAccounts } from '../domain/chart-of-accounts.domain';
import { isEmpty } from '../utils';
// import { JournalEntryLine } from '../domain/journal-entry-line'; // No longer needed

export interface IntercompanyJournalLine {
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  counterpartyCompanyId: string;
  currency: string;
  description?: string;
}

export interface IntercompanyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validator for intercompany journal entries ensuring MFRS 10/IFRS 10 compliance.
 * Enforces mirroring rules and counterparty balance reconciliation.
 */
export class IntercompanyValidator {
  /**
   * Validates an intercompany journal entry for compliance with consolidation standards.
   * Ensures proper mirroring and counterparty balance reconciliation.
   */
  public static validateIntercompanyJournal(
    coa: ChartOfAccounts,
    command: PostJournalEntryCommand,
    counterpartyCompanyId: string,
    currency: string,
  ): IntercompanyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if any lines have intercompany accounts
    const hasIntercompanyAccounts = command.entries.some((entry) => {
      const account = coa.getAccount(entry.accountCode);
      return (
        account?.specialAccountType === SpecialAccountType.INTERCO_RECEIVABLE ||
        account?.specialAccountType === SpecialAccountType.INTERCO_PAYABLE
      );
    });

    if (!hasIntercompanyAccounts) {
      return {
        isValid: true,
        errors: [],
        warnings: ['No intercompany accounts found in journal entry'],
      };
    }

    // Validate double-entry balancing
    const totalDebit = command.getTotalDebit();
    const totalCredit = command.getTotalCredit();

    if (totalDebit !== totalCredit) {
      errors.push(`Journal entry is not balanced: Debit ${totalDebit} ≠ Credit ${totalCredit}`);
    }

    // Validate intercompany mirroring by counterparty and currency
    const icValidation = this.validateIntercompanyMirroring(
      coa,
      command,
      counterpartyCompanyId,
      currency,
    );

    if (!icValidation.isValid) {
      errors.push(...icValidation.errors);
    }

    warnings.push(...icValidation.warnings);

    // Validate account types for intercompany entries
    this.validateAccountTypes(coa, command, errors);

    // Validate currency consistency
    this.validateCurrencyConsistency(command, currency, errors);

    return {
      isValid: isEmpty(errors),
      errors,
      warnings,
    };
  }

  /**
   * Validates intercompany mirroring rules (MFRS 10/IFRS 10).
   * Ensures IC receivables equal IC payables by counterparty and currency.
   */
  private static validateIntercompanyMirroring(
    coa: ChartOfAccounts,
    command: PostJournalEntryCommand,
    counterpartyCompanyId: string,
    _currency: string,
  ): IntercompanyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Group entries by counterparty and currency
    const counterpartyEntries = command.entries.filter((_entry) => {
      // In a real implementation, this would check against a counterparty field
      // For now, we'll assume all entries are for the same counterparty
      return true;
    });

    if (isEmpty(counterpartyEntries)) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Calculate net intercompany position
    let netReceivable = 0;
    let netPayable = 0;

    for (const entry of counterpartyEntries) {
      const account = coa.getAccount(entry.accountCode);
      if (!account) continue;

      if (account.specialAccountType === SpecialAccountType.INTERCO_RECEIVABLE) {
        netReceivable += entry.debitAmount - entry.creditAmount;
      } else if (account.specialAccountType === SpecialAccountType.INTERCO_PAYABLE) {
        netPayable += entry.creditAmount - entry.debitAmount;
      }
    }

    // For proper mirroring, net receivable should equal net payable
    const netPosition = Math.abs(netReceivable - netPayable);
    if (netPosition > 0.01) {
      // Allow for small rounding differences
      errors.push(
        `Intercompany mirroring violation: Net receivable ${netReceivable} ≠ Net payable ${netPayable} for counterparty ${counterpartyCompanyId}`,
      );
    }

    // Check for balanced intercompany entries within the journal
    const icReceivableTotal = counterpartyEntries
      .filter((entry) => {
        const account = coa.getAccount(entry.accountCode);
        return account?.specialAccountType === SpecialAccountType.INTERCO_RECEIVABLE;
      })
      .reduce((sum, entry) => sum + entry.debitAmount - entry.creditAmount, 0);

    const icPayableTotal = counterpartyEntries
      .filter((entry) => {
        const account = coa.getAccount(entry.accountCode);
        return account?.specialAccountType === SpecialAccountType.INTERCO_PAYABLE;
      })
      .reduce((sum, entry) => sum + entry.creditAmount - entry.debitAmount, 0);

    if (Math.abs(icReceivableTotal - icPayableTotal) > 0.01) {
      warnings.push(
        `Intercompany journal not self-balancing: Receivable ${icReceivableTotal} ≠ Payable ${icPayableTotal}`,
      );
    }

    return {
      isValid: isEmpty(errors),
      errors,
      warnings,
    };
  }

  /**
   * Validates that intercompany accounts have correct types and posting permissions.
   */
  private static validateAccountTypes(
    coa: ChartOfAccounts,
    command: PostJournalEntryCommand,
    errors: string[],
  ): void {
    for (const entry of command.entries) {
      const account = coa.getAccount(entry.accountCode);
      if (!account) continue;

      if (account.specialAccountType === SpecialAccountType.INTERCO_RECEIVABLE) {
        if (account.accountType !== AccountType.ASSET) {
          errors.push(`Intercompany Receivable account ${entry.accountCode} must be of type Asset`);
        }
        if (!account.postingAllowed) {
          errors.push(
            `Intercompany Receivable account ${entry.accountCode} does not allow postings`,
          );
        }
      } else if (account.specialAccountType === SpecialAccountType.INTERCO_PAYABLE) {
        if (account.accountType !== AccountType.LIABILITY) {
          errors.push(
            `Intercompany Payable account ${entry.accountCode} must be of type Liability`,
          );
        }
        if (!account.postingAllowed) {
          errors.push(`Intercompany Payable account ${entry.accountCode} does not allow postings`);
        }
      }
    }
  }

  /**
   * Validates currency consistency across intercompany entries.
   */
  private static validateCurrencyConsistency(
    _command: PostJournalEntryCommand,
    expectedCurrency: string,
    errors: string[],
  ): void {
    // In a real implementation, this would check currency fields on journal lines
    // For now, we'll assume all entries are in the same currency
    if (expectedCurrency && expectedCurrency !== 'MYR') {
      errors.push(`Currency validation not fully implemented - assuming ${expectedCurrency}`);
    }
  }

  /**
   * Creates a mirror journal entry for the counterparty entity.
   * Essential for maintaining intercompany balance reconciliation.
   */
  public static createMirrorJournalEntry(
    originalCommand: PostJournalEntryCommand,
    counterpartyCompanyId: string,
    counterpartyTenantId: string,
  ): PostJournalEntryCommand {
    // Create mirrored entries with swapped debit/credit amounts
    const mirroredEntries = originalCommand.entries.map((entry) => ({
      accountCode: entry.accountCode, // Would be mapped to counterparty's equivalent account
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount,
      currency: entry.currency,
      description: `Mirror: ${entry.description || 'Intercompany entry'}`,
    }));

    return new PostJournalEntryCommand({
      journalEntryId: `mirror-${Date.now()}-${counterpartyCompanyId}`,
      entries: mirroredEntries,
      description: `Intercompany mirror for ${counterpartyCompanyId}`,
      reference: `IC-MIRROR-${originalCommand.reference || 'UNKNOWN'}`,
      postingDate: new Date(),
      tenantId: counterpartyTenantId,
      userId: 'system', // System-generated mirror entry
    });
  }

  /**
   * Validates period-end intercompany reconciliation.
   * Ensures all counterparty balances net to zero.
   */
  public static validatePeriodEndReconciliation(
    _coa: ChartOfAccounts,
    counterpartyBalances: Array<{
      counterpartyId: string;
      receivableBalance: number;
      payableBalance: number;
      currency: string;
    }>,
  ): IntercompanyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const balance of counterpartyBalances) {
      const netPosition = Math.abs(balance.receivableBalance - balance.payableBalance);

      if (netPosition > 0.01) {
        errors.push(
          `Unreconciled intercompany balance for ${balance.counterpartyId}: ` +
            `Receivable ${balance.receivableBalance} ≠ Payable ${balance.payableBalance} ` +
            `(Net: ${balance.receivableBalance - balance.payableBalance})`,
        );
      } else {
        warnings.push(
          `Intercompany balance reconciled for ${balance.counterpartyId} in ${balance.currency}`,
        );
      }
    }

    return {
      isValid: isEmpty(errors),
      errors,
      warnings,
    };
  }
}
