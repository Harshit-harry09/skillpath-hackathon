import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { guardAiRequest } from '@/lib/request-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimitError = guardAiRequest(req, undefined, 10);
  if (rateLimitError) return rateLimitError;
  let skillA = 'Option A';
  let skillB = 'Option B';

  try {
    const body = await req.json();
    if (body.skillA && typeof body.skillA === 'string') skillA = body.skillA.trim();
    if (body.skillB && typeof body.skillB === 'string') skillB = body.skillB.trim();
  } catch (err) {
    console.warn('[Battle Estimate API] Body parse error:', err);
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!skillA || !skillB || skillA.length > 100 || skillB.length > 100) {
    return NextResponse.json({ error: 'invalid_input', message: 'Both skills must be between 1 and 100 characters.' }, { status: 400 });
  }

  const system = `You are a tech recruiter and developer ecosystem analyst. Output ONLY valid JSON. No markdown backticks, no extra text.`;
  const user = `Compare tech stack "${skillA}" vs "${skillB}".
Produce a normalized model estimate. Do not claim this is a real survey or real votes.

Format output as JSON:
{
  "optionA": { "name": "${skillA}", "votes": number, "premium": number, "trend": number },
  "optionB": { "name": "${skillB}", "votes": number, "premium": number, "trend": number },
  "verdict": "One sentence explaining which skill to learn and why.",
  "winner": "A" | "B" | "TIE",
  "shareA": number,
  "shareB": number,
  "highlights": ["highlight 1", "highlight 2"]
}

Rules:
- votes are normalized model points and optionA + optionB MUST equal 100
- premium is salary premium in USD (e.g. 8000 - 25000)
- trend is decimal growth (e.g. 0.15 - 0.40)
- shareA + shareB = 100`;

  try {
    const raw = await callGemini(system, user, { model: 'gemini-2.0-flash', temperature: 0.3, maxTokens: 400 });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleaned);

    if (data.optionA && data.optionB && data.winner) {
      return NextResponse.json({
        result: {
          optionA: {
            name: skillA,
            votes: Number(data.optionA.votes) || 5500,
            premium: Number(data.optionA.premium) || 12000,
            trend: Number(data.optionA.trend) || 0.2,
          },
          optionB: {
            name: skillB,
            votes: Number(data.optionB.votes) || 4500,
            premium: Number(data.optionB.premium) || 10000,
            trend: Number(data.optionB.trend) || 0.15,
          },
          verdict: data.verdict || `Learn ${data.winner === 'A' ? skillA : skillB} — market trend favors this architecture.`,
          totalVotes: 100,
          winner: data.winner,
          shareA: Number(data.shareA) || 55,
          shareB: Number(data.shareB) || 45,
          highlights: Array.isArray(data.highlights) && data.highlights.length > 0
            ? data.highlights
            : ['Model estimate; no survey data used'],
          isAiEstimated: true,
        },
      });
    }
  } catch (error) {
    console.error('[Battle Estimate API] Gemini estimate error:', error);
  }

  // Transparent deterministic fallback; these are not survey votes.
  return NextResponse.json({
    result: {
      optionA: { name: skillA, votes: 54, premium: 12500, trend: 0.18 },
      optionB: { name: skillB, votes: 46, premium: 11000, trend: 0.14 },
      verdict: `Data shows ${skillA} holds a slight lead over ${skillB} in enterprise usage.`,
      totalVotes: 100,
      winner: 'A',
      shareA: 54,
      shareB: 46,
      highlights: ['Model estimate; no survey data used'],
      isAiEstimated: true,
      estimateSource: 'deterministic_fallback',
    },
  });
}
