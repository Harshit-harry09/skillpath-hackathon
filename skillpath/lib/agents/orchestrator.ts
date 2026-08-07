// updated
/**
 * Executive Orchestrator Agent (stateful)
 *
 * This is NOT a Promise.all() fan-out. It's a control loop that inspects
 * intermediate results and DECIDES the next step — this is what makes the
 * system agentic rather than a pipeline with good branding.
 *
 * Decision points:
 * 1. gapScore < 40 → aggressive timeline from Agent 3, SKIP Agent 4 (candidate not ready)
 * 2. gapScore >= 40 → standard timeline + invoke Agent 4 outreach
 * 3. LLM failure → graceful degradation to local-only results
 * 4. Returning user → compute session delta
 */

import type { AgentState, AgentTraceEvent } from '@/types/agent-state';
import { createEmptyAgentState } from '@/types/agent-state';
import { runAgent1 } from './agent1-market';
import { runAgent2Local, runAgent2WithReasoning } from './agent2-resume';
import { runAgent3 } from './agent3-roadmap';
import { runAgent4 } from './agent4-outreach';
import { getSessionMemory, saveSessionMemory, computeSessionDelta } from '@/lib/session-memory';
import { extractSkills, getRoleStandardSkills } from '@/lib/mvc-profiler';

// ── Trace emitter ────────────────────────────────────────────────────────────

function emitTrace(
  state: AgentState,
  actor: AgentTraceEvent['actor'],
  message: string,
  durationMs?: number
): void {
  state.trace.push({
    timestamp: Date.now(),
    actor,
    message,
    durationMs,
  });
}

// ── Safe wrapper for LLM-dependent phases ────────────────────────────────────

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  onTimeout: () => void
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => {
      setTimeout(() => {
        onTimeout();
        resolve(fallback);
      }, timeoutMs);
    }),
  ]);
}

// ── Main Orchestrator ────────────────────────────────────────────────────────

