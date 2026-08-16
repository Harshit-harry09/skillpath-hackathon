/**
 * ATLAS AGENT 4 — Career Twin Builder Agent
 *
 * Brain: Gemini synthesizes parsed resume + confirmed doubts +
 * skill graph into a rich Career Digital Twin — the central shared
 * profile used by all downstream agents.
 *
 * The Career Digital Twin is the "source of truth" identity card
 * for this user session. Every agent reads from it.
 */

import { callGeminiJSON } from '@/lib/gemini';
import type { AtlasCareerTwin, AtlasSkill } from '@/types/atlas';
import type { ParsedResume } from './agent1-resume-parser';
import type { SkillGraphOutput } from './agent3-skill-graph';

export interface CareerTwinOutput extends AtlasCareerTwin {
  // Extended fields
  goalDecoded: {
    primaryTarget: string;        // e.g. "Remote Cybersecurity Analyst"
    secondaryTargets: string[];   // e.g. ["IT Support", "SOC Analyst"]
    workMode: 'remote' | 'hybrid' | 'onsite' | 'flexible';
    urgency: 'immediate' | 'short_term' | 'long_term';
    learningCommitment: 'low' | 'medium' | 'high'; // based on goal language
  };
  personalitySignals: {
    isRisilingFomDisplacement: boolean;
    isCareerPivot: boolean;
    isReturner: boolean;
    needsFirstGenSupport: boolean;
    needsAccessibilitySupport: boolean;
    hasTier2Constraint: boolean;
  };
  inferenceSummary: string; // Gemini's concise summary of who this person is
}

const SYSTEM_PROMPT = `You are the Atlas Career Twin Builder — a deeply empathetic AI career architect.

Your job is to synthesize all available data about a candidate and construct their Career Digital Twin:
a rich, comprehensive profile that will guide all downstream career matching agents.

Build the twin with:
1. A precise goal decoding: what does the user ACTUALLY want vs. what they said?
2. Career stage classification (first_generation_job_seeker | career_gap_returner | displaced_worker | tier2_3_candidate | pwd_candidate | general_switcher).
3. Synthesized skill set with scores.
4. Confirmed gap handling — translate it into strengths, never weaknesses.
5. Preferences derived from confirmed answers and goal text.
6. Inclusion flags that will activate protective policies in downstream agents.
7. Accessibility needs detection.
8. An honest readiness score (0-100) — be accurate, not optimistic.
9. Personality signals about the candidate's situation.
10. A 2-sentence "inferenceSummary" that captures who this person is in professional terms.

CRITICAL: The Career Digital Twin is used by 9 other agents. Be accurate and complete.

Return ONLY valid JSON. No explanation.`;

function buildLocalTwin(
  parsed: ParsedResume,
  skillGraph: SkillGraphOutput,
  userGoal: string,
  confirmedAnswers: Record<string, string>
): CareerTwinOutput {
  const goalLower = userGoal.toLowerCase();
  const gapReason = confirmedAnswers['gap_reason'] || (parsed.hasCaregivingSignal ? 'Family caregiving' : 'Personal reason');
  const workPref = confirmedAnswers['work_preference'] || (parsed.locationTier !== 'metro' ? 'Fully Remote (Work from home)' : 'Hybrid');
  const isRemote = workPref.toLowerCase().includes('remote');

  let stage: AtlasCareerTwin['career_stage'] = 'first_generation_job_seeker';
  if (parsed.hasCaregivingSignal || gapReason.includes('caregiv')) stage = 'career_gap_returner';
  else if (parsed.hasDisplacedWorkerSignal) stage = 'displaced_worker';
  else if (parsed.hasPwdSignal) stage = 'pwd_candidate';
  else if (parsed.locationTier === 'tier2' || parsed.locationTier === 'tier3' || parsed.locationTier === 'rural') stage = 'tier2_3_candidate';

  const inclusionFlags: string[] = [];
  if (parsed.hasCareerGap) inclusionFlags.push('career_break_returner');
  if (parsed.locationTier !== 'metro') inclusionFlags.push('tier2_3_talent');
  if (parsed.hasFirstGenSignal || parsed.education.length === 0) inclusionFlags.push('first_gen_candidate');
  if (isRemote) inclusionFlags.push('remote_first');
  if (parsed.hasDisplacedWorkerSignal) inclusionFlags.push('displaced_worker');
  if (parsed.hasWomenReturnerSignal) inclusionFlags.push('women_returner');

  const interests: string[] = [];
  if (goalLower.includes('cyber') || goalLower.includes('hacker') || goalLower.includes('security')) interests.push('Cybersecurity', 'IT Security', 'Ethical Hacking');
  if (goalLower.includes('remote') || goalLower.includes('wfh')) interests.push('Remote Work');
  if (goalLower.includes('data') || goalLower.includes('analyst')) interests.push('Data Analytics', 'Business Intelligence');
  if (goalLower.includes('web') || goalLower.includes('developer')) interests.push('Web Development');
  if (interests.length === 0) interests.push('IT Support', 'Tech Operations', 'Digital Skills');

  const mappedSkills = skillGraph.allSkills.slice(0, 20).map(s => ({
    name: s.name,
    score: s.score,
    category: s.category,
    informalSource: s.informalSource,
  }));

  const readiness = Math.min(88, Math.max(35,
    50 +
    (parsed.skills.length * 2) +
    (skillGraph.informalMappedSkills.length * 3) +
    (parsed.totalExperienceMonths > 0 ? 8 : 0) +
    (parsed.certifications.length * 4) -
    (skillGraph.missingFoundationalSkills.length * 2)
  ));

  const isCyber = goalLower.includes('cyber') || goalLower.includes('hacker') || goalLower.includes('security');

  const rawSkills = Array.isArray(parsed.skills)
    ? parsed.skills.map(s => typeof s === 'string' ? s : String((s as any)?.name || (s as any)?.skill || s))
    : [];

  return {
      location: parsed.location,
      career_stage: stage,
      interests,
      skills: mappedSkills,
      gap: {
        duration_months: parsed.detectedGapMonths,
        reason: gapReason,
        confirmed: Object.keys(confirmedAnswers).length > 0,
        translated_skills: skillGraph.informalMappedSkills.map(s => s.name),
      },
      preferences: {
        remote: isRemote,
        flexible_hours: isRemote || parsed.locationTier !== 'metro',
        relocation_willingness: parsed.locationTier === 'metro',
        learning_hours_per_week: 12,
        target_salary_lpa: 6.0,
      },
      inclusion_flags: inclusionFlags,
      accessibility_needs: parsed.hasPwdSignal
        ? ['Screen reader compatible UI', 'Flexible physical requirements', 'Remote-friendly accommodation']
        : [],
      readiness_score: readiness,
      goalDecoded: {
        primaryTarget: isCyber ? 'IT Support & Security Trainee Path' : 'Data Operations & Analytics Path',
        secondaryTargets: isCyber
          ? ['SOC Analyst Trainee', 'IT Helpdesk Specialist']
          : ['Data Quality Associate', 'Business Analyst'],
        workMode: isRemote ? 'remote' : 'hybrid',
        urgency: 'short_term',
        learningCommitment: goalLower.includes('learn') || goalLower.includes('study') ? 'high' : 'medium',
      },
      personalitySignals: {
        isRisilingFomDisplacement: parsed.hasDisplacedWorkerSignal,
        isCareerPivot: isCyber && !rawSkills.some(s => s.toLowerCase().includes('cyber')),
        isReturner: parsed.hasCareerGap,
        needsFirstGenSupport: parsed.hasFirstGenSignal || parsed.education.length === 0,
        needsAccessibilitySupport: parsed.hasPwdSignal,
        hasTier2Constraint: parsed.locationTier !== 'metro' && !isRemote,
      },
    inferenceSummary: `A ${stage.replace(/_/g, ' ')} with ${parsed.totalExperienceMonths > 0 ? `${Math.round(parsed.totalExperienceMonths / 12)} years of experience` : 'early-career profile'} and ${skillGraph.informalMappedSkills.length} translated informal strengths. ${parsed.hasCareerGap ? `Career gap of ${Math.round(parsed.detectedGapMonths / 12)} years (${gapReason}) converted into ${skillGraph.informalMappedSkills.length} professional competencies.` : ''}`,
  };
}

