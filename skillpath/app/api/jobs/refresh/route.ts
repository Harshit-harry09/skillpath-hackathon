// updated
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { refreshCompanyJobs } from '@/lib/greenhouse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/refresh
 * Triggers fetch and sync for all active tracked companies (or single specified company).
 * Body (optional): { company?: string }
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body optional
    }

    const specificCompany = (body?.company || new URL(req.url).searchParams.get('company'))?.trim().toLowerCase();

    const db = getDb();
    let companiesToRefresh: Array<{ board_token: string; display_name?: string }> = [];

    if (specificCompany) {
      const companyDoc = await db.collection('tracked_companies').doc(specificCompany).get();
      if (companyDoc.exists) {
        companiesToRefresh.push({
          board_token: specificCompany,
          display_name: companyDoc.data()?.display_name,
        });
      } else {
        companiesToRefresh.push({ board_token: specificCompany });
      }
    } else {
      const snapshot = await db.collection('tracked_companies').where('active', '==', true).get();
      companiesToRefresh = snapshot.docs.map((doc) => ({
        board_token: doc.id,
        display_name: doc.data().display_name,
      }));
    }

    if (companiesToRefresh.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active tracked companies to refresh.',
        results: [],
      });
    }

    // Refresh each company with ISOLATED error handling per company
    const results = await Promise.all(
      companiesToRefresh.map(async (c) => {
        try {
          return await refreshCompanyJobs(c.board_token, c.display_name);
        } catch (err: any) {
          console.error(`[Refresh Isolated Error] Board "${c.board_token}":`, err);
          return {
            board_token: c.board_token,
            total_remote: 0,
            new_inserted: 0,
            error: err?.message || 'Unknown error during refresh',
          };
        }
      })
    );

    const totalNewInserted = results.reduce((acc, curr) => acc + (curr.new_inserted || 0), 0);

    return NextResponse.json({
      success: true,
      refreshed_count: results.length,
      total_new_jobs_inserted: totalNewInserted,
      results,
    });
  } catch (error: any) {
    console.error('[API /jobs/refresh POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to refresh jobs' },
      { status: 500 }
    );
  }
}
