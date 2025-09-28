/**
 * Enterprise Accounting Utilities - PUBLIC API
 *
 * ⚠️  IMPORTANT: This is the ONLY public entry point for accounting utilities.
 * 
 * This file re-exports utilities from internal files and adds core accounting logic.
 * Downstream code MUST import from this file only. Do NOT import directly from:
 * - ./safe-object (internal)
 * - ./omitUndefined (internal)
 * 
 * This provides a curated, stable API surface for accounting operations.
 * Internal implementation details may change, but this interface remains stable.
 *
 * Production-ready utilities specifically designed for accounting operations.
 * Optimized for precision, compliance, and enterprise requirements.
 */

// ============================================================================
// RE-EXPORT INTERNAL UTILITIES
// ============================================================================

// Re-export safe object utilities
export {
  safeGet,
  safeGetNumber,
  isRecord,
  hasKey,
  round2,
  round2HalfUp,
  round2Bankers,
  isNonEmpty,
  isValidAccountType,
  normalizeAccountType,
  toMinorUnits,
  fromMinorUnits,
  ACCOUNT_TYPES,
  AccountType,
  type AccountType as AccountTypeType,
  type Dict,
  assert,
} from './safe-object';

// Re-export object shaping utilities
export {
  omitUndefined,
  conditionalProperty,
  buildConditionalObject,
  safeSpread,
} from './omitUndefined';

// ============================================================================
// CURRENCY UTILITIES
// ============================================================================

/**
 * Supported currencies for accounting operations
 */
export const SUPPORTED_CURRENCIES = [
  'MYR',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'SEK',
  'NZD',
  'MXN',
  'SGD',
  'HKD',
  'NOK',
  'TRY',
  'RUB',
  'INR',
  'BRL',
  'ZAR',
  'KRW',
  'THB',
  'VND',
  'IDR',
  'PHP',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Currency decimal places mapping
 */
export const CURRENCY_DECIMALS = {
  MYR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  AUD: 2,
  CAD: 2,
  CHF: 2,
  CNY: 2,
  SEK: 2,
  NZD: 2,
  MXN: 2,
  SGD: 2,
  HKD: 2,
  NOK: 2,
  TRY: 2,
  RUB: 2,
  INR: 2,
  BRL: 2,
  ZAR: 2,
  KRW: 0,
  THB: 2,
  VND: 0,
  IDR: 0,
  PHP: 2,
} satisfies Record<SupportedCurrency, number>;

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

/**
 * Get decimal places for currency (strict validation)
 */
export function getCurrencyDecimalsStrict(currency: string): number {
  const norm = normalizeCurrency(currency);
  if (!norm) throw new Error(`Unsupported currency: ${currency}`);
  return CURRENCY_DECIMALS[norm];
}

/**
 * Get decimal places for currency (fallback to 2)
 * @deprecated Use getCurrencyDecimalsStrict for production code
 */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency as SupportedCurrency] ?? 2;
}

/**
 * Normalize currency code to uppercase
 */
export function normalizeCurrency(currency: string): SupportedCurrency | null {
  const normalized = currency.trim().toUpperCase();
  return isValidCurrency(normalized) ? normalized : null;
}

// ============================================================================
// DATE & PERIOD UTILITIES
// ============================================================================

/**
 * Accounting period formats
 */
type QuarterTag = `YYYY-Q${1 | 2 | 3 | 4}`;
export type PeriodFormat = 'YYYY-MM' | QuarterTag | 'YYYY';

/**
 * Parse accounting period string
 */
