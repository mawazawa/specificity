/**
 * Storage Quota Management Utilities
 *
 * Provides quota tracking and LRU cleanup for localStorage to prevent
 * QuotaExceededError and manage storage efficiently.
 *
 * Browser localStorage limits:
 * - Chrome/Edge/Safari: ~5-10MB per origin
 * - Firefox: ~10MB per origin
 * - Varies by browser and available disk space
 *
 * Usage:
 * ```typescript
 * import { getStorageUsage, isNearQuota, clearOldestEntries } from '@/lib/storage-quota';
 *
 * // Check before saving
 * if (isNearQuota(0.9)) {
 *   clearOldestEntries('specificity-session-');
 * }
 * ```
 */

import { scopedLogger } from '@/lib/logger';

const logger = scopedLogger('StorageQuota');

/**
 * Estimates the current localStorage usage in bytes
 *
 * Calculates the size of all key-value pairs stored in localStorage.
 * Note: This is an approximation - actual browser storage may include metadata overhead.
 *
 * @returns Current usage in bytes
 *
 * @example
 * const usage = getStorageUsage();
 * console.log(`Using ${(usage / 1024).toFixed(2)} KB`);
 */
export function getStorageUsage(): number {
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        // Count both key and value size (UTF-16 encoding = 2 bytes per char)
        totalSize += (key.length + (value?.length || 0)) * 2;
      }
    }
  } catch (error) {
    logger.error('Failed to calculate storage usage', error instanceof Error ? error : new Error(String(error)), {
      action: 'getStorageUsage'
    });
  }

  return totalSize;
}

/**
 * Gets the maximum available localStorage quota in bytes
 *
 * Since browsers don't expose quota via API, this returns a conservative estimate
 * based on known browser limits. Actual quota may be higher.
 *
 * @returns Estimated max quota in bytes (default: 5MB)
 *
 * @example
 * const quota = getStorageQuota();
 * console.log(`Max storage: ${(quota / 1024 / 1024).toFixed(2)} MB`);
 */
export function getStorageQuota(): number {
  // Conservative estimate: 5MB (most browsers support at least this)
  // Chrome/Edge/Safari: ~5-10MB
  // Firefox: ~10MB
  return 5 * 1024 * 1024; // 5 MB in bytes
}

/**
 * Calculates storage usage as a percentage (0-100)
 *
 * @returns Usage percentage between 0 and 100
 *
 * @example
 * const percentage = getUsagePercentage();
 * if (percentage > 80) {
 *   console.warn('Storage is getting full');
 * }
 */
export function getUsagePercentage(): number {
  const usage = getStorageUsage();
  const quota = getStorageQuota();

  if (quota === 0) return 0;

  const percentage = (usage / quota) * 100;
  return Math.min(100, Math.max(0, percentage)); // Clamp 0-100
}

/**
 * Checks if storage usage is near the quota threshold
 *
 * @param threshold - Percentage threshold (0-1), default 0.9 (90%)
 * @returns True if usage exceeds threshold
 *
 * @example
 * if (isNearQuota(0.8)) {
 *   // Cleanup when above 80%
 *   clearOldestEntries('app-cache-');
 * }
 */
export function isNearQuota(threshold = 0.9): boolean {
  if (threshold < 0 || threshold > 1) {
    logger.warn('Invalid threshold, must be 0-1', {
      action: 'isNearQuota',
      threshold
    });
    threshold = 0.9; // Default to 90%
  }

  const percentage = getUsagePercentage();
  return percentage >= threshold * 100;
}

/**
 * Clears the oldest entries matching a key prefix using LRU strategy
 *
 * Identifies entries by prefix, parses timestamps from stored data,
 * and removes the oldest entries until storage is below threshold or
 * a maximum number of entries are removed.
 *
 * @param keysPrefix - Prefix to filter localStorage keys (e.g., 'specificity-session-')
 * @param targetPercentage - Target usage percentage after cleanup (0-1), default 0.7 (70%)
 * @param maxEntriesToRemove - Maximum entries to remove in one cleanup, default 10
 * @returns Number of entries removed
 *
 * @example
 * // Clear old session data
 * const removed = clearOldestEntries('specificity-session-', 0.6);
 * console.log(`Removed ${removed} old sessions`);
 */
export function clearOldestEntries(
  keysPrefix: string,
  targetPercentage = 0.7,
  maxEntriesToRemove = 10
): number {
  if (!keysPrefix) {
    logger.warn('No key prefix provided for cleanup', { action: 'clearOldestEntries' });
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
      logger.info('No entries found matching prefix', {
        action: 'clearOldestEntries',
        prefix: keysPrefix
      });
      return 0;
    }

    // Parse timestamps and sort by age (oldest first)
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
            : 0; // No timestamp = oldest

          return { key, timestamp };
        } catch {
          // If parse fails, treat as oldest
          return { key, timestamp: 0 };
        }
      })
      .filter((entry): entry is StorageEntry => entry !== null)
      .sort((a, b) => a.timestamp - b.timestamp); // Oldest first

    // Remove entries until we reach target percentage or max removals
    let removedCount = 0;
    const targetUsage = targetPercentage * getStorageQuota();

    for (const entry of entries) {
      if (removedCount >= maxEntriesToRemove) {
        logger.info('Reached max removals limit', {
          action: 'clearOldestEntries',
          removed: removedCount,
          maxEntriesToRemove
        });
        break;
      }

      if (getStorageUsage() <= targetUsage) {
        logger.info('Reached target storage usage', {
          action: 'clearOldestEntries',
          removed: removedCount,
          currentUsage: getStorageUsage(),
          targetUsage
        });
        break;
      }

      localStorage.removeItem(entry.key);
      removedCount++;

      logger.debug('Removed old entry', {
        action: 'clearOldestEntries',
        key: entry.key,
        timestamp: new Date(entry.timestamp).toISOString()
      });
    }

    logger.info('Cleanup completed', {
      action: 'clearOldestEntries',
      removed: removedCount,
      remaining: entries.length - removedCount,
      usagePercentage: getUsagePercentage()
    });

    return removedCount;
  } catch (error) {
    logger.error('Failed to clear old entries', error instanceof Error ? error : new Error(String(error)), {
      action: 'clearOldestEntries',
      prefix: keysPrefix
    });
    return 0;
  }
}

/**
 * Gets detailed storage statistics for monitoring
 *
 * @returns Object with usage metrics
 *
 * @example
 * const stats = getStorageStats();
 * console.log(`Using ${stats.usedMB.toFixed(2)} MB of ${stats.quotaMB} MB`);
 */
export function getStorageStats() {
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
