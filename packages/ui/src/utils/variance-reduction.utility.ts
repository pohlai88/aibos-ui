/**
 * Variance Reduction Utilities - Surgical Approach
 *
 * Utilities to reduce performance variance in components
 * by stabilizing render timing and reducing jitter.
 */

import { isPerfMode } from './perf.utility';
import * as React from 'react';

/**
 * Creates variance-safe attributes for perf mode components.
 * Uses data attributes to avoid Tailwind/clsx churn.
 */
export function varianceAttributes(
  extra?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  // Only attach in perf mode; otherwise return empty object to avoid key churn
  const isPerf = typeof document !== 'undefined' && document.body?.dataset?.perf === '1';
  if (!isPerf) return {};
  return { 'data-perf-stable': '1', ...(extra ?? {}) };
}

/**
 * Stabilizes component rendering by reducing timing variance
 * in performance test environments.
 */
export function stabilizeRender<T extends React.ComponentType<unknown>>(
  Component: T,
  options: {
    displayName?: string;
    skipMemo?: boolean;
  } = {},
): T {
  if (!isPerfMode()) {
    return Component;
  }

  const StabilizedComponent = React.memo(
    React.forwardRef<unknown, unknown>((props, reference) => {
      // Pre-allocate common props to reduce object creation variance
      const stableProperties = React.useMemo(
        () => ({
          ...(props as Record<string, unknown>),
          ref: reference,
        }),
        [props, reference],
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for React.createElement with dynamic components
      return React.createElement(Component, stableProperties as any);
    }),
  ) as unknown as T;

  if (options.displayName) {
    StabilizedComponent.displayName = options.displayName;
  }

  return StabilizedComponent;
}

/**
 * Creates a stable callback that doesn't change between renders
 * to reduce variance from callback recreation.
 */
export function useStableCallback<T extends (...arguments_: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList = [],
): T {
  // Always call hooks at the top level - React rules of hooks
  const stableCallback = React.useRef<T>(callback);
  const isPerf = isPerfMode();

  // Update the ref on every render
  stableCallback.current = callback;

  // Always call useCallback, but with different dependencies based on perf mode
  const perfCallback = React.useCallback(
    ((...arguments_: unknown[]) => stableCallback.current(...arguments_)) as T,
    [], // Empty deps for maximum stability
  );

  const normalCallback = React.useCallback(callback, [callback, ...deps]);

  return isPerf ? perfCallback : normalCallback;
}
