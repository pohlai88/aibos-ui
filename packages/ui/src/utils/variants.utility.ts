import type { ClassValue } from 'clsx';

import { cn } from './cn.utility';
import { isPerfMode } from './perf.utility';
import { type VariantProps, cva } from 'class-variance-authority';

/**
 * Re-export CVA for component variant management
 *
 * This provides a centralized way to create variant systems
 * using class-variance-authority with consistent patterns.
 */
export { cva as variants, type VariantProps };

/**
 * Compose a CVA instance with `cn` so `className` can be passed and merged safely.
 * Keeps this utility token-agnostic; actual classes should come from DESIGN_TOKENS elsewhere.
 *
 * In perf mode, returns a stable function to avoid variant computation variance.
 */
// Accept any prop shape returned by cva; avoid 'unknown' which conflicts with CVA's ClassProp
export function composeVariants<T extends (props?: unknown) => string>(
  v: T,
): (
  props?: (Parameters<T>[0] extends undefined ? {} : NonNullable<Parameters<T>[0]>) & {
    className?: ClassValue;
  },
) => string {
  type P = Parameters<T>[0];

  // In perf mode, return a stable function to avoid recomputation variance
  if (isPerfMode()) {
    return (props?: (P extends undefined ? {} : NonNullable<P>) & { className?: ClassValue }) => {
      const { className, ...rest } = (props ?? {}) as { className?: ClassValue } & Record<
        string,
        unknown
      >;
      // If there are no props (or v expects undefined), pass undefined to satisfy (props?: undefined)
      const hasRest = Object.keys(rest).length > 0;
      const out = v(hasRest ? (rest as P) : undefined);
      return cn(out, className);
    };
  }

  return (props?: (P extends undefined ? {} : NonNullable<P>) & { className?: ClassValue }) => {
    const { className, ...rest } = (props ?? {}) as { className?: ClassValue } & Record<
      string,
      unknown
    >;
    // If there are no props (or v expects undefined), pass undefined to satisfy (props?: undefined)
    const hasRest = Object.keys(rest).length > 0;
    const out = v(hasRest ? (rest as P) : undefined);
    return cn(out, className);
  };
}

/**
 * Define a CVA and immediately get a composed helper that merges `className`.
 * Usage:
 *   const button = defineVariants({ base: '...', variants: {...} });
 *   <button className={button({ variant: 'primary', className: 'mt-2' })} />
 */
export function defineVariants(
  ...arguments_: Parameters<typeof cva>
): ReturnType<typeof composeVariants> {
  const v = cva(...arguments_); // (props?: ClassProp) => string
  return composeVariants(v as (props?: unknown) => string); // now accepts the CVA function type cleanly
}

/**
 * Utility type to infer variant prop shape from a CVA instance.
 */
export type VariantOf<T extends (_props?: unknown) => unknown> = VariantProps<T>;

// Notes:
// - Keep this file free of hardcoded Tailwind or design tokens (SSOT compliance).
// - Prefer `defineVariants` in new components; legacy code can adopt `composeVariants`.
// - Merging order is deliberate: CVA output → caller className (last-wins), resolved by `cn`.
// - `base` now accepts ClassValue for conditional/array bases without extra casts.
