import { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";

const ipTracker = new LRUCache<string, number[]>({
  max: 5000,
  ttl: 60 * 1000, // 1 minute window
});

/**
 * Lightweight sliding-window rate limiter for guest AI routes.
 * Limits guest IP addresses to maxRequests per windowMs.
 */
export function checkGuestRateLimit(
  req: NextRequest,
  maxRequests = 10,
  windowMs = 60 * 1000
): { success: boolean; remaining: number } {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const now = Date.now();
  const timestamps = ipTracker.get(ip) || [];

  // Filter out timestamps outside the current window
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  validTimestamps.push(now);
  ipTracker.set(ip, validTimestamps);

  return { success: true, remaining: maxRequests - validTimestamps.length };
}
