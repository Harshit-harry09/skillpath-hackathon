import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  let role = 'Software Engineer';
  let topSkills: string[] = ['TypeScript', 'React', 'Node.js'];

  try {
    const body = await req.json();
    if (body.role && typeof body.role === 'string') role = body.role;
    if (Array.isArray(body.topSkills) && body.topSkills.length > 0) {
      topSkills = body.topSkills.filter((s: any) => typeof s === 'string');
    }
  } catch (err) {
    console.warn('[LinkedIn Headline API] Request body parse issue:', err);
  }

  const skillsStr = topSkills.join(', ') || 'Engineering & System Design';

  const system = `You are an expert LinkedIn profile optimization coach. Output ONLY a valid JSON array of 3 strings. No markdown formatting, no text before or after.`;
  const user = `Generate EXACTLY 3 data-driven LinkedIn headlines for a candidate targeting the role "${role}".
Their top skills: ${skillsStr}.
Rules:
- Under 200 characters each
- Use pipe " | " as skill separator
- End each with "Open to ${role} Roles"
- Format: ["Headline 1", "Headline 2", "Headline 3"]`;

  try {
    const raw = await callGemini(system, user, { model: 'gemini-2.0-flash', temperature: 0.3, maxTokens: 300 });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const headlines: string[] = JSON.parse(cleaned);

    if (Array.isArray(headlines) && headlines.length >= 1) {
      return NextResponse.json({ headlines: headlines.slice(0, 3) });
    }
  } catch (error) {
    console.error('[LinkedIn Headline API] Gemini Call Error:', error instanceof Error ? error.message : error);
  }

  // Fast Fallback Headlines if AI or JSON parsing fails
  const fallbackHeadlines = [
    `${role} | ${skillsStr} | Scaling High-Throughput Systems | Open to ${role} Roles`,
    `Data-Driven ${role} | ${topSkills.slice(0, 3).join(' • ')} | Open to Opportunities`,
    `${role} Specialist | ${topSkills[0] || 'Architecture'} & Systems Engineering | Open to ${role} Roles`,
  ];

  return NextResponse.json({ headlines: fallbackHeadlines });
}
