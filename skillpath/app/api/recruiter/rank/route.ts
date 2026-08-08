import { NextRequest, NextResponse } from 'next/server';
import { extractSkills, getMVCProfile, getRoleStandardSkills } from '@/lib/mvc-profiler';
import { scoreGap } from '@/lib/gap-scorer';
import { extractContactInfo } from '@/lib/ats-contact-extractor';
import { parseWorkExperience } from '@/lib/ats-experience-parser';
import { extractEducationAndCerts } from '@/lib/ats-education-extractor';
import { auditFraudAndFormatting } from '@/lib/ats-fraud-detector';
import { analyzeJobDescription } from '@/lib/ats-jd-analyzer';
import { calculateCompositeATSScore } from '@/lib/ats-composite-scorer';
import { guardAiRequest, requestId, withRequestId } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export interface CandidatePayload {
  id: string;
  name?: string;
  resume_text: string;
}

export async function POST(req: NextRequest) {
  const traceId = requestId(req);
  const rateLimitError = guardAiRequest(req, undefined, 20);
  if (rateLimitError) return withRequestId(rateLimitError, traceId);

  try {
    const body = await req.json();
    const { jd_text, candidates, filters } = body as {
      jd_text: string;
      candidates: CandidatePayload[];
      filters?: {
        min_yoe?: number;
        min_score?: number;
        required_degree?: string;
        required_skills?: string[];
      };
    };

    if (!jd_text?.trim() || !Array.isArray(candidates) || candidates.length === 0) {
      return withRequestId(
        NextResponse.json(
          { error: 'bad_request', message: 'Job description and candidates array (min 1 candidate) are required.' },
          { status: 400 }
        ),
        traceId
      );
    }

    // 1. Analyze Job Description
    const rawJdSkills = extractSkills(jd_text);
    const modelSkills = getRoleStandardSkills(jd_text);
    const jdSkills = rawJdSkills.length > 0 ? rawJdSkills : modelSkills.slice(0, 15);
    const jdReqs = analyzeJobDescription(jd_text, jdSkills);
    const { mvcSkills } = getMVCProfile([], jd_text);

    // 2. Process and Score Each Candidate Deterministically
    const evaluatedCandidates = candidates.map((cand, idx) => {
      const resumeSkills = extractSkills(cand.resume_text);
      const gapResult = scoreGap(jdSkills, resumeSkills);
      const contact = extractContactInfo(cand.resume_text);
      const experience = parseWorkExperience(cand.resume_text, jdSkills);
      const { education_info, certifications } = extractEducationAndCerts(cand.resume_text);
      const fraudAudit = auditFraudAndFormatting(cand.resume_text);

      const compositeScore = calculateCompositeATSScore({
        gapScore: gapResult.gapScore,
        experience,
        jdReqs,
        education: education_info,
        certifications,
        fraudAudit,
      });

      const candidateName = cand.name || contact.name || `Candidate #${idx + 1}`;

      return {
        id: cand.id || `cand_${idx + 1}`,
        name: candidateName,
        email: contact.email,
        phone: contact.phone,
        location: contact.location,
        linkedin_url: contact.linkedin_url,
        github_url: contact.github_url,
        total_yoe: experience.total_yoe,
        relevant_yoe: experience.relevant_yoe,
        seniority_level: experience.seniority_level,
        highest_degree: education_info[0]?.degree || 'Unspecified',
        skills_count: resumeSkills.length,
        gap_score: gapResult.gapScore,
        overall_ats_score: compositeScore.overall_score,
        score_breakdown: compositeScore.breakdown,
        fraud_risk: fraudAudit.risk_level,
        is_flagged: fraudAudit.is_flagged,
        strengths: compositeScore.strengths,
        penalties: compositeScore.penalties,
      };
    });

    // 3. Apply Recruiter Filters
    let filtered = evaluatedCandidates;
    if (filters) {
      if (typeof filters.min_yoe === 'number') {
        filtered = filtered.filter((c) => c.relevant_yoe >= filters.min_yoe!);
      }
      if (typeof filters.min_score === 'number') {
        filtered = filtered.filter((c) => c.overall_ats_score >= filters.min_score!);
      }
    }

    // 4. Rank Candidates by Composite ATS Score (Highest first)
    filtered.sort((a, b) => b.overall_ats_score - a.overall_ats_score);

    return withRequestId(
      NextResponse.json({
        total_candidates_submitted: candidates.length,
        total_candidates_matched: filtered.length,
        job_requirements: jdReqs,
        ranked_candidates: filtered.map((c, rank) => ({
          rank: rank + 1,
          ...c,
        })),
      }),
      traceId
    );
  } catch (error) {
    return withRequestId(
      NextResponse.json({ error: 'internal_error', message: 'Failed to rank candidates.' }, { status: 500 }),
      traceId
    );
  }
}
