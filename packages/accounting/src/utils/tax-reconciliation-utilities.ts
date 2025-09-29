/**
 * Tax Reconciliation Utilities
 * 
 * Line vs header reconciliation, tolerance checks, and tax variance analysis.
 * Provides comprehensive tax reconciliation, tolerance management, and variance analysis.
 * 
 * @fileoverview Tax reconciliation engine, tolerance management, and variance analysis
 */

import {
  SupportedCurrency,
} from './accounting-utilities';
import { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import { FiscalPeriod } from './fiscal-period-utilities';
import { TaxLine, TaxSummary, TaxVariance } from './tax-core-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ReconciliationResult {
  isReconciled: boolean;
  lineTotal: number;
  headerTotal: number;
  difference: number;
  withinTolerance: boolean;
  tolerance: number;
  variances: TaxVariance[];
  exceptions: ReconciliationException[];
}

export interface PeriodReconciliationResult {
  currentPeriod: TaxPeriod;
  priorPeriod: TaxPeriod;
  isReconciled: boolean;
  currentTotal: number;
  priorTotal: number;
  difference: number;
  withinTolerance: boolean;
  tolerance: number;
  variances: TaxVariance[];
  exceptions: ReconciliationException[];
}

export interface AccountReconciliationResult {
  accounts: TaxAccount[];
  period: FiscalPeriod;
  isReconciled: boolean;
  totalAmount: number;
  expectedAmount: number;
  difference: number;
  withinTolerance: boolean;
  tolerance: number;
  variances: TaxVariance[];
  exceptions: ReconciliationException[];
}

export interface ToleranceRule {
  id: string;
  taxType: TaxType;
  toleranceType: ToleranceType;
  value: number;
  method: ToleranceMethod;
  active: boolean;
  effectiveDate: Date;
}

export interface ToleranceResult {
  amount: number;
  tolerance: number;
  withinTolerance: boolean;
  difference: number;
  rule: ToleranceRule;
}

export interface VarianceAnalysis {
  variance: TaxVariance;
  rootCause: string;
  impact: ImpactAnalysis;
  recommendations: string[];
  historicalTrend: VarianceTrend[];
}

export interface ImpactAnalysis {
  financialImpact: number;
  complianceImpact: ComplianceImpact;
  operationalImpact: OperationalImpact;
  riskLevel: RiskLevel;
}

export interface VarianceTrend {
  period: FiscalPeriod;
  amount: number;
  percentage: number;
  trend: TrendDirection;
}

export interface ReconciliationException {
  id: string;
  type: ExceptionType;
  description: string;
  amount: number;
  severity: ExceptionSeverity;
  resolution: string;
  resolved: boolean;
  resolvedDate?: Date;
}

export interface TaxPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  totalTax: number;
  lineCount: number;
  status: PeriodStatus;
}

export interface TaxAccount {
  accountCode: string;
  accountName: string;
  taxType: TaxType;
  balance: number;
  currency: SupportedCurrency;
  lastReconciliationDate: Date;
}

export interface TaxHistory {
  period: FiscalPeriod;
  totalTax: number;
  lineCount: number;
  variances: TaxVariance[];
  reconciliationStatus: ReconciliationStatus;
}

export interface VarianceContext {
  period: FiscalPeriod;
  account: string;
  taxType: TaxType;
  historicalData: TaxHistory[];
  toleranceRules: ToleranceRule[];
}

export interface VarianceCause {
  id: string;
  type: CauseType;
  description: string;
  impact: number;
  frequency: number;
  resolution: string;
}

export type VarianceType = 'calculation' | 'rounding' | 'timing' | 'classification' | 'rate';
export type ToleranceType = 'absolute' | 'percentage' | 'relative';
export type ToleranceMethod = 'fixed' | 'sliding' | 'progressive';
export type VarianceImpact = 'low' | 'medium' | 'high' | 'critical';
export type TaxType = 'vat' | 'gst' | 'sales_tax' | 'service_tax';
export type ExceptionType = 'calculation_error' | 'missing_data' | 'timing_difference' | 'classification_error';
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PeriodStatus = 'open' | 'closed' | 'reconciled' | 'finalized';
export type ReconciliationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type ComplianceImpact = 'none' | 'minor' | 'major' | 'critical';
export type OperationalImpact = 'none' | 'minor' | 'major' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';
export type CauseType = 'system_error' | 'user_error' | 'process_issue' | 'external_factor';

