import { ResultAsync } from "neverthrow";
import { extractSkills, getRoleStandardSkills, getMVCProfile, rankGapsLocally, getRoleLabel, rankGapsLocally as rankGaps, detectRoleCategory } from "@/lib/mvc-profiler";
import { matchAllSkills } from "@/lib/matching/synonym-fuzzy-matcher";
import { scoreGap } from "@/lib/gap-scorer";
import { calculateCountdown } from "@/lib/readiness";
import { detectCompanyType } from "@/lib/company-detector";
import { extractContactInfo } from "@/lib/ats-contact-extractor";
import { parseWorkExperience } from "@/lib/ats-experience-parser";
import { extractEducationAndCerts } from "@/lib/ats-education-extractor";
import { auditFraudAndFormatting } from "@/lib/ats-fraud-detector";
import { analyzeJobDescription } from "@/lib/ats-jd-analyzer";
import { calculateCompositeATSScore } from "@/lib/ats-composite-scorer";
import type { CompositeATSScore } from "@/types/analysis";

export interface PipelineInput {
  jdText: string;
  resumeText: string;
  rawPdfBuffer?: ArrayBuffer;
  targetCompany?: string;
}

export interface PipelineOutput {
  shareToken: string;
  gapScore: number;
  summary: string;
  mvcSkills: string[];
  userSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  companyType: string;
  roleCategory: string;
  roleLabel: string;
  compositeATSScore: CompositeATSScore;
  countdownWeeks: number;
  readyByDate: string;
  jdSkills: string[];
  contactInfo: ReturnType<typeof extractContactInfo>;
  experienceAnalysis: ReturnType<typeof parseWorkExperience>;
  educationInfo: ReturnType<typeof extractEducationAndCerts>['education_info'];
  certifications: ReturnType<typeof extractEducationAndCerts>['certifications'];
  fraudAudit: ReturnType<typeof auditFraudAndFormatting>;
  jdRequirements: ReturnType<typeof analyzeJobDescription>;
}

export class PipelineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "PipelineError";
  }
}

export function runAtsPipeline(input: PipelineInput): ResultAsync<PipelineOutput, PipelineError> {
  return ResultAsync.fromPromise(
    (async () => {
      if (!input.jdText?.trim()) {
        throw new PipelineError("insufficient_input", "Job description text is missing.");
      }
      if (!input.resumeText?.trim()) {
        throw new PipelineError("insufficient_input", "Resume text is missing.");
      }

      const companyType = input.targetCompany || detectCompanyType(input.jdText);
      const rawJdSkills = extractSkills(input.jdText);
      const userSkills = extractSkills(input.resumeText);
      const modelSkills = getRoleStandardSkills(input.jdText);
      const jdSkills = rawJdSkills.length > 0 ? rawJdSkills : modelSkills.slice(0, 15);

      const { matchedSkills, missingSkills } = matchAllSkills(jdSkills, userSkills);

      const gapResult = scoreGap(jdSkills, userSkills);
      const { mvcSkills, roleCategory } = getMVCProfile(missingSkills, input.jdText);
      const rankedGaps = rankGapsLocally(missingSkills, mvcSkills, companyType, roleCategory);
      const countdown = calculateCountdown(rankedGaps);

      const contactInfo = extractContactInfo(input.resumeText);
      const experienceAnalysis = parseWorkExperience(input.resumeText, jdSkills);
      const { education_info: educationInfo, certifications } = extractEducationAndCerts(input.resumeText);
      const fraudAudit = auditFraudAndFormatting(input.resumeText, input.rawPdfBuffer);
      const jdRequirements = analyzeJobDescription(input.jdText, jdSkills);

      const compositeATSScore = calculateCompositeATSScore({
        gapScore: gapResult.gapScore,
        experience: experienceAnalysis,
        jdReqs: jdRequirements,
        education: educationInfo,
        certifications,
        fraudAudit,
      });

      const summary = `You are ${countdown.weeksRequired} weeks away from being a competitive candidate for this ${getRoleLabel(roleCategory)} role.`;

      return {
        shareToken: crypto.randomUUID(),
        gapScore: gapResult.gapScore,
        summary,
        mvcSkills: mvcSkills.map((s) => s.trim()),
        userSkills,
        matchedSkills,
        missingSkills,
        companyType,
        roleCategory,
        roleLabel: getRoleLabel(roleCategory),
        compositeATSScore,
        jdSkills,
        contactInfo,
        experienceAnalysis,
        educationInfo,
        certifications,
        fraudAudit,
        jdRequirements,
        countdownWeeks: countdown.weeksRequired,
        readyByDate: countdown.readyByDate,
      };
    })(),
    (err: any) => err instanceof PipelineError ? err : new PipelineError("pipeline_failed", err?.message || "Pipeline execution failed.")
  );
}
