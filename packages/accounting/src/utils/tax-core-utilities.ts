/**
 * Tax Core Utilities
 * 
 * Indirect tax engine with inclusive/exclusive calculations, rounding steps, and reconciliation.
 * Provides comprehensive tax calculation, rounding management, and reconciliation operations.
 * 
 * @fileoverview Tax calculation engine, rounding management, and reconciliation utilities
 */

import {
  SupportedCurrency,
  roundToCurrency,
} from './accounting-utilities';
import { ValidationIssue, BusinessValidationResult } from './validation-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TaxCalculationResult {
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  taxRate: number;
  method: TaxCalculationMethod;
  roundingSteps: RoundingStep[];
  isZeroRated: boolean;
  isExempt: boolean;
}

export interface TaxLine {
  lineNumber: number;
  description: string;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  taxType: TaxType;
  isZeroRated: boolean;
  isExempt: boolean;
}

export interface TaxSummary {
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  taxBreakdown: TaxBreakdown[];
  roundingDifference: number;
}

export interface TaxBreakdown {
  taxRate: number;
  netAmount: number;
  taxAmount: number;
  lineCount: number;
}

export interface RoundingStep {
  step: number;
  description: string;
  amount: number;
  roundedAmount: number;
  difference: number;
  method: TaxRoundingMethod;
}

export interface TaxOptions {
  roundingMethod?: TaxRoundingMethod;
  precision?: number;
  tolerance?: number;
  includeRoundingSteps?: boolean;
}

export interface ReconciliationResult {
  isReconciled: boolean;
  lineTotal: number;
  summaryTotal: number;
  difference: number;
  withinTolerance: boolean;
  tolerance: number;
  variances: TaxVariance[];
}

export interface TaxVariance {
  id: string;
  type: VarianceType;
  amount: number;
  percentage: number;
  cause: string;
  impact: VarianceImpact;
}

export interface TaxExemption {
  id: string;
  type: ExemptionType;
  rate: number;
  conditions: ExemptionCondition[];
  active: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface TaxTransaction {
  id: string;
  customer: string;
  items: TaxTransactionItem[];
  totalAmount: number;
  currency: SupportedCurrency;
  transactionDate: Date;
  exemptions: TaxExemption[];
}

export interface TaxTransactionItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  taxType: TaxType;
  isZeroRated: boolean;
  isExempt: boolean;
}

export interface ExemptionCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export type TaxCalculationMethod = 'inclusive' | 'exclusive' | 'mixed';
export type TaxRoundingMethod = 'round_up' | 'round_down' | 'round_half_up' | 'round_half_even';
export type TaxType = 'vat' | 'gst' | 'sales_tax' | 'service_tax';
export type VarianceType = 'calculation' | 'rounding' | 'timing' | 'classification' | 'rate';
export type VarianceImpact = 'low' | 'medium' | 'high' | 'critical';
export type ExemptionType = 'zero_rated' | 'exempt' | 'reduced_rate' | 'reverse_charge';
export type ConditionOperator = 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';

// ============================================================================
// Tax Calculations
// ============================================================================

/**
 * Calculate tax
 */
export function calculateTax(
  amount: number,
  taxRate: number,
  method: TaxCalculationMethod,
  options?: TaxOptions
): TaxCalculationResult {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }
  
  const roundingMethod = options?.roundingMethod || 'round_half_up';
  const precision = options?.precision || 2;
  const includeRoundingSteps = options?.includeRoundingSteps || false;
  
  let netAmount: number;
  let taxAmount: number;
  let grossAmount: number;
  const roundingSteps: RoundingStep[] = [];
  
  switch (method) {
    case 'inclusive':
      grossAmount = amount;
      taxAmount = calculateInclusiveTaxAmount(grossAmount, taxRate, roundingMethod, precision, roundingSteps, includeRoundingSteps);
      netAmount = grossAmount - taxAmount;
      break;
      
    case 'exclusive':
      netAmount = amount;
      taxAmount = calculateExclusiveTaxAmount(netAmount, taxRate, roundingMethod, precision, roundingSteps, includeRoundingSteps);
      grossAmount = netAmount + taxAmount;
      break;
      
    case 'mixed':
      // For mixed method, assume amount is net
      netAmount = amount;
      taxAmount = calculateExclusiveTaxAmount(netAmount, taxRate, roundingMethod, precision, roundingSteps, includeRoundingSteps);
      grossAmount = netAmount + taxAmount;
      break;
      
    default:
      throw new Error(`Unsupported tax calculation method: ${method}`);
  }
  
  return {
    netAmount: roundToCurrency(netAmount, 'USD'),
    taxAmount: roundToCurrency(taxAmount, 'USD'),
    grossAmount: roundToCurrency(grossAmount, 'USD'),
    taxRate,
    method,
    roundingSteps,
    isZeroRated: taxRate === 0,
    isExempt: false,
  };
}

