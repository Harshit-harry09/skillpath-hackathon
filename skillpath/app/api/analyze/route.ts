// updated
/**
 * POST /api/analyze
 *
 * 100% LOCAL pipeline — no AI calls for core matching:
 * 1. Extract skills from JD & Resume using keyword matching (Instant)
 * 2. Score gaps locally
 * 3. Detect company type locally
 * 4. Build MVC profile from trained dataset
 * 5. Rank gaps using dataset frequency
 * 6. Build a deterministic summary and prerequisites for the fast response
 * 7. Persist the result before returning its share token
 *
 * The initial response is deterministic and does not wait on a model provider.
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
import { getAuthUserSafe } from "@/lib/auth-helpers";
import crypto from "crypto";
import { guardAiRequest, requestId, withRequestId } from "@/lib/request-guard";
import { deleteEnrichmentPayload, isEnrichmentConfigured, storeEnrichmentPayload } from "@/lib/analyze-enrichment-store";
import { extractContactInfo } from "@/lib/ats-contact-extractor";
import { parseWorkExperience } from "@/lib/ats-experience-parser";
import { extractEducationAndCerts } from "@/lib/ats-education-extractor";
import { auditFraudAndFormatting } from "@/lib/ats-fraud-detector";
import { analyzeJobDescription } from "@/lib/ats-jd-analyzer";
import { calculateCompositeATSScore } from "@/lib/ats-composite-scorer";

export async function POST(req: NextRequest) {
  const traceId = requestId(req);
  const startTime = Date.now();
  try {
    // ---- Auth Check (Optional for guest analysis) ----
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return withRequestId(rateLimitError, traceId);

    let jd_text = "";
    let resume_text = "";
    let rawPdfBuffer: ArrayBuffer | undefined = undefined;
    let dreamRole = "";
    let currentRole = "";
    let experienceLevel = "";
    let targetCompany = "";
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return withRequestId(NextResponse.json(
        { error: "payload_too_large", message: "Request payload exceeds maximum allowed size of 10MB." },
        { status: 413 }
      ), traceId);
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
        if (resumeFile.size > 10 * 1024 * 1024) {
          return withRequestId(NextResponse.json(
            { error: "payload_too_large", message: "Resume PDF must be 10MB or smaller." },
            { status: 413 }
          ), traceId);
        }
        console.log(`[Analyze] Processing PDF: ${resumeFile.name} (${resumeFile.size} bytes)`);
        const buffer = await resumeFile.arrayBuffer();
        rawPdfBuffer = buffer;
        const signature = Buffer.from(buffer).subarray(0, 5).toString('ascii');
        if (resumeFile.type !== 'application/pdf' || signature !== '%PDF-') {
          return withRequestId(NextResponse.json(
            { error: "invalid_file", message: "Please upload a valid PDF resume." },
            { status: 400 }
          ), traceId);
        }
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
      return withRequestId(NextResponse.json(
        { error: "insufficient_input", message: "Job description text is missing." },
        { status: 400 }
      ), traceId);
    }

    if (!resume_text?.trim()) {
      return withRequestId(NextResponse.json({
        error: "insufficient_input",
        message: "Could not extract text from your resume. If you uploaded a PDF, please ensure it's not a scanned image, or try pasting the text manually."
      }, { status: 400 }), traceId);
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

    // ---- Step 7: Deterministic fast-path enrichment ----
    const aiSummary = `You are ${countdown.weeksRequired} weeks away from being a competitive candidate for this ${getRoleLabel(roleCategory)} role. Your highest-priority gaps are ${rankedGaps.slice(0, 3).map(g => g.skill).join(', ') || 'the core requirements listed below'}.`;
    const foundationalPrerequisites = Array.from(new Set([
      ...rankedGaps.slice(0, 3).map(g => g.skill),
      'Version Control (Git)',
      'Data Structures',
    ])).slice(0, 3);

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

    // ---- Step 7b: Full Deterministic ATS Analysis Pipeline ----
    const contactInfo = extractContactInfo(resume_text);
    const experienceAnalysis = parseWorkExperience(resume_text, jdSkills);
    const { education_info: educationInfo, certifications } = extractEducationAndCerts(resume_text);
    const fraudAudit = auditFraudAndFormatting(resume_text, rawPdfBuffer);
    const jdRequirements = analyzeJobDescription(jd_text, jdSkills);

    const compositeATSScore = calculateCompositeATSScore({
      gapScore: gapResult.gapScore,
      experience: experienceAnalysis,
      jdReqs: jdRequirements,
      education: educationInfo,
      certifications,
      fraudAudit,
    });

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
      created_at: new Date().toISOString(),
      analysis_version: 'deterministic-v2',
      enrichment_status: isEnrichmentConfigured() ? 'pending' : 'not_configured',
      summary_source: 'local_pipeline',
      // ATS Reference Model Extensions
      contact_info: contactInfo,
      experience_analysis: experienceAnalysis,
      education_info: educationInfo,
      certifications,
      fraud_audit: fraudAudit,
      jd_requirements: jdRequirements,
      composite_ats_score: compositeATSScore,
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

    // ---- Step 8: Persist before issuing a share token to the client ----
    try {
      const db = getDb();
      const analysisRef = db.collection("analyses").doc(shareToken);
      const persistAnalysis = analysisRef.set({
        ...analysisDoc,
        user_id: user?.uid || null,
      });
      if (!isEnrichmentConfigured()) {
        await persistAnalysis;
      } else {
        const [analysisWrite, enrichmentWrite] = await Promise.allSettled([
          persistAnalysis,
          storeEnrichmentPayload(db, shareToken, { resumeText: resume_text, jdText: jd_text }),
        ]);
        if (analysisWrite.status === 'rejected') {
          if (enrichmentWrite.status === 'fulfilled') await deleteEnrichmentPayload(db, shareToken);
          throw analysisWrite.reason;
        }
        if (enrichmentWrite.status === 'rejected') {
          console.warn(`[Analyze] AI enrichment payload was not stored [${traceId}]:`, enrichmentWrite.reason instanceof Error ? enrichmentWrite.reason.message : enrichmentWrite.reason);
          await analysisRef.update({ enrichment_status: 'unavailable', enrichment_error: 'temporary_input_not_stored' }).catch(() => undefined);
          analysisDoc.enrichment_status = 'unavailable';
        }
      }
      console.log(`[Analyze] ✓ Saved to Firestore: ${shareToken}`);
    } catch (dbError) {
      console.error(`[Analyze] Firestore persistence failed [${traceId}]:`, dbError instanceof Error ? dbError.message : dbError);
      return withRequestId(NextResponse.json(
        { error: "persistence_failed", message: "Analysis could not be saved. Please try again." },
        { status: 503 }
      ), traceId);
    }

    console.log(`[Analyze] ✓ Complete | Gap: ${gapResult.gapScore}% | Weeks: ${countdown.weeksRequired} | Token: ${shareToken}`);

    const response = NextResponse.json(analysisDoc);
    response.headers.set('X-Analysis-Id', shareToken);
    response.headers.set('X-Pipeline-Status', 'Success');
    response.headers.set('X-Pipeline-Latency-Ms', String(Date.now() - startTime));
    return withRequestId(response, traceId);

  } catch (error) {
    console.error("[Analyze] Pipeline crash:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during analysis.";
    return withRequestId(NextResponse.json({
      error: "analysis_failed",
      message,
      hint: message.includes("PDF")
        ? "Your PDF might be too large or complex. Try pasting the resume text directly."
        : message.includes("Firebase") || message.includes("database")
          ? "Database temporarily unavailable. Your analysis still completed — try refreshing."
          : "Something went wrong. Please try again.",
    }, { status: 500 }), traceId);
  }
}
