// updated
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest, requestId, withRequestId } from '@/lib/request-guard';
import { readEnrichmentPayload, deleteEnrichmentPayload } from '@/lib/analyze-enrichment-store';
import { extractAiEvidence, generateGroundedExplanation, AI_ANALYSIS_PROMPT_VERSION } from '@/lib/ai-evidence-extractor';
import { buildEnrichedGaps, matchRequirements, scoreEvidenceCoverage } from '@/lib/semantic-skill-matcher';
import { calculateCountdown } from '@/lib/readiness';
import type { SkillGap } from '@/types/analysis';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function publicData(data: Record<string, unknown>) {
  const safe = { ...data };
  delete safe.jd_text;
  delete safe.resume_text;
  delete safe.user_id;
  return safe;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = requestId(req);
  const { id } = await params;
  if (!id) {
    return withRequestId(NextResponse.json({ error: 'missing_id' }, { status: 400 }), traceId);
  }

  const user = await getAuthUserSafe(req);
  const rateLimitError = guardAiRequest(req, user?.uid, user ? 10 : 3);
  if (rateLimitError) return withRequestId(rateLimitError, traceId);

  let db;
  try {
    db = getDb();
  } catch {
    return withRequestId(NextResponse.json(
      { error: 'service_unavailable', message: 'Analysis enrichment is temporarily unavailable.' },
      { status: 503 }
    ), traceId);
  }

  const analysisRef = db.collection('analyses').doc(id);
  let analysis: Record<string, unknown>;
  try {
    const lock = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(analysisRef);
      if (!snapshot.exists) return { state: 'missing' as const };
      const value = snapshot.data() as Record<string, unknown>;
      if (value.user_id && value.user_id !== user?.uid) return { state: 'forbidden' as const };
      if (value.enrichment_status === 'complete' || value.enrichment_status === 'fallback') {
        return { state: 'done' as const, value };
      }

      const startedAt = Date.parse(String(value.enrichment_started_at || ''));
      if (value.enrichment_status === 'processing' && Number.isFinite(startedAt) && Date.now() - startedAt < 5 * 60_000) {
        return { state: 'processing' as const };
      }

      transaction.update(analysisRef, {
        enrichment_status: 'processing',
        enrichment_started_at: new Date().toISOString(),
        enrichment_error: null,
      });
      return { state: 'started' as const, value };
    });

    if (lock.state === 'missing') {
      return withRequestId(NextResponse.json({ error: 'not_found' }, { status: 404 }), traceId);
    }
    if (lock.state === 'forbidden') {
      return withRequestId(NextResponse.json({ error: 'forbidden' }, { status: 403 }), traceId);
    }
    if (lock.state === 'done') {
      return withRequestId(NextResponse.json(publicData(lock.value)), traceId);
    }
    if (lock.state === 'processing') {
      return withRequestId(NextResponse.json({ enrichment_status: 'processing' }, { status: 202 }), traceId);
    }
    analysis = lock.value;
  } catch (error) {
    console.error(`[Analyze Enrich] Lock failed [${traceId}]`, error);
    return withRequestId(NextResponse.json({ error: 'enrichment_lock_failed' }, { status: 503 }), traceId);
  }

  try {
    const payload = await readEnrichmentPayload(db, id);
    if (!payload) {
      await analysisRef.update({ enrichment_status: 'unavailable', enrichment_error: 'temporary_input_expired' });
      return withRequestId(NextResponse.json({
        ...publicData(analysis),
        enrichment_status: 'unavailable',
        enrichment_error: 'temporary_input_expired',
      }), traceId);
    }

    const extraction = await extractAiEvidence(payload.resumeText, payload.jdText);
    const matches = await matchRequirements(extraction.job_requirements, extraction.resume_evidence);
    const score = scoreEvidenceCoverage(extraction.job_requirements, matches);
    const gaps = buildEnrichedGaps(
      Array.isArray(analysis.skill_gaps) ? analysis.skill_gaps as SkillGap[] : [],
      extraction.job_requirements,
      matches,
      extraction.resume_evidence,
      Array.isArray(analysis.mvc_skills) ? analysis.mvc_skills as string[] : []
    );
    const countdown = calculateCountdown(gaps);
    const explanation = await generateGroundedExplanation(
      extraction.role.canonical,
      extraction.job_requirements,
      extraction.resume_evidence,
      matches
    );

    const matchedSkills = extraction.job_requirements
      .filter((requirement) => matches.find((match) => match.requirement_id === requirement.id)?.status === 'matched')
      .map((requirement) => requirement.canonical_skill);
    const updated = {
      gap_score: score,
      summary: explanation.summary,
      summary_source: 'ai_grounded',
      role_label: extraction.role.confidence >= 0.75 ? extraction.role.canonical : analysis.role_label,
      skill_gaps: gaps,
      jd_skills: extraction.job_requirements.map((item) => item.canonical_skill),
      resume_skills: Array.from(new Set([
        ...(Array.isArray(analysis.resume_skills) ? analysis.resume_skills as string[] : []),
        ...extraction.resume_evidence.map((item) => item.canonical_skill),
      ])),
      matched_skills: Array.from(new Set([
        ...(Array.isArray(analysis.matched_skills) ? analysis.matched_skills as string[] : []),
        ...matchedSkills,
      ])),
      weeks_required: countdown.weeksRequired,
      ready_by_date: countdown.readyByDate,
      evidence: extraction.resume_evidence,
      requirements: extraction.job_requirements,
      matches,
      ai_explanation: explanation,
      enrichment_status: 'complete',
      enrichment_error: null,
      score_source: 'ai_evidence_deterministic_v1',
      ai_model: 'gemini-2.5-flash',
      ai_prompt_version: AI_ANALYSIS_PROMPT_VERSION,
      evidence_version: 'evidence-v1',
      enriched_at: new Date().toISOString(),
    };

    await analysisRef.update(updated);
    await deleteEnrichmentPayload(db, id);
    return withRequestId(NextResponse.json({ ...publicData(analysis), ...updated }), traceId);
  } catch (error) {
    console.error(`[Analyze Enrich] Failed [${traceId}]`, error instanceof Error ? error.message : error);
    await analysisRef.update({
      enrichment_status: 'fallback',
      enrichment_error: 'ai_unavailable',
      enriched_at: new Date().toISOString(),
    }).catch(() => undefined);
    await deleteEnrichmentPayload(db, id);
    return withRequestId(NextResponse.json({
      ...publicData(analysis),
      enrichment_status: 'fallback',
      enrichment_error: 'ai_unavailable',
      fallback: true,
    }), traceId);
  }
}