/**
 * Calculate inclusive tax
 */
export function calculateInclusiveTax(
  grossAmount: number,
  taxRate: number,
  options?: TaxOptions
): TaxCalculationResult {
  return calculateTax(grossAmount, taxRate, 'inclusive', options);
}

/**
 * Calculate exclusive tax
 */
export function calculateExclusiveTax(
  netAmount: number,
  taxRate: number,
  options?: TaxOptions
): TaxCalculationResult {
  return calculateTax(netAmount, taxRate, 'exclusive', options);
}

/**
 * Calculate inclusive tax amount
 */
function calculateInclusiveTaxAmount(
  grossAmount: number,
  taxRate: number,
  roundingMethod: TaxRoundingMethod,
  precision: number,
  roundingSteps: RoundingStep[],
  includeRoundingSteps: boolean
): number {
  const taxAmount = grossAmount * (taxRate / (1 + taxRate));
  
  if (includeRoundingSteps) {
    roundingSteps.push({
      step: 1,
      description: 'Calculate tax amount from gross',
      amount: taxAmount,
      roundedAmount: taxAmount,
      difference: 0,
      method: roundingMethod,
    });
  }
  
  const roundedAmount = applyTaxRounding(taxAmount, roundingMethod, precision);
  
  if (includeRoundingSteps) {
    roundingSteps.push({
      step: 2,
      description: 'Apply tax rounding',
      amount: taxAmount,
      roundedAmount,
      difference: roundedAmount - taxAmount,
      method: roundingMethod,
    });
  }
  
  return roundedAmount;
}

/**
 * Calculate exclusive tax amount
 */
function calculateExclusiveTaxAmount(
  netAmount: number,
  taxRate: number,
  roundingMethod: TaxRoundingMethod,
  precision: number,
  roundingSteps: RoundingStep[],
  includeRoundingSteps: boolean
): number {
  const taxAmount = netAmount * taxRate;
  
  if (includeRoundingSteps) {
    roundingSteps.push({
      step: 1,
      description: 'Calculate tax amount from net',
      amount: taxAmount,
      roundedAmount: taxAmount,
      difference: 0,
      method: roundingMethod,
    });
  }
  
  const roundedAmount = applyTaxRounding(taxAmount, roundingMethod, precision);
  
  if (includeRoundingSteps) {
    roundingSteps.push({
      step: 2,
      description: 'Apply tax rounding',
      amount: taxAmount,
      roundedAmount,
      difference: roundedAmount - taxAmount,
      method: roundingMethod,
    });
  }
  
  return roundedAmount;
}

// ============================================================================
// Rounding Management
// ============================================================================

/**
 * Apply tax rounding
 */
export function applyTaxRounding(
  amount: number,
  method: TaxRoundingMethod,
  precision: number = 2
): number {
  const factor = Math.pow(10, precision);
  
  switch (method) {
    case 'round_up':
      return Math.ceil(amount * factor) / factor;
    case 'round_down':
      return Math.floor(amount * factor) / factor;
    case 'round_half_up':
      return Math.round(amount * factor) / factor;
    case 'round_half_even':
      return Math.round(amount * factor) / factor; // Simplified implementation
    default:
      return roundToCurrency(amount, 'USD');
  }
}

/**
 * Calculate rounding difference
 */
export function calculateRoundingDifference(original: number, rounded: number): number {
  return Math.abs(rounded - original);
}

/**
 * Distribute rounding difference
 */