export function parseAccountingPeriod(period: string): {
  year: number;
  month?: number;
  quarter?: number;
  format: PeriodFormat;
} | null {
  const trimmed = period.trim();

  // YYYY-MM format
  const monthlyMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (monthlyMatch) {
    const year = parseInt(monthlyMatch[1]!, 10);
    const month = parseInt(monthlyMatch[2]!, 10);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      return { year, month, format: 'YYYY-MM' };
    }
  }

  // YYYY-QN format
  const quarterlyMatch = trimmed.match(/^(\d{4})-Q([1-4])$/);
  if (quarterlyMatch) {
    const year = parseInt(quarterlyMatch[1]!, 10);
    const quarter = parseInt(quarterlyMatch[2]!, 10);
    if (year >= 1900 && year <= 2100) {
      return { year, quarter, format: `YYYY-Q${quarter}` as PeriodFormat };
    }
  }

  // YYYY format
  const yearlyMatch = trimmed.match(/^(\d{4})$/);
  if (yearlyMatch) {
    const year = parseInt(yearlyMatch[1]!, 10);
    if (year >= 1900 && year <= 2100) {
      return { year, format: 'YYYY' };
    }
  }

  return null;
}

/**
 * Get period range in UTC milliseconds (end-exclusive)
 * Production-safe period handling with proper timezone handling
 */
export function getPeriodRangeUTC(period: string): { startMs: number; endMs: number } | null {
  const parsed = parseAccountingPeriod(period);
  if (!parsed) return null;
  const { year, month, quarter } = parsed;

  if (month) {
    const startMs = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
    const endMs = Date.UTC(year, month, 1, 0, 0, 0, 0); // next month start
    return { startMs, endMs };
  }

  if (quarter) {
    const startMonth = (quarter - 1) * 3;
    const startMs = Date.UTC(year, startMonth, 1, 0, 0, 0, 0);
    const endMs = Date.UTC(year, startMonth + 3, 1, 0, 0, 0, 0); // next quarter start
    return { startMs, endMs };
  }

  const startMs = Date.UTC(year, 0, 1, 0, 0, 0, 0);
  const endMs = Date.UTC(year + 1, 0, 1, 0, 0, 0, 0); // next year start
  return { startMs, endMs };
}

/**
 * Get period start and end dates (UTC-based, end-exclusive)
 * @deprecated Use getPeriodRangeUTC for production code
 */
export function getPeriodDates(period: string): { startDate: Date; endDate: Date } | null {
  const range = getPeriodRangeUTC(period);
  if (!range) return null;

  return {
    startDate: new Date(range.startMs),
    endDate: new Date(range.endMs), // This is the exclusive end
  };
}

/**
 * Check if date is within accounting period (UTC-based, end-exclusive)
 */
export function isDateInPeriod(date: Date, period: string): boolean {
  const range = getPeriodRangeUTC(period);
  if (!range) return false;
  const timestamp = date.getTime();
  return timestamp >= range.startMs && timestamp < range.endMs; // end exclusive
}

// ============================================================================
// ACCOUNTING VALIDATION UTILITIES
// ============================================================================

/**
 * Account code validation patterns
 */
export const ACCOUNT_CODE_PATTERNS = {
  STANDARD: /^[A-Z0-9]{3,20}$/,
  HIERARCHICAL: /^[A-Z0-9]{1,4}\.[A-Z0-9]{1,4}$/,
  // Allows multi-segment hierarchical codes (e.g., 1000.10.001 or A1.B2.C3.D4)
  // Each segment 1–4 chars, uppercase letters or digits, requires at least 2 dots (3+ segments).
  HIERARCHICAL_MULTI: /^[A-Z0-9]{1,4}(?:\.[A-Z0-9]{1,4}){2,}$/,
  NUMERIC: /^\d{3,10}$/,
} as const;

/**
 * Validate account code format
 */
export function isValidAccountCode(
  code: string,
  pattern: keyof typeof ACCOUNT_CODE_PATTERNS = 'STANDARD',
): boolean {
  return ACCOUNT_CODE_PATTERNS[pattern].test(code.trim().toUpperCase());
}

/**
 * Normalize account code (applies to validation)
 *
 * Note: Consider applying normalization at the source (validators/controllers)
 * to ensure consistent storage format and avoid mixed-case issues.
 */
export function normalizeAccountCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Parse hierarchical account code into segments
 */
