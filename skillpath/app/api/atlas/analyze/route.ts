/**
 * API Route: /api/atlas/analyze
 *
 * Ultra-fast endpoint using DAG Parallel Wave Execution Scheduler & SHA-256 Cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFastDAGPipeline } from '@/lib/atlas/fast-pipeline';
import { extractTextFromPDF } from '@/lib/pdf-extract';
import { decodePdfBase64 } from '@/lib/atlas/pdf-input';
import { DEFAULT_MOCK_GOAL } from '@/lib/atlas/fixtures';
import { AtlasStartSchema, DEFAULT_ATLAS_GOAL } from '@/lib/atlas/schemas';
import { runAtlasSoftParse } from '@/lib/atlas/soft-parse';
import type { AnalysisResult } from '@/types/analysis';
import { adaptAtlasState } from '@/lib/atlas/state-adapter';
import { saveAtlasSessionSnapshot } from '@/lib/atlas/session-snapshot';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest } from '@/lib/request-guard';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return rateLimitError;

    const body = await req.json().catch(() => ({}));
    const parsedInput = AtlasStartSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid Atlas input.', details: parsedInput.error.flatten() },
        { status: 400 },
      );
    }
    const input = parsedInput.data;

    let resumeText = input.resumeText || '';
    let userGoal = input.userGoal;
    const confirmedAnswers = input.confirmedAnswers || {};

    const analysisId = input.analysisId;
    let hardFacts: any = null;

    if (analysisId) {
      try {
        const { getDb } = await import('@/lib/firebase-admin');
        const db = getDb();
        const doc = await db.collection('analyses').doc(analysisId).get();
        if (doc.exists) {
          hardFacts = doc.data();
          if (!resumeText && (hardFacts.resume_text || hardFacts.parsed_text)) {
            resumeText = hardFacts.resume_text || hardFacts.parsed_text;
          }
          console.log(`[Atlas Analyze API] ✓ Smart Ingestion: Loaded pre-computed Hard Facts for analysisId=${analysisId}`);
        }
      } catch (dbErr) {
        console.warn(`[Atlas Analyze API] Firestore lookup warning for analysisId=${analysisId}:`, dbErr);
      }
    }

    if (analysisId && input.mode === 'funnel' && !hardFacts) {
      return NextResponse.json(
        { success: false, error: 'The imported analysis could not be found. Return to Results and launch Atlas again.' },
        { status: 404 },
      );
    }

    if (input.pdfBase64) {
      try {
        const pdfBuffer = decodePdfBase64(input.pdfBase64);
        const extracted = await extractTextFromPDF(pdfBuffer);
        if (extracted && extracted.length > 30) {
          resumeText = extracted;
          console.log(`[Atlas Analyze API] Successfully extracted ${extracted.length} chars from PDF`);
        }
      } catch (pdfErr) {
        console.warn('[Atlas Analyze API] PDF base64 extraction warning:', pdfErr);
      }
    }

    // A funnel launch must use the exact resume previously analyzed, never
    // the page's demo/default text or an incidental client-side draft.
    if (input.mode === 'funnel' && hardFacts) {
      resumeText = hardFacts.resume_text || hardFacts.parsed_text || '';
      if (userGoal === DEFAULT_ATLAS_GOAL && (hardFacts.role_label || hardFacts.role_category)) {
        userGoal = hardFacts.role_label || hardFacts.role_category;
      }
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

    const hardFactsForState = (hardFacts || {
      share_token: analysisId,
      resume_skills: [],
      matched_skills: [],
      missing_skills: [],
      parsed_text: resumeText,
    }) as AnalysisResult;
    const softSignals = await runAtlasSoftParse(resumeText);
    const source = {
      mode: input.mode,
      analysisId: hardFactsForState.share_token,
      atsScore: hardFactsForState.composite_ats_score?.overall_score,
      missingSkills: hardFactsForState.missing_skills || (hardFactsForState.skill_gaps || []).map((gap) => gap.skill),
      matchedSkills: hardFactsForState.matched_skills || [],
      seniority: hardFactsForState.experience_analysis?.seniority_level,
      gaps: hardFactsForState.experience_analysis?.employment_gaps,
    };

    const result = await runFastDAGPipeline(
      { resumeText, userGoal: userGoal || DEFAULT_MOCK_GOAL, analysisId, hardFacts, userId: user?.uid },
      confirmedAnswers
    );

    const normalizedState = adaptAtlasState({
      ...result,
      schema_version: 2,
      status: 'complete',
      source,
      softSignals,
    });
    await saveAtlasSessionSnapshot(normalizedState);

    return NextResponse.json({
      success: true,
      data: normalizedState,
      extractedResumeText: resumeText,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to process Atlas analysis.';
    console.error('Atlas Analyze API error:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
