/**
 * Type-safe localStorage wrapper.
 * Supports generic types, JSON serialization, and optional expiration.
 */

interface StorageItem<T> {
  value: T;
  expiresAt?: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Set a value in localStorage with optional expiration (in milliseconds).
 */
export function setItem<T>(key: string, value: T, expirationMs?: number): void {
  if (!isBrowser()) return;
  try {
    const item: StorageItem<T> = { value };
    if (expirationMs) {
      item.expiresAt = Date.now() + expirationMs;
    }
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`storage.setItem failed for key "${key}":`, error);
  }
}

/**
 * Get a value from localStorage. Returns null if key doesn't exist or is expired.
 */
export function getItem<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const item: StorageItem<T> = JSON.parse(raw);

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value as T;
  } catch {
    return null;
  }
}

/**
 * Remove a key from localStorage.
 */
export function removeItem(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`storage.removeItem failed for key "${key}":`, error);
  }
}

/**
 * Clear all localStorage data.
 */
export function clear(): void {
  if (!isBrowser()) return;
  try {
    localStorage.clear();
  } catch (error) {
    console.error("storage.clear failed:", error);
  }
}

/**
 * Check if a key exists in localStorage and is not expired.
 */
export function has(key: string): boolean {
  if (!isBrowser()) return false;
  const value = getItem<unknown>(key);
  return value !== null;
}

/**
 * Update a value in localStorage by merging with the existing value.
 * Works with objects and arrays.
 */
export function update<T>(key: string, updater: (prev: T | null) => T): void {
  if (!isBrowser()) return;
  try {
    const prev = getItem<T>(key);
    const next = updater(prev);
    setItem(key, next);
  } catch (error) {
    console.error(`storage.update failed for key "${key}":`, error);
  }
}

const storage = { setItem, getItem, removeItem, clear, has, update };

export default storage;