export function parseHierarchicalAccountCode(
  code: string,
  pattern: 'HIERARCHICAL' | 'HIERARCHICAL_MULTI' = 'HIERARCHICAL',
): string[] | null {
  const normalized = normalizeAccountCode(code);
  if (!isValidAccountCode(normalized, pattern)) {
    return null;
  }

  return normalized.split('.');
}

/**
 * Format segments into a hierarchical account code and validate with a pattern.
 * - Ensures each segment is 1–4 chars, alnum only, uppercased.
 * - pattern='HIERARCHICAL' (1–2 segments) or 'HIERARCHICAL_MULTI' (≥3 segments)
 */
export function formatHierarchicalAccountCode(
  segments: string[],
  pattern: 'HIERARCHICAL' | 'HIERARCHICAL_MULTI' = 'HIERARCHICAL',
): string {
  const cleaned = segments.map((s) => s.trim().toUpperCase());
  if (cleaned.length === 0) throw new Error('No segments provided');
  if (!cleaned.every((s) => /^[A-Z0-9]{1,4}$/.test(s))) {
    throw new Error('Each segment must be 1–4 alphanumeric chars');
  }
  const joined = cleaned.join('.');
  if (!isValidAccountCode(joined, pattern)) {
    throw new Error(`Joined code "${joined}" does not match ${pattern}`);
  }
  return joined;
}

/**
 * Get account code pattern type based on code structure
 */
export function detectAccountCodePattern(code: string): keyof typeof ACCOUNT_CODE_PATTERNS | null {
  const normalized = normalizeAccountCode(code);

  // Check patterns in order of specificity (most specific first)
  const patterns: Array<keyof typeof ACCOUNT_CODE_PATTERNS> = [
    'NUMERIC', // Most specific: only digits
    'HIERARCHICAL_MULTI', // Multi-segment hierarchical
    'HIERARCHICAL', // Two-segment hierarchical
    'STANDARD', // General alphanumeric
  ];

  for (const patternName of patterns) {
    if (ACCOUNT_CODE_PATTERNS[patternName].test(normalized)) {
      return patternName;
    }
  }

  return null;
}

/**
 * Journal entry validation
 */
export interface JournalEntryValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Options for journal validation.
 * - strategy: 'number' (default) uses JS numbers for summation
 *             'bigint' uses BigInt for summation to avoid precision/overflow in huge batches
 */
export interface JournalValidationOptions {
  /**
   * Summation strategy:
   * - 'number' (default): JS numbers
   * - 'bigint': BigInt summation
   * - 'auto': switch to BigInt when entries exceed autoThreshold
   */
  strategy?: 'number' | 'bigint' | 'auto';
  /**
   * Only used when strategy === 'auto'.
   * When entries.length >= autoThreshold, BigInt is used for summation.
   * Default: 50_000
   */
  autoThreshold?: number;
}

/**
 * Decide whether to use BigInt for journal summation given an entries length and a threshold.
 * Returns true when entriesLength >= threshold (default 50_000).
 */
export function shouldUseBigIntForJournal(entriesLength: number, threshold = 50_000): boolean {
  return entriesLength >= threshold;
}

/**
 * Validate journal entry balance (currency-aware, minor units precision)
 */
