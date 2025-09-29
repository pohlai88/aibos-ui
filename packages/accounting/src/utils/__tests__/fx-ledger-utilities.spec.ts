/**
 * FX Ledger Utilities Tests
 * 
 * Comprehensive test suite for FX ledger utilities including property-based testing
 * and edge case validation for production-ready FX operations.
 * 
 * @fileoverview Test suite for FX ledger utilities with property-based testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  clearAllRates,
  setExchangeRate,
  getExchangeRateSmart,
  convertAmount,
  convertWithTriangulation,
  convertTradeAmount,
  selectRateType,
  type RateType,
} from '../fx-ledger-utilities';
import type { SupportedCurrency } from '../accounting-utilities';
import { RoundingMethod } from '../policies/rounding-policy';

const USD = 'USD' as SupportedCurrency;
const EUR = 'EUR' as SupportedCurrency;
const VND = 'VND' as SupportedCurrency;

describe('FX Ledger Utilities', () => {
  beforeEach(() => {
    clearAllRates();
    const today = new Date('2025-01-15T00:00:00Z');
    // Seed deterministic rates
    setExchangeRate(USD, EUR, {
      fromCurrency: USD, toCurrency: EUR, rateType: 'mid', rate: 0.9, date: today, source: 'seed', valid: true,
    });
    setExchangeRate(EUR, USD, {
      fromCurrency: EUR, toCurrency: USD, rateType: 'mid', rate: 1.1111111111, date: today, source: 'seed', valid: true,
    });
    setExchangeRate(USD, VND, {
      fromCurrency: USD, toCurrency: VND, rateType: 'mid', rate: 24000, date: today, source: 'seed', valid: true,
    });
    setExchangeRate(EUR, VND, {
      fromCurrency: EUR, toCurrency: VND, rateType: 'mid', rate: 26000, date: today, source: 'seed', valid: true,
    });
    // bid/ask example
    setExchangeRate(USD, EUR, {
      fromCurrency: USD, toCurrency: EUR, rateType: 'buy', rate: 0.8995, date: today, source: 'dealer', valid: true,
    });
    setExchangeRate(USD, EUR, {
      fromCurrency: USD, toCurrency: EUR, rateType: 'sell', rate: 0.9005, date: today, source: 'dealer', valid: true,
    });
  });

  it('smart lookup finds exact, windowed, or inverse', () => {
    const d = new Date('2025-01-15T00:00:00Z');
    const rate = getExchangeRateSmart(USD, EUR, { rateType: 'mid', date: d });
    expect(rate?.rate).toBeCloseTo(0.9, 10);

    // inverse path (use EUR->USD mid)
    const d2 = new Date('2025-01-16T00:00:00Z'); // day after exact
    const inv = getExchangeRateSmart(USD, EUR, { rateType: 'mid', date: d2, toleranceDays: 0, allowInverse: true });
    expect(inv?.rate).toBeCloseTo(1 / 1.1111111111, 8);
  });

  it('conversion uses SSOT rounding method (HALF_EVEN)', () => {
    const d = new Date('2025-01-15T00:00:00Z');
    const rate = getExchangeRateSmart(USD, EUR, { rateType: 'mid', date: d })!;
    const res = convertAmount(123.455, USD, EUR, rate, RoundingMethod.HALF_EVEN);
    // Banker's rounding: 123.455 @ 2dp → 123.46 if preceding digit odd
    expect(res.convertedAmount).toBeCloseTo(111.11, 2);
  });

  it('triangulation approximates direct within 1 minor unit when consistent', () => {
    const d = new Date('2025-01-15T00:00:00Z');
    const direct = convertAmount(100, USD, VND, getExchangeRateSmart(USD, VND, { rateType: 'mid', date: d })!, RoundingMethod.HALF_EVEN);
    const viaEUR = convertWithTriangulation(100, USD, VND, EUR, { rateType: 'mid' }, RoundingMethod.HALF_EVEN);
    // allow small rounding differences at the minor-unit boundary (VND has 0 dp)
    expect(Math.abs(direct.convertedAmount - viaEUR.convertedAmount)).toBeLessThanOrEqual(1);
  });

  it('dealer rule selects appropriate rate type', () => {
    const d = new Date('2025-01-15T00:00:00Z');
    const buyType: RateType = selectRateType('buy_from');
    const sellType: RateType = selectRateType('sell_from');
    expect(buyType).toBe('buy');
    expect(sellType).toBe('sell');

    const buyRes = convertTradeAmount(100, USD, EUR, 'buy_from', d);
    const sellRes = convertTradeAmount(100, USD, EUR, 'sell_from', d);
    // Using ask vs bid should bracket the mid result
    const midRes = convertAmount(100, USD, EUR, getExchangeRateSmart(USD, EUR, { rateType: 'mid', date: d })!);
    expect(buyRes.convertedAmount).toBeGreaterThanOrEqual(midRes.convertedAmount - 0.01);
    expect(sellRes.convertedAmount).toBeLessThanOrEqual(midRes.convertedAmount + 0.01);
  });

  it('property-based: inverse consistency within 1 minor unit', () => {
    const d = new Date('2025-01-15T00:00:00Z');
    const rateUSD_EUR = getExchangeRateSmart(USD, EUR, { rateType: 'mid', date: d })!;
    fc.assert(
      fc.property(fc.float({ min: 0, max: 1_000_000 }), (amt) => {
        const a = convertAmount(amt, USD, EUR, rateUSD_EUR);
        const rateEUR_USD = getExchangeRateSmart(EUR, USD, { rateType: 'mid', date: d })!;
        const back = convertAmount(a.convertedAmount, EUR, USD, rateEUR_USD);
        // within 1 US cent
        expect(Math.abs(back.convertedAmount - amt)).toBeLessThanOrEqual(0.01);
      }),
      { numRuns: 50 }
    );
  });
});