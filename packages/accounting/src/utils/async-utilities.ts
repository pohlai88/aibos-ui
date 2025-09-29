/**
 * Async & Promise Utilities - Phase 3 Implementation
 * 
 * Comprehensive async operation utilities for accounting applications.
 * Provides patterns for handling asynchronous operations efficiently.
 * 
 * Features:
 * - Promise utilities (delay, timeout, retry)
 * - Parallel and sequential execution
 * - Rate limiting and throttling
 * - Debouncing and memoization
 * - Promise pooling and batching
 * - Async error handling
 */

import { createBusinessError } from './error-utilities';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AsyncRetryOptions {
  maxRetries: number;
  delay: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
}

export interface ThrottleOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface DebounceOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface MemoizeOptions {
  ttl?: number;
  maxSize?: number;
  keyGenerator?: (...args: unknown[]) => string;
}

export interface BatchOptions {
  batchSize: number;
  delay?: number; // Delay between batches in milliseconds
  concurrency?: number; // Concurrent batches
}

export interface PoolOptions {
  minSize: number;
  maxSize: number;
  acquireTimeoutMs?: number;
  releaseTimeoutMs?: number;
}

// ============================================================================
// BASIC ASYNC UTILITIES
// ============================================================================

/**
 * Create a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add timeout to any promise
 */
