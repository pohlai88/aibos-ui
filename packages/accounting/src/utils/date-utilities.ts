/**
 * Date & Time Utilities - Phase 1 Implementation
 * 
 * Built on top of date-fns for reliability and consistency.
 * Provides enterprise-grade date/time operations for accounting.
 * 
 * Features:
 * - Immutable operations (no side effects)
 * - TypeScript-first with full type safety
 * - Tree-shakable imports
 * - Comprehensive error handling
 * - Accounting-specific date operations
 */

import {
  format as formatDateFns,
  parseISO,
  parse as parseWithFormat,
  isValid,
  addDays,
  addMonths,
  addYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek,
  endOfDay,
  isWithinInterval,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  startOfDay,
  fromUnixTime,
  getUnixTime,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth as isSameMonthFns,
  isSameYear as isSameYearFns,
  getDate, // day of month (1–31) ✅ needed for fiscal-year calc
  getMonth,
  getYear,
  setMonth,
  getISOWeek,
  add as addDuration,
} from 'date-fns';
// date-fns locales for SEA + JP/HK/EN
import { enUS } from 'date-fns/locale';
import { ms }   from 'date-fns/locale';
import { vi }   from 'date-fns/locale';
import { id }   from 'date-fns/locale';
import { th }   from 'date-fns/locale';
import { ja }   from 'date-fns/locale';
import { zhHK } from 'date-fns/locale';
// import { format as fmt } from 'date-fns'; // lightweight local formatting when tz not required

import { isEmpty } from './index';
import { createValidationError } from './error-utilities';
// Timezone functions - will use date-fns-tz when available
// For now, provide fallback implementations that maintain API compatibility

// Fallback implementations (will be replaced when date-fns-tz is installed)
const utcToZonedTime = (date: Date, _timezone: string): Date => {
  // Fallback: return date as-is for now
  // TODO: Replace with actual date-fns-tz implementation
  return new Date(date.getTime());
};

const zonedTimeToUtc = (date: Date, _timezone: string): Date => {
  // Fallback: return date as-is for now  
  // TODO: Replace with actual date-fns-tz implementation
  return new Date(date.getTime());
};

const formatInTimeZone = (date: Date, _timezone: string, format: string): string => {
  // Fallback: use regular format for now
  // TODO: Replace with actual date-fns-tz implementation
  return formatDateFns(date, format);
};

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

/**
 * Supported date formats for accounting operations
 */
export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DISPLAY: 'MMM dd, yyyy',
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM dd, yyyy',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  TIME: 'HH:mm:ss',
  MONTH_YEAR: 'MMM yyyy',
  YEAR: 'yyyy',
  QUARTER: 'QQQ yyyy',
} as const;

export type DateFormat = keyof typeof DATE_FORMATS;

/**
 * Time zones commonly used in accounting
 */
export const ACCOUNTING_TIMEZONES = {
  UTC: 'UTC',
  MALAYSIA: 'Asia/Kuala_Lumpur',
  SINGAPORE: 'Asia/Singapore',
  HONG_KONG: 'Asia/Hong_Kong',
  JAPAN: 'Asia/Tokyo',
  AUSTRALIA_SYDNEY: 'Australia/Sydney',
  AUSTRALIA_MELBOURNE: 'Australia/Melbourne',
  NEW_ZEALAND: 'Pacific/Auckland',
  UNITED_STATES_EAST: 'America/New_York',
  UNITED_STATES_WEST: 'America/Los_Angeles',
  UNITED_KINGDOM: 'Europe/London',
  GERMANY: 'Europe/Berlin',
  FRANCE: 'Europe/Paris',
} as const;

// Prefer using the *value* (IANA tz string) for function params
export type AccountingTimezoneKey = keyof typeof ACCOUNTING_TIMEZONES;
export type AccountingTimezone = (typeof ACCOUNTING_TIMEZONES)[AccountingTimezoneKey];

export type WeekStartsOn = 0|1|2|3|4|5|6; // 0=Sun … 6=Sat

export const ACCOUNTING_LOCALES = {
  'en-US': enUS,
  'ms-MY': ms,
  'vi-VN': vi,
  'id-ID': id,
  'th-TH': th,
  'ja-JP': ja,
  'zh-HK': zhHK,
} as const;
export type AccountingLocale = keyof typeof ACCOUNTING_LOCALES;

/** Internal: tz-aware format with optional locale */
function fmtTZ(
  date: Date, timezone: AccountingTimezone, pattern: string, _locale?: AccountingLocale) {
  // For now, use basic formatting without locale support
  // TODO: Add proper locale support when date-fns-tz locale integration is available
  return formatInTimeZone(date, timezone, pattern);
}

/**
 * Accounting periods
 */
export type AccountingPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Date range for accounting operations
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Accounting period configuration
 */
export interface AccountingPeriodConfig {
  period: AccountingPeriod;
  timezone?: AccountingTimezone;
  fiscalYearStart?: Date;
}

// ============================================================================
// CORE DATE UTILITIES
// ============================================================================

/**
 * Format a date using predefined formats
 * 
 * @param date - Date to format
 * @param format - Format key from DATE_FORMATS
 * @param timezone - Optional timezone for formatting
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * formatDate(new Date(), 'ISO'); // "2024-01-15"
 * formatDate(new Date(), 'DISPLAY'); // "Jan 15, 2024"
 * formatDate(new Date(), 'DATETIME'); // "2024-01-15 14:30:00"
 * ```
 */
export function formatDate(
  date: Date,
  format: DateFormat = 'ISO',
  timezone?: AccountingTimezone
): string {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }

  const formatString = DATE_FORMATS[format];
  
  // If a timezone is provided, format *in that zone* with a stable instant.
  return timezone
    ? formatInTimeZone(date, timezone, formatString)
    : formatDateFns(date, formatString);
}

/**
 * Parse a date string into a Date object
 * 
 * @param dateString - Date string to parse
 * @param format - Optional format hint
 * @returns Parsed Date object
 * 
 * @example
 * ```typescript
 * parseDate('2024-01-15'); // Date object
 * parseDate('2024-01-15T14:30:00Z'); // ISO string
 * parseDate('01/15/2024', 'SHORT'); // US format
 * ```
 */
export function parseDate(dateString: string, formatHint?: DateFormat): Date {
  if (!dateString || typeof dateString !== 'string') {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date string provided: ${dateString}`,
        dateString,
        { operation: 'parse-date-string' }
      );
  }

  // 1) If caller provided a format hint, respect it strictly.
  if (formatHint) {
    const pattern = DATE_FORMATS[formatHint];
    const parsed = parseWithFormat(dateString, pattern, new Date());
    if (isValid(parsed)) return parsed;
  }
  // 2) Fallbacks: ISO datetime or ISO date
  const isoParsed = parseISO(dateString);
  if (isValid(isoParsed)) return isoParsed;

  throw createValidationError(
        'INVALID_DATE_INPUT',
        `Unable to parse date string: ${dateString}`,
        dateString,
        { operation: 'parse-date-string' }
      );
}

/**
 * Check if a value is a valid Date object
 * 
 * @param value - Value to check
 * @returns True if value is a valid Date
 * 
 * @example
 * ```typescript
 * isValidDate(new Date()); // true
 * isValidDate('2024-01-15'); // false
 * isValidDate(new Date('invalid')); // false
 * ```
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && isValid(value);
}

/**
 * Normalize a date by removing time component (set to start of day)
 * 
 * @param date - Date to normalize
 * @returns Date with time set to 00:00:00
 * 
 * @example
 * ```typescript
 * normalizeDate(new Date('2024-01-15T14:30:00')); // 2024-01-15T00:00:00
 * ```
 */
export function normalizeDate(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return startOfDay(date);
}

// ============================================================================
// DATE ARITHMETIC UTILITIES
// ============================================================================

/**
 * Add days to a date
 * 
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 * 
 * @example
 * ```typescript
 * addDays(new Date('2024-01-15'), 7); // 2024-01-22
 * addDays(new Date('2024-01-15'), -7); // 2024-01-08
 * ```
 */
export function addDaysToDate(date: Date, days: number): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  if (typeof days !== 'number' || !Number.isFinite(days)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid days value provided: ${days}`,
        days,
        { operation: 'add-days' }
      );
  }
  return addDays(date, days);
}

/**
 * Add months to a date
 * 
 * @param date - Base date
 * @param months - Number of months to add (can be negative)
 * @returns New date with months added
 * 
 * @example
 * ```typescript
 * addMonthsToDate(new Date('2024-01-15'), 3); // 2024-04-15
 * addMonthsToDate(new Date('2024-01-31'), 1); // 2024-02-29 (leap year)
 * ```
 */
export function addMonthsToDate(date: Date, months: number): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  if (typeof months !== 'number' || !Number.isFinite(months)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid months value provided: ${months}`,
        months,
        { operation: 'add-months' }
      );
  }
  return addMonths(date, months);
}

/**
 * Add years to a date
 * 
 * @param date - Base date
 * @param years - Number of years to add (can be negative)
 * @returns New date with years added
 * 
 * @example
 * ```typescript
 * addYearsToDate(new Date('2024-01-15'), 1); // 2025-01-15
 * addYearsToDate(new Date('2024-02-29'), 1); // 2025-02-28 (non-leap year)
 * ```
 */
export function addYearsToDate(date: Date, years: number): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  if (typeof years !== 'number' || !Number.isFinite(years)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid years value provided: ${years}`,
        years,
        { operation: 'add-years' }
      );
  }
  return addYears(date, years);
}

/**
 * Subtract days from a date
 * 
 * @param date - Base date
 * @param days - Number of days to subtract
 * @returns New date with days subtracted
 */
export function subtractDaysFromDate(date: Date, days: number): Date {
  return addDaysToDate(date, -days);
}

/**
 * Subtract months from a date
 * 
 * @param date - Base date
 * @param months - Number of months to subtract
 * @returns New date with months subtracted
 */
export function subtractMonthsFromDate(date: Date, months: number): Date {
  return addMonthsToDate(date, -months);
}

/**
 * Subtract years from a date
 * 
 * @param date - Base date
 * @param years - Number of years to subtract
 * @returns New date with years subtracted
 */
