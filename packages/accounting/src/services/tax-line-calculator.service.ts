import {
  type TaxComplianceService,
  type TaxCalculationResult,
  type TaxJurisdiction,
} from './tax-compliance.service';
import { Injectable } from '@nestjs/common';
import { omitUndefined } from '../utils';

export type LineSide = 'DEBIT' | 'CREDIT';
export type Flow = 'SALE' | 'PURCHASE';

export interface TaxableLineInput {
  /** Revenue/expense/other natural line (functional currency amounts) */
  accountCode: string;
  side: LineSide; // net side of this line
  amount: number; // > 0 number (net of tax if isInclusive=false)
  currency: string; // original currency (for precision/inclusive)
  flow: Flow; // SALE for AR invoices; PURCHASE for AP bills
  controlAccountCode: string; // AR/AP control to adjust for tax & WHT
  country: string; // ISO-2 (MY, SG, etc.)
  region?: string;
  itemCategory?: string;
  customerType?: string;
  taxType: string; // e.g., 'VAT'|'GST'|'SST'|'WHT'
  isInclusive?: boolean; // price includes tax?
  date: Date;
}

export interface GeneratedLine {
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  memo?: string;
}

export interface TaxAccountsMap {
  /** Output VAT/GST payable (sales tax liability) */
  outputTaxLiability(country: string, taxCode: string): string;
  /** Input VAT/GST receivable (purchase tax recoverable) */
  inputTaxRecoverable(country: string, taxCode: string): string;
  /** Withholding payable (we withhold from vendor) */
  withholdingPayable(country: string, taxCode: string): string;
  /** Withholding receivable (customer withholds from us) */
  withholdingReceivable(country: string, taxCode: string): string;
}

@Injectable()
export class TaxLineCalculatorService {
  constructor(
    private readonly tax: TaxComplianceService,
    // simple function-map; swap with a more advanced mapper if needed
    private readonly map: TaxAccountsMap,
  ) {}

  /**
   * For each taxable line, compute tax/WHT with TaxComplianceService and emit:
   *  - A tax line (output liability for SALE; input recoverable for PURCHASE)
   *  - A control adjustment line to AR/AP so the document totals reconcile
   *  - Optional WHT lines if any rules are of type 'WHT'
   *
   * Returns ONLY the generated lines; you should post them together with your original lines.
   */
  async buildTaxLines(lines: ReadonlyArray<TaxableLineInput>): Promise<GeneratedLine[]> {
    const out: GeneratedLine[] = [];

    for (const line of lines) {
      // Convert country code to TaxJurisdiction
      const jurisdiction = this.mapCountryToJurisdiction(line.country);

      // Use the existing TaxComplianceService interface
      const res: TaxCalculationResult = this.tax.calculateTax(
        line.amount,
        line.taxType,
        jurisdiction,
        line.currency,
      );

      if (!res.totalTaxAmount || res.totalTaxAmount === 0) continue;

      // Process each tax line from the result
      for (const taxLine of res.taxLines) {
        const taxAmount = taxLine.taxAmount;
        const taxCode = taxLine.taxCode;

        if (line.flow === 'SALE') {
          // Sales: output tax liability (credit); AR control increases (debit)
          const outputAccount = this.map.outputTaxLiability(line.country, taxCode);
          out.push(this.make(line, outputAccount, 0, taxAmount, `Output tax ${taxCode}`));
          out.push(
            this.make(line, line.controlAccountCode, taxAmount, 0, `AR control tax ${taxCode}`),
          );
        } else {
          // Purchase: input tax recoverable (debit); AP control increases (credit)
          const inputAccount = this.map.inputTaxRecoverable(line.country, taxCode);
          out.push(this.make(line, inputAccount, taxAmount, 0, `Input tax ${taxCode}`));
          out.push(
            this.make(line, line.controlAccountCode, 0, taxAmount, `AP control tax ${taxCode}`),
          );
        }
      }
    }

    return out;
  }

  private mapCountryToJurisdiction(country: string): TaxJurisdiction {
    const countryMap = new Map<string, TaxJurisdiction>([
      ['MY', 'MY'],
      ['SG', 'SG'],
      ['VN', 'VN'],
      ['ID', 'ID'],
      ['TH', 'TH'],
      ['PH', 'PH'],
    ]);
    return countryMap.get(country) || 'MY'; // Default to Malaysia
  }

  private make(
    base: TaxableLineInput,
    accountCode: string,
    debit: number,
    credit: number,
    memo?: string,
  ): GeneratedLine {
    // Keep positive numbers; caller preserves sign via debit/credit selection
    return omitUndefined({
      accountCode,
      debitAmount: this.toCentsRound(debit, base.currency),
      creditAmount: this.toCentsRound(credit, base.currency),
      memo,
    });
  }

  private toCentsRound(x: number, currency: string): number {
    const dp = this.decimals(currency);
    const f = Math.pow(10, dp);
    return Math.round((x + Number.EPSILON) * f) / f;
  }

  private decimals(currency: string): number {
    // Reuse MultiCurrencyService decimals if available via global; default 2
    const DECIMALS = new Map([
      ['USD', 2],
      ['EUR', 2],
      ['GBP', 2],
      ['SGD', 2],
      ['MYR', 2],
      ['THB', 2],
      ['IDR', 0],
      ['VND', 0],
      ['PHP', 2],
      ['JPY', 0],
      ['KRW', 0],
    ]);
    return DECIMALS.get(currency) ?? 2;
  }
}
