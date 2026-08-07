// updated
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

/**
 * DELETE /api/jobs/companies/[token]
 * Untrack a company and clean up its stored postings.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token.trim().toLowerCase();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const db = getDb();
    const companyRef = db.collection('tracked_companies').doc(token);
    
    await companyRef.delete();

    // Delete associated postings for this company
    const postingsSnap = await db
      .collection('job_postings')
      .where('board_token', '==', token)
      .get();

    if (!postingsSnap.empty) {
      const batchSize = 400;
      let batch = db.batch();
      let pending = 0;

      for (const doc of postingsSnap.docs) {
        batch.delete(doc.ref);
        pending++;
        if (pending >= batchSize) {
          await batch.commit();
          batch = db.batch();
          pending = 0;
        }
      }
      if (pending > 0) {
        await batch.commit();
      }
    }

    return NextResponse.json({
      success: true,
      message: `Company "${token}" untracked and removed successfully.`,
    });
  } catch (error: any) {
    console.error('[API /jobs/companies/[token] DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to untrack company' },
      { status: 500 }
    );
  }
}