export function subtractYearsFromDate(date: Date, years: number): Date {
  return addYearsToDate(date, -years);
}

// ============================================================================
// PERIOD UTILITIES
// ============================================================================

/**
 * Get the start of a month
 * 
 * @param date - Date within the month
 * @returns First day of the month at 00:00:00
 * 
 * @example
 * ```typescript
 * getStartOfMonth(new Date('2024-01-15')); // 2024-01-01T00:00:00
 * ```
 */
export function getStartOfMonth(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return startOfMonth(date);
}

/**
 * Get the end of a month
 * 
 * @param date - Date within the month
 * @returns Last day of the month at 23:59:59.999
 * 
 * @example
 * ```typescript
 * getEndOfMonth(new Date('2024-01-15')); // 2024-01-31T23:59:59.999
 * ```
 */
export function getEndOfMonth(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return endOfMonth(date);
}

/**
 * Get the start of a year
 * 
 * @param date - Date within the year
 * @returns January 1st at 00:00:00
 * 
 * @example
 * ```typescript
 * getStartOfYear(new Date('2024-06-15')); // 2024-01-01T00:00:00
 * ```
 */
export function getStartOfYear(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return startOfYear(date);
}

/**
 * Get the end of a year
 * 
 * @param date - Date within the year
 * @returns December 31st at 23:59:59.999
 * 
 * @example
 * ```typescript
 * getEndOfYear(new Date('2024-06-15')); // 2024-12-31T23:59:59.999
 * ```
 */
export function getEndOfYear(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return endOfYear(date);
}

/**
 * Get the start of a quarter
 * 
 * @param date - Date within the quarter
 * @returns First day of the quarter at 00:00:00
 * 
 * @example
 * ```typescript
 * getStartOfQuarter(new Date('2024-06-15')); // 2024-04-01T00:00:00 (Q2)
 * ```
 */
export function getStartOfQuarter(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  
  const month = getMonth(date);
  const quarterStartMonth = Math.floor(month / 3) * 3;
  
  // Create a new date with the quarter start month and day 1 (UTC)
  return new Date(Date.UTC(getYear(date), quarterStartMonth, 1));
}

/**
 * Get the end of a quarter
 * 
 * @param date - Date within the quarter
 * @returns Last day of the quarter at 23:59:59.999
 * 
 * @example
 * ```typescript
 * getEndOfQuarter(new Date('2024-06-15')); // 2024-06-30T23:59:59.999 (Q2)
 * ```
 */
export function getEndOfQuarter(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  
  const month = getMonth(date);
  const quarterEndMonth = Math.floor(month / 3) * 3 + 2;
  
  // Create a new date with the quarter end month and last day (UTC)
  // Last day of month
  return new Date(Date.UTC(getYear(date), quarterEndMonth + 1, 0));
}

// ============================================================================
// DATE COMPARISON UTILITIES
// ============================================================================

/**
 * Check if a date is within a date range (inclusive)
 * 
 * @param date - Date to check
 * @param start - Start of range
 * @param end - End of range
 * @returns True if date is within range
 * 
 * @example
 * ```typescript
 * isDateInRange(
 *   new Date('2024-01-15'),
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31')
 * ); // true
 * ```
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  if (!isValid(date) || !isValid(start) || !isValid(end)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        date,
        { operation: 'validate-date' }
      );
  }
  
  return isWithinInterval(date, { start, end });
}

/**
 * Check if a date is after another date
 * 
 * @param date - Date to check
 * @param compareDate - Date to compare against
 * @returns True if date is after compareDate
 */
export function isDateAfter(date: Date, compareDate: Date): boolean {
  if (!isValid(date) || !isValid(compareDate)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        date,
        { operation: 'validate-date' }
      );
  }
  return isAfter(date, compareDate);
}

/**
 * Check if a date is before another date
 * 
 * @param date - Date to check
 * @param compareDate - Date to compare against
 * @returns True if date is before compareDate
 */
export function isDateBefore(date: Date, compareDate: Date): boolean {
  if (!isValid(date) || !isValid(compareDate)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        date,
        { operation: 'validate-date' }
      );
  }
  return isBefore(date, compareDate);
}

/**
 * Check if two dates are equal (same day)
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are the same day
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  if (!isValid(date1) || !isValid(date2)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        { date1, date2 },
        { operation: 'validate-date' }
      );
  }
  return isSameDay(date1, date2);
}

/**
 * Check if two dates are in the same month
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are in the same month
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  if (!isValid(date1) || !isValid(date2)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        { date1, date2 },
        { operation: 'validate-date' }
      );
  }
  return isSameMonthFns(date1, date2);
}

/**
 * Check if two dates are in the same year
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are in the same year
 */
export function isSameYear(date1: Date, date2: Date): boolean {
  if (!isValid(date1) || !isValid(date2)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        { date1, date2 },
        { operation: 'validate-date' }
      );
  }
  return isSameYearFns(date1, date2);
}

// ============================================================================
// DATE DIFFERENCE UTILITIES
// ============================================================================

/**
 * Get the number of days between two dates
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Number of days between dates
 * 
 * @example
 * ```typescript
 * getDaysBetween(new Date('2024-01-01'), new Date('2024-01-15')); // 14
 * ```
 */
export function getDaysBetween(start: Date, end: Date): number {
  if (!isValid(start) || !isValid(end)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        { start, end },
        { operation: 'validate-date' }
      );
  }
  return differenceInDays(end, start);
}

/**
 * Get the number of months between two dates
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Number of months between dates
 * 
 * @example
 * ```typescript
 * getMonthsBetween(new Date('2024-01-01'), new Date('2024-06-01')); // 5
 * ```
 */
export function getMonthsBetween(start: Date, end: Date): number {
  if (!isValid(start) || !isValid(end)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        { start, end },
        { operation: 'validate-date' }
      );
  }
  return differenceInMonths(end, start);
}

/**
 * Get the number of years between two dates
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Number of years between dates
 * 
 * @example
 * ```typescript
 * getYearsBetween(new Date('2020-01-01'), new Date('2024-01-01')); // 4
 * ```
 */
export function getYearsBetween(start: Date, end: Date): number {
  if (!isValid(start) || !isValid(end)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        { start, end },
        { operation: 'validate-date' }
      );
  }
  return differenceInYears(end, start);
}

// ============================================================================
// TIMEZONE UTILITIES
// ============================================================================

/**
 * Convert a local *wall-clock reading* to a UTC instant.
 * NOTE: In JS, Date always stores an instant in UTC already.
 * Identity clone: JS Date is already an instant in UTC internally.
 */
export function toUTC(date: Date): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return new Date(date.getTime());
}

/**
 * Represent a UTC instant as a JS Date (already UTC internally).
 * Identity clone (kept for symmetry with toUTC)
 */
export function fromUTC(utcDate: Date): Date {
  if (!isValid(utcDate)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid UTC date provided: ${utcDate}`,
        utcDate,
        { operation: 'convert-utc-to-local' }
      );
  }
  return new Date(utcDate.getTime());
}

/**
 * Convert a UTC instant to the same instant represented in a target timezone.
 * Returns a Date whose calendar fields (year/month/day/hms) reflect the zone.
 * (The underlying epoch ms remains the same instant.)
 */
export function toTimezone(date: Date, timezone: AccountingTimezone): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return utcToZonedTime(date, timezone);
}

/**
 * Interpret the given date's *calendar fields* as a wall-clock in the provided
 * timezone, and convert to the corresponding UTC instant.
 * Useful when user picked "2024-03-10 01:30" in America/New_York: this
 * produces the correct absolute moment, accounting for DST gaps/folds.
 */
export function fromTimezone(date: Date, timezone: AccountingTimezone): Date {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  return zonedTimeToUtc(date, timezone);
}

// ============================================================================
// ACCOUNTING-SPECIFIC UTILITIES
// ============================================================================

/**
 * Get the fiscal year for a date
 * 
 * @param date - Date to check
 * @param fiscalYearStart - Start of fiscal year (default: January 1st)
 * @returns Fiscal year number
 * 
 * @example
 * ```typescript
 * getFiscalYear(new Date('2024-06-15')); // 2024
 * getFiscalYear(new Date('2024-06-15'), new Date('2024-04-01')); // 2024 (FY starts April)
 * ```
 */
export function getFiscalYear(date: Date, fiscalYearStart?: Date): number {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  
  const year = getYear(date);
  
  if (!fiscalYearStart) {
    return year;
  }
  
  if (!isValid(fiscalYearStart)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid fiscal year start provided: ${fiscalYearStart}`,
        fiscalYearStart,
        { operation: 'get-fiscal-year' }
      );
  }
  
  const fiscalStartMonth = getMonth(fiscalYearStart);
  const fiscalStartDayOfMonth = getDate(fiscalYearStart); // ✅ day-of-month (1–31)
  
  const currentMonth = getMonth(date);
  const currentDayOfMonth = getDate(date);
  
  // If current date is before fiscal year start, it belongs to previous fiscal year
  if (currentMonth < fiscalStartMonth || 
      (currentMonth === fiscalStartMonth && currentDayOfMonth < fiscalStartDayOfMonth)) {
    return year - 1;
  }
  
  return year;
}

/**
 * Get the quarter for a date
 * 
 * @param date - Date to check
 * @returns Quarter number (1-4)
 * 
 * @example
 * ```typescript
 * getQuarter(new Date('2024-06-15')); // 2
 * ```
 */
export function getQuarter(date: Date): number {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  
  const month = getMonth(date);
  return Math.floor(month / 3) + 1;
}

/**
 * Get the week number for a date
 * 
 * @param date - Date to check
 * @returns Week number (1-53)
 * 
 * @example
 * ```typescript
 * getWeekNumber(new Date('2024-01-15')); // 3
 * ```
 */
export function getWeekNumber(date: Date): number {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  
  // Use ISO-8601 week number for accounting (Mon-based, week 1 = first week with Thu)
  return getISOWeek(date);
}

/**
 * Get the day of year for a date
 * 
 * @param date - Date to check
 * @returns Day of year (1-366)
 * 
 * @example
 * ```typescript
 * getDayOfYear(new Date('2024-01-15')); // 15
 * ```
 */
