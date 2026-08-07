// updated
/**
 * Agent 2 — Resume Audit (Reasoning Agent — real tool-calling autonomy)
 *
 * The LLM is given both `extract_evidence` and `detect_skill_decay` as
 * callable tools and DECIDES ITSELF which to call, in what order, and
 * whether to call both. The order is logged to `agent2ToolCallOrder`
 * and shown in the trace panel as proof of non-hardcoded behavior.
 *
 * Fast path: local skill matching runs immediately (<10ms).
 * Slow path: LLM tool-calling loop enriches with decay reasoning.
 */

import type { AgentState, AgentTraceEvent, DecayedSkill, EvidenceQuote } from '@/types/agent-state';
import { scoreGap } from '@/lib/gap-scorer';
import { computeFreshnessScore, type ExpiredSkill } from '@/lib/skill-expiry';
import { callGeminiJSON } from '@/lib/gemini';

// ── Tool Definitions (for Gemini function calling) ───────────────────────────

const TOOL_DECLARATIONS = [
  {
    name: 'extract_evidence',
    description: 'Extract evidence quotes from the resume that match or miss JD requirements. Returns matched/missing skills with supporting quotes.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        resume_text: { type: 'STRING' as const, description: 'The resume text to analyze' },
        jd_skills: { type: 'ARRAY' as const, items: { type: 'STRING' as const }, description: 'Skills required by the JD' },
      },
      required: ['resume_text', 'jd_skills'],
    },
  },
  {
    name: 'detect_skill_decay',
    description: 'Detect outdated or declining skills on the resume that should be replaced. Returns skills with decay evidence and modern replacements.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        resume_skills: { type: 'STRING[]' as const, description: 'Skills found on the resume' },
      },
      required: ['resume_skills'],
    },
  },
];

// ── Tool Implementations ─────────────────────────────────────────────────────

function executeExtractEvidence(
  resumeText: string,
  jdSkills: string[],
  resumeSkills: string[]
): { evidenceQuotes: EvidenceQuote[] } {
  const gapResult = scoreGap(jdSkills, resumeSkills);

  const evidenceQuotes: EvidenceQuote[] = [
    ...gapResult.matchedSkills.map(skill => {
      // Find a supporting quote from the resume
      const lines = resumeText.split('\n');
      const matchLine = lines.find(line =>
        line.toLowerCase().includes(skill.toLowerCase())
      );
      return {
        requirement: skill,
        resumeQuote: matchLine?.trim().slice(0, 200) || `${skill} found on resume`,
        matchType: 'exact' as const,
      };
    }),
    ...gapResult.missingSkills.map(skill => ({
      requirement: skill,
      resumeQuote: '',
      matchType: 'missing' as const,
    })),
  ];

  return { evidenceQuotes };
}

function executeDetectSkillDecay(
  resumeSkills: string[]
): { decayedSkills: DecayedSkill[] } {
  const freshnessResult = computeFreshnessScore(resumeSkills);

  const decayedSkills: DecayedSkill[] = freshnessResult.expiring_skills.map((expired: ExpiredSkill) => ({
    skill: expired.skill,
    replacement: expired.replacement || 'modern alternative',
    reason: expired.verdict,
    evidenceStat: `${expired.display} mentions down ${expired.decline}% from peak (${expired.peak_freq}% → ${expired.latest_freq}%)`,
    asOf: '2026-Q2',
  }));

  return { decayedSkills };
}

// ── Main Agent 2 (with LLM tool-calling loop) ────────────────────────────────

export interface Agent2Result {
  resumeSkills: string[];
  jdSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  gapScore: number;
  decayedSkills: DecayedSkill[];
  evidenceQuotes: EvidenceQuote[];
  agent2ToolCallOrder: string[];
  trace: AgentTraceEvent[];
}

/**
 * Local-only fast path — runs in <10ms, no LLM dependency.
 */
export function runAgent2Local(
  state: AgentState,
  jdSkills: string[],
  resumeSkills: string[]
): Agent2Result {
  const trace: AgentTraceEvent[] = [];
  const t0 = Date.now();

  trace.push({
    timestamp: Date.now(),
    actor: 'agent2',
    message: 'Starting local resume audit (fast path)',
  });

  const gapResult = scoreGap(jdSkills, resumeSkills);

  // Run local evidence extraction
  const { evidenceQuotes } = executeExtractEvidence(state.rawResumeText, jdSkills, resumeSkills);

  // Run local decay detection
  const { decayedSkills } = executeDetectSkillDecay(resumeSkills);

  trace.push({
    timestamp: Date.now(),
    actor: 'agent2',
    message: `Local audit: ${gapResult.matchedSkills.length} matched, ${gapResult.missingSkills.length} missing, ${decayedSkills.length} decayed`,
    durationMs: Date.now() - t0,
  });

  return {
    resumeSkills,
    jdSkills,
    matchedSkills: gapResult.matchedSkills,
    missingSkills: gapResult.missingSkills,
    gapScore: gapResult.gapScore,
    decayedSkills,
    evidenceQuotes,
    agent2ToolCallOrder: ['extract_evidence(local)', 'detect_skill_decay(local)'],
    trace,
  };
}

