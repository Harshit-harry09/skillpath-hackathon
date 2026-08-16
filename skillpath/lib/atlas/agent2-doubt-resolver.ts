/**
 * ATLAS AGENT 2 — Doubt Resolver Agent (Gemini AI Engine)
 *
 * Dynamic AI-driven clarification engine.
 * Inspects parsed candidate resume signals, career breaks, and target goal
 * to dynamically generate targeted, empathetic intake questions via Gemini.
 */

import type { AtlasDoubtQuestion } from '@/types/atlas';
import type { ParsedResume } from './agent1-resume-parser';
import { callGeminiJSON } from '@/lib/gemini';
import { detectExperienceCategories } from './engines/gap-skill-translator';

export interface DoubtResolverOutput {
  needsConfirmation: boolean;
  uncertainFields: string[];
  questions: AtlasDoubtQuestion[];
  reasoning: string;
}

export async function runDoubtResolverAgent(
  parsed: ParsedResume,
  userGoal: string = '',
  subAgentDoubts: string[] = []
): Promise<DoubtResolverOutput> {
  const hasUserGoal = Boolean(userGoal && userGoal.trim() && userGoal.trim().length > 3);
  const promptGoalText = hasUserGoal ? userGoal.trim() : '[NOT SPECIFIED - INFER FROM RESUME]';
  const extractedSkillsList = parsed.skills.slice(0, 15).join(', ') || 'General Office / Technical Basics';

  const systemPrompt = `You are Atlas Agent 2: Elite Multi-Agent Doubt Resolver & Intake Calibrator for career transformation.
Your job is to analyze the candidate's exact resume text, extracted skills, work history, career breaks, and target goals, and surface 3 to 7 DEEP, SPECIFIC, NON-GENERIC clarification questions.

NEVER ask generic or hardcoded questions. Every single question MUST reference specific skills, tools, gap durations, or work history from the candidate's resume.

Categories to cover (generate 3 to 7 total questions):
1. 'goal': Specific target role intent & primary motivation for this shift.
2. 'informal_skills': Deep-dive into technical tool proficiency (e.g. "You listed ${extractedSkillsList.slice(0, 30)}... which framework/tool do you have hands-on project experience with?").
3. 'gap': Detailed verification of career break focus, translated informal skills, and available weekly study hours.
4. 'work_preference': Specific salary tier expectations ($50k-$75k vs $80k-$120k) and location/relocation willingness.
5. 'accessibility': Remote work flexibility, async communication preferences, or accommodation needs.

Rules:
- Generate 3 to 7 dynamic questions based on actual profile ambiguity.
- Every question MUST have 4 distinct, plausible multiple-choice options.
- Set 'detectedValue' to the most likely option based on candidate profile evidence.

Return JSON matching this EXACT structure:
{
  "needsConfirmation": true,
  "uncertainFields": ["target_role", "tool_proficiency", "gap_hours", "work_preference"],
  "reasoning": "Specific breakdown of why these questions were generated for this candidate.",
  "questions": [
    {
      "id": "unique_question_id",
      "category": "goal" | "gap" | "work_preference" | "informal_skills" | "accessibility",
      "question": "Tailored, specific question referencing candidate's exact tools/background...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "detectedValue": "Most likely option"
    }
  ]
}`;

  const userPrompt = `CANDIDATE PROFILE EVIDENCE:
Location: ${parsed.location || 'Unknown'} (${parsed.locationTier || 'tier2'})
Total Work Experience: ${parsed.totalExperienceMonths} months (${Math.round((parsed.totalExperienceMonths || 0) / 12 * 10) / 10} YOE)
Career Break Signal: ${parsed.hasCareerGap ? `Yes (${parsed.detectedGapMonths} months detected)` : 'None'}
Caregiving Signal: ${parsed.hasCaregivingSignal ? 'Yes' : 'No'}
Data Entry Signal: ${parsed.hasDataEntrySignal ? 'Yes' : 'No'}
Displaced Worker Signal: ${parsed.hasDisplacedWorkerSignal ? 'Yes' : 'No'}
Extracted Skills: ${extractedSkillsList}
Inferred Informal Skills: ${parsed.inferredSkills.join(', ') || 'None'}
Recent Work Roles: ${parsed.workExperience.slice(0, 3).map(w => `${w.role} at ${w.company}`).join(' | ') || 'Not specified'}

TARGET GOAL / AMBITION:
"${promptGoalText}"

SUB-AGENT PIPELINE DOUBTS:
${subAgentDoubts.length > 0 ? subAgentDoubts.join('\n') : 'Pipeline flagged zero high-risk blockers.'}

Generate 3 to 7 deep, resume-tailored intake questions now.`;

  try {
    const aiResponse = await callGeminiJSON<DoubtResolverOutput>(systemPrompt, userPrompt, {
      model: 'gemini-3.5-flash-lite',
      temperature: 0.3,
      agentGroup: 'ingestion',
    });

    if (aiResponse && Array.isArray(aiResponse.questions) && aiResponse.questions.length >= 2) {
      return {
        needsConfirmation: true,
        uncertainFields: aiResponse.uncertainFields || aiResponse.questions.map(q => q.id),
        questions: aiResponse.questions.slice(0, 7),
        reasoning: aiResponse.reasoning || 'Generated 3-7 dynamic AI intake questions tailored to candidate resume and target goal.',
      };
    }
  } catch (err) {
    console.warn('[Doubt Resolver Agent] Gemini AI generation warning, using dynamic fallback:', err);
  }

  // Dynamic Resume-Tailored Fallback
  const questions: AtlasDoubtQuestion[] = [];
  const topSkills = parsed.skills.slice(0, 3).join(', ') || 'software & operations';

  // Question 1: Target Role / Motivation
  if (!hasUserGoal) {
    const techLower = parsed.skills.map(s => s.toLowerCase());
    const isCoder = techLower.some(s => s.includes('react') || s.includes('python') || s.includes('javascript') || s.includes('code'));
    const options = isCoder
      ? ['Junior Full-Stack Web Developer', 'QA Automation & Testing Specialist', 'Frontend Engineer (React)', 'Cloud & DevOps Support Trainee']
      : ['IT & Tech Support Specialist', 'Data Analyst & Excel Operations Associate', 'Cybersecurity SOC Analyst Trainee', 'Customer Success & Operations Specialist'];

    questions.push({
      id: 'target_role_intent',
      category: 'goal',
      question: `Based on your experience with ${topSkills}, which target career path would you like Atlas to optimize for?`,
      options,
      detectedValue: options[0],
    });
  } else {
    questions.push({
      id: 'transition_focus',
      category: 'goal',
      question: `What is your primary strategic objective for targeting "${userGoal.slice(0, 35)}..."?`,
      options: [
        'Maximize immediate salary growth ($75k+ / ₹12+ LPA)',
        'Secure a 100% remote or flexible work setup',
        'Pivot quickly after job displacement or career pause',
        'Build a verified hands-on engineering portfolio',
      ],
      detectedValue: 'Maximize immediate salary growth ($75k+ / ₹12+ LPA)',
    });
  }

  // Question 2: Technical Tool Depth
  if (parsed.skills.length > 0) {
    const mainSkill = parsed.skills[0];
    questions.push({
      id: 'tool_proficiency',
      category: 'informal_skills',
      question: `You listed proficiency in ${mainSkill}. How would you describe your hands-on depth with ${mainSkill}?`,
      options: [
        `Production experience: Built and deployed systems using ${mainSkill}`,
        `Intermediate: Completed coursework & personal projects in ${mainSkill}`,
        `Foundational: Used ${mainSkill} for basic scripting or data entry`,
        `Aspirational: Currently learning ${mainSkill} as part of career transition`,
      ],
      detectedValue: `Intermediate: Completed coursework & personal projects in ${mainSkill}`,
    });
  }

  // Question 3: Career Break & Upskilling Commitment
  if (parsed.hasCareerGap || parsed.detectedGapMonths > 0) {
    const gapYears = Math.max(1, Math.round((parsed.detectedGapMonths || 24) / 12));
    questions.push({
      id: 'gap_learning_commitment',
      category: 'gap',
      question: `Atlas detected a ~${gapYears}-year career break. How many hours per week can you commit to intensive skill building?`,
      options: [
        '10 - 15 hours / week (Paced learning alongside responsibilities)',
        '15 - 25 hours / week (Dedicated part-time reskilling)',
        '30+ hours / week (Full-time intensive bootcamp pacing)',
        'Weekend study only (5 - 8 hours / week)',
      ],
      detectedValue: '15 - 25 hours / week (Dedicated part-time reskilling)',
    });
  } else {
    questions.push({
      id: 'learning_commitment',
      category: 'gap',
      question: 'How many hours per week can you dedicate to closing your technical skill gaps?',
      options: [
        '10 - 15 hours / week (Balanced pace alongside current job)',
        '15 - 25 hours / week (Accelerated 6-week path)',
        '30+ hours / week (Full-time reskilling bootcamp)',
        'Flexible weekend study (5 - 8 hours / week)',
      ],
      detectedValue: '15 - 25 hours / week (Accelerated 6-week path)',
    });
  }

  // Question 4: Work Setup & Relocation
  questions.push({
    id: 'work_preference',
    category: 'work_preference',
    question: `Your current location is ${parsed.location || 'Tier-2/3 City'}. What is your location & relocation preference?`,
    options: [
      'Strictly Fully Remote (Work from Home)',
      'Hybrid (2-3 days in office, local city)',
      'Open to relocation for high-tier tech companies',
      'Flexible setup based on compensation package',
    ],
    detectedValue: parsed.locationTier === 'tier2' || parsed.locationTier === 'tier3'
      ? 'Strictly Fully Remote (Work from Home)'
      : 'Hybrid (2-3 days in office, local city)',
  });

  return {
    needsConfirmation: true,
    uncertainFields: questions.map(q => q.id),
    questions,
    reasoning: 'Generated 4 resume-tailored intake questions across technical depth, goal intent, and learning commitment.',
  };
}