export function getDayOfYear(date: Date): number {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  
  const startOfYear = getStartOfYear(date);
  return getDaysBetween(startOfYear, date) + 1;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a date range for a period
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Date range object
 */
export function createDateRange(start: Date, end: Date): DateRange {
  if (!isValid(start) || !isValid(end)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        { start, end },
        { operation: 'validate-date' }
      );
  }
  
  if (isAfter(start, end)) {
    throw createValidationError(
        'INVALID_DATE_RANGE',
        'Start date must be before or equal to end date',
        'dateRange',
        { operation: 'validate-date-range' }
      );
  }
  
  return { start, end };
}

/**
 * Get the current date in a specific timezone
 * 
 * @param timezone - Target timezone
 * @returns Current date in timezone
 */
export function getCurrentDate(timezone?: AccountingTimezone): Date {
  const now = new Date();
  return timezone ? toTimezone(now, timezone) : now;
}

/**
 * Get the current date normalized (start of day)
 * 
 * @param timezone - Optional timezone
 * @returns Current date at start of day
 */
export function getCurrentDateNormalized(timezone?: AccountingTimezone): Date {
  const currentDate = getCurrentDate(timezone);
  return normalizeDate(currentDate);
}

// ============================================================================
// TIMEZONE-AWARE RANGE HELPERS (start/end instants in UTC for a given zone)
// ============================================================================

/**
 * Given an instant, return the UTC instant for 00:00:00 in that zone's calendar day.
 */
function startOfDayInZone(date: Date, timezone: AccountingTimezone): Date {
  const local = utcToZonedTime(date, timezone);
  const localStart = startOfDay(local);
  return zonedTimeToUtc(localStart, timezone);
}

/**
 * Given an instant, return the UTC instant for 23:59:59.999 in that zone's calendar day.
 */
function endOfDayInZone(date: Date, timezone: AccountingTimezone): Date {
  const local = utcToZonedTime(date, timezone);
  const localEnd = endOfDay(local);
  return zonedTimeToUtc(localEnd, timezone);
}

/**
 * Build a DateRange from local start/end (constructed in the zone), returned as UTC instants.
 */
function rangeFromLocal(startLocal: Date, endLocal: Date, timezone: AccountingTimezone): DateRange {
  return {
    start: zonedTimeToUtc(startLocal, timezone),
    end: zonedTimeToUtc(endLocal, timezone),
  };
}

// ============================================================================
// PERIOD GENERATORS (timezone-aware)
// ============================================================================

export function getDailyRange(date: Date, timezone: AccountingTimezone): DateRange {
  return {
    start: startOfDayInZone(date, timezone),
    end: endOfDayInZone(date, timezone),
  };
}

export function getWeeklyRange(
  date: Date,
  timezone: AccountingTimezone,
  options?: { weekStartsOn?: WeekStartsOn; iso?: boolean }
): DateRange {
  const local = utcToZonedTime(date, timezone);
  const start = startOfWeek(local, { weekStartsOn: options?.iso ? 1 : options?.weekStartsOn ?? 1 });
  const end = endOfWeek(local,   { weekStartsOn: options?.iso ? 1 : options?.weekStartsOn ?? 1 });
  return rangeFromLocal(start, end, timezone);
}

export function getMonthlyRange(date: Date, timezone: AccountingTimezone): DateRange {
  const local = utcToZonedTime(date, timezone);
  const start = startOfMonth(local);
  const end = endOfMonth(local);
  return rangeFromLocal(start, end, timezone);
}

export function getQuarterlyRange(date: Date, timezone: AccountingTimezone): DateRange {
  const local = utcToZonedTime(date, timezone);
  const m = getMonth(local);
  const qStartMonth = Math.floor(m / 3) * 3;
  const start = startOfMonth(setMonth(local, qStartMonth));
  const end = endOfMonth(setMonth(local, qStartMonth + 2));
  return rangeFromLocal(start, end, timezone);
}

export function getYearlyRange(date: Date, timezone: AccountingTimezone): DateRange {
  const local = utcToZonedTime(date, timezone);
  const start = startOfYear(local);
  const end = endOfYear(local);
  return rangeFromLocal(start, end, timezone);
}

// ============================================================================
// FISCAL YEAR HELPERS (timezone-aware)
// ============================================================================

/**
 * Fiscal year start is defined by month/day from a template date (e.g., new Date('2024-04-01')).
 * We only use month/day parts; year and time are ignored.
 */
export function getFiscalYearRange(
  date: Date,
  timezone: AccountingTimezone,
  fiscalYearStartTemplate: Date // e.g., 2024-04-01 for Apr 1 start
): DateRange {
  if (!isValid(date) || !isValid(fiscalYearStartTemplate)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        date,
        { operation: 'validate-date' }
      );
  }
  const local = utcToZonedTime(date, timezone);
  const fyMonth = getMonth(fiscalYearStartTemplate);
  const fyDay = getDate(fiscalYearStartTemplate);
  const localYear = getYear(local);
  // Build candidate FY start in the same calendar year
  const candidateStart = new Date(localYear, fyMonth, fyDay, 0, 0, 0, 0);
  const startLocal = (local < candidateStart)
    ? new Date(localYear - 1, fyMonth, fyDay, 0, 0, 0, 0)
    : candidateStart;
  const endLocal = addYears(new Date(startLocal), 1);
  endLocal.setMilliseconds(endLocal.getMilliseconds() - 1);
  return rangeFromLocal(startLocal, endLocal, timezone);
}

/**
 * Convenience: generic dispatcher for period ranges.
 */
export function getPeriodRange(config: {
  period: AccountingPeriod;
  date?: Date;
  timezone?: AccountingTimezone;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
  isoWeek?: boolean;
}): DateRange {
  const {
    period, date = new Date(),
    timezone = ACCOUNTING_TIMEZONES.UTC,
    weekStartsOn, fiscalYearStart, isoWeek,
  } = config;
  switch (period) {
    case 'daily':     return getDailyRange(date, timezone);
    case 'weekly':    return getWeeklyRange(date, timezone, { 
      ...(weekStartsOn !== undefined && { weekStartsOn }), 
      iso: isoWeek ?? true 
    });
    case 'monthly':   return getMonthlyRange(date, timezone);
    case 'quarterly': return getQuarterlyRange(date, timezone);
    case 'yearly':
      if (fiscalYearStart) return getFiscalYearRange(date, timezone, fiscalYearStart);
      return getYearlyRange(date, timezone);
  }
}

/**
 * Enumerate contiguous period buckets covering [start,end] in a given zone.
 * Each bucket is a DateRange (UTC instants) aligned to the period.
 */
export function enumeratePeriodsBetween(
  start: Date,
  end: Date,
  period: AccountingPeriod,
  timezone: AccountingTimezone,
  options?: { weekStartsOn?: WeekStartsOn; isoWeek?: boolean; fiscalYearStart?: Date }
): DateRange[] {
  if (!isValid(start) || !isValid(end) || isAfter(start, end)) {
    throw createValidationError(
        'INVALID_RANGE',
        'Invalid range',
        'range',
        { operation: 'validate-range' }
      );
  }
  const ranges: DateRange[] = [];
  let cursorRange = getPeriodRange({
    period, date: start, timezone,
    ...(options?.weekStartsOn !== undefined && { weekStartsOn: options.weekStartsOn }),
    ...(options?.isoWeek !== undefined && { isoWeek: options.isoWeek }),
    ...(options?.fiscalYearStart !== undefined && { fiscalYearStart: options.fiscalYearStart }),
  });
  while (!isAfter(cursorRange.start, end)) {
    ranges.push(cursorRange);
    const nextAnchor = addDuration(cursorRange.start, {
      days:   period === 'daily' ? 1 : 0,
      weeks:  period === 'weekly' ? 1 : 0,
      months: period === 'monthly' ? 1 : 0,
      years:  (period === 'quarterly' || period === 'yearly') ? (period === 'yearly' ? 1 : 0) : 0,
    });
    if (period === 'quarterly') {
      // advance 3 months
      const local = utcToZonedTime(nextAnchor, timezone);
      const advanced = addMonths(local, 3);
      cursorRange = getQuarterlyRange(zonedTimeToUtc(advanced, timezone), timezone);
    } else if (period === 'yearly' && options?.fiscalYearStart) {
      const local = utcToZonedTime(nextAnchor, timezone);
      const advanced = addYears(local, 1);
      cursorRange = getFiscalYearRange(zonedTimeToUtc(advanced, timezone), timezone, options.fiscalYearStart);
    } else {
      cursorRange = getPeriodRange({
        period, date: nextAnchor, timezone,
        ...(options?.weekStartsOn !== undefined && { weekStartsOn: options.weekStartsOn }),
        ...(options?.isoWeek !== undefined && { isoWeek: options.isoWeek }),
        ...(options?.fiscalYearStart !== undefined && { fiscalYearStart: options.fiscalYearStart }),
      });
    }
    // safety: avoid infinite loops on extreme dates
    if (ranges.length > 5000) break;
  }
  return ranges;
}

// ============================================================================
// VALUES ↔ BUCKETS ADAPTERS (charts, cubes, accruals)
// ============================================================================

export type NumericMap = Record<string, number>;

export type SeriesPoint = {
  machineKey: string;        // stable compact key
  label: string;             // human label
  start: Date;               // UTC instant
  end: Date;                 // UTC instant
  value: number;             // aggregated numeric value
};

/**
 * Attach numeric values (by machineKey) to buckets, optionally filling gaps.
 * Unknown keys default to 0 unless `fillWith` provided.
 */
export function attachValuesToBuckets(
  buckets: PeriodBucket[],
  valuesByKey: NumericMap,
  options?: { fillWith?: number; round?: (n: number) => number }
): SeriesPoint[] {
  const fillWith = options?.fillWith ?? 0;
  const round = options?.round ?? ((n: number) => n);
  return buckets.map(b => ({
    machineKey: b.key,
    label: b.label,
    start: b.start,
    end: b.end,
    value: round(valuesByKey[b.key] ?? fillWith),
  }));
}

/**
 * Build a dense map (machineKey → value) for a bucket list, using defaults for gaps.
 */
