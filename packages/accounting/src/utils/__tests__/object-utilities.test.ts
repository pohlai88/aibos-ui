import { describe, it, expect } from 'vitest';
import {
  // Cloning utilities
  deepClone,
  shallowClone,
  
  // Merging utilities
  deepMerge,
  shallowMerge,
  mergeMultiple,
  
  // Pick & omit utilities
  pick,
  omit,
  pickBy,
  omitBy,
  
  // Transformation utilities
  mapKeys,
  mapValues,
  mapEntries,
  invert,
  
  // Validation utilities
  isObjectEmpty,
  hasProperties,
  isEqual,
  hasPath,
  
  // Path utilities
  getPath,
  setPath,
  unsetPath,
  
  // Accounting-specific utilities
  createSafeObject,
  sanitizeObject,
  normalizeKeys,
  denormalizeKeys,
  validateObjectSchema,
  mergeAccountingObject,
  
  // Advanced merging
  mergeWith,
  
  // Path utilities with updater
  setPathWith,
  
  // Schema validation
  validateWithSchema,
  
  // Zod adapter
  toZod,
  fromZod,
  validateWithZod,
  
  // Utility functions
  getObjectSize,
  fromPairs,
  toPairs,
  fromKeys,
} from '../object-utilities';
import { validateEmail } from '../validation-utilities';

// Test data
interface User {
  id: number;
  name: string;
  email: string;
  address?: {
    street: string;
    city: string;
    country: string;
  };
  preferences: {
    theme: string;
    notifications: boolean;
  };
  tags: string[];
}

const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA'
  },
  preferences: {
    theme: 'dark',
    notifications: true
  },
  tags: ['premium', 'verified']
};

