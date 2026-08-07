// updated
// Prompt: Score and rank skill gaps
export const GAP_SCORING_SYSTEM = `You are a career advisor focused on speed-to-market. Given a list of skill gaps, rank each by hiring importance.
Return ONLY a JSON object with a "gaps" key containing an array of objects. No explanation. No markdown.
For each skill in the "gaps" array:
- skill: string
- priority: integer (1 = highest)
- weeks_to_learn: integer (Estimate how many weeks to become JOB-READY in this skill at 1hr/day. Most skills should be 1-4 weeks. Only massive shifts should be up to 8 weeks.)
- reason: one sentence why this is high/low priority for this career goal`;

export function buildGapScoringPrompt(
  gapList: string[],
  companyType: string
): string {
  return `Company type: ${companyType}\n\nSkill gaps: ${JSON.stringify(gapList)}`;
}