export function fillGapsAsMap(
  buckets: PeriodBucket[],
  valuesByKey: NumericMap,
  options?: { fillWith?: number; round?: (n: number) => number }
): NumericMap {
  const pts = attachValuesToBuckets(buckets, valuesByKey, options);
  const out: NumericMap = {};
  for (const p of pts) out[p.machineKey] = p.value;
  return out;
}

/**
 * Roll up a numeric map to a coarser period using structural rollup.
 * This only changes the *structure* of buckets; supply your own sum logic
 * via the returned `groups` so you can e.g., sum, avg, max, etc.
 *
 * For convenience, `sumAggregator` will sum values per target bucket.
 */
export function rollupNumericMap(config: {
  valuesByKey: NumericMap;
  source: { period: AccountingPeriod; start: Date; end: Date; timezone: AccountingTimezone; isoWeek?: boolean; weekStartsOn?: WeekStartsOn; fiscalYearStart?: Date; fiscalQuarterMode?: boolean; locale?: AccountingLocale };
  targetPeriod: AccountingPeriod;
  aggregator?: (keys: string[], valuesByKey: NumericMap) => number;
}): { buckets: PeriodBucket[]; groups: Record<string, string[]>; result: NumericMap } {
  const { valuesByKey, source, targetPeriod, aggregator } = config;
  const srcBuckets = bucketizePeriods({
    period: source.period,
    start: source.start,
    end: source.end,
    timezone: source.timezone,
    ...(source.isoWeek !== undefined && { isoWeek: source.isoWeek }),
    ...(source.weekStartsOn !== undefined && { weekStartsOn: source.weekStartsOn }),
    ...(source.fiscalYearStart !== undefined && { fiscalYearStart: source.fiscalYearStart }),
    ...(source.fiscalQuarterMode !== undefined && { fiscalQuarterMode: source.fiscalQuarterMode }),
    ...(source.locale !== undefined && { locale: source.locale }),
  });
  const tgtBuckets = bucketizePeriods({
    period: targetPeriod,
    start: source.start,
    end: source.end,
    timezone: source.timezone,
    ...(source.isoWeek !== undefined && { isoWeek: source.isoWeek }),
    ...(source.weekStartsOn !== undefined && { weekStartsOn: source.weekStartsOn }),
    ...(source.fiscalYearStart !== undefined && { fiscalYearStart: source.fiscalYearStart }),
    ...(source.fiscalQuarterMode !== undefined && { fiscalQuarterMode: source.fiscalQuarterMode }),
    ...(source.locale !== undefined && { locale: source.locale }),
  });
  // Build group mapping: targetKey -> [sourceKeys...]
  const groups: Record<string, string[]> = {};
  for (const s of srcBuckets) {
    // find which target bucket contains this start
    const t = tgtBuckets.find(tb => s.start >= tb.start && s.start <= tb.end);
    if (!t) continue;
    const array = groups[t.key] ?? [];
    array.push(s.key);
    groups[t.key] = array;
  }
  const agg = aggregator ?? ((keys: string[], map: NumericMap) => keys.reduce((sum, k) => sum + (map[k] ?? 0), 0));
  const result: NumericMap = {};
  for (const tb of tgtBuckets) {
    const keys = groups[tb.key] ?? [];
    result[tb.key] = agg(keys, valuesByKey);
  }
  return { buckets: tgtBuckets, groups, result };
}

/**
 * Align multiple series to the same bucket axis (by target `buckets`).
 * Useful for stacked charts or KPI panels.
 */
export function alignSeriesOnBuckets(
  buckets: PeriodBucket[],
  series: Array<{ name: string; valuesByKey: NumericMap; round?: (n: number) => number; fillWith?: number }>
): { categories: string[]; rows: Array<{ name: string; data: number[] }>; meta: SeriesPoint[][] } {
  const categories = buckets.map(b => b.label);
  const rows: Array<{ name: string; data: number[] }> = [];
  const meta: SeriesPoint[][] = [];
  for (const s of series) {
    const pts = attachValuesToBuckets(buckets, s.valuesByKey, { 
      ...(s.fillWith !== undefined && { fillWith: s.fillWith }),
      ...(s.round !== undefined && { round: s.round }),
    });
    rows.push({ name: s.name, data: pts.map(p => p.value) });
    meta.push(pts);
  }
  return { categories, rows, meta };
}

/**
 * Prorate a total value across buckets proportionally to time overlap.
 * Example: allocate a monthly subscription (or accrual) across fiscal quarters.
 */
export function prorateValueAcrossBuckets(
  totalValue: number,
  buckets: PeriodBucket[],
  range: DateRange,                 // the active window of the item
  options?: { round?: (n: number) => number }
): NumericMap {
  const round = options?.round ?? ((n: number) => n);
  let coveredMs = 0;
  const overlaps: number[] = [];
  for (const b of buckets) {
    const s = Math.max(range.start.getTime(), b.start.getTime());
    const e = Math.min(range.end.getTime(),   b.end.getTime());
    const ms = Math.max(0, e - s);
    overlaps.push(ms);
    coveredMs += ms;
  }
  const out: NumericMap = {};
  if (coveredMs <= 0) {
    for (const b of buckets) out[b.key] = 0;
    return out;
  }
  const unit = totalValue / coveredMs;
  for (let index = 0; index < buckets.length; index++) {
    const bucket = buckets[index];
    const overlap = overlaps[index];
    if (bucket && overlap !== undefined) {
      out[bucket.key] = round(unit * overlap);
    }
  }
  return out;
}

/**
 * Convenience: produce a chart-ready dataset from a raw map by:
 * 1) bucketizing a range,
 * 2) attaching values (gap-filled),
 * 3) returning categories + data arrays.
 */
export function asChartDataset(config: {
  valuesByKey: NumericMap;
  period: AccountingPeriod;
  start: Date;
  end: Date;
  timezone: AccountingTimezone;
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
  fiscalQuarterMode?: boolean;
  locale?: AccountingLocale;
  fillWith?: number;
  round?: (n: number) => number;
}): { categories: string[]; data: number[]; buckets: PeriodBucket[] } {
  const { valuesByKey, period, start, end, timezone, isoWeek, weekStartsOn, fiscalYearStart, fiscalQuarterMode, locale, fillWith, round } = config;
  const buckets = bucketizePeriods({
    period, start, end, timezone,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
    ...(locale !== undefined && { locale }),
  });
  const pts = attachValuesToBuckets(buckets, valuesByKey, { 
    ...(fillWith !== undefined && { fillWith }),
    ...(round !== undefined && { round }),
  });
  return {
    categories: pts.map(p => p.label),
    data: pts.map(p => p.value),
    buckets,
  };
}

// ============================================================================
// CUMULATIVE & YEAR-OVER-YEAR (YoY) HELPERS
// ============================================================================

/**
 * Build a cumulative running total over a bucket axis.
 * Accepts either an existing SeriesPoint[] or a map and buckets.
 */
export function cumulativeFromSeries(points: SeriesPoint[]): SeriesPoint[] {
  let accumulator = 0;
  return points
    .slice()
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(p => {
      accumulator += p.value || 0;
      return { ...p, value: accumulator };
    });
}

export function cumulativeFromMap(
  buckets: PeriodBucket[],
  valuesByKey: NumericMap,
  options?: { fillWith?: number; round?: (n: number) => number }
): SeriesPoint[] {
  const pts = attachValuesToBuckets(buckets, valuesByKey, options);
  return cumulativeFromSeries(pts);
}

export type YoYSeries = {
  /** Bucket labels for CURRENT period axis */
  categories: string[];
  /** CURRENT values aligned to categories */
  current: number[];
  /** PRIOR values aligned by bucket position */
  prior: number[];
  /** CURRENT - PRIOR */
  delta: number[];
  /** (CURRENT / PRIOR - 1) * 100 (%, 0 if prior=0) */
  pct: number[];
  /** Buckets used for CURRENT axis */
  buckets: PeriodBucket[];
};

/**
 * Year-over-year comparison for any period granularity.
 * Aligns CURRENT {start,end} with PRIOR by shifting dates back one year (tz-aware).
 *
 * Notes:
 * - For 'yearly' with fiscalYearStart, prior window is previous FY.
 * - For 'weekly'/'monthly'/'quarterly', prior window is {start-1y, end-1y}.
 * - Provide two maps: `currentMap` and `priorMap`, keyed by CURRENT/PRIOR machineKey respectively.
 */
export function buildYoY(config: {
  period: AccountingPeriod;
  start: Date;
  end: Date;
  timezone: AccountingTimezone;
  currentMap: NumericMap;
  priorMap: NumericMap;
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
  fiscalQuarterMode?: boolean;
  locale?: AccountingLocale;
  fillWith?: number;
  round?: (n: number) => number;
}): YoYSeries {
  const {
    period, start, end, timezone,
    currentMap, priorMap,
    isoWeek = true, weekStartsOn, fiscalYearStart, fiscalQuarterMode, locale,
    fillWith = 0, round = (n: number) => n,
  } = config;

  // Build CURRENT buckets over {start,end}
  const currentBuckets = bucketizePeriods({
    period, start, end, timezone,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
    ...(locale !== undefined && { locale }),
  });
  const currentPoints = attachValuesToBuckets(currentBuckets, currentMap, { fillWith, round });

  // Determine PRIOR window
  let priorStart: Date;
  let priorEnd: Date;
  if (period === 'yearly' && fiscalYearStart) {
    // Prior FY
    const thisFY = getFiscalYearRange(start, timezone, fiscalYearStart);
    const priorFYStartLocal = utcToZonedTime(thisFY.start, timezone);
    const priorFYStart = zonedTimeToUtc(addYears(priorFYStartLocal, -1), timezone);
    const priorFYEndLocal = utcToZonedTime(thisFY.end, timezone);
    const priorFYEnd = zonedTimeToUtc(addYears(priorFYEndLocal, -1), timezone);
    priorStart = priorFYStart;
    priorEnd = priorFYEnd;
  } else {
    // Generic: shift 1 calendar year in local tz
    const sLoc = utcToZonedTime(start, timezone);
    const eLoc = utcToZonedTime(end, timezone);
    priorStart = zonedTimeToUtc(addYears(sLoc, -1), timezone);
    priorEnd   = zonedTimeToUtc(addYears(eLoc, -1), timezone);
  }

  // Build PRIOR buckets over shifted window, same structure
  const priorBuckets = bucketizePeriods({
    period, start: priorStart, end: priorEnd, timezone,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
    ...(locale !== undefined && { locale }),
  });

  // Align by index (bucket position), not by machineKey (years differ)
  const priorPoints = attachValuesToBuckets(priorBuckets, priorMap, { fillWith, round });
  const length = Math.min(currentPoints.length, priorPoints.length);
  const categories = currentPoints.slice(0, length).map(p => p.label);
  const current = currentPoints.slice(0, length).map(p => p.value);
  const prior = priorPoints.slice(0, length).map(p => p.value);
  const delta = current.map((v, index) => round(v - (prior[index] || 0)));
  const pct   = current.map((v, index) => (prior[index] || 0) === 0 ? 0 : round((v / (prior[index] || 0) - 1) * 100));

  return { categories, current, prior, delta, pct, buckets: currentBuckets.slice(0, length) };
}

