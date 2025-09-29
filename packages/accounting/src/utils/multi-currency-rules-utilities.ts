/**
 * Multi-Currency Rules Utilities
 * 
 * Handle base vs transaction vs reporting currency math and validation.
 * Provides comprehensive multi-currency rule management and conversion operations.
 * 
 * @fileoverview Currency hierarchy management, conversion rules, and multi-currency validation
 */

import type {
  SupportedCurrency} from './accounting-utilities';
import {
  CURRENCY_DECIMALS,
  roundToCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import type { ExchangeRate} from './fx-ledger-utilities';
import { getLatestExchangeRate } from './fx-ledger-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CurrencyHierarchy {
  baseCurrency: SupportedCurrency;
  reportingCurrency: SupportedCurrency;
  transactionCurrencies: SupportedCurrency[];
  conversionRules: ConversionRule[];
}

export interface ConversionRule {
  id: string;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  method: ConversionMethod;
  rateSource: RateSource;
  priority: number;
  active: boolean;
}

export interface MultiCurrencyTransaction {
  id: string;
  baseCurrency: SupportedCurrency;
  transactionCurrency: SupportedCurrency;
  reportingCurrency: SupportedCurrency;
  amounts: CurrencyAmount[];
  conversionRates: ExchangeRate[];
}

export interface MultiCurrencyAccount {
  accountCode: string;
  baseCurrency: SupportedCurrency;
  balances: Record<SupportedCurrency, number>;
  lastConversionDate: Date;
  conversionRules: ConversionRule[];
}

export interface CurrencyAmount {
  amount: number;
  currency: SupportedCurrency;
  precision: number;
}

export interface ConversionContext {
  transactionDate: Date;
  rateType: 'mid' | 'buy' | 'sell';
  baseCurrency: SupportedCurrency;
  reportingCurrency: SupportedCurrency;
}

export interface ConversionAuditTrail {
  readonly id: string;
  readonly transactionId: string;
  readonly fromCurrency: SupportedCurrency;
  readonly toCurrency: SupportedCurrency;
  readonly originalAmount: number;
  readonly convertedAmount: number;
  readonly rate: number;
  readonly method: ConversionMethod;
  readonly rateSource: RateSource;
  readonly conversionDate: Date;
  readonly userId?: string;
  readonly costAnalysis?: {
    directCost: number;
    triangulationCost: number;
    recommendedMethod: ConversionMethod;
    costSavings: number;
  };
}

export interface BulkConversionRequest {
  readonly amounts: readonly {
    readonly amount: number;
    readonly fromCurrency: SupportedCurrency;
    readonly toCurrency: SupportedCurrency;
  }[];
  readonly context: ConversionContext;
  readonly options?: {
    readonly auditTrail?: boolean;
    readonly costAnalysis?: boolean;
    readonly preferredMethod?: ConversionMethod;
  };
}

export interface BulkConversionResult {
  readonly conversions: readonly ConversionResult[];
  readonly auditTrail?: readonly ConversionAuditTrail[];
  readonly summary: {
    readonly totalConversions: number;
    readonly successfulConversions: number;
    readonly failedConversions: number;
    readonly totalCostSavings: number;
    readonly averageRate: number;
  };
}

export interface RateMonitoringAlert {
  readonly id: string;
  readonly currencyPair: string;
  readonly currentRate: number;
  readonly thresholdRate: number;
  readonly alertType: 'rate_spike' | 'rate_drop' | 'rate_stability';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly timestamp: Date;
}

export interface CrossRateValidation {
  readonly currencyPair: string;
  readonly directRate: number;
  readonly crossRate: number;
  readonly variance: number;
  readonly variancePercentage: number;
  readonly isValid: boolean;
  readonly tolerance: number;
}

export interface BalanceCheckResult {
  account: MultiCurrencyAccount;
  currency: SupportedCurrency;
  balance: number;
  convertedBalance: number;
  conversionRate: number;
  isBalanced: boolean;
  variance: number;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rate: number;
  method: ConversionMethod;
  precision: number;
  conversionDate: Date;
}

