/**
 * Money Helpers - Currency and Rounding Utilities
 * 
 * Extracted currency and rounding operations to break circular dependencies
 * between accounting-utilities.ts and safe-object.ts.
 * 
 * @fileoverview Money conversion utilities with policy integration
 */

import { DEFAULT_CURRENCY, currencyDecimals } from './policies/currency-policy';
import { DEFAULT_ROUNDING_METHOD, roundNumber, RoundingMethod } from './policies/rounding-policy';

// Internal helpers (no external deps)
const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const MIN_SAFE = Number.MIN_SAFE_INTEGER;
const pow10 = (d: number) => 10 ** d;
const isFiniteNumber = (n: number): n is number => Number.isFinite(n);
const normalizeNegZero = (n: number) => (Object.is(n, -0) ? 0 : n);
const epsilonFor = (decimals: number) => Math.max(1e-12, 10 ** (-(decimals + 2)));
const getDecimals = (currency: string) => {
  const d = currencyDecimals(currency);
  return d >= 0 ? d : 2;
};

// ============================================================================
// MONEY CONVERSION
// ============================================================================

/**
 * Convert major units to minor units (e.g., 12.34 MYR -> 1234 cents)
 */
export function toMinorUnits(
  amount: number, 
  currency: string = DEFAULT_CURRENCY
): number {
  if (!isFiniteNumber(amount)) {
    throw new Error(`Invalid amount: ${amount}. Must be a finite number.`);
  }
  const decimals = getDecimals(currency);
  // Pre-round to currency precision, then scale -> integer
  const rounded = roundNumber(amount, decimals, DEFAULT_ROUNDING_METHOD);
  const factor = pow10(decimals);
  const minor = Math.round(rounded * factor);
  if (minor > MAX_SAFE || minor < MIN_SAFE) {
    throw new Error(`Minor unit overflow for ${currency}: ${minor}`);
  }
  return minor;
}

/**
 * Convert minor units to major units (e.g., 1234 cents -> 12.34 MYR)
 */
export function fromMinorUnits(
  minor: number, 
  currency: string = DEFAULT_CURRENCY
): number {
  if (!Number.isInteger(minor)) {
    throw new Error(`Invalid minor units: ${minor}. Must be an integer.`);
  }
  const decimals = getDecimals(currency);
  const result = minor / pow10(decimals);
  return normalizeNegZero(result);
}

// ============================================================================
// ROUNDING WITH CURRENCY CONTEXT
// ============================================================================

/**
 * Round amount using currency-specific decimals and rounding method
 */
export function roundCurrencyAmount(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  method: RoundingMethod = DEFAULT_ROUNDING_METHOD
): number {
  if (!isFiniteNumber(amount)) {
    throw new Error(`Invalid amount: ${amount}. Must be a finite number.`);
  }
  const decimals = getDecimals(currency);
  return normalizeNegZero(roundNumber(amount, decimals, method));
}

/**
 * Round amount to currency decimals using default rounding method
 */
export function roundToCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): number {
  return roundCurrencyAmount(amount, currency, DEFAULT_ROUNDING_METHOD);
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy function for backward compatibility
 * @deprecated Use roundCurrencyAmount instead
 */
export function round2HalfUp(value: number, decimals?: number, currency?: string): number {
  const finalDecimals = decimals ?? (currency ? getDecimals(currency) : 2);
  if (!isFiniteNumber(value)) throw new Error(`Invalid value: ${value}`);
  return normalizeNegZero(roundNumber(value, finalDecimals, RoundingMethod.HALF_UP));
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use roundCurrencyAmount instead
 */
export function round2Bankers(value: number, decimals?: number, currency?: string): number {
  const finalDecimals = decimals ?? (currency ? getDecimals(currency) : 2);
  if (!isFiniteNumber(value)) throw new Error(`Invalid value: ${value}`);
  return normalizeNegZero(roundNumber(value, finalDecimals, RoundingMethod.HALF_EVEN));
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if amount is valid for currency
 */
export function isValidAmount(amount: number, currency: string = DEFAULT_CURRENCY): boolean {
  if (!isFiniteNumber(amount)) return false;
  const decimals = getDecimals(currency);
  const factor = pow10(decimals);
  // Pre-round to currency precision to mitigate representation noise,
  // then check that scaled value is (close to) an integer.
  const rounded = roundNumber(amount, decimals, DEFAULT_ROUNDING_METHOD);
  const scaled = rounded * factor;
  const eps = epsilonFor(decimals);
  return Math.abs(scaled - Math.round(scaled)) < eps;
}

/**
 * Validate and normalize amount for currency
 */
export function validateAmount(amount: number, currency: string = DEFAULT_CURRENCY): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid amount: ${amount}. Must be a finite number.`);
  }
  
  // Round to currency precision to handle floating point issues
  return normalizeNegZero(roundToCurrency(amount, currency));
}

// ============================================================================
// CURRENCY ARITHMETIC
// ============================================================================

/**
 * Add two amounts in the same currency
 */
export function addAmounts(
  amount1: number,
  amount2: number,
  currency: string = DEFAULT_CURRENCY
): number {
  if (!isFiniteNumber(amount1) || !isFiniteNumber(amount2)) {
    throw new Error('Invalid amount: amount1 and amount2 must be finite numbers.');
  }
  const decimals = getDecimals(currency);
  const factor = pow10(decimals);
  // Normalize to currency precision before integer math
  const minor1 = Math.round(roundNumber(amount1, decimals, DEFAULT_ROUNDING_METHOD) * factor);
  const minor2 = Math.round(roundNumber(amount2, decimals, DEFAULT_ROUNDING_METHOD) * factor);
  const resultMinor = minor1 + minor2;
  return normalizeNegZero(resultMinor / factor);
}

/**
 * Subtract two amounts in the same currency
 */
export function subtractAmounts(
  amount1: number,
  amount2: number,
  currency: string = DEFAULT_CURRENCY
): number {
  if (!isFiniteNumber(amount1) || !isFiniteNumber(amount2)) {
    throw new Error('Invalid amount: amount1 and amount2 must be finite numbers.');
  }
  const decimals = getDecimals(currency);
  const factor = pow10(decimals);
  const minor1 = Math.round(roundNumber(amount1, decimals, DEFAULT_ROUNDING_METHOD) * factor);
  const minor2 = Math.round(roundNumber(amount2, decimals, DEFAULT_ROUNDING_METHOD) * factor);
  const resultMinor = minor1 - minor2;
  return normalizeNegZero(resultMinor / factor);
}

/**
 * Multiply amount by factor
 */
export function multiplyAmount(
  amount: number,
  factor: number,
  currency: string = DEFAULT_CURRENCY
): number {
  if (!isFiniteNumber(amount) || !isFiniteNumber(factor)) {
    throw new Error('Invalid amount/factor: both must be finite numbers.');
  }
  return normalizeNegZero(roundToCurrency(amount * factor, currency));
}

/**
 * Divide amount by divisor
 */
export function divideAmount(
  amount: number,
  divisor: number,
  currency: string = DEFAULT_CURRENCY
): number {
  if (!isFiniteNumber(amount) || !isFiniteNumber(divisor)) {
    throw new Error('Invalid amount/divisor: both must be finite numbers.');
  }
  if (divisor === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return normalizeNegZero(roundToCurrency(amount / divisor, currency));
}
