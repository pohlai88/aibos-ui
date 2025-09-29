/**
 * Withholding Tax Calculations - SSOT Implementation
 * 
 * Calculation logic for withholding tax operations.
 * Imports from withholding-tax-types.ts and money-helpers.ts for consistency.
 */

import type { 
  WithholdingTaxRule,
  GrossUpResult,
  WithholdingResult,
  WithholdingBreakdown,
  GrossUpOptions,
  WithholdingOptions
} from './withholding-tax-types-utilities';
import { 
  type SupportedCurrency,
  roundToCurrency
} from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { createValidationIssue, createBusinessValidationResult } from './policies/validation-policy';

// ============================================================================
// WITHHOLDING TAX CALCULATOR
// ============================================================================

export class WithholdingTaxCalculator {
  /**
   * Calculate withholding tax
   */
  static calculateWithholding(
    grossAmount: number,
    rule: WithholdingTaxRule,
    options: WithholdingOptions = {}
  ): WithholdingResult {
    const currency = options.currency ?? 'MYR';
    
    // Validate amount is within rule limits
    if (grossAmount < rule.minimumAmount || grossAmount > rule.maximumAmount) {
      throw new Error(`Amount ${grossAmount} is outside rule limits (${rule.minimumAmount} - ${rule.maximumAmount})`);
    }
    
    const withholdingTax = roundToCurrency(grossAmount * rule.rate, currency);
    const netAmount = roundToCurrency(grossAmount - withholdingTax, currency);
    
    return {
      grossAmount: roundToCurrency(grossAmount, currency),
      withholdingTax,
      netAmount,
      withholdingRate: rule.rate,
      applicableRule: rule,
      jurisdiction: rule.jurisdiction
    };
  }

  /**
   * Calculate gross-up amount
   */
  static calculateGrossUp(
    netAmount: number,
    rule: WithholdingTaxRule,
    options: GrossUpOptions = {}
  ): GrossUpResult {
    const method = options.method ?? 'STANDARD';
    const currency = options.currency ?? 'MYR';
    
    let grossAmount: number;
    let grossUpFactor: number;
    
    switch (method) {
      case 'STANDARD':
        grossUpFactor = 1 / (1 - rule.rate);
        grossAmount = roundToCurrency(netAmount * grossUpFactor, currency);
        break;
        
      case 'REVERSE':
        grossUpFactor = 1 + rule.rate;
        grossAmount = roundToCurrency(netAmount * grossUpFactor, currency);
        break;
        
      case 'COMPOUND':
        grossUpFactor = 1 / (1 - rule.rate);
        grossAmount = roundToCurrency(netAmount * grossUpFactor, currency);
        break;
        
      case 'SIMPLE':
        grossUpFactor = 1 + rule.rate;
        grossAmount = roundToCurrency(netAmount * grossUpFactor, currency);
        break;
        
      default:
        throw new Error(`Unsupported gross-up method: ${method}`);
    }
    
    const withholdingTax = roundToCurrency(grossAmount - netAmount, currency);
    
    return {
      netAmount: roundToCurrency(netAmount, currency),
      withholdingTax,
      grossAmount,
      withholdingRate: rule.rate,
      grossUpFactor,
      calculationMethod: method
    };
  }

  /**
   * Calculate withholding tax with breakdown
   */
  static calculateWithBreakdown(
    grossAmount: number,
    rule: WithholdingTaxRule,
    options: WithholdingOptions = {}
  ): WithholdingBreakdown {
    const currency = options.currency ?? 'MYR';
    
    const withholdingTax = roundToCurrency(grossAmount * rule.rate, currency);
    const netAmount = roundToCurrency(grossAmount - withholdingTax, currency);
    
    return {
      grossAmount: roundToCurrency(grossAmount, currency),
      withholdingTax,
      netAmount,
      withholdingRate: rule.rate,
      grossUpFactor: 1 / (1 - rule.rate),
      calculationMethod: 'STANDARD',
      applicableRule: rule,
      jurisdiction: rule.jurisdiction,
      currency: currency as SupportedCurrency,
      calculationDate: new Date(),
      breakdown: {
        baseAmount: roundToCurrency(grossAmount, currency),
        taxAmount: withholdingTax,
        grossUpAmount: roundToCurrency(grossAmount * (1 / (1 - rule.rate)), currency),
        finalAmount: netAmount
      }
    };
  }

  /**
   * Calculate multiple withholding taxes
   */
  static calculateMultiple(
    transactions: Array<{
      amount: number;
      rule: WithholdingTaxRule;
      options?: WithholdingOptions;
    }>
  ): WithholdingResult[] {
    return transactions.map(transaction => 
      this.calculateWithholding(
        transaction.amount,
        transaction.rule,
        transaction.options
      )
    );
  }

  /**
   * Calculate withholding tax summary
   */
  static calculateSummary(
    results: WithholdingResult[]
  ): {
    totalGrossAmount: number;
    totalWithholdingTax: number;
    totalNetAmount: number;
    averageRate: number;
    jurisdictionBreakdown: Record<string, {
      grossAmount: number;
      withholdingTax: number;
      netAmount: number;
      transactionCount: number;
    }>;
  } {
    const totalGrossAmount = results.reduce((sum, result) => sum + result.grossAmount, 0);
    const totalWithholdingTax = results.reduce((sum, result) => sum + result.withholdingTax, 0);
    const totalNetAmount = results.reduce((sum, result) => sum + result.netAmount, 0);
    const averageRate = totalGrossAmount > 0 ? totalWithholdingTax / totalGrossAmount : 0;
    
    const jurisdictionBreakdown: Record<string, {
      grossAmount: number;
      withholdingTax: number;
      netAmount: number;
      transactionCount: number;
    }> = {};
    
    results.forEach(result => {
      const jurisdiction = result.jurisdiction;
      if (!jurisdictionBreakdown[jurisdiction]) {
        jurisdictionBreakdown[jurisdiction] = {
          grossAmount: 0,
          withholdingTax: 0,
          netAmount: 0,
          transactionCount: 0
        };
      }
      
      jurisdictionBreakdown[jurisdiction].grossAmount += result.grossAmount;
      jurisdictionBreakdown[jurisdiction].withholdingTax += result.withholdingTax;
      jurisdictionBreakdown[jurisdiction].netAmount += result.netAmount;
      jurisdictionBreakdown[jurisdiction].transactionCount += 1;
    });
    
    return {
      totalGrossAmount,
      totalWithholdingTax,
      totalNetAmount,
      averageRate,
      jurisdictionBreakdown
    };
  }
}

