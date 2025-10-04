/**
 * Variance reduction utilities for performance optimization
 */

export function reduceVariance<T extends number>(items: T[], _threshold: number = 0.1): T[] {
  if (items.length <= 1) return items;
  
  // Simple variance reduction - remove outliers
  const sorted = [...items].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  // eslint-disable-next-line security/detect-object-injection
  const q1 = sorted[q1Index];
  // eslint-disable-next-line security/detect-object-injection
  const q3 = sorted[q3Index];
  
  if (q1 === undefined || q3 === undefined) return items;
  
  const iqr = q3 - q1;
  
  return items.filter(item => {
    return item >= q1 - 1.5 * iqr && item <= q3 + 1.5 * iqr;
  });
}

export function optimizeBatchSize(totalItems: number, baseSize: number = 10): number {
  if (totalItems <= baseSize) return totalItems;
  
  // Optimize batch size based on total items
  const optimalSize = Math.min(Math.ceil(totalItems / Math.ceil(totalItems / baseSize)), baseSize * 2);
  return Math.max(optimalSize, baseSize);
}

// Additional exports for compatibility
export const varianceAttributes = (attrs?: Record<string, unknown>): Record<string, unknown> => attrs || {};
export const stabilizeRender = <T>(fn: () => T): T => fn();
export const useStableCallback = <T extends (...args: unknown[]) => unknown>(callback: T): T => callback;