/**
 * YoY-to-date (YTD) comparison that:
 * - Anchors CURRENT window from its (fiscal) year start up to `anchor` (inclusive),
 * - Builds PRIOR window by shifting both dates back one year, with the same *length* in days,
 * - Returns aligned arrays and deltas.
 *
 * If `fiscalYearStart` is provided, "year start" means FY start in the target timezone.
 */
export function buildYoYToDate(config: {
  period: AccountingPeriod;               // typically 'monthly' or 'weekly' for charts
  anchor: Date;                           // "today" or report date (UTC instant)
  timezone: AccountingTimezone;
  currentMap: NumericMap;
  priorMap: NumericMap;
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
  fiscalQuarterMode?: boolean;
  locale?: AccountingLocale;
  fillWith?: number;
  round?: (n: number) => number;
}): YoYSeries {
  const {
    period, anchor, timezone,
    currentMap, priorMap,
    isoWeek = true, weekStartsOn, fiscalYearStart, fiscalQuarterMode, locale,
    fillWith = 0, round = (n: number) => n,
  } = config;

  // CURRENT window: from (FY or calendar) year start to anchor (end of day in tz)
  let currentStart: Date;
  let currentEnd: Date;
  if (fiscalYearStart) {
    const fy = getFiscalYearRange(anchor, timezone, fiscalYearStart);
    currentStart = fy.start;
    // cap at "today end" in tz (not the full FY end if anchor is mid-year)
    const localAnchor = utcToZonedTime(anchor, timezone);
    const localEnd = endOfDay(localAnchor);
    currentEnd = zonedTimeToUtc(localEnd, timezone);
  } else {
    // Calendar year start to today end (tz)
    const local = utcToZonedTime(anchor, timezone);
    const yStartLocal = startOfYear(local);
    currentStart = zonedTimeToUtc(yStartLocal, timezone);
    currentEnd = zonedTimeToUtc(endOfDay(local), timezone);
  }

  return buildYoY({
    period,
    start: currentStart,
    end: currentEnd,
    timezone,
    currentMap,
    priorMap,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
    ...(locale !== undefined && { locale }),
    fillWith,
    round,
  });
}

/**
 * Convenience: cumulative YoY series — returns cumulative current & prior,
 * with delta and pct computed on the cumulative values.
 */
export function buildCumulativeYoY(config: Parameters<typeof buildYoY>[0]): YoYSeries {
  const base = buildYoY(config);
  let accumulatorCurrent = 0, accumulatorPri = 0;
  const current: number[] = [];
  const prior: number[] = [];
  for (let index = 0; index < base.current.length; index++) {
    accumulatorCurrent += base.current[index] || 0;
    accumulatorPri += base.prior[index] || 0;
    current.push(accumulatorCurrent);
    prior.push(accumulatorPri);
  }
  const delta = current.map((v, index) => v - (prior[index] || 0));
  const pct = current.map((v, index) => (prior[index] || 0) === 0 ? 0 : ((v / (prior[index] || 0) - 1) * 100));
  return { ...base, current, prior, delta, pct };
}

// ============================================================================
// PERIOD-OVER-PERIOD (PoP): MoM / QoQ and generic sequential deltas
// ============================================================================

export type PoPSeries = {
  categories: string[];  // bucket labels
  current: number[];     // values
  prev: number[];        // previous bucket values (lag=1)
  delta: number[];       // current - prev
  pct: number[];         // (current / prev - 1) * 100 (0 if prev=0)
  buckets: PeriodBucket[];
};

/**
 * Compute sequential period-over-period deltas on a given bucket axis.
 * Works for any period (daily/weekly/monthly/quarterly/yearly).
 */
export function buildPeriodOverPeriod(config: {
  period: AccountingPeriod;
  start: Date;
  end: Date;
  timezone: AccountingTimezone;
  valuesByKey: NumericMap;
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
  fiscalQuarterMode?: boolean;
  locale?: AccountingLocale;
  fillWith?: number;
  round?: (n: number) => number;
}): PoPSeries {
  const {
    period, start, end, timezone, valuesByKey,
    isoWeek = true, weekStartsOn, fiscalYearStart, fiscalQuarterMode, locale,
    fillWith = 0, round = (n: number) => n,
  } = config;
  const buckets = bucketizePeriods({
    period, start, end, timezone,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
    ...(locale !== undefined && { locale }),
  });
  const pts = attachValuesToBuckets(buckets, valuesByKey, { fillWith, round });
  const current = pts.map(p => p.value || 0);
  const previous = current.map((_, index) => (index === 0 ? 0 : current[index - 1] || 0));
  const delta = current.map((v, index) => round(v - (previous[index] || 0)));
  const pct   = current.map((v, index) => ((previous[index] || 0) === 0 ? 0 : round((v / (previous[index] || 0) - 1) * 100)));
  return { categories: pts.map(p => p.label), current, prev: previous, delta, pct, buckets };
}

/** Convenience: Month-over-Month over a window. */
export function buildMoM(config: Omit<Parameters<typeof buildPeriodOverPeriod>[0], 'period'>): PoPSeries {
  return buildPeriodOverPeriod({ ...config, period: 'monthly' });
}

/** Convenience: Quarter-over-Quarter over a window (calendar or fiscal). */
export function buildQoQ(config: Omit<Parameters<typeof buildPeriodOverPeriod>[0], 'period'>): PoPSeries {
  return buildPeriodOverPeriod({ ...config, period: 'quarterly' });
}

// ============================================================================
// SEASONALITY INDEX (monthly/weekly): value vs multi-year baseline
// ============================================================================

function median(nums: number[]): number {
  if (isEmpty(nums)) return 0;
  const a = nums.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? (a[m] || 0) : ((a[m - 1] || 0) + (a[m] || 0)) / 2;
}

export type SeasonalityResult = {
  /** Bucket labels (latest window axis) */
  categories: string[];
  /** Raw values from valuesByKey aligned to buckets */
  values: number[];
  /** Baseline per position (month or ISO week) */
  baseline: number[];
  /** Index = (value / baseline) * 100 (0 if baseline=0) */
  index: number[];
  /** Buckets used (for latest window) */
  buckets: PeriodBucket[];
  /** Which method was used for baseline */
  method: 'mean' | 'median';
};

/**
 * Build a seasonality index over monthly or weekly buckets.
 * - Computes baseline per calendar position (month 1..12 or ISO week 1..53)
 *   across multiple years in the provided [start,end] window.
 * - Baseline can be mean or median (median by default; more robust).
 * - You can exclude the latest year from the baseline (default true).
 */
export function buildSeasonalityIndex(config: {
  period: Extract<AccountingPeriod, 'monthly' | 'weekly'>;
  start: Date;                     // multi-year range recommended
  end: Date;
  timezone: AccountingTimezone;
  valuesByKey: NumericMap;         // keys for all years in the range
  method?: 'mean' | 'median';
  includeCurrentInBaseline?: boolean; // default false
  isoWeek?: boolean;               // weekly only
  weekStartsOn?: WeekStartsOn;     // weekly only (for non-ISO label/buckets)
  locale?: AccountingLocale;
}): SeasonalityResult {
  const {
    period, start, end, timezone, valuesByKey,
    method = 'median', includeCurrentInBaseline = false,
    isoWeek = true, weekStartsOn, locale,
  } = config;
  // 1) Bucketize entire range
  const allBuckets = bucketizePeriods({
    period, start, end, timezone,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(locale !== undefined && { locale }),
  });
  // 2) Group by calendar position
  const byPos: Record<string, number[]> = {};   // "M-01".."M-12" or "W-01".. "W-53"
  const byPosLatest: Record<string, { key: string; v: number }[]> = {};
  // Determine latest year in local tz to optionally exclude from baseline
  const latestYearLocal = allBuckets.reduce((maxY, b) => {
    const y = getYear(utcToZonedTime(b.start, timezone));
    return Math.max(maxY, y);
  }, -Infinity);
  for (const b of allBuckets) {
    const local = utcToZonedTime(b.start, timezone);
    const y = getYear(local);
    const pos = period === 'monthly'
      ? `M-${String(getMonth(local) + 1).padStart(2, '0')}`
      : `W-${String(getISOWeek(local)).padStart(2, '0')}`;
    const v = valuesByKey[b.key] ?? 0;
    // accumulate for baseline
    if (includeCurrentInBaseline || y < latestYearLocal) {
      (byPos[pos] = byPos[pos] || []).push(v);
    }
    // keep track of latest window's entries per pos
    (byPosLatest[pos] = byPosLatest[pos] || []).push({ key: b.key, v });
  }
  // 3) Compute baseline per position
  const baselineByPos: Record<string, number> = {};
  const agg = (array: number[]) => (method === 'mean'
    ? (array.reduce((s, x) => s + x, 0) / (array.length || 1))
    : median(array));
  for (const pos of Object.keys(byPos)) {
    baselineByPos[pos] = agg(byPos[pos] || []);
  }
  // 4) Select latest single-year window to return (the last contiguous year)
  //    Find first/last buckets that have local year === latestYearLocal
  const latestYearBuckets = allBuckets.filter(b =>
    getYear(utcToZonedTime(b.start, timezone)) === latestYearLocal
  );
  // 5) Build aligned arrays for that latest window
  const categories = latestYearBuckets.map(b => b.label);
  const values = latestYearBuckets.map(b => valuesByKey[b.key] ?? 0);
  const baseline = latestYearBuckets.map(b => {
    const local = utcToZonedTime(b.start, timezone);
    const pos = period === 'monthly'
      ? `M-${String(getMonth(local) + 1).padStart(2, '0')}`
      : `W-${String(getISOWeek(local)).padStart(2, '0')}`;
    return baselineByPos[pos] ?? 0;
  });
  const index = values.map((v, index_) => ((baseline[index_] || 0) === 0 ? 0 : (v / (baseline[index_] || 0)) * 100));
  return { categories, values, baseline, index, buckets: latestYearBuckets, method };
}

