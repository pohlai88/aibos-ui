/**
 * Caching Utilities - Phase 2 Implementation
 * 
 * Provides comprehensive caching mechanisms and strategies for performance
 * optimization across the accounting domain.
 * 
 * Features:
 * - CacheManager for centralized cache management
 * - Multiple cache strategies (LRU, LFU, TTL, etc.)
 * - Cache invalidation and eviction policies
 * - Distributed caching support
 * - Cache metrics and monitoring
 * - Cache warming and preloading
 */

// Removed unused imports to keep the surface clean and avoid lint warnings.

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  strategy?: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  enableMetrics?: boolean;
  enableLogging?: boolean;
  /** Optional metrics hooks for observability */
  hooks?: Partial<CacheMetricHooks>;
}

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: Date;
  ttl?: number;
  accessCount: number;
  lastAccessed: Date;
  size: number;
  /** Optional tags to support group invalidation / observability */
  tags?: string[];
}

/** Metrics hooks (all optional, lightweight, sync) */
export interface CacheMetricHooks {
  onHit: (name: string, key: string) => void;
  onMiss: (name: string, key: string) => void;
  onSet: (name: string, key: string, size: number, ttl?: number, tags?: string[]) => void;
  onDelete: (name: string, key: string) => void;
  onEvict: (name: string, key: string, reason: 'LRU'|'LFU'|'FIFO'|'TTL') => void;
  onExpire: (name: string, key: string) => void;
  onLoadStart: (name: string, key: string) => void;
  onLoadSuccess: (name: string, key: string, ms: number) => void;
  onLoadError: (name: string, key: string, ms: number, error: unknown) => void;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
  averageAccessTime: number;
}

export interface CacheStats {
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  totalEvictions: number;
  totalMemoryUsage: number;
  averageResponseTime: number;
}

export interface CacheInvalidationOptions {
  pattern?: string;
  tags?: string[];
  cascade?: boolean;
  force?: boolean;
}

export interface CacheWarmingOptions {
  batchSize?: number;
  concurrency?: number;
  timeout?: number;
  retryAttempts?: number;
}

export interface DistributedCacheOptions extends CacheOptions {
  nodes?: string[];
  replicationFactor?: number;
  consistencyLevel?: 'STRONG' | 'EVENTUAL';
  enableCompression?: boolean;
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

/**
 * Centralized cache manager for all caching operations
 */
export class CacheManager {
  private static caches: Map<string, Cache<unknown>> = new Map();
  private static globalStats: CacheStats = {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    totalEvictions: 0,
    totalMemoryUsage: 0,
    averageResponseTime: 0
  };

  /**
   * Get or create a cache instance
   */
  static getCache<T>(name: string, options: CacheOptions = {}): Cache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Cache<T>(name, options));
    }
    return this.caches.get(name)!;
  }

  /**
   * Get all cache names
   */
  static getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  /**
   * Clear a specific cache
   */
  static clearCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      return true;
    }
    return false;
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Get global cache statistics
   */
  static getGlobalStats(): CacheStats {
    return { ...this.globalStats };
  }

  /**
   * Update global statistics
   */
  static updateGlobalStats(metrics: Partial<CacheMetrics>): void {
    this.globalStats.totalRequests++;
    if (metrics.hits !== undefined) this.globalStats.totalHits += metrics.hits;
    if (metrics.misses !== undefined) this.globalStats.totalMisses += metrics.misses;
    if (metrics.evictions !== undefined) this.globalStats.totalEvictions += metrics.evictions;
    if (metrics.memoryUsage !== undefined) this.globalStats.totalMemoryUsage += metrics.memoryUsage;
  }

  /**
   * Get cache health summary
   */
  static getHealthSummary(): {
    totalCaches: number;
    totalSize: number;
    totalMemoryUsage: number;
    averageHitRate: number;
  } {
    const caches = Array.from(this.caches.values());
    const totalCaches = caches.length;
    const totalSize = caches.reduce((sum, cache) => sum + cache.size(), 0);
    const totalMemoryUsage = caches.reduce((sum, cache) => sum + cache.getMemoryUsage(), 0);
    const averageHitRate = totalCaches > 0
      ? caches.reduce((sum, cache) => sum + cache.getHitRate(), 0) / totalCaches
      : 0;

    return {
      totalCaches,
      totalSize,
      totalMemoryUsage,
      averageHitRate
    };
  }

  /**
   * Create a scoped view over a cache that prefixes all keys.
   */
  static scope<T>(cacheName: string, prefix: string, options: CacheOptions = {}): ScopedCache<T> {
    const cache = this.getCache<T>(cacheName, options);
    return new ScopedCache<T>(cache, prefix);
  }

  /**
   * Start TTL sweepers for all caches (idempotent per cache).
   */
  static startAllSweepers(intervalMs = 60_000): void {
    for (const c of this.caches.values()) {
      c.startSweeper(intervalMs);
    }
  }

  /**
   * Stop TTL sweepers for all caches.
   */
  static stopAllSweepers(): void {
    for (const c of this.caches.values()) {
      c.stopSweeper();
    }
  }
}

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