export type ConversionMethod = 'direct' | 'triangulation' | 'cross_rate';
export type RateSource = 'central_bank' | 'market' | 'internal' | 'external';

// ============================================================================
// Internal helpers (non-exported)
// ============================================================================

/**
 * Compute a currency-aware tolerance as ~half a unit in the last place (½ ULP)
 * to avoid false-positive variances due to rounding. Example: MYR (2dp) -> 0.005.
 */
function computeTolerance(currency: SupportedCurrency): number {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const ulp = 1 / Math.pow(10, decimals);
  // half-ulp, rounded to the target currency to avoid FP drift
  const halfUlp = ulp / 2;
  // Use roundToCurrency for consistency with policy
  return roundToCurrency(halfUlp, currency);
}

function isPositiveFinite(n: unknown): n is number {
  return typeof n === 'number' && isFinite(n) && n > 0;
}

/**
 * Get exchange rate with rate source preference
 */
function getExchangeRateWithSource(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rateType: 'mid' | 'buy' | 'sell',
  preferredSource?: RateSource
): ExchangeRate | null {
  // First try preferred source if specified
  if (preferredSource) {
    // This would need to be implemented in fx-ledger-utilities
    // For now, fall back to standard lookup
    const rate = getLatestExchangeRate(fromCurrency, toCurrency, rateType);
    if (rate && rate.source === preferredSource) {
      return rate;
    }
  }
  
  // Fall back to standard lookup
  return getLatestExchangeRate(fromCurrency, toCurrency, rateType);
}

/**
 * Validate triangulation quote direction
 */
function validateTriangulationRates(
  fromToBaseRate: ExchangeRate,
  baseToTargetRate: ExchangeRate,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  baseCurrency: SupportedCurrency
): { isValid: boolean; correctedRate?: number; warning?: string } {
  // Check if rates are in correct direction
  const fromToBaseCorrect = fromToBaseRate.fromCurrency === fromCurrency && 
                           fromToBaseRate.toCurrency === baseCurrency;
  const baseToTargetCorrect = baseToTargetRate.fromCurrency === baseCurrency && 
                              baseToTargetRate.toCurrency === toCurrency;
  
  if (!fromToBaseCorrect || !baseToTargetCorrect) {
    return {
      isValid: false,
      warning: `Rate direction mismatch for triangulation: ${fromCurrency}->${baseCurrency}->${toCurrency}`
    };
  }
  
  // Calculate triangulated rate
  const triangulatedRate = fromToBaseRate.rate * baseToTargetRate.rate;
  
  return {
    isValid: true,
    correctedRate: triangulatedRate
  };
}

/**
 * Calculate conversion cost analysis
 */
function calculateConversionCost(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rates: ExchangeRate[]
): {
  directCost: number;
  triangulationCost: number;
  recommendedMethod: ConversionMethod;
  costSavings: number;
} {
  const directRate = rates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
  const triangulationRates = rates.filter(r => 
    (r.fromCurrency === fromCurrency || r.toCurrency === fromCurrency) ||
    (r.fromCurrency === toCurrency || r.toCurrency === toCurrency)
  );
  
  const directCost = directRate ? amount * directRate.rate : Infinity;
  const triangulationCost = triangulationRates.length >= 2 ? 
    amount * triangulationRates.reduce((acc, rate) => acc * rate.rate, 1) : Infinity;
  
  const recommendedMethod = directCost <= triangulationCost ? 'direct' : 'triangulation';
  const costSavings = Math.abs(directCost - triangulationCost);
  
  return {
    directCost,
    triangulationCost,
    recommendedMethod,
    costSavings
  };
}

// ============================================================================
// Currency Hierarchy Management
// ============================================================================

// Global currency hierarchy
let globalCurrencyHierarchy: CurrencyHierarchy | null = null;

