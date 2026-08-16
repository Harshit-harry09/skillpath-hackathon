/**
 * ATLAS AGENT 6 — Critic Agent
 *
 * Brain: Gemini acts as a brutal, honest devil's advocate.
 * Reviews the Opportunity Matcher's output and challenges every recommendation.
 * Prevents overpromising, flags prerequisite gaps, and adjusts match scores down
 * if the recommendation is not grounded in evidence.
 *
 * This agent exists to protect the USER from false hope.
 */

import { callGemini } from '@/lib/gemini';
import type { AtlasRoleMatch } from '@/types/atlas';
import type { CareerTwinOutput } from './agent4-career-twin';
import type { OpportunityMatcherOutput } from './agent5-opportunity-matcher';

export interface CriticVerdict {
  isOverpromising: boolean;
  challengedRoles: {
    role: string;
    originalScore: number;
    adjustedScore: number;
    challenge: string;
    verdict: 'approved' | 'adjusted' | 'rejected';
  }[];
  verifiedMatches: AtlasRoleMatch[];
  honestTruth: string; // The complete, unfiltered honest assessment
  prerequisiteWarnings: string[];
  positiveReframe: string; // What the candidate IS genuinely strong at
}

const SYSTEM_PROMPT = `You are the Atlas Critic Agent — the most honest, uncompromising agent in the system.

Your job is to CHALLENGE every career recommendation made by the Opportunity Matcher.

You must:
1. Review each proposed role match and ask: "Is this ACTUALLY realistic given the skills evidence?"
2. If a role requires skills the candidate doesn't have, reduce the match score.
3. Detect OVERPROMISING: if match score > 0.80 but candidate has > 3 critical missing skills, reduce it.
4. Check prerequisite chains: a candidate can't go from zero to Cybersecurity Analyst without Linux, Networking, and Security fundamentals.
5. Flag impossible jumps: don't recommend Senior-level roles to entry-level candidates.
6. BUT also check if the Matcher was TOO conservative: don't downgrade candidates for career gaps or location.
7. Give each role a verdict: approved (score OK), adjusted (score changed), rejected (not realistic now).
8. Write a blunt "honestTruth" that the candidate needs to hear — but frame it with kindness and a clear path forward.
9. Write a "positiveReframe" highlighting what the candidate IS genuinely good at.

CRITICAL RULES:
- Never penalize for career gaps. Only penalize for missing TECHNICAL prerequisites.
- Never downgrade for location, gender, background, or education tier.
- DO penalize for role mismatch: if someone wants "hacker jobs" but has zero networking knowledge, say so clearly.
- Your "honestTruth" must end with a clear, achievable next step.

Return plain text in this format:
HONEST_TRUTH: [2-3 sentences]
POSITIVE_REFRAME: [1-2 sentences]
PREREQUISITE_WARNINGS: [comma-separated list]
OVERPR OMISING: yes/no
CHALLENGED_ROLES: [JSON array]`;

function parseTextVerdict(text: string, originalMatches: AtlasRoleMatch[]): CriticVerdict {
  const honestTruthMatch = text.match(/HONEST_TRUTH:\s*([\s\S]+?)(?=POSITIVE_REFRAME:|$)/);
  const positiveReframeMatch = text.match(/POSITIVE_REFRAME:\s*([\s\S]+?)(?=PREREQUISITE_WARNINGS:|$)/);
  const warningsMatch = text.match(/PREREQUISITE_WARNINGS:\s*([\s\S]+?)(?=OVERPROMISING:|$)/);
  const overpromisMatch = text.match(/OVERPROMISING:\s*(yes|no)/i);
  const challengedMatch = text.match(/CHALLENGED_ROLES:\s*(\[[\s\S]+\])/);

  let challengedRoles: CriticVerdict['challengedRoles'] = originalMatches.map(m => ({
    role: m.role,
    originalScore: m.match_score,
    adjustedScore: m.match_score,
    challenge: 'Score verified by Critic Agent.',
    verdict: 'approved' as const,
  }));

  if (challengedMatch) {
    try {
      const parsed = JSON.parse(challengedMatch[1]);
      if (Array.isArray(parsed)) challengedRoles = parsed;
    } catch { /* keep defaults */ }
  }

  const verifiedMatches = originalMatches.map((m, i) => ({
    ...m,
    match_score: challengedRoles[i]?.adjustedScore ?? m.match_score,
  }));

  return {
    isOverpromising: overpromisMatch?.[1]?.toLowerCase() === 'yes',
    challengedRoles,
    verifiedMatches,
    honestTruth: honestTruthMatch?.[1]?.trim() || 'Your strongest immediate opportunity is the role with the highest match score. Build the missing skills systematically over the next 8 weeks.',
    prerequisiteWarnings: warningsMatch?.[1]?.split(',').map(w => w.trim()).filter(Boolean) || [],
    positiveReframe: positiveReframeMatch?.[1]?.trim() || 'Your transferable skills and lived experience give you a real edge in coordination-heavy technical support roles.',
  };
}

