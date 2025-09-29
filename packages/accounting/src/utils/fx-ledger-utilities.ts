/**
 * FX Ledger Utilities
 * 
 * Handle FX conversions with mid/buy/sell rates, triangulation, and precision per currency.
 * Provides comprehensive foreign exchange rate management and conversion operations.
 * 
 * @fileoverview FX rate management, conversion operations, and precision handling
 */

import {
  SupportedCurrency,
  CURRENCY_DECIMALS,
  roundToCurrency,
  toMinor,
  fromMinor,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import { formatDate, isValidDate, isAfterFns, isBeforeFns } from './date-utilities';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ExchangeRate {
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rateType: RateType;
  rate: number;
  date: Date;
  source: string;
  valid: boolean;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rate: number;
  rateType: RateType;
  precisionDifference: number;
  conversionDate: Date;
}

export interface CurrencyAmount {
  amount: number;
  currency: SupportedCurrency;
  precision: number;
}

export interface RateLookupOptions {
  date?: Date;
  rateType?: RateType;
  source?: string;
  allowTriangulation?: boolean;
  baseCurrency?: SupportedCurrency;
}

export interface TriangulationResult {
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  intermediateCurrency: SupportedCurrency;
  directRate?: number;
  triangulatedRate: number;
  method: 'direct' | 'triangulation';
  precision: number;
}

export type RateType = 'mid' | 'buy' | 'sell' | 'spot' | 'forward';
export type RoundingMethod = 'round_up' | 'round_down' | 'round_half_up' | 'round_half_even';

// ============================================================================
// Rate Storage and Management
// ============================================================================

// In-memory rate storage (in production, this would be a database)
const exchangeRates = new Map<string, ExchangeRate[]>();

/**
 * Generate rate key for storage
 */
function generateRateKey(fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): string {
  return `${fromCurrency}_${toCurrency}`;
}

/**
 * Set exchange rate
 */
export function setExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rate: ExchangeRate
): void {
  const key = generateRateKey(fromCurrency, toCurrency);
  const rates = exchangeRates.get(key) || [];
  
  // Remove existing rate for the same date and type
  const filteredRates = rates.filter(r => 
    !(formatDate(r.date) === formatDate(rate.date) && r.rateType === rate.rateType)
  );
  
  filteredRates.push(rate);
  exchangeRates.set(key, filteredRates);
}

/**
 * Get exchange rate
 */
export function getExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rateType: RateType,
  date: Date
): ExchangeRate | null {
  const key = generateRateKey(fromCurrency, toCurrency);
  const rates = exchangeRates.get(key) || [];
  
  // Find rate for the specific date and type
  const rate = rates.find(r => 
    formatDate(r.date) === formatDate(date) && r.rateType === rateType
  );
  
  return rate || null;
}

/**
 * Get latest exchange rate
 */
export function getLatestExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rateType: RateType
): ExchangeRate | null {
  const key = generateRateKey(fromCurrency, toCurrency);
  const rates = exchangeRates.get(key) || [];
  
  // Filter by rate type and get the latest
  const filteredRates = rates
    .filter(r => r.rateType === rateType)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return filteredRates[0] || null;
}

/**
 * Validate exchange rate
 */
