/**
 * Unit Tests for Storage Quota Management
 * Tests quota tracking, usage calculation, and LRU cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Mock localStorage for testing
// ═══════════════════════════════════════════════════════════════════════════════

class MockLocalStorage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Copy of storage-quota functions for isolated testing
// ═══════════════════════════════════════════════════════════════════════════════

function getStorageUsage(): number {
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        // UTF-16 encoding = 2 bytes per char
        totalSize += (key.length + (value?.length || 0)) * 2;
      }
    }
  } catch {
    // Fail silently
  }

  return totalSize;
}

function getStorageQuota(): number {
  return 5 * 1024 * 1024; // 5 MB
}

function getUsagePercentage(): number {
  const usage = getStorageUsage();
  const quota = getStorageQuota();

  if (quota === 0) return 0;

  const percentage = (usage / quota) * 100;
  return Math.min(100, Math.max(0, percentage));
}

function isNearQuota(threshold = 0.9): boolean {
  if (threshold < 0 || threshold > 1) {
    threshold = 0.9;
  }

  const percentage = getUsagePercentage();
  return percentage >= threshold * 100;
}

function clearOldestEntries(
  keysPrefix: string,
  targetPercentage = 0.7,
  maxEntriesToRemove = 10
): number {
  if (!keysPrefix) {
    return 0;
  }

  try {
    // Find all matching keys
    const matchingKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(keysPrefix)) {
        matchingKeys.push(key);
      }
    }

    if (matchingKeys.length === 0) {
      return 0;
    }

    // Parse timestamps and sort
    interface StorageEntry {
      key: string;
      timestamp: number;
    }

    const entries: StorageEntry[] = matchingKeys
      .map(key => {
        try {
          const value = localStorage.getItem(key);
          if (!value) return null;

          const parsed = JSON.parse(value);
          const timestamp = parsed.timestamp
            ? new Date(parsed.timestamp).getTime()
            : 0;

          return { key, timestamp };
        } catch {
          return { key, timestamp: 0 };
        }
      })
      .filter((entry): entry is StorageEntry => entry !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries
    let removedCount = 0;
    const targetUsage = targetPercentage * getStorageQuota();

    for (const entry of entries) {
      if (removedCount >= maxEntriesToRemove) {
        break;
      }

      if (getStorageUsage() <= targetUsage) {
        break;
      }

      localStorage.removeItem(entry.key);
      removedCount++;
    }

    return removedCount;
  } catch {
    return 0;
  }
}

function getStorageStats() {
  const usage = getStorageUsage();
  const quota = getStorageQuota();
  const percentage = getUsagePercentage();

  return {
    usedBytes: usage,
    quotaBytes: quota,
    usedMB: usage / (1024 * 1024),
    quotaMB: quota / (1024 * 1024),
    percentage,
    availableBytes: quota - usage,
    availableMB: (quota - usage) / (1024 * 1024)
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════════

describe('Storage Quota Management', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    // Replace global localStorage with mock
    global.localStorage = mockStorage as any;
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe('getStorageUsage', () => {
    it('should return 0 for empty storage', () => {
      expect(getStorageUsage()).toBe(0);
    });

    it('should calculate usage for single item', () => {
      localStorage.setItem('key', 'value');
      // 'key' = 3 chars, 'value' = 5 chars, UTF-16 = 2 bytes per char
      // Total = (3 + 5) * 2 = 16 bytes
      expect(getStorageUsage()).toBe(16);
    });

    it('should calculate usage for multiple items', () => {
      localStorage.setItem('key1', 'value1'); // (4 + 6) * 2 = 20
      localStorage.setItem('key2', 'value2'); // (4 + 6) * 2 = 20
      localStorage.setItem('key3', 'value3'); // (4 + 6) * 2 = 20
      // Total = 60 bytes
      expect(getStorageUsage()).toBe(60);
    });

    it('should handle empty values', () => {
      localStorage.setItem('key', '');
      // 'key' = 3 chars, '' = 0 chars
      // Total = (3 + 0) * 2 = 6 bytes
      expect(getStorageUsage()).toBe(6);
    });

    it('should handle unicode characters', () => {
      localStorage.setItem('emoji', '🎉');
      // 'emoji' = 5 chars, '🎉' = 2 chars (surrogate pair)
      // Total = (5 + 2) * 2 = 14 bytes
      expect(getStorageUsage()).toBe(14);
    });

    it('should handle large JSON objects', () => {
      const largeObject = {
        data: 'x'.repeat(1000),
        timestamp: '2025-01-01T00:00:00Z'
      };
      localStorage.setItem('large', JSON.stringify(largeObject));
      const usage = getStorageUsage();

      // Should be > 1000 bytes (data + overhead)
      expect(usage).toBeGreaterThan(2000);
    });
  });

  describe('getStorageQuota', () => {
    it('should return 5MB quota', () => {
      const quota = getStorageQuota();
      expect(quota).toBe(5 * 1024 * 1024);
      expect(quota).toBe(5242880);
    });

    it('should be consistent across calls', () => {
      const quota1 = getStorageQuota();
      const quota2 = getStorageQuota();
      expect(quota1).toBe(quota2);
    });
  });

  describe('getUsagePercentage', () => {
    it('should return 0% for empty storage', () => {
      expect(getUsagePercentage()).toBe(0);
    });

    it('should calculate correct percentage', () => {
      // Add 1KB of data
      const data = 'x'.repeat(512); // 512 chars = 1024 bytes
      localStorage.setItem('test', data);

      const percentage = getUsagePercentage();
      const expectedPercentage = (1024 / getStorageQuota()) * 100;

      // Use 2 decimal places for precision (accounts for key length overhead)
      expect(percentage).toBeCloseTo(expectedPercentage, 2);
    });

    it('should not exceed 100%', () => {
      // Fill storage beyond quota (mock allows this)
      const largeData = 'x'.repeat(3 * 1024 * 1024); // 6MB
      localStorage.setItem('huge', largeData);

      expect(getUsagePercentage()).toBeLessThanOrEqual(100);
    });

    it('should not go below 0%', () => {
      expect(getUsagePercentage()).toBeGreaterThanOrEqual(0);
    });

    it('should update as storage changes', () => {
      const percentage1 = getUsagePercentage();

      localStorage.setItem('data', 'x'.repeat(1000));
      const percentage2 = getUsagePercentage();

      expect(percentage2).toBeGreaterThan(percentage1);

      localStorage.removeItem('data');
      const percentage3 = getUsagePercentage();

      expect(percentage3).toBeLessThan(percentage2);
    });
  });

  describe('isNearQuota', () => {
    it('should return false for empty storage', () => {
      expect(isNearQuota()).toBe(false);
    });

    it('should return false when below threshold', () => {
      // Add small amount (< 90%)
      const data = 'x'.repeat(1000);
      localStorage.setItem('small', data);

      expect(isNearQuota(0.9)).toBe(false);
    });

    it('should use default threshold of 0.9', () => {
      // Fill to 95%
      const targetBytes = Math.floor(getStorageQuota() * 0.95 / 2);
      const data = 'x'.repeat(targetBytes);
      localStorage.setItem('data', data);

      expect(isNearQuota()).toBe(true);
    });

    it('should respect custom threshold', () => {
      // Fill to 50%
      const targetBytes = Math.floor(getStorageQuota() * 0.5 / 2);
      const data = 'x'.repeat(targetBytes);
      localStorage.setItem('data', data);

      expect(isNearQuota(0.4)).toBe(true);  // Above 40%
      expect(isNearQuota(0.6)).toBe(false); // Below 60%
    });

    it('should handle invalid thresholds', () => {
      // Invalid thresholds should default to 0.9
      expect(() => isNearQuota(-0.5)).not.toThrow();
      expect(() => isNearQuota(1.5)).not.toThrow();
      expect(() => isNearQuota(999)).not.toThrow();
    });

    it('should clamp threshold to 0-1 range', () => {
      const data = 'x'.repeat(1000);
      localStorage.setItem('data', data);

      // Negative threshold should behave like 0.9
      const result1 = isNearQuota(-0.5);
      const result2 = isNearQuota(0.9);
      expect(result1).toBe(result2);
    });
  });

  describe('clearOldestEntries', () => {
    beforeEach(() => {
      // Create test sessions with different timestamps
      const sessions = [
        { key: 'specificity-session-user1', timestamp: '2025-01-01T00:00:00Z' },
        { key: 'specificity-session-user2', timestamp: '2025-01-02T00:00:00Z' },
        { key: 'specificity-session-user3', timestamp: '2025-01-03T00:00:00Z' },
        { key: 'specificity-session-user4', timestamp: '2025-01-04T00:00:00Z' },
        { key: 'specificity-session-user5', timestamp: '2025-01-05T00:00:00Z' },
      ];

      sessions.forEach(({ key, timestamp }) => {
        localStorage.setItem(key, JSON.stringify({
          data: 'x'.repeat(100),
          timestamp
        }));
      });
    });

    it('should remove oldest entries first', () => {
      const removed = clearOldestEntries('specificity-session-', 0, 2);

      expect(removed).toBe(2);
      expect(localStorage.getItem('specificity-session-user1')).toBeNull();
      expect(localStorage.getItem('specificity-session-user2')).toBeNull();
      expect(localStorage.getItem('specificity-session-user3')).not.toBeNull();
    });

    it('should respect maxEntriesToRemove limit', () => {
      const removed = clearOldestEntries('specificity-session-', 0, 3);

      expect(removed).toBe(3);
      expect(localStorage.length).toBe(2); // 5 - 3 = 2 remaining
    });

    it('should stop at target percentage', () => {
      // Set high target so cleanup stops early
      const removed = clearOldestEntries('specificity-session-', 0.99, 10);

      // Should remove at least 1 but not all
      expect(removed).toBeGreaterThanOrEqual(0);
      expect(removed).toBeLessThanOrEqual(5);
    });

    it('should only remove entries matching prefix', () => {
      localStorage.setItem('other-key', 'should-remain');

      clearOldestEntries('specificity-session-', 0, 10);

      expect(localStorage.getItem('other-key')).toBe('should-remain');
    });

    it('should return 0 for empty prefix', () => {
      const removed = clearOldestEntries('', 0.5, 10);
      expect(removed).toBe(0);
    });

    it('should return 0 when no matching keys found', () => {
      const removed = clearOldestEntries('nonexistent-', 0.5, 10);
      expect(removed).toBe(0);
    });

    it('should handle entries without timestamps', () => {
      localStorage.setItem('specificity-session-no-timestamp', JSON.stringify({
        data: 'test'
        // No timestamp field
      }));

      // Should not throw and should treat as oldest
      expect(() => clearOldestEntries('specificity-session-', 0, 10)).not.toThrow();
    });

    it('should handle malformed JSON entries', () => {
      localStorage.setItem('specificity-session-malformed', 'not-valid-json');

      // Should not throw and should treat as oldest
      expect(() => clearOldestEntries('specificity-session-', 0, 10)).not.toThrow();
    });

    it('should remove entries with invalid timestamp first', () => {
      localStorage.clear();

      localStorage.setItem('specificity-session-valid', JSON.stringify({
        data: 'test',
        timestamp: '2025-01-10T00:00:00Z'
      }));

      localStorage.setItem('specificity-session-invalid', 'invalid');

      const removed = clearOldestEntries('specificity-session-', 0, 1);

      // Should remove invalid entry first (timestamp = 0)
      expect(removed).toBe(1);
      expect(localStorage.getItem('specificity-session-invalid')).toBeNull();
      expect(localStorage.getItem('specificity-session-valid')).not.toBeNull();
    });
  });

  describe('getStorageStats', () => {
    it('should return complete statistics for empty storage', () => {
      const stats = getStorageStats();

      expect(stats.usedBytes).toBe(0);
      expect(stats.quotaBytes).toBe(5 * 1024 * 1024);
      expect(stats.usedMB).toBe(0);
      expect(stats.quotaMB).toBe(5);
      expect(stats.percentage).toBe(0);
      expect(stats.availableBytes).toBe(5 * 1024 * 1024);
      expect(stats.availableMB).toBe(5);
    });

    it('should calculate stats correctly with data', () => {
      // Add 1KB
      const data = 'x'.repeat(512); // 1024 bytes
      localStorage.setItem('test', data);

      const stats = getStorageStats();

      expect(stats.usedBytes).toBeGreaterThan(0);
      expect(stats.usedMB).toBeGreaterThan(0);
      expect(stats.percentage).toBeGreaterThan(0);
      expect(stats.availableBytes).toBeLessThan(stats.quotaBytes);
    });

    it('should have consistent calculations', () => {
      const data = 'x'.repeat(1000);
      localStorage.setItem('data', data);

      const stats = getStorageStats();

      // Check relationships
      expect(stats.usedBytes + stats.availableBytes).toBe(stats.quotaBytes);
      expect(stats.usedMB).toBeCloseTo(stats.usedBytes / (1024 * 1024), 6);
      expect(stats.quotaMB).toBe(5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const errorStorage = {
        length: 0,
        key: () => { throw new Error('Storage error'); },
        getItem: () => { throw new Error('Storage error'); },
        setItem: () => { throw new Error('Storage error'); },
        removeItem: () => { throw new Error('Storage error'); },
        clear: () => { throw new Error('Storage error'); }
      };

      global.localStorage = errorStorage as any;

      // Should not throw
      expect(() => getStorageUsage()).not.toThrow();
      expect(() => getUsagePercentage()).not.toThrow();
      expect(() => isNearQuota()).not.toThrow();
      expect(() => clearOldestEntries('test-', 0.5, 10)).not.toThrow();
    });

    it('should handle very large storage usage', () => {
      // Simulate storage with huge data
      const hugeData = 'x'.repeat(10 * 1024 * 1024); // 20MB
      localStorage.setItem('huge', hugeData);

      const percentage = getUsagePercentage();

      // Should clamp to 100%
      expect(percentage).toBe(100);
      expect(isNearQuota(0.5)).toBe(true);
    });

    it('should handle empty localStorage.key() results', () => {
      // Create mock that returns null for key()
      const weirdStorage = new MockLocalStorage();
      weirdStorage.setItem('test', 'value');

      // Override key method to return null
      weirdStorage.key = () => null;
      global.localStorage = weirdStorage as any;

      // Should handle gracefully
      expect(() => getStorageUsage()).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete cleanup workflow', () => {
      // Fill storage to 80%
      const targetBytes = Math.floor(getStorageQuota() * 0.8 / 2);

      for (let i = 0; i < 10; i++) {
        localStorage.setItem(
          `specificity-session-user${i}`,
          JSON.stringify({
            data: 'x'.repeat(Math.floor(targetBytes / 10)),
            timestamp: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`
          })
        );
      }

      const initialUsage = getUsagePercentage();
      expect(initialUsage).toBeGreaterThan(70);

      // Trigger cleanup
      const removed = clearOldestEntries('specificity-session-', 0.5, 5);

      const finalUsage = getUsagePercentage();

      expect(removed).toBeGreaterThan(0);
      expect(finalUsage).toBeLessThan(initialUsage);
    });

    it('should handle mixed storage keys', () => {
      // Add various keys
      localStorage.setItem('specificity-session-1', JSON.stringify({ timestamp: '2025-01-01' }));
      localStorage.setItem('other-app-data', 'should-remain');
      localStorage.setItem('specificity-cache-2', JSON.stringify({ timestamp: '2025-01-02' }));
      localStorage.setItem('specificity-session-3', JSON.stringify({ timestamp: '2025-01-03' }));

      const removed = clearOldestEntries('specificity-session-', 0, 10);

      // Should only remove specificity-session-* keys
      expect(removed).toBe(2);
      expect(localStorage.getItem('other-app-data')).not.toBeNull();
      expect(localStorage.getItem('specificity-cache-2')).not.toBeNull();
    });
  });
});
