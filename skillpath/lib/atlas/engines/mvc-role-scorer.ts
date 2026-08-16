/**
 * SUB-SUB ENGINE: MVC Role Scorer
 *
 * Performs TF-IDF style skill-overlap scoring between a user's
 * skill set and every role in mvc_model_india.json.
 *
 * Algorithm:
 *  1. Normalize both sides to lowercase
 *  2. For each role: overlap = matched skills weighted by frequency_pct
 *  3. Score = weighted_overlap / max_possible_role_weight (0.0–1.0)
 *  4. Penalize missing HIGH-FREQUENCY skills more than missing LOW-FREQUENCY ones
 *  5. Apply location bonus if role's top_locations includes candidate's city/tier
 *
 * Called by: Agent 5 (Opportunity Matcher), Agent 12 (Role Switch)
 */

import mvcIndiaRaw from '@/lib/data/mvc_model_india.json';

type MvcEntry = {
  role: string;
  salary_avg_lpa: number;
  sample_size: number;
  seniority: string;
  top_locations: string[];
  skills: { skill: string; count: number; frequency_pct: number }[];
};

const MVC_INDIA = mvcIndiaRaw as Record<string, MvcEntry>;

// ── Pre-built skill alias map for fuzzy matching ──────────────────────────────

const SKILL_ALIASES: Record<string, string[]> = {
  'python': ['python3', 'py', 'django', 'flask'],
  'javascript': ['js', 'node.js', 'nodejs', 'es6', 'ecmascript'],
  'typescript': ['ts'],
  'sql': ['mysql', 'postgresql', 'postgres', 'sqlite', 'mssql', 'oracle sql'],
  'excel': ['spreadsheet', 'google sheets', 'ms excel', 'microsoft excel'],
  'linux': ['ubuntu', 'centos', 'bash', 'shell', 'unix'],
  'cloud': ['aws', 'azure', 'gcp', 'google cloud'],
  'docker': ['containers', 'containerization'],
  'git': ['github', 'gitlab', 'version control', 'bitbucket'],
  'communication': ['verbal communication', 'written communication', 'stakeholder communication'],
  'data entry': ['data input', 'data keying', 'back office'],
  'excel / spreadsheets': ['excel', 'spreadsheet', 'google sheets'],
  'data quality': ['data validation', 'data cleaning', 'data quality assurance'],
  'documentation': ['record keeping', 'documentation skills', 'technical writing'],
  'schedule management': ['calendar management', 'scheduling', 'time management'],
  'coordination': ['stakeholder coordination', 'team coordination', 'cross-functional'],
};

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/[^a-z0-9\s+#.]/g, '').trim();
}

function buildUserSkillSet(userSkills: string[]): Set<string> {
  const set = new Set<string>();
  for (const skill of userSkills) {
    const norm = normalizeSkill(skill);
    set.add(norm);
    // Add all aliases
    for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
      if (norm === canonical || aliases.some(a => norm.includes(a) || a.includes(norm))) {
        set.add(canonical);
        aliases.forEach(a => set.add(a));
      }
    }
  }
  return set;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export interface RoleScore {
  roleKey: string;
  role: string;
  score: number;          // 0.0–1.0 (weighted TF-IDF overlap)
  salaryAvgLpa: number;
  sampleSize: number;
  seniority: string;
  matchedSkills: string[];
  missingSkills: { skill: string; frequency_pct: number }[];
  isRemoteFriendly: boolean;
  locationBonus: boolean;
  readyNow: boolean;
  weeksToReady: number;
}

/**
 * Score ALL roles in MVC India against the user's skill set.
 * Returns top N roles sorted by score.
 */