describe('Object Utilities', () => {
  describe('Phase 2 Email Validation Integration', () => {
    it('demonstrates Phase 2 utility usage for email validation', () => {
      // Test valid emails using Phase 2 utility
      expect(validateEmail('john@example.com').isValid).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk').isValid).toBe(true);
      expect(validateEmail('test123@subdomain.example.org').isValid).toBe(true);
      
      // Test invalid emails using Phase 2 utility
      expect(validateEmail('invalid-email').isValid).toBe(false);
      expect(validateEmail('@domain.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('').isValid).toBe(false);
      
      // Test strict validation
      const strictResult = validateEmail('user@domain.com', { strict: true });
      expect(strictResult.isValid).toBe(true);
    });
  });

  describe('Cloning Utilities', () => {
    it('deep clones objects', () => {
      const cloned = deepClone(mockUser);
      expect(cloned).toEqual(mockUser);
      expect(cloned).not.toBe(mockUser);
      expect(cloned.address).not.toBe(mockUser.address);
      expect(cloned.preferences).not.toBe(mockUser.preferences);
    });

    it('deep clones arrays', () => {
      const original = { items: [1, 2, { nested: 3 }] };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned.items).not.toBe(original.items);
      expect(cloned.items[2]).not.toBe(original.items[2]);
    });

    it('deep clones dates', () => {
      const original = { date: new Date('2024-01-01') };
      const cloned = deepClone(original);
      expect(cloned.date).toEqual(original.date);
      expect(cloned.date).not.toBe(original.date);
    });

    it('deep clones maps and sets', () => {
      const original = {
        map: new Map([['a', 1], ['b', 2]]),
        set: new Set([1, 2, 3])
      };
      const cloned = deepClone(original);
      expect(cloned.map).toEqual(original.map);
      expect(cloned.set).toEqual(original.set);
      expect(cloned.map).not.toBe(original.map);
      expect(cloned.set).not.toBe(original.set);
    });

    it('shallow clones objects', () => {
      const cloned = shallowClone(mockUser);
      expect(cloned).toEqual(mockUser);
      expect(cloned).not.toBe(mockUser);
      expect(cloned.address).toBe(mockUser.address); // Same reference
    });

    it('handles null and undefined', () => {
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
      expect(shallowClone(null)).toBe(null);
      expect(shallowClone(undefined)).toBe(undefined);
    });

    it('handles primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
    });
  });

  describe('Merging Utilities', () => {
    it('deep merges objects', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source = { b: { c: 4 }, e: 5 } as any;
      const result = deepMerge(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: { c: 4, d: 3 },
        e: 5
      });
    });

    it('shallow merges objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 } as any;
      const result = shallowMerge(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: { d: 3 },
        e: 4
      });
    });

    it('merges multiple objects', () => {
      const objects = [
        { a: 1, b: 2 },
        { b: 3, c: 4 },
        { c: 5, d: 6 }
      ] as any[];
      const result = mergeMultiple(objects);
      
      expect(result).toEqual({
        a: 1,
        b: 3,
        c: 5,
        d: 6
      });
    });

    it('handles array merging strategies', () => {
      const target = { items: [1, 2] };
      const source = { items: [3, 4] };
      
      const replace = deepMerge(target, source, { arrayStrategy: 'replace' });
      expect(replace.items).toEqual([3, 4]);
      
      const concat = deepMerge(target, source, { arrayStrategy: 'concat' });
      expect(concat.items).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Pick & Omit Utilities', () => {
    it('picks specific properties', () => {
      const result = pick(mockUser, ['name', 'email']);
      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('omits specific properties', () => {
      const result = omit(mockUser, ['id', 'address']);
      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        preferences: mockUser.preferences,
        tags: mockUser.tags
      });
    });

    it('picks properties by predicate', () => {
      const result = pickBy(mockUser, (value, _key) => typeof value === 'string');
      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('omits properties by predicate', () => {
      const result = omitBy(mockUser, (value, _key) => typeof value === 'object' && !Array.isArray(value));
      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        tags: mockUser.tags
      });
    });
  });

  describe('Transformation Utilities', () => {
    it('transforms object keys', () => {
      const result = mapKeys(mockUser, key => key.toUpperCase());
      expect(result).toEqual({
        ID: 1,
        NAME: 'John Doe',
        EMAIL: 'john@example.com',
        ADDRESS: mockUser.address,
        PREFERENCES: mockUser.preferences,
        TAGS: mockUser.tags
      });
    });

    it('transforms object values', () => {
      const result = mapValues(mockUser, value => String(value));
      expect(result.name).toBe('John Doe');
      expect(result.id).toBe('1');
    });

    it('transforms both keys and values', () => {
      const result = mapEntries(mockUser, ([key, value]) => [
        key.toUpperCase(),
        typeof value === 'string' ? value.toUpperCase() : value
      ]);
      expect(result.NAME).toBe('JOHN DOE');
      expect(result.EMAIL).toBe('JOHN@EXAMPLE.COM');
    });

    it('inverts object', () => {
      const obj = { a: '1', b: '2', c: '3' };
      const result = invert(obj);
      expect(result).toEqual({ '1': 'a', '2': 'b', '3': 'c' });
    });
  });

  describe('Validation Utilities', () => {
    it('checks if object is empty', () => {
      expect(isObjectEmpty({})).toBe(true);
      expect(isObjectEmpty({ a: 1 })).toBe(false);
      expect(isObjectEmpty([])).toBe(true);
      expect(isObjectEmpty([1, 2])).toBe(false);
      expect(isObjectEmpty(null)).toBe(true);
      expect(isObjectEmpty(undefined)).toBe(true);
    });

    it('checks if object has properties', () => {
      expect(hasProperties({})).toBe(false);
      expect(hasProperties({ a: 1 })).toBe(true);
      expect(hasProperties([])).toBe(false);
      expect(hasProperties([1, 2])).toBe(true);
    });

    it('compares objects for deep equality', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };
      
      expect(isEqual(obj1, obj2)).toBe(true);
      expect(isEqual(obj1, obj3)).toBe(false);
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('checks if object has specific path', () => {
      expect(hasPath(mockUser, 'address.street')).toBe(true);
      expect(hasPath(mockUser, 'address.zip')).toBe(false);
      expect(hasPath(mockUser, 'nonexistent.path')).toBe(false);
    });
  });

  describe('Path Utilities', () => {
    it('gets value at specific path', () => {
      expect(getPath(mockUser, 'address.street')).toBe('123 Main St');
      expect(getPath(mockUser, 'address.zip', 'Unknown')).toBe('Unknown');
      expect(getPath(mockUser, 'nonexistent.path', 'Default')).toBe('Default');
    });

    it('sets value at specific path', () => {
      const result = setPath(mockUser, 'address.zip', '12345');
      expect(result.address?.zip).toBe('12345');
      expect(result.address?.street).toBe('123 Main St'); // Original preserved
    });

    it('unsets value at specific path', () => {
      const result = unsetPath(mockUser, 'address.city');
      expect(result.address?.city).toBeUndefined();
      expect(result.address?.street).toBe('123 Main St'); // Other properties preserved
    });
  });

  describe('Accounting-Specific Utilities', () => {
    it('creates safe object with defaults', () => {
      const defaults = {
        accountCode: '',
        balance: 0,
        isActive: true
      };
      const overrides = {
        accountCode: '1001',
        balance: 5000
      };
      const result = createSafeObject(defaults, overrides);
      
      expect(result).toEqual({
        accountCode: '1001',
        balance: 5000,
        isActive: true
      });
    });

    it('sanitizes object by removing undefined values', () => {
      const obj = { a: 1, b: undefined, c: 3, d: null };
      const result = sanitizeObject(obj);
      expect(result).toEqual({ a: 1, c: 3, d: null });
    });

    it('normalizes keys to camelCase', () => {
      const obj = { account_code: '1001', account_name: 'Cash', is_active: true };
      const result = normalizeKeys(obj);
      expect(result).toEqual({
        accountCode: '1001',
        accountName: 'Cash',
        isActive: true
      });
    });

    it('denormalizes keys to snake_case', () => {
      const obj = { accountCode: '1001', accountName: 'Cash', isActive: true };
      const result = denormalizeKeys(obj);
      expect(result).toEqual({
        account_code: '1001',
        account_name: 'Cash',
        is_active: true
      });
    });

    it('validates object against schema', () => {
      const obj = { name: 'John', age: 30, email: 'john@example.com', invalid: true };
      const schema = { name: 'string', age: 'number', email: 'string' };
      const result = validateObjectSchema(obj, schema);
      
      expect(result).toEqual({
        name: 'John',
        age: 30,
        email: 'john@example.com'
      });
    });

    it('merges accounting objects properly', () => {
      const base = {
        accountCode: '1001',
        balance: 5000,
        metadata: { createdBy: 'admin' }
      };
      const updates = {
        balance: 6000,
        metadata: { lastModified: new Date('2024-01-01') } as any
      };
      const result = mergeAccountingObject(base, updates);
      
      expect(result.balance).toBe(6000);
      expect(result.metadata?.createdBy).toBe('admin');
      expect((result.metadata as any)?.lastModified).toEqual(new Date('2024-01-01'));
    });
  });

  describe('Utility Functions', () => {
    it('gets object size', () => {
      expect(getObjectSize({ a: 1, b: 2, c: 3 })).toBe(3);
      expect(getObjectSize([])).toBe(0);
      expect(getObjectSize([1, 2, 3])).toBe(3);
      expect(getObjectSize(null)).toBe(0);
    });

    it('creates object from pairs', () => {
      const pairs: Array<[string, any]> = [['a', 1], ['b', 2], ['c', 3]];
      const result = fromPairs(pairs);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('converts object to pairs', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = toPairs(obj);
      expect(result).toEqual([['a', 1], ['b', 2], ['c', 3]]);
    });

    it('creates object from keys with constant value', () => {
      const keys = ['a', 'b', 'c'];
      const result = fromKeys(keys, 0);
      expect(result).toEqual({ a: 0, b: 0, c: 0 });
    });
  });

  describe('Edge Cases', () => {
    it('handles circular references gracefully', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      
      // Should handle circular references by returning a partial clone
      const cloned = deepClone(obj);
      expect(cloned.a).toBe(1);
      expect(cloned.self).toBeDefined();
      // Note: The circular reference will be broken in the clone
    });

    it('handles functions in objects', () => {
      const obj = {
        a: 1,
        fn: () => 'test'
      };
      
      const cloned = deepClone(obj, { preserveFunctions: true });
      expect(cloned.fn).toBeDefined();
      expect(typeof cloned.fn).toBe('function');
      
      const clonedWithoutFunctions = deepClone(obj, { preserveFunctions: false });
      expect(clonedWithoutFunctions.fn).toBeUndefined();
    });

    it('handles symbols in objects', () => {
      const sym = Symbol('test');
      const obj = {
        a: 1,
        [sym]: 'symbol value'
      };
      
      const cloned = deepClone(obj, { preserveSymbols: true });
      expect(cloned[sym]).toBe('symbol value');
      
      const clonedWithoutSymbols = deepClone(obj, { preserveSymbols: false });
      expect(clonedWithoutSymbols[sym]).toBeUndefined();
    });

    it('handles empty objects and arrays', () => {
      expect(deepClone({})).toEqual({});
      expect(deepClone([])).toEqual([]);
      expect(isObjectEmpty({})).toBe(true);
      expect(isObjectEmpty([])).toBe(true);
    });

    it('handles nested null and undefined values', () => {
      const obj = {
        a: null,
        b: undefined,
        c: { d: null, e: undefined }
      };
      
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
    });
  });
});

