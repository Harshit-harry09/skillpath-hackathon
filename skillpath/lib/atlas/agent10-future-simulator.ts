/**
 * ATLAS AGENT 10 — Future Simulator Agent
 *
 * Brain: Deterministic simulation engine (no AI needed here — pure math)
 * that recalculates readiness scores, salary potential, opportunity count,
 * and weeks to target based on user-adjusted learning parameters.
 *
 * Powers the interactive "What-If" Future Simulator dashboard panel.
 */

import type { AtlasSimulationInput, AtlasSimulationResult } from '@/types/atlas';

export interface DetailedSimulationResult extends AtlasSimulationResult {
  scoreBreakdown: {
    base: number;
    hourBoost: number;
    projectBoost: number;
    relocationBoost: number;
    remote_restriction_penalty: number;
  };
  weeklyBreakdown: {
    week: number;
    projectedScore: number;
    milestone: string;
  }[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    advice: string;
  };
  salaryTrajectory: {
    now: number;
    at3Months: number;
    at6Months: number;
    at12Months: number;
  };
}

export function runFutureSimulatorAgent(
  input: AtlasSimulationInput,
  baseMatchScore: number,
  baseSalaryLpa: number,
  baseWeeksToReady: number
): DetailedSimulationResult {
  // Score calculations
  const hourBoost = Math.max(0, Math.min(0.15, (input.learning_hours_per_week - 10) * 0.012));
  const projectBoost = Math.min(0.16, input.completed_projects_count * 0.04);
  const relocationBoost = input.relocation_willing ? 0.06 : 0;
  const remotePenalty = input.remote_only ? -0.04 : 0; // remote-only limits some roles

  const updatedScore = Math.min(0.97, Math.max(0.35,
    baseMatchScore + hourBoost + projectBoost + relocationBoost + remotePenalty
  ));

  // Weeks to ready
  const hourFactor = Math.max(0, (input.learning_hours_per_week - 10) * 0.25);
  const projectFactor = input.completed_projects_count * 0.8;
  const updatedWeeks = Math.max(2, Math.round(baseWeeksToReady - hourFactor - projectFactor));

  // Opportunity count
  let opportunityCount = 50;
  if (input.remote_only) opportunityCount = 38;
  if (input.relocation_willing) opportunityCount = 95;
  if (input.risk_appetite === 'aggressive') opportunityCount = Math.round(opportunityCount * 1.4);
  if (input.risk_appetite === 'conservative') opportunityCount = Math.round(opportunityCount * 0.7);

  // Salary trajectory
  const learningMultiplier = 1 + (projectBoost * 2.5);
  const salaryNow = baseSalaryLpa;
  const at3Months = Math.round(baseSalaryLpa * (1 + projectBoost) * 10) / 10;
  const at6Months = Math.round(baseSalaryLpa * learningMultiplier * 1.2 * 10) / 10;
  const at12Months = Math.round(input.target_salary_lpa * Math.min(1.1, learningMultiplier) * 10) / 10;

  // Weekly projection
  const weeklyBreakdown = Array.from({ length: 8 }, (_, i) => {
    const week = i + 1;
    const weekProgress = week / 8;
    const weekScore = Math.min(updatedScore, baseMatchScore + (updatedScore - baseMatchScore) * weekProgress);
    const milestones: Record<number, string> = {
      1: 'Foundations started — readiness building',
      2: 'Core technical concepts unlocked',
      3: 'First lab project completed',
      4: 'SIEM / SQL fundamentals achieved',
      5: 'Portfolio project in progress',
      6: 'Resume updated with new skills',
      7: 'Interview-ready state reached',
      8: 'Application launch — ready for hire',
    };
    return {
      week,
      projectedScore: Math.round(weekScore * 100),
      milestone: milestones[week] || `Week ${week} milestone`,
    };
  });

  // Risk assessment
  const riskLevel = input.risk_appetite === 'conservative' ? 'low'
    : input.risk_appetite === 'aggressive' ? 'high'
    : 'medium';

  const riskAdvice: Record<string, string> = {
    low: 'Conservative approach: stable progress, lower burnout risk. Increase to 15 hours/week for faster results.',
    medium: 'Balanced approach: optimal learning velocity. Maintain consistency; do not skip projects.',
    high: 'Aggressive mode: high speed, high reward. Risk of burnout — take rest days. Pair with a mentor for accountability.',
  };

  // Projected roles based on updated score
  const projectedRoles = updatedScore >= 0.85
    ? ['SOC Analyst Trainee', 'IT Support Specialist (Remote)', 'Junior Security Administrator']
    : updatedScore >= 0.75
    ? ['IT Support Trainee', 'IT Helpdesk Analyst']
    : ['IT Support Trainee (Entry)', 'Digital Skills Apprenticeship'];

  return {
    updated_match_score: Math.round(updatedScore * 100) / 100,
    updated_weeks_to_ready: updatedWeeks,
    opportunity_count: opportunityCount,
    salary_potential_lpa: at12Months,
    projected_roles: projectedRoles,
    scoreBreakdown: {
      base: Math.round(baseMatchScore * 100),
      hourBoost: Math.round(hourBoost * 100),
      projectBoost: Math.round(projectBoost * 100),
      relocationBoost: Math.round(relocationBoost * 100),
      remote_restriction_penalty: Math.round(remotePenalty * 100),
    },
    weeklyBreakdown,
    riskAssessment: {
      level: riskLevel,
      advice: riskAdvice[riskLevel],
    },
    salaryTrajectory: {
      now: salaryNow,
      at3Months,
      at6Months,
      at12Months,
    },
  };
}
