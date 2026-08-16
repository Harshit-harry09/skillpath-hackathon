export interface BulletQuality {
  hasMetric: boolean;
  hasActionVerb: boolean;
  hasSkill: boolean;
  hasFirstPerson: boolean;
  isTooShort: boolean;
  hasPassiveVoice: boolean;
  vagueWords: string[];
  reasons: string[];
  score: number;
}

const ACTION_VERBS = /\b(architected|automated|built|coordinated|created|delivered|designed|drove|engineered|improved|launched|led|migrated|optimized|reduced|resolved|shipped|streamlined)\b/i;
const VAGUE_WORDS = ['worked', 'helped', 'involved', 'responsible for', 'assisted', 'handled'];

export function analyzeBulletQuality(bullet: string, skills: string[] = []): BulletQuality {
  const clean = bullet.trim();
  const lower = clean.toLowerCase();
  const vagueWords = VAGUE_WORDS.filter((word) => lower.includes(word));
  const hasMetric = /\b\d+(?:\.\d+)?\s*(?:%|x|k|m|users?|hours?|days?|ms|seconds?)?\b|[$₹€£]\s?\d/i.test(clean);
  const hasSkill = skills.some((skill) => lower.includes(skill.toLowerCase()));
  const hasFirstPerson = /\b(i|my|me|we|our)\b/i.test(clean);
  const isTooShort = clean.split(/\s+/).filter(Boolean).length < 8;
  const hasPassiveVoice = /\b(was|were|been|being)\s+\w+(?:ed|en)\b/i.test(clean);
  const hasActionVerb = ACTION_VERBS.test(clean);
  const reasons: string[] = [];

  if (!hasMetric) reasons.push('No measurable outcome');
  if (!hasActionVerb) reasons.push('Start with a specific action verb');
  if (!hasSkill) reasons.push('Name the relevant skill or tool');
  if (hasFirstPerson) reasons.push('Remove first-person phrasing');
  if (isTooShort) reasons.push('Add context and outcome');
  if (hasPassiveVoice) reasons.push('Use active voice');
  if (vagueWords.length) reasons.push(`Replace vague wording: ${vagueWords.join(', ')}`);

  return {
    hasMetric,
    hasActionVerb,
    hasSkill,
    hasFirstPerson,
    isTooShort,
    hasPassiveVoice,
    vagueWords,
    reasons,
    score: Math.max(0, 100 - reasons.length * 14),
  };
}

export function buildBulletRewrite(
  bullet: string,
  targetRole: string,
  missingSkills: string[],
  matchedSkills: string[],
): { originalBullet: string; improvedBullet: string; addedKeywords: string[]; addedMetricPrompt: string; confidence: number } {
  const quality = analyzeBulletQuality(bullet, [...missingSkills, ...matchedSkills]);
  const keyword = missingSkills[0] || matchedSkills[0] || 'the target workflow';
  const base = bullet.trim().replace(/^[•*-]\s*/, '').replace(/[.!?]+$/, '');
  const action = quality.hasActionVerb ? base : `Improved ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
  const improvedBullet = `${action} using ${keyword} for ${targetRole}, improving [measurable outcome] by [X%].`;
  return {
    originalBullet: bullet,
    improvedBullet,
    addedKeywords: quality.hasSkill ? [] : [keyword],
    addedMetricPrompt: 'Replace [X%] with a metric you can prove.',
    confidence: Math.max(0.45, Math.min(0.95, 0.9 - quality.reasons.length * 0.05)),
  };
}

export function findWeakBullets(bullets: string[], skills: string[] = []): string[] {
  return bullets.filter((bullet) => analyzeBulletQuality(bullet, skills).score < 75);
}

