/**
 * ATLAS AGENT 3 — Skill Graph Agent (Algorithmic Engine)
 *
 * Uses `skill-demand-scorer.ts` and `gap-skill-translator.ts` sub-sub engines.
 * Maps formal and informal candidate experience into an enriched skill graph
 * with market demand scores, freshness, learning dependencies, and clusters.
 */

import type { AtlasSkill } from '@/types/atlas';
import type { ParsedResume } from './agent1-resume-parser';
import { scoreSkillDemand, scoreSkillsBatch, type SkillDemandResult } from './engines/skill-demand-scorer';
import { detectExperienceCategories, translateExperienceToSkills, type TranslatedSkill } from './engines/gap-skill-translator';

export interface EnrichedSkill extends AtlasSkill {
  category: string;
  marketDemand: 'very_high' | 'high' | 'medium' | 'low' | 'declining';
  informalSource?: string;
  learningDependencies: string[];
  unlocks: string[];
  freshness: 'modern' | 'stable' | 'aging' | 'deprecated';
  seniority: 'foundational' | 'mid' | 'advanced' | 'expert';
}

export interface SkillGraphOutput {
  allSkills: EnrichedSkill[];
  technicalSkills: EnrichedSkill[];
  transferableSkills: EnrichedSkill[];
  informalMappedSkills: EnrichedSkill[];
  missingFoundationalSkills: string[];
  skillClusters: Record<string, string[]>;
  overallSkillStrength: number;
  aiInsight: string;
}

export async function runSkillGraphAgent(
  parsed: ParsedResume,
  userGoal: string,
  confirmedAnswers: Record<string, string>
): Promise<SkillGraphOutput> {
  // 1. Translate informal experience
  const categories = detectExperienceCategories(parsed.rawText);
  const gapReason = confirmedAnswers['gap_reason'] || '';
  if (gapReason.toLowerCase().includes('caregiving') && !categories.includes('caregiving')) {
    categories.push('caregiving');
  }

  const translatedInformal = translateExperienceToSkills(categories, 8);

  const informalMappedSkills: EnrichedSkill[] = translatedInformal.map(t => {
    const demand = scoreSkillDemand(t.name);
    return {
      name: t.name,
      score: t.score,
      category: t.category,
      marketDemand: t.marketDemand,
      informalSource: t.informalSource,
      learningDependencies: [],
      unlocks: t.techJobsItUnlocks,
      freshness: demand.freshness,
      seniority: 'foundational',
    };
  });

  // 2. Score formal skills against skill_trends & MVC dataset
  const formalDemands = scoreSkillsBatch(parsed.skills);

  const technicalSkills: EnrichedSkill[] = formalDemands.map(d => ({
    name: d.skillName,
    score: d.demandScore,
    category: d.freshness === 'modern' ? 'Modern Technical' : 'Technical',
    marketDemand: d.marketDemand,
    learningDependencies: [],
    unlocks: [],
    freshness: d.freshness,
    seniority: d.demandScore > 0.8 ? 'mid' : 'foundational',
  }));

  const transferableSkills: EnrichedSkill[] = informalMappedSkills.filter(s => s.category !== 'Technical');

  const allSkills = [...technicalSkills, ...informalMappedSkills];

  // 3. Build Skill Clusters
  const skillClusters: Record<string, string[]> = {};
  for (const s of allSkills) {
    const cat = s.category || 'General';
    if (!skillClusters[cat]) skillClusters[cat] = [];
    skillClusters[cat].push(s.name);
  }

  // 4. Determine missing foundational skills based on goal
  const goalLower = userGoal.toLowerCase();
  const missingFoundationalSkills: string[] = [];
  const allSkillNamesLower = allSkills.map(s => s.name.toLowerCase());

  if (goalLower.includes('cyber') || goalLower.includes('security') || goalLower.includes('hacker')) {
    if (!allSkillNamesLower.some(s => s.includes('linux'))) missingFoundationalSkills.push('Linux Command Line');
    if (!allSkillNamesLower.some(s => s.includes('network') || s.includes('tcp'))) missingFoundationalSkills.push('Networking Fundamentals (TCP/IP)');
    if (!allSkillNamesLower.some(s => s.includes('security'))) missingFoundationalSkills.push('Security Mindset & Threat Modeling');
  } else if (goalLower.includes('data') || goalLower.includes('analyst')) {
    if (!allSkillNamesLower.some(s => s.includes('sql'))) missingFoundationalSkills.push('SQL Queries (SELECT, JOIN)');
    if (!allSkillNamesLower.some(s => s.includes('excel') || s.includes('spreadsheet'))) missingFoundationalSkills.push('Advanced Excel (Pivot Tables)');
    if (!allSkillNamesLower.some(s => s.includes('python') || s.includes('power bi'))) missingFoundationalSkills.push('Power BI or Python Pandas');
  }

  // 5. Calculate overall strength score
  const avgScore = allSkills.length > 0
    ? allSkills.reduce((sum, s) => sum + s.score, 0) / allSkills.length
    : 0.5;
  const overallSkillStrength = Math.round(Math.min(95, Math.max(30, avgScore * 75 + informalMappedSkills.length * 3)));

  const aiInsight = `Algorithmic analysis mapped ${technicalSkills.length} formal skills and ${informalMappedSkills.length} translated informal competencies (${categories.join(', ')}). Market demand score: ${overallSkillStrength}/100.`;

  return {
    allSkills,
    technicalSkills,
    transferableSkills,
    informalMappedSkills,
    missingFoundationalSkills,
    skillClusters,
    overallSkillStrength,
    aiInsight,
  };
}
