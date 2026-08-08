// updated
import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest, requestId, withRequestId } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const traceId = requestId(req);
  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 10);
    if (rateLimitError) return withRequestId(rateLimitError, traceId);

    const body = await req.json();
    const { optionA, optionB, winner, totalVotes, trend, premium } = body;

    if (!optionA?.name || !optionB?.name || !winner) {
      return withRequestId(
        NextResponse.json({ error: 'Missing required fields' }, { status: 400 }),
        traceId
      );
    }

    const winnerName = winner === 'A' ? optionA.name : winner === 'B' ? optionB.name : 'Tie';
    const prompt = `
      Battle: ${optionA.name} vs ${optionB.name}
      Winner: ${winnerName}
      Data Context:
      - Total market "votes": ${totalVotes}
      - Growth Trend: ${trend}%
      - Salary Premium: $${premium}
      
      Generate a one-sentence "Architect's Verdict" that explains LOGICALLY why the winner is the superior choice for a career path right now. 
      Focus on technical merit, market stability, or financial ROI based on the provided data.
      Keep it professional, persuasive, and under 25 words. Do not use hashtags.
    `;

    try {
      const aiVerdict = await callGemini(
        'You are a senior tech architect and career strategist.',
        prompt,
        { model: 'gemini-2.0-flash', temperature: 0.8, maxTokens: 60 }
      );
      return withRequestId(
        NextResponse.json({ aiVerdict: aiVerdict.trim() || 'The data has spoken clearly. Focus on mastering core engineering paradigms.' }),
        traceId
      );
    } catch {
      // Deterministic fallback — always returns 200 so the UI isn't broken
      return withRequestId(
        NextResponse.json({ aiVerdict: 'Both technologies offer immense value. Choose based on your target ecosystem.' }),
        traceId
      );
    }
  } catch (error) {
    console.error('[Battle AI] Error:', error);
    return withRequestId(
      NextResponse.json({ aiVerdict: 'Both technologies offer immense value. Choose based on your target ecosystem.' }),
      traceId
    );
  }
}
