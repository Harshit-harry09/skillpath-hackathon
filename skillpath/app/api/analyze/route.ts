import { NextRequest, NextResponse, after } from "next/server";
import { runAtsPipeline } from "@/lib/pipeline/ats-pipeline";
import { getAuthUserSafe } from "@/lib/auth-helpers";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import { getDb } from "@/lib/firebase-admin";
import { guardAiRequest, requestId, withRequestId } from "@/lib/request-guard";
import { isEnrichmentConfigured, storeEnrichmentPayload } from "@/lib/analyze-enrichment-store";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const traceId = requestId(req);
  const startTime = Date.now();

  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return withRequestId(rateLimitError, traceId);

    let jd_text = "";
    let resume_text = "";
    let rawPdfBuffer: ArrayBuffer | undefined = undefined;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json({ error: "bad_request", message: "Malformed form data." }, { status: 400 });
      }

      jd_text = (formData.get("jd_text") as string) || "";
      const resumeFile = formData.get("resume_file") as File | null;
      const rawResumeText = (formData.get("resume_text") as string) || "";

      if (resumeFile && resumeFile.size > 0) {
        const buffer = await resumeFile.arrayBuffer();
        rawPdfBuffer = buffer;
        try {
          resume_text = await extractTextFromPDF(buffer);
        } catch {
          resume_text = rawResumeText;
        }
      } else {
        resume_text = rawResumeText;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      jd_text = body.jd_text || "";
      resume_text = body.resume_text || "";
    }

    const pipelineResult = await runAtsPipeline({
      jdText: jd_text,
      resumeText: resume_text,
      rawPdfBuffer,
    });

    if (pipelineResult.isErr()) {
      const error = pipelineResult.error;
      return withRequestId(
        NextResponse.json({ error: error.code, message: error.message }, { status: 400 }),
        traceId
      );
    }

    const output = pipelineResult.value;

    const analysisDoc = {
      share_token: output.shareToken,
      gap_score: output.gapScore,
      summary: output.summary,
      mvc_skills: output.mvcSkills,
      user_skills: output.userSkills,
      matched_skills: output.matchedSkills,
      missing_skills: output.missingSkills,
      ready_by_date: output.readyByDate,
      weeks_required: output.countdownWeeks,
      company_type: output.companyType,
      role_category: output.roleCategory,
      role_label: output.roleLabel,
      composite_ats_score: output.compositeATSScore,
      // Hard Parse facts are persisted once so Results can render a forensic
      // audit and Atlas can import them without running tactical work twice.
      contact_info: output.contactInfo,
      experience_analysis: output.experienceAnalysis,
      education_info: output.educationInfo,
      certifications: output.certifications,
      fraud_audit: output.fraudAudit,
      jd_requirements: output.jdRequirements,
      jd_skills: output.jdSkills,
      parsed_text: resume_text,
      resume_text,
      jd_text,
      created_at: new Date().toISOString(),
      analysis_version: "neverthrow-pipeline-v3",
      summary_source: 'local_pipeline',
      enrichment_status: isEnrichmentConfigured() ? 'pending' : 'not_configured',
    };

    try {
      const db = getDb();
      await db.collection("analyses").doc(output.shareToken).set({
        ...analysisDoc,
        user_id: user?.uid || null,
      });

      if (isEnrichmentConfigured()) {
        after(async () => {
          try {
            await storeEnrichmentPayload(db, output.shareToken, { resumeText: resume_text, jdText: jd_text });
          } catch (e) {
            console.warn(`[Analyze API] Background enrichment store warning [${traceId}]:`, e);
          }
        });
      }
    } catch (dbErr) {
      console.warn(`[Analyze API] DB persistence warning [${traceId}]:`, dbErr);
      return withRequestId(
        NextResponse.json(
          { error: "persistence_failed", message: "Analysis could not be saved. Please try again." },
          { status: 503 }
        ),
        traceId
      );
    }

    const response = NextResponse.json(analysisDoc);
    response.headers.set("X-Analysis-Id", output.shareToken);
    response.headers.set("X-Pipeline-Latency-Ms", String(Date.now() - startTime));
    return withRequestId(response, traceId);
  } catch (error: unknown) {
    console.error("[Analyze API Crash]:", error);
    return withRequestId(
      NextResponse.json({ error: "analysis_failed", message: "An error occurred during analysis." }, { status: 500 }),
      traceId
    );
  }
}
