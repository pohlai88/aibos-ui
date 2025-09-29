/**
 * Budget & Variance Utilities - Enterprise Production Ready
 * 
 * Comprehensive budget and forecast variance utilities for statement-level
 * and cost-center variance analysis with allocation and cash-flow integration.
 * 
 * Features:
 * - Budget vs actual variance calculations
 * - Forecast variance analysis
 * - Cost center variance tracking
 * - Statement-level variance reporting
 * - Variance trend analysis
 * - Integration with allocation and cash-flow tools
 * 
 * @example
 * ```typescript
 * import { 
 *   calculateVariance,
 *   analyzeVarianceTrends,
 *   generateVarianceReport,
 *   trackCostCenterVariance
 * } from './budget-variance-utilities';
 * 
 * // Calculate variance
 * const variance = calculateVariance(budgetAmount, actualAmount);
 * 
 * // Analyze trends
 * const trends = analyzeVarianceTrends(varianceHistory);
 * ```
 */

// SSOT imports (consolidated)
import { 
  roundToCurrency,
  type SupportedCurrency
} from './accounting-utilities';
import type { 
  FiscalPeriod
} from './fiscal-period-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Budget details
 */
export interface Budget {
  readonly budgetId: string;
  readonly budgetName: string;
  readonly budgetType: BudgetType;
  readonly fiscalPeriod: FiscalPeriod;
  readonly costCenter?: string;
  readonly accountCode: string;
  readonly budgetAmount: number;
  readonly currency: SupportedCurrency;
  readonly budgetDate: Date;
  readonly approvedBy: string;
  readonly approvedDate: Date;
  readonly status: BudgetStatus;
}

/**
 * Forecast details
 */
export interface Forecast {
  readonly forecastId: string;
  readonly forecastName: string;
  readonly forecastType: ForecastType;
  readonly fiscalPeriod: FiscalPeriod;
  readonly costCenter?: string;
  readonly accountCode: string;
  readonly forecastAmount: number;
  readonly currency: SupportedCurrency;
  readonly forecastDate: Date;
  readonly forecastMethod: ForecastMethod;
  readonly confidenceLevel: ConfidenceLevel;
  readonly status: ForecastStatus;
}

/**
 * Variance calculation
 */
export interface Variance {
  readonly varianceId: string;
  readonly budgetId?: string;
  readonly forecastId?: string;
  readonly actualAmount: number;
  readonly budgetAmount?: number;
  readonly forecastAmount?: number;
  readonly varianceAmount: number;
  readonly variancePercentage: number;
  readonly varianceType: VarianceType;
  readonly currency: SupportedCurrency;
  readonly calculationDate: Date;
  readonly fiscalPeriod: FiscalPeriod;
  readonly costCenter?: string;
  readonly accountCode: string;
}

/**
 * Variance trend analysis
 */
export interface VarianceTrend {
  readonly trendId: string;
  readonly accountCode: string;
  readonly costCenter?: string;
  readonly trendPeriod: number; // months
  readonly trendDirection: TrendDirection;
  readonly averageVariance: number;
  readonly varianceVolatility: number;
  readonly trendStrength: TrendStrength;
  readonly currency: SupportedCurrency;
  readonly analysisDate: Date;
}

/**
 * Variance report
 */
export interface VarianceReport {
  readonly reportId: string;
  readonly reportName: string;
  readonly reportType: ReportType;
  readonly fiscalPeriod: FiscalPeriod;
  readonly reportDate: Date;
  readonly variances: readonly Variance[];
  readonly summary: VarianceSummary;
  readonly recommendations: readonly string[];
  readonly currency: SupportedCurrency;
}

/**
 * Variance summary
 */
export interface VarianceSummary {
  readonly totalBudgetVariance: number;
  readonly totalForecastVariance: number;
  readonly favorableVarianceCount: number;
  readonly unfavorableVarianceCount: number;
  readonly significantVarianceCount: number;
  readonly averageVariancePercentage: number;
  readonly currency: SupportedCurrency;
}

/**
 * Cost center variance
 */
export interface CostCenterVariance {
  readonly costCenterId: string;
  readonly costCenterName: string;
  readonly fiscalPeriod: FiscalPeriod;
  readonly totalBudget: number;
  readonly totalActual: number;
  readonly totalVariance: number;
  readonly variancePercentage: number;
  readonly accountVariances: readonly Variance[];
  readonly currency: SupportedCurrency;
  readonly analysisDate: Date;
}

