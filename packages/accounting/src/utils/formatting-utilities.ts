/**
 * Formatting Utilities - Phase 2 Implementation
 * 
 * Comprehensive formatting utilities for accounting data display.
 * Provides consistent formatting across the application.
 * 
 * Features:
 * - Currency formatting with locale support
 * - Percentage formatting
 * - Number formatting with locale support
 * - Account code formatting
 * - Tax ID formatting by country
 * - Phone number formatting
 * - Address formatting
 * - Name formatting
 * - Invoice and reference number formatting
 */

import { type SupportedCurrency, getCurrencyDecimalsStrict, normalizeCurrency } from './index';
import { round2HalfUp } from './safe-object-utilities';
import { createValidationError } from './error-utilities';
import { validateAmount } from './validation-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FormattingOptions {
  locale?: string;
  decimals?: number;
  showSymbol?: boolean;
  showCode?: boolean;
  separator?: string;
  prefix?: string;
  suffix?: string;
  /**
   * Accounting negative style:
   *  - 'minus'  => -1,234.00
   *  - 'parens' => (1,234.00)
   */
  negativeStyle?: 'minus' | 'parens';
  /**
   * Optional pass-through to Intl.NumberFormat signDisplay
   * 'auto' | 'never' | 'always' | 'exceptZero'
   */
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Name {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  title?: string;
}

// --- Locale helpers ---------------------------------------------------------
const SUPPORTED_LOCALES = {
  MY: 'en-MY',
  SG: 'en-SG',
  TH: 'th-TH',
  ID: 'id-ID',
  PH: 'en-PH',
  VN: 'vi-VN',
  US: 'en-US',
  GB: 'en-GB',
  JP: 'ja-JP',
  KR: 'ko-KR',
  CN: 'zh-CN',
} as const;

function resolveLocale(locale?: string): string {
  if (!locale) return 'en-MY';
  if (locale.includes('-')) return locale;
  return (SUPPORTED_LOCALES as Record<string, string>)[locale] ?? 'en-MY';
}

// ============================================================================

/**
 * Format currency amount with locale support
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'MYR',
  locale: string = 'en-MY',
  options: FormattingOptions = {}
): string {
  // Use Phase 2 utility for amount validation
  const amountValidation = validateAmount(amount);
  if (!amountValidation.isValid) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        `Amount validation failed: ${amountValidation.errors.join(', ')}`,
        amount,
        { operation: 'format-currency' }
      );
  }

  const normalizedCurrency = normalizeCurrency(currency);
  if (!normalizedCurrency) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        `Unsupported currency: ${currency}`,
        currency,
        { operation: 'format-currency' }
      );
  }

  const {
    decimals = getCurrencyDecimalsStrict(normalizedCurrency),
    showSymbol = true,
    showCode = false,
    prefix = '',
    suffix = '',
    negativeStyle = 'minus',
    signDisplay,
  } = options;

  // Map flags to Intl currencyDisplay
  const currencyDisplay: 'symbol' | 'code' | 'name' | 'narrowSymbol' =
    showCode ? 'code' : (showSymbol ? 'symbol' : 'code');

  const fmtLocale = resolveLocale(locale);
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  const formatter = new Intl.NumberFormat(fmtLocale, {
    style: 'currency',
    currency: normalizedCurrency,
    currencyDisplay,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(signDisplay ? { signDisplay } : {}),
  });

  let formatted = formatter.format(abs);
  if (isNegative) {
    formatted = (negativeStyle === 'parens') ? `(${formatted})` : `-${formatted}`;
  }

  // Add prefix and suffix
  if (prefix) {
    formatted = prefix + formatted;
  }
  if (suffix) {
    formatted = formatted + suffix;
  }

  return formatted;
}

/**
 * Accounting style wrapper (defaults to parentheses for negatives)
 */
export function formatCurrencyAccounting(
  amount: number,
  currency: SupportedCurrency = 'MYR',
  locale: string = 'en-MY',
  options: FormattingOptions = {}
): string {
  return formatCurrency(amount, currency, locale, { negativeStyle: 'parens', ...options });
}

/**
 * Format currency amount with custom symbol
 */
export function formatCurrencyWithSymbol(
  amount: number,
  currency: SupportedCurrency = 'MYR',
  locale: string = 'en-MY'
): string {
  return formatCurrency(amount, currency, locale, { showSymbol: true, showCode: false });
}

/**
 * Format currency amount with currency code
 */
export function formatCurrencyWithCode(
  amount: number,
  currency: SupportedCurrency = 'MYR',
  locale: string = 'en-MY'
): string {
  return formatCurrency(amount, currency, locale, { showSymbol: false, showCode: true });
}

