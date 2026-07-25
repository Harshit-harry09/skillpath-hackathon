import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getAuthUser } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    // Optional auth check — allow guest visitors to enjoy AI verdicts
    try {
      await getAuthUser(req);
    } catch {
      // Guest visitor
    }

    const body = await req.json();
    const { optionA, optionB, winner, totalVotes, trend, premium } = body;

    if (!optionA?.name || !optionB?.name || !winner) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `
      Battle: ${optionA.name} vs ${optionB.name}
      Winner: ${winner === 'A' ? optionA.name : (winner === 'B' ? optionB.name : 'Tie')}
      Data Context:
      - Total market "votes": ${totalVotes}
      - Growth Trend: ${trend}%
      - Salary Premium: $${premium}
      
      Generate a one-sentence "Architect's Verdict" that explains LOGICALLY why the winner is the superior choice for a career path right now. 
      Focus on technical merit, market stability, or financial ROI based on the provided data.
      Keep it professional, persuasive, and under 25 words. Do not use hashtags.
    `;

    const aiVerdict = await callGemini(
      "You are a senior tech architect and career strategist.",
      prompt,
      { model: "gemini-2.0-flash", temperature: 0.8, maxTokens: 60 }
    );

    return NextResponse.json({ aiVerdict: aiVerdict.trim() || "The data has spoken clearly. Focus on mastering core engineering paradigms." });
  } catch (error) {
    console.error('AI Battle Error:', error);
    return NextResponse.json({ aiVerdict: "Both technologies offer immense value. Choose based on your target ecosystem." });
  }
}
