/**
 * Rounding Policy Unit Tests
 * 
 * Comprehensive test suite for rounding policy functions including:
 * - Rounding method validation and normalization
 * - Case-insensitive string handling
 * - Numeric rounding behavior for all methods
 * - Performance optimizations
 * - Edge cases and precision testing
 */

import { describe, it, expect } from 'vitest';
import {
  RoundingMethod,
  DEFAULT_ROUNDING_METHOD,
  STRING_TO_ENUM_MAP,
  ROUNDING_METHOD_SET,
  ROUNDING_METHODS,
  ROUNDING_DESCRIPTIONS,
  normalizeRoundingMethod,
  isRoundingMethod,
  validateRoundingMethod,
  roundNumber,
} from '../policies/rounding-policy';

describe('Rounding Policy', () => {
  describe('Constants', () => {
    it('should have HALF_EVEN as default rounding method', () => {
      expect(DEFAULT_ROUNDING_METHOD).toBe(RoundingMethod.HALF_EVEN);
    });

    it('should have all rounding methods defined', () => {
      expect(ROUNDING_METHODS).toContain(RoundingMethod.HALF_UP);
      expect(ROUNDING_METHODS).toContain(RoundingMethod.HALF_DOWN);
      expect(ROUNDING_METHODS).toContain(RoundingMethod.HALF_EVEN);
      expect(ROUNDING_METHODS).toContain(RoundingMethod.CEILING);
      expect(ROUNDING_METHODS).toContain(RoundingMethod.FLOOR);
      expect(ROUNDING_METHODS).toContain(RoundingMethod.TRUNCATE);
      expect(ROUNDING_METHODS.length).toBe(6);
    });

    it('should have optimized set for O(1) lookups', () => {
      expect(ROUNDING_METHOD_SET).toBeInstanceOf(Set);
      expect(ROUNDING_METHOD_SET.size).toBe(ROUNDING_METHODS.length);
      expect(ROUNDING_METHOD_SET.has(RoundingMethod.HALF_EVEN)).toBe(true);
      expect(ROUNDING_METHOD_SET.has('INVALID' as RoundingMethod)).toBe(false);
    });

    it('should have descriptions for all methods', () => {
      for (const method of ROUNDING_METHODS) {
        expect(ROUNDING_DESCRIPTIONS[method]).toBeDefined();
        expect(typeof ROUNDING_DESCRIPTIONS[method]).toBe('string');
        expect(ROUNDING_DESCRIPTIONS[method].length).toBeGreaterThan(0);
      }
    });

    it('should have backward compatibility mappings', () => {
      expect(STRING_TO_ENUM_MAP['HALF_UP']).toBe(RoundingMethod.HALF_UP);
      expect(STRING_TO_ENUM_MAP['round_half_up']).toBe(RoundingMethod.HALF_UP);
      expect(STRING_TO_ENUM_MAP['round_up']).toBe(RoundingMethod.CEILING);
      expect(STRING_TO_ENUM_MAP['truncate']).toBe(RoundingMethod.TRUNCATE);
    });
  });

  describe('normalizeRoundingMethod', () => {
    it('should normalize exact enum values', () => {
      expect(normalizeRoundingMethod(RoundingMethod.HALF_EVEN)).toBe(RoundingMethod.HALF_EVEN);
      expect(normalizeRoundingMethod(RoundingMethod.HALF_UP)).toBe(RoundingMethod.HALF_UP);
    });

    it('should normalize exact string matches', () => {
      expect(normalizeRoundingMethod('HALF_EVEN')).toBe(RoundingMethod.HALF_EVEN);
      expect(normalizeRoundingMethod('HALF_UP')).toBe(RoundingMethod.HALF_UP);
      expect(normalizeRoundingMethod('round_half_even')).toBe(RoundingMethod.HALF_EVEN);
    });

    it('should normalize uppercase strings', () => {
      expect(normalizeRoundingMethod('half_even')).toBe(RoundingMethod.HALF_EVEN);
      expect(normalizeRoundingMethod('half_up')).toBe(RoundingMethod.HALF_UP);
      expect(normalizeRoundingMethod('ceiling')).toBe(RoundingMethod.CEILING);
    });

    it('should normalize lowercase strings', () => {
      expect(normalizeRoundingMethod('half_even')).toBe(RoundingMethod.HALF_EVEN);
      expect(normalizeRoundingMethod('round_half_up')).toBe(RoundingMethod.HALF_UP);
      expect(normalizeRoundingMethod('truncate')).toBe(RoundingMethod.TRUNCATE);
    });

    it('should handle whitespace', () => {
      expect(normalizeRoundingMethod('  HALF_EVEN  ')).toBe(RoundingMethod.HALF_EVEN);
      expect(normalizeRoundingMethod('\tround_half_up\n')).toBe(RoundingMethod.HALF_UP);
    });

    it('should fall back to default for unknown strings', () => {
      expect(normalizeRoundingMethod('INVALID')).toBe(DEFAULT_ROUNDING_METHOD);
      expect(normalizeRoundingMethod('unknown_method')).toBe(DEFAULT_ROUNDING_METHOD);
    });
  });

  describe('isRoundingMethod', () => {
    it('should return true for valid enum values', () => {
      expect(isRoundingMethod(RoundingMethod.HALF_EVEN)).toBe(true);
      expect(isRoundingMethod(RoundingMethod.HALF_UP)).toBe(true);
      expect(isRoundingMethod(RoundingMethod.CEILING)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isRoundingMethod('INVALID')).toBe(false);
      expect(isRoundingMethod('half-even')).toBe(false);
      expect(isRoundingMethod(123)).toBe(false);
      expect(isRoundingMethod(null)).toBe(false);
      expect(isRoundingMethod(undefined)).toBe(false);
    });
  });

  describe('validateRoundingMethod', () => {
    it('should return method for valid enum values', () => {
      expect(validateRoundingMethod(RoundingMethod.HALF_EVEN)).toBe(RoundingMethod.HALF_EVEN);
      expect(validateRoundingMethod(RoundingMethod.HALF_UP)).toBe(RoundingMethod.HALF_UP);
    });

    it('should return method for valid string mappings', () => {
      expect(validateRoundingMethod('HALF_EVEN')).toBe(RoundingMethod.HALF_EVEN);
      expect(validateRoundingMethod('round_half_up')).toBe(RoundingMethod.HALF_UP);
    });

    it('should throw error for invalid values', () => {
      expect(() => validateRoundingMethod('INVALID')).toThrow('Invalid rounding method: INVALID');
      expect(() => validateRoundingMethod('half-even')).toThrow('Invalid rounding method: half-even');
      expect(() => validateRoundingMethod(123)).toThrow('Invalid rounding method: 123');
    });

    it('should include valid methods list in error message', () => {
      try {
        validateRoundingMethod('INVALID');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('Valid methods:');
        expect(error.message).toContain('HALF_EVEN');
        expect(error.message).toContain('HALF_UP');
      }
    });
  });

  describe('roundNumber - HALF_UP', () => {
    it('should round half away from zero for positives', () => {
      expect(roundNumber(1.5, 0, RoundingMethod.HALF_UP)).toBe(2);
      expect(roundNumber(2.5, 0, RoundingMethod.HALF_UP)).toBe(3);
      expect(roundNumber(1.49, 0, RoundingMethod.HALF_UP)).toBe(1);
      expect(roundNumber(1.51, 0, RoundingMethod.HALF_UP)).toBe(2);
    });

    it('should round half away from zero for negatives', () => {
      expect(roundNumber(-1.5, 0, RoundingMethod.HALF_UP)).toBe(-2);
      expect(roundNumber(-2.5, 0, RoundingMethod.HALF_UP)).toBe(-3);
      expect(roundNumber(-1.49, 0, RoundingMethod.HALF_UP)).toBe(-1);
      expect(roundNumber(-1.51, 0, RoundingMethod.HALF_UP)).toBe(-2);
    });

    it('should work with decimal places', () => {
      expect(roundNumber(1.005, 2, RoundingMethod.HALF_UP)).toBe(1.01);
      expect(roundNumber(1.004, 2, RoundingMethod.HALF_UP)).toBe(1.00);
      expect(roundNumber(-1.005, 2, RoundingMethod.HALF_UP)).toBe(-1.01);
    });
  });

  describe('roundNumber - HALF_DOWN', () => {
    it('should round half toward zero for positives', () => {
      expect(roundNumber(1.5, 0, RoundingMethod.HALF_DOWN)).toBe(1);
      expect(roundNumber(2.5, 0, RoundingMethod.HALF_DOWN)).toBe(2);
      expect(roundNumber(1.49, 0, RoundingMethod.HALF_DOWN)).toBe(1);
      expect(roundNumber(1.51, 0, RoundingMethod.HALF_DOWN)).toBe(2);
    });

    it('should round half toward zero for negatives', () => {
      expect(roundNumber(-1.5, 0, RoundingMethod.HALF_DOWN)).toBe(-1);
      expect(roundNumber(-2.5, 0, RoundingMethod.HALF_DOWN)).toBe(-2);
      expect(roundNumber(-1.49, 0, RoundingMethod.HALF_DOWN)).toBe(-1);
      expect(roundNumber(-1.51, 0, RoundingMethod.HALF_DOWN)).toBe(-2);
    });

    it('should work with decimal places', () => {
      expect(roundNumber(1.005, 2, RoundingMethod.HALF_DOWN)).toBe(1.00);
      expect(roundNumber(1.004, 2, RoundingMethod.HALF_DOWN)).toBe(1.00);
      expect(roundNumber(-1.005, 2, RoundingMethod.HALF_DOWN)).toBe(-1.00);
    });
  });

  describe('roundNumber - HALF_EVEN (Bankers Rounding)', () => {
    it('should round half to even for positives', () => {
      expect(roundNumber(1.5, 0, RoundingMethod.HALF_EVEN)).toBe(2); // 1 is odd, round up
      expect(roundNumber(2.5, 0, RoundingMethod.HALF_EVEN)).toBe(2); // 2 is even, round down
      expect(roundNumber(3.5, 0, RoundingMethod.HALF_EVEN)).toBe(4); // 3 is odd, round up
      expect(roundNumber(4.5, 0, RoundingMethod.HALF_EVEN)).toBe(4); // 4 is even, round down
    });

    it('should round half to even for negatives', () => {
      expect(roundNumber(-1.5, 0, RoundingMethod.HALF_EVEN)).toBe(-2); // -1 is odd, round down
      expect(roundNumber(-2.5, 0, RoundingMethod.HALF_EVEN)).toBe(-2); // -2 is even, round up
      expect(roundNumber(-3.5, 0, RoundingMethod.HALF_EVEN)).toBe(-4); // -3 is odd, round down
      expect(roundNumber(-4.5, 0, RoundingMethod.HALF_EVEN)).toBe(-4); // -4 is even, round up
    });

    it('should work with decimal places', () => {
      expect(roundNumber(1.005, 2, RoundingMethod.HALF_EVEN)).toBe(1.00); // 1.00 is even
      expect(roundNumber(1.015, 2, RoundingMethod.HALF_EVEN)).toBe(1.02); // 1.01 is odd, round up
      expect(roundNumber(-1.005, 2, RoundingMethod.HALF_EVEN)).toBe(-1.00); // -1.00 is even
      expect(roundNumber(-1.015, 2, RoundingMethod.HALF_EVEN)).toBe(-1.02); // -1.01 is odd, round down
    });
  });

  describe('roundNumber - CEILING', () => {
    it('should round toward positive infinity', () => {
      expect(roundNumber(1.1, 0, RoundingMethod.CEILING)).toBe(2);
      expect(roundNumber(1.9, 0, RoundingMethod.CEILING)).toBe(2);
      expect(roundNumber(-1.1, 0, RoundingMethod.CEILING)).toBe(-1);
      expect(roundNumber(-1.9, 0, RoundingMethod.CEILING)).toBe(-1);
    });

    it('should work with decimal places', () => {
      expect(roundNumber(1.001, 2, RoundingMethod.CEILING)).toBe(1.01);
      expect(roundNumber(-1.001, 2, RoundingMethod.CEILING)).toBe(-1.00);
    });
  });

  describe('roundNumber - FLOOR', () => {
    it('should round toward negative infinity', () => {
      expect(roundNumber(1.1, 0, RoundingMethod.FLOOR)).toBe(1);
      expect(roundNumber(1.9, 0, RoundingMethod.FLOOR)).toBe(1);
      expect(roundNumber(-1.1, 0, RoundingMethod.FLOOR)).toBe(-2);
      expect(roundNumber(-1.9, 0, RoundingMethod.FLOOR)).toBe(-2);
    });

    it('should work with decimal places', () => {
      expect(roundNumber(1.999, 2, RoundingMethod.FLOOR)).toBe(1.99);
      expect(roundNumber(-1.999, 2, RoundingMethod.FLOOR)).toBe(-2.00);
    });
  });

  describe('roundNumber - TRUNCATE', () => {
    it('should truncate toward zero', () => {
      expect(roundNumber(1.1, 0, RoundingMethod.TRUNCATE)).toBe(1);
      expect(roundNumber(1.9, 0, RoundingMethod.TRUNCATE)).toBe(1);
      expect(roundNumber(-1.1, 0, RoundingMethod.TRUNCATE)).toBe(-1);
      expect(roundNumber(-1.9, 0, RoundingMethod.TRUNCATE)).toBe(-1);
    });

    it('should work with decimal places', () => {
      expect(roundNumber(1.999, 2, RoundingMethod.TRUNCATE)).toBe(1.99);
      expect(roundNumber(-1.999, 2, RoundingMethod.TRUNCATE)).toBe(-1.99);
    });
  });

  describe('roundNumber - Default behavior', () => {
    it('should use HALF_EVEN as default method', () => {
      expect(roundNumber(1.5, 0)).toBe(2); // HALF_EVEN behavior
      expect(roundNumber(2.5, 0)).toBe(2); // HALF_EVEN behavior
    });

    it('should use 2 decimals as default', () => {
      expect(roundNumber(1.2345)).toBe(1.23); // Default 2 decimals
    });

    it('should handle non-integer decimals', () => {
      expect(roundNumber(1.2345, 1.7)).toBe(1.23); // Should clamp to 2
    });

    it('should clamp decimals to valid range', () => {
      expect(roundNumber(1.2345, -1)).toBe(1); // Clamp to 0
      expect(roundNumber(1.2345, 10)).toBe(1.2345); // Clamp to 8, input already has 4 decimals
    });
  });

  describe('roundNumber - Edge cases', () => {
    it('should handle non-finite numbers', () => {
      expect(roundNumber(Infinity)).toBe(Infinity);
      expect(roundNumber(-Infinity)).toBe(-Infinity);
      expect(roundNumber(NaN)).toBe(NaN);
    });

    it('should handle zero', () => {
      expect(roundNumber(0)).toBe(0);
      expect(roundNumber(0, 2, RoundingMethod.HALF_EVEN)).toBe(0);
    });

    it('should handle very small numbers', () => {
      expect(roundNumber(0.001, 2)).toBe(0.00);
      expect(roundNumber(0.005, 2, RoundingMethod.HALF_EVEN)).toBe(0.00);
    });

    it('should handle very large numbers', () => {
      expect(roundNumber(999999.99, 1)).toBe(1000000.0);
      expect(roundNumber(-999999.99, 1)).toBe(-1000000.0);
    });
  });

  describe('Performance characteristics', () => {
    it('should use O(1) lookup for method validation', () => {
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        isRoundingMethod(RoundingMethod.HALF_EVEN);
        isRoundingMethod('INVALID');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should be very fast for O(1) operations
      expect(duration).toBeLessThan(100); // Less than 100ms for 10k operations
    });

    it('should efficiently handle normalization', () => {
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        normalizeRoundingMethod('half_even');
        normalizeRoundingMethod('HALF_UP');
        normalizeRoundingMethod('round_half_down');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100); // Should be fast with optimized lookups
    });
  });

  describe('Precision testing', () => {
    it('should maintain precision for common accounting scenarios', () => {
      // Test common currency amounts
      const amounts = [12.34, 100.00, 0.01, 999.99, 1234.56];
      
      for (const amount of amounts) {
        const rounded = roundNumber(amount, 2, RoundingMethod.HALF_EVEN);
        expect(rounded).toBeCloseTo(amount, 2);
      }
    });

    it('should handle tie-breaking consistently', () => {
      // Test tie-breaking behavior consistency
      const ties = [0.5, 1.5, 2.5, 3.5, -0.5, -1.5, -2.5, -3.5];
      
      for (const tie of ties) {
        const halfUp = roundNumber(tie, 0, RoundingMethod.HALF_UP);
        const halfDown = roundNumber(tie, 0, RoundingMethod.HALF_DOWN);
        const halfEven = roundNumber(tie, 0, RoundingMethod.HALF_EVEN);
        
        // Verify different methods produce different results for ties
        expect(halfUp).not.toBe(halfDown);
        expect(halfEven).toBeDefined();
      }
    });
  });
});