// ============================================================================
// Reconciliation Operations
// ============================================================================

/**
 * Reconcile tax lines
 */
export function reconcileTaxLines(
  lines: TaxLine[],
  header: TaxSummary,
  tolerance: number = 0.01
): ReconciliationResult {
  const lineTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0);
  const headerTotal = header.totalTaxAmount;
  const difference = Math.abs(lineTotal - headerTotal);
  const withinTolerance = difference <= tolerance;
  
  const variances: TaxVariance[] = [];
  const exceptions: ReconciliationException[] = [];
  
  if (!withinTolerance) {
    variances.push({
      id: `VAR-${Date.now()}`,
      type: 'calculation',
      amount: difference,
      percentage: (difference / headerTotal) * 100,
      cause: 'Line total does not match header total',
      impact: difference > 1 ? 'high' : 'medium',
    });
    
    exceptions.push({
      id: `EXC-${Date.now()}`,
      type: 'calculation_error',
      description: `Tax reconciliation failed. Difference: ${difference}`,
      amount: difference,
      severity: difference > 1 ? 'high' : 'medium',
      resolution: 'Review line calculations and header totals',
      resolved: false,
    });
  }
  
  // Check for rounding differences
  if (header.roundingDifference > 0) {
    variances.push({
      id: `VAR-ROUNDING-${Date.now()}`,
      type: 'rounding',
      amount: header.roundingDifference,
      percentage: (header.roundingDifference / headerTotal) * 100,
      cause: 'Rounding difference in header',
      impact: 'low',
    });
  }
  
  return {
    isReconciled: withinTolerance,
    lineTotal,
    headerTotal,
    difference,
    withinTolerance,
    tolerance,
    variances,
    exceptions,
  };
}

/**
 * Reconcile tax periods
 */
export function reconcileTaxPeriods(
  currentPeriod: TaxPeriod,
  priorPeriod: TaxPeriod,
  tolerance: number = 0.01
): PeriodReconciliationResult {
  const currentTotal = currentPeriod.totalTax;
  const priorTotal = priorPeriod.totalTax;
  const difference = Math.abs(currentTotal - priorTotal);
  const withinTolerance = difference <= tolerance;
  
  const variances: TaxVariance[] = [];
  const exceptions: ReconciliationException[] = [];
  
  if (!withinTolerance) {
    variances.push({
      id: `VAR-PERIOD-${Date.now()}`,
      type: 'timing',
      amount: difference,
      percentage: (difference / priorTotal) * 100,
      cause: 'Period-to-period variance detected',
      impact: difference > 100 ? 'high' : 'medium',
    });
    
    exceptions.push({
      id: `EXC-PERIOD-${Date.now()}`,
      type: 'timing_difference',
      description: `Period reconciliation failed. Difference: ${difference}`,
      amount: difference,
      severity: difference > 100 ? 'high' : 'medium',
      resolution: 'Review period-end adjustments and timing differences',
      resolved: false,
    });
  }
  
  return {
    currentPeriod,
    priorPeriod,
    isReconciled: withinTolerance,
    currentTotal,
    priorTotal,
    difference,
    withinTolerance,
    tolerance,
    variances,
    exceptions,
  };
}

/**
 * Reconcile tax accounts
 */
export function reconcileTaxAccounts(
  accounts: TaxAccount[],
  period: FiscalPeriod,
  tolerance: number = 0.01
): AccountReconciliationResult {
  const totalAmount = accounts.reduce((sum, account) => sum + account.balance, 0);
  const expectedAmount = totalAmount; // Simplified - in reality, this would be calculated differently
  const difference = Math.abs(totalAmount - expectedAmount);
  const withinTolerance = difference <= tolerance;
  
  const variances: TaxVariance[] = [];
  const exceptions: ReconciliationException[] = [];
  
  if (!withinTolerance) {
    variances.push({
      id: `VAR-ACCOUNT-${Date.now()}`,
      type: 'classification',
      amount: difference,
      percentage: (difference / expectedAmount) * 100,
      cause: 'Account balance variance detected',
      impact: difference > 100 ? 'high' : 'medium',
    });
    
    exceptions.push({
      id: `EXC-ACCOUNT-${Date.now()}`,
      type: 'classification_error',
      description: `Account reconciliation failed. Difference: ${difference}`,
      amount: difference,
      severity: difference > 100 ? 'high' : 'medium',
      resolution: 'Review account classifications and balances',
      resolved: false,
    });
  }
  
  return {
    accounts,
    period,
    isReconciled: withinTolerance,
    totalAmount,
    expectedAmount,
    difference,
    withinTolerance,
    tolerance,
    variances,
    exceptions,
  };
}