describe('mergeWith', () => {
  it('uses customizer for numeric values', () => {
    const target = { x: 1, y: 2 };
    const source = { x: 3, y: 4 };
    
    const result = mergeWith(target, source, ({ targetValue, sourceValue }) => {
      if (typeof targetValue === 'number' && typeof sourceValue === 'number') {
        return targetValue + sourceValue;
      }
      return undefined; // fallback to default
    });
    
    expect(result).toEqual({ x: 4, y: 6 });
  });

  it('uses customizer for arrays', () => {
    const target = { tags: ['a', 'b'] };
    const source = { tags: ['c', 'a'] };
    
    const result = mergeWith(target, source, ({ targetValue, sourceValue }) => {
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        return Array.from(new Set([...targetValue, ...sourceValue]));
      }
      return undefined;
    });
    
    expect(result).toEqual({ tags: ['a', 'b', 'c'] });
  });

  it('falls back to default behavior when customizer returns undefined', () => {
    const target = { nested: { val: 1 } };
    const source = { nested: { val: 2 } };
    
    const result = mergeWith(target, source, () => undefined);
    
    expect(result).toEqual({ nested: { val: 2 } });
  });
});

describe('setPathWith', () => {
  it('updates value using updater function', () => {
    const obj = { counter: 5 };
    const result = setPathWith(obj, 'counter', (prev) => (prev ?? 0) + 1);
    
    expect(result).toEqual({ counter: 6 });
  });

  it('creates missing containers', () => {
    const obj = {};
    const result = setPathWith(obj, 'meta.counters.clicks', (prev) => (prev ?? 0) + 1);
    
    expect(result).toEqual({ meta: { counters: { clicks: 1 } } });
  });

  it('handles array indices', () => {
    const obj = { items: [{ qty: 1 }] };
    const result = setPathWith(obj, 'items[0].qty', (prev) => (prev ?? 0) + 1);
    
    expect(result).toEqual({ items: [{ qty: 2 }] });
  });

  it('guards against prototype pollution', () => {
    const obj = {};
    const result = setPathWith(obj, '__proto__.polluted', () => 'hacked');
    
    expect(result).toEqual({});
  });
});

