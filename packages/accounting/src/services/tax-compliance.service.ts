// safeGet import removed as it's not used
/**
 * Tax Compliance Service for Malaysian SST and SEA Markets
 *
 * Provides comprehensive tax compliance support for:
 * - Malaysia: SST (Sales and Service Tax)
 * - Singapore: GST (Goods and Services Tax)
 * - Vietnam: VAT (Value Added Tax)
 * - Indonesia: PPN (Pajak Pertambahan Nilai)
 * - Thailand: VAT (Value Added Tax)
 * - Philippines: VAT (Value Added Tax)
 */

export type TaxJurisdiction = 'MY' | 'SG' | 'VN' | 'ID' | 'TH' | 'PH';

export type TaxType = 'INPUT' | 'OUTPUT' | 'REVERSE_CHARGE';

export interface TaxCode {
  code: string;
  name: string;
  rate: number; // Percentage as decimal (0.06 for 6%)
  jurisdiction: TaxJurisdiction;
  taxType: TaxType;
  isRecoverable: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  description?: string;
}

export interface TaxLine {
  taxCode: string;
  taxAmount: number;
  jurisdiction: TaxJurisdiction;
  isRecoverable: boolean;
  taxType: TaxType;
  taxableAmount: number;
  description?: string;
}

export interface TaxCalculationResult {
  taxLines: TaxLine[];
  totalTaxAmount: number;
  totalTaxableAmount: number;
  totalRecoverableTax: number;
  totalNonRecoverableTax: number;
  jurisdiction: TaxJurisdiction;
  currency: string;
}

export interface TaxComplianceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class TaxComplianceService {
  private readonly taxCodes: Map<string, TaxCode> = new Map();

  // Constants for tax code prefixes
  private static readonly SST_PREFIX = 'SST-';
  private static readonly GST_PREFIX = 'GST-';
  private static readonly VAT_PREFIX = 'VAT-';
  private static readonly PPN_PREFIX = 'PPN-';
  private static readonly RECOVERABLE_WARNING = 'is generally recoverable for';
  private static readonly BUSINESS_REGISTRATION = 'businesses';

  // Constants for common dates and descriptions
  private static readonly SST_EFFECTIVE_DATE = '2018-09-01';
  private static readonly GST_EFFECTIVE_DATE = '2007-07-01';
  private static readonly MALAYSIAN_SST_DESCRIPTION = 'Malaysian Sales and Service Tax at';
  private static readonly SINGAPORE_GST_DESCRIPTION = 'Singapore Goods and Services Tax at';
  private static readonly PERCENTAGE_SYMBOL = '%';

  constructor() {
    this.initializeTaxCodes();
  }

  /**
   * Calculate tax for a journal entry line
   */
  calculateTax(
    taxableAmount: number,
    taxCode: string,
    jurisdiction: TaxJurisdiction,
    currency: string = 'MYR',
  ): TaxCalculationResult {
    const taxCodeInfo = this.getTaxCode(taxCode, jurisdiction);
    if (!taxCodeInfo) {
      throw new Error(`Tax code ${taxCode} not found for jurisdiction ${jurisdiction}`);
    }

    const taxAmount = taxableAmount * taxCodeInfo.rate;
    const taxLine: TaxLine = {
      taxCode,
      taxAmount,
      jurisdiction,
      isRecoverable: taxCodeInfo.isRecoverable,
      taxType: taxCodeInfo.taxType,
      taxableAmount,
      description: taxCodeInfo.description ?? '',
    };

    return {
      taxLines: [taxLine],
      totalTaxAmount: taxAmount,
      totalTaxableAmount: taxableAmount,
      totalRecoverableTax: taxCodeInfo.isRecoverable ? taxAmount : 0,
      totalNonRecoverableTax: taxCodeInfo.isRecoverable ? 0 : taxAmount,
      jurisdiction,
      currency,
    };
  }

