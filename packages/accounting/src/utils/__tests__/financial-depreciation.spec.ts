import { describe, it, expect } from 'vitest';
import {
  calculateSumOfYearsDepreciation,
} from '../financial-utilities';

describe('Sum-of-Years-Digits depreciation', () => {
  it('Produces a full schedule and never dips below salvage', () => {
    const cost = 1000;
    const salvage = 100;
    const life = 4;
    const sched = calculateSumOfYearsDepreciation(cost, salvage, life);

    expect(sched).toHaveLength(life);
    // Ending value monotone non-increasing
    for (let i = 1; i < life; i++) {
      expect(sched[i].endingValue).toBeLessThanOrEqual(sched[i - 1].endingValue);
    }
    // Last ending value should be >= salvage (some implementations clamp to salvage exactly)
    expect(sched.at(-1)?.endingValue).toBeGreaterThanOrEqual(salvage - 1e-9);
  });
});
