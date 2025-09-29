import { describe, it, expect } from 'vitest';
import { DEFAULT_CURRENCY, currencyDecimals, isSupportedCurrency } from '../src/utils/policies/currency-policy';
import { RoundingMethod, DEFAULT_ROUNDING_METHOD, roundNumber, normalizeRoundingMethod } from '../src/utils/policies/rounding-policy';
import { isConditionOperator, isLogicalOperator, CONDITION_OPERATORS, LOGICAL_OPERATORS } from '../src/utils/shared-operators';
import { toMinorUnits, fromMinorUnits, roundToCurrency, addAmounts, subtractAmounts } from '../src/utils/money-helpers';

describe('Currency Policy Tests', () => {
  it('has MYR as default currency', () => {
    expect(DEFAULT_CURRENCY).toBe('MYR');
  });

  it('has expected decimal places for currencies', () => {
    expect(currencyDecimals('MYR')).toBe(2);
    expect(currencyDecimals('USD')).toBe(2);
    expect(currencyDecimals('EUR')).toBe(2);
    expect(currencyDecimals('JPY')).toBe(0);
    expect(currencyDecimals('VND')).toBe(0);
    expect(currencyDecimals('KRW')).toBe(0);
  });

  it('validates supported currencies', () => {
    expect(isSupportedCurrency('MYR')).toBe(true);
    expect(isSupportedCurrency('USD')).toBe(true);
    expect(isSupportedCurrency('INVALID')).toBe(false);
  });

  it('defaults to 2 decimals for unknown currencies', () => {
    expect(currencyDecimals('UNKNOWN')).toBe(2);
  });
});

describe('Rounding Policy Tests', () => {
  it('defaults to HALF_EVEN (bankers rounding)', () => {
    expect(DEFAULT_ROUNDING_METHOD).toBe(RoundingMethod.HALF_EVEN);
  });

  it('implements correct bankers rounding', () => {
    // Test ties-to-even behavior
    expect(roundNumber(1.235, 2, RoundingMethod.HALF_EVEN)).toBe(1.24); // 123.5 -> 124 (even)
    expect(roundNumber(1.245, 2, RoundingMethod.HALF_EVEN)).toBe(1.24); // 124.5 -> 124 (even)
    expect(roundNumber(1.255, 2, RoundingMethod.HALF_EVEN)).toBe(1.26); // 125.5 -> 126 (even)
    
    // Test negative numbers
    expect(roundNumber(-1.235, 2, RoundingMethod.HALF_EVEN)).toBe(-1.24);
    expect(roundNumber(-1.245, 2, RoundingMethod.HALF_EVEN)).toBe(-1.24);
  });

  it('handles backward compatibility for string literals', () => {
    expect(normalizeRoundingMethod('round_half_up')).toBe(RoundingMethod.HALF_UP);
    expect(normalizeRoundingMethod('round_half_even')).toBe(RoundingMethod.HALF_EVEN);
    expect(normalizeRoundingMethod('round_up')).toBe(RoundingMethod.CEILING);
    expect(normalizeRoundingMethod('round_down')).toBe(RoundingMethod.FLOOR);
    expect(normalizeRoundingMethod('truncate')).toBe(RoundingMethod.TRUNCATE);
  });

  it('defaults to HALF_EVEN for invalid methods', () => {
    expect(normalizeRoundingMethod('invalid')).toBe(RoundingMethod.HALF_EVEN);
  });

  it('compares rounding methods correctly', () => {
    // HALF_EVEN vs HALF_UP difference
    expect(roundNumber(1.245, 2, RoundingMethod.HALF_EVEN)).toBe(1.24); // Even
    expect(roundNumber(1.245, 2, RoundingMethod.HALF_UP)).toBe(1.25);   // Up
  });
});

