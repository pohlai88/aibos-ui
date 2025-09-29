import { describe, it, expect } from 'vitest';
import {
  calculateNPV, calculateIRR,
  generateNPVSchedule, generateIRRSchedule,
} from '../financial-utilities';

describe('NPV schedule', () => {
  it('Matches closed-form NPV and accumulates correctly', () => {
    const cf = [-1000, 400, 400, 400, 400];
    const r = 0.10;
    const closed = calculateNPV(cf, r);

    const sched = generateNPVSchedule(cf, r);
    expect(sched.npv).toBeCloseTo(closed.npv, 8);

    // Check first/last rows
    expect(sched.rows[0].period).toBe(0);
    expect(sched.rows[0].presentValue).toBe(-1000);
    expect(sched.rows.at(-1)?.cumulativeNPV).toBeCloseTo(closed.npv, 8);
  });
});

describe('IRR schedule', () => {
  it('Converges on typical series and rows reflect IRR DF', () => {
    const cf = [-1000, 400, 400, 400, 400];
    const irrRes = calculateIRR(cf); // should converge > 0.1
    expect(irrRes.converged).toBe(true);
    expect(irrRes.irr).toBeGreaterThan(0.10);

    const sched = generateIRRSchedule(cf, { irr: irrRes.irr });
    expect(sched.converged).toBe(true);
    // When discounting at IRR, NPV ~ 0 → cumulative last row close to 0
    const lastCum = sched.rows.at(-1)?.cumulativeNPV ?? NaN;
    expect(lastCum).toBeCloseTo(0, 6);
  });

  it('Flags no real root when no sign change', () => {
    const cf = [-100, -50, -25];
    const irr = calculateIRR(cf);
    expect(irr.converged).toBe(false);
    expect(Number.isNaN(irr.irr)).toBe(true);

    const sched = generateIRRSchedule(cf);
    expect(sched.rows.length).toBe(0);
    expect(sched.converged).toBe(false);
  });
});
