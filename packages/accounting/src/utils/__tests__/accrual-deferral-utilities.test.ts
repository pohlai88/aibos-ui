import { describe, it, expect } from 'vitest';

import {
  createAccrualTransaction,
  createDeferralTransaction,
  createAccrualSchedule,
  createDeferralSchedule,
  calculateAccrualAmount,
  generateAccrualEntry,
  generateDeferralEntry,
  type AccrualSchedule,
  type DeferralSchedule,
} from '../accrual-deferral-utilities';

import type { SupportedCurrency } from '../accounting-utilities';

// Small helper for equality on money with decimals
const eq = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

describe('Accrual & Deferral Utilities', () => {
  describe('Daily schedule (gap-free, reconciles)', () => {
    it('builds 3 contiguous daily entries and reconciles total', () => {
      const currency: SupportedCurrency = 'MYR';
      const txn = createAccrualTransaction(
        'Daily accrual test',
        300, // total
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '6000',
        '2100',
        currency
      );

      const schedule = createAccrualSchedule(txn, {
        method: 'straight-line',
        includeReversingEntries: true,
        reversalDelay: 1,
        autoPost: false,
      });

      expect(schedule.entries.length).toBe(3);

      // Contiguity: next.start = prev.end + 1 day
      for (let i = 1; i < schedule.entries.length; i++) {
        const prev = schedule.entries[i - 1]!.period;
        const curr = schedule.entries[i]!.period;
        const nextStart = new Date(prev.endDate);
        nextStart.setDate(nextStart.getDate() + 1);
        expect(curr.startDate.toDateString()).toBe(nextStart.toDateString());
      }

      // Reconciliation
      const total = sum(schedule.entries.map(e => e.amount));
      expect(eq(total, schedule.totalAmount)).toBe(true);
    });
  });

  describe('Weekly schedule (inclusive end, truncated final period)', () => {
    it('splits into 3 weekly-ish periods and reconciles', () => {
      const currency: SupportedCurrency = 'MYR';
      const txn = createAccrualTransaction(
        'Weekly accrual test',
        900,
        new Date('2025-01-01'), // Wed
        new Date('2025-01-20'),
        '6000',
        '2100',
        currency
      );

      const schedule = createAccrualSchedule(txn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      expect(schedule.entries.length).toBe(3);
      // Periods should be:
      // 1) Jan 01 - Jan 07
      // 2) Jan 08 - Jan 14
      // 3) Jan 15 - Jan 20 (truncated to end)
      const [p1, p2, p3] = schedule.entries.map(e => e.period);

      expect(p1.startDate.toDateString()).toBe(new Date('2025-01-01').toDateString());
      expect(p1.endDate.toDateString()).toBe(new Date('2025-01-07').toDateString());

      expect(p2.startDate.toDateString()).toBe(new Date('2025-01-08').toDateString());
      expect(p2.endDate.toDateString()).toBe(new Date('2025-01-14').toDateString());

      expect(p3.startDate.toDateString()).toBe(new Date('2025-01-15').toDateString());
      expect(p3.endDate.toDateString()).toBe(new Date('2025-01-20').toDateString());

      const total = sum(schedule.entries.map(e => e.amount));
      expect(eq(total, schedule.totalAmount)).toBe(true);
    });
  });

  describe('Monthly schedule (calendar-aware stepping)', () => {
    it('respects calendar boundaries and reconciles', () => {
      const currency: SupportedCurrency = 'MYR';
      const txn = createAccrualTransaction(
        'Monthly accrual test',
        1000,
        new Date('2025-01-15'),
        new Date('2025-03-15'), // Extended to Mar 15 to get 3 periods
        '6000',
        '2100',
        currency
      );

      const schedule = createAccrualSchedule(txn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      // Expect periods: 
      // 1) Jan 15 – Feb 14
      // 2) Feb 15 – Mar 14
      // 3) Mar 15 – Mar 15 (single day)
      expect(schedule.entries.length).toBe(3);

      const [p1, p2, p3] = schedule.entries.map(e => e.period);
      expect(p1.startDate.toDateString()).toBe(new Date('2025-01-15').toDateString());
      expect(p1.endDate.toDateString()).toBe(new Date('2025-02-14').toDateString());

      expect(p2.startDate.toDateString()).toBe(new Date('2025-02-15').toDateString());
      expect(p2.endDate.toDateString()).toBe(new Date('2025-03-14').toDateString());

      expect(p3.startDate.toDateString()).toBe(new Date('2025-03-15').toDateString());
      expect(p3.endDate.toDateString()).toBe(new Date('2025-03-15').toDateString());

      const total = sum(schedule.entries.map(e => e.amount));
      expect(eq(total, schedule.totalAmount)).toBe(true);
    });
  });

  describe('Single-day schedule', () => {
    it('produces one entry that matches the total', () => {
      const txn = createAccrualTransaction(
        'One-day',
        123.45,
        new Date('2025-02-10'),
        new Date('2025-02-10'),
        '6000',
        '2100',
        'MYR'
      );
      const schedule = createAccrualSchedule(txn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      expect(schedule.entries.length).toBe(1);
      expect(eq(schedule.entries[0]!.amount, schedule.totalAmount)).toBe(true);
      expect(schedule.entries[0]!.period.startDate.toDateString()).toBe('Mon Feb 10 2025');
      expect(schedule.entries[0]!.period.endDate.toDateString()).toBe('Mon Feb 10 2025');
    });
  });

  describe('As-of accrual calculation (inclusive by end date)', () => {
    it('includes entry when as-of equals period end date', () => {
      const txn = createAccrualTransaction(
        'As-of test',
        300,
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '6000',
        '2100',
        'MYR'
      );
      const schedule = createAccrualSchedule(txn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      const asOf = schedule.entries[0]!.period.endDate; // end of first day
      const accrued = calculateAccrualAmount(schedule, asOf);
      // One third of 300 (rounded to currency within the module)
      const expected = schedule.entries[0]!.amount;
      expect(eq(accrued, expected)).toBe(true);
    });
  });

  describe('Deferral schedule parity (amounts & timing)', () => {
    it('mirrors accrual periods and amounts for the same inputs', () => {
      const currency: SupportedCurrency = 'MYR';
      const start = new Date('2025-04-05');
      const end = new Date('2025-06-01');

      const accrualTxn = createAccrualTransaction('A', 1234.56, start, end, '6000', '2100', currency);
      const deferralTxn = createDeferralTransaction('D', 1234.56, start, end, '4000', '3100', currency);

      const accrual = createAccrualSchedule(accrualTxn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });
      const deferral = createDeferralSchedule(deferralTxn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      expect(deferral.entries.length).toBe(accrual.entries.length);
      for (let i = 0; i < accrual.entries.length; i++) {
        const ae = accrual.entries[i]!;
        const de = deferral.entries[i]!;
        expect(ae.period.startDate.toDateString()).toBe(de.period.startDate.toDateString());
        expect(ae.period.endDate.toDateString()).toBe(de.period.endDate.toDateString());
        expect(eq(ae.amount, de.amount)).toBe(true);
      }

      expect(eq(sum(accrual.entries.map(e => e.amount)), accrual.totalAmount)).toBe(true);
      expect(eq(sum(deferral.entries.map(e => e.amount)), deferral.totalAmount)).toBe(true);
    });
  });

  describe('Zero-decimal currency (e.g., VND)', () => {
    it('reconciles exactly with no fractional cents', () => {
      const currency: SupportedCurrency = 'VND'; // zero-decimal in your SSOT
      const total = 1_000_001; // odd number to exercise residue handling
      const txn = createAccrualTransaction(
        'Zero-decimal',
        total,
        new Date('2025-07-01'),
        new Date('2025-07-10'),
        '6000',
        '2100',
        currency
      );

      const schedule = createAccrualSchedule(txn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      // No entry should contain fractional amounts after roundToCurrency
      for (const e of schedule.entries) {
        expect(Number.isInteger(e.amount)).toBe(true);
      }
      expect(sum(schedule.entries.map(e => e.amount))).toBe(total);
    });
  });

  describe('Journal entry generation sanity (accrual & deferral)', () => {
    it('produces balanced JEs for a given period', () => {
      const txn = createAccrualTransaction(
        'JE build',
        1000,
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '6000', // expense
        '2100', // accrual liability
        'MYR'
      );
      const accrual = createAccrualSchedule(txn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      const p = accrual.entries[0]!.period;
      const jeA = generateAccrualEntry(accrual as AccrualSchedule, p);
      expect(eq(jeA.totalDebits, jeA.totalCredits)).toBe(true);

      const defTxn = createDeferralTransaction(
        'JE build def',
        1000,
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '4800', // deferred revenue control
        '3000', // revenue
        'MYR'
      );
      const def = createDeferralSchedule(defTxn, {
        method: 'straight-line',
        includeReversingEntries: false,
        reversalDelay: 0,
        autoPost: false,
      });

      const p2 = def.entries[0]!.period;
      const jeD = generateDeferralEntry(def as DeferralSchedule, p2);
      expect(eq(jeD.totalDebits, jeD.totalCredits)).toBe(true);
    });
  });
});