export function validateExchangeRate(rate: ExchangeRate): BusinessValidationResult {
  const issues: ValidationIssue[] = [];
  
  if (!rate.fromCurrency || !rate.toCurrency) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'From and to currencies are required',
      path: 'fromCurrency,toCurrency',
    });
  }
  
  if (rate.fromCurrency === rate.toCurrency) {
    issues.push({
      code: 'MISMATCH' as ValidationCode,
      message: 'From and to currencies cannot be the same',
      path: 'fromCurrency,toCurrency',
    });
  }
  
  if (!rate.rate || rate.rate <= 0) {
    issues.push({
      code: 'RANGE' as ValidationCode,
      message: 'Exchange rate must be greater than zero',
      path: 'rate',
    });
  }
  
  if (!isValidDate(rate.date)) {
    issues.push({
      code: 'FORMAT' as ValidationCode,
      message: 'Rate date must be valid',
      path: 'date',
    });
  }
  
  if (!rate.rateType) {
    issues.push({
      code: 'REQUIRED' as ValidationCode,
      message: 'Rate type is required',
      path: 'rateType',
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
// Conversion Operations
// ============================================================================

/**
 * Convert amount using exchange rate
 */
export function convertAmount(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rate: ExchangeRate
): ConversionResult {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      convertedAmount: amount,
      fromCurrency,
      toCurrency,
      rate: 1,
      rateType: 'mid',
      precisionDifference: 0,
      conversionDate: new Date(),
    };
  }
  
  const validation = validateExchangeRate(rate);
    if (!validation.isValid) {
    throw createValidationError(
      'INVALID_EXCHANGE_RATE',
      'Invalid exchange rate provided',
      rate,
      { operation: 'convert-amount' }
    );
  }
  
  const originalAmount = toMinor(amount, fromCurrency);
  const convertedAmount = Math.round(originalAmount * rate.rate);
  const precisionDifference = convertedAmount - (originalAmount * rate.rate);
  
  return {
    originalAmount: fromMinor(originalAmount, fromCurrency),
    convertedAmount: fromMinor(convertedAmount, toCurrency),
    fromCurrency,
    toCurrency,
    rate: rate.rate,
    rateType: rate.rateType,
    precisionDifference: fromMinor(Math.abs(precisionDifference), toCurrency),
    conversionDate: rate.date,
  };
}

/**
 * Convert amount with triangulation
 */
export function convertWithTriangulation(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  baseCurrency: SupportedCurrency
): ConversionResult {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      convertedAmount: amount,
      fromCurrency,
      toCurrency,
      rate: 1,
      rateType: 'mid',
      precisionDifference: 0,
      conversionDate: new Date(),
    };
  }
  
  // Try direct rate first
  const directRate = getLatestExchangeRate(fromCurrency, toCurrency, 'mid');
  if (directRate) {
    return convertAmount(amount, fromCurrency, toCurrency, directRate);
  }
  
  // Use triangulation through base currency
  const fromToBaseRate = getLatestExchangeRate(fromCurrency, baseCurrency, 'mid');
  const baseToTargetRate = getLatestExchangeRate(baseCurrency, toCurrency, 'mid');
  
  if (!fromToBaseRate || !baseToTargetRate) {
    throw createValidationError(
      'MISSING_EXCHANGE_RATES',
      'Required exchange rates for triangulation not found',
      { fromCurrency, toCurrency, baseCurrency },
      { operation: 'convert-with-triangulation' }
    );
  }
  
  const triangulatedRate: ExchangeRate = {
    fromCurrency,
    toCurrency,
    rateType: 'mid',
    rate: fromToBaseRate.rate * baseToTargetRate.rate,
    date: new Date(),
    source: 'triangulation',
    valid: true,
  };
  
  return convertAmount(amount, fromCurrency, toCurrency, triangulatedRate);
}

/**
 * Convert multiple amounts to target currency
 */
export function convertMultipleAmounts(
  amounts: CurrencyAmount[],
  toCurrency: SupportedCurrency,
  date: Date
): ConversionResult[] {
  const results: ConversionResult[] = [];
  
  for (const amount of amounts) {
    if (amount.currency === toCurrency) {
      results.push({
        originalAmount: amount.amount,
        convertedAmount: amount.amount,
        fromCurrency: amount.currency,
        toCurrency,
        rate: 1,
        rateType: 'mid',
        precisionDifference: 0,
        conversionDate: date,
      });
      continue;
    }
    
    const rate = getExchangeRate(amount.currency, toCurrency, 'mid', date);
    if (!rate) {
      throw createValidationError(
        'MISSING_EXCHANGE_RATE',
        `Exchange rate not found for ${amount.currency} to ${toCurrency}`,
        { fromCurrency: amount.currency, toCurrency, date },
        { operation: 'convert-multiple-amounts' }
      );
    }
    
    const result = convertAmount(amount.amount, amount.currency, toCurrency, rate);
    results.push(result);
  }
  
  return results;
}

// ============================================================================
// Precision Handling
// ============================================================================

/**
 * Apply currency precision
 */
