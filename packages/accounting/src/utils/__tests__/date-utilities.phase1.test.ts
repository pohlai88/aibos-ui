import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  getFiscalYear,
  getWeekNumber,
  DATE_FORMATS,
  getStartOfQuarter,
  getEndOfQuarter,
} from '../date-utilities';

describe('parse/format', () => {
  it('parses SHORT when hinted', () => {
    const d = parseDate('01/31/2024', 'SHORT');
    expect(formatDate(d, 'ISO')).toBe('2024-01-31');
  });
  
  it('falls back to ISO', () => {
    const d = parseDate('2024-02-29');
    expect(formatDate(d, 'DISPLAY')).toMatch('Feb 29, 2024');
  });
});

describe('fiscal year', () => {
  it('respects fiscal start (Apr 1)', () => {
    const fyStart = new Date('2024-04-01T00:00:00Z');
    expect(getFiscalYear(new Date('2024-03-31T12:00:00Z'), fyStart)).toBe(2023);
    expect(getFiscalYear(new Date('2024-04-01T00:00:01Z'), fyStart)).toBe(2024);
  });
});

describe('weeks & quarters', () => {
  it('uses ISO week numbers', () => {
    expect(getWeekNumber(new Date('2024-01-01'))).toBeGreaterThanOrEqual(1);
  });
  
  it('quarter boundaries sane', () => {
    const midQ2 = new Date('2024-06-15');
    expect(getStartOfQuarter(midQ2).toISOString().slice(0,10)).toBe('2024-04-01');
    expect(getEndOfQuarter(midQ2).toISOString().slice(0,10)).toBe('2024-06-30');
  });
});
