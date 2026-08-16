import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest } from '@/lib/request-guard';
import { runGeneratorTool } from '@/lib/ai/generator-factory';
import type { GeneratorToolId } from '@/lib/ai/generator-registry';

export async function runDeprecatedGeneratorRoute(req: NextRequest, tool: GeneratorToolId): Promise<NextResponse> {
  const user = await getAuthUserSafe(req);
  const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
  if (rateLimitError) return rateLimitError;
  const result = await runGeneratorTool(tool, await req.json().catch(() => ({})));
  const response = NextResponse.json({ ...result.data, fallback: result.fallback, source: result.source });
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', 'Wed, 31 Mar 2027 00:00:00 GMT');
  response.headers.set('Link', `</api/generate/${tool}>; rel="successor-version"`);
  return response;
}

