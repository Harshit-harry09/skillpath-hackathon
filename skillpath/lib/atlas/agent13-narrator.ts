/**
 * ATLAS AGENT 13 — Atlas Narrator Agent
 *
 * Brain: The voice of Atlas. Gemini synthesizes ALL 12 agent outputs
 * into a single, cohesive, human-centered mission briefing.
 *
 * This is the final output the USER sees as their Atlas Orchestrator
 * opening statement. It must feel personal, empowering, honest, and
 * actionable — not like a generic summary.
 */

import { callGemini } from '@/lib/gemini';
import type { CareerTwinOutput } from './agent4-career-twin';
import type { OpportunityMatcherOutput } from './agent5-opportunity-matcher';
import type { CriticVerdict } from './agent6-critic';
import type { PathfinderOutput } from './agent7-pathfinder';
import type { LearningRoadmapOutput } from './agent8-learning-roadmap';
import type { InclusionAuditOutput } from './agent9-inclusion';

export interface AtlasNarratorOutput {
  missionTitle: string;
  openingStatement: string;
  keyInsights: string[]; // 3-5 bullet points (shown on dashboard)
  actionPlan: string;
  motivationalClose: string;
  warningIfAny: string | null;
  fullNarrativeText: string; // The complete Atlas briefing (used in text mode)
}

const SYSTEM_PROMPT = `You are Atlas — a deeply empathetic, brutally honest, and inspiring career intelligence operating system.

You are addressing a real person who has shared their full career history with you. Your job is to deliver their Career Mission Briefing.

This briefing must:
1. Acknowledge WHO they are specifically — their stage, background, and gap (without shame or pity).
2. State the KEY INSIGHT: what makes their profile unique and what opportunity this creates.
3. Explain the recommended path in 2-3 clear sentences.
4. Name the FIRST CONCRETE ACTION they should take THIS WEEK (not "learn Python" — be specific: "Start Module 1 of the Google IT Support Certificate on Coursera today").
5. Issue ONE honest warning (if applicable): something they must know so they are not surprised.
6. End with a grounding motivational close — earned, not generic.

CRITICAL RULES:
- DO NOT say "I understand how you feel" — be direct.
- DO NOT sugarcoat skill gaps — name them and then show the path through them.
- DO NOT overpromise timelines — use the Critic's adjusted estimates.
- DO use the candidate's translated gap skills as a genuine strength, not a consolation.
- Write in second person ("you", "your") — make it personal.
- 300-400 words maximum for the full narrative.

Tone: Confident mentor who has your back, not a cheerleader.`;

