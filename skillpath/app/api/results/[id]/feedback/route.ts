import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { getDb } from '@/lib/firebase-admin';
import { guardAiRequest } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUserSafe(req);
  const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 10);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json() as { skill?: unknown; accurate?: unknown };
    const skill = typeof body.skill === 'string' ? body.skill.trim() : '';
    if (!id || !skill || skill.length > 120 || typeof body.accurate !== 'boolean') {
      return NextResponse.json({ error: 'invalid_feedback' }, { status: 400 });
    }

    const db = getDb();
    const analysisRef = db.collection('analyses').doc(id);
    const analysis = await analysisRef.get();
    if (!analysis.exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const guestFingerprint = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'guest';
    const actor = user?.uid || guestFingerprint;
    const feedbackId = crypto.createHash('sha256').update(`${id}:${skill.toLowerCase()}:${actor}`).digest('hex');

    await db.collection('analysis_feedback').doc(feedbackId).set({
      analysis_id: id,
      skill,
      accurate: body.accurate,
      user_id: user?.uid || null,
      created_at: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('[Results feedback] Failed to save feedback:', error);
    return NextResponse.json({ error: 'feedback_unavailable' }, { status: 503 });
  }
}