// Global audit trail storage
let conversionAuditTrail: ConversionAuditTrail[] = [];
let rateMonitoringAlerts: RateMonitoringAlert[] = [];

/**
 * Add conversion to audit trail
 */
export function addToAuditTrail(auditEntry: ConversionAuditTrail): void {
  conversionAuditTrail.push(auditEntry);
  
  // Keep only last 10000 entries for memory management
  if (conversionAuditTrail.length > 10000) {
    conversionAuditTrail = conversionAuditTrail.slice(-10000);
  }
}

/**
 * Get conversion audit trail
 */
export function getConversionAuditTrail(
  filters?: {
    fromDate?: Date;
    toDate?: Date;
    fromCurrency?: SupportedCurrency;
    toCurrency?: SupportedCurrency;
    userId?: string;
  }
): readonly ConversionAuditTrail[] {
  let filtered = conversionAuditTrail;
  
  if (filters?.fromDate) {
    filtered = filtered.filter(entry => entry.conversionDate >= filters.fromDate!);
  }
  
  if (filters?.toDate) {
    filtered = filtered.filter(entry => entry.conversionDate <= filters.toDate!);
  }
  
  if (filters?.fromCurrency) {
    filtered = filtered.filter(entry => entry.fromCurrency === filters.fromCurrency);
  }
  
  if (filters?.toCurrency) {
    filtered = filtered.filter(entry => entry.toCurrency === filters.toCurrency);
  }
  
  if (filters?.userId) {
    filtered = filtered.filter(entry => entry.userId === filters.userId);
  }
  
  return filtered;
}

/**
 * Clear audit trail (for testing)
 */
export function clearAuditTrail(): void {
  conversionAuditTrail = [];
  rateMonitoringAlerts = [];
}

/**
 * Set base currency
 */
export function setBaseCurrency(currency: SupportedCurrency): void {
  if (!globalCurrencyHierarchy) {
    globalCurrencyHierarchy = {
      baseCurrency: currency,
      reportingCurrency: currency,
      transactionCurrencies: [currency],
      conversionRules: [],
    };
  } else {
    globalCurrencyHierarchy.baseCurrency = currency;
  }
}

/**
 * Set reporting currency
 */
export function setReportingCurrency(currency: SupportedCurrency): void {
  if (!globalCurrencyHierarchy) {
    globalCurrencyHierarchy = {
      baseCurrency: currency,
      reportingCurrency: currency,
      transactionCurrencies: [currency],
      conversionRules: [],
    };
  } else {
    globalCurrencyHierarchy.reportingCurrency = currency;
  }
}

/**
 * Get currency hierarchy
 */
export function getCurrencyHierarchy(): CurrencyHierarchy {
  if (!globalCurrencyHierarchy) {
    throw createValidationError(
      'MISSING_CURRENCY_HIERARCHY',
      'Currency hierarchy not initialized',
      null,
      { operation: 'get-currency-hierarchy' }
    );
  }
  
  return globalCurrencyHierarchy;
}

/**
 * Validate currency hierarchy
 */
