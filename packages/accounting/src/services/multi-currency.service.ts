import { type ExchangeRateService } from './exchange-rate.service';
import { getCurrencyDecimalsStrict, isValidCurrency, round2HalfUp } from '../utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MultiCurrencyService {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  // Removed manual DECIMALS mapping - now using getCurrencyDecimalsStrict() utility

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
  ): Promise<number> {
    // Validate currencies first
    if (!isValidCurrency(fromCurrency)) {
      throw new Error(`Invalid from currency: ${fromCurrency}`);
    }
    if (!isValidCurrency(toCurrency)) {
      throw new Error(`Invalid to currency: ${toCurrency}`);
    }
    
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const exchangeRate = await this.exchangeRateService.getExchangeRate(
      fromCurrency,
      toCurrency,
      date,
    );

    return this.roundCurrency(amount * exchangeRate, toCurrency);
  }

  async convertJournalEntry(
    entries: ReadonlyArray<{
      accountCode: string;
      currency: string;
      debitAmount: number;
      creditAmount: number;
    }>,
    targetCurrency: string,
    date?: Date,
  ): Promise<
    Array<{
      accountCode: string;
      originalCurrency: string;
      originalDebitAmount: number;
      originalCreditAmount: number;
      currency: string;
      debitAmount: number;
      creditAmount: number;
    }>
  > {
    const convertedEntries: Array<{
      accountCode: string;
      originalCurrency: string;
      originalDebitAmount: number;
      originalCreditAmount: number;
      currency: string;
      debitAmount: number;
      creditAmount: number;
    }> = [];

    for (const entry of entries) {
      const convertedDebit =
        (entry.debitAmount ?? 0) > 0
          ? await this.convertAmount(entry.debitAmount ?? 0, entry.currency, targetCurrency, date)
          : 0;

      const convertedCredit =
        (entry.creditAmount ?? 0) > 0
          ? await this.convertAmount(entry.creditAmount ?? 0, entry.currency, targetCurrency, date)
          : 0;

      convertedEntries.push({
        ...entry,
        originalCurrency: entry.currency,
        originalDebitAmount: entry.debitAmount,
        originalCreditAmount: entry.creditAmount,
        currency: targetCurrency,
        debitAmount: convertedDebit,
        creditAmount: convertedCredit,
      });
    }

    // Ensure rounding preserves JE balance equality in target currency
    return this.rebalanceForRounding(convertedEntries, targetCurrency);
  }

  private roundCurrency(amount: number, currency: string): number {
    // Use our precise rounding utility instead of manual Math.round
    const decimals = this.getCurrencyDecimalPlaces(currency);
    return round2HalfUp(amount, decimals);
  }

  private getCurrencyDecimalPlaces(currency: string): number {
    // Validate currency first
    if (!isValidCurrency(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }
    
    // Use our centralized utility instead of manual mapping
    return getCurrencyDecimalsStrict(currency);
  }

  /**
   * Distribute any rounding residue to the largest-magnitude line
   * to keep total debits == total credits in target currency.
   */
  private rebalanceForRounding<T extends { debitAmount: number; creditAmount: number }>(
    lines: T[],
    currency: string,
  ): T[] {
    const dp = this.getCurrencyDecimalPlaces(currency);
    const factor = Math.pow(10, dp);
    const totalDebit = lines.reduce((s, l) => s + l.debitAmount, 0);
    const totalCredit = lines.reduce((s, l) => s + l.creditAmount, 0);
    const diff = Math.round(totalDebit * factor) - Math.round(totalCredit * factor);
    if (diff === 0) return lines;

    // Pick line with largest absolute amount on the side that needs adjustment
    if (diff > 0) {
      // debits > credits → bump a credit
      let index = -1;
      let maxAbs = -1;
      for (let index_ = 0; index_ < lines.length; index_++) {
        const amt = lines[index_]?.creditAmount ?? 0;
        if (Math.abs(amt) > maxAbs) {
          maxAbs = Math.abs(amt);
          index = index_;
        }
      }

      if (index >= 0 && lines[index]) {
        lines[index]!.creditAmount =
          (Math.round(lines[index]!.creditAmount * factor) + diff) / factor;
      }
    } else {
      // credits > debits → bump a debit
      let index = -1;
      let maxAbs = -1;
      for (let index_ = 0; index_ < lines.length; index_++) {
        const amt = lines[index_]?.debitAmount ?? 0;
        if (Math.abs(amt) > maxAbs) {
          maxAbs = Math.abs(amt);
          index = index_;
        }
      }

      if (index >= 0 && lines[index]) {
        lines[index]!.debitAmount =
          (Math.round(lines[index]!.debitAmount * factor) + Math.abs(diff)) / factor;
      }
    }
    return lines;
  }
}
