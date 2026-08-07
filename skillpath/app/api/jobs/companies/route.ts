// updated
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { validateGreenhouseBoardToken, refreshCompanyJobs } from '@/lib/greenhouse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/companies
 * List all tracked companies and summary stats.
 */
export async function GET() {
  try {
    const db = getDb();
    const snapshot = await db.collection('tracked_companies').orderBy('added_at', 'desc').get();
    
    const companies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error: any) {
    console.error('[API /jobs/companies GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tracked companies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/companies
 * Track a new company by board token.
 * Body: { board_token: string, display_name?: string }
 */
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const boardToken = String(body?.board_token || '').trim().toLowerCase();
    const rawDisplayName = String(body?.display_name || '').trim();

    if (!boardToken) {
      return NextResponse.json({ success: false, error: 'board_token is required' }, { status: 400 });
    }

    // 1. Validate against Greenhouse API first
    const valResult = await validateGreenhouseBoardToken(boardToken);
    if (!valResult.valid) {
      return NextResponse.json(
        { success: false, error: valResult.error || 'Invalid Greenhouse board token' },
        { status: 400 }
      );
    }

    const displayName = rawDisplayName || boardToken.charAt(0).toUpperCase() + boardToken.slice(1);
    const db = getDb();
    const companyRef = db.collection('tracked_companies').doc(boardToken);

    const docSnap = await companyRef.get();
    const now = new Date().toISOString();

    if (!docSnap.exists) {
      await companyRef.set({
        board_token: boardToken,
        display_name: displayName,
        active: true,
        added_at: now,
        last_refreshed_at: null,
        last_status: 'pending',
        last_error_message: null,
        job_count: valResult.totalJobs,
        new_job_count: 0,
      });
    } else {
      await companyRef.update({
        active: true,
        display_name: displayName,
      });
    }

    // 2. Perform immediate job fetch & sync
    const syncResult = await refreshCompanyJobs(boardToken, displayName);

    const updatedSnap = await companyRef.get();

    return NextResponse.json({
      success: true,
      company: {
        id: boardToken,
        ...updatedSnap.data(),
      },
      sync_summary: syncResult,
    });
  } catch (error: any) {
    console.error('[API /jobs/companies POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to track company' },
      { status: 500 }
    );
  }
}
