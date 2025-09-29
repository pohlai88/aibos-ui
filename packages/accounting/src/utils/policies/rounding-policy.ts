/**
 * Rounding Policy - Single Source of Truth
 * 
 * Centralized rounding method definitions and policies to ensure
 * consistent rounding behavior across all accounting utilities.
 * 
 * @fileoverview SSOT for rounding policy and HALF_EVEN default
 */

// ============================================================================
// ROUNDING METHODS
// ============================================================================

/**
 * Rounding methods for accounting operations
 */
export enum RoundingMethod {
  HALF_UP = 'HALF_UP',
  HALF_DOWN = 'HALF_DOWN', 
  HALF_EVEN = 'HALF_EVEN',
  CEILING = 'CEILING',
  FLOOR = 'FLOOR',
  TRUNCATE = 'TRUNCATE'
}

/**
 * Default rounding method (Bankers Rounding)
 */
export const DEFAULT_ROUNDING_METHOD = RoundingMethod.HALF_EVEN;

// ============================================================================
// BACKWARD COMPATIBILITY MAPPING
// ============================================================================

/**
 * String to enum mapping for backward compatibility
 */
export const STRING_TO_ENUM_MAP: Record<string, RoundingMethod> = {
  // From existing enum values
  'HALF_UP': RoundingMethod.HALF_UP,
  'HALF_DOWN': RoundingMethod.HALF_DOWN,
  'HALF_EVEN': RoundingMethod.HALF_EVEN,
  'CEILING': RoundingMethod.CEILING,
  'FLOOR': RoundingMethod.FLOOR,
  'TRUNCATE': RoundingMethod.TRUNCATE,
  
  // From string literals found in codebase
  'round_half_up': RoundingMethod.HALF_UP,
  'round_half_down': RoundingMethod.HALF_DOWN,
  'round_half_even': RoundingMethod.HALF_EVEN,
  'round_up': RoundingMethod.CEILING,
  'round_down': RoundingMethod.FLOOR,
  'truncate': RoundingMethod.TRUNCATE,
} as const;

/**
 * Fast membership checks and case-insensitive string normalization.
 */
export const ROUNDING_METHOD_SET: ReadonlySet<RoundingMethod> = new Set(Object.values(RoundingMethod));
const STRING_TO_ENUM_LOWER: Readonly<Record<string, RoundingMethod>> = Object.fromEntries(
  Object.entries(STRING_TO_ENUM_MAP).map(([k, v]) => [k.toLowerCase(), v])
) as Record<string, RoundingMethod>;

// ============================================================================
// ROUNDING UTILITIES
// ============================================================================

/**
 * Normalize rounding method from string or enum
 */
export function normalizeRoundingMethod(method: string | RoundingMethod): RoundingMethod {
  if (typeof method === 'string') {
    const raw = method.trim();
    // Prefer exact match, then UPPER, then lower
    return (
      STRING_TO_ENUM_MAP[raw] ??
      STRING_TO_ENUM_MAP[raw.toUpperCase()] ??
      STRING_TO_ENUM_LOWER[raw.toLowerCase()] ??
      DEFAULT_ROUNDING_METHOD
    );
  }
  return method;
}

/**
 * Check if value is a valid rounding method
 */
export function isRoundingMethod(value: unknown): value is RoundingMethod {
  return typeof value === 'string' && ROUNDING_METHOD_SET.has(value as RoundingMethod);
}

/**
 * Validate rounding method with error message
 */
export function validateRoundingMethod(method: unknown): RoundingMethod {
  if (typeof method === 'string' && STRING_TO_ENUM_MAP[method]) {
    return STRING_TO_ENUM_MAP[method];
  }
  if (isRoundingMethod(method)) {
    return method;
  }
  throw new Error(`Invalid rounding method: ${method}. Valid methods: ${Object.values(RoundingMethod).join(', ')}`);
}

// ============================================================================
// ROUNDING IMPLEMENTATION
// ============================================================================

const EPS = 1e-10;

/**
 * True bankers rounding (half-even), correct for negatives
 */
function roundHalfEven(x: number): number {
  const sign = Math.sign(x);
  const ax = Math.abs(x);
  const flo = Math.floor(ax);
  const frac = ax - flo; // [0,1)
  let res: number;
  if (frac > 0.5 + EPS) res = Math.ceil(ax);
  else if (frac < 0.5 - EPS) res = Math.floor(ax);
  else res = flo % 2 === 0 ? flo : flo + 1; // tie → even
  return sign * res;
}

/**
 * True half-down rounding (toward zero for .5), correct for negatives
 */
function roundHalfDown(x: number): number {
  const sign = Math.sign(x);
  const ax = Math.abs(x);
  const flo = Math.floor(ax);
  const frac = ax - flo;
  let res: number;
  if (frac > 0.5 + EPS) res = Math.ceil(ax);
  else if (frac < 0.5 - EPS) res = Math.floor(ax);
  else res = flo; // tie → toward zero
  return sign * res;
}

/**
 * True half-up rounding (away from zero for .5), correct for negatives
 * Implemented similar to the other half-* variants for consistency.
 */
function roundHalfUp(x: number): number {
  const sign = Math.sign(x);
  const ax = Math.abs(x);
  const flo = Math.floor(ax);
  const frac = ax - flo;
  let res: number;
  if (frac > 0.5 + EPS) res = Math.ceil(ax);
  else if (frac < 0.5 - EPS) res = Math.floor(ax);
  else res = flo + 1; // tie → away from zero
  return sign * res;
}

/**
 * Round number using specified method
 */
export function roundNumber(
  amount: number,
  decimals: number = 2,
  method: RoundingMethod = DEFAULT_ROUNDING_METHOD,
): number {
  if (!Number.isFinite(amount)) return amount;
  if (!Number.isInteger(decimals)) decimals = 2;
  decimals = Math.max(0, Math.min(8, decimals));

  const factor = Math.pow(10, decimals);
  const scaled = amount * factor;

  let rounded: number;
  switch (method) {
    case RoundingMethod.HALF_UP:
      rounded = roundHalfUp(scaled);
      break;
    case RoundingMethod.HALF_DOWN:
      rounded = roundHalfDown(scaled);
      break;
    case RoundingMethod.HALF_EVEN:
      rounded = roundHalfEven(scaled);
      break;
    case RoundingMethod.CEILING:
      rounded = Math.ceil(scaled);
      break;
    case RoundingMethod.FLOOR:
      rounded = Math.floor(scaled);
      break;
    case RoundingMethod.TRUNCATE:
      rounded = Math.trunc(scaled);
      break;
    default:
      rounded = Math.round(scaled);
  }
  return rounded / factor;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All valid rounding methods
 */
export const ROUNDING_METHODS: readonly RoundingMethod[] = Object.values(RoundingMethod);

/**
 * Rounding method descriptions
 */
export const ROUNDING_DESCRIPTIONS: Record<RoundingMethod, string> = {
  [RoundingMethod.HALF_UP]: 'Round half away from zero',
  [RoundingMethod.HALF_DOWN]: 'Round half toward zero',
  [RoundingMethod.HALF_EVEN]: 'Round half to even (bankers rounding)',
  [RoundingMethod.CEILING]: 'Round toward positive infinity',
  [RoundingMethod.FLOOR]: 'Round toward negative infinity',
  [RoundingMethod.TRUNCATE]: 'Truncate toward zero',
} as const;
