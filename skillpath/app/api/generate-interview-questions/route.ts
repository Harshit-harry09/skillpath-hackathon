import { NextRequest, NextResponse } from 'next/server';
import { guardAiRequest, requestId, withRequestId } from '@/lib/request-guard';
import { callGeminiJSON } from '@/lib/gemini';
import { getAuthUserSafe } from '@/lib/auth-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const traceId = requestId(req);
  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 20 : 5);
    if (rateLimitError) return withRequestId(rateLimitError, traceId);

    const body = await req.json();
    const { roleLabel, skillGaps, userSkills } = body;

    if (!roleLabel) {
      return withRequestId(
        NextResponse.json({ error: 'bad_request', message: 'Missing target role label.' }, { status: 400 }),
        traceId
      );
    }

    const gapsList = (skillGaps || []).slice(0, 5).join(', ') || 'General role requirements';
    const skillsList = (userSkills || []).slice(0, 5).join(', ') || 'Core candidate skills';

    const systemPrompt = `You are an executive technical interviewer preparing interview questions for a ${roleLabel} candidate.
Return JSON with 4 categories of questions: technical, behavioral, HR, and project.
For each question, provide: question, target_skill, expected_answer_points, and difficulty.`;

    const userPrompt = `Role: ${roleLabel}
Candidate Skill Gaps: ${gapsList}
Candidate Proven Skills: ${skillsList}

Generate 6 high-impact interview questions tailored specifically to test their skill gaps and verify proven experience.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        questions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              category: { type: 'STRING' }, // technical, behavioral, hr, project
              question: { type: 'STRING' },
              target_skill: { type: 'STRING' },
              expected_answer_points: { type: 'ARRAY', items: { type: 'STRING' } },
              difficulty: { type: 'STRING' }, // easy, medium, hard
            },
            required: ['category', 'question', 'target_skill', 'expected_answer_points', 'difficulty'],
          },
        },
      },
      required: ['questions'],
    } as const;

    try {
      const response = await callGeminiJSON<{ questions: any[] }>(systemPrompt, userPrompt, {
        model: 'gemini-2.5-flash',
        temperature: 0.2,
        maxTokens: 2048,
        responseSchema: schema,
      });

      return withRequestId(NextResponse.json(response), traceId);
    } catch {
      // Deterministic fallback if AI unavailable
      const fallbackQuestions = [
        {
          category: 'technical',
          question: `How would you architect a production system utilizing ${skillGaps?.[0] || 'modern tech stack'}?`,
          target_skill: skillGaps?.[0] || 'Technical Architecture',
          expected_answer_points: ['Scalability principles', 'Error handling', 'Data persistence'],
          difficulty: 'hard',
        },
        {
          category: 'project',
          question: `Describe a recent project where you demonstrated proficiency in ${userSkills?.[0] || 'software development'}.`,
          target_skill: userSkills?.[0] || 'Project Execution',
          expected_answer_points: ['Quantified impact', 'Trade-offs made', 'Tech stack choice'],
          difficulty: 'medium',
        },
        {
          category: 'behavioral',
          question: 'How do you handle technical debt when working against tight production deadlines?',
          target_skill: 'Engineering Rigor',
          expected_answer_points: ['Communication with stakeholders', 'Refactoring strategy', 'Prioritization'],
          difficulty: 'medium',
        },
        {
          category: 'hr',
          question: `What attracts you to this ${roleLabel} position and how do your skills align?`,
          target_skill: 'Role Alignment',
          expected_answer_points: ['Career vision', 'Core competency fit', 'Long-term motivation'],
          difficulty: 'easy',
        },
      ];

      return withRequestId(
        NextResponse.json({ questions: fallbackQuestions, source: 'deterministic_fallback' }),
        traceId
      );
    }
  } catch (error) {
    return withRequestId(
      NextResponse.json({ error: 'internal_error', message: 'Failed to generate interview questions.' }, { status: 500 }),
      traceId
    );
  }
}
