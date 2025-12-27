/**
 * Request Deduplication & Caching
 * Prevents duplicate API calls and caches responses
 * Action 23: 94% confidence
 */

import * as Sentry from '@sentry/react';

// ============================================
// TYPES
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  deduped: number;
  expired: number;
}

interface RequestCacheConfig {
  defaultTTL: number; // milliseconds
  maxEntries: number;
  enableMetrics: boolean;
}

// ============================================
// REQUEST CACHE CLASS
// ============================================

/**
 * Request cache with deduplication support
 * - Deduplicates in-flight requests with same key
 * - Caches responses with configurable TTL
 * - Tracks cache hit/miss metrics
 */
export class RequestCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private pending: Map<string, PendingRequest<T>> = new Map();
  private metrics: CacheMetrics = { hits: 0, misses: 0, deduped: 0, expired: 0 };
  private config: RequestCacheConfig;

  constructor(config: Partial<RequestCacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxEntries: 100,
      enableMetrics: true,
      ...config,
    };
  }

  /**
   * Get cached response or execute request
   */
  async get(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; skipCache?: boolean }
  ): Promise<T> {
    const ttl = options?.ttl ?? this.config.defaultTTL;

    // Check for existing cache entry
    if (!options?.skipCache) {
      const cached = this.cache.get(key);
      if (cached && Date.now() < cached.expiresAt) {
        this.metrics.hits++;
        this.logMetric('cache_hit', key);
        return cached.data;
      }
      if (cached) {
        this.metrics.expired++;
        this.cache.delete(key);
      }
    }

    // Check for pending request (deduplication)
    const pendingReq = this.pending.get(key);
    if (pendingReq) {
      this.metrics.deduped++;
      this.logMetric('request_deduped', key);
      return pendingReq.promise;
    }

    // Execute new request
    this.metrics.misses++;
    const promise = this.executeRequest(key, fetcher, ttl);
    this.pending.set(key, { promise, timestamp: Date.now() });

    try {
      const result = await promise;
      return result;
    } finally {
      this.pending.delete(key);
    }
  }

  /**
   * Execute request and cache result
   */
  private async executeRequest(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const data = await fetcher();

      // Enforce max entries (LRU eviction)
      if (this.cache.size >= this.config.maxEntries) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }

      // Cache result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      });

      this.logMetric('cache_set', key);
      return data;
    } catch (error) {
      this.logMetric('cache_error', key);
      throw error;
    }
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.logMetric('cache_invalidate', key);
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.logMetric('cache_invalidate_pattern', pattern.source);
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.pending.clear();
    this.logMetric('cache_clear', 'all');
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & { hitRate: number; size: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.hits / total : 0,
      size: this.cache.size,
    };
  }

  /**
   * Log metric to Sentry
   */
  private logMetric(event: string, key: string): void {
    if (!this.config.enableMetrics) return;

    Sentry.addBreadcrumb({
      category: 'cache',
      message: event,
      level: 'info',
      data: { key, cacheSize: this.cache.size },
    });
  }
}

// ============================================
// GLOBAL INSTANCES
// ============================================

/**
 * API response cache (5 min TTL)
 */
export const apiCache = new RequestCache({
  defaultTTL: 5 * 60 * 1000,
  maxEntries: 50,
  enableMetrics: true,
});

/**
 * Research cache (longer TTL for expensive operations)
 */
export const researchCache = new RequestCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxEntries: 100,
  enableMetrics: true,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, unknown>
): string {
  const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${endpoint}:${paramStr}`;
}

/**
 * Cached fetch wrapper
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; cache?: RequestCache<T> }
): Promise<T> {
  const cache = options?.cache ?? (apiCache as RequestCache<T>);
  return cache.get(key, fetcher, { ttl: options?.ttl });
}

/**
 * Request deduplicator for parallel calls
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<unknown>> = new Map();

  /**
   * Deduplicate parallel requests with same key
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Check if request is pending
   */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }

  /**
   * Get pending request count
   */
  get pendingCount(): number {
    return this.pending.size;
  }
}

/**
 * Global request deduplicator
 */
export const requestDeduplicator = new RequestDeduplicator();
