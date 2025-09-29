/**
 * Tax Core Utilities
 * 
 * Indirect tax engine with inclusive/exclusive calculations, rounding steps, and reconciliation.
 * Provides comprehensive tax calculation, rounding management, and reconciliation operations.
 * 
 * @fileoverview Tax calculation engine, rounding management, and reconciliation utilities
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import { roundToCurrency } from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import type { ConditionOperator } from './shared-operators-utilities';
import { RoundingMethod } from './policies/rounding-policy';

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
  /** Currency context for traceability and rounding consistency */
  currency: SupportedCurrency;
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
  method: RoundingMethod;
}

export interface TaxOptions {
  roundingMethod?: RoundingMethod;
  precision?: number;
  tolerance?: number;
  includeRoundingSteps?: boolean;
  /** Currency context for rounding; defaults to MYR to align with Malaysia-first */
  currency?: SupportedCurrency;
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
  value: unknown;
}

export type TaxCalculationMethod = 'inclusive' | 'exclusive' | 'mixed';
// TaxRoundingMethod replaced with SSOT RoundingMethod from policies/rounding-policy.ts
export type TaxType = 'vat' | 'gst' | 'sales_tax' | 'service_tax';
export type VarianceType = 'calculation' | 'rounding' | 'timing' | 'classification' | 'rate';
export type VarianceImpact = 'low' | 'medium' | 'high' | 'critical';
export type ExemptionType = 'zero_rated' | 'exempt' | 'reduced_rate' | 'reverse_charge';

// ConditionOperator imported from shared-operators.ts (SSOT)

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
  
  const roundingMethod = options?.roundingMethod ?? RoundingMethod.HALF_UP;
  const precision = options?.precision ?? 2;
  const currency = options?.currency ?? 'MYR';
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
    netAmount: roundToCurrency(netAmount, currency),
    taxAmount: roundToCurrency(taxAmount, currency),
    grossAmount: roundToCurrency(grossAmount, currency),
    taxRate,
    method,
    roundingSteps,
    isZeroRated: taxRate === 0,
    isExempt: false,
    currency,
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
  roundingMethod: RoundingMethod,
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
  roundingMethod: RoundingMethod,
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
  method: RoundingMethod,
  precision: number = 2
): number {
  const factor = Math.pow(10, precision);
  
  switch (method) {
    case RoundingMethod.CEILING:
      return Math.ceil(amount * factor) / factor;
    case RoundingMethod.FLOOR:
      return Math.floor(amount * factor) / factor;
    case RoundingMethod.HALF_UP:
      return Math.round(amount * factor) / factor;
    case RoundingMethod.HALF_EVEN:
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
  _taxRate: number,
  currency: SupportedCurrency = 'MYR'
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
    currency,
  };
}

/**
 * Apply exempt tax
 */
