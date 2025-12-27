/**
 * Request Cache Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RequestCache,
  RequestDeduplicator,
  generateCacheKey,
  cachedFetch,
  apiCache,
} from '../request-cache';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
}));

describe('RequestCache', () => {
  let cache: RequestCache<string>;

  beforeEach(() => {
    cache = new RequestCache({ defaultTTL: 1000, maxEntries: 10 });
  });

  describe('get', () => {
    it('should fetch and cache data', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');
      const result = await cache.get('key1', fetcher);

      expect(result).toBe('data');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on second call', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');

      await cache.get('key1', fetcher);
      const result = await cache.get('key1', fetcher);

      expect(result).toBe('data');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate parallel requests', async () => {
      let resolveFirst: (value: string) => void;
      const fetcher = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolveFirst = resolve;
          })
      );

      // Start two parallel requests
      const promise1 = cache.get('key1', fetcher);
      const promise2 = cache.get('key1', fetcher);

      // Resolve the first request
      resolveFirst!('data');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('data');
      expect(result2).toBe('data');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should skip cache when skipCache is true', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');

      await cache.get('key1', fetcher);
      await cache.get('key1', fetcher, { skipCache: true });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should respect custom TTL', async () => {
      vi.useFakeTimers();
      const fetcher = vi.fn().mockResolvedValue('data');

      await cache.get('key1', fetcher, { ttl: 100 });

      // Advance time past TTL
      vi.advanceTimersByTime(150);

      await cache.get('key1', fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  describe('invalidate', () => {
    it('should remove cache entry', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');

      await cache.get('key1', fetcher);
      cache.invalidate('key1');
      await cache.get('key1', fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidatePattern', () => {
    it('should remove matching entries', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');

      await cache.get('user:1', fetcher);
      await cache.get('user:2', fetcher);
      await cache.get('other:1', fetcher);

      const count = cache.invalidatePattern(/^user:/);

      expect(count).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all entries', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');

      await cache.get('key1', fetcher);
      await cache.get('key2', fetcher);
      cache.clear();

      const metrics = cache.getMetrics();
      expect(metrics.size).toBe(0);
    });
  });

  describe('getMetrics', () => {
    it('should track hits and misses', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');

      await cache.get('key1', fetcher);
      await cache.get('key1', fetcher);
      await cache.get('key2', fetcher);

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(2);
      expect(metrics.hitRate).toBeCloseTo(0.333, 2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entries when max reached', async () => {
      const smallCache = new RequestCache<number>({ maxEntries: 3 });
      const fetcher = (n: number) => vi.fn().mockResolvedValue(n);

      await smallCache.get('key1', fetcher(1));
      await smallCache.get('key2', fetcher(2));
      await smallCache.get('key3', fetcher(3));
      await smallCache.get('key4', fetcher(4));

      const metrics = smallCache.getMetrics();
      expect(metrics.size).toBe(3);
    });
  });
});

describe('RequestDeduplicator', () => {
  let deduplicator: RequestDeduplicator;

  beforeEach(() => {
    deduplicator = new RequestDeduplicator();
  });

  it('should deduplicate parallel requests', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    const promise1 = deduplicator.dedupe('key', fetcher);
    const promise2 = deduplicator.dedupe('key', fetcher);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toBe('data');
    expect(result2).toBe('data');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should track pending requests', async () => {
    let resolve: () => void;
    const fetcher = vi.fn().mockImplementation(
      () => new Promise<void>((r) => (resolve = r))
    );

    const promise = deduplicator.dedupe('key', fetcher);

    expect(deduplicator.isPending('key')).toBe(true);
    expect(deduplicator.pendingCount).toBe(1);

    resolve!();
    await promise;

    expect(deduplicator.isPending('key')).toBe(false);
    expect(deduplicator.pendingCount).toBe(0);
  });
});

describe('generateCacheKey', () => {
  it('should generate key from endpoint', () => {
    const key = generateCacheKey('/api/users');
    expect(key).toBe('/api/users:');
  });

  it('should include sorted params in key', () => {
    const key1 = generateCacheKey('/api/users', { b: 2, a: 1 });
    const key2 = generateCacheKey('/api/users', { a: 1, b: 2 });
    expect(key1).toBe(key2);
  });

  it('should generate unique keys for different params', () => {
    const key1 = generateCacheKey('/api/users', { id: 1 });
    const key2 = generateCacheKey('/api/users', { id: 2 });
    expect(key1).not.toBe(key2);
  });
});

describe('cachedFetch', () => {
  it('should use apiCache by default', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    await cachedFetch('test-key', fetcher);
    await cachedFetch('test-key', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Clean up
    apiCache.invalidate('test-key');
  });
});
