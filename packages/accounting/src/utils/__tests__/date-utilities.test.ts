import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Core utilities
  formatDate,
  parseDate,
  isValidDate,
  normalizeDate,
  
  // Date arithmetic
  addDaysToDate,
  addMonthsToDate,
  addYearsToDate,
  subtractDaysFromDate,
  subtractMonthsFromDate,
  subtractYearsFromDate,
  
  // Period utilities
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  getStartOfQuarter,
  getEndOfQuarter,
  
  // Date comparison
  isDateInRange,
  isDateAfter,
  isDateBefore,
  isSameDate,
  isSameMonth,
  isSameYear,
  
  // Date differences
  getDaysBetween,
  getMonthsBetween,
  getYearsBetween,
  
  // Timezone utilities
  toUTC,
  fromUTC,
  toTimezone,
  fromTimezone,
  
  // Accounting-specific
  getFiscalYear,
  getQuarter,
  getWeekNumber,
  getDayOfYear,
  
  // Utility functions
  createDateRange,
  getCurrentDate,
  getCurrentDateNormalized,
  fromUnixTimestamp,
  toUnixTimestamp,
  
  // Constants
  DATE_FORMATS,
  ACCOUNTING_TIMEZONES,
} from '../date-utilities';

describe('Date Utilities - Core Functions', () => {
  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T14:30:00'); // Local time instead of UTC
    
    it('formats date in ISO format by default', () => {
      expect(formatDate(testDate)).toBe('2024-01-15');
    });
    
    it('formats date in different formats', () => {
      expect(formatDate(testDate, 'DISPLAY')).toBe('Jan 15, 2024');
      expect(formatDate(testDate, 'SHORT')).toBe('01/15/2024');
      expect(formatDate(testDate, 'LONG')).toBe('January 15, 2024');
      expect(formatDate(testDate, 'DATETIME')).toBe('2024-01-15 14:30:00');
      expect(formatDate(testDate, 'TIME')).toBe('14:30:00');
    });
    
    it('throws error for invalid date', () => {
      expect(() => formatDate(new Date('invalid'))).toThrow('Invalid date provided');
    });
  });
  
  describe('parseDate', () => {
    it('parses ISO date strings', () => {
      const parsed = parseDate('2024-01-15');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(0); // January is 0
      expect(parsed.getDate()).toBe(15);
    });
    
    it('parses ISO datetime strings', () => {
      const parsed = parseDate('2024-01-15T14:30:00Z');
      expect(parsed).toBeInstanceOf(Date);
    });
    
    it('throws error for invalid date strings', () => {
      expect(() => parseDate('invalid-date')).toThrow('Unable to parse date string');
      expect(() => parseDate('')).toThrow('Invalid date string provided');
    });
  });
  
  describe('isValidDate', () => {
    it('returns true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
    });
    
    it('returns false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('2024-01-15')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
    });
  });
  
  describe('normalizeDate', () => {
    it('removes time component from date', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const normalized = normalizeDate(date);
      
      expect(normalized.getHours()).toBe(0);
      expect(normalized.getMinutes()).toBe(0);
      expect(normalized.getSeconds()).toBe(0);
      expect(normalized.getMilliseconds()).toBe(0);
    });
    
    it('throws error for invalid date', () => {
      expect(() => normalizeDate(new Date('invalid'))).toThrow('Invalid date provided');
    });
  });
});

