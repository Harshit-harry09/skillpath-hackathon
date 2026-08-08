// updated
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs
 * List job postings from tracked companies.
 * Query params: company, is_new, search, limit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company')?.trim().toLowerCase();
    const isNewParam = searchParams.get('is_new');
    const search = searchParams.get('search')?.trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get('limit')) || 300, 1000);

    let db;
    try {
      db = getDb();
    } catch (e: any) {
      console.warn('[API /jobs GET] Database unavailable:', e?.message || e);
      return NextResponse.json({
        success: true,
        count: 0,
        jobs: [],
        message: 'Database connection unavailable',
      });
    }

    let query: FirebaseFirestore.Query = db.collection('job_postings');


    // Query single equality field if provided to avoid requiring Firestore composite indexes
    if (company) {
      query = query.where('board_token', '==', company);
    } else if (isNewParam === 'true') {
      query = query.where('is_new', '==', true);
    } else if (isNewParam === 'false') {
      query = query.where('is_new', '==', false);
    }

    const snapshot = await query.get();

    let jobs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // In-memory filter for secondary conditions to avoid Firestore index errors
    if (company && isNewParam != null) {
      const isNewBool = isNewParam === 'true';
      jobs = jobs.filter((j) => Boolean(j.is_new) === isNewBool);
    }

    // In-memory text search filtering
    if (search) {
      jobs = jobs.filter((job) => {
        const titleMatch = job.title?.toLowerCase().includes(search);
        const locMatch = job.location?.toLowerCase().includes(search);
        const deptMatch = job.department?.toLowerCase().includes(search);
        const companyMatch = job.company_name?.toLowerCase().includes(search);
        return titleMatch || locMatch || deptMatch || companyMatch;
      });
    }

    // In-memory sort by first_seen_at descending (newest first)
    jobs.sort((a, b) => {
      const timeA = new Date(a.first_seen_at || a.updated_at_remote || 0).getTime();
      const timeB = new Date(b.first_seen_at || b.updated_at_remote || 0).getTime();
      return timeB - timeA;
    });

    if (jobs.length > limit) {
      jobs = jobs.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error: any) {
    console.error('[API /jobs GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