export async function runCareerTwinBuilderAgent(
  parsed: ParsedResume,
  skillGraph: SkillGraphOutput,
  userGoal: string,
  confirmedAnswers: Record<string, string>
): Promise<CareerTwinOutput> {
  try {
    const result = await callGeminiJSON<Partial<CareerTwinOutput>>(
      SYSTEM_PROMPT,
      `Parsed Resume: ${JSON.stringify({ skills: parsed.skills, inferredSkills: parsed.inferredSkills, location: parsed.location, locationTier: parsed.locationTier, totalExperienceMonths: parsed.totalExperienceMonths, hasCareerGap: parsed.hasCareerGap, detectedGapMonths: parsed.detectedGapMonths, hasCaregivingSignal: parsed.hasCaregivingSignal, hasDataEntrySignal: parsed.hasDataEntrySignal, hasDisplacedWorkerSignal: parsed.hasDisplacedWorkerSignal, hasPwdSignal: parsed.hasPwdSignal, hasFirstGenSignal: parsed.hasFirstGenSignal, overallConfidence: parsed.overallConfidence })}\n\nSkill Graph Summary: ${JSON.stringify({ overallSkillStrength: skillGraph.overallSkillStrength, aiInsight: skillGraph.aiInsight, informalMappedCount: skillGraph.informalMappedSkills.length, technicalCount: skillGraph.technicalSkills.length, missingFoundational: skillGraph.missingFoundationalSkills })}\n\nUser Goal: "${userGoal}"\nConfirmed Answers: ${JSON.stringify(confirmedAnswers)}\n\nBuild the complete Career Digital Twin.`,
      { model: 'gemini-3.5-flash-lite', maxTokens: 2000, temperature: 0.15 }
    );

    if (result && result.career_stage && result.skills && Array.isArray(result.skills)) {
      // Valid AI result — merge with local defaults for any missing fields
      const localFallback = buildLocalTwin(parsed, skillGraph, userGoal, confirmedAnswers);
      return {
        ...localFallback,
        ...result,
        skills: (result.skills as AtlasSkill[]) || localFallback.skills,
        inclusion_flags: result.inclusion_flags || localFallback.inclusion_flags,
        gap: result.gap || localFallback.gap,
        preferences: result.preferences || localFallback.preferences,
        goalDecoded: result.goalDecoded || localFallback.goalDecoded,
        personalitySignals: result.personalitySignals || localFallback.personalitySignals,
        inferenceSummary: result.inferenceSummary || localFallback.inferenceSummary,
        accessibility_needs: result.accessibility_needs || localFallback.accessibility_needs,
      } as CareerTwinOutput;
    }

    return buildLocalTwin(parsed, skillGraph, userGoal, confirmedAnswers);
  } catch (err) {
    console.warn('[CareerTwinBuilderAgent] Gemini failed, using local builder:', err);
    return buildLocalTwin(parsed, skillGraph, userGoal, confirmedAnswers);
  }
}