export function validateCurrencyHierarchy(hierarchy: CurrencyHierarchy): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!hierarchy.baseCurrency) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      path: 'baseCurrency',
      message: 'Base currency is required',
    });
  }
  
  if (!hierarchy.reportingCurrency) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      path: 'reportingCurrency',
      message: 'Reporting currency is required',
    });
  }
  
  if (!hierarchy.transactionCurrencies || hierarchy.transactionCurrencies.length === 0) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      path: 'transactionCurrencies',
      message: 'At least one transaction currency is required',
    });
  }
  
  if (!hierarchy.transactionCurrencies.includes(hierarchy.baseCurrency)) {
    issues.push({
      code: 'CONSISTENCY' as ValidationCode,
      path: 'transactionCurrencies',
      message: 'Base currency must be included in transaction currencies',
    });
  }
  
  // Validate conversion rules
  for (const rule of hierarchy.conversionRules) {
    const ruleValidation = validateConversionRule(rule);
    if (!ruleValidation.isValid) {
      issues.push(...(ruleValidation.issues || []));
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

// ============================================================================
// Conversion Rules Management
// ============================================================================

/**
 * Define conversion rule
 */
export function defineConversionRule(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rule: ConversionRule
): void {
  if (!globalCurrencyHierarchy) {
    throw createValidationError(
      'MISSING_CURRENCY_HIERARCHY',
      'Currency hierarchy not initialized',
      null,
      { operation: 'define-conversion-rule' }
    );
  }
  
  const validation = validateConversionRule(rule);
  if (!validation.isValid) {
    throw createValidationError(
      'INVALID_CONVERSION_RULE',
      'Invalid conversion rule provided',
      rule,
      { operation: 'define-conversion-rule' }
    );
  }
  
  // Remove existing rule for the same currency pair
  globalCurrencyHierarchy.conversionRules = globalCurrencyHierarchy.conversionRules.filter(
    (r: ConversionRule) => !(r.fromCurrency === fromCurrency && r.toCurrency === toCurrency)
  );
  
  // Add new rule
  globalCurrencyHierarchy.conversionRules.push(rule);
  
  // Sort by priority
  globalCurrencyHierarchy.conversionRules.sort((a: ConversionRule, b: ConversionRule) => a.priority - b.priority);
}

/**
 * Execute conversion rule
 */
export function executeConversionRule(
  amount: number,
  rule: ConversionRule,
  context: ConversionContext
): ConversionResult {
  if (!rule.active) {
    throw createValidationError(
      'INACTIVE_CONVERSION_RULE',
      'Conversion rule is not active',
      rule,
      { operation: 'execute-conversion-rule' }
    );
  }
  
  const validation = validateConversionRule(rule);
  if (!validation.isValid) {
    throw createValidationError(
      'INVALID_CONVERSION_RULE',
      'Invalid conversion rule provided',
      rule,
      { operation: 'execute-conversion-rule' }
    );
  }
  
  let rate: number;
  let rateSource: RateSource = rule.rateSource;
  
  switch (rule.method) {
    case 'direct':
      const directRate = getExchangeRateWithSource(rule.fromCurrency, rule.toCurrency, context.rateType, rule.rateSource);
      if (!directRate) {
        throw createValidationError(
          'MISSING_EXCHANGE_RATE',
          `Direct exchange rate not found for ${rule.fromCurrency} to ${rule.toCurrency}`,
          { fromCurrency: rule.fromCurrency, toCurrency: rule.toCurrency },
          { operation: 'execute-conversion-rule' }
        );
      }
      rate = directRate.rate;
      rateSource = directRate.source as RateSource || rule.rateSource;
      break;
      
    case 'triangulation':
      const fromToBaseRate = getExchangeRateWithSource(rule.fromCurrency, context.baseCurrency, context.rateType, rule.rateSource);
      const baseToTargetRate = getExchangeRateWithSource(context.baseCurrency, rule.toCurrency, context.rateType, rule.rateSource);
      
      if (!fromToBaseRate || !baseToTargetRate) {
        throw createValidationError(
          'MISSING_EXCHANGE_RATES',
          'Required exchange rates for triangulation not found',
          { fromCurrency: rule.fromCurrency, toCurrency: rule.toCurrency, baseCurrency: context.baseCurrency },
          { operation: 'execute-conversion-rule' }
        );
      }
      
      // Validate triangulation rates
      const triangulationValidation = validateTriangulationRates(
        fromToBaseRate,
        baseToTargetRate,
        rule.fromCurrency,
        rule.toCurrency,
        context.baseCurrency
      );
      
      if (!triangulationValidation.isValid) {
        throw createValidationError(
          'INVALID_TRIANGULATION_RATES',
          triangulationValidation.warning || 'Invalid triangulation rates',
          { fromToBaseRate, baseToTargetRate },
          { operation: 'execute-conversion-rule' }
        );
      }
      
      rate = triangulationValidation.correctedRate!;
      rateSource = fromToBaseRate.source as RateSource || rule.rateSource;
      break;
      
    case 'cross_rate':
      const crossRate = getExchangeRateWithSource(rule.fromCurrency, rule.toCurrency, context.rateType, rule.rateSource);
      if (!crossRate) {
        throw createValidationError(
          'MISSING_EXCHANGE_RATE',
          `Cross rate not found for ${rule.fromCurrency} to ${rule.toCurrency}`,
          { fromCurrency: rule.fromCurrency, toCurrency: rule.toCurrency },
          { operation: 'execute-conversion-rule' }
        );
      }
      rate = crossRate.rate;
      rateSource = crossRate.source as RateSource || rule.rateSource;
      break;
      
    default:
      throw createValidationError(
        'UNSUPPORTED_CONVERSION_METHOD',
        `Unsupported conversion method: ${rule.method}`,
        rule.method,
        { operation: 'execute-conversion-rule' }
      );
  }
  
  const convertedAmount = roundToCurrency(amount * rate, rule.toCurrency);
  const precision = CURRENCY_DECIMALS[rule.toCurrency];
  
  const result: ConversionResult = {
    originalAmount: amount,
    convertedAmount,
    fromCurrency: rule.fromCurrency,
    toCurrency: rule.toCurrency,
    rate,
    method: rule.method,
    precision,
    conversionDate: context.transactionDate,
  };
  
  // Add to audit trail
  addToAuditTrail({
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transactionId: `txn-${Date.now()}`,
    fromCurrency: rule.fromCurrency,
    toCurrency: rule.toCurrency,
    originalAmount: amount,
    convertedAmount,
    rate,
    method: rule.method,
    rateSource,
    conversionDate: context.transactionDate
  });
  
  return result;
}

/**
 * Validate conversion rule
 */
export function validateConversionRule(rule: ConversionRule): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!rule.id) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Rule ID is required',
      path: 'id',
    });
  }
  
  if (!rule.fromCurrency || !rule.toCurrency) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'From and to currencies are required',
      path: 'fromCurrency,toCurrency',
    });
  }
  
  if (rule.fromCurrency === rule.toCurrency) {
    issues.push({
      code: 'MISMATCH' as ValidationCode,
      message: 'From and to currencies cannot be the same',
      path: 'fromCurrency,toCurrency',
    });
  }
  
  if (!rule.method || !['direct', 'triangulation', 'cross_rate'].includes(rule.method)) {
    issues.push({
      code: 'FORMAT' as ValidationCode,
      message: 'Invalid conversion method',
      path: 'method',
    });
  }
  
  if (!rule.rateSource || !['central_bank', 'market', 'internal', 'external'].includes(rule.rateSource)) {
    issues.push({
      code: 'FORMAT' as ValidationCode,
      message: 'Invalid rate source',
      path: 'rateSource',
    });
  }
  
  if (typeof rule.priority !== 'number' || !isFinite(rule.priority) || rule.priority < 0) {
    issues.push({
      code: 'RANGE' as ValidationCode,
      message: 'Priority must be non-negative',
      path: 'priority',
    });
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

// ============================================================================
// Multi-Currency Validation
// ============================================================================

/**
 * Validate multi-currency transaction
 */
export function validateMultiCurrencyTransaction(transaction: MultiCurrencyTransaction): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!transaction.id) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Transaction ID is required',
      path: 'id',
    });
  }
  
  if (!transaction.baseCurrency || !transaction.transactionCurrency || !transaction.reportingCurrency) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Base, transaction, and reporting currencies are required',
      path: 'baseCurrency,transactionCurrency,reportingCurrency',
    });
  }
  
  if (!Array.isArray(transaction.amounts) || transaction.amounts.length === 0) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'At least one amount is required',
      path: 'amounts',
    });
  }
  
  // Validate amounts
  for (const amount of (transaction.amounts ?? [])) {
    if (!amount || !amount.currency || !isPositiveFinite(amount.amount)) {
      issues.push({
        code: 'RANGE' as ValidationCode,
        message: 'Invalid amount or currency',
        path: 'amounts',
      });
      continue;
    }
    const expectedDecimals = CURRENCY_DECIMALS[amount.currency] ?? 2;
    if (typeof amount.precision === 'number' && amount.precision !== expectedDecimals) {
      issues.push({
        code: 'CONSISTENCY' as ValidationCode,
        message: `Amount precision (${amount.precision}) does not match policy for ${amount.currency} (${expectedDecimals}).`,
        path: 'amounts.precision',
        severity: 'warning',
      } as ValidationIssue);
    }
  }
  
  // Validate conversion rates
  if (!Array.isArray(transaction.conversionRates)) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Conversion rates array is required (can be empty).',
      path: 'conversionRates',
      severity: 'warning',
    } as ValidationIssue);
  } else {
    for (const rate of transaction.conversionRates) {
      if (!isPositiveFinite(rate?.rate)) {
        issues.push({
          code: 'RANGE' as ValidationCode,
          message: 'Invalid conversion rate',
          path: 'conversionRates',
        });
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

/**
 * Validate currency consistency
 */
export function validateCurrencyConsistency(accounts: MultiCurrencyAccount[]): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  for (const account of accounts) {
    if (!account.accountCode) {
      issues.push({
        code: 'REQUIRED' as ValidationCode,
        message: 'Account code is required',
        path: 'accountCode',
      });
    }
    
    if (!account.baseCurrency) {
      issues.push({
        code: 'REQUIRED' as ValidationCode,
        message: 'Base currency is required',
        path: 'baseCurrency',
      });
    }
    
    if (!account.balances || Object.keys(account.balances).length === 0) {
      issues.push({
        code: 'REQUIRED' as ValidationCode,
        message: 'Account balances are required',
        path: 'balances',
      });
    }
    
    // Check if base currency balance exists
    if (account.balances && !account.balances[account.baseCurrency]) {
      issues.push({
        code: 'REQUIRED' as ValidationCode,
        message: 'Base currency balance is required',
        path: 'balances',
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    errors: issues.filter(i => i.severity !== 'warning').map(i => i.message),
    warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
    issues,
  };
}

/**
 * Check currency balance
 */
export function checkCurrencyBalance(
  account: MultiCurrencyAccount,
  currency: SupportedCurrency
): BalanceCheckResult {
  const balance = account.balances?.[currency] ?? 0;
  const baseBalance = account.balances?.[account.baseCurrency] ?? 0;
  
  let convertedBalance = balance;
  let conversionRate = 1;
  const tolerance = computeTolerance(account.baseCurrency);
  
  if (currency !== account.baseCurrency) {
    const rate = getLatestExchangeRate(currency, account.baseCurrency, 'mid');
    if (rate && isPositiveFinite(rate.rate)) {
      conversionRate = rate.rate;
      convertedBalance = roundToCurrency(balance * conversionRate, account.baseCurrency);
    } else {
      // No rate available -> cannot assert balanced; report explicit variance
      return {
        account,
        currency,
        balance,
        convertedBalance: baseBalance, // reflect base for variance calc
        conversionRate: NaN,
        isBalanced: false,
        variance: Math.abs(baseBalance - convertedBalance),
      };
    }
  }
  
  const variance = Math.abs(convertedBalance - baseBalance);
  const isBalanced = variance <= tolerance;
  
  return {
    account,
    currency,
    balance,
    convertedBalance,
    conversionRate,
    isBalanced,
    variance,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get conversion rule for currency pair
 */
export function getConversionRule(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): ConversionRule | null {
  const hierarchy = getCurrencyHierarchy();
  
  return hierarchy.conversionRules.find(rule => 
    rule.fromCurrency === fromCurrency && 
    rule.toCurrency === toCurrency && 
    rule.active
  ) || null;
}

/**
 * Convert amount using hierarchy rules
 */
export function convertAmountUsingHierarchy(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  context: ConversionContext
): ConversionResult {
  if (!isPositiveFinite(amount)) {
    throw createValidationError(
      'INVALID_AMOUNT',
      'Amount must be a positive, finite number',
      amount,
      { operation: 'convert-amount-using-hierarchy' }
    );
  }
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      convertedAmount: amount,
      fromCurrency,
      toCurrency,
      rate: 1,
      method: 'direct',
      precision: CURRENCY_DECIMALS[fromCurrency],
      conversionDate: context.transactionDate,
    };
  }
  
  const rule = getConversionRule(fromCurrency, toCurrency);
  if (!rule) {
    throw createValidationError(
      'MISSING_CONVERSION_RULE',
      `No conversion rule found for ${fromCurrency} to ${toCurrency}`,
      { fromCurrency, toCurrency },
      { operation: 'convert-amount-using-hierarchy' }
    );
  }
  
  return executeConversionRule(amount, rule, context);
}

/**
 * Get currency hierarchy summary
 */
export function getCurrencyHierarchySummary(): {
  baseCurrency: SupportedCurrency;
  reportingCurrency: SupportedCurrency;
  transactionCurrencyCount: number;
  conversionRuleCount: number;
  activeRuleCount: number;
} {
  const hierarchy = getCurrencyHierarchy();
  
  return {
    baseCurrency: hierarchy.baseCurrency,
    reportingCurrency: hierarchy.reportingCurrency,
    transactionCurrencyCount: hierarchy.transactionCurrencies.length,
    conversionRuleCount: hierarchy.conversionRules.length,
    activeRuleCount: hierarchy.conversionRules.filter(rule => rule.active).length,
  };
}

/**
 * Execute bulk conversion operations
 */
export function executeBulkConversion(request: BulkConversionRequest): BulkConversionResult {
  const conversions: ConversionResult[] = [];
  const auditTrail: ConversionAuditTrail[] = [];
  let successfulConversions = 0;
  let failedConversions = 0;
  let totalCostSavings = 0;
  let totalRate = 0;
  
  for (const conversionRequest of request.amounts) {
    try {
      const rule = getConversionRule(conversionRequest.fromCurrency, conversionRequest.toCurrency);
      if (!rule) {
        failedConversions++;
        continue;
      }
      
      const result = executeConversionRule(conversionRequest.amount, rule, request.context);
      conversions.push(result);
      successfulConversions++;
      totalRate += result.rate;
      
      // Add to audit trail if requested
      if (request.options?.auditTrail) {
        auditTrail.push({
          id: `bulk-audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          transactionId: `bulk-txn-${Date.now()}`,
          fromCurrency: conversionRequest.fromCurrency,
          toCurrency: conversionRequest.toCurrency,
          originalAmount: conversionRequest.amount,
          convertedAmount: result.convertedAmount,
          rate: result.rate,
          method: result.method,
          rateSource: rule.rateSource,
          conversionDate: request.context.transactionDate
        });
      }
      
      // Calculate cost analysis if requested
      if (request.options?.costAnalysis) {
        const rates = [
          { fromCurrency: conversionRequest.fromCurrency, toCurrency: conversionRequest.toCurrency, rate: result.rate, source: rule.rateSource } as ExchangeRate
        ];
        const costAnalysis = calculateConversionCost(
          conversionRequest.amount,
          conversionRequest.fromCurrency,
          conversionRequest.toCurrency,
          rates
        );
        totalCostSavings += costAnalysis.costSavings;
      }
      
    } catch (error) {
      failedConversions++;
      console.warn(`Bulk conversion failed for ${conversionRequest.fromCurrency} to ${conversionRequest.toCurrency}:`, error);
    }
  }
  
  return {
    conversions,
    auditTrail: request.options?.auditTrail ? auditTrail : undefined,
    summary: {
      totalConversions: request.amounts.length,
      successfulConversions,
      failedConversions,
      totalCostSavings,
      averageRate: successfulConversions > 0 ? totalRate / successfulConversions : 0
    }
  } as BulkConversionResult;
}

/**
 * Validate cross-rate consistency
 */
export function validateCrossRateConsistency(
  currencyPair: string,
  directRate: number,
  crossRate: number,
  tolerance?: number
): CrossRateValidation {
  const defaultTolerance = computeTolerance(currencyPair.split('/')[1] as SupportedCurrency);
  const actualTolerance = tolerance ?? defaultTolerance;
  
  const variance = Math.abs(directRate - crossRate);
  const variancePercentage = (variance / directRate) * 100;
  const isValid = variance <= actualTolerance;
  
  return {
    currencyPair,
    directRate,
    crossRate,
    variance,
    variancePercentage,
    isValid,
    tolerance: actualTolerance
  };
}

/**
 * Monitor exchange rates and generate alerts
 */
export function monitorExchangeRates(
  currencyPairs: readonly string[],
  thresholds: Record<string, { spike: number; drop: number; stability: number }>
): readonly RateMonitoringAlert[] {
  const alerts: RateMonitoringAlert[] = [];
  
  for (const pair of currencyPairs) {
    const [fromCurrency, toCurrency] = pair.split('/') as [SupportedCurrency, SupportedCurrency];
    const currentRate = getLatestExchangeRate(fromCurrency, toCurrency, 'mid');
    
    if (!currentRate) continue;
    
    const threshold = thresholds[pair];
    if (!threshold) continue;
    
    // Check for rate spikes
    if (currentRate.rate > threshold.spike) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        currencyPair: pair,
        currentRate: currentRate.rate,
        thresholdRate: threshold.spike,
        alertType: 'rate_spike',
        severity: 'high',
        message: `Rate spike detected for ${pair}: ${currentRate.rate} > ${threshold.spike}`,
        timestamp: new Date()
      });
    }
    
    // Check for rate drops
    if (currentRate.rate < threshold.drop) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        currencyPair: pair,
        currentRate: currentRate.rate,
        thresholdRate: threshold.drop,
        alertType: 'rate_drop',
        severity: 'high',
        message: `Rate drop detected for ${pair}: ${currentRate.rate} < ${threshold.drop}`,
        timestamp: new Date()
      });
    }
    
    // Check for rate stability
    if (Math.abs(currentRate.rate - 1.0) < threshold.stability) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        currencyPair: pair,
        currentRate: currentRate.rate,
        thresholdRate: threshold.stability,
        alertType: 'rate_stability',
        severity: 'low',
        message: `Rate stability detected for ${pair}: ${currentRate.rate} within ${threshold.stability}`,
        timestamp: new Date()
      });
    }
  }
  
  // Store alerts
  rateMonitoringAlerts.push(...alerts);
  
  // Keep only last 1000 alerts
  if (rateMonitoringAlerts.length > 1000) {
    rateMonitoringAlerts = rateMonitoringAlerts.slice(-1000);
  }
  
  return alerts;
}

/**
 * Get rate monitoring alerts
 */
export function getRateMonitoringAlerts(
  filters?: {
    fromDate?: Date;
    toDate?: Date;
    currencyPair?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    alertType?: 'rate_spike' | 'rate_drop' | 'rate_stability';
  }
): readonly RateMonitoringAlert[] {
  let filtered = rateMonitoringAlerts;
  
  if (filters?.fromDate) {
    filtered = filtered.filter(alert => alert.timestamp >= filters.fromDate!);
  }
  
  if (filters?.toDate) {
    filtered = filtered.filter(alert => alert.timestamp <= filters.toDate!);
  }
  
  if (filters?.currencyPair) {
    filtered = filtered.filter(alert => alert.currencyPair === filters.currencyPair);
  }
  
  if (filters?.severity) {
    filtered = filtered.filter(alert => alert.severity === filters.severity);
  }
  
  if (filters?.alertType) {
    filtered = filtered.filter(alert => alert.alertType === filters.alertType);
  }
  
  return filtered;
}
