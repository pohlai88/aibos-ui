import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  delay,
  timeout,
  retry,
  parallel,
  sequential,
  race,
  allSettled,
  batchProcess,
  RateLimiter,
  createRateLimiter,
  throttle,
  debounce,
  memoize,
  Queue,
  createQueue,
  Pool,
  createPool,
  retryOnError,
  withCircuitBreaker,
  withFallback,
  withProgress
} from '../async-utilities';

describe('Async Utilities', () => {
  describe('delay', () => {
    it('should delay for specified time', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90);
      expect(end - start).toBeLessThan(200);
    });
  });

  describe('timeout', () => {
    it('should return result before timeout', async () => {
      const result = await timeout(
        Promise.resolve('success'),
        1000
      );
      
      expect(result).toBe('success');
    });

    it('should throw timeout error', async () => {
      await expect(timeout(
        new Promise(resolve => setTimeout(() => resolve('success'), 2000)),
        1000,
        'Custom timeout message'
      )).rejects.toThrow('Custom timeout message');
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const result = await retry(
        async () => 'success',
        { maxRetries: 3, delay: 10 }
      );
      
      expect(result).toBe('success');
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const result = await retry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        },
        { maxRetries: 3, delay: 10 }
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      await expect(retry(
        async () => {
          throw new Error('Persistent failure');
        },
        { maxRetries: 2, delay: 10 }
      )).rejects.toThrow('Persistent failure');
    });

    it('should respect retry condition', async () => {
      await expect(retry(
        async () => {
          throw new Error('Non-retryable error');
        },
        { 
          maxRetries: 2, 
          delay: 10,
          retryCondition: (error) => !error.message.includes('Non-retryable')
        }
      )).rejects.toThrow('Non-retryable error');
    });
  });

  describe('parallel', () => {
    it('should execute promises in parallel', async () => {
      const promises = [
        delay(50).then(() => 'first'),
        delay(30).then(() => 'second'),
        delay(40).then(() => 'third')
      ];
      
      const results = await parallel(promises, 2);
      expect(results).toEqual(['first', 'second', 'third']);
    });

    it('should respect concurrency limit', async () => {
      const start = Date.now();
      const promises = Array(5).fill(null).map((_, i) => 
        delay(100).then(() => i)
      );
      
      await parallel(promises, 2);
      const duration = Date.now() - start;
      
      // Should take at least 300ms (3 batches of 100ms each)
      expect(duration).toBeGreaterThanOrEqual(250);
    });
  });

  describe('sequential', () => {
    it('should execute promises sequentially', async () => {
      const results: number[] = [];
      const promises = [
        delay(50).then(() => { results.push(1); return 1; }),
        delay(30).then(() => { results.push(2); return 2; }),
        delay(40).then(() => { results.push(3); return 3; })
      ];
      
      const output = await sequential(promises);
      expect(output).toEqual([1, 2, 3]);
      expect(results).toEqual([1, 2, 3]); // Should be in order
    });
  });

  describe('race', () => {
    it('should return first resolved promise', async () => {
      const promises = [
        delay(100).then(() => 'slow'),
        delay(50).then(() => 'fast'),
        delay(150).then(() => 'slowest')
      ];
      
      const result = await race(promises);
      expect(result).toBe('fast');
    });
  });

  describe('allSettled', () => {
    it('should return all settled results', async () => {
      const promises = [
        Promise.resolve('success'),
        Promise.reject(new Error('failure')),
        Promise.resolve('another success')
      ];
      
      const results = await allSettled(promises);
      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('batchProcess', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = async (batch: number[]) => batch.map(x => x * 2);
      
      const results = await batchProcess(items, processor, { batchSize: 2 });
      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should respect batch delay', async () => {
      const start = Date.now();
      const items = [1, 2, 3, 4];
      const processor = async (batch: number[]) => batch;
      
      await batchProcess(items, processor, { 
        batchSize: 2, 
        delay: 100 
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(100); // At least one delay
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000
      });
    });

    it('should allow requests within limit', async () => {
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      
      expect(rateLimiter.getRemainingRequests()).toBe(0);
    });

    it('should block requests exceeding limit', async () => {
      const start = Date.now();
      
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      
      // Third request should be delayed
      await rateLimiter.acquire();
      
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(900); // Should wait ~1 second
    });

    it('should reset window after time', async () => {
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      
      // Wait for window to reset
      await delay(1100);
      
      expect(rateLimiter.getRemainingRequests()).toBe(2);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const throttledFn = throttle(
        () => { callCount++; },
        { delay: 100, leading: true, trailing: false }
      );
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1); // Only first call should execute
      
      await delay(150);
      expect(callCount).toBe(1); // No trailing call
    });

    it('should support trailing calls', async () => {
      let callCount = 0;
      const throttledFn = throttle(
        () => { callCount++; },
        { delay: 100, leading: false, trailing: true }
      );
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(0); // No leading call
      
      await delay(150);
      expect(callCount).toBe(1); // One trailing call
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const debouncedFn = debounce(
        () => { callCount++; },
        { delay: 100, leading: false, trailing: true }
      );
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0);
      
      await delay(150);
      expect(callCount).toBe(1); // Only last call should execute
    });

    it('should support leading calls', async () => {
      let callCount = 0;
      const debouncedFn = debounce(
        () => { callCount++; },
        { delay: 100, leading: true, trailing: false }
      );
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(1); // First call should execute
      
      await delay(150);
      expect(callCount).toBe(1); // No trailing call
    });
  });

  describe('memoize', () => {
    it('should memoize function results', () => {
      let callCount = 0;
      const expensiveFn = memoize((x: number) => {
        callCount++;
        return x * 2;
      });
      
      expect(expensiveFn(5)).toBe(10);
      expect(expensiveFn(5)).toBe(10);
      expect(callCount).toBe(1); // Should only call once
    });

    it('should respect TTL', async () => {
      let callCount = 0;
      const memoizedFn = memoize(
        (x: number) => {
          callCount++;
          return x * 2;
        },
        { ttl: 100 }
      );
      
      expect(memoizedFn(5)).toBe(10);
      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(1);
      
      await delay(150);
      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(2); // Should call again after TTL
    });

    it('should respect size limit', () => {
      const memoizedFn = memoize(
        (x: number) => x * 2,
        { maxSize: 2 }
      );
      
      memoizedFn(1);
      memoizedFn(2);
      memoizedFn(3); // Should evict first entry
      
      expect(memoizedFn(1)).toBe(2); // Should recalculate
    });
  });

  describe('Queue', () => {
    let queue: Queue<number>;

    beforeEach(() => {
      queue = new Queue(async (item) => {
        await delay(10);
        return item * 2;
      }, 2);
    });

    it('should process items in queue', async () => {
      const results: number[] = [];
      const processor = async (item: number) => {
        await delay(10);
        results.push(item * 2);
      };
      
      const testQueue = new Queue(processor, 1);
      
      await testQueue.add(1);
      await testQueue.add(2);
      await testQueue.add(3);
      
      // Wait for processing to complete
      await delay(100);
      
      expect(results).toEqual([2, 4, 6]);
    });

    it('should track queue length', () => {
      expect(queue.getLength()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('Pool', () => {
    let pool: Pool<string>;

    beforeEach(() => {
      pool = new Pool(
        async () => `resource-${Date.now()}`,
        { minSize: 1, maxSize: 3, acquireTimeoutMs: 1000 }
      );
    });

    it('should acquire and release resources', async () => {
      const resource = await pool.acquire();
      expect(resource).toBeDefined();
      
      pool.release(resource);
      
      const stats = pool.getStats();
      expect(stats.available).toBe(1);
      expect(stats.inUse).toBe(0);
    });

    it('should create new resources up to max size', async () => {
      const resource1 = await pool.acquire();
      const resource2 = await pool.acquire();
      const resource3 = await pool.acquire();
      
      expect(resource1).toBeDefined();
      expect(resource2).toBeDefined();
      expect(resource3).toBeDefined();
      
      const stats = pool.getStats();
      expect(stats.total).toBe(3);
    });

    it('should timeout on acquire when pool is full', async () => {
      // Fill the pool
      const resources = await Promise.all([
        pool.acquire(),
        pool.acquire(),
        pool.acquire()
      ]);
      
      // This should timeout
      await expect(pool.acquire()).rejects.toThrow('Pool acquire timeout');
      
      // Clean up
      resources.forEach(resource => pool.release(resource));
    });
  });

  describe('retryOnError', () => {
    it('should retry on specific errors', async () => {
      let attempts = 0;
      const result = await retryOnError(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Network error');
          }
          return 'success';
        },
        ['Network error'],
        3
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      await expect(retryOnError(
        async () => {
          throw new Error('Validation error');
        },
        ['Network error'],
        3
      )).rejects.toThrow('Validation error');
    });
  });

  describe('withCircuitBreaker', () => {
    it('should open circuit after failures', async () => {
      let callCount = 0;
      const failingFn = async () => {
        callCount++;
        throw new Error('Service failure');
      };
      
      const breaker = withCircuitBreaker(failingFn, 2, 1000);
      
      // First two failures
      await expect(breaker()).rejects.toThrow();
      await expect(breaker()).rejects.toThrow();
      
      // Should be open now
      await expect(breaker()).rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('withFallback', () => {
    it('should use fallback on primary failure', async () => {
      const primaryFn = async () => {
        throw new Error('Primary failed');
      };
      
      const fallbackFn = async () => 'fallback success';
      
      const result = await withFallback(primaryFn, fallbackFn, 1000);
      expect(result).toBe('fallback success');
    });

    it('should use primary on success', async () => {
      const primaryFn = async () => 'primary success';
      const fallbackFn = async () => 'fallback success';
      
      const result = await withFallback(primaryFn, fallbackFn, 1000);
      expect(result).toBe('primary success');
    });
  });

  describe('withProgress', () => {
    it('should call progress callback', async () => {
      const progressCalls: number[] = [];
      
      const result = await withProgress(
        async () => 'success',
        (progress) => progressCalls.push(progress)
      );
      
      expect(result).toBe('success');
      expect(progressCalls).toContain(0);
      expect(progressCalls).toContain(100);
    });
  });
});
