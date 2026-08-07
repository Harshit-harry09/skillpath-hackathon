// updated
import { LRUCache } from "lru-cache";
import mvcData from "./data/mvc_model.json";
import { NOISE_BLACKSET } from "./data/noise-dictionary";
import { TECH_ALIASES, TYPO_PATTERNS } from "./data/fuzzy-dictionary";

/**
 * Local Expert Skill Refiner 3.0 (Self-Evolving & Deterministic)
 * Replaces Groq AI with a high-speed, local multi-layered filter.
 */

// Build Golden List ONCE at module load (cold start) — not per request
const goldenList = new Set<string>();
Object.values(mvcData as any).forEach((role: any) => {
  const skills = Array.isArray(role) ? role : (role?.skills ?? []);
  skills.forEach((s: any) => goldenList.add(s.skill.toLowerCase()));
});


const cleanerCache = new LRUCache<string, string[]>({ 
  max: 1000,
  ttl: 1000 * 60 * 60 * 24 // 24 hour TTL
});


import { getLevenshteinDistance } from "./fuzzy";


/**
 * Fuzzy Matcher
 * Returns a corrected skill name if a close match is found in the Golden List.
 */
function fuzzyCorrect(skill: string, goldenList: Set<string>): string {
  let s = skill.toLowerCase().trim();

  // 1. Regex Pattern Check (Layer 0.1)
  for (const { pattern, replacement } of TYPO_PATTERNS) {
    if (pattern.test(s)) return replacement;
  }
  
  // 2. Direct Alias Check (Layer 0.2)
  if (TECH_ALIASES[s]) return TECH_ALIASES[s];

  // 3. Exact Match in Golden List
  if (goldenList.has(s)) return skill;

  // 3. Fuzzy Distance Check (Only for skills > 3 chars to avoid false positives)
  if (s.length > 3) {
    for (const golden of goldenList) {
      if (Math.abs(golden.length - s.length) > 2) continue;
      const distance = getLevenshteinDistance(s, golden);
      if (distance === 1 || (s.length > 6 && distance <= 2)) {
        return golden.charAt(0).toUpperCase() + golden.slice(1);
      }
    }
  }

  return skill;
}

export interface CleanerResult {
  cleaned: string[];
  metrics: {
    latency: number;
    status: string;
    cached: boolean;
    tokens?: number;
  };
}

/**
 * Cleans a list of skills using Local Expert Logic.
 * 100% Deterministic, 0ms latency, Zero API cost.
 */
export async function cleanSkillsWithAI(
  localSkills: string[],
  jobTitle: string
): Promise<CleanerResult> {
  const startTime = performance.now();
  
  const boundedSkills = localSkills.slice(0, 60); // Cap payload
  const cacheKey = `local:${boundedSkills.sort().join(",")}`;

  if (cleanerCache.has(cacheKey)) {
    return { 
      cleaned: cleanerCache.get(cacheKey)!, 
      metrics: { latency: performance.now() - startTime, status: "success_cached", cached: true } 
    };
  }

  // Use pre-built module-level golden list (built once at cold start)

  const cleaned: string[] = [];
  const rejectedCount: string[] = [];

  for (const rawSkill of boundedSkills) {
    const sNorm = rawSkill.toLowerCase().trim();

    // Layer 0: Autocorrect & Fuzzy Matching
    const corrected = fuzzyCorrect(sNorm, goldenList);
    const cNorm = corrected.toLowerCase();

    // Layer 1: The Anchor (High Confidence)
    const isKnownTech = goldenList.has(cNorm);

    // Layer 2: The Blacklist (Deep Noise Gate)
    const words = cNorm.split(/\s+/);
    const isNoise = words.some(word => NOISE_BLACKSET.has(word));

    // Layer 3: Structural Filters
    const isTooShort = cNorm.length < 2;
    const isOnlyNumbers = /^\d+$/.test(cNorm);

    if ((isKnownTech || !isNoise) && !isTooShort && !isOnlyNumbers) {
      cleaned.push(corrected);
    } else {
      rejectedCount.push(rawSkill);
    }
  }

  // Deduplicate and filter out artifacts
  const finalCleaned = Array.from(new Set(cleaned));
  
  cleanerCache.set(cacheKey, finalCleaned);

  return {
    cleaned: finalCleaned,
    metrics: {
      latency: performance.now() - startTime,
      status: "success_local_expert",
      cached: false,
      tokens: 0 // No tokens consumed
    }
  };
}

