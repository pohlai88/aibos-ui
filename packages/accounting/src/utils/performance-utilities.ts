/**
 * Performance Utilities - Phase 3 Implementation
 * 
 * Comprehensive performance monitoring and optimization utilities.
 * Provides tools for measuring, caching, and optimizing application performance.
 * 
 * Features:
 * - Performance measurement and timing
 * - Caching with TTL and size limits
 * - Batch processing utilities
 * - Memory usage monitoring
 * - Performance profiling
 * - Optimization helpers
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PerformanceMetrics {
  duration: number;
  memoryUsage?: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  timestamp: Date;
  operation: string;
  metadata?: Record<string, unknown>;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export interface PerformanceBatchOptions {
  batchSize: number;
  delay?: number; // Delay between batches in milliseconds
  concurrency?: number; // Concurrent batches
}

export interface ProfilerOptions {
  sampleRate?: number; // Sampling rate (0-1)
  maxSamples?: number; // Maximum samples to keep
  includeMemory?: boolean; // Include memory usage
}

// ============================================================================
// PERFORMANCE MEASUREMENT
// ============================================================================

/**
 * Measure execution time of a synchronous function
 */
export function measureTime<T>(
  function_: () => T,
  operation: string = 'operation'
): { result: T; duration: number; metrics: PerformanceMetrics } {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  const result = function_();
  
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage();
  
  const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
  const memoryUsage = {
    rss: endMemory.rss - startMemory.rss,
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external,
    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
  };
  
  const metrics: PerformanceMetrics = {
    duration,
    memoryUsage,
    timestamp: new Date(),
    operation
  };
  
  return { result, duration, metrics };
}

/**
 * Measure execution time of an asynchronous function
 */
export async function measureAsyncTime<T>(
  function_: () => Promise<T>,
  operation: string = 'async-operation'
): Promise<{ result: T; duration: number; metrics: PerformanceMetrics }> {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  const result = await function_();
  
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage();
  
  const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
  const memoryUsage = {
    rss: endMemory.rss - startMemory.rss,
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external,
    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
  };
  
  const metrics: PerformanceMetrics = {
    duration,
    memoryUsage,
    timestamp: new Date(),
    operation
  };
  
  return { result, duration, metrics };
}

/**
 * Create a performance timer
 */
export class PerformanceTimer {
  private startTime: bigint;
  private startMemory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  private operation: string;

  constructor(operation: string = 'timer') {
    this.operation = operation;
    this.startTime = process.hrtime.bigint();
    this.startMemory = process.memoryUsage();
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    const currentTime = process.hrtime.bigint();
    return Number(currentTime - this.startTime) / 1_000_000;
  }

  /**
   * Get memory usage delta
   */
  getMemoryUsage(): {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  } {
    const currentMemory = process.memoryUsage();
    return {
      rss: currentMemory.rss - this.startMemory.rss,
      heapUsed: currentMemory.heapUsed - this.startMemory.heapUsed,
      heapTotal: currentMemory.heapTotal - this.startMemory.heapTotal,
      external: currentMemory.external - this.startMemory.external,
      arrayBuffers: currentMemory.arrayBuffers - this.startMemory.arrayBuffers
    };
  }

  /**
   * Get complete metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      duration: this.getElapsedTime(),
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date(),
      operation: this.operation
    };
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = process.hrtime.bigint();
    this.startMemory = process.memoryUsage();
  }

  /**
   * End the timer (no-op for compatibility)
   */
  end(): void {
    // No-op - timer automatically tracks elapsed time
  }
}

// ============================================================================
// CACHING UTILITIES
// ============================================================================

/**
 * Simple in-memory cache with TTL and size limits
 */
