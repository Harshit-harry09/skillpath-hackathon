// updated
import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { guardAiRequest } from '@/lib/request-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimitError = guardAiRequest(req, undefined, 10);
  if (rateLimitError) return rateLimitError;
  let role = 'Software Engineer';
  let topSkills: string[] = ['TypeScript', 'React', 'Node.js'];

  try {
    const body = await req.json();
    if (body.role && typeof body.role === 'string') role = body.role;
    if (Array.isArray(body.topSkills) && body.topSkills.length > 0) {
      topSkills = body.topSkills.filter((s: any) => typeof s === 'string');
    }
  } catch (err) {
    console.warn('[Cover Lines API] Request body parse issue:', err);
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const skillsStr = topSkills.join(', ') || 'software architecture';

  const system = `You are an expert cover letter coach. Output ONLY a valid JSON array of 3 strings. No markdown formatting, no text before or after.`;
  const user = `Generate EXACTLY 3 punchy cover letter opening sentences for a candidate targeting the role "${role}".
Top skills: ${skillsStr}.
Rules:
- 1 sentence each (max 50 words)
- Lead with quantified impact or bold engineering capability
- Do NOT start with "I am writing" or "I am excited"
- Format: ["Sentence 1.", "Sentence 2.", "Sentence 3."]`;

  try {
    const raw = await callGemini(system, user, { model: 'gemini-2.0-flash', temperature: 0.3, maxTokens: 350 });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const lines: string[] = JSON.parse(cleaned);

    if (Array.isArray(lines) && lines.length >= 1) {
      return NextResponse.json({ lines: lines.slice(0, 3), fallback: false, source: 'gemini' });
    }
  } catch (error) {
    console.error('[Cover Lines API] Gemini Call Error:', error instanceof Error ? error.message : error);
  }

  // Fast Fallback Lines if AI or JSON parsing fails
  const fallbackLines = [
    `With extensive experience in ${skillsStr}, I specialize in building high-throughput solutions as a ${role}.`,
    `Having architected production systems using ${topSkills[0] || 'modern tech'}, I bring immediate technical velocity to your ${role} team.`,
    `My proven track record in ${topSkills.slice(0, 2).join(' and ')} positions me to drive measurable technical impact in the ${role} role.`,
  ];

  return NextResponse.json({ lines: fallbackLines, fallback: true, source: 'deterministic_template' });
}
