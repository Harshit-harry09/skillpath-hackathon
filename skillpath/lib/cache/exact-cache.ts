import { LRUCache } from "lru-cache";
import crypto from "crypto";

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours default TTL
});

export function generateCacheKey(namespace: string, payload: unknown): string {
  const hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return `${namespace}:${hash}`;
}

export function getCachedResult<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCachedResult<T>(key: string, value: T, ttlMs?: number): void {
  cache.set(key, value, { ttl: ttlMs });
}

export function clearCacheKey(key: string): void {
  cache.delete(key);
}
