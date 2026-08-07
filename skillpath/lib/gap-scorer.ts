// updated
/**
 * Gap Scorer — diffs required vs demonstrated skills and calculates match %.
 */

export interface GapResult {
  matchedSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  gapScore: number; // 0-100, where 100 = perfect match
}

/**
 * Compare JD-required skills against resume-demonstrated skills.
 * Returns the match percentage and categorized skill lists.
 */
export function scoreGap(
  jdSkills: string[],
  resumeSkills: string[]
): GapResult {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  const jdNorm = jdSkills.map(s => ({ original: s, clean: normalize(s) }));
  const resumeNorm = resumeSkills.map(s => ({ original: s, clean: normalize(s) }));

  const matched: string[] = [];
  const missing: string[] = [];
  const matchedClean = new Set<string>();

  // Use fuzzy substring matching for robustness
  for (const jd of jdNorm) {
    let found = false;
    for (const res of resumeNorm) {
      if (
        jd.clean === res.clean || 
        (jd.clean.length > 3 && res.clean.includes(jd.clean)) || 
        (res.clean.length > 3 && jd.clean.includes(res.clean))
      ) {
        found = true;
        break;
      }
    }

    if (found) {
      matched.push(jd.original);
      matchedClean.add(jd.clean);
    } else {
      missing.push(jd.original);
    }
  }

  const extra = resumeSkills.filter(s => !matchedClean.has(normalize(s)));

  // Mathematically Sound Gap Scoring:
  // If no JD skills required, gapScore is 0.
  // Otherwise, score is (matched.length / jdSkills.length) * 100 + optional extra skills bonus.
  const totalWeight = jdSkills.length;
  let gapScore = totalWeight === 0 ? 0 : Math.round((matched.length / totalWeight) * 100);

  // Strategic Bonus for relevant extra skills (up to 10% bonus, capped at 100%)
  if (extra.length > 0 && totalWeight > 0) {
    gapScore = Math.min(100, gapScore + Math.min(10, Math.ceil(extra.length * 1.5)));
  }

  return {
    matchedSkills: matched,
    missingSkills: missing,
    extraSkills: extra,
    gapScore,
  };
}
