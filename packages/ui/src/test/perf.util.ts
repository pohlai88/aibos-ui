export type Stats = { runs: number[]; median: number; p95: number; mean: number };

const median = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid]! : (a[mid - 1]! + a[mid]!) / 2;
};

const p = (arr: number[], pct: number): number => {
  if (arr.length === 0) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(a.length - 1, Math.max(0, Math.ceil((pct / 100) * a.length) - 1));
  return a[idx]!;
};

export async function bench(fn: () => void | Promise<void>, opts?: { warmup?: number; iterations?: number }): Promise<Stats> {
  const warmup = opts?.warmup ?? 5;
  const iterations = opts?.iterations ?? 20;
  // Warmup
  for (let i = 0; i < warmup; i++) await fn();
  // Measure
  const runs: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await fn();
    const t1 = performance.now();
    runs.push(t1 - t0);
  }
  const m = median(runs);
  const p95 = p(runs, 95);
  const mean = runs.reduce((s, v) => s + v, 0) / runs.length;
  return { runs, median: m, p95, mean };
}

export const withGc = async (cb: () => void | Promise<void>) => {
  // Only works if Node is started with --expose-gc
  const g: any = globalThis as any;
  if (typeof g.gc === 'function') g.gc();
  await cb();
  if (typeof g.gc === 'function') g.gc();
};
