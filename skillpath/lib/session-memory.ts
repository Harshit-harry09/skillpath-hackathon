// updated
/**
 * Session Memory — persisted across visits via Firestore
 *
 * Enables the "You've closed 2 of 5 gaps since your last check-in" delta reporting.
 * Uses a Firestore `sessions` collection keyed by userId.
 */

import type { AgentState, SessionMemory, SessionDelta } from '@/types/agent-state';
import { getDb } from '@/lib/firebase-admin';

const COLLECTION = 'sessions';

/**
 * Retrieve the user's previous session memory.
 * Returns null for first-time / anonymous users.
 */
export async function getSessionMemory(userId: string | null): Promise<SessionMemory | null> {
  if (!userId) return null;

  try {
    const db = getDb();
    const doc = await db.collection(COLLECTION).doc(userId).get();
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    return {
      userId: data.userId || userId,
      lastRunTimestamp: data.lastRunTimestamp || 0,
      lastMissingSkills: Array.isArray(data.lastMissingSkills) ? data.lastMissingSkills : [],
      lastGapScore: typeof data.lastGapScore === 'number' ? data.lastGapScore : 0,
      lastTargetRole: data.lastTargetRole || '',
    };
  } catch (err) {
    console.warn('[SessionMemory] Failed to read:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Save the current run's state as session memory for the next visit.
 */
export async function saveSessionMemory(
  userId: string | null,
  state: AgentState
): Promise<void> {
  if (!userId) return;

  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(userId).set({
      userId,
      lastRunTimestamp: Date.now(),
      lastMissingSkills: state.missingSkills,
      lastGapScore: state.gapScore,
      lastTargetRole: state.targetRoleSlug || state.marketCategory,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SessionMemory] Failed to save:', err instanceof Error ? err.message : err);
  }
}

/**
 * Compute what changed since the user's last visit.
 */
export function computeSessionDelta(
  currentState: AgentState,
  previousSession: SessionMemory
): SessionDelta {
  const previousMissing = new Set(previousSession.lastMissingSkills.map(s => s.toLowerCase()));
  const currentMissing = new Set(currentState.missingSkills.map(s => s.toLowerCase()));

  // Skills that were missing before but are no longer missing
  const skillsClosed = previousSession.lastMissingSkills.filter(
    skill => !currentMissing.has(skill.toLowerCase())
  );

  const gapScoreChange = currentState.gapScore - previousSession.lastGapScore;

  let message: string;
  if (skillsClosed.length > 0 && gapScoreChange > 0) {
    message = `You've closed ${skillsClosed.length} of ${previousSession.lastMissingSkills.length} gaps since your last check-in — readiness up ${gapScoreChange}%!`;
  } else if (skillsClosed.length > 0) {
    message = `You've closed ${skillsClosed.length} of ${previousSession.lastMissingSkills.length} gaps since your last check-in.`;
  } else if (gapScoreChange > 0) {
    message = `Your readiness score improved by ${gapScoreChange}% since last time.`;
  } else if (gapScoreChange < 0) {
    message = `Your readiness dropped ${Math.abs(gapScoreChange)}% — the target role may have shifted or new requirements appeared.`;
  } else {
    message = `Welcome back! Your profile looks similar to your last check-in.`;
  }

  return {
    skillsClosedSinceLastRun: skillsClosed,
    gapScoreChange,
    message,
  };
}
