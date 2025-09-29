/**
 * Safe Object Utilities
 *
 * Local utilities for safe object property access and manipulation.
 * Replaces @aibos/utils dependency with focused, accounting-specific utilities.
 *
 * Production-grade utilities with deterministic rounding policies and proper type safety.
 */

import { currencyDecimals, type SupportedCurrency } from './policies/currency-policy';
import { createValidationError } from './error-utilities';

// normalizeAccountCode moved here to avoid circular dependency

/**
 * Normalize account code by trimming whitespace and converting to uppercase.
 * This ensures consistent storage format and avoids mixed-case issues.
 */
export function normalizeAccountCode(code: string): string {
  return code.trim().toUpperCase();
}

export type Dict = Record<string, unknown>;

export function isRecord(v: unknown): v is Dict {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function hasKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return object != null && Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * safeGet - simplified version that works with both typed and dynamic objects
 */
 
export function safeGet<T extends object, K extends keyof T>(object: T | unknown, key: K): T[K] | undefined;
// eslint-disable-next-line no-redeclare
export function safeGet<T extends object, K extends keyof T, R>(object: T | unknown, key: K, fallback: R): T[K] | R;
// eslint-disable-next-line no-redeclare
export function safeGet(object: unknown, key: PropertyKey, fallback?: unknown): unknown;
// eslint-disable-next-line no-redeclare
export function safeGet(object: unknown, key: PropertyKey, fallback?: unknown): unknown {
  if (!isRecord(object)) return fallback;
  if (hasKey(object, key)) return (object as Record<PropertyKey, unknown>)[key];
  return fallback;
}

/**
 * safeGetNumber: convenience for numeric maps (e.g., FX rates)
 */
export function safeGetNumber(
  object: Record<string, unknown> | unknown,
  key: string,
  fallback = 0
): number {
  const v = safeGet(object, key, fallback);
  return typeof v === 'number' ? v : fallback;
}

export const assert: <T>(cond: T, message?: string) => asserts cond is NonNullable<T> = (cond: unknown, message = 'Assertion failed'): asserts cond => {
  if (!cond) {
    throw createValidationError(
      'ASSERTION_FAILED',
      message,
      String(cond),
      { operation: 'assert' }
    );
  }
};

// Additional accounting-specific utilities

/**
 * Get default decimal places for accounting operations
 * Uses MYR as the default currency for consistency
 */
function getDefaultDecimals(): number {
  return currencyDecimals('MYR');
}

/**
 * Normalize -0 to +0 (for nicer display and equality checks).
 */
function normalizeZero(n: number): number {
  return Object.is(n, -0) ? 0 : n;
}

/**
 * Deterministic rounding policies (financial-grade).
 * - Half-up: common in invoices/tax (5 rounds away from 0).
 * - Bankers (half-even): reduces cumulative bias in aggregates.
 */
/**
 * Round to specified decimal places using half-up policy (Phase 2 utility integration)
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency code to determine decimals automatically
 */
export function round2HalfUp(value: number, decimals?: number, currency?: SupportedCurrency): number {
  if (!Number.isFinite(value)) return value;
  
  // Use Phase 2 utility to determine decimals if currency is provided
  if (currency) {
    decimals = currencyDecimals(currency);
  } else if (decimals === undefined) {
    decimals = getDefaultDecimals(); // Use Phase 2 utility for consistent defaults
  }
  
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = getDefaultDecimals();
  
  // Implement true half-up rounding (5 rounds away from 0)
  // Handle floating point precision issues by using a more robust approach
  const factor = 10 ** decimals;
  const scaled = Math.round(value * factor * 1.0000000001); // Add tiny epsilon to handle precision
  return normalizeZero(scaled / factor);
}

/**
 * Round to specified decimal places using bankers (half-even) policy (Phase 2 utility integration)
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency code to determine decimals automatically
 */
export function round2Bankers(value: number, decimals?: number, currency?: SupportedCurrency): number {
  if (!Number.isFinite(value)) return value;
  
  // Use Phase 2 utility to determine decimals if currency is provided
  if (currency) {
    decimals = currencyDecimals(currency);
  } else if (decimals === undefined) {
    decimals = getDefaultDecimals(); // Use Phase 2 utility for consistent defaults
  }
  
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = getDefaultDecimals();
  
  // Round to decimals using half-even policy.
  // Scale to minor units, detect .5 ties, then round to nearest even.
  const factor = 10 ** decimals;
  const scaled = value * factor;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (Math.abs(frac - 0.5) < Number.EPSILON || Math.abs(frac + 0.5) < Number.EPSILON) {
    // Tie: choose the even integer
    const even = floor % 2 === 0 ? floor : floor + (scaled >= 0 ? 1 : -1);
    return normalizeZero(even / factor);
  }
  return normalizeZero(Math.round(scaled) / factor);
}

// Back-compat default: half-up is the typical accounting default.
export const round2 = round2HalfUp;

export function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const;
/**
 * AccountType: value + type shim
 * - Keeps existing string-literal type
 * - Adds a value object so callsites can use `AccountType.ASSET` safely
 */
export const AccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE',
} as const;
// eslint-disable-next-line no-redeclare
export type AccountType = (typeof AccountType)[keyof typeof AccountType];
const ACCOUNT_TYPES_SET: ReadonlySet<string> = new Set(ACCOUNT_TYPES as readonly string[]);

export function isValidAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && ACCOUNT_TYPES_SET.has(value);
}

/**
 * Optional helper to normalize user input before validation.
 */
export function normalizeAccountType(value: unknown): AccountType | undefined {
  if (typeof value !== 'string') return undefined;
  const upper = normalizeAccountCode(value);
  return ACCOUNT_TYPES_SET.has(upper) ? (upper as AccountType) : undefined;
}

/**
 * Convert a decimal amount to minor units (integer) to avoid float drift (Phase 2 utility integration)
 * @param amount - Decimal amount to convert
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency code to determine decimals automatically
 * @returns Minor units as integer
 * e.g. 12.34 -> 1234 (decimals=2)
 */
export function toMinorUnits(amount: number, decimals?: number, currency?: SupportedCurrency): number {
  if (!Number.isFinite(amount)) return amount;
  
  // Use Phase 2 utility to determine decimals if currency is provided
  if (currency) {
    decimals = currencyDecimals(currency);
  } else if (decimals === undefined) {
    decimals = getDefaultDecimals(); // Use Phase 2 utility for consistent defaults
  }
  
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = getDefaultDecimals();
  const factor = 10 ** decimals;
  // Use half-up when converting to integer cents
  return Math.round(amount * factor);
}

/**
 * Convert minor units back to decimal amount (Phase 2 utility integration)
 * @param minor - Minor units as integer
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency code to determine decimals automatically
 * @returns Decimal amount
 * e.g. 1234 -> 12.34 (decimals=2)
 */
export function fromMinorUnits(minor: number, decimals?: number, currency?: SupportedCurrency): number {
  if (!Number.isFinite(minor)) return minor;
  
  // Use Phase 2 utility to determine decimals if currency is provided
  if (currency) {
    decimals = currencyDecimals(currency);
  } else if (decimals === undefined) {
    decimals = getDefaultDecimals(); // Use Phase 2 utility for consistent defaults
  }
  
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = getDefaultDecimals();
  const factor = 10 ** decimals;
  return normalizeZero(minor / factor);
}