export function distributeRoundingDifference(
  amounts: number[],
  difference: number,
  method: 'proportional' | 'equal' | 'largest_first'
): number[] {
  if (amounts.length === 0) {
    return [];
  }
  
  const result = [...amounts];
  
  switch (method) {
    case 'proportional':
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      if (total > 0) {
        for (let i = 0; i < result.length; i++) {
          const proportion = amounts[i]! / total;
          result[i]! += difference * proportion;
        }
      }
      break;
      
    case 'equal':
      const equalShare = difference / amounts.length;
      for (let i = 0; i < result.length; i++) {
        result[i]! += equalShare;
      }
      break;
      
    case 'largest_first':
      const sortedIndices = amounts
        .map((amount, index) => ({ amount, index }))
        .sort((a, b) => b.amount - a.amount)
        .map(item => item.index);
      
      let remainingDifference = difference;
      for (const index of sortedIndices) {
        if (remainingDifference === 0) break;
        const adjustment = Math.min(remainingDifference, 0.01); // Minimum adjustment
        result[index]! += adjustment;
        remainingDifference -= adjustment;
      }
      break;
  }
  
  return result;
}

// ============================================================================
// Reconciliation
// ============================================================================

/**
 * Reconcile tax lines
 */
export function reconcileTaxLines(
  lines: TaxLine[],
  summary: TaxSummary,
  tolerance: number = 0.01
): ReconciliationResult {
  const lineTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0);
  const summaryTotal = summary.totalTaxAmount;
  const difference = Math.abs(lineTotal - summaryTotal);
  const withinTolerance = difference <= tolerance;
  
  const variances: TaxVariance[] = [];
  
  if (!withinTolerance) {
    variances.push({
      id: `VAR-${Date.now()}`,
      type: 'calculation',
      amount: difference,
      percentage: (difference / summaryTotal) * 100,
      cause: 'Line total does not match summary total',
      impact: difference > 1 ? 'high' : 'medium',
    });
  }
  
  // Check for rounding differences
  if (summary.roundingDifference > 0) {
    variances.push({
      id: `VAR-ROUNDING-${Date.now()}`,
      type: 'rounding',
      amount: summary.roundingDifference,
      percentage: (summary.roundingDifference / summaryTotal) * 100,
      cause: 'Rounding difference in summary',
      impact: 'low',
    });
  }
  
  return {
    isReconciled: withinTolerance,
    lineTotal,
    summaryTotal,
    difference,
    withinTolerance,
    tolerance,
    variances,
  };
}

/**
 * Validate tax reconciliation
 */
