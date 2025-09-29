// import type { JournalEntryLine } from '../domain/journal-entry-line'; // No longer needed
import { omitUndefined, roundAmount, toMinorUnits, isEmpty, isNonEmpty, hasItems } from '../utils';
import { 
  createValidationError, 
  createBusinessError,
  type ErrorContext 
} from '../utils/error-utilities';

export interface PostJournalEntryCommandProperties {
  readonly journalEntryId: string;
  readonly entries: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    description?: string;
  }>;
  readonly reference?: string;
  readonly description?: string;
  readonly postingDate: Date;
  readonly tenantId: string;
  readonly userId: string;
  readonly baseCurrency?: string;
}

export class PostJournalEntryCommand {
  public readonly journalEntryId: string;
  public readonly entries: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    description?: string;
  }>;
  public readonly reference?: string;
  public readonly description?: string;
  public readonly postingDate: Date;
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly baseCurrency?: string;

  constructor(properties: PostJournalEntryCommandProperties) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanProperties = omitUndefined({
      journalEntryId: properties.journalEntryId?.trim(),
      entries: [...properties.entries],
      reference: properties.reference?.trim(),
      description: properties.description?.trim(),
      postingDate: properties.postingDate,
      tenantId: properties.tenantId?.trim(),
      userId: properties.userId?.trim(),
      baseCurrency: properties.baseCurrency?.trim(),
    });

    // Assign from cleaned properties
    this.journalEntryId = cleanProperties.journalEntryId;
    this.entries = cleanProperties.entries;
    this.reference = cleanProperties.reference;
    this.description = cleanProperties.description;
    this.postingDate = cleanProperties.postingDate;
    this.tenantId = cleanProperties.tenantId;
    this.userId = cleanProperties.userId;
    this.baseCurrency = cleanProperties.baseCurrency;

    this.validate();
    // Freeze array to avoid mutation after construction (lines themselves should be treated immutable at source)
    Object.freeze(this.entries);
    Object.freeze(this);
  }

  private validate(): void {
    const context: ErrorContext = {
      operation: 'post-journal-entry-validation',
      userId: this.userId,
      tenantId: this.tenantId,
      data: { journalEntryId: this.journalEntryId, entryCount: this.entries.length }
    };

    if (!isNonEmpty(this.journalEntryId)) {
      throw createValidationError('journalEntryId', 'Journal entry ID is required', this.journalEntryId, context);
    }

    if (isEmpty(this.entries)) {
      throw createValidationError('entries', 'Journal entry must have at least one line', this.entries, context);
    }

    if (this.entries.length < 2) {
      throw createBusinessError(
        'INSUFFICIENT_ENTRIES',
        'Journal entry must have at least two lines (double-entry)',
        'PostJournalEntryCommand',
        context
      );
    }

    // Reference and description are optional

    if (!isNonEmpty(this.tenantId)) {
      throw createValidationError('tenantId', 'Tenant ID is required', this.tenantId, context);
    }

    if (!isNonEmpty(this.userId)) {
      throw createValidationError('userId', 'User ID is required', this.userId, context);
    }

    // Validate each line's shape and numeric constraints
    this.validateLines();
    this.validateDoubleEntry();
    this.validateAccountCodes();
  }

  private validateDoubleEntry(): void {
    const context: ErrorContext = {
      operation: 'post-journal-entry-double-entry-validation',
      userId: this.userId,
      tenantId: this.tenantId,
      data: { journalEntryId: this.journalEntryId }
    };

    // Work in integer cents to avoid FP drift
    const debitCents = this.entries.reduce((sum, entry) => sum + toCents(entry.debitAmount), 0);
    const creditCents = this.entries.reduce((sum, entry) => sum + toCents(entry.creditAmount), 0);

    if (debitCents !== creditCents) {
      const d = roundAmount(debitCents / 100, 2);
      const c = roundAmount(creditCents / 100, 2);
      const diff = roundAmount(Math.abs(debitCents - creditCents) / 100, 2);
      throw createBusinessError(
        'UNBALANCED_ENTRY',
        `Journal entry is not balanced. Debit: ${d}, Credit: ${c}, Difference: ${diff}`,
        'PostJournalEntryCommand',
        context
      );
    }

    if (debitCents === 0 && creditCents === 0) {
      throw createBusinessError(
        'ZERO_TOTALS',
        'Journal entry totals cannot both be zero',
        'PostJournalEntryCommand',
        context
      );
    }

    // Ensure there is at least one debit and one credit line
    const hasDebit = this.entries.some((entry) => toCents(entry.debitAmount) > 0);
    const hasCredit = this.entries.some((entry) => toCents(entry.creditAmount) > 0);
    if (!hasDebit || !hasCredit) {
      throw createBusinessError(
        'MISSING_DEBIT_OR_CREDIT',
        'Journal entry must include at least one debit line and one credit line',
        'PostJournalEntryCommand',
        context
      );
    }
  }

  private validateLines(): void {
    for (const [index, entry] of this.entries.entries()) {
      const lineContext: ErrorContext = {
        operation: 'post-journal-entry-line-validation',
        userId: this.userId,
        tenantId: this.tenantId,
        data: { journalEntryId: this.journalEntryId, lineIndex: index, entry }
      };

      if (!isNonEmpty(entry.accountCode)) {
        throw createValidationError(
          `entries[${index}].accountCode`,
          'Account code is required',
          entry.accountCode,
          lineContext
        );
      }

      // Exactly one side > 0 (one-sided rule)
      const d = toCents(entry.debitAmount);
      const c = toCents(entry.creditAmount);
      if (d < 0 || c < 0) {
        throw createValidationError(
          `entries[${index}].amounts`,
          'Amounts cannot be negative',
          { debitAmount: entry.debitAmount, creditAmount: entry.creditAmount },
          lineContext
        );
      }

      if (!isMaxTwoDecimals(entry.debitAmount) || !isMaxTwoDecimals(entry.creditAmount)) {
        throw createValidationError(
          `entries[${index}].amounts`,
          'Amounts must have at most two decimal places',
          { debitAmount: entry.debitAmount, creditAmount: entry.creditAmount },
          lineContext
        );
      }

      const hasDebit = d > 0;
      const hasCredit = c > 0;
      if (hasDebit === hasCredit) {
        throw createBusinessError(
          'INVALID_ENTRY_SIDES',
          `Line ${index + 1}: Provide either debit OR credit, not both or neither`,
          'PostJournalEntryCommand',
          lineContext
        );
      }
    }
  }

  private validateAccountCodes(): void {
    const context: ErrorContext = {
      operation: 'post-journal-entry-account-codes-validation',
      userId: this.userId,
      tenantId: this.tenantId,
      data: { journalEntryId: this.journalEntryId }
    };

    const accountCodes = new Set<string>();
    const duplicateCodes: string[] = [];

    for (const entry of this.entries) {
      if (accountCodes.has(entry.accountCode)) {
        duplicateCodes.push(entry.accountCode);
      }
      accountCodes.add(entry.accountCode);
    }

    if (hasItems(duplicateCodes)) {
      // Policy note: Some ledgers allow duplicates for dimensional splits.
      // If that is desired, relax this guard.
      throw createBusinessError(
        'DUPLICATE_ACCOUNT_CODES',
        `Duplicate account codes found: ${duplicateCodes.join(', ')}`,
        'PostJournalEntryCommand',
        context
      );
    }
  }

  public getTotalDebit(): number {
    const cents = this.entries.reduce((sum, entry) => sum + toCents(entry.debitAmount), 0);
    return cents / 100;
  }

  public getTotalCredit(): number {
    const cents = this.entries.reduce((sum, entry) => sum + toCents(entry.creditAmount), 0);
    return cents / 100;
  }

  public getAccountCodes(): string[] {
    return this.entries.map((entry) => entry.accountCode);
  }
}

// ---- Local helpers ----
function toCents(value: number): number {
  if (!Number.isFinite(value)) return NaN as unknown as number; // Will trip validations above
  return toMinorUnits(value, 2);
}

function isMaxTwoDecimals(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  // e.g., 10.123 -> false
  return Math.round(value * 100) === value * 100;
}
