// updated
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { checkGuestRateLimit } from '@/lib/rate-limit';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Only apply rate limiting to API routes
  if (path.startsWith('/api/analyze')) {
    const rateCheck = checkGuestRateLimit(req, 15, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please wait a minute before running another analysis.',
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
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
