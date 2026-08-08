// app/api/active-job/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import type { ArchivedJob } from '@/types/active-job';

export async function GET(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  try {
    const snap = await db
      .collection('job_history').doc(user.uid)
      .collection('jobs')
      .orderBy('archived_at', 'desc')
      .limit(10)
      .get();

    const history = snap.docs.map(d => d.data() as ArchivedJob);
    return NextResponse.json({ history });
  } catch (e) {
    console.error('[History GET]', e);
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }
}