describe('Date Utilities - Arithmetic', () => {
  const baseDate = new Date('2024-01-15');
  
  describe('addDaysToDate', () => {
    it('adds positive days', () => {
      const result = addDaysToDate(baseDate, 7);
      expect(result.getDate()).toBe(22);
    });
    
    it('adds negative days', () => {
      const result = addDaysToDate(baseDate, -7);
      expect(result.getDate()).toBe(8);
    });
    
    it('handles month boundaries', () => {
      const result = addDaysToDate(baseDate, 20);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
    
    it('throws error for invalid inputs', () => {
      expect(() => addDaysToDate(new Date('invalid'), 7)).toThrow('Invalid date provided');
      expect(() => addDaysToDate(baseDate, NaN)).toThrow('Invalid days value provided');
    });
  });
  
  describe('addMonthsToDate', () => {
    it('adds positive months', () => {
      const result = addMonthsToDate(baseDate, 3);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
    });
    
    it('handles month-end edge cases', () => {
      const jan31 = new Date('2024-01-31');
      const result = addMonthsToDate(jan31, 1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29); // Leap year
    });
    
    it('throws error for invalid inputs', () => {
      expect(() => addMonthsToDate(new Date('invalid'), 3)).toThrow('Invalid date provided');
      expect(() => addMonthsToDate(baseDate, Infinity)).toThrow('Invalid months value provided');
    });
  });
  
  describe('addYearsToDate', () => {
    it('adds positive years', () => {
      const result = addYearsToDate(baseDate, 1);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });
    
    it('handles leap year edge cases', () => {
      const feb29 = new Date('2024-02-29');
      const result = addYearsToDate(feb29, 1);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(28); // Non-leap year
    });
    
    it('throws error for invalid inputs', () => {
      expect(() => addYearsToDate(new Date('invalid'), 1)).toThrow('Invalid date provided');
      expect(() => addYearsToDate(baseDate, -Infinity)).toThrow('Invalid years value provided');
    });
  });
});

describe('Date Utilities - Period Functions', () => {
  const testDate = new Date('2024-06-15T14:30:00Z');
  
  describe('getStartOfMonth', () => {
    it('returns first day of month at midnight', () => {
      const result = getStartOfMonth(testDate);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });
  
  describe('getEndOfMonth', () => {
    it('returns last day of month at end of day', () => {
      const result = getEndOfMonth(testDate);
      expect(result.getDate()).toBe(30); // June has 30 days
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });
  });
  
  describe('getStartOfYear', () => {
    it('returns January 1st at midnight', () => {
      const result = getStartOfYear(testDate);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });
  });
  
  describe('getEndOfYear', () => {
    it('returns December 31st at end of day', () => {
      const result = getEndOfYear(testDate);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
    });
  });
  
  describe('getStartOfQuarter', () => {
    it('returns start of quarter for Q2', () => {
      const result = getStartOfQuarter(testDate);
      expect(result.getMonth()).toBe(3); // April (Q2 start)
      expect(result.getDate()).toBe(1);
    });
    
    it('returns start of quarter for Q1', () => {
      const q1Date = new Date('2024-02-15');
      const result = getStartOfQuarter(q1Date);
      expect(result.getMonth()).toBe(0); // January (Q1 start)
      expect(result.getDate()).toBe(1);
    });
  });
  
  describe('getEndOfQuarter', () => {
    it('returns end of quarter for Q2', () => {
      const result = getEndOfQuarter(testDate);
      expect(result.getMonth()).toBe(5); // June (Q2 end)
      expect(result.getDate()).toBe(30);
    });
  });
});

describe('Date Utilities - Comparison Functions', () => {
  const baseDate = new Date('2024-01-15');
  const earlierDate = new Date('2024-01-10');
  const laterDate = new Date('2024-01-20');
  
  describe('isDateInRange', () => {
    it('returns true for date within range', () => {
      expect(isDateInRange(baseDate, earlierDate, laterDate)).toBe(true);
    });
    
    it('returns true for date at range boundaries', () => {
      expect(isDateInRange(earlierDate, earlierDate, laterDate)).toBe(true);
      expect(isDateInRange(laterDate, earlierDate, laterDate)).toBe(true);
    });
    
    it('returns false for date outside range', () => {
      const outsideDate = new Date('2024-01-25');
      expect(isDateInRange(outsideDate, earlierDate, laterDate)).toBe(false);
    });
    
    it('throws error for invalid dates', () => {
      expect(() => isDateInRange(new Date('invalid'), earlierDate, laterDate))
        .toThrow('Invalid date provided');
    });
  });
  
  describe('isDateAfter', () => {
    it('returns true when date is after compare date', () => {
      expect(isDateAfter(laterDate, baseDate)).toBe(true);
    });
    
    it('returns false when date is before compare date', () => {
      expect(isDateAfter(earlierDate, baseDate)).toBe(false);
    });
    
    it('returns false when dates are equal', () => {
      expect(isDateAfter(baseDate, baseDate)).toBe(false);
    });
  });
  
  describe('isDateBefore', () => {
    it('returns true when date is before compare date', () => {
      expect(isDateBefore(earlierDate, baseDate)).toBe(true);
    });
    
    it('returns false when date is after compare date', () => {
      expect(isDateBefore(laterDate, baseDate)).toBe(false);
    });
  });
  
  describe('isSameDate', () => {
    it('returns true for same day', () => {
      const sameDay = new Date('2024-01-15T14:30:00Z');
      expect(isSameDate(baseDate, sameDay)).toBe(true);
    });
    
    it('returns false for different days', () => {
      expect(isSameDate(baseDate, laterDate)).toBe(false);
    });
  });
});

describe('Date Utilities - Difference Functions', () => {
  describe('getDaysBetween', () => {
    it('calculates days between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');
      expect(getDaysBetween(start, end)).toBe(14);
    });
    
    it('handles negative differences', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-01');
      expect(getDaysBetween(start, end)).toBe(-14);
    });
  });
  
  describe('getMonthsBetween', () => {
    it('calculates months between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-06-01');
      expect(getMonthsBetween(start, end)).toBe(5);
    });
  });
  
  describe('getYearsBetween', () => {
    it('calculates years between dates', () => {
      const start = new Date('2020-01-01');
      const end = new Date('2024-01-01');
      expect(getYearsBetween(start, end)).toBe(4);
    });
  });
});

