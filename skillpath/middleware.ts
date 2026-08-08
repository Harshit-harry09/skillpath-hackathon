// updated
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { checkGuestRateLimit } from '@/lib/rate-limit';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Rate limiting applies only to the most expensive AI analysis route.
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

  // Security & performance headers applied to every response (HTML + API).
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

export const config = {
  // Apply middleware to all routes so security headers reach HTML pages.
  // Static Next.js internals (_next/static, favicon etc.) are excluded
  // by default by the runtime before this matcher is evaluated.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
