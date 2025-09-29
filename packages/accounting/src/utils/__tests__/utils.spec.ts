import { describe, it, expect } from 'vitest';
import { AccountType, ACCOUNT_TYPES, isValidAccountType } from '../accounting-utilities';
import { safeGet, safeGetNumber, hasKey, round2HalfUp, round2Bankers, toMinorUnits, fromMinorUnits } from '../safe-object';
import { omitUndefined } from '../omitUndefined';

describe('Phase 2 Currency Integration', () => {
  it('demonstrates Phase 2 utility usage for currency-aware rounding', () => {
    const testValue = 12.3456;
    
    // Test rounding with explicit decimals (legacy behavior)
    expect(round2HalfUp(testValue, 2)).toBe(12.35);
    expect(round2Bankers(testValue, 2)).toBe(12.35);
    
    // Test rounding with Phase 2 currency utility
    expect(round2HalfUp(testValue, undefined, 'MYR')).toBe(12.35); // MYR has 2 decimals
    expect(round2HalfUp(testValue, undefined, 'JPY')).toBe(12); // JPY has 0 decimals
    expect(round2Bankers(testValue, undefined, 'USD')).toBe(12.35); // USD has 2 decimals
    
    // Test minor units conversion with Phase 2 currency utility
    expect(toMinorUnits(12.34, undefined, 'MYR')).toBe(1234); // MYR: 2 decimals
    expect(toMinorUnits(12.34, undefined, 'JPY')).toBe(12); // JPY: 0 decimals
    expect(fromMinorUnits(1234, undefined, 'MYR')).toBe(12.34); // MYR: 2 decimals
    expect(fromMinorUnits(12, undefined, 'JPY')).toBe(12); // JPY: 0 decimals
  });
  
  it('demonstrates Phase 2 utility usage for different currency decimal patterns', () => {
    // Test various currencies with different decimal places
    const testAmount = 123.456;
    
    // 2-decimal currencies
    expect(round2HalfUp(testAmount, undefined, 'USD')).toBe(123.46);
    expect(round2HalfUp(testAmount, undefined, 'EUR')).toBe(123.46);
    expect(round2HalfUp(testAmount, undefined, 'GBP')).toBe(123.46);
    
    // 0-decimal currencies
    expect(round2HalfUp(testAmount, undefined, 'JPY')).toBe(123);
    expect(round2HalfUp(testAmount, undefined, 'KRW')).toBe(123);
    expect(round2HalfUp(testAmount, undefined, 'VND')).toBe(123);
    
    // Test minor units conversion
    expect(toMinorUnits(123.45, undefined, 'USD')).toBe(12345); // 2 decimals
    expect(toMinorUnits(123.45, undefined, 'JPY')).toBe(123); // 0 decimals
    expect(fromMinorUnits(12345, undefined, 'USD')).toBe(123.45); // 2 decimals
    expect(fromMinorUnits(123, undefined, 'JPY')).toBe(123); // 0 decimals
  });
});

describe('AccountType shim', () => {
  it('supports enum-like usage and type safety', () => {
    expect(AccountType.ASSET).toBe('ASSET');
    expect(ACCOUNT_TYPES.includes(AccountType.EXPENSE)).toBe(true);
    expect(isValidAccountType('REVENUE')).toBe(true);
    expect(isValidAccountType('NOT-A-TYPE')).toBe(false);
  });
});

describe('safeGet', () => {
  it('reads known keys with strong typing', () => {
    const obj = { a: 1 as number, b: 'x' as string };
    expect(safeGet(obj, 'a')).toBe(1);
    expect(safeGet(obj, 'b', 'fallback')).toBe('x');
  });
  it('handles dynamic maps safely', () => {
    const rates: Record<string, number> = { USD: 1, EUR: 0.9 };
    expect(safeGetNumber(rates, 'EUR', 0)).toBe(0.9);
    expect(safeGetNumber(rates, 'JPY', 0)).toBe(0);
  });
});

describe('omitUndefined', () => {
  it('drops undefined and narrows types (exactOptionalPropertyTypes safe)', () => {
    const x: { a: string | undefined; b?: number; c: null | number } = { a: undefined, c: null };
    const y = omitUndefined(x);
    // a is removed, b is not present, c remains (null allowed)
    expect(hasKey(y, 'a')).toBe(false);
    expect(y.c).toBeNull();
  });
});
