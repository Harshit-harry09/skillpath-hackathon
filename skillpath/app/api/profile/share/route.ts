// app/api/profile/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const shareId = Buffer.from(user.uid).toString('base64url').slice(0, 16);
    await db.collection('share_cards').doc(shareId).set({
      uid: user.uid,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const url = `${baseUrl}/share/${shareId}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error('[Share POST]', e);
    return NextResponse.json({ error: 'share_failed' }, { status: 500 });
  }
}