  /**
   * Calculate tax for multiple journal entry lines
   */
  calculateTaxForLines(
    lines: Array<{
      taxableAmount: number;
      taxCode: string;
      jurisdiction: TaxJurisdiction;
    }>,
    currency: string = 'MYR',
  ): TaxCalculationResult {
    const allTaxLines: TaxLine[] = [];
    let totalTaxAmount = 0;
    let totalTaxableAmount = 0;
    let totalRecoverableTax = 0;
    let totalNonRecoverableTax = 0;

    for (const line of lines) {
      const result = this.calculateTax(
        line.taxableAmount,
        line.taxCode,
        line.jurisdiction,
        currency,
      );
      allTaxLines.push(...result.taxLines);
      totalTaxAmount += result.totalTaxAmount;
      totalTaxableAmount += result.totalTaxableAmount;
      totalRecoverableTax += result.totalRecoverableTax;
      totalNonRecoverableTax += result.totalNonRecoverableTax;
    }

    return {
      taxLines: allTaxLines,
      totalTaxAmount,
      totalTaxableAmount,
      totalRecoverableTax,
      totalNonRecoverableTax,
      jurisdiction: lines[0]?.jurisdiction ?? 'MY',
      currency,
    };
  }

  /**
   * Validate tax compliance for a journal entry
   */
  validateTaxCompliance(
    taxLines: TaxLine[],
    jurisdiction: TaxJurisdiction,
  ): TaxComplianceValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate tax lines
    for (const [index, taxLine] of taxLines.entries()) {
      const taxCodeInfo = this.getTaxCode(taxLine.taxCode, taxLine.jurisdiction);
      if (!taxCodeInfo) {
        errors.push(
          `Tax code ${taxLine.taxCode} not found for jurisdiction ${taxLine.jurisdiction}`,
        );
        continue;
      }

      // Validate jurisdiction consistency
      if (taxLine.jurisdiction !== jurisdiction) {
        errors.push(
          `Tax line ${index} jurisdiction ${taxLine.jurisdiction} does not match entry jurisdiction ${jurisdiction}`,
        );
      }

      // Validate tax amount calculation
      const expectedTaxAmount = taxLine.taxableAmount * taxCodeInfo.rate;
      if (Math.abs(taxLine.taxAmount - expectedTaxAmount) > 0.01) {
        errors.push(
          `Tax line ${index} amount ${taxLine.taxAmount} does not match calculated amount ${expectedTaxAmount}`,
        );
      }

      // Validate tax type consistency
      if (taxLine.taxType !== taxCodeInfo.taxType) {
        errors.push(
          `Tax line ${index} type ${taxLine.taxType} does not match tax code type ${taxCodeInfo.taxType}`,
        );
      }

      // Validate recoverability
      if (taxLine.isRecoverable !== taxCodeInfo.isRecoverable) {
        warnings.push(
          `Tax line ${index} recoverability ${taxLine.isRecoverable} does not match tax code ${taxCodeInfo.isRecoverable}`,
        );
      }
    }

