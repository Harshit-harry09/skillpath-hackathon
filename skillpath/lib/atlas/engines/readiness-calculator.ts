/**
 * SUB-SUB ENGINE: Readiness Calculator
 *
 * Computes a precise readiness score (0–100) for a given role
 * using real skill overlap data, experience weight, and gap adjustments.
 *
 * Formula:
 *  Base score         = weighted skill overlap % × 60
 *  Experience bonus   = min(years, 5) × 4
 *  Certification bonus = certs.length × 4 (capped at 16)
 *  Informal skills    = informal_count × 2 (capped at 14)
 *  Gap penalty        = 0 (gaps are NEVER penalized here)
 *  Missing critical   = -2 per high-frequency missing skill (capped at -20)
 *
 * Called by: Agent 4 (Career Twin), Agent 10 (Future Simulator)
 */

import { scoreAllRoles, type RoleScore } from './mvc-role-scorer';

export interface ReadinessBreakdown {
  total: number;             // 0–100
  skillOverlapScore: number; // 0–60
  experienceBonus: number;   // 0–20
  certificationBonus: number;// 0–16
  informalSkillBonus: number;// 0–14
  criticalMissingPenalty: number; // 0 to -20
  nearestRole: RoleScore | null;
  interpretation: 'ready' | 'mostly_ready' | 'partially_ready' | 'early_stage';
}

export function calculateReadiness(params: {
  skills: string[];
  informalSkillCount: number;
  experienceMonths: number;
  certifications: string[];
  targetRoleName: string;
}): ReadinessBreakdown {
  const { skills, informalSkillCount, experienceMonths, certifications, targetRoleName } = params;

  // Score against all roles, find the target role
  const scored = scoreAllRoles(skills, 'metro', '');
  const nearestRole = scored.find(r =>
    r.role.toLowerCase().includes(targetRoleName.toLowerCase().split(' ')[0])
  ) || scored[0] || null;

  // Skill overlap contributes 60 points max
  const skillOverlapScore = Math.round((nearestRole?.score ?? 0.45) * 60);

  // Experience: 4 points per year (max 20 for 5+ years)
  const experienceBonus = Math.min(20, Math.round((experienceMonths / 12) * 4));

  // Certifications: 4 points each (max 16)
  const certificationBonus = Math.min(16, certifications.length * 4);

  // Informal/transferred skills: 2 points each (max 14)
  const informalSkillBonus = Math.min(14, informalSkillCount * 2);

  // Penalty: -2 per high-frequency skill that's missing (max -20)
  const highFreqMissing = nearestRole?.missingSkills.filter(s => s.frequency_pct >= 40) ?? [];
  const criticalMissingPenalty = Math.max(-20, highFreqMissing.length * -2);

  const total = Math.max(10, Math.min(97,
    skillOverlapScore + experienceBonus + certificationBonus + informalSkillBonus + criticalMissingPenalty
  ));

  const interpretation: ReadinessBreakdown['interpretation'] =
    total >= 75 ? 'ready'
    : total >= 55 ? 'mostly_ready'
    : total >= 35 ? 'partially_ready'
    : 'early_stage';

  return {
    total,
    skillOverlapScore,
    experienceBonus,
    certificationBonus,
    informalSkillBonus,
    criticalMissingPenalty,
    nearestRole,
    interpretation,
  };
}