describe('validateWithSchema', () => {
  const AccountSchema = {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      accountCode: { type: 'string' as const, pattern: /^[A-Z0-9.]{3,40}$/ },
      balance: { type: 'number' as const, min: 0 },
      isActive: { type: 'boolean' as const, optional: true },
      tags: { type: 'array' as const, items: { type: 'string' as const }, optional: true, maxItems: 20 },
      openedAt: { type: 'date' as const, optional: true },
    },
  };

  it('validates valid account data', () => {
    const validData = {
      accountCode: 'CASH.001',
      balance: 1000,
      isActive: true,
      tags: ['primary', 'cash'],
      openedAt: new Date('2023-01-01'),
    };
    
    const result = validateWithSchema(validData, AccountSchema);
    
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(validData);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid account code pattern', () => {
    const invalidData = {
      accountCode: 'invalid-code!',
      balance: 1000,
    };
    
    const result = validateWithSchema(invalidData, AccountSchema);
    
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('$.accountCode: string does not match pattern');
  });

  it('rejects negative balance', () => {
    const invalidData = {
      accountCode: 'CASH.001',
      balance: -100,
    };
    
    const result = validateWithSchema(invalidData, AccountSchema);
    
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('$.balance: number < min 0');
  });

  it('handles optional fields', () => {
    const minimalData = {
      accountCode: 'CASH.001',
      balance: 1000,
    };
    
    const result = validateWithSchema(minimalData, AccountSchema);
    
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(minimalData);
  });

  it('validates array items', () => {
    const dataWithInvalidTags = {
      accountCode: 'CASH.001',
      balance: 1000,
      tags: ['valid', 123, 'also-valid'], // 123 is not a string
    };
    
    const result = validateWithSchema(dataWithInvalidTags, AccountSchema);
    
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('$.tags[1]: expected string, got number');
  });
});

