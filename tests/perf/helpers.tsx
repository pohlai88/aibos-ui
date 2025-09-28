/**
 * Performance Test Helpers - Micro Test-Rig Boost
 *
 * Pre-allocated native events and trimmed mean calculations
 * for stable performance testing.
 */

export function makeNativeEvents(element: Element) {
  return {
    input: new Event('input', { bubbles: true, cancelable: true }),
    click: new MouseEvent('click', { bubbles: true, cancelable: true }),
    change: new Event('change', { bubbles: true, cancelable: true }),
  };
}

export function runPerfLoop(function_: () => void, { samples = 40, warmup = 8, trim = 0.2 } = {}) {
  const times: number[] = [];
  for (let index = 0; index < warmup; index++) function_();
  for (let index = 0; index < samples; index++) {
    const t0 = performance.now();
    function_();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const cut = Math.floor(times.length * trim);
  const kept = times.slice(cut, times.length - cut);
  const mean = kept.reduce((s, x) => s + x, 0) / kept.length;
  const avg = mean;
  const variance = kept.reduce((s, x) => s + (x - avg) * (x - avg), 0) / kept.length;
  return { mean: avg, variance };
}
