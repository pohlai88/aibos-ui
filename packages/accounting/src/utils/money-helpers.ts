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
  const decimals = currencyDecimals(currency);
  // Round first to ensure consistent precision
  const roundedAmount = roundNumber(amount, decimals, DEFAULT_ROUNDING_METHOD);
  return Math.round(roundedAmount * Math.pow(10, decimals));
}

/**
 * Convert minor units to major units (e.g., 1234 cents -> 12.34 MYR)
 */
export function fromMinorUnits(
  minor: number, 
  currency: string = DEFAULT_CURRENCY
): number {
  const decimals = currencyDecimals(currency);
  return minor / Math.pow(10, decimals);
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
  const decimals = currencyDecimals(currency);
  return roundNumber(amount, decimals, method);
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
  const finalDecimals = decimals ?? (currency ? currencyDecimals(currency) : 2);
  return roundNumber(value, finalDecimals, RoundingMethod.HALF_UP);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use roundCurrencyAmount instead
 */
export function round2Bankers(value: number, decimals?: number, currency?: string): number {
  const finalDecimals = decimals ?? (currency ? currencyDecimals(currency) : 2);
  return roundNumber(value, finalDecimals, RoundingMethod.HALF_EVEN);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if amount is valid for currency
 */
export function isValidAmount(amount: number, currency: string = DEFAULT_CURRENCY): boolean {
  if (!Number.isFinite(amount)) return false;
  
  const decimals = currencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  const scaled = amount * factor;
  
  // Check if the scaled amount is an integer (within floating point precision)
  return Math.abs(scaled - Math.round(scaled)) < 1e-10;
}

/**
 * Validate and normalize amount for currency
 */
export function validateAmount(amount: number, currency: string = DEFAULT_CURRENCY): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid amount: ${amount}. Must be a finite number.`);
  }
  
  // Round to currency precision to handle floating point issues
  return roundToCurrency(amount, currency);
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
  const decimals = currencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  
  const minor1 = Math.round(amount1 * factor);
  const minor2 = Math.round(amount2 * factor);
  const resultMinor = minor1 + minor2;
  
  return resultMinor / factor;
}

/**
 * Subtract two amounts in the same currency
 */
export function subtractAmounts(
  amount1: number,
  amount2: number,
  currency: string = DEFAULT_CURRENCY
): number {
  const decimals = currencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  
  const minor1 = Math.round(amount1 * factor);
  const minor2 = Math.round(amount2 * factor);
  const resultMinor = minor1 - minor2;
  
  return resultMinor / factor;
}

/**
 * Multiply amount by factor
 */
export function multiplyAmount(
  amount: number,
  factor: number,
  currency: string = DEFAULT_CURRENCY
): number {
  return roundToCurrency(amount * factor, currency);
}

/**
 * Divide amount by divisor
 */
export function divideAmount(
  amount: number,
  divisor: number,
  currency: string = DEFAULT_CURRENCY
): number {
  if (divisor === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return roundToCurrency(amount / divisor, currency);
}
