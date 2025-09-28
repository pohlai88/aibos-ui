import { describe, it, expect } from 'vitest';

import {
  SUPPORTED_CURRENCIES,
  isValidCurrency,
  normalizeCurrency,
  getCurrencyDecimalsStrict,
  parseAccountingPeriod,
  getPeriodRangeUTC,
  isDateInPeriod,
  isValidAccountCode,
  normalizeAccountCode,
  parseHierarchicalAccountCode,
  formatHierarchicalAccountCode,
  detectAccountCodePattern,
  validateJournalEntryBalance,
  shouldUseBigIntForJournal,
  calculateCompoundInterest,
  calculatePresentValue,
  calculateStraightLineDepreciation,
  calculateDecliningBalanceDepreciation,
  calculateTax,
  calculateTaxInclusive,
  RoundingMethod,
  roundAmount,
  roundCurrency,
} from '../index';

// Small helper for UTC date creation (YYYY, M, D in human terms)
const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 0, 0, 0, 0);

describe('Currency utilities', () => {
  it('validates supported currencies', () => {
    for (const c of SUPPORTED_CURRENCIES) {
      expect(isValidCurrency(c)).toBe(true);
    }
    expect(isValidCurrency('myr')).toBe(false); // lower-case strings aren't valid until normalized
    expect(isValidCurrency('XYZ')).toBe(false);
  });

  it('normalizes and strictly resolves currency decimals', () => {
    expect(normalizeCurrency('  myr ')).toBe('MYR');
    expect(getCurrencyDecimalsStrict('myr')).toBe(2); // normalization inside strict getter
    expect(getCurrencyDecimalsStrict('JPY')).toBe(0);

    // Unsupported throws
    expect(() => getCurrencyDecimalsStrict('ABC')).toThrow();
  });

  it('roundCurrency respects per-currency decimals (HALF_EVEN)', () => {
    expect(roundCurrency(123.456, 'USD')).toBe(123.46);
    expect(roundCurrency(123.456, 'JPY')).toBe(123); // 0-decimal
  });
});

describe('Rounding policies', () => {
  it('HALF_EVEN bankers rounding on boundaries', () => {
    // 1.235 -> 123.5 -> to even => 124 => 1.24
    expect(roundAmount(1.235, 2, RoundingMethod.HALF_EVEN)).toBe(1.24);
    // 1.245 -> 124.5 -> to even => 124 => 1.24
    expect(roundAmount(1.245, 2, RoundingMethod.HALF_EVEN)).toBe(1.24);
    // Negative half-even behavior
    expect(roundAmount(-1.235, 2, RoundingMethod.HALF_EVEN)).toBe(-1.24);
    expect(roundAmount(-1.245, 2, RoundingMethod.HALF_EVEN)).toBe(-1.24);
  });

  it('HALF_DOWN rounds exact .5 toward zero', () => {
    expect(roundAmount(1.235, 2, RoundingMethod.HALF_DOWN)).toBe(1.23);
    expect(roundAmount(-1.235, 2, RoundingMethod.HALF_DOWN)).toBe(-1.23);
  });

  it('CEILING and FLOOR behave as expected', () => {
    expect(roundAmount(1.231, 2, RoundingMethod.CEILING)).toBe(1.24);
    expect(roundAmount(1.239, 2, RoundingMethod.FLOOR)).toBe(1.23);
  });
});

