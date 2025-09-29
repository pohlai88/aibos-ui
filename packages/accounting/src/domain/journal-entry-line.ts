import { Money } from './Money';
import { omitUndefined, isNonEmpty } from '../utils';
import { createValidationError } from '../utils/error-utilities';

// Constants for error messages
const ACCOUNT_CODE_REQUIRED_MESSAGE = 'Account code is required (non-empty string).';
const VALIDATE_JOURNAL_ENTRY_LINE_OPERATION = 'validate-journal-entry-line';

export interface JournalEntryLineProperties {
  readonly accountCode: string;
  readonly description: string;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly reference?: string;
}

export class JournalEntryLine {
  public readonly accountCode: string;
  public readonly description: string;
  /** Back-compat numeric views (major units). */
  public readonly debitAmount: number;
  public readonly creditAmount: number;
  public readonly reference?: string;
  /** Internal bank-grade storage (minor units). */
  private readonly _debit: Money;
  private readonly _credit: Money;

  constructor(properties: JournalEntryLineProperties) {
    // Use omitUndefined to handle exactOptionalPropertyTypes safely
    const cleanProperties = omitUndefined({
      accountCode: properties.accountCode,
      description: properties.description,
      debitAmount: properties.debitAmount,
      creditAmount: properties.creditAmount,
      reference: properties.reference,
    });

    // Assign from cleaned properties
    this.accountCode = cleanProperties.accountCode;
    this.description = cleanProperties.description;
    this.debitAmount = cleanProperties.debitAmount;
    this.creditAmount = cleanProperties.creditAmount;
    this.reference = cleanProperties.reference;

    this.validate();
    // Construct safe Money objects after validation
    this._debit = Money.fromNumber(this.debitAmount);
    this._credit = Money.fromNumber(this.creditAmount);
    Object.freeze(this);
  }

  private validate(): void {
    if (!isNonEmpty(this.accountCode)) {
      throw createValidationError(
        'ACCOUNT_CODE_REQUIRED',
        ACCOUNT_CODE_REQUIRED_MESSAGE,
        this.accountCode,
        { operation: VALIDATE_JOURNAL_ENTRY_LINE_OPERATION }
      );
    }

    if (!isNonEmpty(this.description)) {
      throw createValidationError(
        'DESCRIPTION_REQUIRED',
        'Description is required (non-empty string).',
        this.description,
        { operation: VALIDATE_JOURNAL_ENTRY_LINE_OPERATION }
      );
    }

    if (this.debitAmount < 0) {
      throw createValidationError(
        'NEGATIVE_DEBIT_AMOUNT',
        `Debit amount cannot be negative: ${this.debitAmount}`,
        this.debitAmount.toString(),
        { operation: VALIDATE_JOURNAL_ENTRY_LINE_OPERATION }
      );
    }

    if (this.creditAmount < 0) {
      throw createValidationError(
        'NEGATIVE_CREDIT_AMOUNT',
        `Credit amount cannot be negative: ${this.creditAmount}`,
        this.creditAmount.toString(),
        { operation: VALIDATE_JOURNAL_ENTRY_LINE_OPERATION }
      );
    }

    // Exactly one side must be positive (XOR). Zero values allowed only on the opposite side.
    const hasDebit = this.debitAmount > 0;
    const hasCredit = this.creditAmount > 0;
    if (hasDebit === hasCredit) {
      // both true or both false
      throw createValidationError(
        'INVALID_DEBIT_CREDIT_BALANCE',
        `Exactly one of debit or credit must be > 0 (got debit=${this.debitAmount}, credit=${this.creditAmount}).`,
        `${this.debitAmount},${this.creditAmount}`,
        { operation: VALIDATE_JOURNAL_ENTRY_LINE_OPERATION }
      );
    }

    // Precision enforcement delegated to Money.fromNumber in constructor.
  }

  public getNetAmount(): number {
    // Use minor units to avoid drift, then return as number
    return this._debit.sub(this._credit).toNumber();
  }

  public isDebit(): boolean {
    return this._debit.isPositive();
  }

  public isCredit(): boolean {
    return this._credit.isPositive();
  }

  public getAmount(): number {
    return this.isDebit() ? this._debit.toNumber() : this._credit.toNumber();
  }

  /** Convenience: return absolute amount regardless of side */
  public absoluteAmount(): number {
    return this.isDebit() ? this._debit.abs().toNumber() : this._credit.abs().toNumber();
  }

  /** Convenience: return 'DEBIT' | 'CREDIT' for downstream logic */
  public side(): 'DEBIT' | 'CREDIT' {
    return this.isDebit() ? 'DEBIT' : 'CREDIT';
  }
}
