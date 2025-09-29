/**
 * Number to Words Utilities - Enterprise Production Ready
 * 
 * Comprehensive number-to-words conversion utilities for multi-locale support,
 * currency formatting, and special document formatting.
 * 
 * Features:
 * - Multi-locale number-to-words conversion
 * - Currency formatting with proper names
 * - Special formatting for cheques and invoices
 * - Locale validation and configuration
 * - Integration with existing formatting utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   convertNumberToWords,
 *   convertCurrencyToWords,
 *   formatForCheque,
 *   formatForInvoice
 * } from './number-to-words-utilities';
 * 
 * // Convert number to words
 * const words = convertNumberToWords(1234.56, 'en-US');
 * 
 * // Convert currency to words
 * const currencyWords = convertCurrencyToWords(1234.56, 'USD', 'en-US');
 * ```
 */

import type { 
  SupportedCurrency
} from './accounting-utilities';
import type { 
  BusinessValidationResult as ValidationResult
} from './validation-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Words conversion result
 */
export interface WordsResult {
  readonly number: number;
  readonly words: string;
  readonly locale: string;
  readonly format: string;
  readonly conversionDate: Date;
}

/**
 * Currency words result
 */
export interface CurrencyWordsResult {
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly words: string;
  readonly currencyName: string;
  readonly locale: string;
  readonly format: string;
}

/**
 * Conversion options
 */
export interface ConversionOptions {
  readonly includeCurrency?: boolean;
  readonly includeCents?: boolean;
  readonly format?: ConversionFormat;
  readonly case?: TextCase;
  readonly separator?: string;
}

/**
 * Locale configuration
 */
export interface LocaleConfiguration {
  readonly locale: string;
  readonly language: string;
  readonly country: string;
  readonly currency: SupportedCurrency;
  readonly numberFormat: NumberFormat;
  readonly textFormat: TextFormat;
}

/**
 * Cheque format result
 */
export interface ChequeFormatResult {
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly words: string;
  readonly format: string;
  readonly locale: string;
  readonly chequeFormat: string;
}

/**
 * Invoice format result
 */
export interface InvoiceFormatResult {
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly words: string;
  readonly format: string;
  readonly locale: string;
  readonly invoiceFormat: string;
}

/**
 * Supported locale information
 */
export interface SupportedLocale {
  readonly code: string;
  readonly name: string;
  readonly language: string;
  readonly country: string;
  readonly currency: SupportedCurrency;
  readonly active: boolean;
}

/**
 * Special format result
 */
export interface SpecialFormatResult {
  readonly amount: number;
  readonly currency: SupportedCurrency;
  readonly words: string;
  readonly format: string;
  readonly locale: string;
  readonly specialFormat: string;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Conversion formats
 */
export type ConversionFormat = 
  | 'standard'
  | 'cheque'
  | 'invoice'
  | 'legal';

/**
 * Text cases
 */
export type TextCase = 
  | 'lowercase'
  | 'uppercase'
  | 'title_case'
  | 'sentence_case';

/**
 * Number formats
 */
export type NumberFormat = 
  | 'decimal'
  | 'fraction'
  | 'percentage'
  | 'currency';

/**
 * Text formats
 */
export type TextFormat = 
  | 'plain'
  | 'formatted'
  | 'structured';

/**
 * Conversion format configurations
 */
export const CONVERSION_FORMATS = {
  standard: { name: 'Standard', description: 'Standard number-to-words conversion' },
  cheque: { name: 'Cheque', description: 'Cheque-specific formatting' },
  invoice: { name: 'Invoice', description: 'Invoice-specific formatting' },
  legal: { name: 'Legal', description: 'Legal document formatting' }
} as const;

/**
 * Text case configurations
 */
export const TEXT_CASES = {
  lowercase: { name: 'Lowercase', description: 'All lowercase text' },
  uppercase: { name: 'Uppercase', description: 'All uppercase text' },
  title_case: { name: 'Title Case', description: 'Title case text' },
  sentence_case: { name: 'Sentence Case', description: 'Sentence case text' }
} as const;

/**
 * Supported locales
 */
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  {
    code: 'en-US',
    name: 'English (United States)',
    language: 'English',
    country: 'United States',
    currency: 'USD',
    active: true
  },
  {
    code: 'en-GB',
    name: 'English (United Kingdom)',
    language: 'English',
    country: 'United Kingdom',
    currency: 'GBP',
    active: true
  },
  {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    language: 'Spanish',
    country: 'Spain',
    currency: 'EUR',
    active: true
  },
  {
    code: 'fr-FR',
    name: 'French (France)',
    language: 'French',
    country: 'France',
    currency: 'EUR',
    active: true
  },
  {
    code: 'de-DE',
    name: 'German (Germany)',
    language: 'German',
    country: 'Germany',
    currency: 'EUR',
    active: true
  },
  {
    code: 'it-IT',
    name: 'Italian (Italy)',
    language: 'Italian',
    country: 'Italy',
    currency: 'EUR',
    active: true
  },
  {
    code: 'pt-PT',
    name: 'Portuguese (Portugal)',
    language: 'Portuguese',
    country: 'Portugal',
    currency: 'EUR',
    active: true
  },
  {
    code: 'nl-NL',
    name: 'Dutch (Netherlands)',
    language: 'Dutch',
    country: 'Netherlands',
    currency: 'EUR',
    active: true
  }
] as const;