/**
 * Generic cache implementation with multiple strategies
 */
export class Cache<T = unknown> {
  private entries: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private frequencyMap: Map<string, number> = new Map();
  private pendingLoads: Map<string, Promise<T>> = new Map(); // singleflight
  private sweeper: ReturnType<typeof setInterval> | null = null; // TTL sweep timer
  private loadTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // windowing
  private options: CacheOptions;
  private metrics: CacheMetrics;
  private readonly name: string;

  constructor(name: string, options: CacheOptions = {}) {
    this.name = name;
    this.options = {
      ttl: options.ttl || 300000, // 5 minutes default
      maxSize: options.maxSize || 1000,
      strategy: options.strategy || 'LRU',
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging !== false
    };
    
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      size: 0,
      maxSize: this.options.maxSize!,
      memoryUsage: 0,
      averageAccessTime: 0
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const startTime = Date.now();
    
    try {
      const entry = this.entries.get(key);
      
      if (!entry) {
        this.metrics.misses++;
        this.updateMetrics();
        this.hook('onMiss', key);
        return null;
      }

      // Check TTL
      if (this.isExpired(entry)) {
        this.delete(key);
        this.hook('onExpire', key);
        this.metrics.misses++;
        this.updateMetrics();
        this.hook('onMiss', key);
        return null;
      }

      // Update access information
      this.updateAccess(key, entry);
      
      this.metrics.hits++;
      this.updateMetrics();
      this.hook('onHit', key);
      
      return entry.value;
      
    } finally {
      const duration = Date.now() - startTime;
      this.updateAverageAccessTime(duration);
    }
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number, tags?: string[]): void {
    try {
      // Treat ttl=0 as "do not cache"
      if (ttl === 0) {
        this.delete(key);
        return;
      }

      // Check if we need to evict
      if (this.entries.size >= this.options.maxSize! && !this.entries.has(key)) {
        this.evict();
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: new Date(),
        ...(ttl !== undefined && { ttl: Math.max(0, ttl) }),
        ...(ttl === undefined && this.options.ttl !== undefined && { ttl: Math.max(0, this.options.ttl) }),
        accessCount: 0,
        lastAccessed: new Date(),
        size: this.calculateSize(value),
        ...(tags && { tags })
      };

      this.entries.set(key, entry);
      this.updateAccess(key, entry);
      this.updateMetrics();
      this.hook('onSet', key, entry.size, entry.ttl, tags);
      
    } catch (error) {
      if (this.options.enableLogging) {
        console.error(`Cache set failed for key ${key}:`, error);
      }
    }
  }