export class Cache<T> {
  private cache = new Map<string, { value: T; timestamp: number; ttl?: number }>();
  private stats = { hits: 0, misses: 0 };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private options: CacheOptions = {}) {
    const { cleanupInterval = 60000 } = options;
    
    if (cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, cleanupInterval);
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const itemTtl = ttl || this.options.ttl;
    
    this.cache.set(key, {
      value,
      timestamp: now,
      ...(itemTtl !== undefined && { ttl: itemTtl })
    });

    // Enforce size limit
    if (this.options.maxSize && this.cache.size > this.options.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: this.options.maxSize || Infinity,
      hitRate
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.ttl && now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * Create a cache instance
 */
export function createCache<T>(options: CacheOptions = {}): Cache<T> {
  return new Cache<T>(options);
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process items in batches with optional delay and concurrency
 */
export async function batchProcessItems<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  options: PerformanceBatchOptions
): Promise<R[]> {
  const { batchSize, delay: batchDelay = 0, concurrency = 1 } = options;
  const results: R[] = [];
  
  // Split items into batches
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }
  
  // Process batches with concurrency limit
  const executing: Promise<R[]>[] = [];
  
  for (const batch of batches) {
    const promise = processor(batch);
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      const batchResults = await Promise.race(executing);
      results.push(...batchResults);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
    
    // Add delay between batches if specified
    if (batchDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }
  
  // Process remaining batches
  if (executing.length > 0) {
    const remainingResults = await Promise.all(executing);
    results.push(...remainingResults.flat());
  }
  
  return results;
}

/**
 * Process items with rate limiting
 */
export async function processWithPerformanceRateLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  rateLimit: { requests: number; windowMs: number }
): Promise<R[]> {
  const results: R[] = [];
  const requestTimes: number[] = [];
  
  for (const item of items) {
    const now = Date.now();
    const windowStart = now - rateLimit.windowMs;
    
    // Remove old requests
    const validRequests = requestTimes.filter(time => time > windowStart);
    requestTimes.length = 0;
    requestTimes.push(...validRequests);
    
    // Wait if rate limit exceeded
    if (requestTimes.length >= rateLimit.requests) {
      const oldestRequest = Math.min(...requestTimes);
      const waitTime = oldestRequest + rateLimit.windowMs - now;
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return processWithPerformanceRateLimit(items.slice(items.indexOf(item)), processor, rateLimit);
      }
    }
    
    // Process item
    const result = await processor(item);
    results.push(result);
    requestTimes.push(Date.now());
  }
  
  return results;
}

// ============================================================================
// PERFORMANCE PROFILING
// ============================================================================

/**
 * Performance profiler for tracking multiple operations
 */
export class PerformanceProfiler {
  private samples: PerformanceMetrics[] = [];
  private options: ProfilerOptions;

  constructor(options: ProfilerOptions = {}) {
    this.options = {
      sampleRate: 1.0,
      maxSamples: 1000,
      includeMemory: true,
      ...options
    };
  }

  /**
   * Record a performance sample
   */
  record(metrics: PerformanceMetrics): void {
    // Apply sampling
    if (Math.random() > this.options.sampleRate!) {
      return;
    }

    this.samples.push(metrics);

    // Enforce max samples
    if (this.samples.length > this.options.maxSamples!) {
      this.samples.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalSamples: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    p99Duration: number;
    operations: Record<string, number>;
  } {
    if (this.samples.length === 0) {
      return {
        totalSamples: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        operations: {}
      };
    }

    const durations = this.samples.map(s => s.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    
    const operations: Record<string, number> = {};
    this.samples.forEach(sample => {
      operations[sample.operation] = (operations[sample.operation] || 0) + 1;
    });

    return {
      totalSamples: this.samples.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: sortedDurations[Math.floor(sortedDurations.length * 0.95)] ?? 0,
      p99Duration: sortedDurations[Math.floor(sortedDurations.length * 0.99)] ?? 0,
      operations
    };
  }

  /**
   * Clear all samples
   */
  clear(): void {
    this.samples = [];
  }

  /**
   * Start a performance timer
   */
  startTimer(operation: string): PerformanceTimer {
    return new PerformanceTimer(operation);
  }

  /**
   * Get metrics (alias for getStats for compatibility)
   */
  getMetrics() {
    return this.getStats();
  }

  /**
   * Export samples for analysis
   */
  exportSamples(): PerformanceMetrics[] {
    return [...this.samples];
  }
}

/**
 * Create a performance profiler
 */
export function createProfiler(options: ProfilerOptions = {}): PerformanceProfiler {
  return new PerformanceProfiler(options);
}

// ============================================================================
// MEMORY UTILITIES
// ============================================================================

/**
 * Get current memory usage
 */
export function getMemoryUsage(): {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
} {
  return process.memoryUsage();
}

/**
 * Force garbage collection (if available)
 */
export function forceGC(): void {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Monitor memory usage over time
 */
export class MemoryMonitor {
  private samples: Array<{
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  }> = [];
  private interval?: NodeJS.Timeout;

  constructor(private sampleInterval: number = 5000) {}

  /**
   * Start monitoring
   */
  start(): void {
    this.interval = setInterval(() => {
      this.samples.push(getMemoryUsage());
    }, this.sampleInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      delete this.interval;
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    current: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
      arrayBuffers: number;
    };
    average: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
      arrayBuffers: number;
    };
    peak: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
      arrayBuffers: number;
    };
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.samples.length === 0) {
      const current = getMemoryUsage();
      return {
        current,
        average: current,
        peak: current,
        trend: 'stable'
      };
    }