/**
 * Currency names by locale
 */
export const CURRENCY_NAMES = {
  'en-US': {
    USD: { singular: 'dollar', plural: 'dollars', cent: 'cent', cents: 'cents' },
    EUR: { singular: 'euro', plural: 'euros', cent: 'cent', cents: 'cents' },
    GBP: { singular: 'pound', plural: 'pounds', cent: 'penny', cents: 'pence' }
  },
  'en-GB': {
    USD: { singular: 'dollar', plural: 'dollars', cent: 'cent', cents: 'cents' },
    EUR: { singular: 'euro', plural: 'euros', cent: 'cent', cents: 'cents' },
    GBP: { singular: 'pound', plural: 'pounds', cent: 'penny', cents: 'pence' }
  },
  'es-ES': {
    USD: { singular: 'dólar', plural: 'dólares', cent: 'centavo', cents: 'centavos' },
    EUR: { singular: 'euro', plural: 'euros', cent: 'céntimo', cents: 'céntimos' },
    GBP: { singular: 'libra', plural: 'libras', cent: 'penique', cents: 'peniques' }
  },
  'fr-FR': {
    USD: { singular: 'dollar', plural: 'dollars', cent: 'cent', cents: 'cents' },
    EUR: { singular: 'euro', plural: 'euros', cent: 'centime', cents: 'centimes' },
    GBP: { singular: 'livre', plural: 'livres', cent: 'penny', cents: 'pence' }
  },
  'de-DE': {
    USD: { singular: 'Dollar', plural: 'Dollar', cent: 'Cent', cents: 'Cents' },
    EUR: { singular: 'Euro', plural: 'Euro', cent: 'Cent', cents: 'Cents' },
    GBP: { singular: 'Pfund', plural: 'Pfund', cent: 'Penny', cents: 'Pence' }
  },
  'it-IT': {
    USD: { singular: 'dollaro', plural: 'dollari', cent: 'centesimo', cents: 'centesimi' },
    EUR: { singular: 'euro', plural: 'euro', cent: 'centesimo', cents: 'centesimi' },
    GBP: { singular: 'sterlina', plural: 'sterline', cent: 'penny', cents: 'pence' }
  },
  'pt-PT': {
    USD: { singular: 'dólar', plural: 'dólares', cent: 'centavo', cents: 'centavos' },
    EUR: { singular: 'euro', plural: 'euros', cent: 'cêntimo', cents: 'cêntimos' },
    GBP: { singular: 'libra', plural: 'libras', cent: 'penny', cents: 'pence' }
  },
  'nl-NL': {
    USD: { singular: 'dollar', plural: 'dollars', cent: 'cent', cents: 'cents' },
    EUR: { singular: 'euro', plural: 'euros', cent: 'cent', cents: 'cents' },
    GBP: { singular: 'pond', plural: 'ponden', cent: 'penny', cents: 'pence' }
  }
} as const;

