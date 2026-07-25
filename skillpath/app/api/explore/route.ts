/**
 * POST /api/explore
 *
 * Unified 1-Call Career Intelligence Pipeline — generates a full skill map for ANY role (Police, Footballer, Tech, Chef, etc.).
 */

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON } from "@/lib/gemini";
import { getDb } from "@/lib/firebase-admin";
import { detectRoleCategory, getRoleLabel, getRoleStandardSkills } from "@/lib/mvc-profiler";
import { detectCompanyType } from "@/lib/company-detector";
import crypto from "crypto";
import {
  UNIFIED_EXPLORE_SYSTEM,
  buildUnifiedExplorePrompt,
} from "@/prompts/explore-role";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_json", message: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const { job_title } = body;
    if (!job_title || typeof job_title !== 'string' || !job_title.trim()) {
      return NextResponse.json(
        { error: "missing_field", message: "Job title is required." },
        { status: 400 }
      );
    }

    const sanitizedTitle = job_title.trim().slice(0, 200);
    console.log(`[Explore] ⚡ Unified pipeline starting for: "${sanitizedTitle}"`);

    // ---- Single Unified Gemini Call ----
    let payload: any;
    try {
      payload = await callGeminiJSON(
        UNIFIED_EXPLORE_SYSTEM,
        buildUnifiedExplorePrompt(sanitizedTitle),
        { model: "gemini-2.5-flash", temperature: 0.2, maxTokens: 4096 }
      );
      console.log(`[Explore] ✓ Unified LLM response received for "${sanitizedTitle}"`);
    } catch (e) {
      console.warn("[Explore] Unified LLM call failed, engaging local model fallback:", e instanceof Error ? e.message : e);
      const cat = detectRoleCategory(sanitizedTitle);
      const roleLabel = getRoleLabel(cat);
      const localSkills = getRoleStandardSkills(sanitizedTitle);

      payload = {
        role: roleLabel,
        seniority: "mid",
        company_type: detectCompanyType(sanitizedTitle),
        mvc_skills: localSkills.slice(0, 5),
        skill_map: {
          role: roleLabel,
          seniority: "mid",
          company_type: detectCompanyType(sanitizedTitle),
          mvc_skills: localSkills.slice(0, 5),
          categories: {
            technical_core: localSkills.slice(0, 5).map(name => ({ name, importance: "essential", weeks_to_learn: 3, frequency_pct: 85, note: "Core skill requirement" })),
            technical_tools: localSkills.slice(5, 10).map(name => ({ name, importance: "high", weeks_to_learn: 2, frequency_pct: 70, note: "Key operational tool" })),
            analytical: localSkills.slice(10, 14).map(name => ({ name, importance: "medium", weeks_to_learn: 2, frequency_pct: 55, note: "Analytical & decision competency" })),
            soft_skills: ["Communication", "Problem Solving", "Adaptability"].map(name => ({ name, importance: "medium", weeks_to_learn: 1, frequency_pct: 60, note: "Essential soft skill" }))
          },
          total_weeks_from_zero: 16,
          fastest_growing_skill: localSkills[0] || "Domain Competency",
          most_demanded_skill: localSkills[1] || "Core Skill"
        },
        learning_path: { weeks: [] }
      };
    }

    const role = payload.role || sanitizedTitle;
    const seniority = payload.seniority || "mid";
    const company_type = payload.company_type || "general";
    const skillMap = payload.skill_map || payload;
    const learningPath = payload.learning_path || { weeks: [] };
    const mvcSkills = payload.mvc_skills || skillMap.mvc_skills || [];

    const marketMomentum = payload.market_momentum || {
      growth_pct: "+24% YoY",
      trend_status: "High Demand",
      demand_insight: `Strong market demand and hiring activity for ${role} roles across key sectors.`
    };
    const salaryRange = payload.salary_range || {
      entry: "$65,000",
      mid: "$95,000",
      senior: "$140,000",
      currency: "USD"
    };
    const topEmployers = payload.top_employers || [
      { name: "Top Industry Leaders", category: "Market Standard", hiring_volume: "Very High" },
      { name: "Growth Scaleups", category: "Growth Sector", hiring_volume: "High" },
      { name: "Global Enterprises", category: "Enterprise", hiring_volume: "Active" }
    ];

    // ---- Build response document ----
    const shareToken = crypto.randomUUID();
    const explorationDoc = {
      share_token: shareToken,
      job_title_raw: sanitizedTitle,
      role: role,
      seniority: seniority,
      company_type: company_type,
      market_momentum: marketMomentum,
      salary_range: salaryRange,
      top_employers: topEmployers,
      mvc_skills: mvcSkills,
      skill_map: skillMap,
      learning_path: learningPath,
      total_weeks: skillMap.total_weeks_from_zero || 16,
      created_at: new Date().toISOString(),
    };

    // ---- Save to Firestore (Graceful Save) ----
    try {
      const db = getDb();
      await db.collection("explorations").doc(shareToken).set(explorationDoc);
      console.log(`[Explore] ✓ Saved: ${shareToken}`);
    } catch (dbError: any) {
      console.warn("[Explore] Firestore save skipped or unavailable:", dbError?.message || dbError);
    }

    const duration = Date.now() - startTime;
    console.log(`[Explore] ⚡ Complete in ${duration}ms | Token: ${shareToken}`);

    return NextResponse.json(explorationDoc);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Explore] Pipeline crash after ${duration}ms:`, error);
    return NextResponse.json({
      error: "exploration_failed",
      message: error instanceof Error ? error.message : "An unexpected error occurred during exploration.",
    }, { status: 500 });
  }
}