export function validateJournalEntryBalance(
  entries: Array<{ debitAmount: number; creditAmount: number }>,
  currency: SupportedCurrency = 'MYR',
  maxLines: number = 100,
  options?: JournalValidationOptions,
): JournalEntryValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requestedStrategy = options?.strategy ?? 'number';
  const autoThreshold = options?.autoThreshold ?? 50_000;
  const strategy =
    requestedStrategy === 'auto'
      ? shouldUseBigIntForJournal(entries.length, autoThreshold)
        ? 'bigint'
        : 'number'
      : requestedStrategy;

  if (entries.length < 2) {
    errors.push('Journal entry must have at least two lines');
  }

  if (entries.length > maxLines) {
    errors.push(`Journal entry cannot have more than ${maxLines} lines`);
  }

  // Ledger-grade: round EACH LINE to minor units, then sum.
  // This mirrors how journals are persisted and avoids float aggregation drift.
  const decimals = CURRENCY_DECIMALS[currency];
  const factor = Math.pow(10, decimals);

  // Two summation paths: numbers (default) vs BigInt (opt-in)
  let totalDebitsMinor = 0;
  let totalCreditsMinor = 0;
  let totalDebitsMinorBig = 0n;
  let totalCreditsMinorBig = 0n;

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]!;
    const debitMinor = Math.round(entry.debitAmount * factor);
    const creditMinor = Math.round(entry.creditAmount * factor);
    if (strategy === 'bigint') {
      totalDebitsMinorBig += BigInt(debitMinor);
      totalCreditsMinorBig += BigInt(creditMinor);
    } else {
      totalDebitsMinor += debitMinor;
      totalCreditsMinor += creditMinor;
    }
  }

  // Helper to format BigInt minor units without precision loss
  const formatMinorUnits = (minor: bigint, decimals: number): string => {
    const sign = minor < 0n ? '-' : '';
    const abs = minor < 0n ? -minor : minor;
    const base = 10n ** BigInt(decimals);
    const whole = abs / base;
    const frac = abs % base;
    const fracString = decimals > 0 ? frac.toString().padStart(decimals, '0') : '';
    return decimals > 0 ? `${sign}${whole.toString()}.${fracString}` : `${sign}${whole.toString()}`;
  };

  if (strategy === 'bigint') {
    if (totalDebitsMinorBig !== totalCreditsMinorBig) {
      const debString = formatMinorUnits(totalDebitsMinorBig, decimals);
      const creString = formatMinorUnits(totalCreditsMinorBig, decimals);
      errors.push(`Journal entry is not balanced: debits ${debString} != credits ${creString}`);
    }
  } else {
    if (totalDebitsMinor !== totalCreditsMinor) {
      errors.push(
        `Journal entry is not balanced: debits ${(totalDebitsMinor / factor).toFixed(decimals)} != credits ${(totalCreditsMinor / factor).toFixed(decimals)}`,
      );
    }
  }

  // Check for invalid entries
  entries.forEach((entry, index) => {
    if (entry.debitAmount < 0) {
      errors.push(`Line ${index + 1}: Debit amount cannot be negative`);
    }
    if (entry.creditAmount < 0) {
      errors.push(`Line ${index + 1}: Credit amount cannot be negative`);
    }
    if (entry.debitAmount > 0 && entry.creditAmount > 0) {
      errors.push(`Line ${index + 1}: Cannot have both debit and credit amounts`);
    }
    if (entry.debitAmount === 0 && entry.creditAmount === 0) {
      errors.push(`Line ${index + 1}: Must have either debit or credit amount`);
    }

    // Business rule warnings (currency-agnostic)
    if (entry.debitAmount > 1_000_000 || entry.creditAmount > 1_000_000) {
      warnings.push(`Line ${index + 1}: Amount exceeds 1,000,000 - verify accuracy`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// FINANCIAL CALCULATION UTILITIES
// ============================================================================

/**
 * ⚠️  FLOATING-POINT PRECISION WARNING ⚠️
 *
 * The functions below use JavaScript's binary floating-point arithmetic.
 * For ledger-grade precision in production systems, consider:
 * - Using minor units (integers) for all calculations
 * - Implementing decimal.js or big.js for high-precision arithmetic
 * - Rounding to currency decimals at every step
 *
 * These functions are suitable for rough calculations and estimates.
 */

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  periods: number,
  compoundingFrequency: number = 1,
): number {
  if (principal <= 0 || rate < 0 || periods <= 0 || compoundingFrequency <= 0) {
    throw new Error('Invalid parameters for compound interest calculation');
  }

  const effectiveRate = rate / compoundingFrequency;
  const totalPeriods = periods * compoundingFrequency;

  return principal * Math.pow(1 + effectiveRate, totalPeriods);
}

/**
 * Calculate present value
 */
export function calculatePresentValue(futureValue: number, rate: number, periods: number): number {
  if (futureValue <= 0 || rate < 0 || periods <= 0) {
    throw new Error('Invalid parameters for present value calculation');
  }

  return futureValue / Math.pow(1 + rate, periods);
}

/**
 * Calculate depreciation (straight-line method)
 */
export function calculateStraightLineDepreciation(
  cost: number,
  salvageValue: number,
  usefulLife: number,
): number {
  if (cost <= 0 || salvageValue < 0 || usefulLife <= 0) {
    throw new Error('Invalid parameters for depreciation calculation');
  }

  return (cost - salvageValue) / usefulLife;
}

/**
 * Calculate depreciation (declining balance method)
 */
export function calculateDecliningBalanceDepreciation(
  cost: number,
  rate: number,
  accumulatedDepreciation: number = 0,
): number {
  if (cost <= 0 || rate <= 0 || rate > 1 || accumulatedDepreciation < 0) {
    throw new Error('Invalid parameters for declining balance depreciation');
  }

  const bookValue = cost - accumulatedDepreciation;
  return Math.min(bookValue * rate, bookValue);
}

// ============================================================================
// TAX CALCULATION UTILITIES
// ============================================================================

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  currency: string;
}

/**
 * Calculate tax amount (strict currency validation)
 */
export function calculateTax(
  taxableAmount: number,
  taxRate: number,
  currency: string = 'MYR',
): TaxCalculation {
  if (taxableAmount < 0) {
    throw new Error('Taxable amount cannot be negative');
  }

  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }

  const decimals = getCurrencyDecimalsStrict(currency);
  const factor = Math.pow(10, decimals);
  const taxAmount = Math.round(taxableAmount * taxRate * factor) / factor;

  const normalized = normalizeCurrency(currency)!;
  return { taxableAmount, taxRate, taxAmount, currency: normalized };
}

/**
 * Calculate tax-inclusive amount (strict currency validation)
 */
export function calculateTaxInclusive(
  netAmount: number,
  taxRate: number,
  currency: string = 'MYR',
): number {
  if (netAmount < 0) {
    throw new Error('Net amount cannot be negative');
  }

  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }

  const decimals = getCurrencyDecimalsStrict(currency);
  const factor = Math.pow(10, decimals);
  return Math.round(netAmount * (1 + taxRate) * factor) / factor;
}