describe('Shared Operators Tests', () => {
  it('validates condition operators', () => {
    expect(isConditionOperator('equals')).toBe(true);
    expect(isConditionOperator('not_equals')).toBe(true);
    expect(isConditionOperator('greater_than')).toBe(true);
    expect(isConditionOperator('less_than')).toBe(true);
    expect(isConditionOperator('contains')).toBe(true);
    expect(isConditionOperator('starts_with')).toBe(true);
    expect(isConditionOperator('ends_with')).toBe(true);
    expect(isConditionOperator('between')).toBe(true);
    expect(isConditionOperator('invalid')).toBe(false);
  });

  it('validates logical operators', () => {
    expect(isLogicalOperator('and')).toBe(true);
    expect(isLogicalOperator('or')).toBe(true);
    expect(isLogicalOperator('not')).toBe(true);
    expect(isLogicalOperator('invalid')).toBe(false);
  });

  it('has complete operator arrays', () => {
    expect(CONDITION_OPERATORS).toHaveLength(8);
    expect(LOGICAL_OPERATORS).toHaveLength(3);
  });
});

describe('Money Helpers Tests', () => {
  it('converts major to minor units correctly', () => {
    expect(toMinorUnits(12.34, 'MYR')).toBe(1234);
    expect(toMinorUnits(12.34, 'USD')).toBe(1234);
    expect(toMinorUnits(1000, 'JPY')).toBe(1000); // 0 decimals
    expect(toMinorUnits(1000, 'VND')).toBe(1000); // 0 decimals
  });

  it('converts minor to major units correctly', () => {
    expect(fromMinorUnits(1234, 'MYR')).toBe(12.34);
    expect(fromMinorUnits(1234, 'USD')).toBe(12.34);
    expect(fromMinorUnits(1000, 'JPY')).toBe(1000); // 0 decimals
    expect(fromMinorUnits(1000, 'VND')).toBe(1000); // 0 decimals
  });

  it('rounds currency amounts correctly', () => {
    expect(roundToCurrency(12.345, 'MYR')).toBe(12.34); // HALF_EVEN
    expect(roundToCurrency(12.355, 'MYR')).toBe(12.36); // HALF_EVEN
  });

  it('performs currency arithmetic correctly', () => {
    expect(addAmounts(10.50, 5.25, 'MYR')).toBe(15.75);
    expect(subtractAmounts(10.50, 5.25, 'MYR')).toBe(5.25);
  });

  it('handles zero decimal currencies', () => {
    expect(addAmounts(1000, 500, 'JPY')).toBe(1500);
    expect(subtractAmounts(1000, 500, 'JPY')).toBe(500);
  });
});

describe('Integration Tests', () => {
  it('maintains consistency across all utilities', () => {
    // Test that all utilities use the same defaults
    const amount = 12.345;
    const currency = DEFAULT_CURRENCY;
    
    // Money helpers should use policy defaults
    const rounded = roundToCurrency(amount, currency);
    const minor = toMinorUnits(amount, currency);
    const major = fromMinorUnits(minor, currency);
    
    expect(rounded).toBe(12.34); // HALF_EVEN rounding
    expect(major).toBe(12.34); // Should match rounded amount exactly
    expect(minor).toBe(1234); // Should be consistent
  });

  it('ensures no circular dependencies', () => {
    // This test will pass if imports work correctly
    // Circular dependencies would cause import errors
    expect(DEFAULT_CURRENCY).toBeDefined();
    expect(DEFAULT_ROUNDING_METHOD).toBeDefined();
    expect(CONDITION_OPERATORS).toBeDefined();
    expect(LOGICAL_OPERATORS).toBeDefined();
  });
});

describe('Backward Compatibility Tests', () => {
  it('handles legacy string literals', () => {
    // Test that old string literals still work
    const methods = ['round_half_up', 'round_half_even', 'round_up', 'round_down'];
    
    methods.forEach(method => {
      const normalized = normalizeRoundingMethod(method);
      expect(normalized).toBeDefined();
      expect(typeof normalized).toBe('string');
    });
  });

  it('maintains existing behavior for edge cases', () => {
    // Test edge cases that might break existing functionality
    expect(roundNumber(0.5, 0, RoundingMethod.HALF_EVEN)).toBe(0); // Even
    expect(roundNumber(1.5, 0, RoundingMethod.HALF_EVEN)).toBe(2); // Odd -> Even
    expect(roundNumber(-0.5, 0, RoundingMethod.HALF_EVEN)).toBe(-0); // Even
    expect(roundNumber(-1.5, 0, RoundingMethod.HALF_EVEN)).toBe(-2); // Odd -> Even
  });
});
