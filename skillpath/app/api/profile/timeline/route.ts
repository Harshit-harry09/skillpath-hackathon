// app/api/profile/timeline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import type { TimelineEntry } from '@/types/profile';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  try {
    const snap = await db
      .collection('skill_timeline')
      .doc(user.uid)
      .collection('entries')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const entries = snap.docs.map(d => d.data() as TimelineEntry);
    return NextResponse.json({ entries });
  } catch (e) {
    console.error('[Timeline GET]', e);
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  let body: Omit<TimelineEntry, 'id'>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  try {
    const id = `entry_${Date.now()}`;
    const entry: TimelineEntry = { ...body, id };
    await db
      .collection('skill_timeline')
      .doc(user.uid)
      .collection('entries')
      .doc(id)
      .set(entry);
    return NextResponse.json({ entry });
  } catch (e) {
    console.error('[Timeline POST]', e);
    return NextResponse.json({ error: 'write_failed' }, { status: 500 });
  }
}
