/**
 * SUB-SUB ENGINE: Skill Demand Scorer
 *
 * Reads skill_trends.json + mvc_model_india.json to produce a
 * precise market demand score (0.0–1.0) for any skill string.
 *
 * Uses:
 *  - Trend direction (rising/stable/declining)
 *  - JD frequency % from MVC model (how often skill appears in job postings)
 *  - Year-over-year growth rate
 *
 * Called by: Agent 3 (Skill Graph), Agent 5 (Opportunity Matcher),
 *             Agent 6 (Critic), Agent 12 (Role Switch)
 */

import skillTrendsRaw from '@/lib/data/skill_trends.json';
import mvcIndiaRaw from '@/lib/data/mvc_model_india.json';

// ── Types ─────────────────────────────────────────────────────────────────────

type SkillTrend = {
  display: string;
  category: string;
  trend: string;
  jd_frequency: Record<string, number>;
  peak_year?: number;
  modern_replacement?: string;
  verdict?: string;
  severity?: string;
};

type MvcEntry = {
  role: string;
  salary_avg_lpa: number;
  sample_size: number;
  seniority: string;
  top_locations: string[];
  skills: { skill: string; count: number; frequency_pct: number }[];
};

const SKILL_TRENDS = skillTrendsRaw.skills as Record<string, SkillTrend>;
const MVC_INDIA = mvcIndiaRaw as Record<string, MvcEntry>;

// ── Pre-compute: global skill demand from MVC dataset ─────────────────────────

const GLOBAL_SKILL_FREQUENCY: Map<string, number> = new Map();
const GLOBAL_SKILL_SALARY: Map<string, number[]> = new Map();

(function buildSkillIndex() {
  for (const entry of Object.values(MVC_INDIA)) {
    for (const s of entry.skills || []) {
      const key = s.skill.toLowerCase();
      GLOBAL_SKILL_FREQUENCY.set(key, (GLOBAL_SKILL_FREQUENCY.get(key) || 0) + s.count);
      if (!GLOBAL_SKILL_SALARY.has(key)) GLOBAL_SKILL_SALARY.set(key, []);
      GLOBAL_SKILL_SALARY.get(key)!.push(entry.salary_avg_lpa);
    }
  }
})();

const MAX_FREQ = Math.max(...GLOBAL_SKILL_FREQUENCY.values(), 1);

// ── API ───────────────────────────────────────────────────────────────────────

export type MarketDemand = 'very_high' | 'high' | 'medium' | 'low' | 'declining';

export interface SkillDemandResult {
  skillName: string;
  normalizedKey: string;
  demandScore: number;       // 0.0 – 1.0
  marketDemand: MarketDemand;
  trend: 'rising' | 'stable' | 'declining' | 'unknown';
  avgSalaryBoost: number;    // avg salary of roles that list this skill (LPA)
  jobCountEstimate: number;  // how many JD postings reference it
  freshness: 'modern' | 'stable' | 'aging' | 'deprecated';
  modernReplacement?: string;
}

/**
 * Score a single skill name against real market data.
 */
