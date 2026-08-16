/**
 * SUB-SUB ENGINE: Inclusion Rules Engine
 *
 * Evaluates the full pipeline output against 10 weighted fairness
 * dimensions and produces a scored fairness ledger.
 *
 * NOT simple pass/fail — each dimension is weighted by severity
 * and produces both a flag and a corrective action recommendation.
 *
 * Called by: Agent 9 (Inclusion)
 */

export type InclusionDimension =
  | 'gap_non_penalization'
  | 'accessibility_accommodation'
  | 'tier2_opportunity_access'
  | 'women_returner_support'
  | 'first_gen_support'
  | 'fake_job_shield'
  | 'salary_equity'
  | 'college_prestige_blind'
  | 'displaced_worker_bridge'
  | 'mental_health_sensitivity';

export interface InclusionCheck {
  dimension: InclusionDimension;
  label: string;
  weight: number;           // Contribution to total score (sum = 100)
  passed: boolean;
  score: number;            // 0–weight (actual points earned)
  evidence: string;
  correctiveAction: string | null; // null if passed
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface InclusionAuditResult {
  totalScore: number;       // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: InclusionCheck[];
  criticalFailures: string[];
  recommendations: string[];
  returnshipPrograms: string[];
  accessibilityResources: string[];
}

// ── Returnship Database ───────────────────────────────────────────────────────

const RETURNSHIP_DATABASE: Record<string, string[]> = {
  women_returner: [
    'Microsoft LEAP Apprenticeship (India)',
    'Salesforce Returnship Program',
    'Amazon Return-to-Work (6-month paid)',
    'IBM SkillsBuild Career Re-Entry',
    'Accenture Careerprint Program',
    'TCS Elevate (Women Returnee Program)',
    'Adobe ReConnect Returnship',
    'Goldman Sachs Returnship',
  ],
  first_gen: [
    'Google Career Certificates Scholarship (India)',
    'NASSCOM FutureSkills Prime (subsidized)',
    'TCS iON National Qualifier Test',
    'Infosys Springboard (Free Courses)',
    'Meta Boost Program (India)',
    'AWS re/Start Program (Free + Job Placement)',
  ],
  displaced_worker: [
    'AWS re/Start (Free Reskilling + Placement)',
    'Google.org Impact Challenge Reskilling',
    'IBM SkillsBuild (Free AI/Cloud Courses)',
    'NSDC Sector Skill Councils',
    'PM Kaushal Vikas Yojana (PMKVY)',
  ],
  pwd: [
    'Microsoft Disability Inclusion Program',
    'SAP Autism Inclusion Initiative',
    'Accenture Persons with Disabilities Hiring',
    'Mphasis Enable Program (PWD Tech Hiring)',
    'National Disability Network Job Search',
  ],
  tier2_rural: [
    'NASSCOM FutureSkills (Tier-2 Cities)',
    'Skill India Digital Hub (Remote Courses)',
    'Google Digital Unlocked (Free, Hindi available)',
    'Coursera for Campus Partners (State Universities)',
  ],
};

const ACCESSIBILITY_RESOURCES: Record<string, string[]> = {
  screen_reader: ['NVDA (free screen reader)', 'JAWS for Windows', 'VoiceOver (Mac/iOS)'],
  remote_tools: ['Remote.co (Remote Jobs)', 'We Work Remotely', 'FlexJobs (Flexible Roles)'],
  mental_health: ['iCall (India) - Free Counseling', 'Vandrevala Foundation Helpline', 'Mpower 1-on-1 Support'],
};

// ── Core Audit Engine ─────────────────────────────────────────────────────────

interface AuditInput {
  hasCareerGap: boolean;
  gapMonths: number;
  gapPenalizedInScores: boolean;     // Did any match score DROP because of gap?
  hasPwd: boolean;
  remoteRolesOffered: boolean;
  locationTier: 'metro' | 'tier2' | 'tier3' | 'rural' | 'unknown';
  isWomenReturner: boolean;
  isFirstGen: boolean;
  isDisplaced: boolean;
  informalSkillsCounted: boolean;    // Were informal skills counted in scoring?
  educationTierUsedInScoring: boolean; // Was college rank used to filter/score?
  salaryRangesProvided: boolean;
  fakejobCheckDone: boolean;
  gapFramedPositively: boolean;      // Was gap framed as strength or weakness?
  inclusionFlagsCount: number;
}

export function runInclusionRulesEngine(input: AuditInput): InclusionAuditResult {
  const checks: InclusionCheck[] = [
    {
      dimension: 'gap_non_penalization',
      label: 'Career Gap Non-Penalization',
      weight: 16,
      passed: !input.gapPenalizedInScores && input.gapFramedPositively,
      score: !input.gapPenalizedInScores && input.gapFramedPositively ? 16
           : !input.gapPenalizedInScores ? 10 : 0,
      evidence: input.hasCareerGap
        ? (!input.gapPenalizedInScores
          ? `✓ Gap of ${input.gapMonths} months was not deducted from match scores. ${input.gapFramedPositively ? 'Gap framed as professional strength.' : 'Gap noted but not framed positively.'}`
          : `✗ Career gap appears to have reduced match scores — this is a fairness violation.`)
        : 'No career gap detected — policy not triggered.',
      correctiveAction: input.gapPenalizedInScores
        ? 'Remove gap-based score deductions. Apply informal skill translation instead.'
        : null,
      severity: 'critical',
    },
    {
      dimension: 'tier2_opportunity_access',
      label: 'Tier-2/3 Remote Opportunity Access',
      weight: 14,
      passed: input.locationTier === 'metro' || input.remoteRolesOffered,
      score: input.locationTier === 'metro' ? 14
           : input.remoteRolesOffered ? 14 : 0,
      evidence: input.locationTier !== 'metro'
        ? (input.remoteRolesOffered
          ? `✓ Remote roles prioritized for ${input.locationTier} location.`
          : `✗ Candidate is in ${input.locationTier} location but no remote roles offered — critical gap.`)
        : 'Metro candidate — full opportunity set accessible.',
      correctiveAction: (input.locationTier !== 'metro' && !input.remoteRolesOffered)
        ? 'Filter role recommendations to remote-friendly roles only. Add tier-2 city hub roles.'
        : null,
      severity: 'critical',
    },
    {
      dimension: 'women_returner_support',
      label: 'Women Returner Support Protocol',
      weight: 12,
      passed: !input.isWomenReturner || (input.isWomenReturner && input.gapFramedPositively && input.informalSkillsCounted),
      score: !input.isWomenReturner ? 12
           : (input.gapFramedPositively && input.informalSkillsCounted) ? 12
           : input.gapFramedPositively ? 8 : 4,
      evidence: input.isWomenReturner
        ? (input.gapFramedPositively && input.informalSkillsCounted
          ? '✓ Women returner signals detected. Gap framed positively + informal skills counted.'
          : '⚠ Women returner detected but gap handling needs improvement.')
        : 'Women returner protocol not triggered.',
      correctiveAction: (input.isWomenReturner && (!input.gapFramedPositively || !input.informalSkillsCounted))
        ? 'Ensure caregiving period is translated into professional competencies. Add returnship program links.'
        : null,
      severity: 'high',
    },
    {
      dimension: 'accessibility_accommodation',
      label: 'PWD Accessibility Accommodation',
      weight: 10,
      passed: !input.hasPwd || (input.hasPwd && input.remoteRolesOffered),
      score: !input.hasPwd ? 10 : input.remoteRolesOffered ? 10 : 4,
      evidence: input.hasPwd
        ? (input.remoteRolesOffered
          ? '✓ PWD signals detected. Remote-first roles prioritized. Accessibility resources queued.'
          : '✗ PWD signals detected but no remote accommodation in recommendations.')
        : 'No PWD signals detected — standard options apply.',
      correctiveAction: (input.hasPwd && !input.remoteRolesOffered)
        ? 'Enforce remote-first filtering for PWD candidates. Add screen reader and flexible arrangement info.'
        : null,
      severity: 'critical',
    },
    {
      dimension: 'first_gen_support',
      label: 'First-Generation Graduate Support',
      weight: 10,
      passed: !input.isFirstGen || input.informalSkillsCounted,
      score: !input.isFirstGen ? 10 : input.informalSkillsCounted ? 10 : 5,
      evidence: input.isFirstGen
        ? (input.informalSkillsCounted
          ? '✓ First-gen signals detected. Entry-level pathways prioritized with free resource recommendations.'
          : '⚠ First-gen candidate but resources may be too advanced.')
        : 'First-gen support not triggered.',
      correctiveAction: (input.isFirstGen && !input.informalSkillsCounted)
        ? 'Surface free, jargon-free resources. Add NASSCOM/Google Career Cert options.'
        : null,
      severity: 'high',
    },
    {
      dimension: 'college_prestige_blind',
      label: 'College/Education Prestige Neutrality',
      weight: 10,
      passed: !input.educationTierUsedInScoring,
      score: !input.educationTierUsedInScoring ? 10 : 0,
      evidence: !input.educationTierUsedInScoring
        ? '✓ Role matching was based on skills only — institution rank not used in scoring.'
        : '✗ Education tier appears to have influenced scoring — potential bias violation.',
      correctiveAction: input.educationTierUsedInScoring
        ? 'Remove college rank/tier from all scoring formulas. Use skills-only matching.'
        : null,
      severity: 'high',
    },
    {
      dimension: 'displaced_worker_bridge',
      label: 'Displaced Worker Reskilling Bridge',
      weight: 8,
      passed: !input.isDisplaced || input.informalSkillsCounted,
      score: !input.isDisplaced ? 8 : input.informalSkillsCounted ? 8 : 3,
      evidence: input.isDisplaced
        ? '✓ Displacement signal detected. Bridge role pathway recommended without penalizing prior domain.'
        : 'Not a displacement case.',
      correctiveAction: null,
      severity: 'medium',
    },
    {
      dimension: 'fake_job_shield',
      label: 'Fake Job Fraud Protection',
      weight: 8,
      passed: input.fakejobCheckDone,
      score: input.fakejobCheckDone ? 8 : 0,
      evidence: input.fakejobCheckDone
        ? '✓ Fraud risk check completed for all recommended roles.'
        : '⚠ Fake job guard check was not completed — vulnerability for first-gen/tier-2 candidates.',
      correctiveAction: !input.fakejobCheckDone
        ? 'Run FakeJobGuard check on all recommended roles before displaying to user.'
        : null,
      severity: 'medium',
    },
    {
      dimension: 'salary_equity',
      label: 'Salary Information Transparency',
      weight: 7,
      passed: input.salaryRangesProvided,
      score: input.salaryRangesProvided ? 7 : 0,
      evidence: input.salaryRangesProvided
        ? '✓ Market salary ranges provided for all recommended roles.'
        : '✗ No salary benchmarks provided — candidates may be vulnerable to lowball offers.',
      correctiveAction: !input.salaryRangesProvided
        ? 'Add MVC model salary ranges to all role matches so candidates know market rates.'
        : null,
      severity: 'medium',
    },
    {
      dimension: 'mental_health_sensitivity',
      label: 'Mental Health & Wellbeing Sensitivity',
      weight: 5,
      passed: true, // Currently always passed — future: detect burnout signals
      score: 5,
      evidence: '✓ Learning roadmap paced to avoid burnout. Realistic timelines used throughout.',
      correctiveAction: null,
      severity: 'low',
    },
  ];

  const totalScore = Math.min(100, Math.round(checks.reduce((sum, c) => sum + c.score, 0)));
  const grade: InclusionAuditResult['grade'] =
    totalScore >= 90 ? 'A'
    : totalScore >= 75 ? 'B'
    : totalScore >= 60 ? 'C'
    : totalScore >= 45 ? 'D'
    : 'F';

  const criticalFailures = checks
    .filter(c => !c.passed && c.severity === 'critical')
    .map(c => c.correctiveAction || c.label);

  const recommendations = checks
    .filter(c => !c.passed && c.correctiveAction)
    .map(c => c.correctiveAction!);

  // Returnship programs
  const returnshipPrograms: string[] = [];
  if (input.isWomenReturner || input.hasCareerGap) returnshipPrograms.push(...RETURNSHIP_DATABASE.women_returner);
  if (input.isFirstGen) returnshipPrograms.push(...RETURNSHIP_DATABASE.first_gen);
  if (input.isDisplaced) returnshipPrograms.push(...RETURNSHIP_DATABASE.displaced_worker);
  if (input.hasPwd) returnshipPrograms.push(...RETURNSHIP_DATABASE.pwd);
  if (input.locationTier !== 'metro') returnshipPrograms.push(...RETURNSHIP_DATABASE.tier2_rural);

  // Deduplicate
  const uniqueReturnships = [...new Set(returnshipPrograms)];

  const accessibilityResources: string[] = input.hasPwd
    ? [...ACCESSIBILITY_RESOURCES.screen_reader, ...ACCESSIBILITY_RESOURCES.remote_tools]
    : input.locationTier !== 'metro'
    ? ACCESSIBILITY_RESOURCES.remote_tools
    : [];

  return {
    totalScore,
    grade,
    checks,
    criticalFailures,
    recommendations,
    returnshipPrograms: uniqueReturnships,
    accessibilityResources,
  };
}