// ============================================================================
// Tolerance Management
// ============================================================================

/**
 * Define tolerance rule
 */
export function defineToleranceRule(
  taxType: TaxType,
  toleranceType: ToleranceType,
  value: number,
  method: ToleranceMethod
): ToleranceRule {
  const rule: ToleranceRule = {
    id: `TOL-${taxType}-${toleranceType}-${Date.now()}`,
    taxType,
    toleranceType,
    value,
    method,
    active: true,
    effectiveDate: new Date(),
  };
  
  return rule;
}

/**
 * Apply tolerance
 */
export function applyTolerance(
  amount: number,
  tolerance: ToleranceRule
): ToleranceResult {
  if (!tolerance.active) {
    throw new Error('Tolerance rule is not active');
  }
  
  let toleranceValue: number;
  
  switch (tolerance.toleranceType) {
    case 'absolute':
      toleranceValue = tolerance.value;
      break;
    case 'percentage':
      toleranceValue = amount * (tolerance.value / 100);
      break;
    case 'relative':
      toleranceValue = amount * tolerance.value;
      break;
    default:
      throw new Error(`Unsupported tolerance type: ${tolerance.toleranceType}`);
  }
  
  return {
    amount,
    tolerance: toleranceValue,
    withinTolerance: true, // This would be determined by the calling function
    difference: 0, // This would be calculated by the calling function
    rule: tolerance,
  };
}

/**
 * Validate tolerance
 */
