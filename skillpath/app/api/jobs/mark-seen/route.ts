import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/jobs/mark-seen
 * Marks job postings as seen (is_new = false).
 * Body: { ids?: string[], company?: string, all?: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { ids, company, all } = body;
    const db = getDb();
    const now = new Date().toISOString();

    let docsToUpdate: FirebaseFirestore.DocumentReference[] = [];

    if (Array.isArray(ids) && ids.length > 0) {
      docsToUpdate = ids.map((id) => db.collection('job_postings').doc(String(id)));
    } else if (company) {
      const snap = await db
        .collection('job_postings')
        .where('board_token', '==', String(company).toLowerCase())
        .get();
      docsToUpdate = snap.docs.filter((doc) => doc.data().is_new === true).map((doc) => doc.ref);
    } else if (all) {
      const snap = await db.collection('job_postings').where('is_new', '==', true).get();
      docsToUpdate = snap.docs.map((doc) => doc.ref);
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide "ids", "company", or "all: true"' },
        { status: 400 }
      );
    }

    if (docsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        updated_count: 0,
        message: 'No unread postings match criteria.',
      });
    }

    const batchSize = 400;
    let batch = db.batch();
    let pending = 0;
    let count = 0;

    for (const ref of docsToUpdate) {
      batch.update(ref, {
        is_new: false,
        seen_at: now,
      });
      pending++;
      count++;

      if (pending >= batchSize) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }

    if (pending > 0) {
      await batch.commit();
    }

    // Recount and update new_job_count on tracked_companies docs
    const activeCompaniesSnap = await db.collection('tracked_companies').get();
    for (const compDoc of activeCompaniesSnap.docs) {
      const boardToken = compDoc.id;
      const compJobsSnap = await db
        .collection('job_postings')
        .where('board_token', '==', boardToken)
        .get();
      const unreadCount = compJobsSnap.docs.filter((d) => d.data().is_new === true).length;
      await compDoc.ref.update({
        new_job_count: unreadCount,
      });
    }

    return NextResponse.json({
      success: true,
      updated_count: count,
    });
  } catch (error: any) {
    console.error('[API /jobs/mark-seen PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark jobs as seen' },
      { status: 500 }
    );
  }
}