describe('Period parsing & UTC ranges', () => {
  it('parses YYYY-MM, YYYY-QN, and YYYY formats', () => {
    expect(parseAccountingPeriod('2025-09')).toEqual({ year: 2025, month: 9, format: 'YYYY-MM' });
    expect(parseAccountingPeriod('2025-Q3')).toEqual({ year: 2025, quarter: 3, format: 'YYYY-Q3' });
    expect(parseAccountingPeriod('2025')).toEqual({ year: 2025, format: 'YYYY' });
    expect(parseAccountingPeriod('20-05')).toBeNull();
  });

  it('computes UTC start/end (end-exclusive) correctly', () => {
    const m = getPeriodRangeUTC('2025-09')!;
    expect(m.startMs).toBe(utc(2025, 9, 1));
    expect(m.endMs).toBe(utc(2025, 10, 1));

    const q = getPeriodRangeUTC('2025-Q4')!;
    expect(q.startMs).toBe(utc(2025, 10, 1)); // Oct 1
    expect(q.endMs).toBe(utc(2026, 1, 1));    // Jan 1, 2026

    const y = getPeriodRangeUTC('2025')!;
    expect(y.startMs).toBe(utc(2025, 1, 1));
    expect(y.endMs).toBe(utc(2026, 1, 1));
  });

  it('computes UTC ranges for all quarters (end-exclusive)', () => {
    const q1 = getPeriodRangeUTC('2024-Q1')!;
    expect(q1.startMs).toBe(utc(2024, 1, 1));  // Jan 1, 2024
    expect(q1.endMs).toBe(utc(2024, 4, 1));    // Apr 1, 2024

    const q2 = getPeriodRangeUTC('2024-Q2')!;
    expect(q2.startMs).toBe(utc(2024, 4, 1));  // Apr 1, 2024
    expect(q2.endMs).toBe(utc(2024, 7, 1));    // Jul 1, 2024

    const q3 = getPeriodRangeUTC('2024-Q3')!;
    expect(q3.startMs).toBe(utc(2024, 7, 1));  // Jul 1, 2024
    expect(q3.endMs).toBe(utc(2024, 10, 1));   // Oct 1, 2024

    const q4 = getPeriodRangeUTC('2024-Q4')!;
    expect(q4.startMs).toBe(utc(2024, 10, 1)); // Oct 1, 2024
    expect(q4.endMs).toBe(utc(2025, 1, 1));    // Jan 1, 2025
  });

  it('isDateInPeriod treats end as exclusive', () => {
    const period = '2025-09';
    const r = getPeriodRangeUTC(period)!;
    expect(isDateInPeriod(new Date(r.startMs), period)).toBe(true);
    expect(isDateInPeriod(new Date(r.endMs - 1), period)).toBe(true);
    expect(isDateInPeriod(new Date(r.endMs), period)).toBe(false);
  });
});

