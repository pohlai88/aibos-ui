import { describe, it, expect } from 'vitest';
import {
  ACCOUNTING_TIMEZONES,
  formatPeriodLabel,
  formatISOWeekLabel,
  formatQuarterLabel,
  formatFiscalYearLabel,
  buildRollingWindows,
  getAdjacentPeriod,
  snapToPeriodStart,
  snapToPeriodEnd,
} from '../date-utilities';

const KL = ACCOUNTING_TIMEZONES.MALAYSIA;
const FY_APR = new Date('2024-04-01T00:00:00Z');

describe('labels', () => {
  it('daily/monthly/quarterly/weekly/yearly labels', () => {
    const anchor = new Date('2025-09-29T10:00:00Z');
    expect(formatPeriodLabel({ period: 'daily', anchor, timezone: KL })).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatPeriodLabel({ period: 'monthly', anchor, timezone: KL })).toMatch(/[A-Za-z]{3} 2025/);
    expect(formatPeriodLabel({ period: 'quarterly', anchor, timezone: KL })).toMatch(/^Q[1-4] 2025$/);
    expect(formatPeriodLabel({ period: 'weekly', anchor, timezone: KL, isoWeek: true })).toMatch(/^2025-W\d{2}$/);
    expect(formatPeriodLabel({ period: 'yearly', anchor, timezone: KL, fiscalYearStart: FY_APR })).toMatch(/^FY\d{4}$/);
    expect(formatISOWeekLabel(anchor, KL)).toMatch(/^2025-W\d{2}$/);
    expect(formatQuarterLabel(anchor, KL)).toMatch(/^Q[1-4] 2025$/);
  });

  it('fiscal year label uses start-year', () => {
    const d = new Date('2025-03-31T12:00:00Z'); // still FY2024 for Apr FY
    expect(formatFiscalYearLabel(d, KL, FY_APR)).toBe('FY2024');
  });
});

describe('rolling windows', () => {
  it('builds last 6 monthly windows', () => {
    const out = buildRollingWindows({ period: 'monthly', count: 6, timezone: KL });
    expect(out.length).toBe(6);
    expect(out[0].label <= out[5].label).toBe(true); // chronological
  });
});

describe('snap & navigation', () => {
  it('snaps to start/end and navigates previous/next', () => {
    const anchor = new Date('2025-09-15T10:00:00Z');
    const start = snapToPeriodStart(anchor, 'monthly', KL);
    const end = snapToPeriodEnd(anchor, 'monthly', KL);
    expect(start.getTime()).toBeLessThan(end.getTime());
    const prev = getAdjacentPeriod(anchor, 'previous', 'monthly', KL);
    const next = getAdjacentPeriod(anchor, 'next', 'monthly', KL);
    expect(prev.end.getTime()).toBeLessThan(next.start.getTime());
  });
});
