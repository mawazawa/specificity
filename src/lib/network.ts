/**
 * Network Status Utilities
 * Detects online/offline state and provides connectivity monitoring
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Network status state
 */
export interface NetworkStatus {
  /** True if browser reports online */
  isOnline: boolean;
  /** True if actively checking connectivity */
  isChecking: boolean;
  /** Last connectivity check timestamp */
  lastChecked: Date | null;
  /** Estimated connection quality (if available) */
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  /** Round-trip time in ms (if available) */
  rtt?: number;
  /** Downlink speed in Mbps (if available) */
  downlink?: number;
}

/**
 * Get current network status
 */
export function getNetworkStatus(): NetworkStatus {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const connection = (nav as Navigator & { connection?: NetworkInformation })?.connection;

  return {
    isOnline: nav?.onLine ?? true,
    isChecking: false,
    lastChecked: null,
    effectiveType: connection?.effectiveType,
    rtt: connection?.rtt,
    downlink: connection?.downlink,
  };
}

/**
 * NetworkInformation API type (not in default TypeScript lib)
 */
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  rtt?: number;
  downlink?: number;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

/**
 * React hook for monitoring network status
 *
 * @returns Current network status with reactive updates
 *
 * @example
 * function App() {
 *   const { isOnline, effectiveType } = useNetworkStatus();
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />;
 *   }
 *
 *   return <MainContent />;
 * }
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(getNetworkStatus);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true, lastChecked: new Date() }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false, lastChecked: new Date() }));
    };

    const handleConnectionChange = () => {
      setStatus(getNetworkStatus());
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (Network Information API)
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    connection?.addEventListener('change', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      connection?.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  return status;
}

/**
 * Check actual connectivity by making a lightweight request
 * This is more reliable than navigator.onLine which can give false positives
 *
 * @param timeout - Request timeout in ms (default: 5000)
 * @returns Promise resolving to true if connected
 */
export async function checkConnectivity(timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Use a known reliable endpoint with minimal payload
    // Google's generate_204 endpoint returns 204 No Content
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // no-cors mode always returns opaque response, but successful fetch means we're online
    return response.type === 'opaque' || response.ok;
  } catch {
    return false;
  }
}

/**
 * React hook for checking connectivity on demand
 *
 * @returns Object with check function and status
 */
export function useConnectivityCheck(): {
  check: () => Promise<boolean>;
  isChecking: boolean;
  lastResult: boolean | null;
} {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  const check = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const result = await checkConnectivity();
      setLastResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { check, isChecking, lastResult };
}

/**
 * Determine if we should retry based on network conditions
 */
export function shouldRetryBasedOnNetwork(): boolean {
  const status = getNetworkStatus();

  // Don't retry if offline
  if (!status.isOnline) {
    return false;
  }

  // Consider slow connections - may not be worth retrying immediately
  if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
    // Could increase retry delay for slow connections
    return true;
  }

  return true;
}

/**
 * Wait for network to come back online
 *
 * @param timeout - Maximum time to wait in ms (default: 30000)
 * @returns Promise that resolves when online or rejects on timeout
 */
export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      reject(new Error('Timed out waiting for network'));
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}
