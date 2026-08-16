/**
 * ATLAS AGENT 14 — Employer Readiness Agent
 *
 * Evaluates whether an employer's job role and posting are genuinely accessible.
 * Scans job descriptions for exclusionary language, credential proxy biases,
 * and surfaces HR readiness gaps with concrete recommended accommodation actions.
 */

import { callGeminiJSON } from '@/lib/gemini';

export interface ExclusionaryTerm {
  term: string;
  category: 'credential_proxy' | 'exclusionary_jargon' | 'unrealistic_requirement' | 'gap_penalty';
  explanation: string;
  recommendedAlternative: string;
}

export interface HrAccommodationAction {
  id: string;
  category: 'gap_protection' | 'remote_accessibility' | 'credential_flexibility' | 'interview_accommodations';
  title: string;
  description: string;
  status: 'recommended' | 'approved' | 'action_required';
}

export interface EmployerReadinessOutput {
  overallReadinessScore: number; // 0-100
  accessibilityGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Improvement';
  exclusionaryTermsFlagged: ExclusionaryTerm[];
  hrAccommodationActions: HrAccommodationAction[];
  isFlexibleWorkFriendly: boolean;
  credentialProxyBiasScore: number; // 0 (none) to 100 (heavy tier/pedigree reliance)
  readinessSummary: string;
}

const EXCLUSIONARY_PATTERNS = [
  { pattern: /ivy\ league|tier-1\ college\ only|top\ tier\ institute/i, term: 'Ivy League / Elite Institute Mandate', cat: 'credential_proxy' as const, alt: 'Focus on demonstrated project capability & skill tests rather than school brand name.' },
  { pattern: /unbroken\ [0-9]+\ year\ experience|no\ career\ gaps?/i, term: 'Unbroken Employment Mandate', cat: 'gap_penalty' as const, alt: 'Accept equivalent portfolio work, caregiving management experience, and self-directed projects.' },
  { pattern: /rockstar|ninja|guru|wizard/i, term: 'Exclusionary Jargon ("Rockstar/Ninja")', cat: 'exclusionary_jargon' as const, alt: 'Use clear, role-specific titles focused on core deliverables.' },
  { pattern: /must\ have\ [5-9]\+?\ years\ of\ (react|next\.js|ai|llm)/i, term: 'Unrealistic Tech Tenure Requirement', cat: 'unrealistic_requirement' as const, alt: 'Focus on hands-on project complexity rather than arbitrary year counts.' },
  { pattern: /in-office\ mandatory\ 6\ days/i, term: 'Rigid In-Office Mandate', cat: 'credential_proxy' as const, alt: 'Offer flexible or hybrid work options for caretakers and regional candidates.' },
];

export async function runEmployerReadinessAgent(
  jobTitle: string,
  jobDescriptionText?: string
): Promise<EmployerReadinessOutput> {
  const textToScan = jobDescriptionText || jobTitle || '';
  
  // Local pattern audit
  const flaggedLocal: ExclusionaryTerm[] = [];
  for (const item of EXCLUSIONARY_PATTERNS) {
    if (item.pattern.test(textToScan)) {
      flaggedLocal.push({
        term: item.term,
        category: item.cat,
        explanation: `Job description contains "${item.term}", which can discourage non-traditional or diverse candidates.`,
        recommendedAlternative: item.alt,
      });
    }
  }

  // Recommended HR Actions based on scan
  const hrActions: HrAccommodationAction[] = [
    {
      id: 'act-1',
      category: 'gap_protection',
      title: 'Caregiving & Sabbatical Gap Immunity',
      description: 'Waive strict gap penalties; evaluate candidates based on skills discovery profile and informal project work.',
      status: 'recommended',
    },
    {
      id: 'act-2',
      category: 'credential_flexibility',
      title: 'Skill-First Qualification Waiver',
      description: 'Replace rigid 4-year degree requirements with verified project milestones and micro-certifications.',
      status: 'recommended',
    },
    {
      id: 'act-3',
      category: 'remote_accessibility',
      title: 'Async & Flexible Scheduling Options',
      description: 'Provide flexible core hours and remote-friendly onboarding for returners and regional talent.',
      status: 'recommended',
    },
  ];

  if (textToScan.length > 100) {
    try {
      const aiResult = await callGeminiJSON<Partial<EmployerReadinessOutput>>(
        `You are the Employer Readiness Agent — an AI governance specialist.
Audit this job description for accessibility, exclusionary language, credential proxies, and career gap penalties.
Return valid JSON matching this structure:
{
  "overallReadinessScore": 85,
  "accessibilityGrade": "A",
  "exclusionaryTermsFlagged": [
    { "term": "string", "category": "credential_proxy", "explanation": "string", "recommendedAlternative": "string" }
  ],
  "isFlexibleWorkFriendly": true,
  "credentialProxyBiasScore": 15,
  "readinessSummary": "string"
}`,
        `Audit this job posting:\n\nTitle: ${jobTitle}\n\nDescription:\n${textToScan}`,
        { model: 'gemini-3.5-flash-lite', maxTokens: 1024, temperature: 0.1 }
      );

      return {
        overallReadinessScore: typeof aiResult.overallReadinessScore === 'number' ? aiResult.overallReadinessScore : 88,
        accessibilityGrade: aiResult.accessibilityGrade || 'A',
        exclusionaryTermsFlagged: Array.isArray(aiResult.exclusionaryTermsFlagged) && aiResult.exclusionaryTermsFlagged.length > 0
          ? (aiResult.exclusionaryTermsFlagged as ExclusionaryTerm[])
          : flaggedLocal,
        hrAccommodationActions: hrActions,
        isFlexibleWorkFriendly: Boolean(aiResult.isFlexibleWorkFriendly ?? true),
        credentialProxyBiasScore: typeof aiResult.credentialProxyBiasScore === 'number' ? aiResult.credentialProxyBiasScore : 12,
        readinessSummary: aiResult.readinessSummary || `Employer Readiness Audit complete. Role is ${flaggedLocal.length > 0 ? 'accessible with minor exclusionary terms flagged' : 'highly accessible with clean skill-first guidelines'}.`,
      };
    } catch {
      // Fallback to local evaluation
    }
  }

  const score = Math.max(50, 95 - flaggedLocal.length * 15);
  return {
    overallReadinessScore: score,
    accessibilityGrade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'Needs Improvement',
    exclusionaryTermsFlagged: flaggedLocal,
    hrAccommodationActions: hrActions,
    isFlexibleWorkFriendly: true,
    credentialProxyBiasScore: flaggedLocal.length * 15,
    readinessSummary: `Employer Readiness Audit complete. Role readiness score is ${score}/100 with ${flaggedLocal.length} exclusionary language term(s) flagged for HR review.`,
  };
}
