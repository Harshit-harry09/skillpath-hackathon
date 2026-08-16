import type { AnalysisResult } from '@/types/analysis';
import type { AtlasSessionState } from './orchestrator';
import type { AtlasSoftSignals } from './soft-parse';

export interface AtlasStateInput {
  hardFacts: AnalysisResult;
  softSignals: AtlasSoftSignals;
  userGoal: string;
  confirmedAnswers?: Record<string, string>;
  mode: 'direct' | 'funnel';
}

export interface AtlasStateSource {
  mode: 'direct' | 'funnel';
  analysisId?: string;
  atsScore?: number;
  missingSkills?: string[];
  matchedSkills?: string[];
  seniority?: string;
  gaps?: NonNullable<AnalysisResult['experience_analysis']>['employment_gaps'];
}

function analysisMissingSkills(facts: AnalysisResult): string[] {
  return facts.missing_skills || (facts.skill_gaps || []).map((gap) => gap.skill);
}

export function buildAtlasState(input: AtlasStateInput): AtlasSessionState {
  const source: AtlasStateSource = {
    mode: input.mode,
    analysisId: input.hardFacts.share_token,
    atsScore: input.hardFacts.composite_ats_score?.overall_score,
    missingSkills: analysisMissingSkills(input.hardFacts),
    matchedSkills: input.hardFacts.matched_skills || [],
    seniority: input.hardFacts.experience_analysis?.seniority_level,
    gaps: input.hardFacts.experience_analysis?.employment_gaps,
  };

  return {
    sessionId: `atlas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: 'guest_user',
    phase: 'idle',
    status: 'initialized',
    schema_version: 2,
    agentTraces: [],
    resumeText: input.hardFacts.parsed_text,
    userGoal: input.userGoal,
    confirmedAnswers: input.confirmedAnswers || {},
    source,
    softSignals: input.softSignals,
  };
}
