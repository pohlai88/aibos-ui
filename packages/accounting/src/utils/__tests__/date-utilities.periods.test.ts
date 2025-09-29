import { describe, it, expect } from 'vitest';
import {
  ACCOUNTING_TIMEZONES,
  getWeeklyRange,
  getMonthlyRange,
  getFiscalYearRange,
  getPeriodRange,
  enumeratePeriodsBetween,
  formatDate,
} from '../date-utilities';

const KL = ACCOUNTING_TIMEZONES.MALAYSIA; // Asia/Kuala_Lumpur
const NY = ACCOUNTING_TIMEZONES.UNITED_STATES_EAST; // America/New_York

function iso(date: Date, tz = KL) {
  return formatDate(date, 'ISO_DATETIME', tz); // for readable asserts
}

describe('weekly/monthly ranges (tz-aware)', () => {
  it('weekly (ISO weeks, Mon start) in KL', () => {
    const d = new Date('2024-01-17T10:00:00Z'); // Wed
    const { start, end } = getWeeklyRange(d, KL, { iso: true });
    expect(iso(start)).toMatch(/T00:00:00/);
    expect(iso(end)).toMatch(/T23:59:59\.999/);
  });

  it('monthly in New York respects local calendar', () => {
    const d = new Date('2024-02-15T15:45:00Z');
    const { start, end } = getMonthlyRange(d, NY);
    expect(iso(start, NY).slice(0,10)).toBe('2024-02-01');
    expect(iso(end, NY).slice(0,10)).toBe('2024-02-29'); // leap year
  });
});

describe('fiscal year ranges', () => {
  it('FY starts Apr 1 (KL)', () => {
    const fyStart = new Date('2024-04-01T00:00:00Z'); // template: month/day only
    const d = new Date('2024-03-31T16:00:00Z'); // still FY 2023 on local calendar
    const { start, end } = getFiscalYearRange(d, KL, fyStart);
    expect(iso(start, KL).slice(5,10)).toBe('04-01');
    // end should be Mar 31 next year 23:59:59.999 local
    expect(iso(end, KL).slice(5,10)).toBe('03-31');
  });
});

describe('enumerate periods', () => {
  it('enumerates weekly buckets covering a small window', () => {
    const start = new Date('2024-06-10T00:00:00Z');
    const end   = new Date('2024-06-25T00:00:00Z');
    const weeks = enumeratePeriodsBetween(start, end, 'weekly', KL, { isoWeek: true });
    expect(weeks.length).toBeGreaterThanOrEqual(2);
  });

  it('getPeriodRange dispatcher works with yearly vs FY', () => {
    const d = new Date('2024-05-05T00:00:00Z');
    const r1 = getPeriodRange({ period: 'yearly', date: d, timezone: KL });
    const fyStart = new Date('2024-04-01T00:00:00Z');
    const r2 = getPeriodRange({ period: 'yearly', date: d, timezone: KL, fiscalYearStart: fyStart });
    expect(r1.start.getTime()).not.toBe(r2.start.getTime());
  });
});
