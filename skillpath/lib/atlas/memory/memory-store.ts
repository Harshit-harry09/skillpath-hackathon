/**
 * ATLAS 2.0 MEMORY PERSISTENCE STORE
 * Manages Profile, Episodic (pgvector), Procedural, and Session Memories
 * with fallback to local memory caching.
 */

import { embedGeminiTexts } from '@/lib/gemini';
import type { AtlasSessionState } from '../orchestrator';

export type MemoryType = 'profile' | 'episodic' | 'procedural' | 'feedback';

export interface MemoryRecord {
  id: string;
  userId: string;
  memoryType: MemoryType;
  content: string;
  embedding?: number[];
  relevanceScore: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

// In-Memory fallback store for zero-config local execution
const localMemoryStore: Map<string, MemoryRecord[]> = new Map();

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
 * Saves a new memory item for a given user.
 */
export async function saveMemory(
  userId: string,
  memoryType: MemoryType,
  content: string,
  metadata?: Record<string, unknown>
): Promise<MemoryRecord> {
  let embedding: number[] | undefined;
  try {
    const embeddings = await embedGeminiTexts([content]);
    embedding = embeddings[0];
  } catch (err) {
    console.warn('[MemoryStore] Gemini embedding call failed, skipping vector generation:', err);
  }

  const record: MemoryRecord = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userId,
    memoryType,
    content,
    embedding,
    relevanceScore: 1.0,
    metadata,
    createdAt: Date.now(),
  };

  const userMemories = localMemoryStore.get(userId) || [];
  userMemories.push(record);
  
  // Keep max 500 memories per user (decay oldest)
  if (userMemories.length > 500) {
    userMemories.shift();
  }
  localMemoryStore.set(userId, userMemories);

  console.log(`[MemoryStore] Saved ${memoryType} memory for user ${userId}: "${content.slice(0, 50)}..."`);
  return record;
}

/**
 * Retrieves top-K relevant memories using semantic similarity.
 */
export async function retrieveMemories(
  userId: string,
  query: string,
  topK: number = 5,
  threshold: number = 0.70
): Promise<MemoryRecord[]> {
  const userMemories = localMemoryStore.get(userId) || [];
  if (userMemories.length === 0) return [];

  let queryEmbedding: number[] | undefined;
  try {
    const embeddings = await embedGeminiTexts([query]);
    queryEmbedding = embeddings[0];
  } catch (err) {
    console.warn('[MemoryStore] Semantic search embedding failed, using keyword fallback:', err);
  }

  if (!queryEmbedding) {
    // Keyword match fallback
    const lowerQuery = query.toLowerCase();
    return userMemories
      .filter((m) => m.content.toLowerCase().includes(lowerQuery))
      .slice(0, topK);
  }

  const scored = userMemories.map((mem) => {
    const sim = mem.embedding ? computeCosineSimilarity(queryEmbedding!, mem.embedding) : 0;
    return { mem, sim: sim * mem.relevanceScore };
  });

  return scored
    .filter((item) => item.sim >= threshold)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, topK)
    .map((item) => item.mem);
}

/**
 * Reduces relevance score of memories older than 30 days.
 */
export async function decayMemories(userId: string): Promise<void> {
  const userMemories = localMemoryStore.get(userId);
  if (!userMemories) return;

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const mem of userMemories) {
    const age = now - mem.createdAt;
    if (age > thirtyDaysMs) {
      mem.relevanceScore *= 0.85;
    }
  }
}

/**
 * RAG Context builder for pipeline inputs.
 */
export async function getRelevantContext(userId: string, currentInput: string): Promise<string> {
  const memories = await retrieveMemories(userId, currentInput, 4, 0.65);
  if (memories.length === 0) return '';

  return `PREVIOUS USER RECALL & PREFERENCES:\n` + memories.map((m) => `- [${m.memoryType.toUpperCase()}]: ${m.content}`).join('\n');
}

/**
 * Updates user preferences learned from feedback or rejections.
 */
export async function updateUserPreference(
  userId: string,
  feedback: { target: string; action: 'like' | 'reject'; comment?: string }
): Promise<void> {
  const summary = `User ${feedback.action === 'like' ? 'preferred' : 'rejected'} ${feedback.target}. ${feedback.comment ? `Reason: ${feedback.comment}` : ''}`;
  await saveMemory(userId, 'feedback', summary, { action: feedback.action, target: feedback.target });
}

/**
 * Persists an entire Atlas Graph Session output into memory.
 */
export async function saveAtlasSessionMemory(state: AtlasSessionState): Promise<void> {
  if (!state.parsedResume) return;

  const profileSummary = `Skills: ${state.parsedResume.skills.join(', ')}. Target: ${state.userGoal}. Location: ${state.parsedResume.location || 'Remote'}. Gap: ${state.parsedResume.hasCareerGap ? `${state.parsedResume.detectedGapMonths}m` : 'None'}.`;
  await saveMemory(state.userId, 'profile', profileSummary, { sessionId: state.sessionId });

  if (state.crystalBallNarrative) {
    const narrativeSummary = `Achieved match for ${state.crystalBallNarrative.targetRole} at ${state.crystalBallNarrative.targetCompany} earning ${state.crystalBallNarrative.salary}.`;
    await saveMemory(state.userId, 'episodic', narrativeSummary, { sessionId: state.sessionId });
  }
}