export function applyExemptTax(
  amount: number,
  _taxRate: number,
  currency: SupportedCurrency = 'MYR'
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
    currency,
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
  
  // Validate conditions using SSOT rules engine
  for (const condition of exemption.conditions) {
    const isValid = evaluateExemptionCondition(condition, transaction);
    if (!isValid) {
      issues.push({
        code: 'CONSISTENCY',
        path: 'exemption.condition',
        message: `Exemption condition not met: ${condition.field} ${condition.operator} ${condition.value}`,
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
 * Evaluate condition operator against transaction data
 * 
 * @param condition - Exemption condition to evaluate
 * @param transaction - Transaction data to evaluate against
 * @returns True if condition is met
 * 
 * @example
 * ```typescript
 * const isValid = evaluateExemptionCondition(
 *   { field: 'customerType', operator: 'equals', value: 'business' },
 *   transaction
 * );
 * ```
 */
export function evaluateExemptionCondition(
  condition: ExemptionCondition,
  transaction: TaxTransaction
): boolean {
  // Get field value from transaction
  const fieldValue = getTransactionFieldValue(transaction, condition.field);
  
  // Evaluate based on operator
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    
    case 'not_equals':
      return fieldValue !== condition.value;
    
    case 'greater_than':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' 
        ? fieldValue > condition.value 
        : false;
    
    case 'less_than':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' 
        ? fieldValue < condition.value 
        : false;
    
    case 'contains':
      return typeof fieldValue === 'string' && typeof condition.value === 'string'
        ? fieldValue.includes(condition.value)
        : false;
    
    case 'starts_with':
      return typeof fieldValue === 'string' && typeof condition.value === 'string'
        ? fieldValue.startsWith(condition.value)
        : false;
    
    case 'ends_with':
      return typeof fieldValue === 'string' && typeof condition.value === 'string'
        ? fieldValue.endsWith(condition.value)
        : false;
    
    case 'between':
      if (typeof fieldValue !== 'number' || !Array.isArray(condition.value) || condition.value.length !== 2) {
        return false;
      }
      const [min, max] = condition.value;
      return fieldValue >= min && fieldValue <= max;
    
    case 'regex':
      if (typeof fieldValue !== 'string' || typeof condition.value !== 'string') {
        return false;
      }
      try {
        const regex = new RegExp(condition.value);
        return regex.test(fieldValue);
      } catch {
        return false;
      }
    
    default:
      return false;
  }
}

/**
 * Get field value from transaction data
 * 
 * @param transaction - Transaction data
 * @param field - Field path (supports nested properties)
 * @returns Field value or undefined if not found
 */
function getTransactionFieldValue(transaction: TaxTransaction, field: string): unknown {
  // Handle nested field access (e.g., 'customer.type')
  const fieldParts = field.split('.');
  let value: unknown = transaction;
  
  for (const part of fieldParts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as unknown)[part];
    } else {
      return undefined;
    }
  }
  
  return value;
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

// ============================================================================
// DEFERRED TAX INTEGRATION - PHASE 1 EXTENSIONS
// ============================================================================

/**
 * Temporary difference for deferred tax calculations
 */
export interface TemporaryDifference {
  readonly differenceId: string;
  readonly accountCode: string;
  readonly differenceType: TemporaryDifferenceType;
  readonly carryingAmount: number;
  readonly taxBase: number;
  readonly differenceAmount: number;
  readonly currency: SupportedCurrency;
  readonly reversalDate: Date | undefined;
  readonly taxRate: number;
  readonly deferredTaxAmount: number;
}

/**
 * Deferred tax integration result
 */
export interface DeferredTaxIntegration {
  readonly integrationId: string;
  readonly temporaryDifference: TemporaryDifference;
  readonly deferredTaxAsset: number;
  readonly deferredTaxLiability: number;
  readonly taxRate: number;
  readonly currency: SupportedCurrency;
  readonly integrationDate: Date;
  readonly journalEntry: JournalEntry | undefined;
}

/**
 * Tax rate change impact analysis
 */
export interface TaxRateChangeImpact {
  readonly impactId: string;
  readonly oldTaxRate: number;
  readonly newTaxRate: number;
  readonly effectiveDate: Date;
  readonly deferredTaxItems: readonly DeferredTaxIntegration[];
  readonly totalImpact: number;
  readonly currency: SupportedCurrency;
  readonly journalEntries: readonly JournalEntry[];
}

/**
 * Temporary difference types
 */
export type TemporaryDifferenceType = 
  | 'taxable_temporary_difference'
  | 'deductible_temporary_difference'
  | 'permanent_difference'
  | 'timing_difference';

/**
 * Journal entry interface (imported from journal-entry-utilities)
 */
export interface JournalEntry {
  readonly id: string;
  readonly date: Date;
  readonly reference: string;
  readonly description: string;
  readonly lines: readonly JournalLine[];
  readonly totalDebits: number;
  readonly totalCredits: number;
  readonly currency: SupportedCurrency;
  readonly status: 'draft' | 'posted' | 'cancelled';
}

/**
 * Journal line interface (imported from journal-entry-utilities)
 */
export interface JournalLine {
  readonly id: string;
  readonly accountCode: string;
  readonly description: string;
  readonly debit: number;
  readonly credit: number;
  readonly currency: SupportedCurrency;
}

// ============================================================================
// DEFERRED TAX INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Calculate deferred tax integration for temporary difference
 * 
 * @param temporaryDifference - Temporary difference details
 * @param taxRate - Applicable tax rate
 * @returns Deferred tax integration result
 * 
 * @example
 * ```typescript
 * const integration = calculateDeferredTaxIntegration(temporaryDifference, 0.25);
 * ```
 */
export function calculateDeferredTaxIntegration(
  temporaryDifference: TemporaryDifference,
  taxRate: number
): DeferredTaxIntegration {
  // Validate tax rate
  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }

  // Calculate deferred tax amounts based on difference type
  let deferredTaxAsset = 0;
  let deferredTaxLiability = 0;

  switch (temporaryDifference.differenceType) {
    case 'taxable_temporary_difference':
      // Taxable temporary difference creates deferred tax liability
      deferredTaxLiability = temporaryDifference.differenceAmount * taxRate;
      break;
    
    case 'deductible_temporary_difference':
      // Deductible temporary difference creates deferred tax asset
      deferredTaxAsset = temporaryDifference.differenceAmount * taxRate;
      break;
    
    case 'permanent_difference':
      // Permanent differences do not create deferred tax
      break;
    
    case 'timing_difference':
      // Timing differences create deferred tax based on direction
      if (temporaryDifference.differenceAmount > 0) {
        deferredTaxLiability = temporaryDifference.differenceAmount * taxRate;
      } else {
        deferredTaxAsset = Math.abs(temporaryDifference.differenceAmount) * taxRate;
      }
      break;
  }

  // Apply rounding using existing tax rounding utilities
  deferredTaxAsset = applyTaxRounding(deferredTaxAsset, RoundingMethod.HALF_EVEN, 2);
  deferredTaxLiability = applyTaxRounding(deferredTaxLiability, RoundingMethod.HALF_EVEN, 2);

  // Generate journal entry if there's a deferred tax amount
  let journalEntry: JournalEntry | undefined;
  if (deferredTaxAsset > 0 || deferredTaxLiability > 0) {
    journalEntry = generateDeferredTaxJournalEntry(
      temporaryDifference,
      deferredTaxAsset,
      deferredTaxLiability,
      taxRate
    );
  }

  return {
    integrationId: `dt-integration-${temporaryDifference.differenceId}`,
    temporaryDifference,
    deferredTaxAsset,
    deferredTaxLiability,
    taxRate,
    currency: temporaryDifference.currency,
    integrationDate: new Date(),
    journalEntry
  };
}

/**
 * Analyze tax rate change impact on deferred tax items
 * 
 * @param deferredTaxItems - Existing deferred tax items
 * @param newTaxRate - New tax rate
 * @param effectiveDate - Rate change effective date
 * @returns Tax rate change impact analysis
 * 
 * @example
 * ```typescript
 * const impact = analyzeTaxRateChangeImpact(deferredTaxItems, 0.30, new Date());
 * ```
 */
export function analyzeTaxRateChangeImpact(
  deferredTaxItems: readonly DeferredTaxIntegration[],
  newTaxRate: number,
  effectiveDate: Date
): TaxRateChangeImpact {
  // Validate tax rate
  if (newTaxRate < 0 || newTaxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }

  const journalEntries: JournalEntry[] = [];
  let totalImpact = 0;

  // Recalculate each deferred tax item with new rate
  for (const item of deferredTaxItems) {
    const oldTaxRate = item.taxRate;
    const differenceAmount = item.temporaryDifference.differenceAmount;
    
    // Calculate impact of rate change
    const oldDeferredTax = differenceAmount * oldTaxRate;
    const newDeferredTax = differenceAmount * newTaxRate;
    const rateChangeImpact = newDeferredTax - oldDeferredTax;

    if (Math.abs(rateChangeImpact) > 0.01) { // Only process significant impacts
      totalImpact += rateChangeImpact;

      // Generate journal entry for rate change adjustment
      const adjustmentEntry = generateTaxRateChangeJournalEntry(
        item,
        oldTaxRate,
        newTaxRate,
        rateChangeImpact,
        effectiveDate
      );
      journalEntries.push(adjustmentEntry);
    }
  }

  // Apply rounding to total impact
  totalImpact = applyTaxRounding(totalImpact, RoundingMethod.HALF_EVEN, 2);

  return {
    impactId: `tax-rate-impact-${Date.now()}`,
    oldTaxRate: deferredTaxItems[0]?.taxRate || 0,
    newTaxRate,
    effectiveDate,
    deferredTaxItems,
    totalImpact,
    currency: deferredTaxItems[0]?.currency || 'MYR',
    journalEntries
  };
}

/**
 * Create temporary difference from tax calculation
 * 
 * @param taxCalculation - Tax calculation result
 * @param accountCode - Account code
 * @param differenceType - Type of temporary difference
 * @param taxRate - Applicable tax rate
 * @returns Temporary difference
 * 
 * @example
 * ```typescript
 * const tempDiff = createTemporaryDifferenceFromTax(taxResult, '4000', 'taxable_temporary_difference', 0.25);
 * ```
 */
export function createTemporaryDifferenceFromTax(
  taxCalculation: TaxCalculationResult,
  accountCode: string,
  differenceType: TemporaryDifferenceType,
  taxRate: number
): TemporaryDifference {
  // Calculate carrying amount and tax base
  const carryingAmount = taxCalculation.grossAmount;
  const taxBase = taxCalculation.netAmount;
  const differenceAmount = carryingAmount - taxBase;

  return {
    differenceId: `temp-diff-${accountCode}-${Date.now()}`,
    accountCode,
    differenceType,
    carryingAmount,
    taxBase,
    differenceAmount,
    currency: 'MYR', // Default currency from SSOT
    reversalDate: undefined, // Would be calculated based on business rules
    taxRate,
    deferredTaxAmount: differenceAmount * taxRate
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR DEFERRED TAX INTEGRATION
// ============================================================================

/**
 * Generate deferred tax journal entry
 * 
 * @param temporaryDifference - Temporary difference
 * @param deferredTaxAsset - Deferred tax asset amount
 * @param deferredTaxLiability - Deferred tax liability amount
 * @param taxRate - Tax rate
 * @returns Journal entry
 */
function generateDeferredTaxJournalEntry(
  temporaryDifference: TemporaryDifference,
  deferredTaxAsset: number,
  deferredTaxLiability: number,
  _taxRate: number
): JournalEntry {
  const lines: JournalLine[] = [];

  // Add deferred tax asset line if applicable
  if (deferredTaxAsset > 0) {
    lines.push({
      id: `dt-asset-line-${temporaryDifference.differenceId}`,
      accountCode: 'DEFERRED-TAX-ASSET',
      description: `Deferred tax asset: ${temporaryDifference.accountCode}`,
      debit: deferredTaxAsset,
      credit: 0,
      currency: temporaryDifference.currency
    });

    lines.push({
      id: `dt-asset-offset-line-${temporaryDifference.differenceId}`,
      accountCode: temporaryDifference.accountCode,
      description: `Deferred tax asset offset`,
      debit: 0,
      credit: deferredTaxAsset,
      currency: temporaryDifference.currency
    });
  }

  // Add deferred tax liability line if applicable
  if (deferredTaxLiability > 0) {
    lines.push({
      id: `dt-liability-line-${temporaryDifference.differenceId}`,
      accountCode: temporaryDifference.accountCode,
      description: `Deferred tax liability: ${temporaryDifference.accountCode}`,
      debit: deferredTaxLiability,
      credit: 0,
      currency: temporaryDifference.currency
    });

    lines.push({
      id: `dt-liability-offset-line-${temporaryDifference.differenceId}`,
      accountCode: 'DEFERRED-TAX-LIABILITY',
      description: `Deferred tax liability offset`,
      debit: 0,
      credit: deferredTaxLiability,
      currency: temporaryDifference.currency
    });
  }

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `deferred-tax-entry-${temporaryDifference.differenceId}`,
    date: new Date(),
    reference: `DT-${temporaryDifference.accountCode}`,
    description: `Deferred tax recognition: ${temporaryDifference.accountCode}`,
    lines,
    totalDebits,
    totalCredits,
    currency: temporaryDifference.currency,
    status: 'draft'
  };
}

/**
 * Generate tax rate change journal entry
 * 
 * @param item - Deferred tax integration item
 * @param oldTaxRate - Old tax rate
 * @param newTaxRate - New tax rate
 * @param impact - Rate change impact
 * @param effectiveDate - Effective date
 * @returns Journal entry
 */
function generateTaxRateChangeJournalEntry(
  item: DeferredTaxIntegration,
  oldTaxRate: number,
  newTaxRate: number,
  impact: number,
  effectiveDate: Date
): JournalEntry {
  const lines: JournalLine[] = [];

  if (impact > 0) {
    // Increase in deferred tax liability or decrease in deferred tax asset
    lines.push({
      id: `rate-change-line-1-${item.integrationId}`,
      accountCode: item.temporaryDifference.accountCode,
      description: `Tax rate change adjustment: ${(oldTaxRate * 100).toFixed(2)}% → ${(newTaxRate * 100).toFixed(2)}%`,
      debit: impact,
      credit: 0,
      currency: item.currency
    });

    lines.push({
      id: `rate-change-line-2-${item.integrationId}`,
      accountCode: item.deferredTaxAsset > 0 ? 'DEFERRED-TAX-ASSET' : 'DEFERRED-TAX-LIABILITY',
      description: `Tax rate change adjustment offset`,
      debit: 0,
      credit: impact,
      currency: item.currency
    });
  } else {
    // Decrease in deferred tax liability or increase in deferred tax asset
    lines.push({
      id: `rate-change-line-1-${item.integrationId}`,
      accountCode: item.deferredTaxAsset > 0 ? 'DEFERRED-TAX-ASSET' : 'DEFERRED-TAX-LIABILITY',
      description: `Tax rate change adjustment: ${(oldTaxRate * 100).toFixed(2)}% → ${(newTaxRate * 100).toFixed(2)}%`,
      debit: Math.abs(impact),
      credit: 0,
      currency: item.currency
    });

    lines.push({
      id: `rate-change-line-2-${item.integrationId}`,
      accountCode: item.temporaryDifference.accountCode,
      description: `Tax rate change adjustment offset`,
      debit: 0,
      credit: Math.abs(impact),
      currency: item.currency
    });
  }

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: `tax-rate-change-entry-${item.integrationId}`,
    date: effectiveDate,
    reference: `TRC-${item.temporaryDifference.accountCode}`,
    description: `Tax rate change adjustment: ${(oldTaxRate * 100).toFixed(2)}% → ${(newTaxRate * 100).toFixed(2)}%`,
    lines,
    totalDebits,
    totalCredits,
    currency: item.currency,
    status: 'draft'
  };
}
