/**
 * Utilities Test Suite
 * 
 * Comprehensive testing for utility functions:
 * - Variant utilities
 * - Class name utilities
 * - Type guards
 * - Helper functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cva } from 'class-variance-authority';
import { cn } from '../utils/cn.utility';

describe('Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
  describe('Variants Utility', () => {
    const buttonVariants = cva('base-button', {
      variants: {
        size: {
          sm: 'h-8 px-3 text-sm',
          md: 'h-10 px-4 text-sm',
          lg: 'h-12 px-6 text-base',
        },
        variant: {
          primary: 'bg-primary text-primary-foreground',
          secondary: 'bg-secondary text-secondary-foreground',
          outline: 'border border-input bg-background',
        },
      },
      defaultVariants: {
        size: 'md',
        variant: 'primary',
      },
    });

    it('should merge base and variants correctly', () => {
      const result = buttonVariants({ size: 'sm', variant: 'secondary' });
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-8');
      expect(result).toContain('px-3');
      expect(result).toContain('text-sm');
      expect(result).toContain('bg-secondary');
      expect(result).toContain('text-secondary-foreground');
    });

    it('should use default variants when not specified', () => {
      const result = buttonVariants();
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-10'); // md size
      expect(result).toContain('px-4'); // md size
      expect(result).toContain('bg-primary'); // primary variant
      expect(result).toContain('text-primary-foreground'); // primary variant
    });

    it('should override defaults with provided props', () => {
      const result = buttonVariants({ size: 'lg' });
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-12'); // lg size
      expect(result).toContain('px-6'); // lg size
      expect(result).toContain('bg-primary'); // default variant
    });

    it('should handle empty props', () => {
      const result = buttonVariants({});
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-10'); // default size
      expect(result).toContain('bg-primary'); // default variant
    });

    it('should handle undefined props', () => {
      const result = buttonVariants(undefined);
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-10'); // default size
      expect(result).toContain('bg-primary'); // default variant
    });

    it('should handle unknown variant values gracefully', () => {
      const result = buttonVariants({ size: 'xl' as any });
      
      expect(result).toContain('base-button');
      // CVA ignores unknown variant values entirely, so only base and other valid variants are applied
      // Since 'xl' is not a valid size, no size classes are applied, but default variant still works
      expect(result).toContain('bg-primary'); // default variant
      expect(result).toContain('text-primary-foreground'); // default variant
    });

    it('should handle unknown variant keys gracefully', () => {
      const result = buttonVariants({ unknownKey: 'value' } as any);
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-10'); // should use default size
      expect(result).toContain('bg-primary'); // should use default variant
    });

    it('should handle falsy values correctly', () => {
      const result = buttonVariants({ size: undefined as any });
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-10'); // should use default size
    });

    it('should maintain class order: base before variants', () => {
      const result = buttonVariants({ size: 'sm', variant: 'outline' });
      // Ensure base class appears before variant classes to avoid override issues
      const baseIdx = result.indexOf('base-button');
      const varIdx = result.indexOf('bg-background');
      expect(baseIdx).toBeGreaterThanOrEqual(0);
      expect(varIdx).toBeGreaterThanOrEqual(0);
      expect(baseIdx).toBeLessThan(varIdx);
    });

    it('should handle unknown variant keys gracefully', () => {
      const result = buttonVariants({ unknownKey: 'value' } as any);
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-10'); // should use default size
      expect(result).toContain('bg-primary'); // should use default variant
    });

    it('should handle falsy values correctly', () => {
      const result = buttonVariants({ size: undefined as any });
      
      expect(result).toContain('base-button');
      expect(result).toContain('h-10'); // should use default size
    });
  });

  describe('Class Name Utility', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional class names', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('disabled-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      
      expect(result).toContain('base-class');
      expect(result).toContain('valid-class');
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
    });

    it('should handle empty strings', () => {
      const result = cn('base-class', '', 'valid-class');
      
      expect(result).toContain('base-class');
      expect(result).toContain('valid-class');
    });

    it('should handle arrays of class names', () => {
      const result = cn(['class1', ['class2', false, null], ''], 'class3');
      
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'base-class': true,
        'active-class': true,
        'disabled-class': false,
      });
      
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('disabled-class');
    });

    it('should merge Tailwind classes intelligently', () => {
      const result = cn('px-2 py-1', 'px-4', 'bg-red-500');
      
      // Should contain merged classes
      expect(result).toContain('py-1');
      expect(result).toContain('px-4'); // px-2 should be overridden by px-4
      expect(result).toContain('bg-red-500');
      expect(result).not.toContain('px-2'); // Should be overridden
    });

    it('should trim extraneous whitespace', () => {
      const result = cn('  a  ', ' b ', ['  c  '], { ' d  ': true });
      // split on spaces, recombine to check trimmed tokens existence
      const classes = result.split(/\s+/);
      expect(classes).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd']));
    });

    it('should preserve first occurrence order after dedupe', () => {
      const result = cn('x', 'y', 'x', 'z', 'y');
      expect(result.indexOf('x')).toBeLessThan(result.indexOf('y'));
      expect(result.indexOf('y')).toBeLessThan(result.indexOf('z'));
    });
  });

  describe('Type Guards', () => {
    it('should validate string types', () => {
      const isString = (value: unknown): value is string => typeof value === 'string';
      
      expect(isString('hello')).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });

    it('should validate number types', () => {
      const isNumber = (value: unknown): value is number => typeof value === 'number';
      
      expect(isNumber(123)).toBe(true);
      expect(isNumber('hello')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });

    it('should validate boolean types', () => {
      const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
      
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(1)).toBe(false);
    });

    it('should validate object types', () => {
      const isObject = (value: unknown): value is object => 
        typeof value === 'object' && value !== null;
      
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
    });

    it('should validate array types', () => {
      const isArray = (value: unknown): value is unknown[] => Array.isArray(value);
      
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray({})).toBe(false);
      expect(isArray('string')).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    it('should format currency correctly', () => {
      const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      };
      
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format dates correctly', () => {
      const formatDate = (date: Date, locale = 'en-US') => {
        // Force UTC to avoid timezone-dependent day shifts
        return new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).format(date);
      };
      const testDate = new Date('2023-12-25T00:00:00Z');
      expect(formatDate(testDate)).toBe('12/25/2023');
      expect(formatDate(testDate, 'en-GB')).toBe('25/12/2023');
    });

    it('should debounce function calls', () => {
      const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
      };
      
      let callCount = 0;
      const debouncedFunc = debounce(() => {
        callCount++;
      }, 100);
      
      // Call multiple times quickly
      debouncedFunc();
      debouncedFunc();
      debouncedFunc();
      
      // Advance timers deterministically
      vi.advanceTimersByTime(99);
      expect(callCount).toBe(0);
      vi.advanceTimersByTime(1);
      expect(callCount).toBe(1);
    });

    it('should throttle function calls', () => {
      const throttle = (func: Function, delay: number) => {
        let lastCall = 0;
        return (...args: any[]) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(null, args);
          }
        };
      };

      let callCount = 0;
      const throttledFunc = throttle(() => {
        callCount++;
      }, 100);

      // Call multiple times at t=0
      throttledFunc(); // fires
      throttledFunc(); // ignored
      throttledFunc(); // ignored
      expect(callCount).toBe(1);

      // Advance timers by 50ms (less than delay)
      vi.advanceTimersByTime(50);
      throttledFunc(); // still ignored
      expect(callCount).toBe(1);

      // Advance timers by another 50ms (total 100ms, equal to delay)
      vi.advanceTimersByTime(50);
      throttledFunc(); // fires
      expect(callCount).toBe(2);
    });

    it('should generate unique IDs', () => {
      const generateId = () => {
        return Math.random().toString(36).slice(2, 9);
      };
      
      // Generate many IDs and ensure no duplicates under normal rng
      const count = 200;
      const set = new Set<string>();
      for (let i = 0; i < count; i++) {
        const id = generateId();
        set.add(id);
        expect(id).toHaveLength(9);
      }
      expect(set.size).toBe(count);
    });

    it('should validate email addresses', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
      
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should validate URLs', () => {
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
      expect(isValidUrl('invalid-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });
});
