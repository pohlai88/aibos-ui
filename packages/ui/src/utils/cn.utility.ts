import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge, twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names with Tailwind CSS conflict resolution
 *
 * This function combines clsx for conditional classes and tailwind-merge
 * for intelligent Tailwind class merging and conflict resolution.
 *
 * @param inputs - Class values to merge
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4', { 'bg-red-500': isError })
 * // Returns: 'py-1 px-4 bg-red-500' (px-2 is overridden by px-4)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Pure clsx alias (no Tailwind conflict resolution).
 * Useful when you want to preserve all classes verbatim (e.g., debugging).
 */
export const cx = (...inputs: ClassValue[]): string => clsx(inputs);

/**
 * Factory to create a project- or package-scoped `cn` with an extended tailwind-merge config.
 * This lets you add custom class groups (e.g., density/intents/a11y) without changing call sites.
 *
 * @example
 * const cnUI = makeCn({ classGroups: { density: [{ density: ['compact','cozy','comfortable'] }] } });
 * cnUI('density-compact', 'density-comfortable'); // -> 'density-comfortable'
 */
export function makeCn(
  config?: Parameters<typeof extendTailwindMerge>[0],
): (..._inputs: ClassValue[]) => string {
  if (!config) return cn;
  const tw = extendTailwindMerge(config);
  return (...inputs: ClassValue[]): string => tw(clsx(inputs));
}

// NOTE:
// - Keep this file free of hardcoded design tokens or Tailwind values.
// - If you introduce semantic class groups (e.g., intent-success), add them via makeCn(...) where used.
