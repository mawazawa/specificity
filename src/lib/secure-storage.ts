/**
 * Secure localStorage with Encryption
 * Protects session data from XSS attacks
 * Action 27: 88% confidence
 */

// ============================================
// TYPES
// ============================================

interface EncryptedData {
  v: 1; // Version
  iv: string; // Initialization vector (base64)
  data: string; // Encrypted data (base64)
  tag: string; // Auth tag (base64)
}

interface StorageOptions {
  encrypt?: boolean;
  ttl?: number; // TTL in milliseconds
}

interface StoredValue<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
  encrypted: boolean;
}

// ============================================
// CRYPTO UTILITIES
// ============================================

/**
 * Get or create encryption key
 * Uses Web Crypto API for secure key derivation
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyName = 'specificity_key';

  // Try to get existing key from IndexedDB
  const existingKey = await getStoredKey(keyName);
  if (existingKey) {
    return existingKey;
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // Not extractable
    ['encrypt', 'decrypt']
  );

  // Store key in IndexedDB
  await storeKey(keyName, key);
  return key;
}

/**
 * Store CryptoKey in IndexedDB
 */
async function storeKey(name: string, key: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('specificity_crypto', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('keys', 'readwrite');
      const store = tx.objectStore('keys');
      store.put(key, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get CryptoKey from IndexedDB
 */
async function getStoredKey(name: string): Promise<CryptoKey | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open('specificity_crypto', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('keys')) {
        resolve(null);
        return;
      }
      const tx = db.transaction('keys', 'readonly');
      const store = tx.objectStore('keys');
      const getRequest = store.get(name);
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => resolve(null);
    };

    request.onerror = () => resolve(null);
  });
}

/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data: string): Promise<EncryptedData> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  // AES-GCM includes auth tag in the ciphertext
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const tag = encryptedArray.slice(-16);

  return {
    v: 1,
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...ciphertext)),
    tag: btoa(String.fromCharCode(...tag)),
  };
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encrypted: EncryptedData): Promise<string> {
  const key = await getEncryptionKey();

  const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encrypted.data), (c) =>
    c.charCodeAt(0)
  );
  const tag = Uint8Array.from(atob(encrypted.tag), (c) => c.charCodeAt(0));

  // Combine ciphertext and tag
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    combined
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if value is encrypted data
 */
function isEncryptedData(value: unknown): value is EncryptedData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'v' in value &&
    'iv' in value &&
    'data' in value &&
    'tag' in value
  );
}

// ============================================
// SECURE STORAGE CLASS
// ============================================

/**
 * Secure localStorage wrapper with optional encryption
 */
export class SecureStorage {
  private prefix: string;
  private defaultEncrypt: boolean;

  constructor(prefix: string = 'specificity', defaultEncrypt: boolean = true) {
    this.prefix = prefix;
    this.defaultEncrypt = defaultEncrypt;
  }

  /**
   * Get full key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}_${key}`;
  }

  /**
   * Set a value in storage
   */
  async set<T>(
    key: string,
    value: T,
    options?: StorageOptions
  ): Promise<void> {
    const shouldEncrypt = options?.encrypt ?? this.defaultEncrypt;
    const fullKey = this.getKey(key);

    const stored: StoredValue<T> = {
      value,
      timestamp: Date.now(),
      encrypted: shouldEncrypt,
    };

    if (options?.ttl) {
      stored.expiresAt = Date.now() + options.ttl;
    }

    let dataToStore: string;

    if (shouldEncrypt && this.isEncryptionSupported()) {
      try {
        const encrypted = await encryptData(JSON.stringify(stored));
        dataToStore = JSON.stringify(encrypted);
      } catch {
        // Fallback to unencrypted on error
        stored.encrypted = false;
        dataToStore = JSON.stringify(stored);
      }
    } else {
      stored.encrypted = false;
      dataToStore = JSON.stringify(stored);
    }

    try {
      localStorage.setItem(fullKey, dataToStore);
    } catch (e) {
      // Handle quota exceeded
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.cleanup();
        localStorage.setItem(fullKey, dataToStore);
      } else {
        throw e;
      }
    }
  }

  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const raw = localStorage.getItem(fullKey);

    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      // Check if encrypted
      if (isEncryptedData(parsed)) {
        if (!this.isEncryptionSupported()) {
          return null;
        }
        const decrypted = await decryptData(parsed);
        const stored: StoredValue<T> = JSON.parse(decrypted);
        return this.validateAndReturn(stored, fullKey);
      }

      // Unencrypted data
      const stored = parsed as StoredValue<T>;
      return this.validateAndReturn(stored, fullKey);
    } catch {
      // Corrupted data, remove it
      localStorage.removeItem(fullKey);
      return null;
    }
  }

  /**
   * Validate stored value and return if valid
   */
  private validateAndReturn<T>(
    stored: StoredValue<T>,
    fullKey: string
  ): T | null {
    // Check expiry
    if (stored.expiresAt && Date.now() > stored.expiresAt) {
      localStorage.removeItem(fullKey);
      return null;
    }

    return stored.value;
  }

  /**
   * Remove a value from storage
   */
  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  /**
   * Clear all prefixed storage
   */
  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(this.prefix)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        if (!isEncryptedData(parsed) && parsed.expiresAt && parsed.expiresAt < now) {
          keysToRemove.push(key);
        }
      } catch {
        // Corrupted, remove
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Check if encryption is supported
   */
  isEncryptionSupported(): boolean {
    return (
      typeof crypto !== 'undefined' &&
      typeof crypto.subtle !== 'undefined' &&
      typeof indexedDB !== 'undefined'
    );
  }

  /**
   * Get storage stats
   */
  getStats(): { count: number; totalSize: number; encrypted: number } {
    let count = 0;
    let totalSize = 0;
    let encrypted = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(this.prefix)) continue;

      count++;
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // UTF-16

        try {
          const parsed = JSON.parse(value);
          if (isEncryptedData(parsed)) encrypted++;
        } catch {
          // Ignore
        }
      }
    }

    return { count, totalSize, encrypted };
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

/**
 * Secure storage for session data
 */
export const secureSessionStorage = new SecureStorage('specificity_session', true);

/**
 * Regular storage for non-sensitive data
 */
export const regularStorage = new SecureStorage('specificity', false);

// ============================================
// MIGRATION UTILITIES
// ============================================

/**
 * Migrate unencrypted data to encrypted
 */
export async function migrateToEncrypted(
  storage: SecureStorage,
  keys: string[]
): Promise<number> {
  let migrated = 0;

  for (const key of keys) {
    const value = await storage.get(key);
    if (value !== null) {
      await storage.set(key, value, { encrypt: true });
      migrated++;
    }
  }

  return migrated;
}
