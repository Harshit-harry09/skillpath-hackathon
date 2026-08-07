// updated
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { checkGuestRateLimit } from './rate-limit';

export function requestId(req: NextRequest): string {
  const supplied = req.headers.get('x-request-id')?.trim();
  return supplied && supplied.length <= 100 ? supplied : crypto.randomUUID();
}

export function withRequestId(response: NextResponse, id: string): NextResponse {
  response.headers.set('X-Request-Id', id);
  return response;
}

export function rateLimitResponse(retryAfterSeconds = 60) {
  return NextResponse.json(
    {
      error: 'too_many_requests',
      message: 'Too many AI requests. Please wait a minute and try again.',
    },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export function guardAiRequest(req: NextRequest, identity?: string, maxRequests = 10) {
  const result = checkGuestRateLimit(req, maxRequests, 60_000, identity);
  return result.success ? null : rateLimitResponse();
}