export function scoreSkillDemand(skillName: string): SkillDemandResult {
  const raw = skillName.toLowerCase().trim();

  // --- Step 1: Check skill_trends.json (explicit trend data) ---
  const trendKey = Object.keys(SKILL_TRENDS).find(k =>
    raw.includes(k) || k.includes(raw.split(' ')[0])
  );
  const trendData = trendKey ? SKILL_TRENDS[trendKey] : null;

  // --- Step 2: Check MVC global frequency index ---
  const mvcKey = Array.from(GLOBAL_SKILL_FREQUENCY.keys()).find(k =>
    k.includes(raw) || raw.includes(k.split(' ')[0])
  );
  const mvcFreq = mvcKey ? (GLOBAL_SKILL_FREQUENCY.get(mvcKey) || 0) : 0;
  const mvcSalaries = mvcKey ? (GLOBAL_SKILL_SALARY.get(mvcKey) || []) : [];
  const avgSalary = mvcSalaries.length > 0
    ? mvcSalaries.reduce((a, b) => a + b, 0) / mvcSalaries.length
    : 8.0;

  // --- Step 3: Compute demand score ---
  const freqScore = Math.min(1.0, mvcFreq / MAX_FREQ); // 0.0–1.0 from MVC data

  let trendMultiplier = 1.0;
  let trend: SkillDemandResult['trend'] = 'unknown';
  let freshness: SkillDemandResult['freshness'] = 'stable';

  if (trendData) {
    const freqs = Object.values(trendData.jd_frequency);
    if (freqs.length >= 2) {
      const growth = (freqs[freqs.length - 1] - freqs[0]) / Math.max(freqs[0], 1);
      if (growth > 0.15) { trend = 'rising'; trendMultiplier = 1.25; freshness = 'modern'; }
      else if (growth < -0.30) { trend = 'declining'; trendMultiplier = 0.60; freshness = trendData.severity === 'high' ? 'deprecated' : 'aging'; }
      else { trend = 'stable'; trendMultiplier = 1.0; }
    }
  }

  // Informal/transferable skills not in MVC — assign base scores
  const INFORMAL_BASE: Record<string, number> = {
    'coordination': 0.78, 'documentation': 0.82, 'schedule': 0.75, 'crisis': 0.72,
    'attention to detail': 0.88, 'data quality': 0.85, 'process': 0.76,
    'communication': 0.90, 'stakeholder': 0.80, 'budgeting': 0.72,
    'caregiving': 0.65, 'management': 0.82, 'analytical': 0.85,
    'problem solving': 0.88, 'security mindset': 0.84,
  };

  const informalKey = Object.keys(INFORMAL_BASE).find(k =>
    raw.includes(k) || k.includes(raw.split(' ')[0])
  );

  const rawScore = informalKey
    ? INFORMAL_BASE[informalKey]
    : Math.min(0.95, freqScore * trendMultiplier + 0.15); // base floor for known skills

  const demandScore = Math.max(0.10, Math.min(0.98, rawScore));

  const marketDemand: MarketDemand =
    demandScore >= 0.80 ? 'very_high'
    : demandScore >= 0.65 ? 'high'
    : demandScore >= 0.45 ? 'medium'
    : trend === 'declining' ? 'declining'
    : 'low';

  return {
    skillName,
    normalizedKey: raw,
    demandScore,
    marketDemand,
    trend: trendData ? trend : (mvcFreq > 5000 ? 'stable' : 'unknown'),
    avgSalaryBoost: avgSalary,
    jobCountEstimate: mvcFreq,
    freshness,
    modernReplacement: trendData?.modern_replacement,
  };
}

export function scoreSkillsBatch(skillNames: string[]): SkillDemandResult[] {
  if (!Array.isArray(skillNames)) {
    if (typeof skillNames === 'string') {
      skillNames = [skillNames];
    } else if (skillNames && typeof skillNames === 'object') {
      skillNames = Object.values(skillNames).filter((v): v is string => typeof v === 'string');
    } else {
      return [];
    }
  }
  return skillNames
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map(scoreSkillDemand)
    .sort((a, b) => b.demandScore - a.demandScore);
}

/**
 * Get top N skills from the entire MVC dataset for a given goal keyword.
 */
export function getTopMarketSkills(goalKeyword: string, topN = 10): string[] {
  const goalLower = goalKeyword.toLowerCase();
  const relevant = Object.values(MVC_INDIA).filter(entry =>
    entry.role.toLowerCase().includes(goalLower) ||
    goalLower.includes(entry.role.toLowerCase().split(' ')[0].toLowerCase())
  );

  if (relevant.length === 0) return [];

  const freq: Record<string, number> = {};
  for (const entry of relevant) {
    for (const s of entry.skills || []) {
      freq[s.skill] = (freq[s.skill] || 0) + s.frequency_pct;
    }
  }

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([skill]) => skill);
}
