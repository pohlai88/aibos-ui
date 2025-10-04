/**
 * Performance monitoring utilities
 */

let perfMode = false;

export function isPerfMode(): boolean {
  return perfMode;
}

export function setPerfMode(enabled: boolean): void {
  perfMode = enabled;
}

export function resetPerfMode(): void {
  perfMode = false;
}

export function measurePerformance<T>(fn: () => T, label?: string): T {
  if (!perfMode) return fn();
  
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (label) {
    console.log(`${label}: ${end - start}ms`);
  }
  
  return result;
}
