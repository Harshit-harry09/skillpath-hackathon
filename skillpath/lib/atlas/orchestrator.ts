/**
 * ATLAS OS SESSION TYPES & ORCHESTRATOR INTERFACES
 */

import type { AtlasAgentTrace } from '@/types/atlas';
import type { ParsedResume } from './agent1-resume-parser';
import type { DoubtResolverOutput } from './agent2-doubt-resolver';
import type { SkillGraphOutput } from './agent3-skill-graph';
import type { CareerTwinOutput } from './agent4-career-twin';
import type { CriticVerdict } from './agent6-critic';
import type { PathfinderOutput } from './agent7-pathfinder';
import type { LearningRoadmapOutput } from './agent8-learning-roadmap';
import type { InclusionAuditOutput } from './agent9-inclusion';
import type { AtlasNarratorOutput } from './agent13-narrator';
import type { EmployerReadinessOutput } from './agent14-employer-readiness';
import type { AtlasSoftSignals } from './soft-parse';
import type { AtlasStateSource } from './atlas-state-builder';
import type { FastRoleMatch } from './engines/fast-matcher';

export interface MatcherOutput {
  matches: FastRoleMatch[];
  bestRole: string;
  bestRoleScore: number;
  totalOpportunityCount: number;
  marketContext: string;
  aiNarrative: string;
}

export interface AtlasSessionState {
  sessionId: string;
  userId: string;
  phase: 'idle' | 'parsing' | 'clarifying' | 'analyzing' | 'matching' | 'planning' | 'complete' | 'error';
  agentTraces: AtlasAgentTrace[];
  resumeText?: string;
  userGoal?: string;
  confirmedAnswers: Record<string, string>;
  schema_version?: number;
  status?: 'initialized' | 'running' | 'complete' | 'error';
  source?: AtlasStateSource;
  softSignals?: AtlasSoftSignals;

  // Agent Outputs
  parsedResume?: ParsedResume;
  doubtOutput?: DoubtResolverOutput;
  skillGraph?: SkillGraphOutput;
  careerTwin?: CareerTwinOutput;
  matcherOutput?: MatcherOutput;
  debateSynthesizedOutput?: any;
  criticVerdict?: CriticVerdict;
  pathfinderOutput?: PathfinderOutput;
  roadmapOutput?: LearningRoadmapOutput;
  inclusionOutput?: InclusionAuditOutput;
  simulatorOutput?: any;
  fakeJobGuardOutput?: any;
  employerReadinessOutput?: EmployerReadinessOutput;
  narratorOutput?: AtlasNarratorOutput;
  crystalBallNarrative?: any;

  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface OrchestratorInput {
  resumeText: string;
  userGoal: string;
  sessionId?: string;
  userId?: string;
  pdfBuffer?: ArrayBuffer;
  analysisId?: string;
  hardFacts?: any;
}

export type OrchestratorPhaseCallback = (
  phase: AtlasSessionState['phase'],
  agentName: string,
  state: AtlasSessionState
) => void;