export function validateTaxReconciliation(
  lines: TaxLine[],
  summary: TaxSummary,
  tolerance: number
): BusinessValidationResult {
  const reconciliation = reconcileTaxLines(lines, summary, tolerance);
  
  const issues: ValidationIssue[] = [];
  
  if (!reconciliation.isReconciled) {
    issues.push({
      code: 'BALANCE',
      path: 'tax.reconciliation',
      message: `Tax reconciliation failed. Difference: ${reconciliation.difference}`,
      severity: 'error'
    });
  }
  
  for (const variance of reconciliation.variances) {
    if (variance.impact === 'high' || variance.impact === 'critical') {
      issues.push({
        code: 'RANGE',
        path: 'tax.variance',
        message: `Significant tax variance: ${variance.cause}`,
        severity: 'error'
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues,
  };
}

/**
 * Calculate tax variance
 */
export function calculateTaxVariance(lines: TaxLine[], summary: TaxSummary): TaxVariance {
  const lineTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0);
  const summaryTotal = summary.totalTaxAmount;
  const difference = lineTotal - summaryTotal;
  
  return {
    id: `VAR-${Date.now()}`,
    type: 'calculation',
    amount: Math.abs(difference),
    percentage: Math.abs((difference / summaryTotal) * 100),
    cause: difference > 0 ? 'Line total exceeds summary' : 'Summary exceeds line total',
    impact: Math.abs(difference) > 1 ? 'high' : 'medium',
  };
}

// ============================================================================
// Zero-Rated/Exempt Logic
// ============================================================================

/**
 * Apply zero-rated tax
 */
export function applyZeroRatedTax(
  amount: number,
  _taxRate: number
): TaxCalculationResult {
  return {
    netAmount: amount,
    taxAmount: 0,
    grossAmount: amount,
    taxRate: 0,
    method: 'exclusive',
    roundingSteps: [],
    isZeroRated: true,
    isExempt: false,
  };
}

/**
 * Apply exempt tax
 */
export function applyExemptTax(
  amount: number,
  _taxRate: number
): TaxCalculationResult {
  return {
    netAmount: amount,
    taxAmount: 0,
    grossAmount: amount,
    taxRate: 0,
    method: 'exclusive',
    roundingSteps: [],
    isZeroRated: false,
    isExempt: true,
  };
}

/**
 * Validate tax exemption
 */
export function validateTaxExemption(
  exemption: TaxExemption,
  transaction: TaxTransaction
): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!exemption.active) {
    issues.push({
      code: 'CONSISTENCY',
      path: 'exemption.status',
      message: 'Tax exemption is not active',
      severity: 'error'
    });
  }
  
  if (transaction.transactionDate > exemption.effectiveDate) {
    issues.push({
      code: 'CONSISTENCY',
      path: 'exemption.effectiveDate',
      message: 'Tax exemption is not yet effective',
      severity: 'error'
    });
  }
  
  if (exemption.expiryDate && transaction.transactionDate < exemption.expiryDate) {
    issues.push({
      code: 'CONSISTENCY',
      path: 'exemption.expiryDate',
      message: 'Tax exemption has expired',
      severity: 'error'
    });
  }
  
  // Validate conditions
  for (const condition of exemption.conditions) {
    const isValid = validateExemptionCondition(condition, transaction);
    if (!isValid) {
      issues.push({
        code: 'CONSISTENCY',
        path: 'exemption.condition',
        message: `Exemption condition not met: ${condition.field}`,
        severity: 'error'
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(issue => issue.severity === 'error').map(issue => issue.message),
    warnings: issues.filter(issue => issue.severity === 'warning').map(issue => issue.message),
    issues,
  };
}

/**
 * Validate exemption condition
 */
function validateExemptionCondition(
  _condition: ExemptionCondition,
  _transaction: TaxTransaction
): boolean {
  // Simplified condition validation
  // In a real implementation, this would check transaction properties
  return true;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create tax summary from lines
 */
export function createTaxSummary(lines: TaxLine[]): TaxSummary {
  const totalNetAmount = lines.reduce((sum, line) => sum + line.netAmount, 0);
  const totalTaxAmount = lines.reduce((sum, line) => sum + line.taxAmount, 0);
  const totalGrossAmount = lines.reduce((sum, line) => sum + line.grossAmount, 0);
  
  // Group by tax rate
  const rateGroups = new Map<number, TaxLine[]>();
  for (const line of lines) {
    const existing = rateGroups.get(line.taxRate) || [];
    existing.push(line);
    rateGroups.set(line.taxRate, existing);
  }
  
  const taxBreakdown: TaxBreakdown[] = [];
  for (const [rate, rateLines] of rateGroups) {
    taxBreakdown.push({
      taxRate: rate,
      netAmount: rateLines.reduce((sum, line) => sum + line.netAmount, 0),
      taxAmount: rateLines.reduce((sum, line) => sum + line.taxAmount, 0),
      lineCount: rateLines.length,
    });
  }
  
  // Calculate rounding difference
  const calculatedTotal = totalNetAmount + totalTaxAmount;
  const roundingDifference = Math.abs(totalGrossAmount - calculatedTotal);
  
  return {
    totalNetAmount,
    totalTaxAmount,
    totalGrossAmount,
    taxBreakdown,
    roundingDifference,
  };
}

/**
 * Get tax calculation summary
 */
export function getTaxCalculationSummary(
  results: TaxCalculationResult[]
): {
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  zeroRatedCount: number;
  exemptCount: number;
  averageTaxRate: number;
} {
  const totalNetAmount = results.reduce((sum, result) => sum + result.netAmount, 0);
  const totalTaxAmount = results.reduce((sum, result) => sum + result.taxAmount, 0);
  const totalGrossAmount = results.reduce((sum, result) => sum + result.grossAmount, 0);
  
  const zeroRatedCount = results.filter(r => r.isZeroRated).length;
  const exemptCount = results.filter(r => r.isExempt).length;
  
  const averageTaxRate = results.length > 0 
    ? results.reduce((sum, result) => sum + result.taxRate, 0) / results.length 
    : 0;
  
  return {
    totalNetAmount,
    totalTaxAmount,
    totalGrossAmount,
    zeroRatedCount,
    exemptCount,
    averageTaxRate,
  };
}
