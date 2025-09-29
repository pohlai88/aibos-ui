/**
 * Multi-Currency Rules Utilities
 * 
 * Handle base vs transaction vs reporting currency math and validation.
 * Provides comprehensive multi-currency rule management and conversion operations.
 * 
 * @fileoverview Currency hierarchy management, conversion rules, and multi-currency validation
 */

import {
  SupportedCurrency,
  CURRENCY_DECIMALS,
  roundToCurrency,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import { ExchangeRate, getLatestExchangeRate } from './fx-ledger-utilities';

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
// Currency Hierarchy Management
// ============================================================================

// Global currency hierarchy
let globalCurrencyHierarchy: CurrencyHierarchy | null = null;

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
    r => !(r.fromCurrency === fromCurrency && r.toCurrency === toCurrency)
  );
  
  // Add new rule
  globalCurrencyHierarchy.conversionRules.push(rule);
  
  // Sort by priority
  globalCurrencyHierarchy.conversionRules.sort((a, b) => a.priority - b.priority);
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
  let method: ConversionMethod = rule.method;
  
  switch (rule.method) {
    case 'direct':
      const directRate = getLatestExchangeRate(rule.fromCurrency, rule.toCurrency, context.rateType);
      if (!directRate) {
        throw createValidationError(
          'MISSING_EXCHANGE_RATE',
          `Direct exchange rate not found for ${rule.fromCurrency} to ${rule.toCurrency}`,
          { fromCurrency: rule.fromCurrency, toCurrency: rule.toCurrency },
          { operation: 'execute-conversion-rule' }
        );
      }
      rate = directRate.rate;
      break;
      
    case 'triangulation':
      const fromToBaseRate = getLatestExchangeRate(rule.fromCurrency, context.baseCurrency, context.rateType);
      const baseToTargetRate = getLatestExchangeRate(context.baseCurrency, rule.toCurrency, context.rateType);
      
      if (!fromToBaseRate || !baseToTargetRate) {
        throw createValidationError(
          'MISSING_EXCHANGE_RATES',
          'Required exchange rates for triangulation not found',
          { fromCurrency: rule.fromCurrency, toCurrency: rule.toCurrency, baseCurrency: context.baseCurrency },
          { operation: 'execute-conversion-rule' }
        );
      }
      rate = fromToBaseRate.rate * baseToTargetRate.rate;
      break;
      
    case 'cross_rate':
      // Cross rate calculation through multiple currencies
      const crossRate = getLatestExchangeRate(rule.fromCurrency, rule.toCurrency, context.rateType);
      if (!crossRate) {
        throw createValidationError(
          'MISSING_EXCHANGE_RATE',
          `Cross rate not found for ${rule.fromCurrency} to ${rule.toCurrency}`,
          { fromCurrency: rule.fromCurrency, toCurrency: rule.toCurrency },
          { operation: 'execute-conversion-rule' }
        );
      }
      rate = crossRate.rate;
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
  
  return {
    originalAmount: amount,
    convertedAmount,
    fromCurrency: rule.fromCurrency,
    toCurrency: rule.toCurrency,
    rate,
    method,
    precision,
    conversionDate: context.transactionDate,
  };
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
  
  if (rule.priority < 0) {
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
  
  if (!transaction.amounts || transaction.amounts.length === 0) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'At least one amount is required',
      path: 'amounts',
    });
  }
  
  // Validate amounts
  for (const amount of transaction.amounts) {
    if (!amount.currency || !amount.amount || amount.amount <= 0) {
      issues.push({
        code: 'RANGE' as ValidationCode,
        message: 'Invalid amount or currency',
        path: 'amounts',
      });
    }
  }
  
  // Validate conversion rates
  for (const rate of transaction.conversionRates) {
    if (!rate.rate || rate.rate <= 0) {
      issues.push({
        code: 'RANGE' as ValidationCode,
        message: 'Invalid conversion rate',
        path: 'conversionRates',
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
  const balance = account.balances[currency] || 0;
  const baseBalance = account.balances[account.baseCurrency] || 0;
  
  let convertedBalance = balance;
  let conversionRate = 1;
  
  if (currency !== account.baseCurrency) {
    const rate = getLatestExchangeRate(currency, account.baseCurrency, 'mid');
    if (rate) {
      conversionRate = rate.rate;
      convertedBalance = roundToCurrency(balance * conversionRate, account.baseCurrency);
    }
  }
  
  const variance = Math.abs(convertedBalance - baseBalance);
  const isBalanced = variance < 0.01; // Tolerance of 0.01
  
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
 * Clear currency hierarchy (for testing)
 */
export function clearCurrencyHierarchy(): void {
  globalCurrencyHierarchy = null;
}
