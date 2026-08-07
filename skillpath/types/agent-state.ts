// updated
/**
 * AMAS v2 — Agent State Bus & Trace Types
 *
 * AgentState is the shared memory passed between all agents.
 * AgentTraceEvent logs every autonomous decision for the live trace panel.
 * SessionMemory enables cross-visit continuity.
 */

import type { ConfidenceLevel } from './analysis';

// ── Agent Trace ──────────────────────────────────────────────────────────────

export type AgentActor = 'orchestrator' | 'agent1' | 'agent2' | 'agent3' | 'agent4';

export interface AgentTraceEvent {
  timestamp: number;
  actor: AgentActor;
  message: string;
  durationMs?: number;
}

// ── Career Path (Dijkstra output) ────────────────────────────────────────────

export interface RoleNode {
  slug: string;
  label: string;
  baseSalary: number;
}

export interface RoleEdge {
  targetSlug: string;
  label: string;
  avgSalary: number;
  transitionDifficulty: number; // 1-5, used as Dijkstra edge weight
}

export interface RoleGraphNode extends RoleNode {
  adjacentRoles: RoleEdge[];
}

export type RoleAdjacencyGraph = Record<string, RoleGraphNode>;

// ── Skill Decay (upgraded with dated evidence) ──────────────────────────────

export interface DecayedSkill {
  skill: string;
  replacement: string;
  reason: string;
  evidenceStat: string;  // "jQuery mentions down 89% from 2018 peak"
  asOf: string;           // "2026-Q2"
}

// ── Evidence Quotes ──────────────────────────────────────────────────────────

export interface EvidenceQuote {
  requirement: string;
  resumeQuote: string;
  matchType: 'exact' | 'partial' | 'missing';
}

// ── MVC Dealbreaker ──────────────────────────────────────────────────────────

export interface MVCDealbreaker {
  skill: string;
  frequency: number;
  weight: number;
}

// ── Agent State Bus ──────────────────────────────────────────────────────────

export interface AgentState {
  // Input
  rawResumeText: string;
  rawJdText: string;
  targetRoleSlug: string;
  region: 'global' | 'india';

  // Agent 1 — Market Intelligence
  mvcDealbreakers: MVCDealbreaker[];
  marketCategory: string;

  // Agent 2 — Resume Audit
  resumeSkills: string[];
  jdSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  decayedSkills: DecayedSkill[];
  evidenceQuotes: EvidenceQuote[];
  agent2ToolCallOrder: string[]; // which tools the LLM chose — proof of autonomy

  // Agent 3 — Roadmap
  gapScore: number;
  weeksToReady: number;
  readyByDate: string;
  confidenceAdjustments: Record<string, ConfidenceLevel>;
  trajectory: {
    currentSalary: number;
    targetSalary: number;
    percentJump: number;
    nextRole: string;
  };
  careerPath: RoleNode[]; // Dijkstra-derived multi-hop path

  // Agent 4 — Outreach
  starBullets: string[];
  recruiterColdEmail: string;
  linkedinHeadline: string;
  critiqueScore: number;
  critiqueIterations: number;

  // Orchestrator-level
  trace: AgentTraceEvent[];
  sessionDelta?: SessionDelta;
  orchestratorMode: 'aggressive' | 'standard';
  agent4Skipped: boolean;
  degraded: boolean; // true if LLM calls failed and we fell back to local-only
}

// ── Session Memory (persisted across visits) ─────────────────────────────────

export interface SessionMemory {
  userId: string;
  lastRunTimestamp: number;
  lastMissingSkills: string[];
  lastGapScore: number;
  lastTargetRole: string;
}

export interface SessionDelta {
  skillsClosedSinceLastRun: string[];
  gapScoreChange: number;
  message: string; // "You've closed 2 of 5 gaps since your last check-in"
}

// ── Helper: create empty state ───────────────────────────────────────────────

export function createEmptyAgentState(
  rawResumeText: string,
  rawJdText: string,
  region: 'global' | 'india' = 'global'
): AgentState {
  return {
    rawResumeText,
    rawJdText,
    targetRoleSlug: '',
    region,
    mvcDealbreakers: [],
    marketCategory: '',
    resumeSkills: [],
    jdSkills: [],
    matchedSkills: [],
    missingSkills: [],
    decayedSkills: [],
    evidenceQuotes: [],
    agent2ToolCallOrder: [],
    gapScore: 0,
    weeksToReady: 0,
    readyByDate: '',
    confidenceAdjustments: {},
    trajectory: { currentSalary: 0, targetSalary: 0, percentJump: 0, nextRole: '' },
    careerPath: [],
    starBullets: [],
    recruiterColdEmail: '',
    linkedinHeadline: '',
    critiqueScore: 0,
    critiqueIterations: 0,
    trace: [],
    orchestratorMode: 'standard',
    agent4Skipped: false,
    degraded: false,
  };
}
