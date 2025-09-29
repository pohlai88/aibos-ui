/**
 * FX Ledger Utilities
 * 
 * Handle FX conversions with mid/buy/sell rates, triangulation, and precision per currency.
 * Provides comprehensive foreign exchange rate management and conversion operations.
 * 
 * @fileoverview FX rate management, conversion operations, and precision handling
 */

import type {
  SupportedCurrency,
} from './accounting-utilities';
import { 
  CURRENCY_DECIMALS,
  roundToCurrency,
  toMinor,
  fromMinor,
} from './accounting-utilities';
import { createValidationError } from './error-utilities';
import { type ValidationIssue, type BusinessValidationResult, type ValidationCode } from './validation-utilities';
import { formatDate, isValidDate } from './date-utilities';
import { RoundingMethod } from './policies/rounding-policy';

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
  /** When exact date not found, how many days back are we allowed to look. Defaults to 7. */
  toleranceDays?: number;
  /** If no direct pair, try inverse (to→from) and invert the rate. Defaults to true. */
  allowInverse?: boolean;
  /** If nothing found within tolerance, allow latest (by rateType). Defaults to false. */
  fallbackToLatest?: boolean;
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
// RoundingMethod imported from policies/rounding-policy.ts (SSOT)

/**
 * Dealer selection policy — which rate type to use for a trade intent.
 * By convention here:
 * - 'buy'  = customer buys FROM_CURRENCY (dealer sells base to you) → ask
 * - 'sell' = customer sells FROM_CURRENCY (dealer buys base from you) → bid
 */
export type TradeIntent = 'buy_from' | 'sell_from' | 'neutral';
export function selectRateType(intent: TradeIntent): RateType {
  switch (intent) {
    case 'buy_from': return 'buy';
    case 'sell_from': return 'sell';
    default: return 'mid';
  }
}

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

/** Try inverse mapping of rate type when inverting a pair. */
function invertRateType(rt: RateType): RateType {
  // In most dealer conventions, inverting flips buy<->sell; others stay as-is.
  if (rt === 'buy') return 'sell';
  if (rt === 'sell') return 'buy';
  return rt;
}

/**
 * Set exchange rate
 */
