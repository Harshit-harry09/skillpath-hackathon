/**
 * Shared Fuzzy Matching Utilities for SkillPath
 */

/**
 * Levenshtein Distance Utility
 * Calculates how many edits to get from a to b.
 */
// Pre-allocated static scratchpad buffers to eliminate GC allocations in loops
const INITIAL_BUFFER_SIZE = 1024;
let scratchRow0 = new Int32Array(INITIAL_BUFFER_SIZE);
let scratchRow1 = new Int32Array(INITIAL_BUFFER_SIZE);

function ensureScratchBufferSize(requiredSize: number) {
  if (requiredSize > scratchRow0.length) {
    const newSize = Math.max(requiredSize, scratchRow0.length * 2);
    scratchRow0 = new Int32Array(newSize);
    scratchRow1 = new Int32Array(newSize);
  }
}

/**
 * Fast Myers Bit-Parallel Levenshtein algorithm for strings <= 32 chars.
 * Uses 32-bit bitwise integers for O(N) execution with ZERO heap allocations.
 */
function myersBitParallel32(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  let peq = 0;
  let pv = -1;
  let nv = 0;
  let dist = lenA;

  // Build pattern bitmask for a
  const charMask: Record<number, number> = {};
  for (let i = 0; i < lenA; i++) {
    const code = a.charCodeAt(i);
    charMask[code] = (charMask[code] || 0) | (1 << i);
  }

  for (let j = 0; j < lenB; j++) {
    const code = b.charCodeAt(j);
    peq = charMask[code] || 0;

    const x = peq | nv;
    const h0 = pv & peq;
    const step1 = (h0 + (pv & x)) ^ pv;
    const h1 = step1 | x;
    
    let ph = h1 ^ pv;
    let mh = h0;

    const phShift = (ph << 1) | 1;
    pv = (mh << 1) | ~(phShift | h1);
    nv = phShift & h1;

    if (ph & (1 << (lenA - 1))) dist++;
    if (mh & (1 << (lenA - 1))) dist--;
  }

  return dist;
}

/**
 * High-performance Levenshtein Distance Utility.
 * Uses Myers Bit-Parallel for short strings (<= 32 chars) and static pre-allocated
 * scratchpad buffers for longer strings to completely eliminate GC allocations.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const lenA = a.length;
  const lenB = b.length;

  // 1. Bit-Parallel fast path for short strings (zero heap allocation)
  if (lenA <= 32) {
    return myersBitParallel32(a, b);
  }
  if (lenB <= 32) {
    return myersBitParallel32(b, a);
  }

  // 2. Pre-allocated static scratchpad fallback for longer strings
  const requiredSize = lenB + 1;
  ensureScratchBufferSize(requiredSize);

  const row0 = scratchRow0;
  const row1 = scratchRow1;

  for (let j = 0; j <= lenB; j++) {
    row0[j] = j;
  }

  for (let i = 0; i < lenA; i++) {
    row1[0] = i + 1;
    const charA = a.charCodeAt(i);

    for (let j = 0; j < lenB; j++) {
      const cost = charA === b.charCodeAt(j) ? 0 : 1;
      row1[j + 1] = Math.min(
        row1[j] + 1,
        row0[j + 1] + 1,
        row0[j] + cost
      );
    }

    for (let j = 0; j <= lenB; j++) {
      row0[j] = row1[j];
    }
  }

  return row0[lenB];
}

/**
 * Checks if a candidate is a close match to the input.
 * Supports "Sliding Window" to find short candidates inside long strings.
 * Returns the best candidate if confidence is >= threshold.
 */
export function findFuzzyMatch(input: string, candidates: string[], threshold = 0.8): string | null {
  const s = input.toLowerCase().trim();
  if (!s) return null;

  let bestMatch: string | null = null;
  let highestSimilarity = 0;
  const sLen = s.length;

  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    const cLen = c.length;

    // 1. Instant Match
    if (s === c || s.includes(c)) {
      return candidate; // Absolute best match, bail early
    }

    if (cLen > 3) {
      // 2. Fast O(1) Length Difference Pruning Guard
      const maxLen = Math.max(sLen, cLen);
      const minPossibleDist = Math.abs(sLen - cLen);
      const maxPossibleSimilarity = 1 - (minPossibleDist / maxLen);
      if (maxPossibleSimilarity < threshold) {
        continue; // Impossible to meet threshold, skip Levenshtein calculation
      }

      const candidateWords = c.split(/\s+/).length;
      const inputWords = s.split(/\s+/);

      let maxSimForCandidate = 0;

      // 3. Sliding Window (If input is a long string like a JD snippet)
      if (inputWords.length > candidateWords) {
        for (let i = 0; i <= inputWords.length - candidateWords; i++) {
          const windowStr = inputWords.slice(i, i + candidateWords).join(" ");
          const winLen = windowStr.length;
          const winMaxLen = Math.max(winLen, cLen);
          const winMinDist = Math.abs(winLen - cLen);
          if (1 - (winMinDist / winMaxLen) < threshold) continue;

          const distance = getLevenshteinDistance(windowStr, c);
          const similarity = 1 - (distance / winMaxLen);
          if (similarity > maxSimForCandidate) {
            maxSimForCandidate = similarity;
          }
        }
      } else {
        // 4. Direct compare
        const distance = getLevenshteinDistance(s, c);
        maxSimForCandidate = 1 - (distance / maxLen);
      }

      // Track the BEST match, not just the first one that passes the threshold
      if (maxSimForCandidate >= threshold && maxSimForCandidate > highestSimilarity) {
        highestSimilarity = maxSimForCandidate;
        bestMatch = candidate;
      }
    }
  }

  return bestMatch;
}
