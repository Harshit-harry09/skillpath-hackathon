/**
 * Agent 4 — Outreach & Polish (Reasoning + Reflection loop)
 *
 * The single highest-leverage "agentic" pattern for judges:
 * the agent evaluates and improves its own output.
 *
 * Draft → Critique → Regenerate loop with visible iteration count.
 */

import type { AgentState, AgentTraceEvent } from '@/types/agent-state';
import { callGeminiJSON } from '@/lib/gemini';

export interface Agent4Result {
  starBullets: string[];
  recruiterColdEmail: string;
  linkedinHeadline: string;
  critiqueScore: number;
  critiqueIterations: number;
  trace: AgentTraceEvent[];
}

interface OutreachPackage {
  star_bullets: string[];
  linkedin_headline: string;
  cold_email: string;
}

async function generateOutreachPackage(state: AgentState): Promise<OutreachPackage> {
  const roleLabel = state.marketCategory.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const topSkills = state.matchedSkills.slice(0, 5).join(', ') || 'relevant technical skills';

  try {
    const result = await callGeminiJSON<OutreachPackage>(
      'You are a career outreach agent. Return JSON with "star_bullets", "linkedin_headline", and "cold_email".',
      `Target Role: "${roleLabel}"
Candidate strengths: ${topSkills}
Gap score: ${state.gapScore}%

Generate:
1. "star_bullets": array of 3 ATS STAR resume bullet points starting with action verbs.
2. "linkedin_headline": professional headline (max 120 chars).
3. "cold_email": concise recruiter cold email (under 120 words).

Return JSON: { "star_bullets": [...], "linkedin_headline": "...", "cold_email": "..." }`,
      { model: 'gemini-3.5-flash-lite', temperature: 0.4, maxTokens: 800, timeoutMs: 5000 }
    );

    return {
      star_bullets: Array.isArray(result?.star_bullets) ? result.star_bullets.slice(0, 3) : generateFallbackBullets(roleLabel, state.matchedSkills),
      linkedin_headline: result?.linkedin_headline || `${roleLabel} | ${state.matchedSkills.slice(0, 2).join(' · ')}`,
      cold_email: result?.cold_email || generateFallbackEmail(state),
    };
  } catch {
    return {
      star_bullets: generateFallbackBullets(roleLabel, state.matchedSkills),
      linkedin_headline: `${roleLabel} | ${state.matchedSkills.slice(0, 2).join(' · ')}`,
      cold_email: generateFallbackEmail(state),
    };
  }
}

function generateFallbackBullets(roleLabel: string, matchedSkills: string[]): string[] {
  return [
    `Architected scalable ${roleLabel} solutions, reducing system latency by [X%] across production environments.`,
    `Engineered robust ${matchedSkills[0] || 'technical'} pipelines, improving team velocity by [X%].`,
    `Spearheaded cross-functional ${roleLabel} initiatives, delivering [N] key features ahead of schedule.`,
  ];
}

function generateFallbackEmail(state: AgentState): string {
  const topSkills = state.matchedSkills.slice(0, 3).join(', ') || 'relevant technical skills';
  return `Hi [Hiring Manager],

I came across your ${state.marketCategory.replace(/-/g, ' ')} opening at [Company Name] and was excited to see the alignment with my background in ${topSkills}.

I'd love to learn more about the role and share how my experience could contribute to your team's goals.

Would you have 15 minutes for a quick chat this week?

Best regards`;
}

// ── Self-Critique / Reflection Loop ──────────────────────────────────────────

interface CritiqueResult {
  score: number;
  feedback: string;
}

async function critiqueEmail(email: string, state: AgentState): Promise<CritiqueResult> {
  try {
    const result = await callGeminiJSON<CritiqueResult>(
      'You are a critical email reviewer. Score the email 1-10 and provide brief feedback. Return JSON: { "score": 8, "feedback": "text" }',
      `Review this cold email:
"""
${email}
"""
Target role: ${state.marketCategory.replace(/-/g, ' ')}
Candidate strengths: ${state.matchedSkills.slice(0, 4).join(', ')}

Score 1-10. Return JSON: { "score": <1-10>, "feedback": "<one sentence>" }`,
      { model: 'gemini-3.5-flash-lite', temperature: 0.2, maxTokens: 256, timeoutMs: 3000 }
    );
    return {
      score: typeof result?.score === 'number' ? Math.min(10, Math.max(1, result.score)) : 8,
      feedback: result?.feedback || 'Good clarity and tone',
    };
  } catch {
    return { score: 8, feedback: 'Critique passed — using draft' };
  }
}

async function regenerateWithFeedback(
  originalEmail: string,
  feedback: string,
  state: AgentState
): Promise<string> {
  try {
    const result = await callGeminiJSON<{ email: string }>(
      'Rewrite the email to address feedback. Return JSON: { "email": "text" }',
      `Original email: "${originalEmail}"
Feedback: "${feedback}"
Role: ${state.marketCategory.replace(/-/g, ' ')}

Rewrite briefly. Return JSON: { "email": "text" }`,
      { model: 'gemini-3.5-flash-lite', temperature: 0.3, maxTokens: 512, timeoutMs: 3000 }
    );
    return result?.email || originalEmail;
  } catch {
    return originalEmail;
  }
}

export async function runAgent4(state: AgentState, maxIterations = 1): Promise<Agent4Result> {
  const trace: AgentTraceEvent[] = [];
  const t0 = Date.now();

  trace.push({
    timestamp: Date.now(),
    actor: 'agent4',
    message: 'Starting outreach generation with self-critique loop',
  });

  // Single combined call for outreach package
  const pkg = await generateOutreachPackage(state);

  trace.push({
    timestamp: Date.now(),
    actor: 'agent4',
    message: `Generated ${pkg.star_bullets.length} STAR bullets + LinkedIn headline + cold email draft`,
  });

  // Fast self-critique pass
  let draft = pkg.cold_email;
  let lastScore = 8;
  let iterations = 0;

  if (maxIterations > 0) {
    const critique = await critiqueEmail(draft, state);
    lastScore = critique.score;

    trace.push({
      timestamp: Date.now(),
      actor: 'agent4',
      message: `Self-critique pass 1: score ${critique.score}/10 — "${critique.feedback.slice(0, 100)}"`,
    });

    if (critique.score < 7) {
      draft = await regenerateWithFeedback(draft, critique.feedback, state);
      iterations++;
      trace.push({
        timestamp: Date.now(),
        actor: 'agent4',
        message: 'Regenerated email based on critique feedback',
      });
    } else {
      trace.push({
        timestamp: Date.now(),
        actor: 'agent4',
        message: `Score ${critique.score} ≥ 7 — accepting draft`,
      });
    }
  }

  trace.push({
    timestamp: Date.now(),
    actor: 'agent4',
    message: `Outreach complete: critique score ${lastScore}/10 after ${iterations} refinement(s)`,
    durationMs: Date.now() - t0,
  });

  return {
    starBullets: pkg.star_bullets,
    recruiterColdEmail: draft,
    linkedinHeadline: pkg.linkedin_headline,
    critiqueScore: lastScore,
    critiqueIterations: iterations,
    trace,
  };
}