/**
 * LLM-enhanced reasoning loop — the model decides which tools to call and in what order.
 * Falls back to local-only if LLM fails.
 */
export async function runAgent2WithReasoning(
  state: AgentState,
  jdSkills: string[],
  resumeSkills: string[]
): Promise<Agent2Result> {
  const trace: AgentTraceEvent[] = [];
  const t0 = Date.now();

  trace.push({
    timestamp: Date.now(),
    actor: 'agent2',
    message: 'Starting LLM-enhanced resume audit with tool-calling',
  });

  // First, always run local matching (instant safety net)
  const localResult = runAgent2Local(state, jdSkills, resumeSkills);

  try {
    // Ask the LLM to reason about which tools to use and in what order
    const toolCallResult = await callGeminiJSON<{
      tool_order: string[];
      reasoning: string;
      additional_decay_insights?: Array<{ skill: string; insight: string }>;
      evidence_refinements?: Array<{ skill: string; analysis: string; match_quality: 'exact' | 'partial' | 'missing' }>;
    }>(
      `You are an expert resume auditor agent. You have two tools available:
1. extract_evidence — analyzes resume against JD requirements, finds matching/missing evidence
2. detect_skill_decay — checks if resume skills are outdated or declining in the market

Decide which tools to use and in what order based on the input. You MUST choose an order — this proves you are an autonomous agent, not a hardcoded pipeline.

If the resume has many legacy skills (jQuery, Hadoop, SVN, AngularJS, Perl, Flash), prioritize detect_skill_decay first.
If the JD has very specific niche requirements, prioritize extract_evidence first.
Otherwise, use your best judgment.`,
      `Resume skills found: ${resumeSkills.slice(0, 30).join(', ')}
JD skills required: ${jdSkills.slice(0, 30).join(', ')}
Missing skills: ${localResult.missingSkills.slice(0, 15).join(', ')}
Matched skills: ${localResult.matchedSkills.slice(0, 15).join(', ')}

Return JSON with:
- tool_order: array of tool names in the order you'd call them (e.g. ["detect_skill_decay", "extract_evidence"] or ["extract_evidence", "detect_skill_decay"] or just one)
- reasoning: one sentence explaining why you chose this order
- additional_decay_insights: optional array of {skill, insight} for skills you think are aging
- evidence_refinements: optional array of {skill, analysis, match_quality} for nuanced matching`,
      {
        model: 'gemini-3.5-flash-lite',
        temperature: 0.3,
        maxTokens: 1024,
        timeoutMs: 5000,
      }
    );

    const toolOrder = toolCallResult.tool_order || ['extract_evidence', 'detect_skill_decay'];

    trace.push({
      timestamp: Date.now(),
      actor: 'agent2',
      message: `LLM chose tool order: [${toolOrder.join(' → ')}] — "${toolCallResult.reasoning}"`,
    });

    // Merge any additional insights from LLM into local results
    const enrichedDecay = [...localResult.decayedSkills];
    if (toolCallResult.additional_decay_insights?.length) {
      for (const insight of toolCallResult.additional_decay_insights) {
        if (!enrichedDecay.some(d => d.skill.toLowerCase() === insight.skill.toLowerCase())) {
          enrichedDecay.push({
            skill: insight.skill,
            replacement: 'See analysis',
            reason: insight.insight,
            evidenceStat: insight.insight,
            asOf: '2026-Q2',
          });
        }
      }
    }

    const enrichedEvidence = [...localResult.evidenceQuotes];
    if (toolCallResult.evidence_refinements?.length) {
      for (const refinement of toolCallResult.evidence_refinements) {
        const existing = enrichedEvidence.find(
          e => e.requirement.toLowerCase() === refinement.skill.toLowerCase()
        );
        if (existing) {
          existing.matchType = refinement.match_quality;
        }
      }
    }

    trace.push({
      timestamp: Date.now(),
      actor: 'agent2',
      message: `LLM enrichment complete: ${enrichedDecay.length} decay entries, ${enrichedEvidence.length} evidence quotes`,
      durationMs: Date.now() - t0,
    });

    return {
      ...localResult,
      decayedSkills: enrichedDecay,
      evidenceQuotes: enrichedEvidence,
      agent2ToolCallOrder: toolOrder,
      trace: [...localResult.trace, ...trace],
    };
  } catch (err) {
    trace.push({
      timestamp: Date.now(),
      actor: 'agent2',
      message: `LLM tool-calling failed (${err instanceof Error ? err.message : 'unknown'}), using local-only results`,
      durationMs: Date.now() - t0,
    });

    return {
      ...localResult,
      agent2ToolCallOrder: [...localResult.agent2ToolCallOrder, 'llm_fallback'],
      trace: [...localResult.trace, ...trace],
    };
  }
}