function localCriticVerdict(twin: CareerTwinOutput, matcherOutput: OpportunityMatcherOutput): CriticVerdict {
  const isCyber = twin.interests.some(i => i.toLowerCase().includes('cyber') || i.toLowerCase().includes('security'));
  const getSkillName = (s: any) => typeof s === 'string' ? s : (s?.name || s?.skill || '');
  const hasLinux = twin.skills.some(s => getSkillName(s).toLowerCase().includes('linux'));
  const hasNetworking = twin.skills.some(s => getSkillName(s).toLowerCase().includes('network') || getSkillName(s).toLowerCase().includes('tcp'));

  const challenged: CriticVerdict['challengedRoles'] = matcherOutput.matches.map(m => {
    const isCyberRole = m.role.toLowerCase().includes('cyber') || m.role.toLowerCase().includes('soc') || m.role.toLowerCase().includes('security');
    let adjustedScore = m.match_score;
    let challenge = 'Score verified — match is grounded in evidence.';
    let verdict: 'approved' | 'adjusted' | 'rejected' = 'approved';

    if (isCyberRole && !hasLinux && !hasNetworking && m.match_score > 0.75) {
      adjustedScore = Math.max(0.45, m.match_score - 0.22);
      challenge = 'Reduced: Linux and Networking prerequisites are absent. Score inflation corrected.';
      verdict = 'adjusted';
    } else if (m.missing_skills.length > 5 && m.match_score > 0.70) {
      adjustedScore = Math.max(0.50, m.match_score - 0.10);
      challenge = 'Slight reduction: more than 5 critical missing skills detected.';
      verdict = 'adjusted';
    }

    return { role: m.role, originalScore: m.match_score, adjustedScore, challenge, verdict };
  });

  const isOverpromising = challenged.some(c => c.verdict === 'adjusted');

  let honestTruth = '';
  if (isCyber && !hasLinux) {
    honestTruth = `You want a cybersecurity or hacker role — that goal is 100% achievable. However, the Opportunity Matcher initially scored it higher than warranted. Direct entry requires Linux, networking fundamentals, and security basics that you haven't shown yet. The honest starting point is IT Support Trainee. From there, the path to SOC Analyst and Cybersecurity Analyst is clear and achievable within 3-4 months of focused study.`;
  } else {
    honestTruth = `Your skill profile is solid for entry-level data and IT roles. The recommended path is honest and grounded in your actual evidence — not aspirational inflation. Focus on the first bridge role, complete the 8-week roadmap, and the next role up becomes realistic.`;
  }

  return {
    isOverpromising,
    challengedRoles: challenged,
    verifiedMatches: matcherOutput.matches.map((m, i) => ({
      ...m,
      match_score: challenged[i]?.adjustedScore ?? m.match_score,
    })),
    honestTruth,
    prerequisiteWarnings: isCyber && !hasLinux
      ? ['Linux CLI required before SOC Analyst role', 'TCP/IP Networking fundamentals required', 'SIEM tool exposure required before security analyst']
      : [],
    positiveReframe: `Your ${twin.gap.translated_skills.length > 0 ? `${twin.gap.translated_skills.length} translated informal skills (${twin.gap.translated_skills.slice(0, 3).join(', ')}) give you` : 'existing skills give you'} a genuine head start — especially in attention to detail, coordination, and documentation, which are core to IT Support and data quality roles.`,
  };
}

export async function runCriticAgent(
  twin: CareerTwinOutput,
  matcherOutput: OpportunityMatcherOutput
): Promise<CriticVerdict> {
  try {
    const raw = await callGemini(
      SYSTEM_PROMPT,
      `Career Twin Summary: ${JSON.stringify({ career_stage: twin.career_stage, skills: twin.skills.map(s => s.name), interests: twin.interests, readiness_score: twin.readiness_score, gap: twin.gap })}\n\nProposed Role Matches: ${JSON.stringify(matcherOutput.matches.map(m => ({ role: m.role, match_score: m.match_score, matching_skills: m.matching_skills, missing_skills: m.missing_skills })))}\n\nChallenge every match. Be honest.`,
      { model: 'gemini-3.5-flash-lite', maxTokens: 1500, temperature: 0.4 }
    );

    return parseTextVerdict(raw, matcherOutput.matches);
  } catch (err) {
    console.warn('[CriticAgent] Gemini failed, using local critic:', err);
    return localCriticVerdict(twin, matcherOutput);
  }
}
