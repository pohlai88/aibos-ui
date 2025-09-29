import { describe, it, expect } from 'vitest';
import {
  ACCOUNTING_TIMEZONES,
  bucketizePeriods,
  bucketizeRolling,
  formatFiscalQuarterLabelLocalized,
} from '../date-utilities';

const KL = ACCOUNTING_TIMEZONES.MALAYSIA;
const FY_APR = new Date('2024-04-01T00:00:00Z');

describe('localized fiscal quarter labels', () => {
  it('vi-VN localized FYQ label', () => {
    const lbl = formatFiscalQuarterLabelLocalized(
      new Date('2024-07-20T12:00:00Z'), KL, FY_APR, 'vi-VN'
    );
    expect(lbl).toMatch(/^Quý 2 FY2024$/);
  });
});

describe('bucketizePeriods', () => {
  it('builds quarterly FY buckets with stable keys', () => {
    const buckets = bucketizePeriods({
      period: 'quarterly',
      start: new Date('2024-04-01T00:00:00Z'),
      end: new Date('2025-03-31T23:59:59Z'),
      timezone: KL,
      fiscalYearStart: FY_APR,
      fiscalQuarterMode: true,
      locale: 'en-US',
    });
    expect(buckets.length).toBeGreaterThanOrEqual(4);
    // Keys are ISO_DATETIME strings in target tz
    expect(typeof buckets[0].key).toBe('string');
    expect(buckets[0].key).toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}/);
    // Labels use FYQ phrasing
    expect(buckets[0].label).toMatch(/^FY2024 Q1$/);
  });
});

describe('bucketizeRolling', () => {
  it('last 6 months produce 6 buckets with increasing keys', () => {
    const buckets = bucketizeRolling({
      period: 'monthly',
      count: 6,
      timezone: KL,
      locale: 'vi-VN',
    });
    expect(buckets.length).toBe(6);
    const keys = buckets.map(b => b.key);
    expect([...keys].sort()).toEqual(keys); // already ascending
  });
});
