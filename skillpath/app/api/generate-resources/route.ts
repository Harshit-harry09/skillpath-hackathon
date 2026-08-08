// updated
import { NextRequest, NextResponse } from "next/server";
import { generateResources } from "@/lib/resource-generator";

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GenerateResourcesBody {
  analysis_id: string;
  skill: string;
  role: string;
  seniority?: string;
  company_type: string;
  existing_urls?: string[];
  click_count?: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateBody(body: Partial<GenerateResourcesBody>): string | null {
  if (!body.analysis_id?.trim()) return "analysis_id is required.";
  if (!body.skill?.trim()) return "skill is required.";
  if (!body.role?.trim()) return "role is required.";
  if (!body.company_type?.trim()) return "company_type is required.";

  if (body.existing_urls !== undefined && !Array.isArray(body.existing_urls)) {
    return "existing_urls must be an array.";
  }

  if (body.click_count !== undefined) {
    if (typeof body.click_count !== "number" || body.click_count < 0 || body.click_count > 3) {
      return "click_count must be a number between 0 and 3.";
    }
  }

  return null; // valid
}

// Sanitize string inputs — strips leading/trailing whitespace and limits length
// so a huge skill string can't bloat the prompt
function sanitizeString(val: string, maxLen = 100): string {
  return val.trim().slice(0, maxLen);
}

import { getAuthUserSafe } from "@/lib/auth-helpers";
import { checkGuestRateLimit } from "@/lib/rate-limit";
export const runtime = 'nodejs';

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Optional Auth — allow guest visitors to generate resources
  const user = await getAuthUserSafe(req);
  if (!user) {
    const rateCheck = checkGuestRateLimit(req, 10);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "too_many_requests", message: "Guest rate limit exceeded. Please sign in or try again in a minute." },
        { status: 429 }
      );
    }
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Partial<GenerateResourcesBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  const validationError = validateBody(body);
  if (validationError) {
    return NextResponse.json(
      { error: "missing_parameters", message: validationError },
      { status: 400 }
    );
  }

  // ── Sanitize ───────────────────────────────────────────────────────────────
  const analysisId = sanitizeString(body.analysis_id!);
  const skill = sanitizeString(body.skill!);
  const role = sanitizeString(body.role!);
  const seniority = sanitizeString(body.seniority || "entry");
  const companyType = sanitizeString(body.company_type!);
  const existingUrls = (body.existing_urls ?? [])
    .filter((u) => typeof u === "string" && u.startsWith("https://www.youtube.com"))
    .slice(0, 20); // cap to prevent abuse
  const clickCount = Math.min(Math.max(Math.floor(body.click_count ?? 0), 0), 3);

  console.log(
    `[API] Generating resources — skill: "${skill}" | role: "${role}" | ` +
    `seniority: "${seniority}" | company: "${companyType}" | ` +
    `level: ${clickCount} | existing: ${existingUrls.length}`
  );

  // ── Generate with timeout ──────────────────────────────────────────────────
  // Groq can occasionally hang; 30 s is generous but prevents zombie requests
  let skill_resources, from_cache;
  try {
    const result = await Promise.race([
      generateResources(analysisId, skill, role, seniority, companyType, existingUrls, clickCount),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Resource generation timed out after 30s")), 30_000)
      ),
    ]);
    ({ skill_resources, from_cache } = result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate resources.";
    const isTimeout = message.includes("timed out");

    console.error(`[API] Generation failed for "${skill}" (${Date.now() - startTime}ms):`, message);

    return NextResponse.json(
      {
        error: isTimeout ? "generation_timeout" : "generation_failed",
        message,
      },
      { status: isTimeout ? 504 : 500 }
    );
  }

  const duration = Date.now() - startTime;
  console.log(
    `[API] Done — skill: "${skill}" | resources: ${skill_resources.resources.length} | ` +
    `cache: ${from_cache} | ${duration}ms`
  );

  return NextResponse.json(
    { skill, skill_resources, from_cache, duration_ms: duration },
    { status: 200 }
  );
}