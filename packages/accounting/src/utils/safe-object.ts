/**
 * Safe Object Utilities
 *
 * Local utilities for safe object property access and manipulation.
 * Replaces @aibos/utils dependency with focused, accounting-specific utilities.
 *
 * Production-grade utilities with deterministic rounding policies and proper type safety.
 */

export type Dict = Record<string, unknown>;

export function isRecord(v: unknown): v is Dict {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function hasKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * safeGet - simplified version that works with both typed and dynamic objects
 */
export function safeGet<T extends object, K extends keyof T>(obj: T | unknown, key: K): T[K] | undefined;
export function safeGet<T extends object, K extends keyof T, R>(obj: T | unknown, key: K, fallback: R): T[K] | R;
export function safeGet(obj: unknown, key: PropertyKey, fallback?: unknown): unknown {
  if (!isRecord(obj)) return fallback;
  if (key in obj) return (obj as Record<PropertyKey, unknown>)[key];
  return fallback;
}

/**
 * safeGetNumber: convenience for numeric maps (e.g., FX rates)
 */
export function safeGetNumber(
  obj: Record<string, unknown> | unknown,
  key: string,
  fallback = 0
): number {
  const v = safeGet(obj as Record<string, unknown>, key, fallback);
  return typeof v === 'number' ? v : fallback;
}

export const assert = (cond: unknown, message = 'Assertion failed'): asserts cond => {
  if (!cond) throw new Error(message);
};

// Additional accounting-specific utilities

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
export function round2HalfUp(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return value;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = 2;
  
  // Implement true half-up rounding (5 rounds away from 0)
  // Handle floating point precision issues by using a more robust approach
  const factor = 10 ** decimals;
  const scaled = Math.round(value * factor * 1.0000000001); // Add tiny epsilon to handle precision
  return normalizeZero(scaled / factor);
}

export function round2Bankers(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return value;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = 2;
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
export type AccountType = (typeof ACCOUNT_TYPES)[number];
const ACCOUNT_TYPES_SET: ReadonlySet<string> = new Set(ACCOUNT_TYPES as readonly string[]);

export function isValidAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && ACCOUNT_TYPES_SET.has(value);
}

/**
 * Optional helper to normalize user input before validation.
 */
export function normalizeAccountType(value: unknown): AccountType | undefined {
  if (typeof value !== 'string') return undefined;
  const upper = value.trim().toUpperCase();
  return ACCOUNT_TYPES_SET.has(upper) ? (upper as AccountType) : undefined;
}

/**
 * Convert a decimal amount to minor units (integer) to avoid float drift.
 * e.g. 12.34 -> 1234 (decimals=2)
 */
export function toMinorUnits(amount: number, decimals = 2): number {
  if (!Number.isFinite(amount)) return amount;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = 2;
  const factor = 10 ** decimals;
  // Use half-up when converting to integer cents
  return Math.round(amount * factor);
}

/**
 * Convert minor units back to decimal amount.
 * e.g. 1234 -> 12.34 (decimals=2)
 */
export function fromMinorUnits(minor: number, decimals = 2): number {
  if (!Number.isFinite(minor)) return minor;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) decimals = 2;
  const factor = 10 ** decimals;
  return normalizeZero(minor / factor);
}
