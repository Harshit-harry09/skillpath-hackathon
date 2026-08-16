import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { getDb } from '@/lib/firebase-admin';

const PROOF_TYPES = new Set(['project', 'certificate', 'GitHub link', 'freelance work', 'coursework', 'case study', 'live demo']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUserSafe(req);
  try {
    const body = await req.json().catch(() => ({})) as { skill?: unknown; proofType?: unknown; url?: unknown };
    const skill = typeof body.skill === 'string' ? body.skill.trim() : '';
    const proofType = typeof body.proofType === 'string' ? body.proofType.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!id || !skill || skill.length > 120 || !PROOF_TYPES.has(proofType) || url.length > 2000) {
      return NextResponse.json({ error: 'invalid_evidence' }, { status: 400 });
    }
    if (url) {
      try { new URL(url); } catch { return NextResponse.json({ error: 'invalid_url' }, { status: 400 }); }
    }
    const db = getDb();
    const analysis = await db.collection('analyses').doc(id).get();
    if (!analysis.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const actor = user?.uid || req.headers.get('x-forwarded-for') || 'guest';
    const evidenceId = crypto.createHash('sha256').update(`${id}:${skill.toLowerCase()}:${actor}`).digest('hex');
    await db.collection('analysis_evidence').doc(evidenceId).set({
      analysis_id: id,
      skill,
      proof_type: proofType,
      url: url || null,
      user_id: user?.uid || null,
      updated_at: new Date().toISOString(),
    }, { merge: true });
    return NextResponse.json({ saved: true, evidenceId });
  } catch (error) {
    console.error('[Results evidence] Failed to save:', error);
    return NextResponse.json({ error: 'evidence_unavailable' }, { status: 503 });
  }
}

