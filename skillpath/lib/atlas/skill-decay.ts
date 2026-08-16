export interface SkillDecayInput {
  skill: string;
  lastUsedAt?: string | number;
  demandScore?: number;
  baselineFreshness?: number;
}

export interface SkillDecayResult {
  skill: string;
  freshness: number;
  decayPerYear: number;
  status: 'fresh' | 'watch' | 'stale';
  advice: string;
}

export function calculateSkillDecay(input: SkillDecayInput, now = new Date()): SkillDecayResult {
  const lastUsed = input.lastUsedAt ? new Date(input.lastUsedAt).getTime() : now.getTime();
  const ageYears = Math.max(0, (now.getTime() - lastUsed) / (365.25 * 24 * 60 * 60 * 1000));
  const demand = Math.max(0, Math.min(1, input.demandScore ?? 0.7));
  const decayPerYear = Math.round((0.08 - demand * 0.04) * 100) / 100;
  const baseline = Math.max(0, Math.min(100, input.baselineFreshness ?? 100));
  const freshness = Math.round(Math.max(0, baseline - ageYears * decayPerYear * 100));
  const status = freshness >= 75 ? 'fresh' : freshness >= 45 ? 'watch' : 'stale';
  return {
    skill: input.skill,
    freshness,
    decayPerYear,
    status,
    advice: status === 'fresh'
      ? 'Keep using it in visible work.'
      : status === 'watch'
        ? 'Refresh it with a small project or recent proof.'
        : 'Schedule a focused refresher before relying on it in interviews.',
  };
}