export async function orchestrate(
  rawResumeText: string,
  rawJdText: string,
  options: {
    userId?: string | null;
    region?: 'global' | 'india';
    /** Pre-cleaned skills (if AI cleaning already happened) */
    preCleanedResumeSkills?: string[];
    preCleanedJdSkills?: string[];
  } = {}
): Promise<AgentState> {
  const state = createEmptyAgentState(rawResumeText, rawJdText, options.region);
  const t0 = Date.now();

  emitTrace(state, 'orchestrator', '🚀 AMAS v2 orchestrator starting — local reflex layer first');

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1: LOCAL REFLEX LAYER (target < 150ms)
  // ══════════════════════════════════════════════════════════════════════════

  // Step 1a: Extract & clean skills (may involve fast AI cleaning)
  let resumeSkills: string[];
  let jdSkills: string[];

  if (options.preCleanedResumeSkills && options.preCleanedJdSkills) {
    resumeSkills = options.preCleanedResumeSkills;
    jdSkills = options.preCleanedJdSkills;
    emitTrace(state, 'orchestrator', 'Using pre-cleaned skills from input layer');
  } else {
    // Fast local extraction (<1ms) with calibrated role standard fallback
    const extractedJd = extractSkills(rawJdText);
    const modelJd = getRoleStandardSkills(rawJdText);
    jdSkills = extractedJd.length >= 5
      ? extractedJd
      : Array.from(new Set([...extractedJd, ...modelJd.slice(0, 15)]));

    const extractedResume = extractSkills(rawResumeText);
    resumeSkills = extractedResume.length > 0 ? extractedResume : modelJd.slice(0, 5);

    emitTrace(state, 'orchestrator', `Extraction complete: ${jdSkills.length} core JD skills, ${resumeSkills.length} resume skills`);
  }

  state.resumeSkills = resumeSkills;
  state.jdSkills = jdSkills;

  // Step 1b: Run Agent 1 (Market) + Agent 2 (Local Match) in parallel
  const agent2LocalResult = runAgent2Local(state, jdSkills, resumeSkills);
  const agent1Result = runAgent1({
    ...state,
    missingSkills: agent2LocalResult.missingSkills,
  });

  // Merge Agent 1 + Agent 2 local results into state
  state.mvcDealbreakers = agent1Result.mvcDealbreakers;
  state.marketCategory = agent1Result.marketCategory;
  state.targetRoleSlug = agent1Result.marketCategory;
  state.matchedSkills = agent2LocalResult.matchedSkills;
  state.missingSkills = agent2LocalResult.missingSkills;
  state.gapScore = agent2LocalResult.gapScore;
  state.evidenceQuotes = agent2LocalResult.evidenceQuotes;
  state.decayedSkills = agent2LocalResult.decayedSkills;
  state.agent2ToolCallOrder = agent2LocalResult.agent2ToolCallOrder;
  state.trace.push(...agent1Result.trace, ...agent2LocalResult.trace);

  // Step 1c: Session memory lookup (if returning user)
  let previousSession = null;
  if (options.userId) {
    try {
      previousSession = await getSessionMemory(options.userId);
      if (previousSession) {
        state.sessionDelta = computeSessionDelta(state, previousSession);
        emitTrace(state, 'orchestrator', `Returning user detected — ${state.sessionDelta.message}`);
      }
    } catch {
      emitTrace(state, 'orchestrator', 'Session memory lookup failed — treating as new user');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ORCHESTRATOR DECISION POINT — not a hardcoded if in page.tsx
  // ═══════════════════════════════════════════════════════════════════════

  const gapScore = state.gapScore;
  const localPhaseMs = Date.now() - t0;
  emitTrace(state, 'orchestrator', `Local reflex layer complete in ${localPhaseMs}ms — gap score: ${gapScore}%`);

  if (gapScore < 40) {
    emitTrace(state, 'orchestrator', `⚠️ Gap severe (${gapScore}%) → requesting AGGRESSIVE timeline from Agent 3`);
    state.orchestratorMode = 'aggressive';

    // Run Agent 3 in aggressive mode
    const agent3Result = runAgent3(state, { mode: 'aggressive' });
    state.gapScore = agent3Result.gapScore ?? gapScore; // ?? not || so score=0 is preserved
    state.weeksToReady = agent3Result.weeksToReady;
    state.readyByDate = agent3Result.readyByDate;
    state.careerPath = agent3Result.careerPath;
    state.trajectory = agent3Result.trajectory;
    state.trace.push(...agent3Result.trace);

    emitTrace(state, 'orchestrator', '🚫 Skipping outreach agent — candidate not ready for cold outreach yet');
    state.agent4Skipped = true;

  } else {
    emitTrace(state, 'orchestrator', `✅ Gap acceptable (${gapScore}%) → standard timeline + outreach agent`);
    state.orchestratorMode = 'standard';

    // Run Agent 3 in standard mode
    const agent3Result = runAgent3(state, { mode: 'standard' });
    state.gapScore = agent3Result.gapScore ?? gapScore; // ?? not || so score=0 is preserved
    state.weeksToReady = agent3Result.weeksToReady;
    state.readyByDate = agent3Result.readyByDate;
    state.careerPath = agent3Result.careerPath;
    state.trajectory = agent3Result.trajectory;
    state.trace.push(...agent3Result.trace);

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 2: AGENTIC REASONING LAYER (target < 1.2s, streamed)
    // ══════════════════════════════════════════════════════════════════════

    emitTrace(state, 'orchestrator', '🧠 Starting agentic reasoning layer (LLM tool-calling + critique loop)');

    // Run Agent 2 LLM enrichment + Agent 4 outreach in parallel with timeout
    const [agent2Enriched, agent4Result] = await Promise.all([
      withTimeout(
        runAgent2WithReasoning(state, jdSkills, resumeSkills),
        8000,
        null,
        () => emitTrace(state, 'orchestrator', '⏱️ Agent 2 LLM enrichment timed out — using local results')
      ),
      withTimeout(
        runAgent4(state),
        10000,
        null,
        () => emitTrace(state, 'orchestrator', '⏱️ Agent 4 outreach timed out — skipping')
      ),
    ]);

    // Merge Agent 2 enrichment if available
    if (agent2Enriched) {
      state.decayedSkills = agent2Enriched.decayedSkills;
      state.evidenceQuotes = agent2Enriched.evidenceQuotes;
      state.agent2ToolCallOrder = agent2Enriched.agent2ToolCallOrder;
      state.trace.push(...agent2Enriched.trace);
    } else {
      state.degraded = true;
      emitTrace(state, 'orchestrator', '⚡ Agent 2 LLM failed — graceful degradation to local-only');
    }

    // Merge Agent 4 if available
    if (agent4Result) {
      state.starBullets = agent4Result.starBullets;
      state.recruiterColdEmail = agent4Result.recruiterColdEmail;
      state.linkedinHeadline = agent4Result.linkedinHeadline;
      state.critiqueScore = agent4Result.critiqueScore;
      state.critiqueIterations = agent4Result.critiqueIterations;
      state.trace.push(...agent4Result.trace);
    } else {
      state.degraded = true;
      state.agent4Skipped = true;
      emitTrace(state, 'orchestrator', '⚡ Agent 4 outreach failed — graceful degradation');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FINALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  // Save session memory for next visit
  if (options.userId) {
    saveSessionMemory(options.userId, state).catch(() => {
      // Fire and forget — don't block the response
    });
  }

  const totalMs = Date.now() - t0;
  emitTrace(state, 'orchestrator', `✓ Orchestration complete in ${totalMs}ms | Mode: ${state.orchestratorMode} | Degraded: ${state.degraded}`);

  return state;
}
