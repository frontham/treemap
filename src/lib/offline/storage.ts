/**
 * Thin sync wrapper around localStorage for the offline queue.
 * Single key, single JSON array. Plenty of room for the v1 use case
 * (a few hundred queued trees max) without pulling in IndexedDB / Dexie.
 */
const STORAGE_KEY = 'treemap:offline-queue:v1';

export function readQueue<T>(): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeQueue<T>(items: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
