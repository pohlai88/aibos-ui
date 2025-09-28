// packages/accounting/src/utils/__tests__/omitUndefined.test.ts
/// <reference types="vitest" />

import { describe, it, expect, expectTypeOf } from 'vitest';

// Import from our patched omitUndefined module
import {
  omitUndefined,
  buildConditionalObject,
  safeSpread,
  conditionalProperty
} from '../omitUndefined';

// Minimal stand-ins so we don't pull TypeORM:
type FindManyOptions<T> = {
  where?: Partial<T>;
  order?: Record<string, 'ASC' | 'DESC' | string>;
  take?: number;
  skip?: number;
  relations?: string[];
};

type JournalEntryEntity = {
  id: string;
  tenantId: string;
  postingDate: string;
  createdAt: string;
};

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
type Account = {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentAccountCode?: string;
  tenantId: string;
  balance: number;
  isActive: boolean;
};

describe('omitUndefined (patched: returns T, drops undefined keys at runtime)', () => {
  it('removes undefined keys at runtime but preserves the static type', () => {
    const input = {
      a: 1,
      b: undefined as number | undefined,
      c: 'ok',
    };

    const out = omitUndefined(input);

    // Runtime behavior
    expect(out).toEqual({ a: 1, c: 'ok' });
    expect('b' in out).toBe(false);

    // Type-level behavior: still T (not narrowed mapped type)
    expectTypeOf(out).toEqualTypeOf<{ a: number; b: number | undefined; c: string }>();
  });

  it('is assignable to a consumer type (e.g., FindManyOptions) that expects optional fields', () => {
    const maybeTake = undefined as number | undefined;

    const raw = {
      where: { tenantId: 't1' },
      order: { postingDate: 'DESC', createdAt: 'DESC' },
      take: maybeTake,
      skip: undefined as number | undefined,
      relations: ['lines'],
    };

    // Should compile: omitUndefined returns the same static type as `raw`
    const sanitized = omitUndefined(raw);

    // And should be assignable to a consumer expecting the original type shape
    const opts: FindManyOptions<JournalEntryEntity> = sanitized;

    // Runtime: undefined keys dropped
    expect(opts).toEqual({
      where: { tenantId: 't1' },
      order: { postingDate: 'DESC', createdAt: 'DESC' },
      relations: ['lines'],
    });
  });

  it('is assignable to a domain DTO that intentionally keeps some props optional', () => {
    const dto = {
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'ASSET' as AccountType,
      parentAccountCode: undefined as string | undefined,
      tenantId: 't1',
      balance: 0,
      isActive: true,
    };

    const sanitized = omitUndefined(dto);

    // Type-level: still compatible with Account
    const account: Account = sanitized;

    // Runtime: parentAccountCode removed
    expect(account).toEqual({
      accountCode: '1000',
      accountName: 'Cash',
      accountType: 'ASSET',
      tenantId: 't1',
      balance: 0,
      isActive: true,
    });
  });

  it('handles empty objects correctly', () => {
    const empty = {};
    const result = omitUndefined(empty);
    expect(result).toEqual({});
    expectTypeOf(result).toEqualTypeOf<{}>();
  });

  it('handles objects with no undefined values', () => {
    const noUndefined = { a: 1, b: 'test', c: true };
    const result = omitUndefined(noUndefined);
    expect(result).toEqual(noUndefined);
    expectTypeOf(result).toEqualTypeOf<typeof noUndefined>();
  });

  it('handles objects with all undefined values', () => {
    const allUndefined = { a: undefined, b: undefined, c: undefined };
    const result = omitUndefined(allUndefined);
    expect(result).toEqual({});
    expectTypeOf(result).toEqualTypeOf<typeof allUndefined>();
  });
});

describe('buildConditionalObject (patched: returns Partial<T>, drops nothing at type-level)', () => {
  it('builds object from conditional tuples', () => {
    type Shape = { foo: number; bar: string; baz: boolean };

    const on = true;
    const off = false;

    const partial = buildConditionalObject<Shape>(
      [on, 'foo', 42],
      [off, 'bar', 'nope'],
      [on, 'baz', true],
    );

    expect(partial).toEqual({ foo: 42, baz: true });

    // Type-level: Partial<T>
    expectTypeOf(partial).toMatchTypeOf<Partial<Shape>>();
  });

  it('handles empty tuple array', () => {
    type Shape = { foo: number };
    const result = buildConditionalObject<Shape>();
    expect(result).toEqual({});
    expectTypeOf(result).toMatchTypeOf<Partial<Shape>>();
  });

  it('handles all false conditions', () => {
    type Shape = { foo: number; bar: string };
    const result = buildConditionalObject<Shape>(
      [false, 'foo', 42],
      [false, 'bar', 'test']
    );
    expect(result).toEqual({});
    expectTypeOf(result).toMatchTypeOf<Partial<Shape>>();
  });
});