describe('Zod Adapter', () => {
  // Helper to add safeParse to mock objects
  const addSafeParse = (obj: any) => ({ ...obj, safeParse: (data: any) => ({ success: true, data }) });
  
  // Mock Zod for testing without dependency
  const mockZ = {
    string: () => addSafeParse({ refine: () => ({ regex: () => ({ optional: () => ({}) }) }), regex: () => ({ optional: () => ({}) }), optional: () => ({}) }),
    number: () => addSafeParse({ min: () => ({ max: () => ({ optional: () => ({}) }) }), max: () => ({ optional: () => ({}) }), optional: () => ({}) }),
    boolean: () => addSafeParse({ optional: () => ({}) }),
    date: () => addSafeParse({ optional: () => ({}) }),
    literal: (val: any) => addSafeParse({ _def: { value: val }, optional: () => ({}) }),
    undefined: () => addSafeParse({ optional: () => ({}) }),
    array: (_items: any) => addSafeParse({ min: () => ({ max: () => ({ optional: () => ({}) }) }), max: () => ({ optional: () => ({}) }), optional: () => ({}) }),
    object: (_shape: any) => addSafeParse({ passthrough: () => ({ optional: () => ({}) }), strict: () => ({ optional: () => ({}) }), optional: () => ({}) }),
    union: (_schemas: any[]) => addSafeParse({ optional: () => ({}) }),
    any: () => addSafeParse({ optional: () => ({}) }),
    preprocess: (_fn: any, schema: any) => addSafeParse({ ...schema, optional: () => ({}) }),
    ZodFirstPartyTypeKind: {
      ZodOptional: 'ZodOptional',
      ZodString: 'ZodString',
      ZodNumber: 'ZodNumber',
      ZodBoolean: 'ZodBoolean',
      ZodDate: 'ZodDate',
      ZodArray: 'ZodArray',
      ZodObject: 'ZodObject',
      ZodUnion: 'ZodUnion',
      ZodLiteral: 'ZodLiteral',
    }
  };

  const testSchema = {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      name: { type: 'string' as const },
      age: { type: 'number' as const, min: 0, max: 120 },
      isActive: { type: 'boolean' as const, optional: true },
    },
  };

  it('converts schema to Zod (basic types)', () => {
    const zodSchema = toZod(mockZ as any, testSchema);
    expect(zodSchema).toBeDefined();
  });

  it('converts schema to Zod with coercion', () => {
    const zodSchema = toZod(mockZ as any, testSchema, { coerce: true });
    expect(zodSchema).toBeDefined();
  });

  it('handles anyOf schemas', () => {
    const unionSchema = {
      anyOf: [
        { type: 'string' as const },
        { type: 'number' as const }
      ]
    };
    const zodSchema = toZod(mockZ as any, unionSchema);
    expect(zodSchema).toBeDefined();
  });

  it('handles array schemas', () => {
    const arraySchema = {
      type: 'array' as const,
      items: { type: 'string' as const },
      minItems: 1,
      maxItems: 10,
    };
    const zodSchema = toZod(mockZ as any, arraySchema);
    expect(zodSchema).toBeDefined();
  });

  it('converts from Zod (basic types)', () => {
    const mockZodSchema = {
      _def: {
        typeName: mockZ.ZodFirstPartyTypeKind.ZodString,
        checks: [{ kind: 'regex', regex: /^test$/ }]
      }
    };
    const schema = fromZod(mockZ as any, mockZodSchema as any);
    expect(schema).toEqual({ type: 'string', pattern: /^test$/ });
  });

  it('converts from Zod number with constraints', () => {
    const mockZodSchema = {
      _def: {
        typeName: mockZ.ZodFirstPartyTypeKind.ZodNumber,
        checks: [
          { kind: 'min', value: 0 },
          { kind: 'max', value: 100 }
        ]
      }
    };
    const schema = fromZod(mockZ as any, mockZodSchema as any);
    expect(schema).toEqual({ type: 'number', min: 0, max: 100 });
  });

  it('converts from Zod object', () => {
    const mockZodSchema = {
      _def: {
        typeName: mockZ.ZodFirstPartyTypeKind.ZodObject,
        shape: () => ({
          name: { _def: { typeName: mockZ.ZodFirstPartyTypeKind.ZodString } }
        }),
        unknownKeys: 'passthrough'
      }
    };
    const schema = fromZod(mockZ as any, mockZodSchema as any);
    expect(schema).toEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: true
    });
  });

  it('validates with Zod', () => {
    // Create a custom mock for this test
    const customMockZ = {
      ...mockZ,
      object: (_shape: any) => ({
        ...addSafeParse({}),
        passthrough: () => ({
          ...addSafeParse({}),
          safeParse: (data: any) => ({
            success: data.name === 'test',
            data: data.name === 'test' ? data : undefined,
            error: data.name === 'test' ? undefined : { issues: [{ path: ['name'], message: 'invalid' }] }
          })
        }),
        strict: () => ({
          ...addSafeParse({}),
          safeParse: (data: any) => ({
            success: data.name === 'test',
            data: data.name === 'test' ? data : undefined,
            error: data.name === 'test' ? undefined : { issues: [{ path: ['name'], message: 'invalid' }] }
          })
        }),
        safeParse: (data: any) => ({
          success: data.name === 'test',
          data: data.name === 'test' ? data : undefined,
          error: data.name === 'test' ? undefined : { issues: [{ path: ['name'], message: 'invalid' }] }
        })
      })
    };
    
    const validData = { name: 'test' };
    const invalidData = { name: 'invalid' };
    
    const validResult = validateWithZod(customMockZ as any, validData, testSchema);
    expect(validResult.ok).toBe(true);
    expect(validResult.value).toEqual(validData);
    
    const invalidResult = validateWithZod(customMockZ as any, invalidData, testSchema);
    expect(invalidResult.ok).toBe(false);
    expect(invalidResult.errors).toContain('name: invalid');
  });

  it('handles coercion options', () => {
    const coercionSchema = {
      type: 'number' as const,
      min: 0
    };
    
    const zodSchema = toZod(mockZ as any, coercionSchema, { coerce: true });
    expect(zodSchema).toBeDefined();
  });
});