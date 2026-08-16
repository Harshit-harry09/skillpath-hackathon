/**
 * Streaming API Route: POST /api/atlas/analyze/stream
 *
 * Implements WebStreams / Server-Sent Events (SSE) for sub-second perceived response time (<350ms FCP).
 * Integrates Smart Ingestion Funnel: Accepts optional analysisId to fetch pre-computed Hard Parse facts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFastDAGPipeline } from '@/lib/atlas/fast-pipeline';
import { DEFAULT_MOCK_GOAL } from '@/lib/atlas/fixtures';
import { getDb } from '@/lib/firebase-admin';
import { AtlasStartSchema, DEFAULT_ATLAS_GOAL } from '@/lib/atlas/schemas';
import { runAtlasSoftParse } from '@/lib/atlas/soft-parse';
import { buildAtlasState } from '@/lib/atlas/atlas-state-builder';
import type { AnalysisResult } from '@/types/analysis';
import { extractTextFromPDF } from '@/lib/pdf-extract';
import { decodePdfBase64 } from '@/lib/atlas/pdf-input';
import { adaptAtlasState } from '@/lib/atlas/state-adapter';
import { saveAtlasSessionSnapshot } from '@/lib/atlas/session-snapshot';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return rateLimitError;

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = AtlasStartSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input payload.', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { analysisId, pdfBase64, confirmedAnswers, mode } = parseResult.data;
    let resumeText = parseResult.data.resumeText || '';
    let userGoal = parseResult.data.userGoal;
    let hardFacts: any = null;

    if (pdfBase64) {
      try {
        const pdfBuffer = decodePdfBase64(pdfBase64);
        const extracted = await extractTextFromPDF(pdfBuffer);
        if (extracted.length > 30) resumeText = extracted;
      } catch (pdfError) {
        console.warn('[Atlas Stream API] PDF extraction warning:', pdfError);
      }
    }

    // ── Smart Ingestion Funnel ──────────────────────────────────────────────
    if (analysisId) {
      try {
        const db = getDb();
        const doc = await db.collection('analyses').doc(analysisId).get();
        if (doc.exists) {
          hardFacts = doc.data();
          if (!resumeText && (hardFacts.resume_text || hardFacts.parsed_text)) {
            resumeText = hardFacts.resume_text || hardFacts.parsed_text;
          }
          if (userGoal === DEFAULT_ATLAS_GOAL && (hardFacts.role_label || hardFacts.role_category)) {
            userGoal = hardFacts.role_label || hardFacts.role_category;
          }
          console.log(`[Atlas Stream API] ✓ Smart Ingestion: Loaded pre-computed Hard Facts for analysisId=${analysisId}`);
        }
      } catch (dbErr) {
        console.warn(`[Atlas Stream API] Firestore lookup warning for analysisId=${analysisId}:`, dbErr);
      }
    }

    if (analysisId && mode === 'funnel' && !hardFacts) {
      return NextResponse.json(
        { success: false, error: 'The imported analysis could not be found. Return to Results and launch Atlas again.' },
        { status: 404 },
      );
    }

    if (mode === 'funnel' && hardFacts) {
      resumeText = hardFacts.resume_text || hardFacts.parsed_text || '';
    }

    if (!resumeText && !hardFacts) {
      return NextResponse.json(
        { success: false, error: 'Atlas requires either analysisId, resumeText, or pdfBase64.' },
        { status: 400 },
      );
    }
    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: 'Atlas needs parsed resume text. Paste the resume text or run Analyze again.' },
        { status: 422 },
      );
    }
    if (!userGoal) userGoal = DEFAULT_MOCK_GOAL;

    const hardFactsForState = (hardFacts || {
      share_token: analysisId,
      resume_skills: [],
      matched_skills: [],
      missing_skills: [],
      parsed_text: resumeText,
    }) as AnalysisResult;
    const softSignals = await runAtlasSoftParse(resumeText);
    const initialState = buildAtlasState({
      hardFacts: hardFactsForState,
      softSignals,
      userGoal,
      confirmedAnswers,
      mode,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (eventType: string, payload: any) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`)
            );
          } catch (e) {
            // Controller closed by client
          }
        };

        try {
          const resultState = await runFastDAGPipeline(
            { resumeText, userGoal, analysisId, hardFacts, userId: user?.uid },
            confirmedAnswers,
            (phase, agentName, state) => {
              sendEvent('progress', { phase, agentName, traces: state.agentTraces });
            }
          );

            const normalizedState = adaptAtlasState({
              ...resultState,
              schema_version: 2,
              status: 'complete',
              source: initialState.source,
              softSignals,
            });
            await saveAtlasSessionSnapshot(normalizedState);
            sendEvent('complete', { success: true, data: normalizedState });
        } catch (err: any) {
          sendEvent('error', { success: false, error: err?.message || 'Pipeline streaming error' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to start SSE stream.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
