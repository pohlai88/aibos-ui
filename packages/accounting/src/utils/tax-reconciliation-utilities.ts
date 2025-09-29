/**
 * Tax Reconciliation Utilities
 * 
 * Line vs header reconciliation, tolerance checks, and tax variance analysis.
 * Provides comprehensive tax reconciliation, tolerance management, and variance analysis.
 * 
 * @fileoverview Tax reconciliation engine, tolerance management, and variance analysis
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import type { ValidationIssue, BusinessValidationResult } from './validation-utilities';
import type { FiscalPeriod } from './fiscal-period-utilities';
import type { TaxLine, TaxSummary, TaxVariance } from './tax-core-utilities';

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

// Centralized thresholds (can be externalized to policy config)
const THRESHOLDS = Object.freeze({
  low: 1,
  medium: 10,
  high: 100,
});

// Pluggable ID generator (use your ULID/UUID SSOT if available)
function generateId(prefix: string): string {
   
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

// Safe percentage (avoids NaN/Infinity)
function pct(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : (numerator / denominator) * 100;
}

// Map numeric amount to severity/risk buckets
function bucketize(amount: number): { severity: ExceptionSeverity; impact: VarianceImpact } {
  if (amount < THRESHOLDS.low) return { severity: 'low', impact: 'low' };
  if (amount < THRESHOLDS.medium) return { severity: 'medium', impact: 'medium' };
  if (amount < THRESHOLDS.high) return { severity: 'high', impact: 'high' };
  return { severity: 'critical', impact: 'critical' };
}

// Pick an active tolerance rule by tax type & date (highest priority by method specificity)
export function pickToleranceRule(
  rules: ToleranceRule[] | undefined,
  taxType: TaxType,
  asOf: Date = new Date(),
): ToleranceRule | undefined {
  if (!rules?.length) return undefined;
  return rules
    .filter(r =>
      r.active &&
      r.taxType === taxType &&
      r.effectiveDate <= asOf &&
      (!(r as unknown).expiryDate || (r as unknown).expiryDate >= asOf))
    // simple prioritization: progressive > sliding > fixed
    .sort((a, b) => {
      const rank = (m: ToleranceMethod) => (m === 'progressive' ? 3 : m === 'sliding' ? 2 : 1);
      return rank(b.method) - rank(a.method);
    })[0];
}

// Compute tolerance value given amount + rule method
function computeToleranceValue(amount: number, rule: ToleranceRule): number {
  switch (rule.toleranceType) {
    case 'absolute':
      return rule.value;
    case 'percentage':
      return Math.abs(amount) * (rule.value / 100);
    case 'relative':
      return Math.abs(amount) * rule.value;
  }
}

// Sliding/progressive envelope (illustrative, tweak as needed)
function adjustForMethod(baseTol: number, amount: number, rule: ToleranceRule): number {
  if (rule.method === 'fixed') return baseTol;
  if (rule.method === 'sliding') {
    // widen tolerance gently with size of amount
    return baseTol * (1 + Math.min(0.5, Math.log10(Math.max(1, Math.abs(amount))) * 0.1));
  }
  // progressive: step up at magnitude thresholds
  const abs = Math.abs(amount);
  const factor =
    abs >= THRESHOLDS.high ? 1.5 :
    abs >= THRESHOLDS.medium ? 1.25 :
    abs >= THRESHOLDS.low ? 1.1 : 1;
  return baseTol * factor;
}

// Core helper: compare actual vs expected using a tolerance rule
export function compareWithTolerance(
  actual: number,
  expected: number,
  rule?: ToleranceRule,
): ToleranceResult {
  const difference = Math.abs(actual - expected);
  if (!rule) {
    return {
      amount: actual,
      tolerance: 0,
      withinTolerance: difference === 0,
      difference,
      // Provide a neutral rule when absent
      rule: {
        id: 'TOL-NONE',
        taxType: 'vat',
        toleranceType: 'absolute',
        value: 0,
        method: 'fixed',
        active: true,
        effectiveDate: new Date(0),
      },
    };
  }
  const base = computeToleranceValue(expected === 0 ? actual : expected, rule);
  const tolerance = adjustForMethod(base, expected, rule);
  return {
    amount: actual,
    tolerance,
    withinTolerance: difference <= tolerance,
    difference,
    rule,
  };
}

/**
 * Reconcile tax lines
 */