describe('Account code validation', () => {
  it('respects configured patterns', () => {
    // STANDARD
    expect(isValidAccountCode('ABC123', 'STANDARD')).toBe(true);
    expect(isValidAccountCode('ab-c', 'STANDARD')).toBe(false);

    // NUMERIC
    expect(isValidAccountCode('12345', 'NUMERIC')).toBe(true);
    expect(isValidAccountCode('12A45', 'NUMERIC')).toBe(false);

    // HIERARCHICAL (current regex allows max one dot segment per your implementation)
    expect(isValidAccountCode('1000.10', 'HIERARCHICAL')).toBe(true);
    expect(isValidAccountCode('1000.10.001', 'HIERARCHICAL')).toBe(false); // current pattern rejects multiple dots
  });

  it('normalizes account code (trim + uppercase) but does not remove inner spaces', () => {
    expect(normalizeAccountCode('  abC123  ')).toBe('ABC123');
    // Inner spaces remain — validation should fail for STANDARD
    const withSpace = normalizeAccountCode(' aB 123 ');
    expect(withSpace).toBe('AB 123');
    expect(isValidAccountCode(withSpace, 'STANDARD')).toBe(false);
  });

  it('supports multi-segment hierarchical codes with HIERARCHICAL_MULTI (≥3 segments)', () => {
    // Valid multi-segment (3+ segments required)
    expect(isValidAccountCode('1000.10.001', 'HIERARCHICAL_MULTI')).toBe(true);
    expect(isValidAccountCode('A1.B2.C3.D4', 'HIERARCHICAL_MULTI')).toBe(true);
    expect(isValidAccountCode('1.2.3.4.5.6', 'HIERARCHICAL_MULTI')).toBe(true);

    // Segment too long
    expect(isValidAccountCode('10000.10.001', 'HIERARCHICAL_MULTI')).toBe(false); // 5 chars in first segment

    // Invalid characters
    expect(isValidAccountCode('1000-10-001', 'HIERARCHICAL_MULTI')).toBe(false);

    // Only 2 segments should fail (requires 3+ segments)
    expect(isValidAccountCode('1000.10', 'HIERARCHICAL_MULTI')).toBe(false);
    
    // No dot (single segment) should fail
    expect(isValidAccountCode('1000', 'HIERARCHICAL_MULTI')).toBe(false);
  });

  it('parses hierarchical account codes into segments', () => {
    // HIERARCHICAL pattern (max 2 segments)
    expect(parseHierarchicalAccountCode('1000.10', 'HIERARCHICAL')).toEqual(['1000', '10']);
    expect(parseHierarchicalAccountCode('A1.B2', 'HIERARCHICAL')).toEqual(['A1', 'B2']);
    
    // HIERARCHICAL_MULTI pattern (unlimited segments)
    expect(parseHierarchicalAccountCode('1000.10.001', 'HIERARCHICAL_MULTI')).toEqual(['1000', '10', '001']);
    expect(parseHierarchicalAccountCode('A1.B2.C3.D4', 'HIERARCHICAL_MULTI')).toEqual(['A1', 'B2', 'C3', 'D4']);
    
    // Invalid codes return null
    expect(parseHierarchicalAccountCode('1000.10.001', 'HIERARCHICAL')).toBeNull(); // Too many segments for HIERARCHICAL
    expect(parseHierarchicalAccountCode('1000', 'HIERARCHICAL_MULTI')).toBeNull(); // No dots for HIERARCHICAL_MULTI
    expect(parseHierarchicalAccountCode('invalid', 'HIERARCHICAL')).toBeNull(); // Invalid characters
  });

  it('formats segments into valid hierarchical codes', () => {
    expect(formatHierarchicalAccountCode(['1000', '10'])).toBe('1000.10'); // HIERARCHICAL
    expect(formatHierarchicalAccountCode(['1000','10','001'],'HIERARCHICAL_MULTI')).toBe('1000.10.001');
    expect(() => formatHierarchicalAccountCode(['10000','10'])).toThrow(); // segment too long
    expect(() => formatHierarchicalAccountCode(['1000'] , 'HIERARCHICAL_MULTI')).toThrow(); // needs ≥3 segments
  });

  it('detects account code pattern automatically', () => {
    expect(detectAccountCodePattern('ABC123')).toBe('STANDARD');
    expect(detectAccountCodePattern('12345')).toBe('NUMERIC');
    expect(detectAccountCodePattern('1000.10')).toBe('HIERARCHICAL');
    expect(detectAccountCodePattern('1000.10.001')).toBe('HIERARCHICAL_MULTI');
    expect(detectAccountCodePattern('A1.B2.C3.D4')).toBe('HIERARCHICAL_MULTI');
    
    // Invalid codes return null
    expect(detectAccountCodePattern('invalid-code')).toBeNull();
    expect(detectAccountCodePattern('1000-10-001')).toBeNull();
  });
});