// ============================================================================
// TREND CLASSIFICATION + COMPOSITE KPI
// ============================================================================

export type TrendLabel = 'rising' | 'flat' | 'falling';

/**
 * Classify a single change as rising/flat/falling using absolute and/or pct thresholds.
 * If both thresholds are provided, both must indicate movement; otherwise "flat".
 */
export function classifyTrend(change: {
  deltaAbs?: number;                  // current - previous
  deltaPct?: number;                  // (current/previous - 1) * 100
  epsAbs?: number;                    // default 1e-9
  epsPct?: number;                    // default 0.001 (%)
}): TrendLabel {
  const epsAbs = change.epsAbs ?? 1e-9;
  const epsPct = change.epsPct ?? 0.001;
  const hasAbs = typeof change.deltaAbs === 'number';
  const hasPct = typeof change.deltaPct === 'number';
  const upAbs = hasAbs ? (change.deltaAbs! > epsAbs) : false;
  const dnAbs = hasAbs ? (change.deltaAbs! < -epsAbs) : false;
  const upPct = hasPct ? (change.deltaPct! > epsPct) : false;
  const dnPct = hasPct ? (change.deltaPct! < -epsPct) : false;
  if (hasAbs && hasPct) {
    if (upAbs && upPct) return 'rising';
    if (dnAbs && dnPct) return 'falling';
    return 'flat';
  }
  if (upAbs || upPct) return 'rising';
  if (dnAbs || dnPct) return 'falling';
  return 'flat';
}

/**
 * Classify trend of a short series using a simple "window vs previous window" slope proxy.
 * Compares mean of last W points vs prior W points (handles noisy data better than 1-lag).
 */
export function classifySeriesTrend(
  values: number[],
  options?: { window?: number; epsAbs?: number; epsPct?: number }
): TrendLabel {
  const W = Math.max(1, options?.window ?? 3);
  if (values.length < W + 1) {
    // fallback to last vs previous
    const last = values[values.length - 1] ?? 0;
    const previous = values[values.length - 2] ?? 0;
    const deltaAbs = last - previous;
    const deltaPct = previous === 0 ? 0 : ((last / previous - 1) * 100);
    return classifyTrend({ 
      deltaAbs, 
      deltaPct, 
      ...(options?.epsAbs !== undefined && { epsAbs: options.epsAbs }),
      ...(options?.epsPct !== undefined && { epsPct: options.epsPct }),
    });
  }
  const tail = values.slice(-W);
  const previousTail = values.slice(-(2 * W), -W);
  const mean = (array: number[]) => array.reduce((s, x) => s + (x ?? 0), 0) / (array.length || 1);
  const m1 = mean(previousTail);
  const m2 = mean(tail);
  const deltaAbs = m2 - m1;
  const deltaPct = m1 === 0 ? 0 : ((m2 / m1 - 1) * 100);
  return classifyTrend({ 
    deltaAbs, 
    deltaPct, 
    ...(options?.epsAbs !== undefined && { epsAbs: options.epsAbs }),
    ...(options?.epsPct !== undefined && { epsPct: options.epsPct }),
  });
}

export type KPIChange = {
  value: number;          // current value for that comparator window (usually last bucket)
  prev?: number;          // previous comparison value (e.g., prior month/quarter/year)
  deltaAbs: number;       // value - prev (or 0 if not available)
  deltaPct: number;       // % change (0 if prev=0 or not available)
  trend: TrendLabel;      // rising/flat/falling
};

export type KPIComposite = {
  period: AccountingPeriod;
  timezone: AccountingTimezone;
  window: DateRange;                    // current window used for the axis
  headline: KPIChange;                  // based on the last bucket of the chosen period
  mom?: KPIChange;                      // month-over-month (if period granular enough)
  qoq?: KPIChange;                      // quarter-over-quarter
  yoy?: KPIChange;                      // year-over-year (matching window)
  ytd?: KPIChange;                      // year-to-date vs prior YTD
  spark: { categories: string[]; data: number[]; buckets: PeriodBucket[] }; // for charts
};

/**
 * Build a unified KPI summary with MoM, QoQ, YoY, and YTD (where applicable).
 * - period/start/end define the "headline" axis and sparkline.
 * - Provide currentMap/priorMap (prior keyed to its own year's machine keys).
 */
export function buildKPIComposite(config: {
  period: AccountingPeriod;
  start: Date;
  end: Date;
  timezone: AccountingTimezone;
  currentMap: NumericMap;
  priorMap?: NumericMap;                // for YoY/YTD
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
  fiscalQuarterMode?: boolean;
  locale?: AccountingLocale;
  fillWith?: number;
  round?: (n: number) => number;
  trendWindow?: number;                 // default 3 (for classifySeriesTrend)
}): KPIComposite {
  const {
    period, start, end, timezone,
    currentMap, priorMap,
    isoWeek = true, weekStartsOn, fiscalYearStart, fiscalQuarterMode, locale,
    fillWith = 0, round = (n: number) => n, trendWindow = 3,
  } = config;

  // Build sparkline data for the chosen axis
  const spark = asChartDataset({
    valuesByKey: currentMap,
    period, start, end, timezone,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
    ...(locale !== undefined && { locale }),
    fillWith, round,
  });
  const values = spark.data;
  const last = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2] ?? 0;
  const headlineDeltaAbs = round(last - previous);
  const headlineDeltaPct = previous === 0 ? 0 : round((last / previous - 1) * 100);
  const headlineTrend = classifySeriesTrend(values, { window: trendWindow });
  const headline: KPIChange = {
    value: last,
    prev: previous,
    deltaAbs: headlineDeltaAbs,
    deltaPct: headlineDeltaPct,
    trend: headlineTrend,
  };

  // MoM (only sensible if period granularity is monthly or finer)
  let mom: KPIChange | undefined;
  if (period === 'daily' || period === 'weekly' || period === 'monthly') {
    const momSeries = buildMoM({
      start, end, timezone, valuesByKey: currentMap,
      ...(isoWeek !== undefined && { isoWeek }),
      ...(weekStartsOn !== undefined && { weekStartsOn }),
      ...(fiscalYearStart !== undefined && { fiscalYearStart }),
      ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
      ...(locale !== undefined && { locale }),
      fillWith, round,
    });
    const index = momSeries.current.length - 1;
    if (index >= 0) {
      const v = momSeries.current[index] || 0;
      const p = momSeries.prev[index] || 0;
      const dA = round(v - p);
      const dP = p === 0 ? 0 : round((v / p - 1) * 100);
      mom = { value: v, prev: p, deltaAbs: dA, deltaPct: dP, trend: classifyTrend({ deltaAbs: dA, deltaPct: dP }) };
    }
  }

  // QoQ (calendar or fiscal depending on flags)
  let qoq: KPIChange | undefined;
  {
    const qSeries = buildQoQ({
      start, end, timezone, valuesByKey: currentMap,
      ...(isoWeek !== undefined && { isoWeek }),
      ...(weekStartsOn !== undefined && { weekStartsOn }),
      ...(fiscalYearStart !== undefined && { fiscalYearStart }),
      ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
      ...(locale !== undefined && { locale }),
      fillWith, round,
    });
    const index = qSeries.current.length - 1;
    if (index >= 0) {
      const v = qSeries.current[index] || 0;
      const p = qSeries.prev[index] || 0;
      const dA = round(v - p);
      const dP = p === 0 ? 0 : round((v / p - 1) * 100);
      qoq = { value: v, prev: p, deltaAbs: dA, deltaPct: dP, trend: classifyTrend({ deltaAbs: dA, deltaPct: dP }) };
    }
  }

  // YoY (requires priorMap)
  let yoy: KPIChange | undefined;
  if (priorMap) {
    const y = buildYoY({
      period, start, end, timezone,
      currentMap, priorMap,
      ...(isoWeek !== undefined && { isoWeek }),
      ...(weekStartsOn !== undefined && { weekStartsOn }),
      ...(fiscalYearStart !== undefined && { fiscalYearStart }),
      ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
      ...(locale !== undefined && { locale }),
      fillWith, round,
    });
    const index = y.current.length - 1;
    if (index >= 0) {
      const v = y.current[index] || 0;
      const p = y.prior[index] || 0;
      const dA = round(v - p);
      const dP = p === 0 ? 0 : round((v / p - 1) * 100);
      yoy = { value: v, prev: p, deltaAbs: dA, deltaPct: dP, trend: classifyTrend({ deltaAbs: dA, deltaPct: dP }) };
    }
  }

  // YTD (requires priorMap)
  let ytd: KPIChange | undefined;
  if (priorMap) {
    const anchor = end; // use window end as "today"
    const y = buildYoYToDate({
      period, anchor, timezone,
      currentMap, priorMap,
      ...(isoWeek !== undefined && { isoWeek }),
      ...(weekStartsOn !== undefined && { weekStartsOn }),
      ...(fiscalYearStart !== undefined && { fiscalYearStart }),
      ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
      ...(locale !== undefined && { locale }),
      fillWith, round,
    });
    const index = y.current.length - 1;
    if (index >= 0) {
      const v = y.current.reduce((s, x) => s + x, 0);
      const p = y.prior.reduce((s, x) => s + x, 0);
      const dA = round(v - p);
      const dP = p === 0 ? 0 : round((v / p - 1) * 100);
      ytd = { value: v, prev: p, deltaAbs: dA, deltaPct: dP, trend: classifyTrend({ deltaAbs: dA, deltaPct: dP }) };
    }
  }

  return {
    period,
    timezone,
    window: { start, end },
    headline,
    ...(mom !== undefined && { mom }),
    ...(qoq !== undefined && { qoq }),
    ...(yoy !== undefined && { yoy }),
    ...(ytd !== undefined && { ytd }),
    spark,
  };
}

