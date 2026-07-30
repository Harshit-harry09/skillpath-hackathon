/**
 * Role Switch Comparison — Feature 14
 *
 * Pure, client-side logic to compare the user's resume skills
 * against adjacent/similar roles. Zero API calls.
 *
 * Uses the MVC model skills and a role adjacency map to calculate
 * match percentages and surface easier alternatives.
 */

import type { MVCProfiles } from '@/types/analysis';
import mvcData from './data/mvc_model.json';
import adjacencyData from './data/role_adjacency.json';

const mvcProfiles: MVCProfiles = mvcData as MVCProfiles;
const roleAdjacency: Record<string, string[]> = adjacencyData as unknown as Record<string, string[]>;

// ── Types ────────────────────────────────────────────────

export interface RoleMatch {
  role_key: string;
  display_name: string;
  match_pct: number;
  missing_skills: string[];
  matched_skills: string[];
  total_required: number;
  is_current: boolean;
  easier_than_current: boolean;
  delta: number; // positive = easier, negative = harder
  weeks_estimate: number;
}

// ── Helpers ──────────────────────────────────────────────

function normalizeRole(role: string): string {
  return role
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function getDisplayName(slug: string): string {
  if (mvcProfiles[slug] && !Array.isArray(mvcProfiles[slug])) {
    return (mvcProfiles[slug] as any).role || formatSlug(slug);
  }
  return formatSlug(slug);
}

function formatSlug(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getRoleSkills(roleSlug: string): string[] {
  const roleData = mvcProfiles[roleSlug];
  if (!roleData) return [];
  // Use a heuristic to take top N skills to keep the "Y" count reasonable (e.g. 15-20)
  const skills = Array.isArray(roleData) ? roleData : (roleData?.skills ?? []);
  return skills.slice(0, 15).map(s => s.skill.toLowerCase());
}

function scoreUserAgainstRole(
  userSkills: string[],
  roleSlug: string
): { matched: string[]; missing: string[]; total: number; pct: number } {
  const required = getRoleSkills(roleSlug);
  if (required.length === 0) return { matched: [], missing: [], total: 0, pct: 0 };

  const userLower = userSkills.map(s => s.toLowerCase());

  const matched: string[] = [];
  const missing: string[] = [];

  for (const req of required) {
    const found = userLower.some(u => {
      if (u === req) return true;
      // Partial match (e.g. "React" matches "React.js")
      if (u.length > 3 && req.includes(u)) return true;
      if (req.length > 3 && u.includes(req)) return true;
      return false;
    });
    
    if (found) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  }

  const pct = Math.round((matched.length / required.length) * 100);

  return {
    matched,
    missing,
    total: required.length,
    pct: Math.max(0, pct),
  };
}

function estimateWeeks(missingCount: number): number {
  // 1 week per missing skill for adjacency comparison
  return Math.max(1, missingCount);
}

// ── Main Export ──────────────────────────────────────────

/**
 * Compare the user's current skills against adjacent roles.
 */
export function compareToSimilarRoles(
  userSkills: string[],
  currentRoleSlug: string
): RoleMatch[] {
  const fullKey = currentRoleSlug;
  const baseRole = currentRoleSlug.replace(/^(mid|senior|junior|executive)-/, '');
  
  const currentResult = scoreUserAgainstRole(userSkills, fullKey);

  const adjacentSlugs = roleAdjacency[baseRole] ?? roleAdjacency['other'] ?? [];
  const results: RoleMatch[] = [];

  results.push({
    role_key: fullKey,
    display_name: getDisplayName(fullKey),
    match_pct: currentResult.pct,
    missing_skills: currentResult.missing,
    matched_skills: currentResult.matched,
    total_required: currentResult.total,
    is_current: true,
    easier_than_current: false,
    delta: 0,
    weeks_estimate: estimateWeeks(currentResult.missing.length),
  });

  for (const slug of adjacentSlugs) {
    if (slug === baseRole) continue;
    
    // Default to 'mid-' version for adjacency checks
    let targetSlug = null;
    const candidates = [
      `mid-${slug}`, 
      slug, 
      `mid ${slug.replace(/-/g, ' ')}`, 
      slug.replace(/-/g, ' ')
    ];
    
    for (const cand of candidates) {
      if (mvcProfiles[cand]) {
        targetSlug = cand;
        break;
      }
    }
    
    if (!targetSlug || targetSlug === fullKey) continue;

    const result = scoreUserAgainstRole(userSkills, targetSlug);
    
    // Filter: only show roles with > 10% match to avoid completely unrelated noise,
    // but keep enough to show variety as requested (4-5 roles).
    if (result.pct < 10) continue;

    results.push({
      role_key: slug,
      display_name: getDisplayName(slug),
      match_pct: result.pct,
      missing_skills: result.missing,
      matched_skills: result.matched,
      total_required: result.total,
      is_current: false,
      easier_than_current: result.pct > currentResult.pct,
      delta: result.pct - currentResult.pct,
      weeks_estimate: estimateWeeks(result.missing.length),
    });
  }

  return results.sort((a, b) => {
    if (a.is_current) return -1;
    if (b.is_current) return 1;
    return b.match_pct - a.match_pct;
  });
}