export function setExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rate: ExchangeRate
): void {
  // Validate upfront (non-throwing — consumer may throw from their layer if needed)
  const validation = validateExchangeRate(rate);
  if (!validation.isValid) {
    // keep behavior non-breaking: still allow setting, but mark invalid
    rate.valid = false;
  }
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
 * Get exchange rate at or before a date, within a tolerance window (days).
 */
function getExchangeRateAtOrBefore(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rateType: RateType,
  date: Date,
  toleranceDays: number
): ExchangeRate | null {
  const key = generateRateKey(fromCurrency, toCurrency);
  const rates = (exchangeRates.get(key) || []).filter(r => r.rateType === rateType);
  if (rates.length === 0) return null;
  const target = formatDate(date);
  // Keep rates on or before the target day (inclusive)
  const candidates = rates
    .filter(r => formatDate(r.date) <= target)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  if (candidates.length === 0) return null;
  const best = candidates[0];
  if (!best) return null;
  // Enforce tolerance in days (difference in UTC days)
  const deltaMs = date.getTime() - best.date.getTime();
  const days = Math.floor(deltaMs / (1000 * 60 * 60 * 24));
  return days <= toleranceDays ? best : null;
}

/**
 * Smart rate lookup with fallbacks:
 *  1) exact day
 *  2) at-or-before within tolerance
 *  3) inverse pair (inverted rate, inverted type)
 *  4) latest (opt-in)
 */
export function getExchangeRateSmart(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  opts: Required<Pick<RateLookupOptions, 'rateType'>> & Partial<RateLookupOptions>
): ExchangeRate | null {
  const rateType = opts.rateType;
  const date = opts.date ?? new Date();
  const toleranceDays = opts.toleranceDays ?? 7;
  const allowInverse = opts.allowInverse ?? true;
  const fallbackToLatest = opts.fallbackToLatest ?? false;
  const source = opts.source;

  // 1) exact
  const exact = getExchangeRate(fromCurrency, toCurrency, rateType, date);
  if (exact && (!source || exact.source === source)) return exact;

  // 2) at-or-before within tolerance
  const windowed = getExchangeRateAtOrBefore(fromCurrency, toCurrency, rateType, date, toleranceDays);
  if (windowed && (!source || windowed.source === source)) return windowed;

  // 3) inverse
  if (allowInverse) {
    const invType = invertRateType(rateType);
    const invExact = getExchangeRate(toCurrency, fromCurrency, invType, date)
      ?? getExchangeRateAtOrBefore(toCurrency, fromCurrency, invType, date, toleranceDays);
    if (invExact && (!source || invExact.source === source)) {
      return {
        fromCurrency,
        toCurrency,
        rateType,
        rate: invExact.rate === 0 ? 0 : 1 / invExact.rate,
        date: invExact.date,
        source: invExact.source,
        valid: invExact.valid
      };
    }
  }

  // 4) latest (opt-in)
  if (fallbackToLatest) {
    const latest = getLatestExchangeRate(fromCurrency, toCurrency, rateType);
    if (latest && (!source || latest.source === source)) return latest;
  }
  return null;
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
  rate: ExchangeRate,
  rounding: RoundingMethod = RoundingMethod.HALF_UP
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
  
  const originalMinor = toMinor(amount, fromCurrency);
  // Ideal minor (float); then apply SSOT rounding to target currency units
  const idealMinorFloat = originalMinor * rate.rate;
  // Convert to target display units, round using policy, then back to minor for delta
  const idealUnitsFloat = idealMinorFloat / Math.pow(10, CURRENCY_DECIMALS[toCurrency]);
  const roundedUnits = applyCurrencyPrecision(idealUnitsFloat, toCurrency, rounding);
  const convertedMinor = toMinor(roundedUnits, toCurrency);
  const precisionMinorDiff = convertedMinor - Math.round(idealMinorFloat);
  
  return {
    originalAmount: fromMinor(originalMinor, fromCurrency),
    convertedAmount: fromMinor(convertedMinor, toCurrency),
    fromCurrency,
    toCurrency,
    rate: rate.rate,
    rateType: rate.rateType,
    precisionDifference: fromMinor(Math.abs(precisionMinorDiff), toCurrency),
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
  baseCurrency: SupportedCurrency,
  opts: Partial<Pick<RateLookupOptions, 'rateType' | 'toleranceDays' | 'allowInverse' | 'fallbackToLatest'>> = {},
  rounding: RoundingMethod = RoundingMethod.HALF_UP
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
  
  const rateType: RateType = opts.rateType ?? 'mid';
  // Try smart direct rate first
  const directRate = getExchangeRateSmart(fromCurrency, toCurrency, { rateType, fallbackToLatest: true });
  if (directRate) {
    return convertAmount(amount, fromCurrency, toCurrency, directRate, rounding);
  }
  
  // Use triangulation through base currency
  const fromToBaseRate = getExchangeRateSmart(fromCurrency, baseCurrency, { rateType, ...opts, fallbackToLatest: true });
  const baseToTargetRate = getExchangeRateSmart(baseCurrency, toCurrency, { rateType, ...opts, fallbackToLatest: true });
  
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
    rateType,
    rate: fromToBaseRate.rate * baseToTargetRate.rate,
    // keep the earlier of the two component dates for conservative reporting
    date: new Date(Math.min(fromToBaseRate.date.getTime(), baseToTargetRate.date.getTime())),
    source: `triangulation:${fromToBaseRate.source || 'n/a'}+${baseToTargetRate.source || 'n/a'}`,
    valid: true,
  };
  
  return convertAmount(amount, fromCurrency, toCurrency, triangulatedRate, rounding);
}

/**
 * Convert multiple amounts to target currency
 */
export function convertMultipleAmounts(
  amounts: CurrencyAmount[],
  toCurrency: SupportedCurrency,
  date: Date,
  rateType: RateType = 'mid',
  rounding: RoundingMethod = RoundingMethod.HALF_UP
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
    
    const rate =
      getExchangeRate(amount.currency, toCurrency, rateType, date) ??
      getExchangeRateAtOrBefore(amount.currency, toCurrency, rateType, date, 7) ??
      getExchangeRateSmart(amount.currency, toCurrency, { rateType, date, allowInverse: true, fallbackToLatest: true });
    if (!rate) {
      throw createValidationError(
        'MISSING_EXCHANGE_RATE',
        `Exchange rate not found for ${amount.currency} to ${toCurrency}`,
        { fromCurrency: amount.currency, toCurrency, date },
        { operation: 'convert-multiple-amounts' }
      );
    }
    
    const result = convertAmount(amount.amount, amount.currency, toCurrency, rate, rounding);
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
  method: RoundingMethod = RoundingMethod.HALF_UP
): number {
  const decimals = CURRENCY_DECIMALS[currency];
  const factor = Math.pow(10, decimals);
  
  switch (method) {
    case RoundingMethod.CEILING:
      return Math.ceil(amount * factor) / factor;
    case RoundingMethod.FLOOR:
      return Math.floor(amount * factor) / factor;
    case RoundingMethod.HALF_UP:
      return Math.round(amount * factor) / factor;
    case RoundingMethod.HALF_EVEN:
      {
        // Banker's rounding: ties go to even
        const scaled = amount * factor;
        const floor = Math.floor(scaled);
        const diff = scaled - floor;
        if (diff > 0.5) return (floor + 1) / factor;
        if (diff < 0.5) return floor / factor;
        // exactly .5, choose even
        return (floor % 2 === 0 ? floor : floor + 1) / factor;
      }
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
  
  // Inclusive range [startDate, endDate]
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return allRates.filter(rate => {
    const d = formatDate(rate.date);
    return d >= start && d <= end;
  });
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

/**
 * Helper: trade-aware conversion that auto-selects rate type via dealer rule.
 */
export function convertTradeAmount(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  intent: TradeIntent,
  date: Date = new Date(),
  opts: Omit<RateLookupOptions, 'rateType' | 'date'> = {},
  rounding: RoundingMethod = RoundingMethod.HALF_EVEN
): ConversionResult {
  const rateType = selectRateType(intent);
  const rate = getExchangeRateSmart(fromCurrency, toCurrency, { ...opts, rateType, date, fallbackToLatest: true });
  if (!rate) {
    throw createValidationError(
      'MISSING_EXCHANGE_RATE',
      `No ${rateType} rate available for ${fromCurrency}->${toCurrency}`,
      { fromCurrency, toCurrency, date, rateType },
      { operation: 'convert-trade-amount' }
    );
  }
  return convertAmount(amount, fromCurrency, toCurrency, rate, rounding);
}