  /**
   * Get-or-load with singleflight dedupe and optional windowing/TTL override.
   * Overload 1: getOrLoad(key, loader, ttl?, tags?)
   * Overload 2: getOrLoad(key, loader, { ttl?, tags?, windowMs? })
   */
  async getOrLoad(
    key: string,
    loader: () => Promise<T>,
    ttl?: number | ((value: T) => number | undefined),
    tags?: string[]
  ): Promise<T>;
  async getOrLoad(
    key: string,
    loader: () => Promise<T>,
    opts: { ttl?: number | ((value: T) => number | undefined); tags?: string[]; windowMs?: number }
  ): Promise<T>;
  async getOrLoad(
    key: string,
    loader: () => Promise<T>,
    a?: number | ((v: T) => number | undefined) | { ttl?: number | ((v: T) => number | undefined); tags?: string[]; windowMs?: number },
    b?: string[]
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const opts = (typeof a === 'object' && a !== null && !Array.isArray(a))
      ? (a as { ttl?: number | ((v: T) => number | undefined); tags?: string[]; windowMs?: number })
      : ({ ttl: a as unknown, tags: b } as { ttl?: number | ((v: T) => number | undefined); tags?: string[]; windowMs?: number });

    // Join in-flight load if exists.
    const inflight = this.pendingLoads.get(key);
    if (inflight) return inflight;

    // Optional windowing: delay loader start so callers within window join the same flight.
    const windowMs = Math.max(0, opts.windowMs ?? 0);
    if (windowMs > 0 && !this.loadTimers.has(key)) {
      await new Promise<void>((resolve) => {
        const t = setTimeout(() => { this.loadTimers.delete(key); resolve(); }, windowMs);
        this.loadTimers.set(key, t);
      });
      const joined = this.pendingLoads.get(key);
      if (joined) return joined;
      const postWaitCached = this.get(key);
      if (postWaitCached !== null) return postWaitCached;
    }

    const start = Date.now();
    this.hook('onLoadStart', key);
    const p = (async () => {
      try {
        const value = await loader();
        const computedTtl = typeof opts.ttl === 'function' ? opts.ttl(value) : opts.ttl;
        this.set(key, value, computedTtl, opts.tags);
        this.hook('onLoadSuccess', key, Date.now() - start);
        return value;
      } catch (err) {
        this.hook('onLoadError', key, Date.now() - start, err);
        throw err;
      } finally {
        this.pendingLoads.delete(key);
      }
    })();
    this.pendingLoads.set(key, p);
    return p;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.entries.get(key);
    if (entry) {
      this.entries.delete(key);
      this.removeFromAccessOrder(key);
      this.frequencyMap.delete(key);
      this.updateMetrics();
      this.hook('onDelete', key);
      return true;
    }
    return false;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
    this.accessOrder = [];
    this.frequencyMap.clear();
    this.resetMetrics();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.entries.size;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get hit rate
   */
  getHitRate(): number {
    return this.metrics.hitRate;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    return this.metrics.memoryUsage;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get all values
   */
  values(): T[] {
    return Array.from(this.entries.values()).map(entry => entry.value);
  }

  /**
   * Get all entries as [key, value] pairs
   */
  pairs(): Array<[string, T]> {
    return Array.from(this.entries.entries()).map(([key, entry]) => [key, entry.value]);
  }

  /**
   * Ops-safe snapshot of the full entry metadata (read-only)
   */
  getEntrySnapshot(key: string): Readonly<CacheEntry<T>> | null {
    const e = this.entries.get(key);
    return e ? { ...e } : null;
  }

  /**
   * Start a TTL sweeper that periodically purges expired items.
   * No-op if already running.
   */
  startSweeper(intervalMs = 60_000): void {
    if (this.sweeper) return;
    this.sweeper = setInterval(() => {
      try {
        for (const key of this.entries.keys()) {
          const e = this.entries.get(key)!;
          if (this.isExpired(e)) {
            this.delete(key);
            this.hook('onExpire', key);
          }
        }
      } catch (err) {
        if (this.options.enableLogging) {
          console.error(`[${this.name}] TTL sweeper error:`, err);
        }
      }
    }, Math.max(1_000, intervalMs));
  }

  /**
   * Stop the TTL sweeper if running.
   */
  stopSweeper(): void {
    if (this.sweeper) {
      clearInterval(this.sweeper);
      this.sweeper = null;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false;
    
    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();
    return age > entry.ttl;
  }

  /**
   * Update access information
   */
  private updateAccess(key: string, entry: CacheEntry<T>): void {
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    // Update access order for LRU
    if (this.options.strategy === 'LRU') {
      this.removeFromAccessOrder(key);
      this.accessOrder.push(key);
    }
    
    // Update frequency for LFU
    if (this.options.strategy === 'LFU') {
      const currentFreq = this.frequencyMap.get(key) || 0;
      this.frequencyMap.set(key, currentFreq + 1);
    }
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict entry based on strategy
   */
  private evict(): void {
    let keyToEvict: string | null = null;
    
    switch (this.options.strategy) {
      case 'LRU':
        keyToEvict = this.accessOrder[0] ?? null;
        break;
      case 'LFU':
        keyToEvict = this.getLeastFrequentlyUsed();
        break;
      case 'FIFO':
        const firstKey = this.entries.keys().next().value;
        keyToEvict = firstKey ?? null;
        break;
      case 'TTL':
        keyToEvict = this.getOldestEntry();
        break;
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
      this.metrics.evictions++;
      this.hook('onEvict', keyToEvict, this.options.strategy!);
    }
  }

  /**
   * Get least frequently used key
   */
  private getLeastFrequentlyUsed(): string | null {
    let minFreq = Infinity;
    let keyToEvict: string | null = null;
    
    for (const [key, freq] of this.frequencyMap.entries()) {
      if (freq < minFreq) {
        minFreq = freq;
        keyToEvict = key;
      }
    }
    
    return keyToEvict;
  }

  /**
   * Get oldest entry key
   */
  private getOldestEntry(): string | null {
    let oldestTime = Infinity;
    let keyToEvict: string | null = null;
    
    for (const [key, entry] of this.entries.entries()) {
      if (entry.timestamp.getTime() < oldestTime) {
        oldestTime = entry.timestamp.getTime();
        keyToEvict = key;
      }
    }
    
    return keyToEvict;
  }

  /**
   * Calculate size of value
   */
  private calculateSize(value: T): number {
    try {
      if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
      // Fast path for small scalars
      if (value == null || typeof value === 'number' || typeof value === 'boolean') {
        return 8; // small constant
      }
      // Fallback to JSON for objects/arrays
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
      return 0;
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
    this.metrics.missRate = total > 0 ? this.metrics.misses / total : 0;
    this.metrics.size = this.entries.size;
    
    // Calculate memory usage
    this.metrics.memoryUsage = Array.from(this.entries.values())
      .reduce((sum, entry) => sum + entry.size, 0);
  }

  /**
   * Update average access time
   */
  private updateAverageAccessTime(duration: number): void {
    const total = this.metrics.hits + this.metrics.misses;
    if (total <= 1) {
      this.metrics.averageAccessTime = duration;
      return;
    }
    this.metrics.averageAccessTime =
      (this.metrics.averageAccessTime * (total - 1) + duration) / total;
  }

  /**
   * Reset metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      size: 0,
      maxSize: this.options.maxSize!,
      memoryUsage: 0,
      averageAccessTime: 0
    };
  }

  /** Safe hook invoker */
  private hook<K extends keyof CacheMetricHooks>(kind: K, ...args: Parameters<Required<CacheMetricHooks>[K]> extends [unknown, ...infer R] ? R : unknown[]) {
    const h = this.options.hooks?.[kind] as unknown;
    try { if (typeof h === 'function') h(this.name, ...args); } catch { /* swallow */ }
  }
}

// ============================================================================
// SCOPED CACHE WRAPPER
// ============================================================================

/**
 * A thin wrapper that prefixes keys for logical scoping while delegating
 * to the same underlying Cache<T>.
 */
export class ScopedCache<T = unknown> {
  constructor(private readonly base: Cache<T>, private readonly prefix: string) {}

  private pk(key: string): string {
    return [this.prefix, key].join(':');
  }

  get(key: string): T | null { return this.base.get(this.pk(key)); }
  set(key: string, value: T, ttl?: number, tags?: string[]): void { this.base.set(this.pk(key), value, ttl, tags); }
  async getOrLoad(key: string, loader: () => Promise<T>, ttl?: number, tags?: string[]): Promise<T> {
    return this.base.getOrLoad(this.pk(key), loader, ttl, tags);
  }
  delete(key: string): boolean { return this.base.delete(this.pk(key)); }
  has(key: string): boolean { return this.base.has(this.pk(key)); }

  // Scoped utilities
  invalidateByPattern(suffixPattern: string): number {
    const pattern = `^${this.prefix}:${suffixPattern}`;
    return CacheInvalidationUtilities.invalidateByPattern(this.base, pattern);
  }
  invalidateByTags(tags: string[]): number {
    // tags are on entries; leverage base invalidation
    return CacheInvalidationUtilities.invalidateByTags(this.base, tags);
  }
}

// ============================================================================
// CACHE INVALIDATION UTILITIES
// ============================================================================

/**
 * Utilities for cache invalidation
 */
export class CacheInvalidationUtilities {
  /**
   * Invalidate cache by pattern
   */
  static invalidateByPattern(
    cache: Cache<unknown>,
    pattern: string
  ): number {
    const regex = new RegExp(pattern);
    let invalidatedCount = 0;
    
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Invalidate cache by tags
   */
  static invalidateByTags(
    cache: Cache<unknown>,
    tags: string[]
  ): number {
    let invalidatedCount = 0;
    
    for (const key of cache.keys()) {
      const entry = cache.getEntrySnapshot(key);
      if (entry?.tags?.length) {
        const hasMatchingTag = tags.some(tag => entry.tags!.includes(tag));
        if (hasMatchingTag) {
          cache.delete(key);
          invalidatedCount++;
        }
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Invalidate all caches
   */
  static invalidateAll(): void {
    CacheManager.clearAllCaches();
  }

  /**
   * Invalidate cache by name
   */
  static invalidateByName(name: string): boolean {
    return CacheManager.clearCache(name);
  }
}

// ============================================================================
// CACHE WARMING UTILITIES
// ============================================================================

/**
 * Utilities for cache warming and preloading
 */
export class CacheWarmingUtilities {
  /**
   * Warm cache with data
   */
  static async warmCache<T>(
    cache: Cache<T>,
    dataLoader: (key: string) => Promise<T>,
    keys: string[],
    options: CacheWarmingOptions = {}
  ): Promise<{
    successCount: number;
    failureCount: number;
    errors: Array<{ key: string; error: Error }>;
  }> {
    const {
      batchSize = 10,
      concurrency = 5,
      timeout = 30000,
      retryAttempts = 3
    } = options;

    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ key: string; error: Error }> = [];

    // Simple concurrency gate (semaphore) per batch
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      const queue = [...batch];
      const workers = Math.max(1, Math.min(concurrency, queue.length));
      const runWorker = async () => {
        while (queue.length) {
          const key = queue.shift()!;
          try {
            const value = await this.loadWithRetry(
              () => dataLoader(key),
              retryAttempts,
              timeout
            );
            cache.set(key, value);
            successCount++;
          } catch (error) {
            failureCount++;
            errors.push({ key, error: error as Error });
          }
        }
      };
      await Promise.all(Array.from({ length: workers }, runWorker));
    }

    return { successCount, failureCount, errors };
  }

  /**
   * Load data with retry
   */
  private static async loadWithRetry<T>(
    loader: () => Promise<T>,
    maxRetries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          loader(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) break;
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
    
    throw lastError!;
  }
}

// ============================================================================
// DISTRIBUTED CACHE UTILITIES
// ============================================================================

/**
 * Utilities for distributed caching
 */
export class DistributedCacheUtilities {
  /**
   * Create distributed cache key
   */
  static createDistributedKey(
    baseKey: string,
    nodeId: string,
    shardId?: string
  ): string {
    const parts = [baseKey, nodeId];
    if (shardId) parts.push(shardId);
    return parts.join(':');
  }

  /**
   * Extract base key from distributed key
   */
  static extractBaseKey(distributedKey: string): string {
    const parts = distributedKey.split(':');
    return parts[0] ?? '';
  }

  /**
   * Calculate shard ID for key
   */
  static calculateShardId(key: string, totalShards: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % totalShards;
  }

  /**
   * Get node ID for key
   */
  static getNodeId(key: string, nodes: string[]): string {
    const shardId = this.calculateShardId(key, nodes.length);
    return nodes[shardId] ?? nodes[0] ?? '';
  }
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Helper functions for cache operations
 */
export class CacheHelpers {
  /**
   * Create cache key from parts
   */
  static createKey(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Create cache key with prefix
   */
  static createKeyWithPrefix(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join(':');
  }

  /**
   * Create cache key with suffix
   */
  static createKeyWithSuffix(suffix: string, ...parts: string[]): string {
    return [...parts, suffix].join(':');
  }

  /**
   * Parse cache key
   */
  static parseKey(key: string): string[] {
    return key.split(':');
  }

  /**
   * Check if key matches pattern
   */
  static matchesPattern(key: string, pattern: string): boolean {
    // Escape regex metacharacters, then support '*' wildcard.
    const escaped = pattern
      .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`);
    return regex.test(key);
  }

  /**
   * Get cache size in human readable format
   */
  static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get cache hit rate in percentage
   */
  static formatHitRate(hitRate: number): string {
    return `${(hitRate * 100).toFixed(2)}%`;
  }
}
