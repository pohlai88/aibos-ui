/**
 * Performance Mode Utility
 *
 * Provides runtime detection of performance testing mode
 * to enable zero-cost optimizations during performance tests.
 */

// Cache perf mode state to avoid repeated DOM queries
let _perfModeCache: boolean | undefined = undefined;
let _perfModeChecked = false;

export function isPerfMode(): boolean {
  // Only check once per test run to eliminate variance
  if (!_perfModeChecked) {
    try {
      _perfModeCache = typeof document !== 'undefined' && document.body?.dataset?.perf === '1';
    } catch {
      _perfModeCache = false;
    }
    _perfModeChecked = true;
  }
  return _perfModeCache ?? false;
}

// Reset function for tests
export function resetPerfMode(): void {
  _perfModeCache = undefined;
  _perfModeChecked = false;
}
