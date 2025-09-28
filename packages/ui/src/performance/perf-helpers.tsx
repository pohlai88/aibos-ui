/**
 * Performance Test Helpers - Enterprise Production Ready
 *
 * Utilities for performance testing with variance reduction
 * and deterministic behavior.
 */

import type * as React from 'react';

import { render as rtlRender, cleanup } from '@testing-library/react';
import { resetPerfMode } from '../utils/perf.utility';

// Pin timers for deterministic performance measurements
const FIXED_NOW = 42_000;
if (typeof globalThis !== 'undefined' && 'vi' in globalThis) {
  const vi = (
    globalThis as unknown as {
      vi: {
        spyOn: (
          object: unknown,
          method: string,
        ) => {
          mockImplementation: (function_: () => number) => void;
          mockReturnValue: (value: number) => void;
        };
      };
    }
  ).vi;
  vi.spyOn(Date, 'now').mockImplementation(() => FIXED_NOW);
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
}
// Best-effort: disable React DevTools overhead in perf runs
// (harmless if absent)
// @ts-ignore
if (typeof globalThis !== 'undefined' && !globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__?.isDisabled) {
  // @ts-ignore
  globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    inject() {},
    onCommitFiberRoot() {},
    onCommitFiberUnmount() {},
  };
}

/**
 * Render with performance mode enabled
 */
export function renderPerf(ui: React.ReactElement): unknown {
  resetPerfMode();
  if (typeof document !== 'undefined' && document.body) {
    document.body.dataset.perf = '1';
  }
  const result = rtlRender(ui);
  // Provide a cleanup that also clears perf flag
  const unmountPerf = () => {
    result.unmount();
    cleanup();
    if (typeof document !== 'undefined' && document.body) {
      delete document.body.dataset.perf;
    }
  };
  // Attach helper for convenience
  // @ts-ignore
  result.unmountPerf = unmountPerf;
  return result;
}

/**
 * Wrap test with performance mode
 */
export function withPerfMode<T>(function_: () => T): T {
  const originalPerf = typeof document !== 'undefined' ? document.body.dataset.perf : undefined;
  try {
    resetPerfMode();
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.perf = '1';
    }
    return function_();
  } finally {
    if (typeof document !== 'undefined' && document.body) {
      if (originalPerf) document.body.dataset.perf = originalPerf;
      else delete document.body.dataset.perf;
    }
  }
}

/**
 * Async version (useful for tests with await)
 */
export async function withPerfModeAsync<T>(function_: () => Promise<T>): Promise<T> {
  const originalPerf = typeof document !== 'undefined' ? document.body.dataset.perf : undefined;
  try {
    resetPerfMode();
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.perf = '1';
    }
    return await function_();
  } finally {
    if (typeof document !== 'undefined' && document.body) {
      if (originalPerf) document.body.dataset.perf = originalPerf;
      else delete document.body.dataset.perf;
    }
  }
}

/**
 * Pre-allocated native events for maximum performance
 */
export function makeNativeEvents(_element: Element): {
  input: Event;
  change: Event;
  click: MouseEvent;
} {
  return {
    input: new Event('input', { bubbles: true, cancelable: true }),
    change: new Event('change', { bubbles: true, cancelable: true }),
    click: new MouseEvent('click', { bubbles: true, cancelable: true }),
  };
}

/**
 * Run performance loop with trimmed mean calculation
 */
export function runPerfLoop(
  function_: () => void,
  {
    samples = 40,
    warmup = 8,
    trim = 0.2,
  }: { samples?: number; warmup?: number; trim?: number } = {},
): {
  mean: number;
  variance: number;
  stddev: number;
  cv: number;
  samples: number;
  warmup: number;
  trim: number;
} {
  const t: number[] = [];

  // Warm up
  for (let index = 0; index < warmup; index++) function_();

  // Measure
  for (let index = 0; index < samples; index++) {
    const s = performance.now();
    function_();
    t.push(performance.now() - s);
  }

  // Trimmed mean calculation
  t.sort((a, b) => a - b);
  const k = Math.floor(t.length * trim);
  const m = t.slice(k, t.length - k);
  const mean = m.reduce((p, c) => p + c, 0) / m.length;
  const variance = m.reduce((p, c) => p + (c - mean) * (c - mean), 0) / m.length;
  const stddev = Math.sqrt(variance);
  const cv = mean > 0 ? (stddev / mean) * 100 : 0;
  return { mean, variance, stddev, cv, samples, warmup, trim };
}

/**
 * Handy assertion helper for performance metrics
 */
export function expectUnder(
  metric: { mean: number; stddev: number; cv?: number },
  { meanMs, cvPct }: { meanMs?: number; cvPct?: number },
): void {
  if (typeof globalThis !== 'undefined' && 'expect' in globalThis) {
    const expect = (
      globalThis as unknown as {
        expect: (value: number) => {
          toBeLessThanOrEqual: (value: number) => void;
        };
      }
    ).expect;
    if (meanMs != undefined) expect(metric.mean).toBeLessThanOrEqual(meanMs);
    if (cvPct != undefined)
      expect(metric.cv ?? (metric.stddev / metric.mean) * 100).toBeLessThanOrEqual(cvPct);
  }
}
