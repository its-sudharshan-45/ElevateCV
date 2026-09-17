/**
 * In-memory TTL cache.
 *
 * Purpose: cache high-read, rarely-mutated catalog data (e.g. learning resources)
 * to reduce repetitive database queries.
 *
 * Rules:
 * - Entries expire after `ttlMs` milliseconds.
 * - Call `invalidate(key)` or `invalidatePrefix(prefix)` immediately after mutations.
 * - This is a single-process cache and is NOT shared across multiple server instances.
 *   For multi-instance deployments, replace with a Redis-backed store.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.ttlMs),
    });
  }

  /** Remove a specific cache entry. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Remove all entries whose keys start with a given prefix. */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Returns the number of non-expired entries currently cached. */
  get size(): number {
    const now = Date.now();
    let count = 0;
    for (const entry of this.store.values()) {
      if (entry.expiresAt > now) count++;
    }
    return count;
  }

  /** Clear all entries. Primarily useful in tests. */
  clear(): void {
    this.store.clear();
  }
}

/** Default shared cache instance — TTL 60 seconds. */
export const cache = new TtlCache(60_000);