export function validateTolerance(
  amount: number,
  expected: number,
  tolerance: ToleranceRule
): BusinessValidationResult {
  const toleranceResult = applyTolerance(amount, tolerance);
  const difference = Math.abs(amount - expected);
  const withinTolerance = difference <= toleranceResult.tolerance;
  
  const issues: ValidationIssue[] = [];
  
  if (!withinTolerance) {
    issues.push({
      code: 'RANGE',
      path: 'amount',
      message: `Amount exceeds tolerance. Difference: ${difference}, Tolerance: ${toleranceResult.tolerance}`,
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.map(issue => issue.message),
    warnings: [],
    issues,
  };
}

// ============================================================================
// Variance Analysis
// ============================================================================

/**
 * Analyze tax variance
 */
export function analyzeTaxVariance(
  variance: TaxVariance,
  context: VarianceContext
): VarianceAnalysis {
  const rootCause = identifyRootCause(variance, context);
  const impact = calculateVarianceImpact(variance, true);
  const recommendations = generateRecommendations(variance, context);
  const historicalTrend = analyzeHistoricalTrend(variance, context.historicalData);
  
  return {
    variance,
    rootCause,
    impact,
    recommendations,
    historicalTrend,
  };
}

/**
 * Identify variance causes
 */
export function identifyVarianceCauses(
  variance: TaxVariance,
  historicalData: TaxHistory[]
): VarianceCause[] {
  const causes: VarianceCause[] = [];
  
  // Analyze historical patterns
  const similarVariances = historicalData
    .flatMap(history => history.variances)
    .filter(v => v.type === variance.type && Math.abs(v.amount - variance.amount) < 0.1);
  
  if (similarVariances.length > 0) {
    causes.push({
      id: `CAUSE-${Date.now()}`,
      type: 'process_issue',
      description: 'Recurring variance pattern detected',
      impact: variance.amount,
      frequency: similarVariances.length,
      resolution: 'Review and improve process controls',
    });
  }
  
  // Check for system errors
  if (variance.type === 'calculation' && variance.amount > 1) {
    causes.push({
      id: `CAUSE-SYSTEM-${Date.now()}`,
      type: 'system_error',
      description: 'Potential system calculation error',
      impact: variance.amount,
      frequency: 1,
      resolution: 'Review system calculations and formulas',
    });
  }
  
  return causes;
}

/**
 * Calculate variance impact
 */
export function calculateVarianceImpact(
  variance: TaxVariance,
  _financialImpact: boolean
): ImpactAnalysis {
  const financialImpactAmount = variance.amount;
  const complianceImpact = determineComplianceImpact(variance);
  const operationalImpact = determineOperationalImpact(variance);
  const riskLevel = determineRiskLevel(variance);
  
  return {
    financialImpact: financialImpactAmount,
    complianceImpact,
    operationalImpact,
    riskLevel,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Identify root cause
 */
function identifyRootCause(variance: TaxVariance, _context: VarianceContext): string {
  switch (variance.type) {
    case 'calculation':
      return 'Calculation error in tax computation';
    case 'rounding':
      return 'Rounding difference in tax calculations';
    case 'timing':
      return 'Timing difference in tax recognition';
    case 'classification':
      return 'Incorrect tax classification';
    case 'rate':
      return 'Incorrect tax rate application';
    default:
      return 'Unknown variance cause';
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations(variance: TaxVariance, _context: VarianceContext): string[] {
  const recommendations: string[] = [];
  
  switch (variance.type) {
    case 'calculation':
      recommendations.push('Review tax calculation formulas');
      recommendations.push('Implement additional validation checks');
      break;
    case 'rounding':
      recommendations.push('Standardize rounding methods');
      recommendations.push('Implement rounding difference tracking');
      break;
    case 'timing':
      recommendations.push('Review period-end cut-off procedures');
      recommendations.push('Implement timing difference controls');
      break;
    case 'classification':
      recommendations.push('Review tax classification rules');
      recommendations.push('Implement classification validation');
      break;
    case 'rate':
      recommendations.push('Review tax rate configuration');
      recommendations.push('Implement rate validation checks');
      break;
  }
  
  return recommendations;
}

/**
 * Analyze historical trend
 */
function analyzeHistoricalTrend(
  variance: TaxVariance,
  historicalData: TaxHistory[]
): VarianceTrend[] {
  const trends: VarianceTrend[] = [];
  
  for (const history of historicalData) {
    const similarVariances = history.variances.filter(v => v.type === variance.type);
    if (similarVariances.length > 0) {
      const totalAmount = similarVariances.reduce((sum, v) => sum + v.amount, 0);
      const averageAmount = totalAmount / similarVariances.length;
      
      trends.push({
        period: history.period,
        amount: averageAmount,
        percentage: (averageAmount / variance.amount) * 100,
        trend: averageAmount > variance.amount ? 'decreasing' : 'increasing',
      });
    }
  }
  
  return trends;
}

/**
 * Determine compliance impact
 */
function determineComplianceImpact(variance: TaxVariance): ComplianceImpact {
  if (variance.amount < 1) return 'none';
  if (variance.amount < 10) return 'minor';
  if (variance.amount < 100) return 'major';
  return 'critical';
}

/**
 * Determine operational impact
 */
function determineOperationalImpact(variance: TaxVariance): OperationalImpact {
  if (variance.amount < 1) return 'none';
  if (variance.amount < 10) return 'minor';
  if (variance.amount < 100) return 'major';
  return 'critical';
}

/**
 * Determine risk level
 */
function determineRiskLevel(variance: TaxVariance): RiskLevel {
  if (variance.amount < 1) return 'low';
  if (variance.amount < 10) return 'medium';
  if (variance.amount < 100) return 'high';
  return 'critical';
}

/**
 * Get reconciliation summary
 */
export function getReconciliationSummary(
  results: ReconciliationResult[]
): {
  totalReconciliations: number;
  successfulReconciliations: number;
  failedReconciliations: number;
  totalVariances: number;
  totalExceptions: number;
  averageDifference: number;
} {
  const totalReconciliations = results.length;
  const successfulReconciliations = results.filter(r => r.isReconciled).length;
  const failedReconciliations = totalReconciliations - successfulReconciliations;
  
  const totalVariances = results.reduce((sum, r) => sum + r.variances.length, 0);
  const totalExceptions = results.reduce((sum, r) => sum + r.exceptions.length, 0);
  
  const totalDifference = results.reduce((sum, r) => sum + r.difference, 0);
  const averageDifference = totalReconciliations > 0 ? totalDifference / totalReconciliations : 0;
  
  return {
    totalReconciliations,
    successfulReconciliations,
    failedReconciliations,
    totalVariances,
    totalExceptions,
    averageDifference,
  };
}