/**
 * Budget types
 */
export type BudgetType = 
  | 'annual_budget'
  | 'quarterly_budget'
  | 'monthly_budget'
  | 'project_budget'
  | 'department_budget'
  | 'capital_budget'
  | 'operational_budget';

/**
 * Forecast types
 */
export type ForecastType = 
  | 'revenue_forecast'
  | 'expense_forecast'
  | 'cash_flow_forecast'
  | 'profit_forecast'
  | 'rolling_forecast'
  | 'scenario_forecast';

/**
 * Budget status
 */
export type BudgetStatus = 
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'active'
  | 'closed'
  | 'superseded';

/**
 * Forecast status
 */
export type ForecastStatus = 
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'active'
  | 'superseded';

/**
 * Forecast methods
 */
export type ForecastMethod = 
  | 'historical_average'
  | 'trend_analysis'
  | 'seasonal_adjustment'
  | 'regression_analysis'
  | 'expert_judgment'
  | 'machine_learning';

/**
 * Confidence levels
 */
export type ConfidenceLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

/**
 * Variance types
 */
export type VarianceType = 
  | 'budget_vs_actual'
  | 'forecast_vs_actual'
  | 'budget_vs_forecast'
  | 'prior_period_comparison'
  | 'year_over_year';

/**
 * Trend directions
 */
export type TrendDirection = 
  | 'improving'
  | 'deteriorating'
  | 'stable'
  | 'volatile';

/**
 * Trend strength
 */
export type TrendStrength = 
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very_strong';

/**
 * Report types
 */
export type ReportType = 
  | 'monthly_variance_report'
  | 'quarterly_variance_report'
  | 'annual_variance_report'
  | 'cost_center_variance_report'
  | 'executive_summary_report'
  | 'detailed_variance_report';

// ============================================================================
// VARIANCE CALCULATIONS
// ============================================================================

/**
 * Calculate variance
 * 
 * @param actualAmount - Actual amount
 * @param budgetAmount - Budget amount
 * @param forecastAmount - Forecast amount
 * @param accountCode - Account code
 * @param fiscalPeriod - Fiscal period
 * @param currency - Currency
 * @returns Variance calculation
 * 
 * @example
 * ```typescript
 * const variance = calculateVariance(95000, 100000, 98000, '4000', fiscalPeriod, 'MYR');
 * ```
 */
export function calculateVariance(
  actualAmount: number,
  budgetAmount: number | undefined,
  forecastAmount: number | undefined,
  accountCode: string,
  fiscalPeriod: FiscalPeriod,
  currency: SupportedCurrency,
  costCenter?: string
): Variance {
  // Calculate budget variance
  const budgetVariance = budgetAmount !== undefined ? actualAmount - budgetAmount : 0;
  const budgetVariancePercentage = budgetAmount !== undefined && budgetAmount !== 0
    ? (budgetVariance / budgetAmount) * 100
    : 0;

  // Calculate forecast variance
  const forecastVariance = forecastAmount !== undefined ? actualAmount - forecastAmount : 0;
  const forecastVariancePercentage = forecastAmount !== undefined && forecastAmount !== 0
    ? (forecastVariance / forecastAmount) * 100
    : 0;

  // Determine primary variance type
  let varianceAmount: number;
  let variancePercentage: number;
  let varianceType: VarianceType;

  if (budgetAmount !== undefined) {
    varianceAmount = budgetVariance;
    variancePercentage = budgetVariancePercentage;
    varianceType = 'budget_vs_actual';
  } else if (forecastAmount !== undefined) {
    varianceAmount = forecastVariance;
    variancePercentage = forecastVariancePercentage;
    varianceType = 'forecast_vs_actual';
  } else {
    throw new Error('Either budget amount or forecast amount must be provided');
  }

  return {
    varianceId: `variance-${accountCode}-${Date.now()}`,
    actualAmount: roundToCurrency(actualAmount, currency),
    budgetAmount: budgetAmount !== undefined ? roundToCurrency(budgetAmount, currency) : undefined,
    forecastAmount: forecastAmount !== undefined ? roundToCurrency(forecastAmount, currency) : undefined,
    varianceAmount: roundToCurrency(varianceAmount, currency),
    // Percentages must not use currency rounding (breaks zero-decimal currencies)
    variancePercentage: roundPercent(variancePercentage),
    varianceType,
    currency,
    calculationDate: new Date(),
    fiscalPeriod,
    costCenter,
    accountCode
  } as Variance;
}