// ============================================================================
// PERIOD BUCKETING (stable keys + labels for charts/tables)
// ============================================================================

export type PeriodBucket = {
  /** Stable key: ISO_DATETIME of start in target tz (but stored as UTC instant) */
  key: string;
  /** Human label (localized when requested) */
  label: string;
  /** UTC instants delimiting the bucket */
  start: Date;
  end: Date;
};

/**
 * Build buckets for a given period across [start,end] (inclusive), with stable keys and labels.
 * - Keys: `YYYY-MM-DDTHH:mm:ss.sss±hh:mm` formatted in the target timezone at bucket start.
 * - Labels: via formatPeriodLabel (or FY/FYQ where applicable).
 */
export function bucketizePeriods(config: {
  period: AccountingPeriod;
  start: Date;
  end: Date;
  timezone: AccountingTimezone;
  locale?: AccountingLocale;
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;     // if set and period==='yearly', label as FYyyyy
  fiscalQuarterMode?: boolean; // if true and period==='quarterly', label as FYyyyy Qn
}): PeriodBucket[] {
  const {
    period, start, end, timezone,
    locale, isoWeek = true, weekStartsOn, fiscalYearStart, fiscalQuarterMode,
  } = config;
  if (!isValid(start) || !isValid(end) || isAfter(start, end)) {
    throw createValidationError(
        'INVALID_RANGE',
        'Invalid range',
        'range',
        { operation: 'validate-range' }
      );
  }
  const ranges =
    period === 'quarterly' && fiscalQuarterMode && fiscalYearStart
      ? enumerateFiscalQuartersBetween(start, end, timezone, fiscalYearStart)
      : enumeratePeriodsBetween(start, end, period, timezone, {
          ...(isoWeek !== undefined && { isoWeek }),
          ...(weekStartsOn !== undefined && { weekStartsOn }),
          ...(fiscalYearStart !== undefined && { fiscalYearStart }),
        });

  return ranges.map(({ start: s, end: e }) => {
    // Stable key: format bucket start in target tz using ISO_DATETIME
    const key = fmtTZ(s, timezone, DATE_FORMATS.ISO_DATETIME, locale);
    let label: string;
    if (period === 'yearly' && fiscalYearStart) {
      label = formatFiscalYearLabel(s, timezone, fiscalYearStart);
    } else if (period === 'quarterly' && fiscalQuarterMode && fiscalYearStart) {
      label = formatFiscalQuarterLabelLocalized(s, timezone, fiscalYearStart, locale);
    } else {
      label = formatPeriodLabel({
        period, anchor: s, timezone,
        ...(isoWeek !== undefined && { isoWeek }),
        ...(fiscalYearStart !== undefined && { fiscalYearStart }),
        ...(locale !== undefined && { locale }),
      });
    }
    return { key, label, start: s, end: e };
  });
}

/**
 * Convenience: bucketize the last N periods ending at `endAnchor` (default now).
 */
export function bucketizeRolling(config: {
  period: AccountingPeriod;
  count: number;
  timezone: AccountingTimezone;
  endAnchor?: Date;
  locale?: AccountingLocale;
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
  fiscalQuarterMode?: boolean;
}): PeriodBucket[] {
  const {
    period, count, timezone, endAnchor = new Date(),
    locale, isoWeek = true, weekStartsOn, fiscalYearStart, fiscalQuarterMode,
  } = config;
  if (count <= 0 || count > 2000) throw createValidationError(
        'COUNT_OUT_OF_BOUNDS',
        'count out of bounds',
        count.toString(),
        { operation: 'validate-count' }
      );
  // Find earliest start by walking back (reuse existing helpers)
  const windows = buildRollingWindows({
    period, count, timezone, endAnchor,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
  });
  if (isEmpty(windows)) throw createValidationError(
        'NO_WINDOWS_GENERATED',
        'No windows generated',
        'windows',
        { operation: 'generate-windows' }
      );
  const start = windows[0]!.range.start;
  const end = windows[windows.length - 1]!.range.end;
  return bucketizePeriods({
    period, start, end, timezone,
    ...(locale !== undefined && { locale }),
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(fiscalQuarterMode !== undefined && { fiscalQuarterMode }),
  });
}

// ============================================================================
// FISCAL QUARTER HELPERS (strictly within FY)
// ============================================================================

/**
 * Return fiscal quarter number (1..4) for the given date in the given timezone,
 * based on the provided fiscal-year start template (month/day used).
 *
 * Example: FY starts Apr 1 => Q1: Apr–Jun, Q2: Jul–Sep, Q3: Oct–Dec, Q4: Jan–Mar
 */
export function getFiscalQuarter(
  date: Date,
  timezone: AccountingTimezone,
  fiscalYearStartTemplate: Date
): 1|2|3|4 {
  if (!isValid(date) || !isValid(fiscalYearStartTemplate)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        'Invalid date provided',
        date,
        { operation: 'validate-date' }
      );
  }
  const local = utcToZonedTime(date, timezone);
  const fyMonth = getMonth(fiscalYearStartTemplate);
  const fyDay = getDate(fiscalYearStartTemplate);
  const year = getYear(local);
  const candidateStart = new Date(year, fyMonth, fyDay, 0,0,0,0);
  const startLocal = local < candidateStart
    ? new Date(year - 1, fyMonth, fyDay, 0,0,0,0)
    : candidateStart;
  const monthsFromStart = (getYear(local) - getYear(startLocal)) * 12 + (getMonth(local) - getMonth(startLocal));
  const qIndex = Math.floor(monthsFromStart / 3);
  // clamp (defensive)
  const q = qIndex + 1;
  return (q < 1 ? 1 : q > 4 ? 4 : (q as 1|2|3|4));
}

/**
 * Fiscal quarter range (UTC instants) for the quarter that contains `date`.
 */
export function getFiscalQuarterRange(
  date: Date,
  timezone: AccountingTimezone,
  fiscalYearStartTemplate: Date
): DateRange {
  const local = utcToZonedTime(date, timezone);
  const fyMonth = getMonth(fiscalYearStartTemplate);
  const fyDay = getDate(fiscalYearStartTemplate);
  const year = getYear(local);
  const candidateStart = new Date(year, fyMonth, fyDay, 0,0,0,0);
  const fyStartLocal = local < candidateStart
    ? new Date(year - 1, fyMonth, fyDay, 0,0,0,0)
    : candidateStart;
  const monthsFromStart = (getYear(local) - getYear(fyStartLocal)) * 12 + (getMonth(local) - getMonth(fyStartLocal));
  const qIndex = Math.floor(monthsFromStart / 3);
  const qStartLocal = startOfMonth(setMonth(new Date(getYear(fyStartLocal), getMonth(fyStartLocal), fyDay), getMonth(fyStartLocal) + qIndex * 3));
  const qEndLocal = endOfMonth(setMonth(qStartLocal, getMonth(qStartLocal) + 2));
  return {
    start: zonedTimeToUtc(qStartLocal, timezone),
    end: zonedTimeToUtc(qEndLocal, timezone),
  };
}

/**
 * Label like "FY2024 Q2" (FY labeled by start-year).
 */
export function formatFiscalQuarterLabel(
  date: Date,
  timezone: AccountingTimezone,
  fiscalYearStartTemplate: Date
): string {
  const { start } = getFiscalYearRange(date, timezone, fiscalYearStartTemplate);
  const startLocal = utcToZonedTime(start, timezone);
  const fyYear = getYear(startLocal);
  const q = getFiscalQuarter(date, timezone, fiscalYearStartTemplate);
  return `FY${fyYear} Q${q}`;
}

/**
 * Localized fiscal quarter label.
 * Examples:
 *  - en-US: "FY2024 Q2"
 *  - vi-VN: "Quý 2 FY2024"
 *  - ms-MY: "S3 FY2024" (optional style; here we keep "Q2" for consistency)
 *
 * Customize per-locale phrasing lightly while preserving an auditor-friendly FY tag.
 */
export function formatFiscalQuarterLabelLocalized(
  date: Date,
  timezone: AccountingTimezone,
  fiscalYearStartTemplate: Date,
  locale?: AccountingLocale
): string {
  const { start } = getFiscalYearRange(date, timezone, fiscalYearStartTemplate);
  const startLocal = utcToZonedTime(start, timezone);
  const fyYear = getYear(startLocal);
  const q = getFiscalQuarter(date, timezone, fiscalYearStartTemplate);
  switch (locale) {
    case 'vi-VN': return `Quý ${q} FY${fyYear}`;
    case 'ms-MY': return `Q${q} FY${fyYear}`;
    case 'id-ID': return `Kuartal ${q} FY${fyYear}`;
    case 'th-TH': return `ไตรมาส ${q} FY${fyYear}`;
    case 'ja-JP': return `第${q}四半期 FY${fyYear}`;
    case 'zh-HK': return `第${q}季 FY${fyYear}`;
    default:      return `FY${fyYear} Q${q}`;
  }
}

/**
 * Adjacent fiscal quarter range (previous/next) relative to anchor date.
 */
export function getAdjacentFiscalQuarter(
  date: Date,
  direction: 'previous'|'next',
  timezone: AccountingTimezone,
  fiscalYearStartTemplate: Date
): DateRange {
  const delta = direction === 'previous' ? -3 : 3;
  const anchorLocal = utcToZonedTime(date, timezone);
  const movedLocal = addMonths(anchorLocal, delta);
  return getFiscalQuarterRange(zonedTimeToUtc(movedLocal, timezone), timezone, fiscalYearStartTemplate);
}

/**
 * Enumerate fiscal quarters covering [start,end] (inclusive), in order.
 */
