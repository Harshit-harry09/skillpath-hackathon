// updated
import skillTrends from './data/skill_trends.json';

export type TrendStatus = 'declining' | 'stable_high' | 'rising' | 'unknown';
export type Severity = 'high' | 'medium' | 'none';

export interface ExpiredSkill {
  skill: string;
  display: string;
  trend: TrendStatus;
  decline: number;
  severity: Severity;
  replacement?: string;
  verdict: string;
  latest_freq: number;
  peak_freq: number;
}

export interface FreshnessResult {
  score: number;
  expiring_skills: ExpiredSkill[];
  stable_skills: string[];
  rising_skills: string[];
  verdict: string;
}

const TREND_DATA = (skillTrends as any).skills;

function findSkillTrend(skillName: string) {
  const normalized = skillName.toLowerCase().replace(/\.js$/, '').trim();
  
  // 1. Exact match
  if (TREND_DATA[normalized]) return TREND_DATA[normalized];

  // 2. Fuzzy match (key starts with or contains)
  const key = Object.keys(TREND_DATA).find(k => 
    normalized === k.toLowerCase() || 
    normalized.includes(k.toLowerCase()) ||
    k.toLowerCase().includes(normalized)
  );

  return key ? TREND_DATA[key] : null;
}

export function computeFreshnessScore(userSkills: string[]): FreshnessResult {
  const results = userSkills.map(skill => {
    const data = findSkillTrend(skill);
    if (!data) return { skill, status: 'unknown' };

    const freqValues = Object.values(data.jd_frequency) as number[];
    const latest = data.jd_frequency['2025'] || freqValues[freqValues.length - 1];
    const peak = Math.max(...freqValues);
    const decline = peak > 0 ? ((peak - latest) / peak) * 100 : 0;

    return {
      skill,
      display: data.display,
      trend: data.trend,
      decline: Math.round(decline),
      severity: data.severity,
      replacement: data.modern_replacement,
      verdict: data.verdict,
      latest_freq: latest,
      peak_freq: peak
    };
  });

  const expiring = results.filter(r => 
    r.status !== 'unknown' && 
    (r.severity === 'high' || r.severity === 'medium')
  ) as ExpiredSkill[];

  const stable = results.filter(r => 
    r.status !== 'unknown' && 
    (r.trend === 'stable_high' || r.trend === 'rising') &&
    r.severity === 'none'
  );

  const rising = results.filter(r => 
    r.status !== 'unknown' && 
    r.trend === 'rising'
  );

  // Penalize score for each expiring skill
  // High severity = -15 points, Medium = -8 points
  const penalty = expiring.reduce((sum, s) =>
    sum + (s.severity === 'high' ? 15 : 8), 0
  );

  const score = Math.max(0, Math.min(100, 100 - penalty));

  const verdict =
    score >= 80 ? 'Your skillset is fresh and modern' :
    score >= 60 ? 'Some skills are aging — update recommended' :
    score >= 40 ? 'Several key skills are declining — act now' :
                  'Your resume is significantly outdated';

  return { 
    score, 
    expiring_skills: expiring, 
    stable_skills: stable.map(s => s.skill), 
    rising_skills: rising.map(s => s.skill), 
    verdict 
  };
}
