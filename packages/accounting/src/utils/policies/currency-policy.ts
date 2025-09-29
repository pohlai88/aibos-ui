/**
 * Currency Policy - Single Source of Truth
 * 
 * Centralized currency definitions, defaults, and decimal handling
 * to ensure consistent currency operations across all accounting utilities.
 * 
 * @fileoverview SSOT for currency policy and MYR default
 */

// ============================================================================
// CURRENCY DEFINITIONS
// ============================================================================

/**
 * Supported currencies for accounting operations
 */
export const SUPPORTED_CURRENCIES = [
  'MYR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK',
  'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR',
  'KRW', 'THB', 'VND', 'IDR', 'PHP'
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Default currency for the system
 */
export const DEFAULT_CURRENCY = 'MYR' as const;

/**
 * Optimized set for O(1) membership checks.
 * Keep this the single truth derived from SUPPORTED_CURRENCIES.
 */
export const SUPPORTED_CURRENCIES_SET: ReadonlySet<SupportedCurrency> = new Set(SUPPORTED_CURRENCIES);

// ============================================================================
// CURRENCY DECIMALS
// ============================================================================

/**
 * Decimal places for each currency
 */
export const CURRENCY_DECIMALS: Record<SupportedCurrency, number> = {
  // Major currencies (2 decimals)
  'MYR': 2, 'USD': 2, 'EUR': 2, 'GBP': 2, 'AUD': 2, 'CAD': 2, 'CHF': 2,
  'SEK': 2, 'NZD': 2, 'MXN': 2, 'SGD': 2, 'HKD': 2, 'NOK': 2, 'TRY': 2,
  'RUB': 2, 'INR': 2, 'BRL': 2, 'ZAR': 2, 'THB': 2, 'IDR': 2, 'PHP': 2,
  
  // Zero decimal currencies
  'JPY': 0, 'KRW': 0, 'VND': 0,
  
  // Special cases
  'CNY': 2, // Chinese Yuan
} as const;

/**
 * Derived helpers
 */
export const ZERO_DECIMAL_CURRENCIES: ReadonlySet<SupportedCurrency> = new Set(
  Object.entries(CURRENCY_DECIMALS)
    .filter(([, d]) => d === 0)
    .map(([k]) => k as SupportedCurrency)
);

// ============================================================================
// CURRENCY UTILITIES
// ============================================================================

/**
 * Get decimal places for a currency
 */
export function currencyDecimals(currency: string | SupportedCurrency): number {
  return CURRENCY_DECIMALS[currency as SupportedCurrency] ?? 2; // Default to 2 decimals
}

/**
 * Check if currency is supported
 */
export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES_SET.has(currency as SupportedCurrency);
}

/**
 * Validate currency with error message
 */
export function validateCurrency(currency: string): SupportedCurrency {
  if (!isSupportedCurrency(currency)) {
    throw new Error(`Unsupported currency: ${currency}. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  return currency;
}

/**
 * Normalize currency code (uppercase, trim)
 */
export function normalizeCurrency(currency: string): SupportedCurrency | null {
  const normalized = currency.trim().toUpperCase();
  return isSupportedCurrency(normalized) ? normalized : null;
}

/**
 * Is the currency zero-decimal?
 */
export function isZeroDecimalCurrency(currency: string | SupportedCurrency): boolean {
  const c = typeof currency === 'string' ? normalizeCurrency(currency) : currency;
  return c ? ZERO_DECIMAL_CURRENCIES.has(c) : false;
}

/**
 * Minor unit factor: 10 ** decimals
 */
export function minorUnitFactor(currency: string | SupportedCurrency): number {
  const decimals = currencyDecimals((typeof currency === 'string' ? (normalizeCurrency(currency) ?? (currency as SupportedCurrency)) : currency));
  // Guard against pathological decimals (shouldn't happen with our SSOT)
  return decimals <= 0 ? 1 : Math.pow(10, decimals);
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  'MYR': 'RM', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': 'A$',
  'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr', 'NZD': 'NZ$', 'MXN': '$',
  'SGD': 'S$', 'HKD': 'HK$', 'NOK': 'kr', 'TRY': '₺', 'RUB': '₽', 'INR': '₹',
  'BRL': 'R$', 'ZAR': 'R', 'KRW': '₩', 'THB': '฿', 'VND': '₫', 'IDR': 'Rp', 'PHP': '₱'
} as const;

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
