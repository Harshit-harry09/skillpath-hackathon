import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON } from "@/lib/gemini";
import { getAuthUserSafe } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    // Optional Auth — allow guest visitors to generate bullets
    const user = await getAuthUserSafe(req);

    let skill = 'Engineering';
    let role = 'Software Engineer';
    try {
      const body = await req.json();
      if (body.skill && typeof body.skill === 'string') skill = body.skill.trim();
      if (body.role && typeof body.role === 'string') role = body.role.trim();
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const prompt = `
      You are a professional resume writer for top silicon valley engineers.
      Target Skill: "${skill}"
      Target Role: "${role}"

      Generate 3 highly impact-driven STAR format resume bullet points for this skill.
      Rules:
      - Start with strong action verbs (e.g. "Spearheaded", "Architected", "Engineered").
      - Include realistic metrics (% performance lift, latency drop, time saved).
      - Keep each bullet between 15 and 25 words.

      Return ONLY a JSON array of 3 strings. No preamble. No markdown.
    `;

    const bullets = await callGeminiJSON<string[]>(
      "You generate ATS-optimized STAR format resume bullet points.",
      prompt,
      { model: "gemini-3.6-flash", temperature: 0.3, maxTokens: 512 }
    );

    const safeBullets = Array.isArray(bullets) ? bullets.slice(0, 3) : [];
    return NextResponse.json({ bullets: safeBullets });
  } catch (error) {
    console.error('[STAR Bullets Generator Error]:', error);
    return NextResponse.json({
      bullets: [
        `Architected high-throughput services, reducing P99 latency by 35% across production APIs.`,
        `Engineered robust system pipelines, driving 40% improvement in infrastructure utilization.`,
        `Spearheaded deployment of production modules, eliminating downstream bottlenecks for 50k+ daily users.`
      ]
    });
  }
}