// ============================================================================
// PERCENTAGE FORMATTING
// ============================================================================

/**
 * Format percentage value
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  locale: string = 'en-MY',
  options: FormattingOptions = {}
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Value must be a valid number',
        value,
        { operation: 'format-number' }
      );
  }

  const { prefix = '', suffix = '' } = options;

  const formatter = new Intl.NumberFormat(resolveLocale(locale), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let formatted = formatter.format(value / 100);

  if (prefix) {
    formatted = prefix + formatted;
  }
  if (suffix) {
    formatted = formatted + suffix;
  }

  return formatted;
}

/**
 * Format percentage without % symbol
 */
export function formatPercentageNumber(
  value: number,
  decimals: number = 2,
  locale: string = 'en-MY'
): string {
  // Use Phase 2 utility for consistent number formatting
  return formatNumber(value, decimals, locale);
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format number with locale support
 */
export function formatNumber(
  value: number,
  decimals: number = 2,
  locale: string = 'en-MY',
  options: FormattingOptions = {}
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Value must be a valid number',
        value,
        { operation: 'format-number' }
      );
  }

  const { prefix = '', suffix = '' } = options;

  const formatter = new Intl.NumberFormat(resolveLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let formatted = formatter.format(value);

  if (prefix) {
    formatted = prefix + formatted;
  }
  if (suffix) {
    formatted = formatted + suffix;
  }

  return formatted;
}

/**
 * Format integer with locale support
 */
export function formatInteger(
  value: number,
  locale: string = 'en-MY'
): string {
  return formatNumber(value, 0, locale);
}

/**
 * Format number with thousands separator
 */
export function formatNumberWithSeparator(
  value: number,
  separator: string = ',',
  decimals: number = 2,
  locale: string = 'en-MY'
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Value must be a valid number',
        value,
        { operation: 'format-number' }
      );
  }
  
  // Use Phase 2 utility for base formatting, then customize separator
  const nf = new Intl.NumberFormat(resolveLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  // Reconstruct using parts so we can replace only GROUP separators.
  const parts = 'formatToParts' in nf && typeof nf.formatToParts === 'function'
    ? nf.formatToParts(value).map((p: Intl.NumberFormatPart) => {
        if (p.type === 'group') return { ...p, value: separator };
        return p;
      })
    : null;
  if (parts) return parts.map((p: Intl.NumberFormatPart) => p.value).join('');
  // Fallback (older environments): return Intl result unchanged
  return nf.format(value);
}

// ============================================================================
// ACCOUNT CODE FORMATTING
// ============================================================================

/**
 * Format account code with separator
 */
export function formatAccountCode(
  code: string,
  separator: string = '.',
  options: FormattingOptions = {}
): string {
  if (!code) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Account code is required',
        code,
        { operation: 'format-account-code' }
      );
  }

  const { prefix = '', suffix = '' } = options;

  // Clean the code
  let cleanCode = code.replace(/[^\d]/g, '');
  
  // Add separator every 2-3 digits based on common patterns
  let formatted = '';
  if (cleanCode.length <= 3) {
    formatted = cleanCode;
  } else if (cleanCode.length <= 6) {
    formatted = cleanCode.slice(0, 3) + separator + cleanCode.slice(3);
  } else if (cleanCode.length <= 9) {
    formatted = cleanCode.slice(0, 3) + separator + cleanCode.slice(3, 6) + separator + cleanCode.slice(6);
  } else {
    // For longer codes, group by 3
    const groups = [];
    for (let index = 0; index < cleanCode.length; index += 3) {
      groups.push(cleanCode.slice(index, index + 3));
    }
    formatted = groups.join(separator);
  }

  if (prefix) {
    formatted = prefix + formatted;
  }
  if (suffix) {
    formatted = formatted + suffix;
  }

  return formatted;
}

/**
 * Format account code with standard accounting format
 */
export function formatAccountCodeStandard(code: string): string {
  return formatAccountCode(code, '.', { prefix: 'ACC-' });
}

// ============================================================================
// TAX ID FORMATTING
// ============================================================================

/**
 * Format tax ID by country
 */
