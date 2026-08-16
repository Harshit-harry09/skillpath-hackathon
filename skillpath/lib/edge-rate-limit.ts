import { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";

const edgeLocalCache = new LRUCache<string, number[]>({
  max: 5000,
  ttl: 60 * 1000, // 1 minute window
});

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
 * Edge-compatible sliding-window rate limiter for guest middleware.
 * Zero Node.js API dependencies, zero WASM, sub-millisecond execution.
 */
export function checkGuestRateLimit(
  req: NextRequest,
  maxRequests = 10,
  windowMs = 60 * 1000,
  identity?: string
): { success: boolean; remaining: number } {
  const ip = extractClientIp(req, identity);

  const now = Date.now();
  const timestamps = edgeLocalCache.get(ip) || [];

  // Filter out timestamps outside the current window
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  validTimestamps.push(now);
  edgeLocalCache.set(ip, validTimestamps);

  return { success: true, remaining: maxRequests - validTimestamps.length };
}