    // Jurisdiction-specific validations
    this.validateJurisdictionSpecificRules(taxLines, jurisdiction, errors, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Get available tax codes for a jurisdiction
   */
  getTaxCodesForJurisdiction(jurisdiction: TaxJurisdiction): TaxCode[] {
    return Array.from(this.taxCodes.values()).filter(
      (code) => code.jurisdiction === jurisdiction && this.isTaxCodeActive(code),
    );
  }

  /**
   * Get tax code information
   */
  getTaxCode(taxCode: string, jurisdiction: TaxJurisdiction): TaxCode | undefined {
    const key = `${jurisdiction}-${taxCode}`;
    const code = this.taxCodes.get(key);
    return code && this.isTaxCodeActive(code) ? code : undefined;
  }

  /**
   * Check if a tax code is active
   */
  private isTaxCodeActive(taxCode: TaxCode): boolean {
    const now = new Date();
    return taxCode.effectiveFrom <= now && (!taxCode.effectiveTo || taxCode.effectiveTo >= now);
  }

  /**
   * Initialize tax codes for all supported jurisdictions
   */
  private initializeTaxCodes(): void {
    // Malaysia SST (Sales and Service Tax)
    this.addTaxCode({
      code: 'SST-6%',
      name: 'Sales and Service Tax 6%',
      rate: 0.06,
      jurisdiction: 'MY',
      taxType: 'OUTPUT',
      isRecoverable: false,
      effectiveFrom: new Date(TaxComplianceService.SST_EFFECTIVE_DATE),
      description: `${TaxComplianceService.MALAYSIAN_SST_DESCRIPTION} 6${TaxComplianceService.PERCENTAGE_SYMBOL}`,
    });

    this.addTaxCode({
      code: 'SST-10%',
      name: 'Sales and Service Tax 10%',
      rate: 0.1,
      jurisdiction: 'MY',
      taxType: 'OUTPUT',
      isRecoverable: false,
      effectiveFrom: new Date(TaxComplianceService.SST_EFFECTIVE_DATE),
      description: `${TaxComplianceService.MALAYSIAN_SST_DESCRIPTION} 10${TaxComplianceService.PERCENTAGE_SYMBOL}`,
    });

    // Singapore GST (Goods and Services Tax)
    this.addTaxCode({
      code: 'GST-7%',
      name: 'Goods and Services Tax 7%',
      rate: 0.07,
      jurisdiction: 'SG',
      taxType: 'OUTPUT',
      isRecoverable: true,
      effectiveFrom: new Date(TaxComplianceService.GST_EFFECTIVE_DATE),
      description: `${TaxComplianceService.SINGAPORE_GST_DESCRIPTION} 7${TaxComplianceService.PERCENTAGE_SYMBOL}`,
    });

    this.addTaxCode({
      code: 'GST-0%',
      name: 'Goods and Services Tax 0%',
      rate: 0.0,
      jurisdiction: 'SG',
      taxType: 'OUTPUT',
      isRecoverable: true,
      effectiveFrom: new Date(TaxComplianceService.GST_EFFECTIVE_DATE),
      description: 'Singapore GST Zero Rate',
    });

    // Vietnam VAT (Value Added Tax)
    this.addTaxCode({
      code: 'VAT-10%',
      name: 'Value Added Tax 10%',
      rate: 0.1,
      jurisdiction: 'VN',
      taxType: 'OUTPUT',
      isRecoverable: true,
      effectiveFrom: new Date('1999-01-01'),
      description: 'Vietnam Value Added Tax at 10%',
    });

    this.addTaxCode({
      code: 'VAT-5%',
      name: 'Value Added Tax 5%',
      rate: 0.05,
      jurisdiction: 'VN',
      taxType: 'OUTPUT',
      isRecoverable: true,
      effectiveFrom: new Date('1999-01-01'),
      description: 'Vietnam Value Added Tax at 5%',
    });

    // Indonesia PPN (Pajak Pertambahan Nilai)
    this.addTaxCode({
      code: 'PPN-11%',
      name: 'Pajak Pertambahan Nilai 11%',
      rate: 0.11,
      jurisdiction: 'ID',
      taxType: 'OUTPUT',
      isRecoverable: true,
      effectiveFrom: new Date('2022-04-01'),
      description: 'Indonesia PPN at 11%',
    });

    // Thailand VAT (Value Added Tax)
    this.addTaxCode({
      code: 'VAT-7%',
      name: 'Value Added Tax 7%',
      rate: 0.07,
      jurisdiction: 'TH',
      taxType: 'OUTPUT',
      isRecoverable: true,
      effectiveFrom: new Date('1992-01-01'),
      description: 'Thailand Value Added Tax at 7%',
    });

    // Philippines VAT (Value Added Tax)
    this.addTaxCode({
      code: 'VAT-12%',
      name: 'Value Added Tax 12%',
      rate: 0.12,
      jurisdiction: 'PH',
      taxType: 'OUTPUT',
      isRecoverable: true,
      effectiveFrom: new Date('1988-01-01'),
      description: 'Philippines Value Added Tax at 12%',
    });

    // Input tax codes (for purchases)
    this.addTaxCode({
      code: 'INPUT-SST-6%',
      name: 'Input Sales and Service Tax 6%',
      rate: 0.06,
      jurisdiction: 'MY',
      taxType: 'INPUT',
      isRecoverable: true,
      effectiveFrom: new Date(TaxComplianceService.SST_EFFECTIVE_DATE),
      description: 'Malaysian Input SST at 6%',
    });

    this.addTaxCode({
      code: 'INPUT-GST-7%',
      name: 'Input Goods and Services Tax 7%',
      rate: 0.07,
      jurisdiction: 'SG',
      taxType: 'INPUT',
      isRecoverable: true,
      effectiveFrom: new Date(TaxComplianceService.GST_EFFECTIVE_DATE),
      description: 'Singapore Input GST at 7%',
    });

    // Reverse charge codes
    this.addTaxCode({
      code: 'RC-SST-6%',
      name: 'Reverse Charge SST 6%',
      rate: 0.06,
      jurisdiction: 'MY',
      taxType: 'REVERSE_CHARGE',
      isRecoverable: true,
      effectiveFrom: new Date(TaxComplianceService.SST_EFFECTIVE_DATE),
      description: 'Malaysian Reverse Charge SST at 6%',
    });
  }

  /**
   * Add a tax code to the service
   */
  private addTaxCode(taxCode: TaxCode): void {
    const key = `${taxCode.jurisdiction}-${taxCode.code}`;
    this.taxCodes.set(key, taxCode);
  }

  /**
   * Validate jurisdiction-specific tax rules
   */
  private validateJurisdictionSpecificRules(
    taxLines: TaxLine[],
    jurisdiction: TaxJurisdiction,
    errors: string[],
    warnings: string[],
    suggestions: string[],
  ): void {
    switch (jurisdiction) {
      case 'MY':
        this.validateMalaysianTaxRules(taxLines, errors, warnings, suggestions);
        break;
      case 'SG':
        this.validateSingaporeTaxRules(taxLines, errors, warnings, suggestions);
        break;
      case 'VN':
        this.validateVietnamTaxRules(taxLines, errors, warnings, suggestions);
        break;
      case 'ID':
        this.validateIndonesiaTaxRules(taxLines, errors, warnings, suggestions);
        break;
      case 'TH':
        this.validateThailandTaxRules(taxLines, errors, warnings, suggestions);
        break;
      case 'PH':
        this.validatePhilippinesTaxRules(taxLines, errors, warnings, suggestions);
        break;
    }
  }

  /**
   * Validate Malaysian SST rules
   */
  private validateMalaysianTaxRules(
    taxLines: TaxLine[],
    errors: string[],
    warnings: string[],
    _suggestions: string[],
  ): void {
    // SST is not recoverable for most businesses
    const sstLines = taxLines.filter((line) =>
      line.taxCode.startsWith(TaxComplianceService.SST_PREFIX),
    );
    const recoverableSstLines = sstLines.filter((line) => line.isRecoverable);

    if (recoverableSstLines.length > 0) {
      warnings.push(
        'SST is generally not recoverable in Malaysia. Verify business registration status.',
      );
    }

    // Check for mixed tax types
    const hasOutput = taxLines.some((line) => line.taxType === 'OUTPUT');
    const hasInput = taxLines.some((line) => line.taxType === 'INPUT');

    if (hasOutput && hasInput) {
      _suggestions.push(
        'Consider separating input and output tax entries for better compliance tracking.',
      );
    }
  }

  /**
   * Validate Singapore GST rules
   */
  private validateSingaporeTaxRules(
    taxLines: TaxLine[],
    errors: string[],
    warnings: string[],
    _suggestions: string[],
  ): void {
    // GST is generally recoverable for GST-registered businesses
    const gstLines = taxLines.filter((line) =>
      line.taxCode.startsWith(TaxComplianceService.GST_PREFIX),
    );
    const nonRecoverableGstLines = gstLines.filter((line) => !line.isRecoverable);

    if (nonRecoverableGstLines.length > 0) {
      warnings.push(
        `GST ${TaxComplianceService.RECOVERABLE_WARNING} GST-registered ${TaxComplianceService.BUSINESS_REGISTRATION} in Singapore.`,
      );
    }
  }

  /**
   * Validate Vietnam VAT rules
   */
  private validateVietnamTaxRules(
    taxLines: TaxLine[],
    errors: string[],
    warnings: string[],
    _suggestions: string[],
  ): void {
    // VAT is recoverable for VAT-registered businesses
    const vatLines = taxLines.filter((line) =>
      line.taxCode.startsWith(TaxComplianceService.VAT_PREFIX),
    );
    const nonRecoverableVatLines = vatLines.filter((line) => !line.isRecoverable);

    if (nonRecoverableVatLines.length > 0) {
      warnings.push(
        `VAT ${TaxComplianceService.RECOVERABLE_WARNING} VAT-registered ${TaxComplianceService.BUSINESS_REGISTRATION} in Vietnam.`,
      );
    }
  }

  /**
   * Validate Indonesia PPN rules
   */
  private validateIndonesiaTaxRules(
    taxLines: TaxLine[],
    errors: string[],
    warnings: string[],
    _suggestions: string[],
  ): void {
    // PPN is recoverable for PKP (Pengusaha Kena Pajak) businesses
    const ppnLines = taxLines.filter((line) =>
      line.taxCode.startsWith(TaxComplianceService.PPN_PREFIX),
    );
    const nonRecoverablePpnLines = ppnLines.filter((line) => !line.isRecoverable);

    if (nonRecoverablePpnLines.length > 0) {
      warnings.push(
        `PPN ${TaxComplianceService.RECOVERABLE_WARNING} PKP-registered ${TaxComplianceService.BUSINESS_REGISTRATION} in Indonesia.`,
      );
    }
  }

  /**
   * Validate Thailand VAT rules
   */
  private validateThailandTaxRules(
    taxLines: TaxLine[],
    errors: string[],
    warnings: string[],
    _suggestions: string[],
  ): void {
    // VAT is recoverable for VAT-registered businesses
    const vatLines = taxLines.filter((line) =>
      line.taxCode.startsWith(TaxComplianceService.VAT_PREFIX),
    );
    const nonRecoverableVatLines = vatLines.filter((line) => !line.isRecoverable);

    if (nonRecoverableVatLines.length > 0) {
      warnings.push(
        `VAT ${TaxComplianceService.RECOVERABLE_WARNING} VAT-registered ${TaxComplianceService.BUSINESS_REGISTRATION} in Thailand.`,
      );
    }
  }

  /**
   * Validate Philippines VAT rules
   */
  private validatePhilippinesTaxRules(
    taxLines: TaxLine[],
    errors: string[],
    warnings: string[],
    _suggestions: string[],
  ): void {
    // VAT is recoverable for VAT-registered businesses
    const vatLines = taxLines.filter((line) =>
      line.taxCode.startsWith(TaxComplianceService.VAT_PREFIX),
    );
    const nonRecoverableVatLines = vatLines.filter((line) => !line.isRecoverable);

    if (nonRecoverableVatLines.length > 0) {
      warnings.push(
        `VAT ${TaxComplianceService.RECOVERABLE_WARNING} VAT-registered ${TaxComplianceService.BUSINESS_REGISTRATION} in the Philippines.`,
      );
    }
  }
}
