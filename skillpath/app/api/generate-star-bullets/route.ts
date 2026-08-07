// updated
import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON } from "@/lib/gemini";
import { getAuthUserSafe } from "@/lib/auth-helpers";
import { guardAiRequest } from "@/lib/request-guard";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = guardAiRequest(req, undefined, 10);
    if (rateLimitError) return rateLimitError;
    // Optional Auth — allow guest visitors to generate bullets
    const user = await getAuthUserSafe(req);

    let skill = 'Engineering';
    let role = 'Software Engineer';
    try {
      const body = await req.json();
      if (body.skill && typeof body.skill === 'string') skill = body.skill.trim();
      if (body.role && typeof body.role === 'string') role = body.role.trim();
    } catch {
      return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const prompt = `
      You are a professional resume writer for top silicon valley engineers.
      Target Skill: "${skill}"
      Target Role: "${role}"

      Generate 3 highly impact-driven STAR format resume bullet points for this skill.
      Rules:
      - Start with strong action verbs (e.g. "Spearheaded", "Architected", "Engineered").
      - Use metric placeholders such as [X%] or [N hours] when the user has not supplied evidence. Never invent achievements.
      - Keep each bullet between 15 and 25 words.

      Return ONLY a JSON array of 3 strings. No preamble. No markdown.
    `;

    const bullets = await callGeminiJSON<string[]>(
      "You generate ATS-optimized STAR format resume bullet points.",
      prompt,
      { model: "gemini-3.6-flash", temperature: 0.3, maxTokens: 512 }
    );

    const safeBullets = Array.isArray(bullets) ? bullets.slice(0, 3) : [];
    return NextResponse.json({ bullets: safeBullets, fallback: false, source: 'gemini' });
  } catch (error) {
    console.error('[STAR Bullets Generator Error]:', error);
    return NextResponse.json({
      bullets: [
        `Architected high-throughput services, reducing P99 latency by [X%] across production APIs.`,
        `Engineered robust system pipelines, improving infrastructure utilization by [X%].`,
        `Spearheaded production module deployment, eliminating downstream bottlenecks for [N] daily users.`
      ],
      fallback: true,
      source: 'evidence_safe_template'
    });
  }
}