// ============================================================================
// NUMBER CONVERSION
// ============================================================================

/**
 * Convert number to words
 * 
 * @param number - Number to convert
 * @param locale - Locale code
 * @param options - Conversion options
 * @returns Words conversion result
 * 
 * @example
 * ```typescript
 * const words = convertNumberToWords(1234.56, 'en-US', {
 *   includeCents: true,
 *   case: 'title_case'
 * });
 * ```
 */
export function convertNumberToWords(
  number: number,
  locale: string,
  options: ConversionOptions = {}
): WordsResult {
  // Validate inputs
  if (typeof number !== 'number' || isNaN(number)) {
    throw new Error('Invalid number provided');
  }

  if (!locale || locale.trim() === '') {
    throw new Error('Locale is required');
  }

  // Validate locale
  const localeValidation = validateLocale(locale);
  if (!localeValidation.isValid) {
    throw new Error(`Invalid locale: ${localeValidation.errors.join(', ')}`);
  }

  // Get locale configuration
  const localeConfig = getLocaleConfiguration(locale);
  if (!localeConfig) {
    throw new Error(`Locale configuration not found: ${locale}`);
  }

  // Convert number to words
  const words = convertNumberToWordsInternal(number, locale, options);

  return {
    number,
    words,
    locale,
    format: options.format || 'standard',
    conversionDate: new Date()
  };
}

/**
 * Convert currency to words
 * 
 * @param amount - Amount to convert
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Currency words result
 * 
 * @example
 * ```typescript
 * const currencyWords = convertCurrencyToWords(1234.56, 'USD', 'en-US');
 * ```
 */
export function convertCurrencyToWords(
  amount: number,
  currency: SupportedCurrency,
  locale: string
): CurrencyWordsResult {
  // Validate inputs
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount provided');
  }

  if (!currency || currency.trim() === '') {
    throw new Error('Currency is required');
  }

  if (!locale || locale.trim() === '') {
    throw new Error('Locale is required');
  }

  // Get currency names
  const currencyNames = getCurrencyNames(currency, locale);
  if (!currencyNames) {
    throw new Error(`Currency names not found for ${currency} in locale ${locale}`);
  }

  // Convert amount to words
  const words = convertNumberToWordsInternal(amount, locale, { includeCents: true });

  // Get currency name
  const currencyName = amount === 1 ? currencyNames.singular : currencyNames.plural;

  return {
    amount,
    currency,
    words,
    currencyName,
    locale,
    format: 'currency'
  };
}

/**
 * Validate number-to-words conversion
 * 
 * @param number - Original number
 * @param words - Converted words
 * @param locale - Locale code
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateNumberToWords(1234.56, 'one thousand two hundred thirty-four and fifty-six cents', 'en-US');
 * if (!validation.isValid) {
 *   console.error('Conversion validation failed:', validation.errors);
 * }
 * ```
 */