// ============================================================================
// ROUNDING UTILITIES
// ============================================================================

const EPS = 1e-10;

/**
 * Rounding methods for accounting
 */
export enum RoundingMethod {
  HALF_UP = 'HALF_UP',
  HALF_DOWN = 'HALF_DOWN',
  HALF_EVEN = 'HALF_EVEN',
  CEILING = 'CEILING',
  FLOOR = 'FLOOR',
}

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
 * Round amount using specified method (production-grade)
 */
export function roundAmount(
  amount: number,
  decimals: number = 2,
  method: RoundingMethod = RoundingMethod.HALF_EVEN, // Default to bankers rounding
): number {
  if (!Number.isFinite(amount)) return amount;
  if (!Number.isInteger(decimals)) decimals = 2;
  decimals = Math.max(0, Math.min(8, decimals));

  const factor = Math.pow(10, decimals);
  const scaled = amount * factor;

  let rounded: number;
  switch (method) {
    case RoundingMethod.HALF_UP:
      rounded = Math.sign(scaled) * Math.round(Math.abs(scaled)); // standard half-up
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
    default:
      rounded = Math.round(scaled);
  }
  return rounded / factor;
}

/**
 * Round currency amount (strict validation)
 */
export function roundCurrency(amount: number, currency: string): number {
  const decimals = getCurrencyDecimalsStrict(currency);
  return roundAmount(amount, decimals, RoundingMethod.HALF_EVEN);
}

// ============================================================================
// END OF ACCOUNTING UTILITIES
// ============================================================================
// 
// Note: Re-exports are now handled by the index.ts barrel file
// to maintain clear separation between core logic and API surface.
