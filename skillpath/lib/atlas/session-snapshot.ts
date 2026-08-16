import { getDb } from '@/lib/firebase-admin';
import type { AtlasSessionState } from './orchestrator';

/** Persist only strategic session metadata; raw resume/JD text stays private. */
export async function saveAtlasSessionSnapshot(state: AtlasSessionState): Promise<void> {
  try {
    const db = getDb();
    await db.collection('atlas_sessions').doc(state.sessionId).set({
      schema_version: 2,
      session_id: state.sessionId,
      user_id: state.userId,
      phase: state.phase,
      status: state.status || 'complete',
      user_goal: state.userGoal || '',
      source: state.source || { mode: 'direct' },
      softSignals: state.softSignals || null,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    // Atlas remains usable without Firestore, just like the existing memory fallback.
    console.warn('[Atlas Session Snapshot] Persistence warning:', error instanceof Error ? error.message : error);
  }
}

