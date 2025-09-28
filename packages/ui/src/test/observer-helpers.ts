/**
 * Observer Test Helpers
 *
 * Utilities for triggering observer callbacks in tests
 * for deterministic testing of intersection and resize behavior.
 */
// NOTE: Types come from the DOM lib — do NOT import from 'vitest'
// import type { IntersectionObserverEntry, ResizeObserverEntry } from 'dom'; // ambient

/** small util to make a DOMRectReadOnly-like object */
const rect = (w = 0, h = 0): DOMRectReadOnly => ({
  x: 0,
  y: 0,
  width: w,
  height: h,
  top: 0,
  right: w,
  bottom: h,
  left: 0,
  toJSON() {
    return this;
  },
});

const now = () => (typeof performance?.now === 'function' ? performance.now() : Date.now());

/**
 * Create a mock IntersectionObserverEntry for testing
 */
export const createIntersectionEntry = (
  target: Element,
  isIntersecting: boolean = true,
  intersectionRatio: number = 1
): Partial<IntersectionObserverEntry> => {
  const br = rect(100, 100);
  return {
    target,
    isIntersecting,
    intersectionRatio,
    boundingClientRect: br,
    intersectionRect: isIntersecting ? br : rect(0, 0),
    rootBounds: rect(1000, 1000),
    time: now(),
  };
};

export const createResizeEntry = (
  target: Element,
  width: number = 100,
  height: number = 100
): Partial<ResizeObserverEntry> => ({
  target,
  contentRect: {
    x: 0, y: 0, width, height, top: 0, right: width, bottom: height, left: 0,
    toJSON() { return this as any; }
  } as unknown as DOMRectReadOnly,
  borderBoxSize: [{ inlineSize: width, blockSize: height }],
  contentBoxSize: [{ inlineSize: width, blockSize: height }],
  devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
});

/**
 * Helper to trigger all IntersectionObserver callbacks in tests
 * Uses the global __ioTriggerAll helper for deterministic testing
 */
export const triggerAllIntersections = (
  entries: Array<Partial<IntersectionObserverEntry>>
) => {
  // Guard against missing globals
  const fn = (globalThis as any).__ioTriggerAll;
  if (typeof fn === 'function') {
    fn(entries);
  } else {
    // best-effort fallback: try to trigger a fresh fake instance if available
    try {
      const io = new (window as any).IntersectionObserver(() => {});
      if (typeof (io as any).__trigger === 'function') (io as any).__trigger(entries);
    } catch {
      // noop
    }
  }
};

/**
 * Trigger ONLY observers that currently observe the target(s) present in the entries.
 * Each entry MUST include the target element it pertains to.
 */
export const triggerIntersectionsForTargets = (
  entries: Array<Partial<IntersectionObserverEntry>>
) => {
  const fn = (globalThis as any).__ioTriggerFor;
  if (typeof fn === 'function') {
    fn(entries);
  } else {
    // Fallback: narrow-trigger not supported; degrade to triggerAll
    triggerAllIntersections(entries);
  }
};

/**
 * Helper to trigger all ResizeObserver callbacks in tests
 * Uses the global __roTriggerAll helper for deterministic testing
 */
export const triggerAllResizes = (
  entries: Array<Partial<ResizeObserverEntry>>
) => {
  const fn = (globalThis as any).__roTriggerAll;
  if (typeof fn === 'function') {
    fn(entries);
  } else {
    try {
      const ro = new (window as any).ResizeObserver(() => {});
      if (typeof (ro as any).__trigger === 'function') (ro as any).__trigger(entries);
    } catch {
      // noop
    }
  }
};

/**
 * Trigger ONLY ResizeObservers that observe the target(s) present in the entries.
 */
export const triggerResizesForTargets = (
  entries: Array<Partial<ResizeObserverEntry>>
) => {
  const fn = (globalThis as any).__roTriggerFor;
  if (typeof fn === 'function') {
    fn(entries);
  } else {
    triggerAllResizes(entries);
  }
};

export const simulateViewportChange = (width: number, height: number) => {
  // Update window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  // Keep client metrics in sync for libs that read them
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true, value: width,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true, value: height,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

export const simulateMediaQueryChange = (query: string, matches: boolean) => {
  const mql = window.matchMedia(query);
  // Try to set matches (polyfills usually make this writable)
  try {
    // @ts-expect-error polyfill may allow write
    mql.matches = matches;
  } catch {
    // ignore if native/readonly; firing change still helps listeners
  }
  const evt = new Event('change');
  try {
    // polyfill supports dispatchEvent
    (mql as any).dispatchEvent?.(evt);
  } catch {
    // ignore
  }
  // Legacy onchange handler
  if (typeof (mql as any).onchange === 'function') (mql as any).onchange(evt);
};