export function formatTaxId(
  taxId: string,
  country: string = 'MY'
): string {
  if (!taxId) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Tax ID is required',
        taxId,
        { operation: 'format-tax-id' }
      );
  }

  const cleanId = taxId.replace(/\D/g, '');

  switch (country.toUpperCase()) {
    case 'MY':
      // Malaysia: 12345678901 -> 1234-5678-901
      if (cleanId.length === 11) {
        return `${cleanId.slice(0, 4)}-${cleanId.slice(4, 8)}-${cleanId.slice(8)}`;
      }
      break;
    case 'SG':
      // Singapore: S1234567A -> S1234567A (already formatted)
      return taxId.toUpperCase();
    case 'TH':
      // Thailand: 1234567890123 -> 1-2345-67890-12-3
      if (cleanId.length === 13) {
        return `${cleanId.slice(0, 1)}-${cleanId.slice(1, 5)}-${cleanId.slice(5, 10)}-${cleanId.slice(10, 12)}-${cleanId.slice(12)}`;
      }
      break;
    case 'ID':
      // Indonesia: 123456789012345 -> 12.345.678.901.234-5
      if (cleanId.length === 15) {
        return `${cleanId.slice(0, 2)}.${cleanId.slice(2, 5)}.${cleanId.slice(5, 8)}.${cleanId.slice(8, 11)}.${cleanId.slice(11, 14)}-${cleanId.slice(14)}`;
      }
      break;
    case 'PH':
      // Philippines: 123456789012 -> 123-456-789-012
      if (cleanId.length === 12) {
        return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}-${cleanId.slice(9)}`;
      }
      break;
    case 'VN':
      // Vietnam: 1234567890 -> 1234-567-890
      if (cleanId.length === 10) {
        return `${cleanId.slice(0, 4)}-${cleanId.slice(4, 7)}-${cleanId.slice(7)}`;
      }
      break;
  }

  // Default formatting for unsupported countries
  return cleanId;
}

// ============================================================================
// PHONE NUMBER FORMATTING
// ============================================================================

/**
 * Format phone number by country
 */
export function formatPhoneNumber(
  phone: string,
  country: string = 'MY'
): string {
  if (!phone) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Phone number is required',
        phone,
        { operation: 'format-phone-number' }
      );
  }

  const cleanPhone = phone.replace(/\D/g, '');

  switch (country.toUpperCase()) {
    case 'MY':
      // Malaysia: 0123456789 -> 012-345-6789
      if (cleanPhone.length === 10 && cleanPhone.startsWith('01')) {
        return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
      }
      // Malaysia: 60123456789 -> +60 12-345-6789
      if (cleanPhone.length === 11 && cleanPhone.startsWith('601')) {
        return `+60 ${cleanPhone.slice(2, 5)}-${cleanPhone.slice(5, 8)}-${cleanPhone.slice(8)}`;
      }
      break;
    case 'SG':
      // Singapore: 81234567 -> 8123-4567
      if (cleanPhone.length === 8) {
        return `${cleanPhone.slice(0, 4)}-${cleanPhone.slice(4)}`;
      }
      // Singapore: 6581234567 -> +65 8123-4567
      if (cleanPhone.length === 10 && cleanPhone.startsWith('65')) {
        return `+65 ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
      }
      break;
    case 'TH':
      // Thailand: 812345678 -> 081-234-5678
      if (cleanPhone.length === 9) {
        return `0${cleanPhone.slice(0, 2)}-${cleanPhone.slice(2, 5)}-${cleanPhone.slice(5)}`;
      }
      break;
    case 'ID':
      // Indonesia: 8123456789 -> 0812-3456-789
      if (cleanPhone.length === 10) {
        return `0${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7)}`;
      }
      break;
    case 'PH':
      // Philippines: 9123456789 -> 0912-345-6789
      if (cleanPhone.length === 10) {
        return `0${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
      }
      break;
    case 'VN':
      // Vietnam: 1234567890 -> 0123-456-789
      if (cleanPhone.length === 10) {
        return `0${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6, 9)}`;
      }
      break;
  }

  // Default formatting
  return cleanPhone;
}

// ============================================================================
// ADDRESS FORMATTING
// ============================================================================

/**
 * Format address object to string
 */
export function formatAddress(address: Address): string {
  if (!address) {
    return '';
  }

  const parts: string[] = [];

  if (address.street) {
    parts.push(address.street);
  }

  if (address.city) {
    parts.push(address.city);
  }

  if (address.state) {
    parts.push(address.state);
  }

  if (address.postalCode) {
    parts.push(address.postalCode);
  }

  if (address.country) {
    parts.push(address.country);
  }

  return parts.join(', ');
}

/**
 * Format address for display with line breaks
 */
export function formatAddressMultiline(address: Address): string {
  if (!address) {
    return '';
  }

  const lines: string[] = [];

  if (address.street) {
    lines.push(address.street);
  }

  const cityStateZip = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');

  if (cityStateZip) {
    lines.push(cityStateZip);
  }

  if (address.country) {
    lines.push(address.country);
  }

  return lines.join('\n');
}

// ============================================================================
// NAME FORMATTING
// ============================================================================

/**
 * Format name object to string
 */
export function formatName(name: Name): string {
  if (!name) {
    return '';
  }

  const parts: string[] = [];

  if (name.title) {
    parts.push(name.title);
  }

  if (name.firstName) {
    parts.push(name.firstName);
  }

  if (name.middleName) {
    parts.push(name.middleName);
  }

  if (name.lastName) {
    parts.push(name.lastName);
  }

  return parts.join(' ');
}

/**
 * Format name with last name first
 */
export function formatNameLastFirst(name: Name): string {
  if (!name) {
    return '';
  }

  const parts: string[] = [];

  if (name.lastName) {
    parts.push(name.lastName);
  }

  if (name.firstName) {
    parts.push(name.firstName);
  }

  if (name.middleName) {
    parts.push(name.middleName);
  }

  if (name.title) {
    parts.push(`(${name.title})`);
  }

  return parts.join(', ');
}

/**
 * Format company name
 */
export function formatCompanyName(name: string): string {
  if (!name) {
    return '';
  }

  // Capitalize first letter of each word
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// INVOICE AND REFERENCE NUMBER FORMATTING
// ============================================================================

/**
 * Format invoice number
 */
export function formatInvoiceNumber(
  prefix: string,
  number: number,
  year: number,
  options: FormattingOptions = {}
): string {
  if (!prefix) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Prefix is required',
        prefix,
        { operation: 'format-reference-number' }
      );
  }

  if (typeof number !== 'number' || number < 0) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Number must be a non-negative integer',
        number,
        { operation: 'format-reference-number' }
      );
  }

  if (typeof year !== 'number' || year < 1000) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Year must be a valid year',
        year,
        { operation: 'format-reference-number' }
      );
  }

  const { separator = '-' } = options;

  // Format number with leading zeros
  const formattedNumber = number.toString().padStart(4, '0');
  const shortYear = year.toString().slice(-2);

  return `${prefix}${separator}${shortYear}${separator}${formattedNumber}`;
}

/**
 * Format reference number
 */
export function formatReferenceNumber(
  type: string,
  number: number,
  year: number,
  options: FormattingOptions = {}
): string {
  if (!type) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Type is required',
        type,
        { operation: 'format-reference-number' }
      );
  }

  if (typeof number !== 'number' || number < 0) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Number must be a non-negative integer',
        number,
        { operation: 'format-reference-number' }
      );
  }

  if (typeof year !== 'number' || year < 1000) {
    throw createValidationError(
        'INVALID_FORMATTING_INPUT',
        'Year must be a valid year',
        year,
        { operation: 'format-reference-number' }
      );
  }

  const { separator = '-' } = options;

  // Format number with leading zeros
  const formattedNumber = number.toString().padStart(6, '0');
  const shortYear = year.toString().slice(-2);

  return `${type.toUpperCase()}${separator}${shortYear}${separator}${formattedNumber}`;
}

/**
 * Format purchase order number
 */
export function formatPurchaseOrderNumber(
  number: number,
  year: number,
  options: FormattingOptions = {}
): string {
  return formatReferenceNumber('PO', number, year, options);
}

/**
 * Format receipt number
 */
export function formatReceiptNumber(
  number: number,
  year: number,
  options: FormattingOptions = {}
): string {
  return formatReferenceNumber('RCP', number, year, options);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size in bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(k));

  return round2HalfUp(bytes / Math.pow(k, index), 2) + ' ' + sizes[index];
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date, locale: string = 'en-MY'): string {
  const fmtLocale = resolveLocale(locale);
  const now = new Date();
  const diff = date.getTime() - now.getTime(); // future => positive
  const rtf = new Intl.RelativeTimeFormat(fmtLocale, { numeric: 'auto' });
  const sec = Math.round(Math.abs(diff) / 1000);
  if (sec < 60) return rtf.format(Math.sign(diff) * -sec, 'second');
  const min = Math.round(sec / 60);
  if (min < 60) return rtf.format(Math.sign(diff) * -min, 'minute');
  const hr = Math.round(min / 60);
  if (hr < 24) return rtf.format(Math.sign(diff) * -hr, 'hour');
  const day = Math.round(hr / 24);
  if (day < 30) return rtf.format(Math.sign(diff) * -day, 'day');
  const month = Math.round(day / 30);
  if (month < 12) return rtf.format(Math.sign(diff) * -month, 'month');
  const year = Math.round(month / 12);
  return rtf.format(Math.sign(diff) * -year, 'year');
}
