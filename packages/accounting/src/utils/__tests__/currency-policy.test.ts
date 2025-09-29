/**
 * Currency Policy Unit Tests
 * 
 * Comprehensive test suite for currency policy functions including:
 * - Currency validation and normalization
 * - Decimal handling and zero-decimal detection
 * - Minor unit conversions
 * - Performance optimizations
 */

import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_CURRENCIES_SET,
  DEFAULT_CURRENCY,
  CURRENCY_DECIMALS,
  ZERO_DECIMAL_CURRENCIES,
  CURRENCY_SYMBOLS,
  currencyDecimals,
  isSupportedCurrency,
  validateCurrency,
  normalizeCurrency,
  isZeroDecimalCurrency,
  minorUnitFactor,
  toMinorUnits,
  fromMinorUnits,
  getCurrencySymbol,
  type SupportedCurrency
} from '../policies/currency-policy';

describe('Currency Policy', () => {
  describe('Constants', () => {
    it('should have MYR as default currency', () => {
      expect(DEFAULT_CURRENCY).toBe('MYR');
    });

    it('should have supported currencies array', () => {
      expect(SUPPORTED_CURRENCIES).toContain('MYR');
      expect(SUPPORTED_CURRENCIES).toContain('USD');
      expect(SUPPORTED_CURRENCIES).toContain('EUR');
      expect(SUPPORTED_CURRENCIES).toContain('JPY');
      expect(SUPPORTED_CURRENCIES).toContain('KRW');
      expect(SUPPORTED_CURRENCIES).toContain('VND');
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThan(20);
    });

    it('should have optimized set for O(1) lookups', () => {
      expect(SUPPORTED_CURRENCIES_SET).toBeInstanceOf(Set);
      expect(SUPPORTED_CURRENCIES_SET.size).toBe(SUPPORTED_CURRENCIES.length);
      expect(SUPPORTED_CURRENCIES_SET.has('MYR')).toBe(true);
      expect(SUPPORTED_CURRENCIES_SET.has('INVALID' as SupportedCurrency)).toBe(false);
    });

    it('should have decimal mappings for all currencies', () => {
      for (const currency of SUPPORTED_CURRENCIES) {
        expect(CURRENCY_DECIMALS[currency]).toBeDefined();
        expect(typeof CURRENCY_DECIMALS[currency]).toBe('number');
        expect(CURRENCY_DECIMALS[currency]).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have zero decimal currencies set', () => {
      expect(ZERO_DECIMAL_CURRENCIES).toBeInstanceOf(Set);
      expect(ZERO_DECIMAL_CURRENCIES.has('JPY')).toBe(true);
      expect(ZERO_DECIMAL_CURRENCIES.has('KRW')).toBe(true);
      expect(ZERO_DECIMAL_CURRENCIES.has('VND')).toBe(true);
      expect(ZERO_DECIMAL_CURRENCIES.has('MYR')).toBe(false);
      expect(ZERO_DECIMAL_CURRENCIES.has('USD')).toBe(false);
    });

    it('should have symbols for all currencies', () => {
      for (const currency of SUPPORTED_CURRENCIES) {
        expect(CURRENCY_SYMBOLS[currency]).toBeDefined();
        expect(typeof CURRENCY_SYMBOLS[currency]).toBe('string');
        expect(CURRENCY_SYMBOLS[currency].length).toBeGreaterThan(0);
      }
    });
  });

  describe('currencyDecimals', () => {
    it('should return correct decimals for supported currencies', () => {
      expect(currencyDecimals('MYR')).toBe(2);
      expect(currencyDecimals('USD')).toBe(2);
      expect(currencyDecimals('EUR')).toBe(2);
      expect(currencyDecimals('JPY')).toBe(0);
      expect(currencyDecimals('KRW')).toBe(0);
      expect(currencyDecimals('VND')).toBe(0);
    });

    it('should default to 2 decimals for unsupported currencies', () => {
      expect(currencyDecimals('INVALID')).toBe(2);
      expect(currencyDecimals('XYZ')).toBe(2);
    });

    it('should work with typed overloads', () => {
      const myr: SupportedCurrency = 'MYR';
      expect(currencyDecimals(myr)).toBe(2);
      expect(currencyDecimals('MYR')).toBe(2);
    });
  });

  describe('isSupportedCurrency', () => {
    it('should return true for supported currencies', () => {
      expect(isSupportedCurrency('MYR')).toBe(true);
      expect(isSupportedCurrency('USD')).toBe(true);
      expect(isSupportedCurrency('EUR')).toBe(true);
      expect(isSupportedCurrency('JPY')).toBe(true);
    });

    it('should return false for unsupported currencies', () => {
      expect(isSupportedCurrency('INVALID')).toBe(false);
      expect(isSupportedCurrency('XYZ')).toBe(false);
      expect(isSupportedCurrency('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isSupportedCurrency('myr')).toBe(false);
      expect(isSupportedCurrency('MYR')).toBe(true);
    });
  });

  describe('validateCurrency', () => {
    it('should return currency for supported currencies', () => {
      expect(validateCurrency('MYR')).toBe('MYR');
      expect(validateCurrency('USD')).toBe('USD');
      expect(validateCurrency('EUR')).toBe('EUR');
    });

    it('should throw error for unsupported currencies', () => {
      expect(() => validateCurrency('INVALID')).toThrow('Unsupported currency: INVALID');
      expect(() => validateCurrency('XYZ')).toThrow('Unsupported currency: XYZ');
    });

    it('should include supported currencies list in error message', () => {
      try {
        validateCurrency('INVALID');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('Supported currencies:');
        expect(error.message).toContain('MYR');
        expect(error.message).toContain('USD');
      }
    });
  });

  describe('normalizeCurrency', () => {
    it('should normalize valid currencies', () => {
      expect(normalizeCurrency('myr')).toBe('MYR');
      expect(normalizeCurrency('  USD  ')).toBe('USD');
      expect(normalizeCurrency('eur')).toBe('EUR');
      expect(normalizeCurrency('JPY')).toBe('JPY');
    });

    it('should return null for invalid currencies', () => {
      expect(normalizeCurrency('INVALID')).toBeNull();
      expect(normalizeCurrency('xyz')).toBeNull();
      expect(normalizeCurrency('')).toBeNull();
    });

    it('should handle whitespace and case', () => {
      expect(normalizeCurrency('  myr  ')).toBe('MYR');
      expect(normalizeCurrency('\tUSD\n')).toBe('USD');
    });
  });

  describe('isZeroDecimalCurrency', () => {
    it('should return true for zero decimal currencies', () => {
      expect(isZeroDecimalCurrency('JPY')).toBe(true);
      expect(isZeroDecimalCurrency('KRW')).toBe(true);
      expect(isZeroDecimalCurrency('VND')).toBe(true);
    });

    it('should return false for non-zero decimal currencies', () => {
      expect(isZeroDecimalCurrency('MYR')).toBe(false);
      expect(isZeroDecimalCurrency('USD')).toBe(false);
      expect(isZeroDecimalCurrency('EUR')).toBe(false);
    });

    it('should work with string normalization', () => {
      expect(isZeroDecimalCurrency('jpy')).toBe(true);
      expect(isZeroDecimalCurrency('  JPY  ')).toBe(true);
      expect(isZeroDecimalCurrency('myr')).toBe(false);
    });

    it('should return false for invalid currencies', () => {
      expect(isZeroDecimalCurrency('INVALID')).toBe(false);
      expect(isZeroDecimalCurrency('XYZ')).toBe(false);
    });
  });

  describe('minorUnitFactor', () => {
    it('should return correct factors for currencies', () => {
      expect(minorUnitFactor('MYR')).toBe(100); // 10^2
      expect(minorUnitFactor('USD')).toBe(100); // 10^2
      expect(minorUnitFactor('EUR')).toBe(100); // 10^2
      expect(minorUnitFactor('JPY')).toBe(1);   // 10^0
      expect(minorUnitFactor('KRW')).toBe(1);   // 10^0
      expect(minorUnitFactor('VND')).toBe(1);   // 10^0
    });

    it('should work with string normalization', () => {
      expect(minorUnitFactor('myr')).toBe(100);
      expect(minorUnitFactor('  JPY  ')).toBe(1);
    });

    it('should handle invalid currencies gracefully', () => {
      expect(minorUnitFactor('INVALID')).toBe(100); // Defaults to 2 decimals
    });
  });

  describe('toMinorUnits', () => {
    it('should convert major units to minor units correctly', () => {
      expect(toMinorUnits(12.34, 'USD')).toBe(1234);
      expect(toMinorUnits(100.00, 'MYR')).toBe(10000);
      expect(toMinorUnits(1.5, 'EUR')).toBe(150);
    });

    it('should handle zero decimal currencies', () => {
      expect(toMinorUnits(100, 'JPY')).toBe(100);
      expect(toMinorUnits(1000, 'KRW')).toBe(1000);
      expect(toMinorUnits(50000, 'VND')).toBe(50000);
    });

    it('should round to nearest minor unit', () => {
      expect(toMinorUnits(12.345, 'USD')).toBe(1235); // Rounds up
      expect(toMinorUnits(12.344, 'USD')).toBe(1234); // Rounds down
    });

    it('should work with string currencies', () => {
      expect(toMinorUnits(12.34, 'usd')).toBe(1234);
      expect(toMinorUnits(100, '  JPY  ')).toBe(100);
    });
  });

  describe('fromMinorUnits', () => {
    it('should convert minor units to major units correctly', () => {
      expect(fromMinorUnits(1234, 'USD')).toBe(12.34);
      expect(fromMinorUnits(10000, 'MYR')).toBe(100.00);
      expect(fromMinorUnits(150, 'EUR')).toBe(1.5);
    });

    it('should handle zero decimal currencies', () => {
      expect(fromMinorUnits(100, 'JPY')).toBe(100);
      expect(fromMinorUnits(1000, 'KRW')).toBe(1000);
      expect(fromMinorUnits(50000, 'VND')).toBe(50000);
    });

    it('should work with string currencies', () => {
      expect(fromMinorUnits(1234, 'usd')).toBe(12.34);
      expect(fromMinorUnits(100, '  JPY  ')).toBe(100);
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain precision for 2-decimal currencies', () => {
      const testAmounts = [12.34, 100.00, 0.01, 999.99];
      const currencies = ['MYR', 'USD', 'EUR'] as const;

      for (const amount of testAmounts) {
        for (const currency of currencies) {
          const minor = toMinorUnits(amount, currency);
          const back = fromMinorUnits(minor, currency);
          expect(Math.abs(back - amount)).toBeLessThan(0.01); // Allow small FP error
        }
      }
    });

    it('should maintain exact precision for zero decimal currencies', () => {
      const testAmounts = [100, 1000, 50000];
      const currencies = ['JPY', 'KRW', 'VND'] as const;

      for (const amount of testAmounts) {
        for (const currency of currencies) {
          const minor = toMinorUnits(amount, currency);
          const back = fromMinorUnits(minor, currency);
          expect(back).toBe(amount); // Exact precision for zero decimals
        }
      }
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols for currencies', () => {
      expect(getCurrencySymbol('MYR')).toBe('RM');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('JPY')).toBe('¥');
    });

    it('should return currency code as fallback', () => {
      // This tests the fallback behavior, though our SSOT should have all currencies
      const mockCurrency = 'TEST' as SupportedCurrency;
      expect(getCurrencySymbol(mockCurrency)).toBe('TEST');
    });
  });

  describe('Performance characteristics', () => {
    it('should use O(1) lookup for currency validation', () => {
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        isSupportedCurrency('MYR');
        isSupportedCurrency('USD');
        isSupportedCurrency('INVALID');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should be very fast for O(1) operations
      expect(duration).toBeLessThan(100); // Less than 100ms for 10k operations
    });

    it('should efficiently handle zero decimal currency checks', () => {
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        isZeroDecimalCurrency('JPY');
        isZeroDecimalCurrency('MYR');
        isZeroDecimalCurrency('KRW');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100); // Should be fast with Set lookup
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings gracefully', () => {
      expect(normalizeCurrency('')).toBeNull();
      expect(isSupportedCurrency('')).toBe(false);
      expect(isZeroDecimalCurrency('')).toBe(false);
    });

    it('should handle whitespace-only strings', () => {
      expect(normalizeCurrency('   ')).toBeNull();
      expect(normalizeCurrency('\t\n')).toBeNull();
    });

    it('should handle very small amounts in conversions', () => {
      expect(toMinorUnits(0.01, 'USD')).toBe(1);
      expect(fromMinorUnits(1, 'USD')).toBe(0.01);
    });

    it('should handle large amounts in conversions', () => {
      expect(toMinorUnits(999999.99, 'USD')).toBe(99999999);
      expect(fromMinorUnits(99999999, 'USD')).toBe(999999.99);
    });
  });
});
