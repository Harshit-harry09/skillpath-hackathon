/**
 * ATLAS 2.0 CAREER CRYSTAL BALL 🔮 — NARRATIVE GENERATOR
 * Generates a cinematic "news article from the future" 6 months out.
 */

import { callGeminiJSON } from '@/lib/gemini';
import type { CareerTwinOutput } from '../agent4-career-twin';
import type { OpportunityMatcherOutput } from '../agent5-opportunity-matcher';
import type { PathfinderOutput } from '../agent7-pathfinder';
import type { LearningRoadmapOutput } from '../agent8-learning-roadmap';
import type { DetailedSimulationResult } from '../agent10-future-simulator';

export interface CrystalBallParams {
  userName: string;
  location: string;
  careerTwin: CareerTwinOutput;
  matcherOutput?: OpportunityMatcherOutput;
  pathfinderOutput?: PathfinderOutput;
  roadmapOutput?: LearningRoadmapOutput;
  simulatorOutput?: DetailedSimulationResult;
}

export interface CrystalBallNarrative {
  headline: string;
  narrativeText: string;
  managerQuote: string;
  userQuote: string;
  pullQuote: string;
  targetRole: string;
  targetCompany: string;
  salary: string;
  learnedSkills: string[];
}

export async function generateCareerCrystalBall(params: CrystalBallParams): Promise<CrystalBallNarrative> {
  const targetRole = params.matcherOutput?.bestRole || 'Software Engineer';
  const matchRoleTitle = params.matcherOutput?.matches[0]?.role || 'Tech Corp';
  const targetCompany = `${matchRoleTitle.split(' ')[0]} Innovations`;
  const salaryAvg = params.matcherOutput?.matches[0]?.salary_avg_lpa || 8.5;
  const salaryStr = `₹${salaryAvg.toFixed(1)} LPA`;
  const skills = params.roadmapOutput?.certificationTargets?.concat(params.careerTwin.skills.slice(0, 3).map(s => s.name)) || ['Python', 'Cloud Architecture', 'System Design'];
  const project = params.roadmapOutput?.roadmapModules?.[0]?.handsOnProject?.title || 'AI Data Analytics Platform';

  const systemPrompt = `
You are the Executive Editor of Tech Career Daily.
Write a personalized, cinematic "news article from the future" set 6 months from today celebrating ${params.userName}'s breakthrough career transition.

Format as clean JSON:
{
  "headline": "Personalized news headline featuring candidate name",
  "narrativeText": "300-400 word journalistic story about their journey, skills learned, project built, and reframed career break",
  "managerQuote": "Praising quote from hiring manager about candidate's analytical strength",
  "userQuote": "Quote from candidate about how taking a sabbatical sharpened their resolve",
  "pullQuote": "Short, powerful 1-sentence shareable summary"
}
  `;

  const userContext = JSON.stringify({
    userName: params.userName,
    location: params.location,
    targetRole,
    targetCompany,
    salaryStr,
    skills,
    project,
    hasCareerGap: params.careerTwin.gap.duration_months > 0,
    gapMonths: params.careerTwin.gap.duration_months,
  });

  try {
    const result = await callGeminiJSON<{
      headline: string;
      narrativeText: string;
      managerQuote: string;
      userQuote: string;
      pullQuote: string;
    }>(systemPrompt, userContext, { temperature: 0.3 });

    return {
      headline: result.headline || `${params.userName} Lands Premier ${targetRole} Role at ${targetCompany}`,
      narrativeText: result.narrativeText || `Six months ago, ${params.userName} set out to master ${skills.join(', ')}. Today, as a senior contributor at ${targetCompany}, they lead engineering for ${project}, earning ${salaryStr}.`,
      managerQuote: result.managerQuote || `"${params.userName} brought a level of problem-solving rigor and practical skill mastery that immediately elevated our entire team."`,
      userQuote: result.userQuote || `"Reframing my career break as a dedicated skill sabbatical gave me the focus to build production systems."`,
      pullQuote: result.pullQuote || `"Skill-first execution turned potential obstacles into our greatest momentum."`,
      targetRole,
      targetCompany,
      salary: salaryStr,
      learnedSkills: skills,
    };
  } catch (err) {
    console.warn('[CrystalBall] LLM generation fallback:', err);
    return {
      headline: `${params.userName} Steers Career Milestone as ${targetRole} at ${targetCompany}`,
      narrativeText: `Six months ago, ${params.userName} initiated a structured transition into high-demand technical roles. By mastering ${skills.slice(0, 3).join(', ')} and deploying ${project}, they secured their target ${targetRole} position at ${salaryStr}. What began as a career break transformed into a powerful period of focused acceleration.`,
      managerQuote: `"${params.userName}'s technical adaptability and hands-on project portfolio made them an easy choice for our engineering organization."`,
      userQuote: `"Focusing on demonstrable skills allowed me to step into this role with complete confidence."`,
      pullQuote: `"Dedicated skill building turns career transitions into predictable success."`,
      targetRole,
      targetCompany,
      salary: salaryStr,
      learnedSkills: skills,
    };
  }
}