describe('Date Utilities - Accounting Functions', () => {
  describe('getFiscalYear', () => {
    it('returns calendar year by default', () => {
      const date = new Date('2024-06-15');
      expect(getFiscalYear(date)).toBe(2024);
    });
    
    it('handles fiscal year starting in April', () => {
      const date = new Date('2024-06-15');
      const fiscalStart = new Date('2024-04-01');
      expect(getFiscalYear(date, fiscalStart)).toBe(2024);
    });
    
    it('handles fiscal year boundary correctly', () => {
      const date = new Date('2024-03-15');
      const fiscalStart = new Date('2024-04-01');
      expect(getFiscalYear(date, fiscalStart)).toBe(2023);
    });
  });
  
  describe('getQuarter', () => {
    it('returns correct quarter for each month', () => {
      expect(getQuarter(new Date('2024-01-15'))).toBe(1);
      expect(getQuarter(new Date('2024-04-15'))).toBe(2);
      expect(getQuarter(new Date('2024-07-15'))).toBe(3);
      expect(getQuarter(new Date('2024-10-15'))).toBe(4);
    });
  });
  
  describe('getWeekNumber', () => {
    it('returns week number for date', () => {
      const date = new Date('2024-01-15');
      const weekNumber = getWeekNumber(date);
      expect(weekNumber).toBeGreaterThan(0);
      expect(weekNumber).toBeLessThanOrEqual(53);
    });
  });
  
  describe('getDayOfYear', () => {
    it('returns day of year', () => {
      expect(getDayOfYear(new Date('2024-01-01'))).toBe(1);
      expect(getDayOfYear(new Date('2024-01-15'))).toBe(15);
      expect(getDayOfYear(new Date('2024-12-31'))).toBe(366); // Leap year
    });
  });
});

describe('Date Utilities - Utility Functions', () => {
  describe('createDateRange', () => {
    it('creates valid date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const range = createDateRange(start, end);
      
      expect(range.start).toEqual(start);
      expect(range.end).toEqual(end);
    });
    
    it('throws error when start is after end', () => {
      const start = new Date('2024-01-31');
      const end = new Date('2024-01-01');
      expect(() => createDateRange(start, end)).toThrow('Start date must be before or equal to end date');
    });
  });
  
  describe('fromUnixTimestamp', () => {
    it('converts Unix timestamp to Date', () => {
      const timestamp = 1705334400; // 2024-01-15T00:00:00Z
      const date = fromUnixTimestamp(timestamp);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });
    
    it('throws error for invalid timestamp', () => {
      expect(() => fromUnixTimestamp(NaN)).toThrow('Invalid timestamp provided');
    });
  });
  
  describe('toUnixTimestamp', () => {
    it('converts Date to Unix timestamp', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const timestamp = toUnixTimestamp(date);
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });
  });
});

describe('Date Utilities - Constants', () => {
  describe('DATE_FORMATS', () => {
    it('contains expected format keys', () => {
      expect(DATE_FORMATS.ISO).toBe('yyyy-MM-dd');
      expect(DATE_FORMATS.DISPLAY).toBe('MMM dd, yyyy');
      expect(DATE_FORMATS.SHORT).toBe('MM/dd/yyyy');
      expect(DATE_FORMATS.LONG).toBe('MMMM dd, yyyy');
      expect(DATE_FORMATS.DATETIME).toBe('yyyy-MM-dd HH:mm:ss');
    });
  });
  
  describe('ACCOUNTING_TIMEZONES', () => {
    it('contains expected timezone keys', () => {
      expect(ACCOUNTING_TIMEZONES.UTC).toBe('UTC');
      expect(ACCOUNTING_TIMEZONES.MALAYSIA).toBe('Asia/Kuala_Lumpur');
      expect(ACCOUNTING_TIMEZONES.SINGAPORE).toBe('Asia/Singapore');
      expect(ACCOUNTING_TIMEZONES.UNITED_STATES_EAST).toBe('America/New_York');
    });
  });
});
