export interface DigitalTwinSummary {
  name: string;
  stage: string;
  targetRole: string;
  topSkills: string[];
  missingSkills: string[];
  atsScore: number;
  topRoleFitPercent: number;
}

export function buildDigitalTwinSummary(sessionState: any): DigitalTwinSummary {
  const twin = sessionState?.careerTwin || sessionState?.parsedResume || {};
  const matches = sessionState?.matcherOutput?.matches || [];
  const topMatch = matches[0] || {};
  const gaps = sessionState?.skillGraph?.gaps || sessionState?.careerTwin?.gap?.missing_skills || [];
  const readiness = sessionState?.employerReadinessOutput || {};

  return {
    name: twin.name || twin.identity?.name || "Candidate",
    stage: twin.career_stage || "Career Switcher",
    targetRole: twin.goalDecoded?.primaryTarget || topMatch.role || "Software Specialist",
    topSkills: (twin.skills || ["Core Engineering"]).slice(0, 5).map((s: any) => typeof s === "string" ? s : s.name),
    missingSkills: Array.isArray(gaps) ? gaps.slice(0, 3) : ["System Design"],
    atsScore: readiness.overallReadinessScore || 88,
    topRoleFitPercent: topMatch.fit_percentage || topMatch.matchScore || 85,
  };
}

export function formatCompressedContext(summary: DigitalTwinSummary): string {
  return `DIGITAL TWIN SUMMARY (COMPRESSED 50 TOKENS):
- Candidate: ${summary.name} (${summary.stage})
- Target Goal: ${summary.targetRole} (Fit: ${summary.topRoleFitPercent}%, ATS Score: ${summary.atsScore}/100)
- Proven Skills: ${summary.topSkills.join(", ")}
- Top Gaps: ${summary.missingSkills.join(", ")}`;
}
