// updated
/**
 * Dijkstra Shortest Path over the Role Adjacency Graph
 *
 * Finds the optimal multi-hop career route (e.g., "SDE1 → SDE2 → Staff Engineer")
 * weighted by transitionDifficulty instead of just showing direct neighbors.
 *
 * Complexity: O((V + E) log V) with a min-heap — negligible for ~60 nodes.
 */

import type { RoleAdjacencyGraph, RoleNode } from '@/types/agent-state';

// ── MinHeap (array-based, zero dependencies) ─────────────────────────────────

interface HeapEntry {
  slug: string;
  dist: number;
}

class MinHeap {
  private data: HeapEntry[] = [];

  push(entry: HeapEntry) {
    this.data.push(entry);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapEntry {
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  private bubbleUp(idx: number) {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.data[parent].dist <= this.data[idx].dist) break;
      [this.data[parent], this.data[idx]] = [this.data[idx], this.data[parent]];
      idx = parent;
    }
  }

  private sinkDown(idx: number) {
    const len = this.data.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < len && this.data[left].dist < this.data[smallest].dist) smallest = left;
      if (right < len && this.data[right].dist < this.data[smallest].dist) smallest = right;
      if (smallest === idx) break;
      [this.data[smallest], this.data[idx]] = [this.data[idx], this.data[smallest]];
      idx = smallest;
    }
  }
}

// ── Dijkstra ─────────────────────────────────────────────────────────────────

function reconstructPath(
  prev: Record<string, string | null>,
  start: string,
  target: string
): string[] {
  const path: string[] = [];
  let current: string | null = target;
  while (current !== null) {
    path.unshift(current);
    current = prev[current] ?? null;
    if (current === start) {
      path.unshift(start);
      break;
    }
  }
  return path;
}

export function dijkstraCareerPath(
  graph: RoleAdjacencyGraph,
  start: string,
  target: string
): RoleNode[] {
  // If start and target are the same, return just that node
  if (start === target) {
    const node = graph[start];
    return node ? [{ slug: node.slug, label: node.label, baseSalary: node.baseSalary }] : [];
  }

  // If either node doesn't exist in the graph, return empty
  if (!graph[start] || !graph[target]) return [];

  const dist: Record<string, number> = { [start]: 0 };
  const prev: Record<string, string | null> = { [start]: null };
  const visited = new Set<string>();
  const pq = new MinHeap();
  pq.push({ slug: start, dist: 0 });

  while (!pq.isEmpty()) {
    const { slug } = pq.pop();
    if (visited.has(slug)) continue;
    visited.add(slug);
    if (slug === target) break;

    for (const edge of graph[slug]?.adjacentRoles ?? []) {
      if (!graph[edge.targetSlug]) continue; // skip if target node doesn't exist in graph
      const newDist = dist[slug] + edge.transitionDifficulty;
      if (newDist < (dist[edge.targetSlug] ?? Infinity)) {
        dist[edge.targetSlug] = newDist;
        prev[edge.targetSlug] = slug;
        pq.push({ slug: edge.targetSlug, dist: newDist });
      }
    }
  }

  // If we never reached the target, return empty
  if (!(target in prev)) return [];

  const slugPath = reconstructPath(prev, start, target);
  return slugPath
    .map(slug => graph[slug])
    .filter(Boolean)
    .map(node => ({ slug: node.slug, label: node.label, baseSalary: node.baseSalary }));
}

/**
 * Find the N best career paths from a starting role.
 * Returns the top N targets sorted by lowest total transition difficulty.
 */
export function findBestCareerMoves(
  graph: RoleAdjacencyGraph,
  start: string,
  maxResults = 5
): Array<{ target: RoleNode; path: RoleNode[]; totalDifficulty: number }> {
  if (!graph[start]) return [];

  const dist: Record<string, number> = { [start]: 0 };
  const prev: Record<string, string | null> = { [start]: null };
  const visited = new Set<string>();
  const pq = new MinHeap();
  pq.push({ slug: start, dist: 0 });

  while (!pq.isEmpty()) {
    const { slug } = pq.pop();
    if (visited.has(slug)) continue;
    visited.add(slug);

    for (const edge of graph[slug]?.adjacentRoles ?? []) {
      if (!graph[edge.targetSlug]) continue;
      const newDist = dist[slug] + edge.transitionDifficulty;
      if (newDist < (dist[edge.targetSlug] ?? Infinity)) {
        dist[edge.targetSlug] = newDist;
        prev[edge.targetSlug] = slug;
        pq.push({ slug: edge.targetSlug, dist: newDist });
      }
    }
  }

  // Collect all reachable nodes (excluding start) and sort by distance
  return Object.entries(dist)
    .filter(([slug]) => slug !== start && graph[slug])
    .sort((a, b) => a[1] - b[1])
    .slice(0, maxResults)
    .map(([slug, totalDifficulty]) => {
      const slugPath = reconstructPath(prev, start, slug);
      const path = slugPath
        .map((s) => graph[s])
        .filter(Boolean)
        .map((n) => ({ slug: n.slug, label: n.label, baseSalary: n.baseSalary }));
      return {
        target: { slug: graph[slug].slug, label: graph[slug].label, baseSalary: graph[slug].baseSalary },
        path,
        totalDifficulty,
      };
    });
}

/**
 * A* (A-Star) Career Path Algorithm with Landmark Heuristics
 *
 * Uses F(n) = G(n) + H(n) where G(n) is transition difficulty cost
 * and H(n) is the salary/role distance heuristic to target role.
 */
export function aStarCareerPath(
  graph: RoleAdjacencyGraph,
  start: string,
  target: string
): RoleNode[] {
  if (start === target) {
    const node = graph[start];
    return node ? [{ slug: node.slug, label: node.label, baseSalary: node.baseSalary }] : [];
  }

  if (!graph[start] || !graph[target]) return [];

  const targetNode = graph[target];
  const targetSalary = targetNode.baseSalary || 100000;

  // Heuristic function H(n): Estimate remaining salary distance
  const heuristic = (slug: string): number => {
    const n = graph[slug];
    if (!n) return 0;
    const diff = Math.max(0, targetSalary - (n.baseSalary || 50000));
    return (diff / 25000); // Scale factor
  };

  const gScore: Record<string, number> = { [start]: 0 };
  const fScore: Record<string, number> = { [start]: heuristic(start) };
  const prev: Record<string, string | null> = { [start]: null };
  const visited = new Set<string>();

  const pq = new MinHeap();
  pq.push({ slug: start, dist: fScore[start] });

  while (!pq.isEmpty()) {
    const { slug } = pq.pop();
    if (visited.has(slug)) continue;
    visited.add(slug);

    if (slug === target) break;

    for (const edge of graph[slug]?.adjacentRoles ?? []) {
      if (!graph[edge.targetSlug]) continue;

      const tentativeG = (gScore[slug] ?? Infinity) + edge.transitionDifficulty;
      if (tentativeG < (gScore[edge.targetSlug] ?? Infinity)) {
        prev[edge.targetSlug] = slug;
        gScore[edge.targetSlug] = tentativeG;
        const f = tentativeG + heuristic(edge.targetSlug);
        fScore[edge.targetSlug] = f;
        pq.push({ slug: edge.targetSlug, dist: f });
      }
    }
  }

  if (!(target in prev)) return [];

  const slugPath = reconstructPath(prev, start, target);
  return slugPath
    .map((slug) => graph[slug])
    .filter(Boolean)
    .map((node) => ({ slug: node.slug, label: node.label, baseSalary: node.baseSalary }));
}
