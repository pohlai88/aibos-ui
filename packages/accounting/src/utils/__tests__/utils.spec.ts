import { describe, it, expect } from 'vitest';
import { AccountType, ACCOUNT_TYPES, isValidAccountType } from '../accounting-utilities';
import { safeGet, safeGetNumber } from '../safe-object';
import { omitUndefined } from '../omitUndefined';

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
    expect('a' in y).toBe(false);
    expect(y.c).toBeNull();
  });
});
