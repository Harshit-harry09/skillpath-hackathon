/**
 * Shared Fuzzy Matching Utilities for SkillPath
 */

/**
 * Levenshtein Distance Utility
 * Calculates how many edits to get from a to b.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array.from({ length: b.length + 1 }, (_, i) => i)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
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

  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    
    // 1. Instant Match
    if (s === c || s.includes(c)) {
      return candidate; // Absolute best match, bail early
    }

    if (c.length > 3) {
      const candidateWords = c.split(/\s+/).length;
      const inputWords = s.split(/\s+/);
      
      let maxSimForCandidate = 0;
      
      // 2. Sliding Window (If input is a long string like a JD snippet)
      if (inputWords.length > candidateWords) {
        for (let i = 0; i <= inputWords.length - candidateWords; i++) {
          const windowStr = inputWords.slice(i, i + candidateWords).join(" ");
          const maxLen = Math.max(windowStr.length, c.length);
          const distance = getLevenshteinDistance(windowStr, c);
          const similarity = 1 - (distance / maxLen);
          if (similarity > maxSimForCandidate) {
            maxSimForCandidate = similarity;
          }
        }
      } else {
        // 3. Direct compare
        const maxLen = Math.max(s.length, c.length);
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
