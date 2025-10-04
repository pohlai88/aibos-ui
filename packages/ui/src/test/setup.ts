/**
 * Test Setup - Enterprise Production Ready
 *
 * Global test configuration for comprehensive testing:
 * accessibility, performance, and component tests.
 */

import '@testing-library/jest-dom';
import { createSafeSet } from '../utils/internal';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

/**
 * matchMedia polyfill with proper "change" event behavior.
 * Libraries often rely on addEventListener('change', ...).
 */
const createMql = (query: string): MediaQueryList => {
  const listeners = createSafeSet<(e: Event) => void>();
  const mql: MediaQueryList = {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: (type: string, cb: (e: Event) => void) => {
      if (type === 'change') listeners.add(cb);
    },
    removeEventListener: (type: string, cb: (e: Event) => void) => {
      if (type === 'change') listeners.delete(cb);
    },
    // Legacy shims
    addListener: (cb: (e: Event) => void) => listeners.add(cb),
    removeListener: (cb: (e: Event) => void) => listeners.delete(cb),
    dispatchEvent: (e: Event) => {
      Array.from(listeners).forEach((cb: (e: Event) => void) => cb(e));
      // onchange handler if set
      if (typeof mql.onchange === 'function') mql.onchange(e as MediaQueryListEvent);
      return true;
    },
  } as unknown as MediaQueryList;
  return mql;
};

if (!('matchMedia' in window)) {
  vi.stubGlobal('matchMedia', (query: string) => createMql(query));
}

/**
 * IntersectionObserver mock with callback signature support.
 * We expose a helper to manually trigger intersections in tests if needed.
 */
type IOCallback = (entries: Array<Partial<IntersectionObserverEntry>>, observer: IntersectionObserver) => void;
class FakeIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  private _cb: IOCallback;
  // Registry + observed targets per instance
  static __registry: FakeIntersectionObserver[] = [];
  private _observed = new Set<Element>();
  constructor(cb: IntersectionObserverCallback) {
    // store with a thin adapter to accept Partial entries in tests
    this._cb = (entries) => cb(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
    // track instance for test helpers
    FakeIntersectionObserver.__registry.push(this);
  }
  observe = vi.fn((el: Element) => { this._observed.add(el); });
  unobserve = vi.fn((el: Element) => { this._observed.delete(el); });
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  /** Test helper to simulate an intersection change */
  __trigger(entries: Array<Partial<IntersectionObserverEntry>>) {
    this._cb(entries, this as unknown as IntersectionObserver);
  }
  /** Trigger only if this instance observed the target(s) */
  __triggerFor(entries: Array<Partial<IntersectionObserverEntry>>) {
    const filtered = entries.filter(e => e.target && this._observed.has(e.target));
    if (filtered.length) this.__trigger(filtered);
  }
}
vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver as unknown as typeof IntersectionObserver);
// Global test helpers for IntersectionObserver
vi.stubGlobal('__ioTriggerAll', (entries: Array<Partial<IntersectionObserverEntry>>) => {
  FakeIntersectionObserver.__registry.forEach((io) => io.__trigger(entries));
});
vi.stubGlobal('__ioGetObservers', () => [...FakeIntersectionObserver.__registry]);
// NEW: trigger only the observers watching the given targets
vi.stubGlobal('__ioTriggerFor', (entries: Array<Partial<IntersectionObserverEntry>>) => {
  FakeIntersectionObserver.__registry.forEach((io) => io.__triggerFor(entries));
});

/**
 * ResizeObserver mock with callback signature support.
 */
type ROCallback = (entries: Array<Partial<ResizeObserverEntry>>, observer: ResizeObserver) => void;
class FakeResizeObserver implements ResizeObserver {
  private _cb: ROCallback;
  private _observed = new Set<Element>();
  static __registry: FakeResizeObserver[] = [];
  constructor(cb: ResizeObserverCallback) {
    this._cb = (entries) => cb(entries as ResizeObserverEntry[], this);
    FakeResizeObserver.__registry.push(this);
  }
  observe = vi.fn((el: Element) => { this._observed.add(el); });
  unobserve = vi.fn((el: Element) => { this._observed.delete(el); });
  disconnect = vi.fn();
  /** Test helper */
  __trigger(entries: Array<Partial<ResizeObserverEntry>>) {
    this._cb(entries, this);
  }
  /** Trigger only if this instance observed the target(s) */
  __triggerFor(entries: Array<Partial<ResizeObserverEntry>>) {
    const filtered = entries.filter(e => e.target && this._observed.has(e.target));
    if (filtered.length) this.__trigger(filtered);
  }
}
vi.stubGlobal('ResizeObserver', FakeResizeObserver as unknown as typeof ResizeObserver);
// Global test helpers for ResizeObserver
vi.stubGlobal('__roTriggerAll', (entries: Array<Partial<ResizeObserverEntry>>) => {
  FakeResizeObserver.__registry.forEach((ro) => ro.__trigger(entries));
});
vi.stubGlobal('__roGetObservers', () => [...FakeResizeObserver.__registry]);
// NEW: trigger only the observers watching the given targets
vi.stubGlobal('__roTriggerFor', (entries: Array<Partial<ResizeObserverEntry>>) => {
  FakeResizeObserver.__registry.forEach((ro) => ro.__triggerFor(entries));
});

/**
 * Monotonic performance.now() & basic Performance API shims.
 */
{
  const t0 = Date.now();
  const perfShim = {
    now: vi.fn(() => Date.now() - t0),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  } as unknown as Performance;
  vi.stubGlobal('performance', perfShim);
}

/**
 * Animation frame shims
 */
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16));
vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));

/**
 * Common DOM shims used by UI libs and tests
 */
// No-op scroll APIs
if (!window.scrollTo) Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();

// Stable DOMRect & getBoundingClientRect for layout-sensitive tests
if (!('DOMRect' in window)) {
  class DOMRectShim implements DOMRect {
    bottom = 0; height = 0; left = 0; right = 0; top = 0; width = 0; x = 0; y = 0;
    toJSON() { return this; }
  }
  vi.stubGlobal('DOMRect', DOMRectShim as unknown as typeof DOMRect);
}
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
}

// Clipboard API
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      readText: vi.fn().mockResolvedValue(''),
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    writable: true,
    configurable: true,
  });
}

// Canvas getContext shim (avoid crashes in libs detecting canvas)
if (!HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
}

// MutationObserver (occasionally required by libs)
class FakeMutationObserver implements MutationObserver {
  constructor(_cb: MutationCallback) {}
  observe = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
vi.stubGlobal('MutationObserver', FakeMutationObserver as unknown as typeof MutationObserver);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test configuration
beforeAll(() => {
  // Set up global test environment
  vi.clearAllMocks();
});

// Restore all stubbed globals after the test suite
afterAll(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
