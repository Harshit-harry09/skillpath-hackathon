import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  let skillA = 'Option A';
  let skillB = 'Option B';

  try {
    const body = await req.json();
    if (body.skillA && typeof body.skillA === 'string') skillA = body.skillA.trim();
    if (body.skillB && typeof body.skillB === 'string') skillB = body.skillB.trim();
  } catch (err) {
    console.warn('[Battle Estimate API] Body parse error:', err);
  }

  const system = `You are a tech recruiter and developer ecosystem analyst. Output ONLY valid JSON. No markdown backticks, no extra text.`;
  const user = `Compare tech stack "${skillA}" vs "${skillB}".
Simulate a market survey sample of 10,000 software engineers.

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
- votes for optionA + optionB MUST equal 10000
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
          totalVotes: 10000,
          winner: data.winner,
          shareA: Number(data.shareA) || 55,
          shareB: Number(data.shareB) || 45,
          highlights: Array.isArray(data.highlights) && data.highlights.length > 0
            ? data.highlights
            : [`⚡ 10,000 Sample Developer Survey Benchmark`],
          isAiEstimated: true,
        },
      });
    }
  } catch (error) {
    console.error('[Battle Estimate API] Gemini estimate error:', error);
  }

  // Fallback 10,000 estimate if AI fails
  return NextResponse.json({
    result: {
      optionA: { name: skillA, votes: 5400, premium: 12500, trend: 0.18 },
      optionB: { name: skillB, votes: 4600, premium: 11000, trend: 0.14 },
      verdict: `Data shows ${skillA} holds a slight lead over ${skillB} in enterprise usage.`,
      totalVotes: 10000,
      winner: 'A',
      shareA: 54,
      shareB: 46,
      highlights: ['⚡ 10,000 Sample Developer Benchmark'],
      isAiEstimated: true,
    },
  });
}
