// updated
import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest, requestId, withRequestId } from '@/lib/request-guard';
import { UNIFIED_EXPLORE_SYSTEM, buildUnifiedExplorePrompt } from '@/prompts/explore-role';

export const runtime = 'nodejs';
export const maxDuration = 20;
export const dynamic = 'force-dynamic';

type ExplorePayload = Record<string, unknown>;

function isObject(value: unknown): value is ExplorePayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = requestId(req);
  const { id } = await params;
  const user = await getAuthUserSafe(req);
  const rateLimitError = guardAiRequest(req, user?.uid, user ? 10 : 3);
  if (rateLimitError) return withRequestId(rateLimitError, traceId);

  if (!id) return withRequestId(NextResponse.json({ error: 'missing_id' }, { status: 400 }), traceId);

  try {
    const db = getDb();
    const ref = db.collection('explorations').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return withRequestId(NextResponse.json({ error: 'not_found' }, { status: 404 }), traceId);

    const current = doc.data() as ExplorePayload;
    if (current.enrichment_status === 'complete') return withRequestId(NextResponse.json(current), traceId);

    const title = String(current.job_title_raw || current.role || 'career role');
    const generated = await callGeminiJSON<ExplorePayload>(
      UNIFIED_EXPLORE_SYSTEM,
      buildUnifiedExplorePrompt(title),
      { model: 'gemini-2.5-flash', temperature: 0.2, maxTokens: 4096 }
    );
    if (!isObject(generated)) throw new Error('Provider returned an invalid exploration object.');

    const merged = {
      ...current,
      role: typeof generated.role === 'string' ? generated.role : current.role,
      seniority: typeof generated.seniority === 'string' ? generated.seniority : current.seniority,
      company_type: typeof generated.company_type === 'string' ? generated.company_type : current.company_type,
      market_momentum: generated.market_momentum || current.market_momentum,
      salary_range: generated.salary_range || current.salary_range,
      top_employers: generated.top_employers || current.top_employers,
      mvc_skills: Array.isArray(generated.mvc_skills) ? generated.mvc_skills.slice(0, 30) : current.mvc_skills,
      skill_map: generated.skill_map || current.skill_map,
      learning_path: generated.learning_path || current.learning_path,
      total_weeks: isObject(generated.skill_map) && typeof generated.skill_map.total_weeks_from_zero === 'number'
        ? generated.skill_map.total_weeks_from_zero
        : current.total_weeks,
      source: 'gemini_enriched',
      fallback: false,
      enrichment_status: 'complete',
      provenance: {
        model: 'gemini-2.5-flash',
        generated_at: new Date().toISOString(),
        note: 'AI-generated estimates; verify salary and demand claims independently.',
      },
    };

    await ref.set(merged, { merge: true });
    return withRequestId(NextResponse.json(merged), traceId);
  } catch (error) {
    console.warn(`[Explore Enrichment] Failed [${traceId}]:`, error instanceof Error ? error.message : error);
    return withRequestId(NextResponse.json({ error: 'enrichment_failed', message: 'Optional AI enrichment is unavailable; the local role map remains valid.', fallback: true }, { status: 502 }), traceId);
  }
}