    const current = this.samples[this.samples.length - 1]!;
    const average = this.samples.reduce((accumulator, sample) => ({
      rss: accumulator.rss + sample.rss,
      heapUsed: accumulator.heapUsed + sample.heapUsed,
      heapTotal: accumulator.heapTotal + sample.heapTotal,
      external: accumulator.external + sample.external,
      arrayBuffers: accumulator.arrayBuffers + sample.arrayBuffers
    }), { rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 });

    const sampleCount = this.samples.length;
    average.rss /= sampleCount;
    average.heapUsed /= sampleCount;
    average.heapTotal /= sampleCount;
    average.external /= sampleCount;
    average.arrayBuffers /= sampleCount;

    const peak = this.samples.reduce((accumulator, sample) => ({
      rss: Math.max(accumulator.rss, sample.rss),
      heapUsed: Math.max(accumulator.heapUsed, sample.heapUsed),
      heapTotal: Math.max(accumulator.heapTotal, sample.heapTotal),
      external: Math.max(accumulator.external, sample.external),
      arrayBuffers: Math.max(accumulator.arrayBuffers, sample.arrayBuffers)
    }), { rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 });

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.samples.length >= 2) {
      const first = this.samples[0]!;
      const last = this.samples[this.samples.length - 1]!;
      const diff = last.heapUsed - first.heapUsed;
      const threshold = first.heapUsed * 0.1; // 10% threshold
      
      if (diff > threshold) trend = 'increasing';
      else if (diff < -threshold) trend = 'decreasing';
    }

    return { current, average, peak, trend };
  }

  /**
   * Clear samples
   */
  clear(): void {
    this.samples = [];
  }
}

/**
 * Create a memory monitor
 */
export function createMemoryMonitor(sampleInterval: number = 5000): MemoryMonitor {
  return new MemoryMonitor(sampleInterval);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debounce function with performance tracking
 */
export function debounceWithMetrics<T extends (...args: unknown[]) => unknown>(
  function_: T,
  delay: number,
  profiler?: PerformanceProfiler
): T {
  let timeoutId: NodeJS.Timeout;
  let lastCallTime = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (profiler) {
      profiler.record({
        duration: now - lastCallTime,
        timestamp: new Date(),
        operation: 'debounce-delay'
      });
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      lastCallTime = Date.now();
      function_(...args);
    }, delay);
  }) as T;
}

/**
 * Throttle function with performance tracking
 */
export function throttleWithMetrics<T extends (...args: unknown[]) => unknown>(
  function_: T,
  delay: number,
  profiler?: PerformanceProfiler
): T {
  let lastCallTime = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime >= delay) {
      if (profiler) {
        profiler.record({
          duration: now - lastCallTime,
          timestamp: new Date(),
          operation: 'throttle-execution'
        });
      }
      
      lastCallTime = now;
      function_(...args);
    }
  }) as T;
}
