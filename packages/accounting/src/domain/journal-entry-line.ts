import { Money } from './Money';
import { omitUndefined } from '../utils';

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
    if (!this.accountCode || this.accountCode.trim().length === 0) {
      throw new Error('Account code is required (non-empty string).');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Description is required (non-empty string).');
    }

    if (this.debitAmount < 0) {
      throw new Error(`Debit amount cannot be negative: ${this.debitAmount}`);
    }

    if (this.creditAmount < 0) {
      throw new Error(`Credit amount cannot be negative: ${this.creditAmount}`);
    }

    // Exactly one side must be positive (XOR). Zero values allowed only on the opposite side.
    const hasDebit = this.debitAmount > 0;
    const hasCredit = this.creditAmount > 0;
    if (hasDebit === hasCredit) {
      // both true or both false
      throw new Error(
        `Exactly one of debit or credit must be > 0 (got debit=${this.debitAmount}, credit=${this.creditAmount}).`,
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
