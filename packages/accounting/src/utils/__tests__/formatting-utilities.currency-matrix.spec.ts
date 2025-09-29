import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyAccounting,
} from '../formatting-utilities';
import { getCurrencyDecimalsStrict } from '../accounting-utilities';

const locales = ['en-MY', 'en-SG', 'vi-VN', 'ja-JP'];
const amounts = [1234.5, -1234.5, 0, -0.01];
const currencies: Array<[any, number]> = [
  ['MYR', getCurrencyDecimalsStrict('MYR')],
  ['USD', getCurrencyDecimalsStrict('USD')],
  ['VND', getCurrencyDecimalsStrict('VND')], // many displays are 0-decimal in practice
  ['JPY', getCurrencyDecimalsStrict('JPY')], // zero-decimal currency
];

function expectNegativeStyle(s: string, style: 'minus' | 'parens', isNegative: boolean) {
  if (!isNegative) {
    expect(s.startsWith('-') || s.startsWith('(')).toBe(false);
    return;
  }
  if (style === 'parens') {
    expect(s.startsWith('(')).toBe(true);
    expect(s.endsWith(')')).toBe(true);
    expect(s.includes('-')).toBe(false);
  } else {
    expect(s.includes('-')).toBe(true);
    expect(s.startsWith('(') || s.endsWith(')')).toBe(false);
  }
}

describe('formatCurrency matrix', () => {
  for (const [currency, defaultDecimals] of currencies) {
    for (const locale of locales) {
      for (const amount of amounts) {
        it(`currency=${currency} locale=${locale} amount=${amount} (symbol)`, () => {
          const s = formatCurrency(amount, currency, locale, {
            decimals: defaultDecimals,
            showSymbol: true,
            showCode: false,
            negativeStyle: 'minus',
          });
          expect(typeof s).toBe('string');
          expectNegativeStyle(s, 'minus', amount < 0);
        });

        it(`currency=${currency} locale=${locale} amount=${amount} (code)`, () => {
          const s = formatCurrency(amount, currency, locale, {
            decimals: defaultDecimals,
            showSymbol: false,
            showCode: true,
            negativeStyle: 'minus',
          });
          expect(s).toContain(String(currency));
          expectNegativeStyle(s, 'minus', amount < 0);
        });

        it(`accounting parens currency=${currency} locale=${locale} amount=${amount}`, () => {
          const s = formatCurrencyAccounting(amount, currency, locale, {
            decimals: defaultDecimals,
          });
          expectNegativeStyle(s, 'parens', amount < 0);
        });
      }
    }
  }

  it('honors explicit decimals override (e.g., force 3dp)', () => {
    const s = formatCurrency(12.3456, 'USD', 'en-MY', { decimals: 3, showSymbol: true });
    // Locale may vary decimal char; verify 3 fractional digits exist
    expect(/\d[.,]\d{3}(?!\d)/.test(s)).toBe(true);
  });

  it('JPY should not show decimals when decimals=0', () => {
    const s = formatCurrency(1234.56, 'JPY', 'ja-JP', { decimals: getCurrencyDecimalsStrict('JPY') });
    // JPY with decimals=0 should show no decimal places (no decimal point followed by digits)
    expect(s).not.toMatch(/\.\d/);
    // Should contain the currency symbol and rounded number
    expect(s).toContain('￥');
  });
});
