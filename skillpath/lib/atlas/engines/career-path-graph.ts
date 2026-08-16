/**
 * SUB-SUB ENGINE: Career Path Graph
 *
 * Implements Dijkstra's algorithm on role_adjacency.json to find
 * the OPTIMAL bridge path from a start role to a target role.
 *
 * Edge weights are computed from:
 *  - Salary jump (prefer higher delta)
 *  - MVC sample size (prefer well-established transitions)
 *  - Skill overlap between adjacent roles (lower overlap = harder transition)
 *
 * Result: not just "shortest path" but "highest value path" — the
 * route that maximizes salary growth with the least skill debt.
 *
 * Called by: Agent 7 (Pathfinder)
 */

import roleAdjacencyRaw from '@/lib/data/role_adjacency.json';
import mvcIndiaRaw from '@/lib/data/mvc_model_india.json';

type MvcEntry = {
  role: string;
  salary_avg_lpa: number;
  sample_size: number;
  skills: { skill: string; frequency_pct: number }[];
};

const ADJACENCY = roleAdjacencyRaw as unknown as Record<string, string[]>;
const MVC_INDIA = mvcIndiaRaw as Record<string, MvcEntry>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleEntry(roleKey: string): MvcEntry | null {
  if (MVC_INDIA[roleKey]) return MVC_INDIA[roleKey];
  // Fuzzy match
  const match = Object.keys(MVC_INDIA).find(k =>
    k.includes(roleKey) || roleKey.includes(k.replace(/-/g, ' '))
  );
  return match ? MVC_INDIA[match] : null;
}

