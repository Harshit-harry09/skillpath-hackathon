// app/api/active-job/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import type { ActiveJob } from '@/types/active-job';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  try {
    const ref = db.collection('active_jobs').doc(user.uid);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: 'no_active_job' }, { status: 404 });

    const job = doc.data() as ActiveJob;
    await db
      .collection('job_history').doc(user.uid)
      .collection('jobs').doc(job.id)
      .set({
        ...job,
        archived_at: new Date().toISOString(),
        final_score: job.readiness_score
      });

    await ref.delete();
    return NextResponse.json({ archived: true });
  } catch (e) {
    console.error('[Archive POST]', e);
    return NextResponse.json({ error: 'archive_failed' }, { status: 500 });
  }
}