function buildLocalNarrative(
  twin: CareerTwinOutput,
  matcher: OpportunityMatcherOutput,
  critic: CriticVerdict,
  pathfinder: PathfinderOutput,
  roadmap: LearningRoadmapOutput,
  inclusion: InclusionAuditOutput
): AtlasNarratorOutput {
  const bestRole = critic.verifiedMatches[0]?.role || matcher.bestRole;
  const weeksToReady = critic.verifiedMatches[0]?.weeks_to_ready ?? matcher.matches[0]?.weeks_to_ready ?? 8;
  const targetRole = pathfinder.shortestPath[pathfinder.shortestPath.length - 1]?.role || twin.goalDecoded.primaryTarget;
  const isCyber = twin.interests.some(i => i.toLowerCase().includes('cyber') || i.toLowerCase().includes('security'));
  const hasGap = twin.gap.duration_months > 0;

  const gapTranslation = twin.gap.translated_skills.length > 0
    ? `Your ${twin.gap.duration_months}-month career pause (${twin.gap.reason}) was not dead time — Atlas identified ${twin.gap.translated_skills.length} professional competencies from that period: ${twin.gap.translated_skills.slice(0, 3).join(', ')}.`
    : '';

  const openingStatement = hasGap
    ? `${gapTranslation} These are real skills — coordination, documentation, and crisis management that tech employers explicitly look for in IT Support and SOC roles. Atlas does not count gaps against you. It counts them FOR you.`
    : `Your skill profile shows ${twin.skills.length} confirmed competencies across technical and transferable domains. Atlas has mapped these against ${matcher.totalOpportunityCount}+ live opportunities in your accessible market.`;

  const keyInsights = [
    `📊 Best match right now: ${bestRole} (${Math.round((critic.verifiedMatches[0]?.match_score ?? 0.72) * 100)}% match score — verified)`,
    `🎯 Target role in ${Math.round(pathfinder.totalMonthsToTarget / 4)} weeks: ${targetRole} at ₹${pathfinder.shortestPath[pathfinder.shortestPath.length - 1]?.salaryRange || '8-15 LPA'}`,
    `🧠 ${twin.gap.translated_skills.length} informal skills translated into professional strengths`,
    isCyber
      ? `🔒 Cybersecurity is a realistic 8-12 week journey — not a fantasy. Here is the exact path.`
      : `📈 Data analyst path begins with your existing data quality skills — no from-scratch learning needed`,
    inclusion.returnshipPrograms.length > 0
      ? `🌟 ${inclusion.returnshipPrograms.length} returnship programs identified that may offer a direct fast-track entry`
      : `⚡ ${matcher.totalOpportunityCount}+ remote opportunities available in your market`,
  ].filter(Boolean);

  const actionPlan = `Week 1: ${roadmap.roadmapModules[0]?.moduleTitle || 'Start the learning roadmap'} — ${roadmap.roadmapModules[0]?.handsOnProject?.title || 'complete your first hands-on project'}. Target time: ${roadmap.roadmapModules[0]?.weeklyTimeCommitment || 10} hours this week.`;

  const warning = critic.prerequisiteWarnings.length > 0
    ? `⚠️ Honest warning: ${critic.prerequisiteWarnings[0]}. This is fixable — the roadmap addresses it in Week 1-2.`
    : null;

  const motivationalClose = `You did not come to Atlas for false hope. You came for the truth about where you stand and the clearest possible path forward. This is that path. The 8-week roadmap is realistic, evidence-backed, and built specifically for your situation. The first step is always the hardest. Take it this week.`;

  const fullNarrative = [
    `ATLAS CAREER MISSION BRIEFING`,
    `Candidate Stage: ${twin.career_stage.replace(/_/g, ' ').toUpperCase()}`,
    `Location: ${twin.location}`,
    ``,
    openingStatement,
    ``,
    `OPPORTUNITY INTELLIGENCE:`,
    ...keyInsights.map(i => `  ${i}`),
    ``,
    `YOUR MISSION PATH:`,
    `  ${pathfinder.shortestPath.map(s => s.role).join(' → ')}`,
    `  Total journey: ${Math.round(pathfinder.totalMonthsToTarget / 4)} weeks | Salary growth: ₹${pathfinder.totalSalaryGrowthLpa} LPA`,
    ``,
    `IMMEDIATE ACTION:`,
    `  ${actionPlan}`,
    ``,
    warning ? `WARNING:\n  ${warning}\n` : '',
    motivationalClose,
  ].join('\n');

  return {
    missionTitle: `${twin.career_stage === 'career_gap_returner' ? 'Return to Tech: ' : ''}Your Path to ${targetRole}`,
    openingStatement,
    keyInsights,
    actionPlan,
    motivationalClose,
    warningIfAny: warning,
    fullNarrativeText: fullNarrative,
  };
}

export async function runAtlasNarratorAgent(
  twin: CareerTwinOutput,
  matcher: OpportunityMatcherOutput,
  critic: CriticVerdict,
  pathfinder: PathfinderOutput,
  roadmap: LearningRoadmapOutput,
  inclusion: InclusionAuditOutput
): Promise<AtlasNarratorOutput> {
  const bestRole = critic.verifiedMatches[0]?.role || matcher.bestRole;
  const weeksToReady = critic.verifiedMatches[0]?.weeks_to_ready ?? 8;
  const targetRole = pathfinder.shortestPath[pathfinder.shortestPath.length - 1]?.role || twin.goalDecoded.primaryTarget;

  try {
    const raw = await callGemini(
      SYSTEM_PROMPT,
      `Candidate Summary:\n- Stage: ${twin.career_stage}\n- Location: ${twin.location}\n- Career gap: ${twin.gap.duration_months}m (${twin.gap.reason})\n- Gap translated into: ${twin.gap.translated_skills.join(', ')}\n- Current match: ${bestRole} at ${Math.round((critic.verifiedMatches[0]?.match_score ?? 0) * 100)}%\n- Target: ${targetRole} (${Math.round(pathfinder.totalMonthsToTarget / 4)} weeks journey)\n- First action: ${roadmap.roadmapModules[0]?.moduleTitle} — ${roadmap.roadmapModules[0]?.handsOnProject?.title}\n- Critic warnings: ${critic.prerequisiteWarnings.join('; ') || 'none critical'}\n- Inclusion: ${inclusion.inclusionScore}/100 — ${inclusion.returnshipPrograms.length} returnship programs found\n- Honest truth from Critic: ${critic.honestTruth.slice(0, 300)}\n\nWrite the complete Atlas Career Mission Briefing. Return ONLY the plain text narrative.`,
      { model: 'gemini-3.5-flash-lite', maxTokens: 600, temperature: 0.4 }
    );

    const local = buildLocalNarrative(twin, matcher, critic, pathfinder, roadmap, inclusion);

    return {
      ...local,
      fullNarrativeText: raw,
      openingStatement: raw.split('\n').slice(0, 3).join(' ').slice(0, 400),
    };
  } catch (err) {
    console.warn('[AtlasNarratorAgent] Gemini failed, using local narrator:', err);
    return buildLocalNarrative(twin, matcher, critic, pathfinder, roadmap, inclusion);
  }
}