describe('safeSpread (patched: returns Partial<T> and uses omitUndefined at runtime)', () => {
  it('drops undefined keys in a partial', () => {
    type Shape = { a: number; b?: string; c?: boolean };

    const partial: Partial<Shape> = {
      a: 1,
      b: undefined,
      c: false,
    };

    const out = safeSpread<Shape>(partial);

    // Runtime
    expect(out).toEqual({ a: 1, c: false });

    // Type-level
    expectTypeOf(out).toMatchTypeOf<Partial<Shape>>();
  });

  it('handles empty partial objects', () => {
    type Shape = { a: number };
    const empty: Partial<Shape> = {};
    const result = safeSpread<Shape>(empty);
    expect(result).toEqual({});
    expectTypeOf(result).toMatchTypeOf<Partial<Shape>>();
  });

  it('preserves non-undefined values in partial', () => {
    type Shape = { a: number; b?: string; c?: boolean };
    const partial: Partial<Shape> = {
      a: 1,
      b: 'test',
      c: true,
    };
    const result = safeSpread<Shape>(partial);
    expect(result).toEqual(partial);
    expectTypeOf(result).toMatchTypeOf<Partial<Shape>>();
  });
});

describe('conditionalProperty (type-safe conditional property helper)', () => {
  it('adds a property when condition is true', () => {
    const result = conditionalProperty(true, 'key', 'value');
    expect(result).toEqual({ key: 'value' });
    expectTypeOf(result).toEqualTypeOf<{ key: string }>();
  });

  it('returns empty object when condition is false', () => {
    const result = conditionalProperty(false, 'key', 'value');
    expect(result).toEqual({});
    expectTypeOf(result).toEqualTypeOf<{}>();
  });

  it('handles different value types', () => {
    const stringResult = conditionalProperty(true, 'name', 'John');
    const numberResult = conditionalProperty(true, 'age', 30);
    const booleanResult = conditionalProperty(true, 'active', true);

    expect(stringResult).toEqual({ name: 'John' });
    expect(numberResult).toEqual({ age: 30 });
    expect(booleanResult).toEqual({ active: true });

    expectTypeOf(stringResult).toEqualTypeOf<{ name: string }>();
    expectTypeOf(numberResult).toEqualTypeOf<{ age: number }>();
    expectTypeOf(booleanResult).toEqualTypeOf<{ active: boolean }>();
  });

  it('handles complex object values', () => {
    const complexValue = { nested: { data: 'test' } };
    const result = conditionalProperty(true, 'config', complexValue);
    expect(result).toEqual({ config: complexValue });
    expectTypeOf(result).toEqualTypeOf<{ config: typeof complexValue }>();
  });
});

describe('Integration: Real-world usage patterns', () => {
  it('works with TypeORM-style options', () => {
    const baseOptions = {
      where: { tenantId: 'tenant-123' },
      order: { createdAt: 'DESC' as const },
      take: undefined as number | undefined,
      skip: 0,
      relations: ['account', 'lines'] as string[],
    };

    const sanitized = omitUndefined(baseOptions);
    const typeormOptions: FindManyOptions<JournalEntryEntity> = sanitized;

    expect(typeormOptions).toEqual({
      where: { tenantId: 'tenant-123' },
      order: { createdAt: 'DESC' },
      skip: 0,
      relations: ['account', 'lines'],
    });
  });

  it('works with domain entity creation', () => {
    const accountData = {
      accountCode: '1000',
      accountName: 'Cash Account',
      accountType: 'ASSET' as AccountType,
      parentAccountCode: undefined as string | undefined,
      tenantId: 'tenant-123',
      balance: 1000.50,
      isActive: true,
    };

    const sanitized = omitUndefined(accountData);
    const account: Account = sanitized;

    expect(account).toEqual({
      accountCode: '1000',
      accountName: 'Cash Account',
      accountType: 'ASSET',
      tenantId: 'tenant-123',
      balance: 1000.50,
      isActive: true,
    });
  });

  it('works with conditional object building for API responses', () => {
    type ApiResponse = {
      data: any;
      error?: string;
      warnings?: string[];
      metadata?: Record<string, any>;
    };

    const hasError = false;
    const hasWarnings = true;
    const warnings = ['Deprecated API usage'];

    const response = buildConditionalObject<ApiResponse>(
      [true, 'data', { result: 'success' }],
      [hasError, 'error', 'Something went wrong'],
      [hasWarnings, 'warnings', warnings],
      [false, 'metadata', { version: '1.0' }]
    );

    expect(response).toEqual({
      data: { result: 'success' },
      warnings: ['Deprecated API usage'],
    });

    expectTypeOf(response).toMatchTypeOf<Partial<ApiResponse>>();
  });
});
