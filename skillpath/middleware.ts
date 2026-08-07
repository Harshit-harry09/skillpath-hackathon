// updated
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge-compatible sliding window IP tracker map
const rateLimitMap = new Map<string, number[]>();

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Only apply rate limiting to API routes
  if (path.startsWith('/api/analyze')) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 15; // 15 requests per minute per IP for analysis
    const now = Date.now();

    const timestamps = rateLimitMap.get(ip) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please wait a minute before running another analysis.',
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);

    // Clean up stale entries periodically if map grows large
    if (rateLimitMap.size > 2000) {
      for (const [k, ts] of rateLimitMap.entries()) {
        if (ts.every((t) => now - t >= windowMs)) {
          rateLimitMap.delete(k);
        }
      }
    }
  }

  const response = NextResponse.next();

  // Edge & Security Performance Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  
  if (req.method === 'GET' && !path.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