export function scoreAllRoles(
  userSkills: string[],
  locationTier: 'metro' | 'tier2' | 'tier3' | 'rural' | 'unknown',
  location: string,
  topN = 10
): RoleScore[] {
  const userSet = buildUserSkillSet(userSkills);
  const locationLower = location.toLowerCase();
  const results: RoleScore[] = [];

  for (const [key, entry] of Object.entries(MVC_INDIA)) {
    if (!entry.skills || entry.skills.length === 0) continue;

    const roleSkills = entry.skills.slice(0, 12); // top 12 skills per role
    const maxWeight = roleSkills.reduce((sum, s) => sum + s.frequency_pct, 0);
    if (maxWeight === 0) continue;

    let matchedWeight = 0;
    const matchedSkills: string[] = [];
    const missingSkills: { skill: string; frequency_pct: number }[] = [];

    for (const s of roleSkills) {
      const sNorm = normalizeSkill(s.skill);
      const matched = userSet.has(sNorm) ||
        Array.from(userSet).some(u =>
          u.includes(sNorm.split(' ')[0]) || sNorm.includes(u.split(' ')[0])
        );

      if (matched) {
        matchedWeight += s.frequency_pct;
        matchedSkills.push(s.skill);
      } else {
        missingSkills.push({ skill: s.skill, frequency_pct: s.frequency_pct });
      }
    }

    let score = matchedWeight / maxWeight; // base TF-IDF score

    // Location bonus: +0.04 if role lists Remote or candidate's city
    const isRemote = entry.top_locations.some(l => l.toLowerCase().includes('remote'));
    const locationMatch = entry.top_locations.some(l => locationLower.includes(l.toLowerCase()) || l.toLowerCase().includes(locationLower.split(',')[0].toLowerCase()));
    const locationBonus = isRemote || locationMatch;
    if (locationBonus) score = Math.min(0.96, score + 0.04);

    // Tier-2/3 penalty: metro-only roles are less accessible
    if ((locationTier === 'tier2' || locationTier === 'tier3' || locationTier === 'rural') && !isRemote) {
      score = Math.max(0.10, score - 0.08);
    }

    // Seniority check: senior roles get a penalty for early-career candidates
    if (entry.seniority === 'senior' && userSkills.length < 8) {
      score = Math.max(0.10, score - 0.12);
    }

    // Cap at 0.93 — always leave room for experience/certification gaps
    score = Math.min(0.93, score);

    // Weeks to ready: based on how many high-frequency skills are missing
    const criticalMissing = missingSkills.filter(s => s.frequency_pct >= 40).length;
    const moderateMissing = missingSkills.filter(s => s.frequency_pct >= 20 && s.frequency_pct < 40).length;
    const weeksToReady = criticalMissing * 2.5 + moderateMissing * 1.2;
    const readyNow = weeksToReady < 2 && score >= 0.60;

    results.push({
      roleKey: key,
      role: entry.role,
      score: Math.round(score * 100) / 100,
      salaryAvgLpa: entry.salary_avg_lpa,
      sampleSize: entry.sample_size,
      seniority: entry.seniority,
      matchedSkills,
      missingSkills: missingSkills.slice(0, 5),
      isRemoteFriendly: isRemote,
      locationBonus,
      readyNow,
      weeksToReady: Math.round(weeksToReady),
    });
  }

  return results
    .filter(r => r.score > 0.10)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Get a single role's data by partial name match.
 */
export function getRoleByName(roleName: string): (MvcEntry & { key: string }) | null {
  const lower = roleName.toLowerCase();
  const key = Object.keys(MVC_INDIA).find(k =>
    k.includes(lower.replace(/\s+/g, '-')) ||
    MVC_INDIA[k].role.toLowerCase().includes(lower)
  );
  if (!key) return null;
  return { ...MVC_INDIA[key], key };
}

/**
 * Compare two roles head-to-head across salary, demand, and skill overlap.
 */
export function compareRoles(
  roleAName: string,
  roleBName: string,
  userSkills: string[]
): {
  roleA: RoleScore | null;
  roleB: RoleScore | null;
  winner: 'A' | 'B' | 'tied';
  salaryWinner: 'A' | 'B' | 'tied';
  demandWinner: 'A' | 'B' | 'tied';
  fitWinner: 'A' | 'B' | 'tied';
} {
  const scored = scoreAllRoles(userSkills, 'metro', '');
  const roleA = scored.find(r => r.role.toLowerCase().includes(roleAName.toLowerCase())) || null;
  const roleB = scored.find(r => r.role.toLowerCase().includes(roleBName.toLowerCase())) || null;

  if (!roleA || !roleB) return { roleA, roleB, winner: 'tied', salaryWinner: 'tied', demandWinner: 'tied', fitWinner: 'tied' };

  const salaryWinner: 'A' | 'B' | 'tied' =
    roleA.salaryAvgLpa > roleB.salaryAvgLpa + 0.5 ? 'A'
    : roleB.salaryAvgLpa > roleA.salaryAvgLpa + 0.5 ? 'B'
    : 'tied';

  const demandWinner: 'A' | 'B' | 'tied' =
    roleA.sampleSize > roleB.sampleSize * 1.2 ? 'A'
    : roleB.sampleSize > roleA.sampleSize * 1.2 ? 'B'
    : 'tied';

  const fitWinner: 'A' | 'B' | 'tied' =
    roleA.score > roleB.score + 0.05 ? 'A'
    : roleB.score > roleA.score + 0.05 ? 'B'
    : 'tied';

  const votes = { A: 0, B: 0 };
  if (salaryWinner === 'A') votes.A++; else if (salaryWinner === 'B') votes.B++;
  if (demandWinner === 'A') votes.A++; else if (demandWinner === 'B') votes.B++;
  if (fitWinner === 'A') votes.A++; else if (fitWinner === 'B') votes.B++;

  const winner: 'A' | 'B' | 'tied' = votes.A > votes.B ? 'A' : votes.B > votes.A ? 'B' : 'tied';
  return { roleA, roleB, winner, salaryWinner, demandWinner, fitWinner };
}