export function reconcileTaxLines(
  lines: TaxLine[],
  header: TaxSummary,
  tolerance: number = 0.01,
  toleranceRules?: ToleranceRule[],
  taxTypeForRules: TaxType = 'vat',
  asOf: Date = new Date()
): ReconciliationResult {
  const lineTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0);
  const headerTotal = header.totalTaxAmount;
  const difference = Math.abs(lineTotal - headerTotal);

  // Prefer rule by taxType (fallback to numeric tolerance)
  const rule = pickToleranceRule(toleranceRules, taxTypeForRules, asOf);
  const tol = rule
    ? compareWithTolerance(lineTotal, headerTotal, rule)
    : { withinTolerance: difference <= tolerance, tolerance, difference, amount: lineTotal, rule: defineToleranceRule(taxTypeForRules, 'absolute', tolerance, 'fixed') } as ToleranceResult;
  const withinTolerance = tol.withinTolerance;
  
  const variances: TaxVariance[] = [];
  const exceptions: ReconciliationException[] = [];
  
  if (!withinTolerance) {
    const { severity, impact } = bucketize(difference);
    variances.push({
      id: generateId('VAR'),
      type: 'calculation',
      amount: difference,
      percentage: pct(difference, headerTotal),
      cause: 'Line total does not match header total',
      impact,
    });
    
    exceptions.push({
      id: generateId('EXC'),
      type: 'calculation_error',
      description: `Tax reconciliation failed. Difference: ${difference}`,
      amount: difference,
      severity,
      resolution: 'Review line calculations and header totals',
      resolved: false,
    });
  }
  
  // Check for rounding differences
  if ((header as unknown).roundingDifference && (header as unknown).roundingDifference !== 0) {
    const rd = Math.abs((header as unknown).roundingDifference as number);
    variances.push({
      id: generateId('VAR-ROUNDING'),
      type: 'rounding',
      amount: rd,
      percentage: pct(rd, headerTotal),
      cause: 'Rounding difference in header',
      impact: bucketize(rd).impact,
    });
  }
  
  return {
    isReconciled: withinTolerance,
    lineTotal,
    headerTotal,
    difference: tol.difference ?? difference,
    withinTolerance,
    tolerance: rule ? tol.tolerance : tolerance,
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
  tolerance: number = 0.01,
  toleranceRules?: ToleranceRule[],
  taxTypeForRules: TaxType = 'vat',
  asOf: Date = new Date()
): PeriodReconciliationResult {
  const currentTotal = currentPeriod.totalTax;
  const priorTotal = priorPeriod.totalTax;
  const difference = Math.abs(currentTotal - priorTotal);
  const rule = pickToleranceRule(toleranceRules, taxTypeForRules, asOf);
  const tol = rule
    ? compareWithTolerance(currentTotal, priorTotal, rule)
    : { withinTolerance: difference <= tolerance, tolerance, difference, amount: currentTotal, rule: defineToleranceRule(taxTypeForRules, 'absolute', tolerance, 'fixed') } as ToleranceResult;
  const withinTolerance = tol.withinTolerance;
  
  const variances: TaxVariance[] = [];
  const exceptions: ReconciliationException[] = [];
  
  if (!withinTolerance) {
    const { severity, impact } = bucketize(difference);
    variances.push({
      id: generateId('VAR-PERIOD'),
      type: 'timing',
      amount: difference,
      percentage: pct(difference, priorTotal),
      cause: 'Period-to-period variance detected',
      impact,
    });
    
    exceptions.push({
      id: generateId('EXC-PERIOD'),
      type: 'timing_difference',
      description: `Period reconciliation failed. Difference: ${difference}`,
      amount: difference,
      severity,
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
    difference: tol.difference ?? difference,
    withinTolerance,
    tolerance: rule ? tol.tolerance : tolerance,
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
  tolerance: number = 0.01,
  expectedAmount?: number,
  toleranceRules?: ToleranceRule[],
  taxTypeForRules: TaxType = 'vat',
  asOf: Date = new Date()
): AccountReconciliationResult {
  const totalAmount = accounts.reduce((sum, account) => sum + account.balance, 0);
  const expected = typeof expectedAmount === 'number' ? expectedAmount : totalAmount;
  const difference = Math.abs(totalAmount - expected);
  const rule = pickToleranceRule(toleranceRules, taxTypeForRules, asOf);
  const tol = rule
    ? compareWithTolerance(totalAmount, expected, rule)
    : { withinTolerance: difference <= tolerance, tolerance, difference, amount: totalAmount, rule: defineToleranceRule(taxTypeForRules, 'absolute', tolerance, 'fixed') } as ToleranceResult;
  const withinTolerance = tol.withinTolerance;
  
  const variances: TaxVariance[] = [];
  const exceptions: ReconciliationException[] = [];
  
  if (!withinTolerance) {
    const { severity, impact } = bucketize(difference);
    variances.push({
      id: generateId('VAR-ACCOUNT'),
      type: 'classification',
      amount: difference,
      percentage: pct(difference, expected),
      cause: 'Account balance variance detected',
      impact,
    });
    
    exceptions.push({
      id: generateId('EXC-ACCOUNT'),
      type: 'classification_error',
      description: `Account reconciliation failed. Difference: ${difference}`,
      amount: difference,
      severity,
      resolution: 'Review account classifications and balances',
      resolved: false,
    });
  }
  
  return {
    accounts,
    period,
    isReconciled: withinTolerance,
    totalAmount,
    expectedAmount: expected,
    difference: tol.difference ?? difference,
    withinTolerance,
    tolerance: rule ? tol.tolerance : tolerance,
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
  const base = computeToleranceValue(amount, tolerance);
  const toleranceValue = adjustForMethod(base, amount, tolerance);
  return {
    amount,
    tolerance: toleranceValue,
    // NOTE: callers should still determine withinTolerance/difference
    withinTolerance: false,
    difference: 0,
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
  const tr = compareWithTolerance(amount, expected, tolerance);
  const difference = tr.difference;
  const withinTolerance = tr.withinTolerance;
  
  const issues: ValidationIssue[] = [];
  
  if (!withinTolerance) {
    issues.push({
      code: 'RANGE',
      path: 'amount',
      message: `Amount exceeds tolerance. Difference: ${difference}, Tolerance: ${tr.tolerance}`,
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
        percentage: pct(averageAmount, variance.amount),
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
  if (variance.amount < THRESHOLDS.low) return 'none';
  if (variance.amount < THRESHOLDS.medium) return 'minor';
  if (variance.amount < THRESHOLDS.high) return 'major';
  return 'critical';
}

/**
 * Determine operational impact
 */
function determineOperationalImpact(variance: TaxVariance): OperationalImpact {
  if (variance.amount < THRESHOLDS.low) return 'none';
  if (variance.amount < THRESHOLDS.medium) return 'minor';
  if (variance.amount < THRESHOLDS.high) return 'major';
  return 'critical';
}

/**
 * Determine risk level
 */
function determineRiskLevel(variance: TaxVariance): RiskLevel {
  if (variance.amount < THRESHOLDS.low) return 'low';
  if (variance.amount < THRESHOLDS.medium) return 'medium';
  if (variance.amount < THRESHOLDS.high) return 'high';
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