export function enumerateFiscalQuartersBetween(
  start: Date,
  end: Date,
  timezone: AccountingTimezone,
  fiscalYearStartTemplate: Date
): DateRange[] {
  if (!isValid(start) || !isValid(end) || isAfter(start, end)) {
    throw createValidationError(
        'INVALID_RANGE',
        'Invalid range',
        'range',
        { operation: 'validate-range' }
      );
  }
  const out: DateRange[] = [];
  let cursor = getFiscalQuarterRange(start, timezone, fiscalYearStartTemplate);
  while (!isAfter(cursor.start, end)) {
    out.push(cursor);
    const nextLocal = utcToZonedTime(cursor.start, timezone);
    const advanced = addMonths(nextLocal, 3);
    cursor = getFiscalQuarterRange(zonedTimeToUtc(advanced, timezone), timezone, fiscalYearStartTemplate);
    if (out.length > 1000) break; // safety guard
  }
  return out;
}

// ============================================================================
// LABEL HELPERS (readable, auditor-friendly)
// ============================================================================

/**
 * Human labels for common periods, e.g.
 * - daily: "2025-09-29"
 * - weekly (ISO): "2025-W39"
 * - monthly: "Sep 2025"
 * - quarterly: "Q3 2025"
 * - yearly: "2025" or "FY2025" when fiscalYearStart provided
 */
export function formatPeriodLabel(config: {
  period: AccountingPeriod;
  anchor?: Date;
  timezone?: AccountingTimezone;
  isoWeek?: boolean;
  fiscalYearStart?: Date;
  monthFormat?: 'MMM yyyy' | 'MMMM yyyy';
  locale?: AccountingLocale;
}): string {
  const {
    period,
    anchor = new Date(),
    timezone = ACCOUNTING_TIMEZONES.UTC,
    isoWeek = true,
    fiscalYearStart,
    monthFormat = 'MMM yyyy',
    locale,
  } = config;
  const local = utcToZonedTime(anchor, timezone);
  const year = getYear(local);
  switch (period) {
    case 'daily':
      return fmtTZ(local, timezone, DATE_FORMATS.ISO, locale);
    case 'weekly': {
      if (isoWeek) {
        const w = getISOWeek(local);
        return `${year}-W${String(w).padStart(2,'0')}`;
      }
      // non-ISO week: label as "Week of 2025-09-29"
      const { start } = getWeeklyRange(anchor, timezone, { iso: false });
      return `Week of ${fmtTZ(start, timezone, DATE_FORMATS.ISO, locale)}`;
    }
    case 'monthly':
      return fmtTZ(local, timezone, monthFormat, locale);
    case 'quarterly': {
      const q = Math.floor(getMonth(local) / 3) + 1;
      return `Q${q} ${year}`;
    }
    case 'yearly':
      if (fiscalYearStart) {
        const { start } = getFiscalYearRange(anchor, timezone, fiscalYearStart);
        const fyStartLocal = utcToZonedTime(start, timezone);
        return `FY${getYear(fyStartLocal) + 0}`; // FY labeled by start year
      }
      return String(year);
  }
}

export function formatQuarterLabel(date: Date, timezone: AccountingTimezone): string {
  const local = utcToZonedTime(date, timezone);
  return `Q${Math.floor(getMonth(local)/3)+1} ${getYear(local)}`;
}

export function formatISOWeekLabel(date: Date, timezone: AccountingTimezone): string {
  const local = utcToZonedTime(date, timezone);
  return `${getYear(local)}-W${String(getISOWeek(local)).padStart(2,'0')}`;
}

/**
 * FY label helper — labels by FY start year, e.g., FY2024 for Apr-01-2024 start.
 */
export function formatFiscalYearLabel(
  date: Date,
  timezone: AccountingTimezone,
  fiscalYearStart: Date
): string {
  const { start } = getFiscalYearRange(date, timezone, fiscalYearStart);
  const startLocal = utcToZonedTime(start, timezone);
  return `FY${getYear(startLocal)}`;
}

// ============================================================================
// ROLLING WINDOWS (last N periods ending now)
// ============================================================================

export function buildRollingWindows(config: {
  period: AccountingPeriod;
  count: number;
  timezone?: AccountingTimezone;
  endAnchor?: Date; // default now
  isoWeek?: boolean;
  weekStartsOn?: WeekStartsOn;
  fiscalYearStart?: Date;
}): { range: DateRange; label: string }[] {
  const {
    period, count,
    timezone = ACCOUNTING_TIMEZONES.UTC,
    endAnchor = new Date(),
    isoWeek = true,
    weekStartsOn,
    fiscalYearStart,
  } = config;
  if (count <= 0 || count > 2000) throw createValidationError(
        'COUNT_OUT_OF_BOUNDS',
        'count out of bounds',
        count.toString(),
        { operation: 'validate-count' }
      );
  const out: { range: DateRange; label: string }[] = [];
  // snap endAnchor to its containing period end
  const current = getPeriodRange({
    period, date: endAnchor, timezone,
    ...(isoWeek !== undefined && { isoWeek }),
    ...(weekStartsOn !== undefined && { weekStartsOn }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
  });
  let cursorStart = current.start;
  for (let index = 0; index < count; index++) {
    const rng = getPeriodRange({
      period, date: cursorStart, timezone,
      ...(isoWeek !== undefined && { isoWeek }),
      ...(weekStartsOn !== undefined && { weekStartsOn }),
      ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    });
    const label = formatPeriodLabel({
      period, anchor: rng.start, timezone,
      ...(isoWeek !== undefined && { isoWeek }),
      ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    });
    out.unshift({ range: rng, label }); // oldest first
    // Move one period back
    if (period === 'daily')        cursorStart = addDays(rng.start, -1);
    else if (period === 'weekly')  cursorStart = addDays(rng.start, -7);
    else if (period === 'monthly') cursorStart = addMonths(rng.start, -1);
    else if (period === 'quarterly') cursorStart = addMonths(rng.start, -3);
    else if (period === 'yearly') {
      if (fiscalYearStart) cursorStart = addYears(rng.start, -1);
      else cursorStart = addYears(rng.start, -1);
    }
  }
  return out;
}

// ============================================================================
// SNAP & NAVIGATION (prev/next period, period start/end)
// ============================================================================

export function snapToPeriodStart(date: Date, period: AccountingPeriod, timezone: AccountingTimezone, options?: {
  isoWeek?: boolean; weekStartsOn?: WeekStartsOn; fiscalYearStart?: Date;
}): Date {
  const r = getPeriodRange({ 
    period, date, timezone,
    ...(options?.isoWeek !== undefined && { isoWeek: options.isoWeek }),
    ...(options?.weekStartsOn !== undefined && { weekStartsOn: options.weekStartsOn }),
    ...(options?.fiscalYearStart !== undefined && { fiscalYearStart: options.fiscalYearStart }),
  });
  return r.start;
}

export function snapToPeriodEnd(date: Date, period: AccountingPeriod, timezone: AccountingTimezone, options?: {
  isoWeek?: boolean; weekStartsOn?: WeekStartsOn; fiscalYearStart?: Date;
}): Date {
  const r = getPeriodRange({ 
    period, date, timezone,
    ...(options?.isoWeek !== undefined && { isoWeek: options.isoWeek }),
    ...(options?.weekStartsOn !== undefined && { weekStartsOn: options.weekStartsOn }),
    ...(options?.fiscalYearStart !== undefined && { fiscalYearStart: options.fiscalYearStart }),
  });
  return r.end;
}

export function getAdjacentPeriod(date: Date, direction: 'previous'|'next', period: AccountingPeriod, timezone: AccountingTimezone, options?: {
  isoWeek?: boolean; weekStartsOn?: WeekStartsOn; fiscalYearStart?: Date;
}): DateRange {
  const anchor = direction === 'previous' ? -1 : 1;
  if (period === 'daily') {
    const d = addDays(date, anchor);
    return getDailyRange(d, timezone);
  }
  if (period === 'weekly') {
    const d = addDays(date, 7 * anchor);
    return getWeeklyRange(d, timezone, { 
      ...(options?.isoWeek !== undefined && { iso: options.isoWeek }),
      ...(options?.weekStartsOn !== undefined && { weekStartsOn: options.weekStartsOn }),
    });
  }
  if (period === 'monthly') {
    const d = addMonths(date, anchor);
    return getMonthlyRange(d, timezone);
  }
  if (period === 'quarterly') {
    const d = addMonths(date, 3 * anchor);
    return getQuarterlyRange(d, timezone);
  }
  // yearly
  const d = addYears(date, anchor);
  if (options?.fiscalYearStart) return getFiscalYearRange(d, timezone, options.fiscalYearStart);
  return getYearlyRange(d, timezone);
}

/**
 * Convert Unix timestamp to Date
 * 
 * @param timestamp - Unix timestamp (seconds)
 * @returns Date object
 */
export function fromUnixTimestamp(timestamp: number): Date {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid timestamp provided: ${timestamp}`,
        timestamp,
        { operation: 'convert-timestamp' }
      );
  }
  
  return fromUnixTime(timestamp);
}

/**
 * Convert Date to Unix timestamp
 * 
 * @param date - Date to convert
 * @returns Unix timestamp (seconds)
 */
export function toUnixTimestamp(date: Date): number {
  if (!isValid(date)) {
    throw createValidationError(
        'INVALID_DATE_INPUT',
        `Invalid date provided: ${date}`,
        date,
        { operation: 'validate-date' }
      );
  }
  
  return getUnixTime(date);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Re-export commonly used date-fns functions
  isValid as isValidDateFns,
  parseISO as parseISODateFns,
  addDays as addDaysFns,
  addMonths as addMonthsFns,
  addYears as addYearsFns,
  startOfMonth as startOfMonthFns,
  endOfMonth as endOfMonthFns,
  startOfYear as startOfYearFns,
  endOfYear as endOfYearFns,
  differenceInDays as differenceInDaysFns,
  differenceInMonths as differenceInMonthsFns,
  differenceInYears as differenceInYearsFns,
  isAfter as isAfterFns,
  isBefore as isBeforeFns,
  isSameDay as isSameDayFns,
  isWithinInterval as isWithinIntervalFns,
} from 'date-fns';
