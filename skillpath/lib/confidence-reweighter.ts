// updated
/**
 * Skill Confidence Reweighter — Feature 2
 *
 * Pure, client-side logic to reweight skill gaps based on user self-assessment.
 * Zero API calls. Runs entirely in the browser.
 */

import type { SkillGap, ConfidenceLevel } from '@/types/analysis';

export const CONFIDENCE_LEVELS: {
  key: ConfidenceLevel;
  label: string;
  weight: number;
  description: string;
}[] = [
  { key: 'never_used',   label: 'Never used',  weight: 1.0, description: 'Full gap — priority learning' },
  { key: 'heard_of_it',  label: 'Heard of it', weight: 0.8, description: 'Needs real hands-on learning' },
  { key: 'used_it',      label: 'Used it',     weight: 0.5, description: 'Needs deepening, not basics' },
  { key: 'comfortable',  label: 'Comfortable', weight: 0.2, description: 'Minor polish only' },
  { key: 'strong',       label: 'Strong',      weight: 0.0, description: 'Not a gap — remove from plan' },
];

export const CONFIDENCE_WEIGHTS: Record<ConfidenceLevel, number> = {
  never_used:   1.0,
  heard_of_it:  0.8,
  used_it:      0.5,
  comfortable:  0.2,
  strong:       0.0,
};

/**
 * Reweight a list of skill gaps based on user self-assessment.
 *
 * - Skills marked "Strong" (weight 0.0) are removed entirely (returned in a separate list).
 * - Remaining skills get an adjusted priority and re-sorted weeks_to_learn.
 * - Output is sorted by adjusted priority (highest urgency first).
 */
export function reweightGaps(
  gaps: SkillGap[] = [],
  assessments: Record<string, ConfidenceLevel> = {}
): {
  activeGaps: SkillGap[];
  masteredSkills: SkillGap[];
} {
  const safeGaps = Array.isArray(gaps) ? gaps : [];
  const safeAssessments = assessments || {};
  const activeGaps: SkillGap[] = [];
  const masteredSkills: SkillGap[] = [];

  for (const gap of safeGaps) {
    if (!gap || typeof gap !== 'object') continue;
    const level  = safeAssessments[gap.skill] ?? 'never_used';
    const weight = CONFIDENCE_WEIGHTS[level] ?? 1.0;

    const adjustedGap: SkillGap = {
      ...gap,
      confidence_level:  level,
      confidence_weight: weight,
      adjusted_priority: Math.round((gap.priority || 3) * weight * 10) / 10,
      weeks_to_learn:    Math.max(1, Math.ceil((gap.weeks_to_learn || 1) * weight)),
    };

    if (weight === 0) {
      masteredSkills.push(adjustedGap);
    } else {
      activeGaps.push(adjustedGap);
    }
  }

  // Sort: highest adjusted_priority first (lower number = more urgent in this schema,
  // but we keep the original sort direction — lower priority number = higher urgency)
  activeGaps.sort((a, b) => (a.adjusted_priority ?? a.priority) - (b.adjusted_priority ?? b.priority));

  return { activeGaps, masteredSkills };
}

/**
 * Recompute the readiness score factoring in confidence self-assessment.
 *
 * Formula: Score = 1 - (remaining weighted gap / max possible gap)
 * A user who marks everything "Strong" gets 100%.
 * A user who marks everything "Never used" gets the original score.
 */
export function recomputeReadinessWithConfidence(
  gaps: SkillGap[] = [],
  resumeSkills: string[] = [],
  assessments: Record<string, ConfidenceLevel> = {}
): number {
  const safeGaps = Array.isArray(gaps) ? gaps : [];
  const safeResumeSkills = Array.isArray(resumeSkills) ? resumeSkills : [];
  const safeAssessments = assessments || {};

  if (safeGaps.length === 0 && safeResumeSkills.length === 0) return 100;

  // Identify all required role skills: gaps + matched resume skills
  const gapSkillsSet = new Set(safeGaps.filter(g => g?.skill).map(g => g.skill.toLowerCase()));
  const matchedResumeSkills = safeResumeSkills.filter(s => typeof s === 'string' && !gapSkillsSet.has(s.toLowerCase()));

  const allRequired: { skill: string; priority: number; isGap: boolean }[] = [
    ...safeGaps.filter(g => g?.skill).map(g => ({ skill: g.skill, priority: g.priority || 3, isGap: true })),
    ...matchedResumeSkills.map((s) => ({ skill: s, priority: 3, isGap: false }))
  ];

  if (allRequired.length === 0) return 100;

  let maxPossible = 0;
  let remainingGapWeight = 0;

  for (const item of allRequired) {
    const baseWeight = Math.max(1, 6 - Math.min(5, item.priority));
    maxPossible += baseWeight;

    const level = safeAssessments[item.skill] ?? (item.isGap ? 'never_used' : 'strong');
    const gapMultiplier = CONFIDENCE_WEIGHTS[level] ?? 1.0;
    remainingGapWeight += baseWeight * gapMultiplier;
  }

  if (maxPossible === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((1 - remainingGapWeight / maxPossible) * 100)));
}

/**
 * Recalculate total weeks remaining after confidence adjustments.
 */
export function recomputeWeeks(
  gaps: SkillGap[] = [],
  assessments: Record<string, ConfidenceLevel> = {}
): number {
  const safeGaps = Array.isArray(gaps) ? gaps : [];
  const safeAssessments = assessments || {};

  return safeGaps.reduce((sum, g) => {
    if (!g || typeof g !== 'object') return sum;
    const level  = safeAssessments[g.skill] ?? 'never_used';
    const weight = CONFIDENCE_WEIGHTS[level] ?? 1.0;
    if (weight === 0) return sum; // Strong → skip
    return sum + Math.max(1, Math.ceil((g.weeks_to_learn || 1) * weight));
  }, 0);
}
