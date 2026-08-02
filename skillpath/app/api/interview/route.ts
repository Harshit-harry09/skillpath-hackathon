import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { fallbackFeedback, type InterviewFeedback, type InterviewQuestion } from '@/lib/interview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

type InterviewRequest = {
  role?: unknown;
  experience?: unknown;
  question?: unknown;
  answer?: unknown;
  allowFollowUp?: unknown;
};

function normalizeFeedback(value: unknown, fallback: InterviewFeedback, allowFollowUp: boolean): InterviewFeedback {
  if (!value || typeof value !== 'object') return fallback;
  const item = value as Record<string, unknown>;
  const score = Math.max(1, Math.min(10, Math.round(Number(item.score) || fallback.score)));
  const list = (candidate: unknown, backup: string[]) => (
    Array.isArray(candidate)
      ? candidate.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).slice(0, 3)
      : backup
  );

  return {
    score,
    strengths: list(item.strengths, fallback.strengths),
    improvements: list(item.improvements, fallback.improvements),
    idealAnswer: typeof item.idealAnswer === 'string' && item.idealAnswer.trim() ? item.idealAnswer.trim() : fallback.idealAnswer,
    followUp: allowFollowUp && typeof item.followUp === 'string' && item.followUp.trim() ? item.followUp.trim() : null,
    source: 'gemini',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InterviewRequest;
    const role = typeof body.role === 'string' && body.role.trim() ? body.role.trim() : 'Software Engineer';
    const experience = typeof body.experience === 'string' && body.experience.trim() ? body.experience.trim() : 'Mid-level';
    const question = body.question as InterviewQuestion;
    const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
    const allowFollowUp = body.allowFollowUp !== false;

    if (!question || typeof question.prompt !== 'string' || !answer) {
      return NextResponse.json({ error: 'question_and_answer_required' }, { status: 400 });
    }

    const fallback = fallbackFeedback(question, answer);

    try {
      const feedback = await callGeminiJSON<unknown>(
        `You are an expert technical interviewer for a ${experience} candidate interviewing for a ${role} role. Evaluate the candidate's answer strictly and constructively.
Your output MUST include:
1. 'score': integer from 1 to 10.
2. 'strengths': array of 2-3 specific points on what the candidate got RIGHT or did well (accurate facts, valid concepts, clear reasoning).
3. 'improvements': array of 2-3 specific points on what the candidate got WRONG, missed, or stated inaccurately (missing technical details, incorrect assumptions, or unaddressed edge cases).
4. 'idealAnswer': a comprehensive, top-tier model answer that demonstrates what a 10/10 response looks like.
5. 'followUp': ${allowFollowUp ? 'If the score is below 7, provide exactly one targeted follow-up question to probe deeper.' : 'null'}.`,
        JSON.stringify({
          role,
          experience,
          question: question.prompt,
          question_type: question.type,
          evaluation_focus: question.focus,
          answer,
        }),
        {
          model: 'gemini-2.5-flash',
          temperature: 0.2,
          maxTokens: 1000,
          timeoutMs: 14000,
          responseSchema: {
            type: 'OBJECT',
            properties: {
              score: { type: 'INTEGER', minimum: 1, maximum: 10 },
              strengths: { type: 'ARRAY', items: { type: 'STRING' } },
              improvements: { type: 'ARRAY', items: { type: 'STRING' } },
              idealAnswer: { type: 'STRING' },
              followUp: { type: 'STRING', nullable: true },
            },
            required: ['score', 'strengths', 'improvements', 'idealAnswer', 'followUp'],
          },
        },
      );

      return NextResponse.json(normalizeFeedback(feedback, fallback, allowFollowUp), {
        headers: { 'X-Interview-Source': 'gemini' },
      });
    } catch (error) {
      console.warn('[Interview] Gemini failed; using deterministic feedback:', error instanceof Error ? error.message : error);
      return NextResponse.json(fallback, {
        headers: { 'X-Interview-Source': 'deterministic_fallback' },
      });
    }
  } catch (error) {
    console.error('[Interview] Request failed:', error);
    return NextResponse.json({ error: 'interview_feedback_failed' }, { status: 500 });
  }
}
