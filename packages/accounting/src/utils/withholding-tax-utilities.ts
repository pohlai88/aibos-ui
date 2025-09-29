/**
 * Withholding Tax Utilities - Refactored
 * 
 * Withholding tax base definition, gross-up helpers, and separate payable mapping.
 * Now uses SSOT architecture with split modules for better maintainability.
 * 
 * @fileoverview Withholding tax rules, gross-up calculations, and payable mapping
 */

// Re-export from split modules for backward compatibility
export type * from './withholding-tax-types-utilities';
export * from './withholding-tax-rules-utilities';
export * from './withholding-tax-validation-utilities';

// Re-export with explicit names to avoid conflicts
export { WithholdingTaxValidator as WithholdingTaxCalculator } from './withholding-tax-validation-utilities';
export { validateWithholdingCalculation as validateWithholdingTaxCalculation } from './withholding-tax-validation-utilities';

import {
  roundToCurrency,
} from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';

// ============================================================================
// WITHHOLDING TAX UTILITIES (Backward Compatibility)
// ============================================================================

/**
 * Calculate withholding tax with gross-up
 */
export function calculateWithholdingWithGrossUp(
  netAmount: number,
  rate: number,
  method: 'STANDARD' | 'REVERSE' = 'STANDARD'
): {
  netAmount: number;
  withholdingTax: number;
  grossAmount: number;
  grossUpFactor: number;
} {
  let grossUpFactor: number;
  let grossAmount: number;
  
  if (method === 'STANDARD') {
    grossUpFactor = 1 / (1 - rate);
    grossAmount = roundToCurrency(netAmount * grossUpFactor, 'MYR');
  } else {
    grossUpFactor = 1 + rate;
    grossAmount = roundToCurrency(netAmount * grossUpFactor, 'MYR');
  }
  
  const withholdingTax = roundToCurrency(grossAmount - netAmount, 'MYR');
  
  return {
    netAmount: roundToCurrency(netAmount, 'MYR'),
    withholdingTax,
    grossAmount,
    grossUpFactor
  };
}

/**
 * Calculate withholding tax from gross amount
 */
export function calculateWithholdingFromGross(
  grossAmount: number,
  rate: number
): {
  grossAmount: number;
  withholdingTax: number;
  netAmount: number;
} {
  const withholdingTax = roundToCurrency(grossAmount * rate, 'MYR');
  const netAmount = roundToCurrency(grossAmount - withholdingTax, 'MYR');
  
  return {
    grossAmount: roundToCurrency(grossAmount, 'MYR'),
    withholdingTax,
    netAmount
  };
}

/**
 * Validate withholding tax amount
 */
export function validateWithholdingAmount(
  amount: number,
  minimumAmount: number,
  maximumAmount: number
): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (amount < 0) {
    issues.push({
      code: 'NEGATIVE_AMOUNT' as unknown,
      message: 'Amount must be positive',
      severity: 'error',
      path: 'amount'
    });
  }
  
  if (amount < minimumAmount) {
    issues.push({
      code: 'AMOUNT_BELOW_MINIMUM' as unknown,
      message: `Amount ${amount} is below minimum ${minimumAmount}`,
      severity: 'error',
      path: 'amount'
    });
  }
  
  if (amount > maximumAmount) {
    issues.push({
      code: 'AMOUNT_ABOVE_MAXIMUM' as unknown,
      message: `Amount ${amount} is above maximum ${maximumAmount}`,
      severity: 'error',
      path: 'amount'
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues
  };
}

/**
 * Format withholding tax result for display
 */
export function formatWithholdingResult(result: {
  grossAmount: number;
  withholdingTax: number;
  netAmount: number;
  rate: number;
}): string {
  return `
Withholding Tax Calculation:
Gross Amount: ${result.grossAmount.toFixed(2)}
Withholding Tax: ${result.withholdingTax.toFixed(2)}
Net Amount: ${result.netAmount.toFixed(2)}
Rate: ${(result.rate * 100).toFixed(2)}%
  `.trim();
}

/**
 * Calculate withholding tax summary
 */
export function calculateWithholdingSummary(
  transactions: Array<{
    amount: number;
    rate: number;
    jurisdiction: string;
  }>
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
  const totalGrossAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalWithholdingTax = transactions.reduce((sum, t) => sum + (t.amount * t.rate), 0);
  const totalNetAmount = totalGrossAmount - totalWithholdingTax;
  const averageRate = totalGrossAmount > 0 ? totalWithholdingTax / totalGrossAmount : 0;
  
  const jurisdictionBreakdown: Record<string, {
    grossAmount: number;
    withholdingTax: number;
    netAmount: number;
    transactionCount: number;
  }> = {};
  
  transactions.forEach(transaction => {
    const jurisdiction = transaction.jurisdiction;
    if (!jurisdictionBreakdown[jurisdiction]) {
      jurisdictionBreakdown[jurisdiction] = {
        grossAmount: 0,
        withholdingTax: 0,
        netAmount: 0,
        transactionCount: 0
      };
    }
    
    jurisdictionBreakdown[jurisdiction].grossAmount += transaction.amount;
    jurisdictionBreakdown[jurisdiction].withholdingTax += transaction.amount * transaction.rate;
    jurisdictionBreakdown[jurisdiction].netAmount += transaction.amount * (1 - transaction.rate);
    jurisdictionBreakdown[jurisdiction].transactionCount += 1;
  });
  
  return {
    totalGrossAmount: roundToCurrency(totalGrossAmount, 'MYR'),
    totalWithholdingTax: roundToCurrency(totalWithholdingTax, 'MYR'),
    totalNetAmount: roundToCurrency(totalNetAmount, 'MYR'),
    averageRate,
    jurisdictionBreakdown
  };
}

/**
 * Get withholding tax rate for jurisdiction and tax type
 */
export function getWithholdingTaxRate(
  jurisdiction: string,
  taxType: string,
  _vendorType: string = 'INDIVIDUAL'
): number {
  // Default rates based on jurisdiction and tax type
  const defaultRates: Record<string, Record<string, number>> = {
    'MY': {
      'INCOME_TAX': 0.10,
      'SERVICE_TAX': 0.06,
      'PROFESSIONAL_TAX': 0.08,
      'CONTRACTOR_TAX': 0.05,
      'ROYALTY_TAX': 0.15,
      'DIVIDEND_TAX': 0.25,
      'INTEREST_TAX': 0.15,
      'RENTAL_TAX': 0.10
    }
  };
  
  return defaultRates[jurisdiction]?.[taxType] || 0.10;
}

/**
 * Check if withholding tax is applicable
 */
export function isWithholdingTaxApplicable(
  amount: number,
  jurisdiction: string,
  taxType: string,
  _vendorType: string = 'INDIVIDUAL'
): boolean {
  const minimumAmounts: Record<string, Record<string, number>> = {
    'MY': {
      'INCOME_TAX': 1000,
      'SERVICE_TAX': 500,
      'PROFESSIONAL_TAX': 2000,
      'CONTRACTOR_TAX': 1000,
      'ROYALTY_TAX': 5000,
      'DIVIDEND_TAX': 1000,
      'INTEREST_TAX': 1000,
      'RENTAL_TAX': 1000
    }
  };
  
  const minimumAmount = minimumAmounts[jurisdiction]?.[taxType] || 1000;
  return amount >= minimumAmount;
}