/**
 * Analyze variance trends
 * 
 * @param varianceHistory - Historical variance data
 * @param accountCode - Account code
 * @param costCenter - Cost center
 * @param currency - Currency
 * @returns Variance trend analysis
 * 
 * @example
 * ```typescript
 * const trend = analyzeVarianceTrends(varianceHistory, '4000', 'CC001', 'MYR');
 * ```
 */
export function analyzeVarianceTrends(
  varianceHistory: readonly Variance[],
  accountCode: string,
  costCenter: string | undefined,
  currency: SupportedCurrency
): VarianceTrend {
  if (varianceHistory.length < 2) {
    throw new Error('At least 2 variance records required for trend analysis');
  }

  // Calculate average variance
  const averageVariance = varianceHistory.reduce(
    (sum, variance) => sum + variance.varianceAmount,
    0
  ) / varianceHistory.length;

  // Calculate variance volatility (standard deviation)
  const varianceValues = varianceHistory.map(v => v.varianceAmount);
  const mean = averageVariance;
  const varianceSum = varianceValues.reduce(
    (sum, value) => sum + Math.pow(value - mean, 2),
    0
  );
  const varianceVolatility = Math.sqrt(varianceSum / varianceValues.length);

  // Determine trend direction
  const trendDirection = determineTrendDirection(varianceHistory);

  // Calculate trend strength
  const trendStrength = calculateTrendStrength(varianceHistory);

  return {
    trendId: `trend-${accountCode}-${Date.now()}`,
    accountCode,
    costCenter,
    trendPeriod: varianceHistory.length,
    trendDirection,
    averageVariance: roundToCurrency(averageVariance, currency),
    varianceVolatility: roundToCurrency(varianceVolatility, currency),
    trendStrength,
    currency,
    analysisDate: new Date()
  } as VarianceTrend;
}

// ============================================================================
// VARIANCE REPORTING
// ============================================================================

/**
 * Generate variance report
 * 
 * @param variances - Variance data
 * @param reportName - Report name
 * @param reportType - Report type
 * @param fiscalPeriod - Fiscal period
 * @param currency - Currency
 * @returns Variance report
 * 
 * @example
 * ```typescript
 * const report = generateVarianceReport(variances, 'Monthly Variance Report', 'monthly_variance_report', fiscalPeriod, 'MYR');
 * ```
 */
export function generateVarianceReport(
  variances: readonly Variance[],
  reportName: string,
  reportType: ReportType,
  fiscalPeriod: FiscalPeriod,
  currency: SupportedCurrency
): VarianceReport {
  // Calculate summary statistics
  const summary = calculateVarianceSummary(variances, currency);

  // Generate recommendations
  const recommendations = generateVarianceRecommendations(variances, summary);

  return {
    reportId: `report-${reportType}-${Date.now()}`,
    reportName,
    reportType,
    fiscalPeriod,
    reportDate: new Date(),
    variances,
    summary,
    recommendations,
    currency
  };
}

/**
 * Track cost center variance
 * 
 * @param costCenterId - Cost center ID
 * @param costCenterName - Cost center name
 * @param variances - Account variances
 * @param fiscalPeriod - Fiscal period
 * @param currency - Currency
 * @returns Cost center variance
 * 
 * @example
 * ```typescript
 * const ccVariance = trackCostCenterVariance('CC001', 'Sales Department', variances, fiscalPeriod, 'MYR');
 * ```
 */
