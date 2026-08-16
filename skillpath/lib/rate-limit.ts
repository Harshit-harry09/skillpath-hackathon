// updated
import { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";

const localCache = new LRUCache<string, number[]>({
  max: 5000,
  ttl: 60 * 1000, // 1 minute window
});

let distributedLimiter: any = null;
let initialized = false;

function getDistributedLimiter(): any {
  if (initialized) return distributedLimiter;
  initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const { Ratelimit } = require("@upstash/ratelimit");
      const { Redis } = require("@upstash/redis");

      distributedLimiter = new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(15, "1 m"),
        analytics: true,
        prefix: "skillpath:ratelimit",
      });
    } catch (err) {
      console.warn("[RateLimit] Upstash initialization failed, falling back to local LRU:", err);
    }
  }

  return distributedLimiter;
}

/**
 * Extract client IP from request headers or supplied identity.
 */
export function extractClientIp(req: NextRequest, identity?: string): string {
  const configuredProxy = process.env.TRUST_PROXY_HEADERS === "true";
  const forwardedIp = configuredProxy
    ? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : undefined;

  return (
    identity ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    forwardedIp ||
    "anonymous"
  );
}

/**
 * Async distributed rate limit checker using Upstash Redis with local cache fallback.
 */
export async function checkDistributedRateLimit(
  ip: string,
  maxRequests = 15
): Promise<{ success: boolean; remaining: number }> {
  const limiter = getDistributedLimiter();
  if (limiter) {
    try {
      const result = await limiter.limit(ip);
      return { success: result.success, remaining: result.remaining };
    } catch (error) {
      console.warn("[RateLimit] Upstash Redis error, falling back to local LRU cache:", error);
    }
  }

  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = (localCache.get(ip) || []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  timestamps.push(now);
  localCache.set(ip, timestamps);
  return { success: true, remaining: maxRequests - timestamps.length };
}

/**
 * Sliding-window rate limiter for guest AI routes.
 * Limits guest IP addresses to maxRequests per windowMs.
 */
export function checkGuestRateLimit(
  req: NextRequest,
  maxRequests = 10,
  windowMs = 60 * 1000,
  identity?: string
): { success: boolean; remaining: number } {
  const ip = extractClientIp(req, identity);

  const now = Date.now();
  const timestamps = localCache.get(ip) || [];

  // Filter out timestamps outside the current window
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  validTimestamps.push(now);
  localCache.set(ip, validTimestamps);

  // Trigger background distributed sync if Redis is configured
  const limiter = getDistributedLimiter();
  if (limiter) {
    void limiter.limit(ip).catch(() => {
      // non-blocking fallback
    });
  }

  return { success: true, remaining: maxRequests - validTimestamps.length };
}