// ============================================================================
// WITHHOLDING TAX VALIDATION
// ============================================================================

export class WithholdingTaxValidator {
  /**
   * Validate withholding tax calculation
   */
  static validateCalculation(
    grossAmount: number,
    rule: WithholdingTaxRule,
    _options: WithholdingOptions = {}
  ): BusinessValidationResult {
    const issues: ValidationIssue[] = [];
    
    if (grossAmount < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_AMOUNT',
        'Gross amount must be positive',
        'error',
        'grossAmount',
        grossAmount
      ));
    }
    
    if (grossAmount < rule.minimumAmount) {
      issues.push(createValidationIssue(
        'AMOUNT_BELOW_MINIMUM',
        `Amount ${grossAmount} is below minimum ${rule.minimumAmount}`,
        'error',
        'grossAmount',
        grossAmount
      ));
    }
    
    if (grossAmount > rule.maximumAmount) {
      issues.push(createValidationIssue(
        'AMOUNT_ABOVE_MAXIMUM',
        `Amount ${grossAmount} is above maximum ${rule.maximumAmount}`,
        'error',
        'grossAmount',
        grossAmount
      ));
    }
    
    if (rule.rate < 0 || rule.rate > 1) {
      issues.push(createValidationIssue(
        'INVALID_RATE',
        'Tax rate must be between 0 and 1',
        'error',
        'rate',
        rule.rate
      ));
    }
    
    if (!rule.active) {
      issues.push(createValidationIssue(
        'RULE_INACTIVE',
        'Withholding tax rule is not active',
        'error',
        'active',
        rule.active
      ));
    }
    
    const now = new Date();
    if (rule.effectiveDate > now) {
      issues.push(createValidationIssue(
        'RULE_NOT_EFFECTIVE',
        'Withholding tax rule is not yet effective',
        'warning',
        'effectiveDate',
        rule.effectiveDate
      ));
    }
    
    if (rule.expiryDate && rule.expiryDate < now) {
      issues.push(createValidationIssue(
        'RULE_EXPIRED',
        'Withholding tax rule has expired',
        'error',
        'expiryDate',
        rule.expiryDate
      ));
    }
    
    return createBusinessValidationResult(issues.length === 0, issues);
  }

  /**
   * Validate gross-up calculation
   */
  static validateGrossUp(
    netAmount: number,
    rule: WithholdingTaxRule,
    options: GrossUpOptions = {}
  ): BusinessValidationResult {
    const issues: ValidationIssue[] = [];
    
    if (netAmount < 0) {
      issues.push(createValidationIssue(
        'NEGATIVE_AMOUNT',
        'Net amount must be positive',
        'error',
        'netAmount',
        netAmount
      ));
    }
    
    if (rule.rate >= 1) {
      issues.push(createValidationIssue(
        'INVALID_RATE_FOR_GROSS_UP',
        'Tax rate must be less than 1 for gross-up calculation',
        'error',
        'rate',
        rule.rate
      ));
    }
    
    const method = options.method ?? 'STANDARD';
    if (!['STANDARD', 'REVERSE', 'COMPOUND', 'SIMPLE'].includes(method)) {
      issues.push(createValidationIssue(
        'INVALID_GROSS_UP_METHOD',
        'Invalid gross-up method',
        'error',
        'method',
        method
      ));
    }
    
    return createBusinessValidationResult(issues.length === 0, issues);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate withholding tax
 */
export function calculateWithholdingTax(
  grossAmount: number,
  rule: WithholdingTaxRule,
  options: WithholdingOptions = {}
): WithholdingResult {
  return WithholdingTaxCalculator.calculateWithholding(grossAmount, rule, options);
}

/**
 * Calculate gross-up amount
 */
export function calculateGrossUp(
  netAmount: number,
  rule: WithholdingTaxRule,
  options: GrossUpOptions = {}
): GrossUpResult {
  return WithholdingTaxCalculator.calculateGrossUp(netAmount, rule, options);
}

/**
 * Calculate withholding tax with breakdown
 */
export function calculateWithholdingWithBreakdown(
  grossAmount: number,
  rule: WithholdingTaxRule,
  options: WithholdingOptions = {}
): WithholdingBreakdown {
  return WithholdingTaxCalculator.calculateWithBreakdown(grossAmount, rule, options);
}

/**
 * Validate withholding tax calculation
 */
export function validateWithholdingCalculation(
  grossAmount: number,
  rule: WithholdingTaxRule,
  options: WithholdingOptions = {}
): BusinessValidationResult {
  return WithholdingTaxValidator.validateCalculation(grossAmount, rule, options);
}

/**
 * Validate gross-up calculation
 */
export function validateGrossUpCalculation(
  netAmount: number,
  rule: WithholdingTaxRule,
  options: GrossUpOptions = {}
): BusinessValidationResult {
  return WithholdingTaxValidator.validateGrossUp(netAmount, rule, options);
}