export function trackCostCenterVariance(
  costCenterId: string,
  costCenterName: string,
  variances: readonly Variance[],
  fiscalPeriod: FiscalPeriod,
  currency: SupportedCurrency
): CostCenterVariance {
  // Calculate totals
  const totalBudget = variances.reduce(
    (sum, variance) => sum + (variance.budgetAmount || 0),
    0
  );
  const totalActual = variances.reduce(
    (sum, variance) => sum + variance.actualAmount,
    0
  );
  const totalVariance = totalActual - totalBudget;
  const variancePercentage = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;

  return {
    costCenterId,
    costCenterName,
    fiscalPeriod,
    totalBudget: roundToCurrency(totalBudget, currency),
    totalActual: roundToCurrency(totalActual, currency),
    totalVariance: roundToCurrency(totalVariance, currency),
    variancePercentage: roundPercent(variancePercentage),
    accountVariances: variances,
    currency,
    analysisDate: new Date()
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine trend direction
 * 
 * @param varianceHistory - Variance history
 * @returns Trend direction
 */
function determineTrendDirection(varianceHistory: readonly Variance[]): TrendDirection {
  if (varianceHistory.length < 3) return 'stable';

  // Calculate trend slope
  const n = varianceHistory.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = varianceHistory.map(v => v.varianceAmount);

  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i]!, 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Determine direction based on slope
  if (slope > 0.1) return 'deteriorating';
  if (slope < -0.1) return 'improving';
  return 'stable';
}

/**
 * Calculate trend strength
 * 
 * @param varianceHistory - Variance history
 * @returns Trend strength
 */
function calculateTrendStrength(varianceHistory: readonly Variance[]): TrendStrength {
  if (varianceHistory.length < 3) return 'weak';

  // Calculate R-squared for trend strength
  const n = varianceHistory.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = varianceHistory.map(v => v.varianceAmount);

  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i]!, 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssRes = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i]! + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);

  const rSquared = 1 - (ssRes / ssTot);

  // Determine strength based on R-squared
  if (rSquared >= 0.8) return 'very_strong';
  if (rSquared >= 0.6) return 'strong';
  if (rSquared >= 0.4) return 'moderate';
  return 'weak';
}

/**
 * Calculate variance summary
 * 
 * @param variances - Variance data
 * @param currency - Currency
 * @returns Variance summary
 */
function calculateVarianceSummary(
  variances: readonly Variance[],
  currency: SupportedCurrency
): VarianceSummary {
  const totalBudgetVariance = variances.reduce(
    (sum, variance) => sum + (variance.budgetAmount ? variance.varianceAmount : 0),
    0
  );
  const totalForecastVariance = variances.reduce(
    (sum, variance) => sum + (variance.forecastAmount ? variance.varianceAmount : 0),
    0
  );

  const favorableVarianceCount = variances.filter(v => v.varianceAmount < 0).length;
  const unfavorableVarianceCount = variances.filter(v => v.varianceAmount > 0).length;
  const significantVarianceCount = variances.filter(v => Math.abs(v.variancePercentage) > 10).length;

  const averageVariancePercentage = variances.length > 0
    ? variances.reduce((sum, v) => sum + Math.abs(v.variancePercentage), 0) / variances.length
    : 0;

  return {
    totalBudgetVariance: roundToCurrency(totalBudgetVariance, currency),
    totalForecastVariance: roundToCurrency(totalForecastVariance, currency),
    favorableVarianceCount,
    unfavorableVarianceCount,
    significantVarianceCount,
    averageVariancePercentage: roundPercent(averageVariancePercentage),
    currency
  };
}

/**
 * Generate variance recommendations
 * 
 * @param variances - Variance data
 * @param summary - Variance summary
 * @returns Recommendations
 */
function generateVarianceRecommendations(
  variances: readonly Variance[],
  summary: VarianceSummary
): readonly string[] {
  const recommendations: string[] = [];

  // Significant variance recommendations
  if (summary.significantVarianceCount > 0) {
    recommendations.push(`Address ${summary.significantVarianceCount} significant variances (>10%)`);
  }

  // Favorable vs unfavorable variance recommendations
  if (summary.unfavorableVarianceCount > summary.favorableVarianceCount) {
    recommendations.push('Focus on reducing unfavorable variances');
  } else if (summary.favorableVarianceCount > summary.unfavorableVarianceCount) {
    recommendations.push('Investigate causes of favorable variances');
  }

  // High average variance percentage
  if (summary.averageVariancePercentage > 15) {
    recommendations.push('Improve budget accuracy and forecasting methods');
  }

  // Specific account recommendations
  const highVarianceAccounts = variances.filter(v => Math.abs(v.variancePercentage) > 20);
  if (highVarianceAccounts.length > 0) {
    recommendations.push(`Review high-variance accounts: ${highVarianceAccounts.map(v => v.accountCode).join(', ')}`);
  }

  // General recommendations
  recommendations.push('Implement regular variance monitoring');
  recommendations.push('Update forecasting models based on historical performance');

  return recommendations;
}

// ============================================================================
// LOCAL HELPERS
// ============================================================================

/**
 * Round a percentage value (e.g., 12.3456 → 12.35).
 * Always uses fixed decimal precision independent of currency.
 */
function roundPercent(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return value;
  const factor = Math.pow(10, Math.max(0, Math.min(8, decimals)));
  return Math.round(value * factor) / factor;
}