export function validateNumberToWords(
  number: number,
  words: string,
  locale: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate inputs
  if (typeof number !== 'number' || isNaN(number)) {
    errors.push('Invalid number provided');
  }

  if (!words || words.trim() === '') {
    errors.push('Words cannot be empty');
  }

  if (!locale || locale.trim() === '') {
    errors.push('Locale is required');
  }

  // Validate locale
  const localeValidation = validateLocale(locale);
  if (!localeValidation.isValid) {
    errors.push(...localeValidation.errors);
  }

  // Basic validation - check if words contain reasonable content
  if (words.length < 3) {
    errors.push('Words are too short to be valid');
  }

  // Check for common number words (basic validation)
  const commonWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const hasNumberWords = commonWords.some(word => words.toLowerCase().includes(word));
  
  if (!hasNumberWords) {
    warnings.push('Words do not contain common number words');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// LOCALE SUPPORT
// ============================================================================

/**
 * Get supported locales
 * 
 * @returns Supported locales
 * 
 * @example
 * ```typescript
 * const locales = getSupportedLocales();
 * ```
 */
export function getSupportedLocales(): readonly SupportedLocale[] {
  return SUPPORTED_LOCALES.filter(locale => locale.active);
}

/**
 * Validate locale
 * 
 * @param locale - Locale code to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateLocale('en-US');
 * if (!validation.isValid) {
 *   console.error('Locale validation failed:', validation.errors);
 * }
 * ```
 */
export function validateLocale(locale: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic format
  if (!locale || locale.trim() === '') {
    errors.push('Locale code is required');
  }

  // Check if locale is supported
  const supportedLocale = SUPPORTED_LOCALES.find(l => l.code === locale);
  if (!supportedLocale) {
    errors.push(`Unsupported locale: ${locale}`);
  } else if (!supportedLocale.active) {
    errors.push(`Locale is not active: ${locale}`);
  }

  // Validate locale format (basic check)
  if (locale && !/^[a-z]{2}-[A-Z]{2}$/.test(locale)) {
    warnings.push('Locale code format may be invalid (expected: xx-XX)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get locale configuration
 * 
 * @param locale - Locale code
 * @returns Locale configuration
 * 
 * @example
 * ```typescript
 * const config = getLocaleConfiguration('en-US');
 * ```
 */
export function getLocaleConfiguration(locale: string): LocaleConfiguration | undefined {
  const supportedLocale = SUPPORTED_LOCALES.find(l => l.code === locale);
  if (!supportedLocale) {
    return undefined;
  }

  return {
    locale: supportedLocale.code,
    language: supportedLocale.language,
    country: supportedLocale.country,
    currency: supportedLocale.currency,
    numberFormat: 'decimal',
    textFormat: 'formatted'
  };
}

// ============================================================================
// SPECIAL FORMATTING
// ============================================================================

/**
 * Format for cheque
 * 
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Cheque format result
 * 
 * @example
 * ```typescript
 * const chequeFormat = formatForCheque(1234.56, 'USD', 'en-US');
 * ```
 */
export function formatForCheque(
  amount: number,
  currency: SupportedCurrency,
  locale: string
): ChequeFormatResult {
  // Validate inputs
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount provided');
  }

  if (!currency || currency.trim() === '') {
    throw new Error('Currency is required');
  }

  if (!locale || locale.trim() === '') {
    throw new Error('Locale is required');
  }

  // Convert to words
  const words = convertNumberToWordsInternal(amount, locale, { 
    includeCents: true, 
    case: 'title_case' 
  });

  // Format for cheque
  const chequeFormat = formatChequeWords(words, currency, locale);

  return {
    amount,
    currency,
    words,
    format: 'cheque',
    locale,
    chequeFormat
  };
}

/**
 * Format for invoice
 * 
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Invoice format result
 * 
 * @example
 * ```typescript
 * const invoiceFormat = formatForInvoice(1234.56, 'USD', 'en-US');
 * ```
 */
export function formatForInvoice(
  amount: number,
  currency: SupportedCurrency,
  locale: string
): InvoiceFormatResult {
  // Validate inputs
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount provided');
  }

  if (!currency || currency.trim() === '') {
    throw new Error('Currency is required');
  }

  if (!locale || locale.trim() === '') {
    throw new Error('Locale is required');
  }

  // Convert to words
  const words = convertNumberToWordsInternal(amount, locale, { 
    includeCents: true, 
    case: 'sentence_case' 
  });

  // Format for invoice
  const invoiceFormat = formatInvoiceWords(words, currency, locale);

  return {
    amount,
    currency,
    words,
    format: 'invoice',
    locale,
    invoiceFormat
  };
}

/**
 * Validate special formatting
 * 
 * @param result - Special format result to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateSpecialFormatting(result);
 * if (!validation.isValid) {
 *   console.error('Special formatting validation failed:', validation.errors);
 * }
 * ```
 */
export function validateSpecialFormatting(result: SpecialFormatResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic properties
  if (typeof result.amount !== 'number' || isNaN(result.amount)) {
    errors.push('Invalid amount');
  }

  if (!result.words || result.words.trim() === '') {
    errors.push('Words cannot be empty');
  }

  if (!result.currency || result.currency.trim() === '') {
    errors.push('Currency is required');
  }

  if (!result.locale || result.locale.trim() === '') {
    errors.push('Locale is required');
  }

  if (!result.format || result.format.trim() === '') {
    errors.push('Format is required');
  }

  // Validate locale
  const localeValidation = validateLocale(result.locale);
  if (!localeValidation.isValid) {
    errors.push(...localeValidation.errors);
  }

  // Warnings
  if (result.words.length > 500) {
    warnings.push('Words are very long - may not fit in document');
  }

  if (result.amount < 0) {
    warnings.push('Negative amount - verify formatting');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// CURRENCY NAMES
// ============================================================================

/**
 * Get currency name
 * 
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Currency name
 * 
 * @example
 * ```typescript
 * const name = getCurrencyName('USD', 'en-US');
 * ```
 */
export function getCurrencyName(currency: SupportedCurrency, locale: string): string {
  const currencyNames = getCurrencyNames(currency, locale);
  return currencyNames?.singular || currency;
}

/**
 * Get currency plural name
 * 
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Currency plural name
 * 
 * @example
 * ```typescript
 * const pluralName = getCurrencyPluralName('USD', 'en-US');
 * ```
 */
export function getCurrencyPluralName(currency: SupportedCurrency, locale: string): string {
  const currencyNames = getCurrencyNames(currency, locale);
  return currencyNames?.plural || currency;
}

/**
 * Validate currency name
 * 
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateCurrencyName('USD', 'en-US');
 * if (!validation.isValid) {
 *   console.error('Currency name validation failed:', validation.errors);
 * }
 * ```
 */
export function validateCurrencyName(currency: SupportedCurrency, locale: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate inputs
  if (!currency || currency.trim() === '') {
    errors.push('Currency is required');
  }

  if (!locale || locale.trim() === '') {
    errors.push('Locale is required');
  }

  // Check if currency names exist
  const currencyNames = getCurrencyNames(currency, locale);
  if (!currencyNames) {
    errors.push(`Currency names not found for ${currency} in locale ${locale}`);
  }

  // Validate locale
  const localeValidation = validateLocale(locale);
  if (!localeValidation.isValid) {
    errors.push(...localeValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert number to words internally
 * 
 * @param number - Number to convert
 * @param locale - Locale code
 * @param options - Conversion options
 * @returns Words string
 */
function convertNumberToWordsInternal(
  number: number,
  locale: string,
  options: ConversionOptions
): string {
  // Handle negative numbers
  if (number < 0) {
    return `negative ${convertNumberToWordsInternal(-number, locale, options)}`;
  }

  // Handle zero
  if (number === 0) {
    return getZeroWord(locale);
  }

  // Split into integer and decimal parts
  const integerPart = Math.floor(number);
  const decimalPart = Math.round((number - integerPart) * 100);

  // Convert integer part
  let words = convertIntegerToWords(integerPart, locale);

  // Add decimal part if requested
  if (options.includeCents && decimalPart > 0) {
    const decimalWords = convertIntegerToWords(decimalPart, locale);
    words += ` ${getAndWord(locale)} ${decimalWords} ${getCentsWord(decimalPart, locale)}`;
  }

  // Apply case formatting
  if (options.case) {
    words = applyCaseFormatting(words, options.case);
  }

  return words;
}

/**
 * Convert integer to words
 * 
 * @param number - Integer to convert
 * @param locale - Locale code
 * @returns Words string
 */
function convertIntegerToWords(number: number, locale: string): string {
  if (number === 0) {
    return getZeroWord(locale);
  }

  const words: string[] = [];
  const groups = splitIntoGroups(number);

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group !== undefined && group > 0) {
      const groupWords = convertGroupToWords(group, locale);
      const groupName = getGroupName(i, locale);
      
      if (groupWords) {
        words.push(groupWords);
        if (groupName) {
          words.push(groupName);
        }
      }
    }
  }

  return words.join(' ');
}

/**
 * Convert group to words
 * 
 * @param group - Group number (0-999)
 * @param locale - Locale code
 * @returns Words string
 */
function convertGroupToWords(group: number, locale: string): string {
  if (group === 0) {
    return '';
  }

  const hundreds = Math.floor(group / 100);
  const tens = Math.floor((group % 100) / 10);
  const ones = group % 10;

  const words: string[] = [];

  // Add hundreds
  if (hundreds > 0) {
    words.push(getOnesWord(hundreds, locale));
    words.push(getHundredWord(locale));
  }

  // Add tens and ones
  if (tens === 1) {
    // Handle teens (10-19)
    words.push(getTeensWord(ones, locale));
  } else {
    // Handle regular tens and ones
    if (tens > 0) {
      words.push(getTensWord(tens, locale));
    }
    if (ones > 0) {
      words.push(getOnesWord(ones, locale));
    }
  }

  return words.join(' ');
}

/**
 * Split number into groups of 3 digits
 * 
 * @param number - Number to split
 * @returns Array of groups
 */
function splitIntoGroups(number: number): number[] {
  const groups: number[] = [];
  
  while (number > 0) {
    groups.unshift(number % 1000);
    number = Math.floor(number / 1000);
  }
  
  return groups;
}

/**
 * Get currency names for locale
 * 
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Currency names or undefined
 */
function getCurrencyNames(currency: SupportedCurrency, locale: string): { singular: string; plural: string; cent: string; cents: string } | undefined {
  const localeCurrencies = CURRENCY_NAMES[locale as keyof typeof CURRENCY_NAMES];
  return localeCurrencies?.[currency as keyof typeof localeCurrencies];
}

/**
 * Format cheque words
 * 
 * @param words - Base words
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Formatted cheque words
 */
function formatChequeWords(words: string, _currency: SupportedCurrency, _locale: string): string {
  // Add "ONLY" at the end for cheques
  return `${words.toUpperCase()} ONLY`;
}

/**
 * Format invoice words
 * 
 * @param words - Base words
 * @param currency - Currency code
 * @param locale - Locale code
 * @returns Formatted invoice words
 */
function formatInvoiceWords(words: string, _currency: SupportedCurrency, _locale: string): string {
  // Capitalize first letter for invoices
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Apply case formatting
 * 
 * @param words - Words to format
 * @param caseType - Case type
 * @returns Formatted words
 */
function applyCaseFormatting(words: string, caseType: TextCase): string {
  switch (caseType) {
    case 'lowercase':
      return words.toLowerCase();
    case 'uppercase':
      return words.toUpperCase();
    case 'title_case':
      return words.replace(/\b\w/g, l => l.toUpperCase());
    case 'sentence_case':
      return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
    default:
      return words;
  }
}

// ============================================================================
// LOCALE-SPECIFIC WORD FUNCTIONS
// ============================================================================

/**
 * Get zero word for locale
 * 
 * @param locale - Locale code
 * @returns Zero word
 */
function getZeroWord(locale: string): string {
  const zeroWords: Record<string, string> = {
    'en-US': 'zero',
    'en-GB': 'zero',
    'es-ES': 'cero',
    'fr-FR': 'zéro',
    'de-DE': 'null',
    'it-IT': 'zero',
    'pt-PT': 'zero',
    'nl-NL': 'nul'
  };
  
  return zeroWords[locale] || 'zero';
}

/**
 * Get ones word for locale
 * 
 * @param number - Number (1-9)
 * @param locale - Locale code
 * @returns Ones word
 */
function getOnesWord(number: number, locale: string): string {
  const onesWords: Record<string, string[]> = {
    'en-US': ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    'en-GB': ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    'es-ES': ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'],
    'fr-FR': ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'],
    'de-DE': ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'],
    'it-IT': ['', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'],
    'pt-PT': ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'],
    'nl-NL': ['', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen']
  };
  
  const words = onesWords[locale] || onesWords['en-US'];
  return words?.[number] || '';
}

/**
 * Get tens word for locale
 * 
 * @param number - Number (2-9)
 * @param locale - Locale code
 * @returns Tens word
 */
function getTensWord(number: number, locale: string): string {
  const tensWords: Record<string, string[]> = {
    'en-US': ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    'en-GB': ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    'es-ES': ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'],
    'fr-FR': ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'],
    'de-DE': ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'],
    'it-IT': ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'],
    'pt-PT': ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'],
    'nl-NL': ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig']
  };
  
  const words = tensWords[locale] || tensWords['en-US'];
  return words?.[number] || '';
}

/**
 * Get teens word for locale
 * 
 * @param number - Number (0-9)
 * @param locale - Locale code
 * @returns Teens word
 */
function getTeensWord(number: number, locale: string): string {
  const teensWords: Record<string, string[]> = {
    'en-US': ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    'en-GB': ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    'es-ES': ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'],
    'fr-FR': ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'],
    'de-DE': ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'],
    'it-IT': ['dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'],
    'pt-PT': ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove'],
    'nl-NL': ['tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien']
  };
  
  const words = teensWords[locale] || teensWords['en-US'];
  return words?.[number] || '';
}

/**
 * Get hundred word for locale
 * 
 * @param locale - Locale code
 * @returns Hundred word
 */
function getHundredWord(locale: string): string {
  const hundredWords: Record<string, string> = {
    'en-US': 'hundred',
    'en-GB': 'hundred',
    'es-ES': 'ciento',
    'fr-FR': 'cent',
    'de-DE': 'hundert',
    'it-IT': 'cento',
    'pt-PT': 'cento',
    'nl-NL': 'honderd'
  };
  
  return hundredWords[locale] || 'hundred';
}

/**
 * Get group name for locale
 * 
 * @param groupIndex - Group index (0=ones, 1=thousands, 2=millions, etc.)
 * @param locale - Locale code
 * @returns Group name
 */
function getGroupName(groupIndex: number, locale: string): string {
  const groupNames: Record<string, string[]> = {
    'en-US': ['', 'thousand', 'million', 'billion', 'trillion'],
    'en-GB': ['', 'thousand', 'million', 'billion', 'trillion'],
    'es-ES': ['', 'mil', 'millón', 'mil millones', 'billón'],
    'fr-FR': ['', 'mille', 'million', 'milliard', 'billion'],
    'de-DE': ['', 'tausend', 'Million', 'Milliarde', 'Billion'],
    'it-IT': ['', 'mila', 'milione', 'miliardo', 'bilione'],
    'pt-PT': ['', 'mil', 'milhão', 'mil milhões', 'bilião'],
    'nl-NL': ['', 'duizend', 'miljoen', 'miljard', 'biljoen']
  };
  
  const names = groupNames[locale] || groupNames['en-US'];
  return names?.[groupIndex] || '';
}

/**
 * Get "and" word for locale
 * 
 * @param locale - Locale code
 * @returns "And" word
 */
function getAndWord(locale: string): string {
  const andWords: Record<string, string> = {
    'en-US': 'and',
    'en-GB': 'and',
    'es-ES': 'y',
    'fr-FR': 'et',
    'de-DE': 'und',
    'it-IT': 'e',
    'pt-PT': 'e',
    'nl-NL': 'en'
  };
  
  return andWords[locale] || 'and';
}

/**
 * Get cents word for locale
 * 
 * @param number - Number of cents
 * @param locale - Locale code
 * @returns Cents word
 */
function getCentsWord(number: number, locale: string): string {
  const currencyNames = getCurrencyNames('USD', locale); // Default to USD for cents
  if (!currencyNames) {
    return 'cents';
  }
  
  return number === 1 ? currencyNames.cent : currencyNames.cents;
}