describe('Journal balance validation (minor-unit per line)', () => {
  it('flags too few/many lines & unbalanced totals', () => {
    const oneLine = [{ debitAmount: 100, creditAmount: 0 }];
    const res1 = validateJournalEntryBalance(oneLine, 'USD', 100);
    expect(res1.isValid).toBe(false);
    expect(res1.errors.some(e => e.includes('at least two lines'))).toBe(true);

    const tooMany = Array.from({ length: 101 }, () => ({ debitAmount: 1, creditAmount: 0 }));
    const res2 = validateJournalEntryBalance(tooMany, 'USD', 100);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.some(e => e.includes('cannot have more than 100 lines'))).toBe(true);

    const unbalanced = [
      { debitAmount: 100.01, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 100.00 },
    ];
    const res3 = validateJournalEntryBalance(unbalanced, 'USD');
    expect(res3.isValid).toBe(false);
    expect(res3.errors.some(e => e.includes('not balanced'))).toBe(true);
  });

  it('balances when per-line rounding is applied (USD, 2dp)', () => {
    // Two lines of 0.005 debit each -> each rounds to 0.01 in minor units, total 0.02
    // Two credit lines of 0.01 each -> total 0.02
    const balanced = [
      { debitAmount: 0.005, creditAmount: 0 },
      { debitAmount: 0.005, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 0.01 },
      { debitAmount: 0, creditAmount: 0.01 },
    ];
    const res = validateJournalEntryBalance(balanced, 'USD');
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('handles zero-decimal currencies (JPY)', () => {
    // JPY: 0 decimals; 0.4 rounds to 0, 0.6 to 1 (at line level)
    const jp = [
      { debitAmount: 0.6, creditAmount: 0 }, // -> 1
      { debitAmount: 0, creditAmount: 1.0 }, // -> 1
    ];
    const res = validateJournalEntryBalance(jp, 'JPY');
    expect(res.isValid).toBe(true);
  });

  it('supports BigInt summation strategy (opt-in) with identical results', () => {
    // Construct many tiny amounts that can accumulate rounding noise in floats
    const entries = [
      // Debits: two lines of 0.005 each -> each to 0.01 => total 0.02
      { debitAmount: 0.005, creditAmount: 0 },
      { debitAmount: 0.005, creditAmount: 0 },
      // Credits: two lines of 0.01 each => total 0.02
      { debitAmount: 0, creditAmount: 0.01 },
      { debitAmount: 0, creditAmount: 0.01 },
    ];

    const normal = validateJournalEntryBalance(entries, 'USD');
    const bigint = validateJournalEntryBalance(entries, 'USD', 100, { strategy: 'bigint' });

    expect(normal.isValid).toBe(true);
    expect(bigint.isValid).toBe(true);
    expect(normal.errors).toHaveLength(0);
    expect(bigint.errors).toHaveLength(0);
  });

  it('BigInt strategy provides identical error messages for unbalanced entries', () => {
    const unbalanced = [
      { debitAmount: 100.01, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 100.00 },
    ];

    const normal = validateJournalEntryBalance(unbalanced, 'USD');
    const bigint = validateJournalEntryBalance(unbalanced, 'USD', 100, { strategy: 'bigint' });

    expect(normal.isValid).toBe(false);
    expect(bigint.isValid).toBe(false);
    expect(normal.errors).toHaveLength(1);
    expect(bigint.errors).toHaveLength(1);
    expect(normal.errors[0]).toContain('not balanced');
    expect(bigint.errors[0]).toContain('not balanced');
  });

  it('auto strategy switches to BigInt when entries exceed threshold', () => {
    // Keep it tiny for test perf: use a low threshold
    const entries = [
      { debitAmount: 0.005, creditAmount: 0 },
      { debitAmount: 0.005, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 0.01 },
      { debitAmount: 0, creditAmount: 0.01 },
    ];
    const res = validateJournalEntryBalance(entries, 'MYR', 100, { strategy: 'auto', autoThreshold: 4 });
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('auto strategy uses number summation when entries below threshold', () => {
    const entries = [
      { debitAmount: 0.01, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 0.01 },
    ];
    const res = validateJournalEntryBalance(entries, 'MYR', 100, { strategy: 'auto', autoThreshold: 10 });
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('shouldUseBigIntForJournal respects default and custom thresholds', () => {
    // Default threshold = 50_000
    expect(shouldUseBigIntForJournal(49_999)).toBe(false);
    expect(shouldUseBigIntForJournal(50_000)).toBe(true);
    expect(shouldUseBigIntForJournal(50_001)).toBe(true);

    // Custom threshold
    expect(shouldUseBigIntForJournal(2, 3)).toBe(false);
    expect(shouldUseBigIntForJournal(3, 3)).toBe(true);
  });

  it('reports line-level business rule issues', () => {
    const bad = [
      { debitAmount: -1, creditAmount: 0 },
      { debitAmount: 0, creditAmount: -2 },
      { debitAmount: 1, creditAmount: 1 },
      { debitAmount: 0, creditAmount: 0 },
      { debitAmount: 1_000_001, creditAmount: 0 },
    ];
    const res = validateJournalEntryBalance(bad, 'USD');
    expect(res.isValid).toBe(false);
    expect(res.errors.filter(e => e.includes('cannot be negative')).length).toBe(2);
    expect(res.errors.some(e => e.includes('Cannot have both debit and credit'))).toBe(true);
    expect(res.errors.some(e => e.includes('Must have either debit or credit'))).toBe(true);
    expect(res.warnings.some(w => w.includes('exceeds 1,000,000'))).toBe(true);
  });
});

describe('Tax utilities', () => {
  it('calculates tax and inclusive totals with strict currency rounding', () => {
    const t = calculateTax(100, 0.06, 'MYR');
    expect(t.taxAmount).toBe(6.00);
    expect(t.currency).toBe('MYR');

    expect(calculateTaxInclusive(100, 0.06, 'MYR')).toBe(106.00);

    // JPY (0 decimals): 6% on 101 => 6.06 -> rounds to 6
    const tJpy = calculateTax(101, 0.06, 'JPY');
    expect(tJpy.taxAmount).toBe(6);
  });

  it('rejects invalid inputs', () => {
    expect(() => calculateTax(-1, 0.06, 'MYR')).toThrow();
    expect(() => calculateTax(100, -0.1, 'MYR')).toThrow();
    expect(() => calculateTax(100, 1.1, 'MYR')).toThrow();
  });
});

describe('Financial calculations', () => {
  it('calculates compound interest', () => {
    // principal=1000, 10% annually, 2 years, annual compounding => 1000*(1.1)^2 = 1210
    const fv = calculateCompoundInterest(1000, 0.1, 2, 1);
    expect(fv).toBeCloseTo(1210, 1);
  });

  it('calculates present value', () => {
    // FV=1210, r=10%, n=2 => PV = 1000
    const pv = calculatePresentValue(1210, 0.1, 2);
    expect(pv).toBeCloseTo(1000, 6);
  });

  it('calculates depreciation (straight-line & declining balance)', () => {
    expect(calculateStraightLineDepreciation(10_000, 1_000, 9)).toBeCloseTo(1000, 6);

    // Declining balance: cost=10_000, rate=20%, accum=0 => 2,000 first year
    expect(calculateDecliningBalanceDepreciation(10_000, 0.2, 0)).toBe(2000);

    // Next year: bookValue=8,000; 20% => 1,600
    expect(calculateDecliningBalanceDepreciation(10_000, 0.2, 2000)).toBe(1600);
  });

  it('guards invalid inputs', () => {
    expect(() => calculateCompoundInterest(-1, 0.1, 1, 1)).toThrow();
    expect(() => calculatePresentValue(-1, 0.1, 1)).toThrow();
    expect(() => calculateStraightLineDepreciation(0, 0, 1)).toThrow();
    expect(() => calculateDecliningBalanceDepreciation(100, 1.5, 0)).toThrow();
  });
});

describe('Edge cases and boundary conditions', () => {
  it('handles zero amounts correctly', () => {
    const zeroEntries = [
      { debitAmount: 0, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 0 },
    ];
    const res = validateJournalEntryBalance(zeroEntries, 'USD');
    expect(res.isValid).toBe(false); // Should fail because both amounts are zero
  });

  it('handles very small amounts with precision', () => {
    const smallEntries = [
      { debitAmount: 0.001, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 0.001 },
    ];
    const res = validateJournalEntryBalance(smallEntries, 'USD');
    expect(res.isValid).toBe(true); // Should balance after rounding
  });

  it('handles large amounts correctly', () => {
    const largeEntries = [
      { debitAmount: 999999.99, creditAmount: 0 },
      { debitAmount: 0, creditAmount: 999999.99 },
    ];
    const res = validateJournalEntryBalance(largeEntries, 'USD');
    expect(res.isValid).toBe(true);
    expect(res.warnings.some(w => w.includes('exceeds 1,000,000'))).toBe(false);
  });

  it('handles invalid period formats', () => {
    expect(parseAccountingPeriod('invalid')).toBeNull();
    expect(parseAccountingPeriod('2025-13')).toBeNull(); // Invalid month
    expect(parseAccountingPeriod('2025-Q5')).toBeNull(); // Invalid quarter
    expect(parseAccountingPeriod('1800')).toBeNull(); // Year too early
    expect(parseAccountingPeriod('2200')).toBeNull(); // Year too late
  });

  it('handles edge case rounding scenarios', () => {
    // Test exact .5 cases
    expect(roundAmount(0.5, 0, RoundingMethod.HALF_EVEN)).toBe(0); // Even
    expect(roundAmount(1.5, 0, RoundingMethod.HALF_EVEN)).toBe(2); // Odd -> Even
    expect(roundAmount(-0.5, 0, RoundingMethod.HALF_EVEN)).toBe(-0); // Even (negative zero is correct)
    expect(roundAmount(-1.5, 0, RoundingMethod.HALF_EVEN)).toBe(-2); // Odd -> Even
  });

  it('rounds negative numbers correctly with HALF_EVEN and HALF_DOWN', () => {
    // HALF_EVEN: -1.5 should round to -2 (even)
    expect(roundAmount(-1.5, 0, RoundingMethod.HALF_EVEN)).toBe(-2);
    expect(roundAmount(-2.5, 0, RoundingMethod.HALF_EVEN)).toBe(-2); // even
    
    // HALF_DOWN: -1.5 should round toward zero (to -1)
    expect(roundAmount(-1.5, 0, RoundingMethod.HALF_DOWN)).toBe(-1);
    expect(roundAmount(-2.5, 0, RoundingMethod.HALF_DOWN)).toBe(-2);
  });

  it('constrains decimals parameter correctly in roundAmount', () => {
    // Invalid decimals should be constrained
    expect(roundAmount(1.234, -1)).toBe(1); // constrained to 0
    expect(roundAmount(1.234, 10)).toBe(1.234); // constrained to 8
    expect(roundAmount(1.234, 1.5)).toBe(1.23); // non-integer -> default 2
  });
});

describe('Currency-specific behaviors', () => {
  it('handles zero-decimal currencies correctly', () => {
    expect(roundCurrency(123.4, 'JPY')).toBe(123);
    expect(roundCurrency(123.6, 'JPY')).toBe(124);
    expect(roundCurrency(123.5, 'JPY')).toBe(124); // Half-even rounds to even
  });

  it('handles two-decimal currencies correctly', () => {
    expect(roundCurrency(123.456, 'USD')).toBe(123.46);
    expect(roundCurrency(123.454, 'USD')).toBe(123.45);
    expect(roundCurrency(123.455, 'USD')).toBe(123.46); // Half-even rounds to even
  });

  it('validates all supported currencies have proper decimal mapping', () => {
    for (const currency of SUPPORTED_CURRENCIES) {
      const decimals = getCurrencyDecimalsStrict(currency);
      expect(typeof decimals).toBe('number');
      expect(decimals).toBeGreaterThanOrEqual(0);
      expect(decimals).toBeLessThanOrEqual(2);
    }
  });
});
