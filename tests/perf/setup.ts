// Ensures every perf test runs in perf mode
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  document.body.dataset.perf = '1';
});

afterEach(() => {
  delete document.body.dataset.perf;
});

// Disable React DevTools hooks (saves a few ms jitter)
// @ts-ignore
globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  isDisabled: true,
  inject() {},
  onCommitFiberRoot() {},
  onCommitFiberUnmount() {},
};

// Freeze sources of jitter (Date/Math.random) in perf tests only
let _now = Date.now();
const fixedNow = _now;
vi.spyOn(Date, 'now').mockImplementation(() => fixedNow);
vi.spyOn(Math, 'random').mockReturnValue(0.42);
