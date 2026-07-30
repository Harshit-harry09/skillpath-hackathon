/**
 * POST /api/analyze
 *
 * 100% LOCAL pipeline — no AI calls for core matching:
 * 1. Extract skills from JD & Resume using keyword matching (Instant)
 * 2. Score gaps locally
 * 3. Detect company type locally
 * 4. Build MVC profile from trained dataset
 * 5. Rank gaps using dataset frequency
 * 6. AI Summary: Groq (Llama 3.1) for Professional Profile (optional, graceful fallback)
 * 7. Save to Firestore (fire-and-forget, don't block response)
 *
 * This is INSTANT — no rate limits for extraction, minimal latency for summary.
 */

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { scoreGap } from "@/lib/gap-scorer";
import { getMVCProfile, getRoleStandardSkills, extractSkills, rankGapsLocally, getRoleLabel, getTrajectoryInfo, detectRoleCategory } from "@/lib/mvc-profiler";
import { calculateCountdown } from "@/lib/readiness";
import { detectCompanyType } from "@/lib/company-detector";
import { cleanSkillsWithAI } from "@/lib/ai-skill-cleaner";
import { getDb } from "@/lib/firebase-admin";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import { getAuthUser, getAuthUserSafe, AuthError } from "@/lib/auth-helpers";
import { ANALYZE_SUMMARY_SYSTEM, buildAnalyzeSummaryPrompt } from "@/prompts/analyze-summary";
import crypto from "crypto";
import { callGemini, callGeminiJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    // ---- Auth Check (Optional for guest analysis) ----
    const user = await getAuthUserSafe(req);


    let jd_text = "";
    let resume_text = "";
    let dreamRole = "";
    let currentRole = "";
    let experienceLevel = "";
    let targetCompany = "";
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "payload_too_large", message: "Request payload exceeds maximum allowed size of 5MB." },
        { status: 413 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      let formData;
      try {
        formData = await req.formData();
      } catch {
        return NextResponse.json(
          { error: "bad_request", message: "Malformed form data." },
          { status: 400 }
        );
      }

      jd_text = (formData.get("jd_text") as string) || "";
      const resumeFile = formData.get("resume_file") as File | null;
      const rawResumeText = (formData.get("resume_text") as string) || "";

      // Dream mode structured context
      dreamRole = (formData.get("dream_role") as string) || "";
      currentRole = (formData.get("current_role") as string) || "";
      experienceLevel = (formData.get("experience_level") as string) || "";
      targetCompany = (formData.get("target_company") as string) || "";

      if (resumeFile && resumeFile.size > 0) {
        console.log(`[Analyze] Processing PDF: ${resumeFile.name} (${resumeFile.size} bytes)`);
        const buffer = await resumeFile.arrayBuffer();
        try {
          resume_text = await extractTextFromPDF(buffer);
          console.log(`[Analyze] Extracted ${resume_text.length} chars from PDF`);
        } catch (pdfError) {
          console.error("[Analyze] PDF extraction failed:", pdfError);
          if (rawResumeText) {
            resume_text = rawResumeText;
          } else {
            return NextResponse.json({
              error: "pdf_extraction_failed",
              message: "Failed to extract text from PDF. Please paste your resume text directly.",
            }, { status: 400 });
          }
        }
      } else {
        resume_text = rawResumeText;
      }
    } else {
      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "bad_request", message: "Malformed JSON body." },
          { status: 400 }
        );
      }
      jd_text = body.jd_text;
      resume_text = body.resume_text;
    }

    // ---- Validate Input ----
    if (!jd_text?.trim()) {
      return NextResponse.json(
        { error: "insufficient_input", message: "Job description text is missing." },
        { status: 400 }
      );
    }

    if (!resume_text?.trim()) {
      return NextResponse.json({
        error: "insufficient_input",
        message: "Could not extract text from your resume. If you uploaded a PDF, please ensure it's not a scanned image, or try pasting the text manually."
      }, { status: 400 });
    }

    console.log(`[Analyze] Starting for user ${user?.uid || 'guest'} | JD: ${jd_text.length} chars | Resume: ${resume_text.length} chars`);

    // ---- Step 1: Detect company type (local, or override from dream context) ----
    const DREAM_COMPANY_MAP: Record<string, string> = {
      faang: "enterprise",
      startup: "startup",
      enterprise: "enterprise",
      remote: "startup",
      agency: "agency",
      government: "enterprise",
    };
    const companyType = (typeof targetCompany === 'string' && targetCompany)
      ? (DREAM_COMPANY_MAP[targetCompany] || detectCompanyType(jd_text))
      : detectCompanyType(jd_text);

    // ---- Step 2: Extract skills via keyword matching (local, instant) ----
    const rawJdSkills = extractSkills(jd_text);
    const detectedRoleCategory = detectRoleCategory(jd_text);
    const roleTitleContext = getRoleLabel(detectedRoleCategory);

    // Hybrid Brain: Clean the local list using fast AI / Local Expert
    const rawResumeSkills = extractSkills(resume_text);
    const [{ cleaned: jdKeywordSkills, metrics: jdMetrics }, { cleaned: resumeSkills, metrics: resumeMetrics }] = await Promise.all([
      cleanSkillsWithAI(rawJdSkills, roleTitleContext),
      cleanSkillsWithAI(rawResumeSkills, "resume")
    ]);
    console.log(`[Analyze] JD AI Cleaning: ${jdMetrics.status} | Latency: ${Math.round(jdMetrics.latency)}ms | Cached: ${jdMetrics.cached}`);
    console.log(`[Analyze] Resume AI Cleaning: ${resumeMetrics.status} | Latency: ${Math.round(resumeMetrics.latency)}ms | Cached: ${resumeMetrics.cached}`);

    const modelSkills = getRoleStandardSkills(jd_text);
    // Use cleaned JD skills. Only fallback to model skills if extraction fails.
    const jdSkills = jdKeywordSkills.length > 0 ? jdKeywordSkills : modelSkills.slice(0, 15);
    
    console.log(`[Analyze] JD skills: ${jdSkills.length} | Resume skills: ${resumeSkills.length}`);

    // ---- Step 3: Diff and score (local) ----
    const gapResult = scoreGap(jdSkills, resumeSkills);

    // ---- Step 4: MVC Profile (local) ----
    const { mvcSkills, roleCategory, requiredDegree } = getMVCProfile(gapResult.missingSkills, jd_text);

    // ---- Step 5: Rank gaps locally ----
    const rankedGaps = rankGapsLocally(gapResult.missingSkills, mvcSkills, companyType, roleCategory);

    // ---- Step 6: Calculate ready-by date (local) ----
    const countdown = calculateCountdown(rankedGaps);

    // ---- Step 7: AI Calls (run in parallel for ~50% latency reduction) ----
    const [aiSummaryResult, foundationalPrerequisitesResult] = await Promise.allSettled([
      // 7a: AI Summary (10s timeout)
      Promise.race([
        callGemini(
          ANALYZE_SUMMARY_SYSTEM,
          buildAnalyzeSummaryPrompt(
            gapResult.gapScore,
            rankedGaps.filter(g => g.in_mvc).map(g => g.skill),
            countdown.readyByDate,
            companyType,
            getRoleLabel(roleCategory)
          ),
          { model: "gemini-2.0-flash", temperature: 0.3, maxTokens: 150 }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Summary generation timed out")), 10_000)
        ),
      ]),
      // 7b: Foundational Prerequisites
      callGeminiJSON<any>(
        "You are a Technical Architect. Identify 3 SPECIFIC TECHNICAL foundational concepts the user is MISSING from their resume that are required to master their advanced gaps. Focus on Logic & Fundamentals (e.g., 'Memory Management', 'Asynchronous Flow', 'Relational Logic'). Return ONLY a JSON array of 3 strings.",
        `Target Role: ${roleCategory}\nUser's Current Skills: ${resumeSkills.join(", ")}\nMissing Advanced Skills: ${rankedGaps.slice(0, 5).map(g => g.skill).join(", ")}`,
        { model: "gemini-2.0-flash", temperature: 0.1, maxTokens: 256 }
      ),
    ]);

    // Resolve summary
    let aiSummary = "";
    if (aiSummaryResult.status === "fulfilled" && aiSummaryResult.value) {
      aiSummary = aiSummaryResult.value.trim();
      console.log("[Analyze] ✓ AI summary generated");
    } else {
      console.warn("[Analyze] AI summary skipped (non-critical):", aiSummaryResult.status === "rejected" ? aiSummaryResult.reason?.message : "empty");
      aiSummary = `You are ${countdown.weeksRequired} weeks away from being a competitive candidate for this ${getRoleLabel(roleCategory)} role.`;
    }

    // Resolve prerequisites
    let foundationalPrerequisites: string[] = [];
    if (foundationalPrerequisitesResult.status === "fulfilled") {
      const parsed = foundationalPrerequisitesResult.value;
      const arr = Array.isArray(parsed) ? parsed : (Object.values(parsed).find(v => Array.isArray(v)) as any[] ?? []);
      foundationalPrerequisites = (arr as any[]).filter(s => typeof s === 'string' && s.length > 2).slice(0, 3);
      console.log("[Analyze] ✓ Foundational prerequisites generated");
    } else {
      console.warn("[Analyze] Prerequisites generation failed:", foundationalPrerequisitesResult.reason?.message);
      foundationalPrerequisites = ["Version Control (Git)", "Data Structures", "Command Line Basics"];
    }

    // ---- Build response document ----
    const shareToken = crypto.randomUUID();
    const uniqueMvcSkills = Array.from(new Set(mvcSkills.map(s => s.trim())));
    
    // Get the full standard pool for this role to check matches against
    const fullRolePool = getRoleStandardSkills(jd_text);

    // Noise reduction: Only consider a skill "matched" if it appears in the role's required MVC list.
    const userSkills = resumeSkills || [];
    const matchedSkills = userSkills.filter(skill => 
      fullRolePool.some(mvc => 
        mvc.toLowerCase() === skill.toLowerCase() || 
        mvc.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(mvc.toLowerCase())
      )
    );

    const analysisDoc = {
      share_token: shareToken,
      gap_score: gapResult.gapScore,
      summary: aiSummary,
      mvc_skills: uniqueMvcSkills,
      user_skills: userSkills,
      matched_skills: matchedSkills,
      required_degree: requiredDegree,
      ready_by_date: countdown.readyByDate,
      weeks_required: countdown.weeksRequired,
      company_type: companyType,
      role_category: roleCategory,
      role_label: getRoleLabel(roleCategory),
      trajectory: getTrajectoryInfo(roleCategory),
      jd_skills: jdSkills,
      resume_skills: resumeSkills,
      skill_gaps: rankedGaps,
      foundational_prerequisites: foundationalPrerequisites,
      jd_preview: jd_text.slice(0, 200),
      jd_text: jd_text.length > 4000 ? jd_text.slice(0, 4000) + "..." : jd_text,
      resume_text: resume_text.length > 4000 ? resume_text.slice(0, 4000) + "..." : resume_text,
      created_at: new Date().toISOString(),
      // Dream context metadata (if present)
      ...(typeof dreamRole === 'string' && dreamRole ? {
        dream_context: {
          dream_role: dreamRole,
          current_role: typeof currentRole === 'string' ? currentRole : '',
          experience_level: typeof experienceLevel === 'string' ? experienceLevel : '',
          target_company: typeof targetCompany === 'string' ? targetCompany : '',
        }
      } : {}),
    };

    // ---- Step 8: Save to Firestore (Non-blocking background save for instant response) ----
    const savePromise = (async () => {
      try {
        const db = getDb();
        await db.collection("analyses").doc(shareToken).set({
          ...analysisDoc,
          user_id: user?.uid || null,
        });
        console.log(`[Analyze] ✓ Saved to Firestore: ${shareToken}`);
      } catch (dbError) {
        console.warn("[Analyze] Firestore save skipped or unavailable:", dbError instanceof Error ? dbError.message : dbError);
      }
    })();
    // Allow serverless function to register background completion without blocking client HTTP response
    if (typeof (req as any).waitUntil === 'function') {
      (req as any).waitUntil(savePromise);
    }

    console.log(`[Analyze] ✓ Complete | Gap: ${gapResult.gapScore}% | Weeks: ${countdown.weeksRequired} | Token: ${shareToken}`);

    const response = NextResponse.json(analysisDoc);
    response.headers.set('X-Analysis-Id', shareToken);
    response.headers.set('X-Pipeline-Status', 'Success');
    return response;

  } catch (error) {
    console.error("[Analyze] Pipeline crash:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during analysis.";
    return NextResponse.json({
      error: "analysis_failed",
      message,
      hint: message.includes("PDF")
        ? "Your PDF might be too large or complex. Try pasting the resume text directly."
        : message.includes("Firebase") || message.includes("database")
          ? "Database temporarily unavailable. Your analysis still completed — try refreshing."
          : "Something went wrong. Please try again.",
    }, { status: 500 });
  }
}