export function applyCurrencyPrecision(
  amount: number,
  currency: SupportedCurrency,
  method: RoundingMethod = 'round_half_up'
): number {
  const decimals = CURRENCY_DECIMALS[currency];
  const factor = Math.pow(10, decimals);
  
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
      return roundToCurrency(amount, currency);
  }
}

/**
 * Calculate precision difference
 */
export function calculatePrecisionDifference(
  original: number,
  converted: number,
  currency: SupportedCurrency
): number {
  const precision = CURRENCY_DECIMALS[currency];
  const factor = Math.pow(10, precision);
  
  const originalRounded = Math.round(original * factor) / factor;
  const convertedRounded = Math.round(converted * factor) / factor;
  
  return Math.abs(originalRounded - convertedRounded);
}

/**
 * Get triangulation result
 */
export function getTriangulationResult(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  baseCurrency: SupportedCurrency
): TriangulationResult {
  if (fromCurrency === toCurrency) {
    return {
      fromCurrency,
      toCurrency,
      intermediateCurrency: fromCurrency,
      directRate: 1,
      triangulatedRate: 1,
      method: 'direct',
      precision: CURRENCY_DECIMALS[fromCurrency],
    };
  }
  
  // Try direct rate first
  const directRate = getLatestExchangeRate(fromCurrency, toCurrency, 'mid');
  if (directRate) {
    return {
      fromCurrency,
      toCurrency,
      intermediateCurrency: fromCurrency,
      directRate: directRate.rate,
      triangulatedRate: directRate.rate,
      method: 'direct',
      precision: CURRENCY_DECIMALS[toCurrency],
    };
  }
  
  // Use triangulation
  const fromToBaseRate = getLatestExchangeRate(fromCurrency, baseCurrency, 'mid');
  const baseToTargetRate = getLatestExchangeRate(baseCurrency, toCurrency, 'mid');
  
  if (!fromToBaseRate || !baseToTargetRate) {
    throw createValidationError(
      'MISSING_EXCHANGE_RATES',
      'Required exchange rates for triangulation not found',
      { fromCurrency, toCurrency, baseCurrency },
      { operation: 'get-triangulation-result' }
    );
  }
  
  return {
    fromCurrency,
    toCurrency,
    intermediateCurrency: baseCurrency,
    triangulatedRate: fromToBaseRate.rate * baseToTargetRate.rate,
    method: 'triangulation',
    precision: CURRENCY_DECIMALS[toCurrency],
  };
}

// ============================================================================
// Rate Management Utilities
// ============================================================================

/**
 * Get all rates for a currency pair
 */
export function getAllRates(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): ExchangeRate[] {
  const key = generateRateKey(fromCurrency, toCurrency);
  return exchangeRates.get(key) || [];
}

/**
 * Get rates by date range
 */
export function getRatesByDateRange(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  startDate: Date,
  endDate: Date
): ExchangeRate[] {
  const allRates = getAllRates(fromCurrency, toCurrency);
  
  return allRates.filter(rate => 
    isAfterFns(rate.date, startDate) && isBeforeFns(rate.date, endDate)
  );
}

/**
 * Clear all rates (for testing)
 */
export function clearAllRates(): void {
  exchangeRates.clear();
}

/**
 * Get rate statistics
 */
export function getRateStatistics(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rateType: RateType
): {
  count: number;
  minRate: number;
  maxRate: number;
  avgRate: number;
  latestDate: Date | null;
  earliestDate: Date | null;
} {
  const rates = getAllRates(fromCurrency, toCurrency)
    .filter(rate => rate.rateType === rateType);
  
  if (rates.length === 0) {
    return {
      count: 0,
      minRate: 0,
      maxRate: 0,
      avgRate: 0,
      latestDate: null,
      earliestDate: null,
    };
  }
  
  const sortedRates = rates.sort((a, b) => a.date.getTime() - b.date.getTime());
  const rateValues = rates.map(r => r.rate);
  
  return {
    count: rates.length,
    minRate: Math.min(...rateValues),
    maxRate: Math.max(...rateValues),
    avgRate: rateValues.reduce((sum, rate) => sum + rate, 0) / rateValues.length,
    latestDate: sortedRates[sortedRates.length - 1]?.date || null,
    earliestDate: sortedRates[0]?.date || null,
  };
}
