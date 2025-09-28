// import type { JournalEntryLine } from '../domain/journal-entry-line'; // No longer needed
import { omitUndefined } from '../utils';

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
    if (!isNonEmpty(this.journalEntryId)) {
      throw new Error('Journal entry ID is required');
    }

    if (!this.entries || this.entries.length === 0) {
      throw new Error('Journal entry must have at least one line');
    }

    if (this.entries.length < 2) {
      throw new Error('Journal entry must have at least two lines (double-entry)');
    }

    // Reference and description are optional

    if (!isNonEmpty(this.tenantId)) {
      throw new Error('Tenant ID is required');
    }

    if (!isNonEmpty(this.userId)) {
      throw new Error('User ID is required');
    }

    // Validate each line's shape and numeric constraints
    this.validateLines();
    this.validateDoubleEntry();
    this.validateAccountCodes();
  }

  private validateDoubleEntry(): void {
    // Work in integer cents to avoid FP drift
    const debitCents = this.entries.reduce((sum, entry) => sum + toCents(entry.debitAmount), 0);
    const creditCents = this.entries.reduce((sum, entry) => sum + toCents(entry.creditAmount), 0);

    if (debitCents !== creditCents) {
      const d = (debitCents / 100).toFixed(2);
      const c = (creditCents / 100).toFixed(2);
      const diff = (Math.abs(debitCents - creditCents) / 100).toFixed(2);
      throw new Error(
        `Journal entry is not balanced. Debit: ${d}, Credit: ${c}, Difference: ${diff}`,
      );
    }

    if (debitCents === 0 && creditCents === 0) {
      throw new Error('Journal entry totals cannot both be zero');
    }

    // Ensure there is at least one debit and one credit line
    const hasDebit = this.entries.some((entry) => toCents(entry.debitAmount) > 0);
    const hasCredit = this.entries.some((entry) => toCents(entry.creditAmount) > 0);
    if (!hasDebit || !hasCredit) {
      throw new Error('Journal entry must include at least one debit line and one credit line');
    }
  }

  private validateLines(): void {
    for (const [index, entry] of this.entries.entries()) {
      if (!isNonEmpty(entry.accountCode)) {
        throw new Error(`Line ${index + 1}: Account code is required`);
      }
      // Exactly one side > 0 (one-sided rule)
      const d = toCents(entry.debitAmount);
      const c = toCents(entry.creditAmount);
      if (d < 0 || c < 0) {
        throw new Error(`Line ${index + 1}: Amounts cannot be negative`);
      }
      if (!isMaxTwoDecimals(entry.debitAmount) || !isMaxTwoDecimals(entry.creditAmount)) {
        throw new Error(`Line ${index + 1}: Amounts must have at most two decimal places`);
      }
      const hasDebit = d > 0;
      const hasCredit = c > 0;
      if (hasDebit === hasCredit) {
        throw new Error(`Line ${index + 1}: Provide either debit OR credit, not both or neither`);
      }
    }
  }

  private validateAccountCodes(): void {
    const accountCodes = new Set<string>();
    const duplicateCodes: string[] = [];

    for (const entry of this.entries) {
      if (accountCodes.has(entry.accountCode)) {
        duplicateCodes.push(entry.accountCode);
      }
      accountCodes.add(entry.accountCode);
    }

    if (duplicateCodes.length > 0) {
      // Policy note: Some ledgers allow duplicates for dimensional splits.
      // If that is desired, relax this guard.
      throw new Error(`Duplicate account codes found: ${duplicateCodes.join(', ')}`);
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
function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function toCents(value: number): number {
  if (!Number.isFinite(value)) return NaN as unknown as number; // Will trip validations above
  return Math.round(value * 100);
}

function isMaxTwoDecimals(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  // e.g., 10.123 -> false
  return Math.round(value * 100) === value * 100;
}
