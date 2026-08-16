import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { detectRoleCategory, getRoleLabel, getRoleStandardSkills } from "@/lib/mvc-profiler";
import { detectCompanyType } from "@/lib/company-detector";
import crypto from "crypto";
import { getAuthUserSafe } from "@/lib/auth-helpers";
import { guardAiRequest, requestId, withRequestId } from "@/lib/request-guard";
import { generateCacheKey, getCachedResult, setCachedResult } from "@/lib/cache/exact-cache";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function buildLocalPayload(jobTitle: string) {
  const category = detectRoleCategory(jobTitle);
  const role = getRoleLabel(category);
  const skills = getRoleStandardSkills(jobTitle);
  const companyType = detectCompanyType(jobTitle);
  const mvcSkills = skills.slice(0, 5);

  return {
    role,
    seniority: "mid",
    company_type: companyType,
    mvc_skills: mvcSkills,
    skill_map: {
      role,
      seniority: "mid",
      company_type: companyType,
      mvc_skills: mvcSkills,
      categories: {
        technical_core: skills.slice(0, 5).map((name) => ({ name, importance: "essential", weeks_to_learn: 3, frequency_pct: 85, note: "Core skill requirement" })),
        technical_tools: skills.slice(5, 10).map((name) => ({ name, importance: "high", weeks_to_learn: 2, frequency_pct: 70, note: "Key operational tool" })),
        analytical: skills.slice(10, 14).map((name) => ({ name, importance: "medium", weeks_to_learn: 2, frequency_pct: 55, note: "Analytical competency" })),
        soft_skills: ["Communication", "Problem Solving", "Adaptability"].map((name) => ({ name, importance: "medium", weeks_to_learn: 1, frequency_pct: 60, note: "Essential soft skill" })),
      },
      total_weeks_from_zero: 16,
      fastest_growing_skill: skills[0] || "Domain Competency",
      most_demanded_skill: skills[1] || "Core Skill",
    },
    learning_path: { weeks: [] },
  };
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const traceId = requestId(req);

  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return withRequestId(rateLimitError, traceId);

    const body = await req.json().catch(() => ({}));
    const jobTitle = String(body.job_title || "").trim().slice(0, 200);

    if (!jobTitle) {
      return withRequestId(NextResponse.json({ error: "missing_field", message: "Job title is required." }, { status: 400 }), traceId);
    }

    const cacheKey = generateCacheKey("explore", { jobTitle });
    const cachedDoc = getCachedResult<any>(cacheKey);
    if (cachedDoc) {
      const cachedResp = NextResponse.json(cachedDoc);
      cachedResp.headers.set("X-Cache-Hit", "true");
      return withRequestId(cachedResp, traceId);
    }

    const payload = buildLocalPayload(jobTitle);
    const shareToken = crypto.randomUUID();
    const now = new Date().toISOString();

    const explorationDoc = {
      share_token: shareToken,
      job_title_raw: jobTitle,
      role: payload.role,
      seniority: payload.seniority,
      company_type: payload.company_type,
      market_momentum: { growth_pct: "+24% YoY", trend_status: "Estimated", demand_insight: `Local role model estimate for ${payload.role} roles.` },
      salary_range: { entry: "$65,000", mid: "$95,000", senior: "$140,000", currency: "USD" },
      mvc_skills: payload.mvc_skills,
      skill_map: payload.skill_map,
      learning_path: payload.learning_path,
      total_weeks: payload.skill_map.total_weeks_from_zero,
      created_at: now,
      source: "local_deterministic",
    };

    setCachedResult(cacheKey, explorationDoc);

    try {
      const db = getDb();
      await db.collection("explorations").doc(shareToken).set(explorationDoc);
    } catch (dbErr) {
      console.warn("[Explore API] DB persistence warning:", dbErr);
    }

    const response = NextResponse.json(explorationDoc);
    response.headers.set("X-Pipeline-Latency-Ms", String(Date.now() - startedAt));
    return withRequestId(response, traceId);
  } catch (error) {
    console.error(`[Explore] Pipeline error:`, error);
    return withRequestId(NextResponse.json({ error: "exploration_failed", message: "An unexpected error occurred." }, { status: 500 }), traceId);
  }
}
