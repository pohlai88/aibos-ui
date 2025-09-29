import { describe, it, expect } from 'vitest';
import {
  roundToCurrency, toMinor, fromMinor,
} from '../accounting-utilities';
import {
  calculateTaxExclusive,
  calcTaxTupleMinorFromNet, calcTaxTupleMinorFromGross,
  allocateTaxAcrossLinesMinor,
} from '../financial-utilities';

describe('SSOT money helpers', () => {
  it('roundToCurrency HALF-UP and stable with EPSILON bump', () => {
    expect(roundToCurrency(0.1 + 0.2, 'MYR')).toBe(0.3);
    expect(roundToCurrency(1.005, 'USD')).toBe(1.01); // HALF-UP
    expect(roundToCurrency(1.0049, 'USD')).toBe(1.0);
  });

  it('toMinor/fromMinor consistent (MYR 2 decimals)', () => {
    const major = 123.45;
    const minor = toMinor(major, 'MYR');
    expect(minor).toBe(12345);
    expect(fromMinor(minor, 'MYR')).toBeCloseTo(123.45, 6);
  });
});

describe('Tax tuples in minor units', () => {
  it('Net → tuple (MYR, 6%)', () => {
    const t = calcTaxTupleMinorFromNet(10000, 0.06, 'MYR'); // 100.00 net
    expect(t.currency).toBe('MYR');
    expect(t.rate).toBe(0.06);
    expect(t.taxMinor).toBe(600);   // 6.00
    expect(t.grossMinor).toBe(10600); // 106.00
  });

  it('Gross → tuple (MYR, 6%)', () => {
    const t = calcTaxTupleMinorFromGross(10600, 0.06, 'MYR'); // 106.00 gross
    expect(t.currency).toBe('MYR');
    expect(t.rate).toBe(0.06);
    expect(t.netMinor).toBe(10000);
    expect(t.taxMinor).toBe(600);
  });

  it('Tax exclusive derivation equals inverse of inclusive', () => {
    const gross = 212.0;
    const net = calculateTaxExclusive(gross, 0.06, 'MYR');
    // Inclusive again
    const t = calcTaxTupleMinorFromNet(toMinor(net, 'MYR'), 0.06, 'MYR');
    expect(fromMinor(t.grossMinor, 'MYR')).toBe(gross);
  });
});

describe('Line-level allocation in minor units', () => {
  it('Pro-rata with largest-remainder: sums to total', () => {
    // 3 lines: 10.00, 10.00, 10.01; rate 6%
    const lines = [1000, 1000, 1001];
    const alloc = allocateTaxAcrossLinesMinor(lines, 0.06, 'MYR');

    // Sum(net) * rate rounded to minor:
    const expectedTotalTaxMinor = toMinor(
      roundToCurrency(fromMinor(lines.reduce((a, v) => a + v, 0), 'MYR') * 0.06, 'MYR'),
      'MYR'
    );

    const sumAlloc = alloc.reduce((a, v) => a + v, 0);
    expect(sumAlloc).toBe(expectedTotalTaxMinor);

    // Allocation should be close to proportional:
    // For a rough check, the largest net should get >= any smaller net.
    expect(alloc[2]!).toBeGreaterThanOrEqual(alloc[0]!);
    expect(alloc[2]!).toBeGreaterThanOrEqual(alloc[1]!);
  });

  it('Zero totals edge case: returns all zeros', () => {
    const alloc = allocateTaxAcrossLinesMinor([0, 0, 0], 0.07, 'MYR');
    expect(alloc).toEqual([0, 0, 0]);
  });
});
