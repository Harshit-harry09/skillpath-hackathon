import type { KeywordBountyItem } from '@/types/analysis';

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#]/g, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Map(values.map((value) => [normalize(value), value])).values());
}

/** Deterministic estimate of the score value of adding a missing JD skill. */
export function calculateKeywordBounty(
  missingSkills: string[],
  jdSkills: string[],
  mvcSkills: string[],
  compositeScore: number,
): KeywordBountyItem[] {
  const jdFrequency = new Map<string, number>();
  for (const skill of jdSkills) {
    const key = normalize(skill);
    jdFrequency.set(key, (jdFrequency.get(key) || 0) + 1);
  }
  const mvc = new Set(mvcSkills.map(normalize));

  return unique(missingSkills)
    .map((skill) => {
      const key = normalize(skill);
      const isMustHave = mvc.has(key);
      const frequency = jdFrequency.get(key) || 0;
      let scoreImpact = 3;
      if (isMustHave) scoreImpact += 6;
      if (frequency > 1) scoreImpact += Math.min(2, frequency - 1);
      if (compositeScore < 70) scoreImpact += 1;

      const placement: KeywordBountyItem['placement'] = isMustHave ? 'skills' : 'experience';
      return {
        skill,
        scoreImpact,
        placement,
        suggestedLine: placement === 'skills'
          ? `${skill} (add only if you can support it with evidence)`
          : `Used ${skill} to improve [measurable outcome] in [project or process].`,
        priority: (scoreImpact >= 8 ? 'high' : scoreImpact >= 5 ? 'medium' : 'low') as KeywordBountyItem['priority'],
      };
    })
    .sort((a, b) => b.scoreImpact - a.scoreImpact || a.skill.localeCompare(b.skill));
}
