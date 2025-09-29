import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  measureTime,
  measureAsyncTime,
  PerformanceTimer,
  Cache,
  createCache,
  batchProcessItems,
  processWithPerformanceRateLimit,
  PerformanceProfiler,
  createProfiler,
  getMemoryUsage,
  forceGC,
  MemoryMonitor,
  createMemoryMonitor,
  debounceWithMetrics,
  throttleWithMetrics
} from '../performance-utilities';

describe('Performance Utilities', () => {
  describe('measureTime', () => {
    it('should measure synchronous function execution', () => {
      const result = measureTime(() => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      }, 'test-operation');

      expect(result.result).toBe(499500); // Sum of 0 to 999
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metrics.operation).toBe('test-operation');
      expect(result.metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should include memory usage when available', () => {
      const result = measureTime(() => 'test', 'memory-test');
      
      expect(result.metrics.memoryUsage).toBeDefined();
      expect(typeof result.metrics.memoryUsage?.heapUsed).toBe('number');
    });
  });

  describe('measureAsyncTime', () => {
    it('should measure asynchronous function execution', async () => {
      const result = await measureAsyncTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'async-result';
      }, 'async-operation');

      expect(result.result).toBe('async-result');
      expect(result.duration).toBeGreaterThanOrEqual(40);
      expect(result.metrics.operation).toBe('async-operation');
    });
  });

  describe('PerformanceTimer', () => {
    let timer: PerformanceTimer;

    beforeEach(() => {
      timer = new PerformanceTimer('test-timer');
    });

    it('should track elapsed time', () => {
      const elapsed1 = timer.getElapsedTime();
      expect(elapsed1).toBeGreaterThanOrEqual(0);
      
      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }
      
      const elapsed2 = timer.getElapsedTime();
      expect(elapsed2).toBeGreaterThan(elapsed1);
    });

    it('should track memory usage', () => {
      const memoryUsage = timer.getMemoryUsage();
      expect(typeof memoryUsage.heapUsed).toBe('number');
      expect(typeof memoryUsage.rss).toBe('number');
    });

    it('should provide complete metrics', () => {
      const metrics = timer.getMetrics();
      expect(metrics.operation).toBe('test-timer');
      expect(metrics.duration).toBeGreaterThanOrEqual(0);
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.memoryUsage).toBeDefined();
    });

    it('should reset timer', () => {
      const elapsed1 = timer.getElapsedTime();
      
      timer.reset();
      
      const elapsed2 = timer.getElapsedTime();
      expect(elapsed2).toBeLessThan(elapsed1);
    });
  });

  describe('Cache', () => {
    let cache: Cache<string>;

    beforeEach(() => {
      cache = new Cache<string>({ ttl: 1000, maxSize: 10 });
    });

    afterEach(() => {
      cache.destroy();
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('missing')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should track cache statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('missing'); // Miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should enforce TTL', async () => {
      const shortCache = new Cache<string>({ ttl: 100 });
      
      shortCache.set('key1', 'value1');
      expect(shortCache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(shortCache.get('key1')).toBeUndefined();
      
      shortCache.destroy();
    });

    it('should enforce size limit', () => {
      const smallCache = new Cache<string>({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should evict key1
      
      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');
      
      smallCache.destroy();
    });
  });

  describe('batchProcessItems', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = async (batch: number[]) => batch.map(x => x * 2);
      
      const results = await batchProcessItems(items, processor, { batchSize: 2 });
      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should respect batch delay', async () => {
      const start = Date.now();
      const items = [1, 2, 3, 4];
      const processor = async (batch: number[]) => batch;
      
      await batchProcessItems(items, processor, { 
        batchSize: 2, 
        delay: 50 
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should respect concurrency limit', async () => {
      const start = Date.now();
      const items = Array(6).fill(0).map((_, i) => i);
      const processor = async (batch: number[]) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return batch;
      };
      
      await batchProcessItems(items, processor, { 
        batchSize: 2, 
        concurrency: 2 
      });
      
      const duration = Date.now() - start;
      // Should take at least 300ms (3 batches of 100ms each)
      expect(duration).toBeGreaterThanOrEqual(250);
    });
  });

  describe('processWithPerformanceRateLimit', () => {
    it('should respect rate limits', async () => {
      const start = Date.now();
      const items = [1, 2, 3, 4];
      const processor = async (item: number) => item * 2;
      
      const results = await processWithPerformanceRateLimit(items, processor, {
        requests: 2,
        windowMs: 1000
      });
      
      expect(results).toEqual([2, 4, 6, 8]);
      
      const duration = Date.now() - start;
      // Should take at least 1 second due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(900);
    });
  });

  describe('PerformanceProfiler', () => {
    let profiler: PerformanceProfiler;

    beforeEach(() => {
      profiler = new PerformanceProfiler({
        sampleRate: 1.0,
        maxSamples: 100,
        includeMemory: true
      });
    });

    it('should record performance samples', () => {
      profiler.record({
        duration: 100,
        timestamp: new Date(),
        operation: 'test-op'
      });
      
      const stats = profiler.getStats();
      expect(stats.totalSamples).toBe(1);
      expect(stats.averageDuration).toBe(100);
      expect(stats.operations['test-op']).toBe(1);
    });

    it('should calculate statistics correctly', () => {
      profiler.record({ duration: 50, timestamp: new Date(), operation: 'op1' });
      profiler.record({ duration: 100, timestamp: new Date(), operation: 'op1' });
      profiler.record({ duration: 150, timestamp: new Date(), operation: 'op2' });
      
      const stats = profiler.getStats();
      expect(stats.totalSamples).toBe(3);
      expect(stats.averageDuration).toBe(100);
      expect(stats.minDuration).toBe(50);
      expect(stats.maxDuration).toBe(150);
      expect(stats.operations['op1']).toBe(2);
      expect(stats.operations['op2']).toBe(1);
    });

    it('should enforce max samples', () => {
      for (let i = 0; i < 150; i++) {
        profiler.record({
          duration: i,
          timestamp: new Date(),
          operation: 'test'
        });
      }
      
      const stats = profiler.getStats();
      expect(stats.totalSamples).toBe(100); // Should be capped at maxSamples
    });

    it('should clear samples', () => {
      profiler.record({
        duration: 100,
        timestamp: new Date(),
        operation: 'test'
      });
      
      expect(profiler.getStats().totalSamples).toBe(1);
      
      profiler.clear();
      
      expect(profiler.getStats().totalSamples).toBe(0);
    });

    it('should export samples', () => {
      const sample = {
        duration: 100,
        timestamp: new Date(),
        operation: 'test'
      };
      
      profiler.record(sample);
      
      const exported = profiler.exportSamples();
      expect(exported).toHaveLength(1);
      expect(exported[0].duration).toBe(100);
    });
  });

  describe('Memory Utilities', () => {
    it('should get memory usage', () => {
      const usage = getMemoryUsage();
      
      expect(typeof usage.rss).toBe('number');
      expect(typeof usage.heapUsed).toBe('number');
      expect(typeof usage.heapTotal).toBe('number');
      expect(typeof usage.external).toBe('number');
      expect(typeof usage.arrayBuffers).toBe('number');
    });

    it('should force garbage collection if available', () => {
      // This test just ensures the function doesn't throw
      expect(() => forceGC()).not.toThrow();
    });
  });

  describe('MemoryMonitor', () => {
    let monitor: MemoryMonitor;

    beforeEach(() => {
      monitor = new MemoryMonitor(50); // Fast sampling for tests
    });

    afterEach(() => {
      monitor.stop();
    });

    it('should monitor memory usage', async () => {
      monitor.start();
      
      // Wait for at least one sample
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = monitor.getStats();
      expect(stats.current).toBeDefined();
      expect(stats.average).toBeDefined();
      expect(stats.peak).toBeDefined();
      expect(['increasing', 'decreasing', 'stable']).toContain(stats.trend);
    });

    it('should stop monitoring', () => {
      monitor.start();
      monitor.stop();
      
      // Should not throw when getting stats after stopping
      expect(() => monitor.getStats()).not.toThrow();
    });

    it('should clear samples', () => {
      monitor.start();
      monitor.clear();
      
      const stats = monitor.getStats();
      expect(stats.current).toBeDefined();
      expect(stats.average).toBeDefined();
    });
  });

  describe('Performance-enhanced utilities', () => {
    it('should debounce with metrics', async () => {
      const profiler = new PerformanceProfiler();
      let callCount = 0;
      
      const debouncedFn = debounceWithMetrics(
        () => { callCount++; },
        100,
        profiler
      );
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(callCount).toBe(1);
      
      const stats = profiler.getStats();
      expect(stats.totalSamples).toBeGreaterThan(0);
      
      profiler.clear();
    });

    it('should throttle with metrics', () => {
      const profiler = new PerformanceProfiler();
      let callCount = 0;
      
      const throttledFn = throttleWithMetrics(
        () => { callCount++; },
        100,
        profiler
      );
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1);
      
      const stats = profiler.getStats();
      expect(stats.totalSamples).toBeGreaterThan(0);
      
      profiler.clear();
    });
  });
});
