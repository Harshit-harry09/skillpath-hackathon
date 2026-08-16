/**
 * ATLAS 2.0 SEMANTIC VECTOR CACHE
 * Tier 1 Cache checking similarity threshold > 0.92 to skip duplicate LLM calls.
 */

import { embedGeminiTexts } from '@/lib/gemini';

export interface CacheEntry {
  inputHash: string;
  inputText: string;
  embedding: number[];
  outputResponse: unknown;
  cachedAt: number;
  hitCount: number;
}

const semanticCache: CacheEntry[] = [];
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SIMILARITY_THRESHOLD = 0.92;

function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

/**
 * Queries the semantic vector cache for a matching input.
 */
export async function getSemanticCachedOutput<T = unknown>(inputText: string): Promise<{ hit: boolean; data?: T }> {
  if (semanticCache.length === 0) return { hit: false };

  let queryVec: number[];
  try {
    const embeddings = await embedGeminiTexts([inputText]);
    queryVec = embeddings[0];
  } catch {
    return { hit: false };
  }

  const now = Date.now();
  for (const entry of semanticCache) {
    if (now - entry.cachedAt > CACHE_TTL_MS) continue;
    const sim = computeCosineSimilarity(queryVec, entry.embedding);
    if (sim >= SIMILARITY_THRESHOLD) {
      entry.hitCount++;
      console.log(`[SemanticCache] ⚡ Vector Cache HIT! Similarity: ${(sim * 100).toFixed(1)}% (Hits: ${entry.hitCount})`);
      return { hit: true, data: entry.outputResponse as T };
    }
  }

  return { hit: false };
}

/**
 * Stores an LLM output into the semantic vector cache.
 */
export async function setSemanticCachedOutput(inputText: string, outputResponse: unknown): Promise<void> {
  try {
    const embeddings = await embedGeminiTexts([inputText]);
    const embedding = embeddings[0];
    if (embedding) {
      semanticCache.push({
        inputHash: `${inputText.length}-${Date.now()}`,
        inputText,
        embedding,
        outputResponse,
        cachedAt: Date.now(),
        hitCount: 0,
      });

      // Max 10,000 cache entries
      if (semanticCache.length > 10000) {
        semanticCache.shift();
      }
    }
  } catch (err) {
    console.warn('[SemanticCache] Vector cache insert skipped:', err);
  }
}