export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutMessage || `Operation timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  function_: () => Promise<T>,
  options: AsyncRetryOptions
): Promise<T> {
  const {
    maxRetries,
    delay: initialDelay,
    backoffMultiplier = 2,
    maxDelay = 30000,
    retryCondition = () => true
  } = options;

  let lastError: Error;
  let currentDelay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await function_();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries || !retryCondition(lastError)) {
        throw lastError;
      }

      await delay(currentDelay);
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

// ============================================================================
// PARALLEL EXECUTION UTILITIES
// ============================================================================

/**
 * Execute promises in parallel with concurrency limit
 */
export async function parallel<T>(
  promises: Promise<T>[],
  concurrency: number = 5
): Promise<T[]> {
  if (promises.length === 0) return [];
  
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (let index = 0; index < promises.length; index++) {
    const promise = promises[index];
    if (!promise) continue; // Skip if promise is undefined
    
    const wrappedPromise = promise.then(result => {
      results[index] = result;
    });
    
    executing.push(wrappedPromise);
    
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        const index = executing.findIndex(p => p === wrappedPromise);
        if (index >= 0) {
          executing.splice(index, 1);
        }
      }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * Execute promises sequentially
 */
export async function sequential<T>(
  promises: Promise<T>[]
): Promise<T[]> {
  const results: T[] = [];
  
  for (const promise of promises) {
    const result = await promise;
    results.push(result);
  }
  
  return results;
}

/**
 * Execute promises and return the first one that resolves
 */
export async function race<T>(promises: Promise<T>[]): Promise<T> {
  return Promise.race(promises);
}

/**
 * Execute all promises and return settled results
 */
export async function allSettled<T>(
  promises: Promise<T>[]
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(promises);
}

/**
 * Execute promises in batches
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  options: BatchOptions
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
      const index = executing.findIndex(p => p === promise);
      if (index >= 0) {
        executing.splice(index, 1);
      }
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
export async function processWithRateLimit<T, R>(
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
        return processWithRateLimit(items.slice(items.indexOf(item)), processor, rateLimit);
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
// RATE LIMITING & THROTTLING
// ============================================================================

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(private options: RateLimiterOptions) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    // Remove old requests
    this.requests = this.requests.filter(time => time > windowStart);
    
    if (this.requests.length >= this.options.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = oldestRequest + this.options.windowMs - now;
      
      if (waitTime > 0) {
        await delay(waitTime);
        return this.acquire();
      }
    }
    
    this.requests.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    this.requests = this.requests.filter(time => time > windowStart);
    return this.options.maxRequests - this.requests.length;
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.options.windowMs;
  }
}

/**
 * Create a rate limiter
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  function_: T,
  options: ThrottleOptions
): T {
  const { delay, leading = true, trailing = true } = options;
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      if (leading) {
        lastCallTime = now;
        return function_(...args);
      }
    }

    if (trailing) {
      lastArgs = args;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          if (lastArgs) {
            lastCallTime = Date.now();
            function_(...lastArgs);
            lastArgs = null;
          }
          timeoutId = null;
        }, delay - timeSinceLastCall);
      }
    }
  }) as T;
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  function_: T,
  options: DebounceOptions
): T {
  const { delay, leading = false, trailing = true, maxWait } = options;
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (leading && timeSinceLastCall >= delay) {
      lastCallTime = now;
      return function_(...args);
    }

    if (trailing) {
      lastArgs = args;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          lastCallTime = Date.now();
          function_(...lastArgs);
          lastArgs = null;
        }
        timeoutId = null;
      }, delay);
    }

    if (maxWait && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        if (lastArgs) {
          lastCallTime = Date.now();
          function_(...lastArgs);
          lastArgs = null;
        }
        maxTimeoutId = null;
      }, maxWait);
    }
  }) as T;
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Memoize function with TTL and size limits
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  function_: T,
  options: MemoizeOptions = {}
): T {
  const { ttl, maxSize = 1000, keyGenerator = (...args) => JSON.stringify(args) } = options;
  const cache = new Map<string, { value: unknown; timestamp: number }>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const now = Date.now();
    
    // Check cache
    const cached = cache.get(key);
    if (cached) {
      if (!ttl || (now - cached.timestamp) < ttl) {
        return cached.value;
      }
      cache.delete(key);
    }

    // Execute function
    const result = function_(...args);
    
    // Store in cache
    cache.set(key, { value: result, timestamp: now });
    
    // Enforce size limit
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

// ============================================================================
// QUEUE & POOL UTILITIES
// ============================================================================

/**
 * Async queue implementation
 */
export class Queue<T> {
  private items: T[] = [];
  private processing = false;
  private concurrency: number;
  private processor: (item: T) => Promise<void>;

  constructor(
    processor: (item: T) => Promise<void>,
    concurrency: number = 5
  ) {
    this.processor = processor;
    this.concurrency = concurrency;
  }

  async add(item: T): Promise<void> {
    this.items.push(item);
    this.process();
  }

  async addBatch(items: T[]): Promise<void> {
    this.items.push(...items);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    while (this.items.length > 0) {
      const batch = this.items.splice(0, this.concurrency);
      await Promise.all(batch.map(item => this.processor(item)));
    }
    
    this.processing = false;
  }

  getLength(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Create an async queue
 */
export function createQueue<T>(
  processor: (item: T) => Promise<void>,
  concurrency: number = 5
): Queue<T> {
  return new Queue(processor, concurrency);
}

/**
 * Object pool for async operations
 */
export class Pool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private waiting: Array<{
    resolve: (item: T) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];

  constructor(
    private factory: () => Promise<T>,
    private options: PoolOptions
  ) {}

  async acquire(): Promise<T> {
    // Return available item if exists
    if (this.available.length > 0) {
      const item = this.available.pop()!;
      this.inUse.add(item);
      return item;
    }

    // Create new item if under max size
    if (this.inUse.size < this.options.maxSize) {
      const item = await this.factory();
      this.inUse.add(item);
      return item;
    }

    // Wait for available item
    return new Promise<T>((resolve, reject) => {
      const timeoutMs = this.options.acquireTimeoutMs || 30000;
      const timeoutId = setTimeout(() => {
        const index = this.waiting.findIndex(w => w.resolve === resolve);
        if (index >= 0) {
          this.waiting.splice(index, 1);
          reject(new Error('Pool acquire timeout'));
        }
      }, timeoutMs);

      this.waiting.push({
        resolve: (item: T) => {
          clearTimeout(timeoutId);
          resolve(item);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        timestamp: Date.now()
      });
    });
  }

  release(item: T): void {
    if (!this.inUse.has(item)) {
      throw createBusinessError(
        'ITEM_NOT_IN_USE',
        'Item not in use',
        String(item),
        { operation: 'release-pool-item' }
      );
    }

    this.inUse.delete(item);

    // Notify waiting requests
    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift()!;
      waiter.resolve(item);
      return;
    }

    // Return to available pool
    this.available.push(item);
  }

  getStats(): {
    available: number;
    inUse: number;
    waiting: number;
    total: number;
  } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      waiting: this.waiting.length,
      total: this.available.length + this.inUse.size
    };
  }
}

/**
 * Create an object pool
 */
export function createPool<T>(
  factory: () => Promise<T>,
  options: PoolOptions
): Pool<T> {
  return new Pool(factory, options);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Execute function with retry on specific errors
 */
export async function retryOnError<T>(
  function_: () => Promise<T>,
  retryableErrors: (Error | string)[],
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await function_();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isRetryable = retryableErrors.some(retryableError => {
        if (typeof retryableError === 'string') {
          return lastError.message.includes(retryableError);
        }
        return lastError instanceof retryableError.constructor;
      });
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await delay(Math.pow(2, attempt) * 1000);
    }
  }
  
  throw lastError!;
}

/**
 * Execute function with circuit breaker pattern
 */
export function withCircuitBreaker<T>(
  function_: () => Promise<T>,
  failureThreshold: number = 5,
  recoveryTimeout: number = 60000
): () => Promise<T> {
  let failures = 0;
  let lastFailureTime = 0;
  let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  return async (): Promise<T> => {
    if (state === 'OPEN') {
      if (Date.now() - lastFailureTime > recoveryTimeout) {
        state = 'HALF_OPEN';
      } else {
        throw createBusinessError(
          'CIRCUIT_BREAKER_OPEN',
          'Circuit breaker is OPEN',
          'circuitBreaker',
          { operation: 'circuit-breaker-check' }
        );
      }
    }

    try {
      const result = await function_();
      failures = 0;
      state = 'CLOSED';
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = Date.now();
      
      if (failures >= failureThreshold) {
        state = 'OPEN';
      }
      
      throw error;
    }
  };
}

/**
 * Execute function with timeout and fallback
 */
export async function withFallback<T>(
  primaryFunction: () => Promise<T>,
  fallbackFunction: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  try {
    return await timeout(primaryFunction(), timeoutMs);
  } catch (_error) {
    return await fallbackFunction();
  }
}

/**
 * Execute function with progress callback
 */
export async function withProgress<T>(
  function_: () => Promise<T>,
  onProgress: (progress: number) => void
): Promise<T> {
  // Simple implementation - can be enhanced based on specific needs
  onProgress(0);
  
  try {
    const result = await function_();
    onProgress(100);
    return result;
  } catch (error) {
    onProgress(100);
    throw error;
  }
}