function roleNameToKey(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function getAdjacentKeys(key: string): string[] {
  return ADJACENCY[key] || [];
}

/**
 * Compute transition "cost" between two adjacent roles.
 * Lower cost = easier/better transition.
 * Based on: salary gap (invert — prefer larger jumps), skill distance.
 */
function transitionCost(fromKey: string, toKey: string): number {
  const from = getRoleEntry(fromKey);
  const to = getRoleEntry(toKey);

  if (!from || !to) return 5.0; // unknown = high cost

  // Skill overlap between roles (lower overlap = more to learn = higher cost)
  const fromSkills = new Set((from.skills || []).map(s => s.skill.toLowerCase()));
  const toSkills = new Set((to.skills || []).map(s => s.skill.toLowerCase()));
  const overlap = [...toSkills].filter(s => fromSkills.has(s)).length;
  const skillDistance = 1.0 - (overlap / Math.max(toSkills.size, 1));

  // Prefer jumps to higher-salary roles (invert: lower cost = better jump)
  const salaryJump = to.salary_avg_lpa - from.salary_avg_lpa;
  const salaryCost = salaryJump > 0 ? Math.max(0.1, 2.0 - salaryJump * 0.1) : 3.0;

  // Prefer well-documented transitions (higher sample size = more real examples)
  const demandBonus = to.sample_size > 10000 ? 0.5 : 1.0;

  return (skillDistance * 2.0 + salaryCost) * demandBonus;
}

// ── Dijkstra ──────────────────────────────────────────────────────────────────

export interface GraphPath {
  path: string[];           // ordered role keys
  totalCost: number;
  salaryProgression: number[]; // LPA at each step
  estimatedMonthsPerStep: number[];
  isComplete: boolean;
}

export function findOptimalPath(
  startRoleKey: string,
  targetRoleKey: string,
  maxHops = 4
): GraphPath {
  const dist: Record<string, number> = { [startRoleKey]: 0 };
  const prev: Record<string, string> = {};
  const visited = new Set<string>();
  const queue = [startRoleKey];

  while (queue.length > 0) {
    // Find node with minimum cost
    queue.sort((a, b) => (dist[a] ?? Infinity) - (dist[b] ?? Infinity));
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === targetRoleKey) break;

    const neighbors = getAdjacentKeys(current);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;

      // Hop limit to prevent very long paths
      const hopsToHere = Object.keys(prev).filter(k => {
        let node = k;
        let count = 0;
        while (prev[node] && count < 10) { node = prev[node]; count++; }
        return node === startRoleKey;
      }).length;
      if (hopsToHere >= maxHops) continue;

      const newCost = (dist[current] ?? Infinity) + transitionCost(current, neighbor);
      if (newCost < (dist[neighbor] ?? Infinity)) {
        dist[neighbor] = newCost;
        prev[neighbor] = current;
        if (!queue.includes(neighbor)) queue.push(neighbor);
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let node = targetRoleKey;
  let maxIter = 20;
  while (node && maxIter-- > 0) {
    path.unshift(node);
    if (node === startRoleKey) break;
    node = prev[node];
  }

  // If path didn't reach start → direct adjacent check
  if (path[0] !== startRoleKey) {
    const adj = getAdjacentKeys(startRoleKey);
    const directTarget = adj.includes(targetRoleKey)
      ? targetRoleKey
      : adj[0] || targetRoleKey;
    const fallbackPath = [startRoleKey, directTarget, targetRoleKey].filter((v, i, a) => a.indexOf(v) === i);
    return {
      path: fallbackPath,
      totalCost: 3.0,
      salaryProgression: fallbackPath.map(k => getRoleEntry(k)?.salary_avg_lpa || 8.0),
      estimatedMonthsPerStep: [2, 4, 6],
      isComplete: false,
    };
  }

  const salaryProgression = path.map(k => getRoleEntry(k)?.salary_avg_lpa || 8.0);
  // Months per step: based on skill distance (more to learn = more time)
  const estimatedMonthsPerStep = path.slice(0, -1).map((key, i) => {
    const cost = transitionCost(key, path[i + 1]);
    return Math.max(1, Math.round(cost * 1.8)); // cost maps to months
  });

  return {
    path,
    totalCost: dist[targetRoleKey] ?? 99,
    salaryProgression,
    estimatedMonthsPerStep,
    isComplete: path[path.length - 1] === targetRoleKey,
  };
}

/**
 * Given a user goal keyword, find the best matching role key in adjacency graph.
 */
export function resolveGoalToRoleKey(goalText: string): { startKey: string; targetKey: string } {
  const lower = goalText.toLowerCase();

  // Heuristic goal detection
  let targetKey = 'software-engineer'; // default
  if (lower.includes('cyber') || lower.includes('hacker') || lower.includes('security')) targetKey = 'cybersecurity';
  else if (lower.includes('data analyst') || lower.includes('analyst')) targetKey = 'data-professional';
  else if (lower.includes('data engineer')) targetKey = 'data-engineer';
  else if (lower.includes('ml') || lower.includes('machine learning') || lower.includes('ai')) targetKey = 'ml-engineer';
  else if (lower.includes('frontend') || lower.includes('web developer') || lower.includes('react')) targetKey = 'frontend-developer';
  else if (lower.includes('backend') || lower.includes('api')) targetKey = 'backend-developer';
  else if (lower.includes('devops') || lower.includes('cloud')) targetKey = 'devops';
  else if (lower.includes('product manager') || lower.includes('pm')) targetKey = 'product-manager';
  else if (lower.includes('it support') || lower.includes('helpdesk')) targetKey = 'support';
  else if (lower.includes('network')) targetKey = 'network-engineer';

  // Start: entry-level adjacent to target
  const adjacents = getAdjacentKeys(targetKey);
  const startKey = adjacents[0] || 'support'; // bridge role = first adjacent

  return { startKey, targetKey };
}

/**
 * Get all roles reachable within N hops from a starting role.
 * Used for "opportunity horizon" visualization.
 */
export function getReachableRoles(startKey: string, maxHops = 2): string[] {
  const visited = new Set<string>([startKey]);
  let frontier = [startKey];

  for (let hop = 0; hop < maxHops; hop++) {
    const next: string[] = [];
    for (const node of frontier) {
      for (const adj of getAdjacentKeys(node)) {
        if (!visited.has(adj)) {
          visited.add(adj);
          next.push(adj);
        }
      }
    }
    frontier = next;
  }

  visited.delete(startKey);
  return [...visited];
}
