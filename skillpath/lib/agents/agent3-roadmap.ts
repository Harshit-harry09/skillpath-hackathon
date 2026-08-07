// updated
/**
 * Agent 3 — Roadmap Orchestrator (Local + Graph reasoning)
 *
 * Computes gap score, timeline, Dijkstra career path, and curates resources.
 * All math is pure TS — runs in the <150ms local reflex layer.
 */

import type { AgentState, AgentTraceEvent, RoleNode, RoleAdjacencyGraph } from '@/types/agent-state';
import { calculateCountdown } from '@/lib/readiness';
import { findBestCareerMoves } from '@/lib/dijkstra';
import roleAdjacencyData from '@/lib/data/role_adjacency.json';

// Load the role adjacency graph, filtering out metadata keys
const roleGraph: RoleAdjacencyGraph = Object.fromEntries(
  Object.entries(roleAdjacencyData).filter(([key]) => !key.startsWith('_'))
) as unknown as RoleAdjacencyGraph;

export interface Agent3Result {
  gapScore: number;
  weeksToReady: number;
  readyByDate: string;
  careerPath: RoleNode[];
  trajectory: {
    currentSalary: number;
    targetSalary: number;
    percentJump: number;
    nextRole: string;
  };
  trace: AgentTraceEvent[];
}

export function runAgent3(
  state: AgentState,
  options: { mode: 'aggressive' | 'standard' } = { mode: 'standard' }
): Agent3Result {
  const trace: AgentTraceEvent[] = [];
  const t0 = Date.now();

  trace.push({
    timestamp: Date.now(),
    actor: 'agent3',
    message: `Starting roadmap computation (mode: ${options.mode})`,
  });

  // Step 1: Calculate gap score
  const totalSkills = state.jdSkills.length || 1;
  const matchedCount = state.matchedSkills.length;
  const gapScore = Math.min(100, Math.round((matchedCount / totalSkills) * 100));

  trace.push({
    timestamp: Date.now(),
    actor: 'agent3',
    message: `Gap score: ${gapScore}% (${matchedCount}/${totalSkills} skills matched)`,
  });

  // Step 2: Calculate timeline
  const gaps = state.missingSkills.map((skill) => ({
    skill,
    weeks_to_learn: options.mode === 'aggressive'
      ? Math.max(1, Math.ceil(3 * 0.7))  // Aggressive: compress timelines by 30%
      : 3,
  }));

  const countdown = calculateCountdown(gaps);
  const weeksToReady = options.mode === 'aggressive'
    ? Math.max(1, Math.ceil(countdown.weeksRequired * 0.7))
    : countdown.weeksRequired;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToReady * 7);
  const readyByDate = targetDate.toISOString().split('T')[0];

  trace.push({
    timestamp: Date.now(),
    actor: 'agent3',
    message: `Timeline: ${weeksToReady} weeks to ready (${options.mode} mode)`,
  });

  // Step 3: Dijkstra career path
  const currentRole = state.targetRoleSlug || state.marketCategory || 'software-engineer';
  let careerPath: RoleNode[] = [];

  // Find the best career moves from current role
  const bestMoves = findBestCareerMoves(roleGraph, currentRole, 3);
  if (bestMoves.length > 0) {
    // Use the best (lowest difficulty) multi-hop path
    careerPath = bestMoves[0].path;
    trace.push({
      timestamp: Date.now(),
      actor: 'agent3',
      message: `Dijkstra path: ${careerPath.map(n => n.label).join(' → ')} (difficulty: ${bestMoves[0].totalDifficulty})`,
    });
  } else {
    // Fallback: just show the current role node
    const currentNode = roleGraph[currentRole];
    if (currentNode) {
      careerPath = [{ slug: currentNode.slug, label: currentNode.label, baseSalary: currentNode.baseSalary }];
    }
    trace.push({
      timestamp: Date.now(),
      actor: 'agent3',
      message: `No Dijkstra path found for ${currentRole}, using single node`,
    });
  }

  // Step 4: Build trajectory
  const currentSalary = careerPath[0]?.baseSalary || 0;
  const targetSalary = careerPath.length > 1 ? careerPath[careerPath.length - 1].baseSalary : currentSalary;
  const percentJump = currentSalary > 0 ? Math.round(((targetSalary - currentSalary) / currentSalary) * 100) : 0;
  const nextRole = careerPath.length > 1 ? careerPath[1].label : careerPath[0]?.label || 'Unknown';

  trace.push({
    timestamp: Date.now(),
    actor: 'agent3',
    message: `Trajectory: $${currentSalary.toLocaleString()} → $${targetSalary.toLocaleString()} (+${percentJump}%)`,
    durationMs: Date.now() - t0,
  });

  return {
    gapScore,
    weeksToReady,
    readyByDate,
    careerPath,
    trajectory: {
      currentSalary,
      targetSalary,
      percentJump,
      nextRole,
    },
    trace,
  };
}
