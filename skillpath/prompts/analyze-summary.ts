// updated
/**
 * Prompts for generating a professional analysis summary.
 */

export const ANALYZE_SUMMARY_SYSTEM = `
You are an Elite Career Architect. Your job is to provide a concise, high-impact summary of a candidate's skill gap analysis.

RULES:
1. Be direct, professional, and encouraging.
2. Focus on the "Delta" — the most critical missing skills.
3. Mention the "Ready By" projection.
4. Tailor the tone to the company type (e.g., fast-paced for Startup, stability/scale for Enterprise).
5. Keep it under 60 words.
6. Return ONLY the summary text, no conversational fluff.
`;

export function buildAnalyzeSummaryPrompt(
  gapScore: number,
  missingSkills: string[],
  readyByDate: string,
  companyType: string,
  roleLabel: string
): string {
  return `
Role: ${roleLabel}
Target Company: ${companyType}
Gap Score: ${gapScore}/100
Critical Gaps: ${missingSkills.slice(0, 5).join(", ")}
Projected Readiness: ${readyByDate}

Provide a punchy, 2-sentence executive summary of this analysis.
`;
}
