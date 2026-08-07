// updated
import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON } from "@/lib/gemini";
import { getDb } from "@/lib/firebase-admin";
import {
  PLAN_GENERATION_SYSTEM,
  buildPlanGenerationPrompt,
} from "@/prompts/generate-plan";
import type { LearningPlan, Resource, WeekPlan } from "@/types/analysis";
import { getAuthUserSafe } from "@/lib/auth-helpers";
import { guardAiRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type PlanGap = {
  skill: string;
  priority: number;
  weeks_to_learn: number;
  reason?: string;
};

function normalizePlanGaps(value: unknown): PlanGap[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      skill: typeof item.skill === "string" ? item.skill.trim() : "",
      priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 99,
      weeks_to_learn: Math.max(1, Math.ceil(Number(item.weeks_to_learn) || 1)),
      reason: typeof item.reason === "string" ? item.reason : undefined,
    }))
    .filter((gap) => gap.skill.length > 0)
    .sort((a, b) => a.priority - b.priority);
}

function normalizeGeneratedPlan(value: unknown): LearningPlan | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as { weeks?: unknown }).weeks)) {
    return null;
  }

  const weeks = ((value as { weeks: unknown[] }).weeks)
    .slice(0, 12)
    .filter((week): week is Record<string, unknown> => Boolean(week) && typeof week === "object")
    .map((week, index): WeekPlan | null => {
      const skill = typeof week.skill === "string" ? week.skill.trim() : "";
      if (!skill) return null;

      const resources: Resource[] = Array.isArray(week.resources)
        ? week.resources
          .filter((resource): resource is Record<string, unknown> => Boolean(resource) && typeof resource === "object")
          .map((resource) => {
            const normalized: Resource = {
              title: typeof resource.title === "string" && resource.title.trim() ? resource.title.trim() : "Study resource",
              url: typeof resource.url === "string" ? resource.url.trim() : "",
            };
            if (typeof resource.start_at === "string") normalized.start_at = resource.start_at;
            if (typeof resource.skip_note === "string") normalized.skip_note = resource.skip_note;
            if (typeof resource.project === "string") normalized.project = resource.project;
            if (typeof resource.project_url === "string") normalized.project_url = resource.project_url;
            if (typeof resource.why === "string") normalized.why = resource.why;
            return normalized;
          })
          .filter((resource) => resource.url.length > 0)
        : [];

      return { week: index + 1, skill, resources };
    })
    .filter((week): week is WeekPlan => Boolean(week));

  return { weeks };
}

function buildFallbackLearningPlan(gaps: PlanGap[], companyType: string): LearningPlan {
  const weeks: LearningPlan["weeks"] = [];

  for (const gap of gaps) {
    const totalWeeks = Math.min(12 - weeks.length, gap.weeks_to_learn);
    for (let phase = 0; phase < totalWeeks; phase += 1) {
      const phaseLabel = phase === 0 ? "fundamentals" : phase === totalWeeks - 1 ? "project and interview practice" : "hands-on practice";
      const searchQuery = encodeURIComponent(`${gap.skill} ${phaseLabel} tutorial hands-on project`);
      weeks.push({
        week: weeks.length + 1,
        skill: gap.skill,
        resources: [{
          title: `${gap.skill} — ${phaseLabel}`,
          url: `https://www.youtube.com/results?search_query=${searchQuery}`,
          project: `Build a small ${gap.skill} project for a ${companyType} engineering environment.`,
          why: gap.reason || `Build demonstrable ${gap.skill} evidence for this role.`,
        }],
      });
    }
    if (weeks.length >= 12) break;
  }

  return { weeks };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Results can be opened by a public share token, so plan generation must
    // work for guests too. Authenticated users receive the higher account
    // limit; guests remain protected by the stricter IP/device limit.
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return rateLimitError;

    let db;
    try {
      db = getDb();
    } catch {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    // 1. Fetch existing analysis
    const doc = await db.collection("analyses").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const data = doc.data();

    // If plan already exists, just return it
    if (data?.learning_plan) {
      return NextResponse.json(data.learning_plan);
    }

    const gaps = normalizePlanGaps(data?.skill_gaps);
    if (gaps.length === 0) {
      const emptyPlan: LearningPlan = { weeks: [] };
      await db.collection("analyses").doc(id).update({
        learning_plan: emptyPlan,
        learning_plan_source: "deterministic_empty",
      });
      return NextResponse.json(emptyPlan, { headers: { "X-Plan-Source": "deterministic_empty" } });
    }

    // 2. Generate plan with Gemini, but keep a deterministic fallback so a
    // provider timeout or malformed response never breaks the Results page.
    console.log(`[On-Demand Plan] Generating plan for ${id}...`);
    let learningPlan: LearningPlan;
    let planSource = "gemini";
    try {
      const generatedPlan = await callGeminiJSON<unknown>(
        PLAN_GENERATION_SYSTEM,
        buildPlanGenerationPrompt(gaps, data?.company_type || "enterprise"),
        { model: "gemini-2.5-flash", temperature: 0.2, maxTokens: 4096, timeoutMs: 15000 }
      );
      const normalizedPlan = normalizeGeneratedPlan(generatedPlan);
      if (!normalizedPlan || normalizedPlan.weeks.length === 0) {
        throw new Error("Gemini returned an empty or invalid learning plan.");
      }
      learningPlan = normalizedPlan;
    } catch (error) {
      console.warn("[On-Demand Plan] Gemini failed; using deterministic fallback:", error instanceof Error ? error.message : error);
      learningPlan = buildFallbackLearningPlan(gaps, data?.company_type || "enterprise");
      planSource = "deterministic_fallback";
    }

    // 3. Save it back to Firestore
    await db.collection("analyses").doc(id).update({
      learning_plan: learningPlan,
      learning_plan_source: planSource,
    });

    console.log(`[On-Demand Plan] ✓ Plan generated and saved for ${id}`);

    return NextResponse.json(learningPlan, { headers: { "X-Plan-Source": planSource } });
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "generation_failed", message: "Failed to generate learning plan." },
      { status: 500 }
    );
  }
}
