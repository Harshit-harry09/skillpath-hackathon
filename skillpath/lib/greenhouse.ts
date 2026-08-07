/**
 * Greenhouse API Integration & Sync Utility
 */

import { getDb } from '@/lib/firebase-admin';

export interface GreenhouseJob {
  id: number | string;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  location?: {
    name?: string;
  } | string;
  content?: string;
  departments?: Array<{
    id: number;
    name: string;
  }>;
  offices?: Array<{
    id: number;
    name: string;
  }>;
}

export interface GreenhouseBoardResponse {
  jobs: GreenhouseJob[];
  meta?: {
    total: number;
  };
}

export interface TrackedCompanyDoc {
  board_token: string;
  display_name: string;
  active: boolean;
  added_at: string;
  added_by?: string;
  last_refreshed_at: string | null;
  last_status: 'success' | 'error' | 'pending';
  last_error_message: string | null;
  job_count: number;
  new_job_count: number;
}

export interface JobPostingDoc {
  id: string; // ${board_token}_${gh_id}
  gh_id: number;
  board_token: string;
  company_name: string;
  title: string;
  location: string;
  department: string;
  absolute_url: string;
  content_html: string;
  first_seen_at: string;
  updated_at_remote: string;
  is_new: boolean;
  seen_at: string | null;
}

/**
 * Validates a Greenhouse board token by performing a lightweight fetch.
 */
export async function validateGreenhouseBoardToken(boardToken: string): Promise<{
  valid: boolean;
  totalJobs: number;
  sampleTitle?: string;
  error?: string;
}> {
  const token = boardToken.trim().toLowerCase();
  if (!token || !/^[a-z0-9_-]+$/i.test(token)) {
    return { valid: false, totalJobs: 0, error: 'Invalid board token format. Use alphanumeric characters and hyphens.' };
  }

  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=false`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 },
    });

    if (res.status === 404) {
      return { valid: false, totalJobs: 0, error: `Company board "${token}" not found on Greenhouse.` };
    }

    if (!res.ok) {
      return { valid: false, totalJobs: 0, error: `Greenhouse API returned HTTP ${res.status}.` };
    }

    const data: GreenhouseBoardResponse = await res.json();
    if (!Array.isArray(data.jobs)) {
      return { valid: false, totalJobs: 0, error: 'Unexpected response layout from Greenhouse API.' };
    }

    return {
      valid: true,
      totalJobs: data.jobs.length,
      sampleTitle: data.jobs[0]?.title,
    };
  } catch (err: any) {
    return { valid: false, totalJobs: 0, error: err?.message || 'Network error reaching Greenhouse API.' };
  }
}

/**
 * Fetch postings from Greenhouse API for a given board token.
 */
export async function fetchGreenhouseJobs(boardToken: string): Promise<GreenhouseJob[]> {
  const token = boardToken.trim().toLowerCase();
  const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
  
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Greenhouse API error for board "${token}": HTTP ${res.status}`);
  }

  const data: GreenhouseBoardResponse = await res.json();
  return data.jobs || [];
}

/**
 * Refresh job postings in Firestore for a single company board.
 * Implements strict deduplication on Greenhouse `id`.
 */
export async function refreshCompanyJobs(boardToken: string, companyName?: string): Promise<{
  board_token: string;
  total_remote: number;
  new_inserted: number;
  error: string | null;
}> {
  const token = boardToken.trim().toLowerCase();
  const db = getDb();
  const companyRef = db.collection('tracked_companies').doc(token);

  try {
    const ghJobs = await fetchGreenhouseJobs(token);
    const now = new Date().toISOString();

    // Retrieve existing job IDs for this company to avoid unnecessary reads/writes
    const existingSnapshot = await db
      .collection('job_postings')
      .where('board_token', '==', token)
      .select('gh_id', 'is_new')
      .get();

    const existingGhIds = new Set<number>();
    let existingNewCount = 0;

    existingSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.gh_id != null) {
        existingGhIds.add(Number(data.gh_id));
      }
      if (data.is_new) {
        existingNewCount++;
      }
    });

    let newInsertedCount = 0;
    const batchSize = 400; // Firestore batch limit is 500
    let batch = db.batch();
    let pendingInBatch = 0;

    for (const ghJob of ghJobs) {
      const ghId = Number(ghJob.id);
      if (isNaN(ghId)) continue;

      // Skip existing posting — STRICT DEDUPLICATION KEYED ON GREENHOUSE ID
      if (existingGhIds.has(ghId)) {
        continue;
      }

      // Format fields
      const loc = typeof ghJob.location === 'object' && ghJob.location !== null
        ? ghJob.location.name || 'Remote / Unspecified'
        : String(ghJob.location || 'Remote / Unspecified');

      const dept = Array.isArray(ghJob.departments) && ghJob.departments.length > 0
        ? ghJob.departments.map((d) => d.name).filter(Boolean).join(', ')
        : 'General';

      const docId = `${token}_${ghId}`;
      const postingRef = db.collection('job_postings').doc(docId);

      const newPosting: JobPostingDoc = {
        id: docId,
        gh_id: ghId,
        board_token: token,
        company_name: companyName || token.charAt(0).toUpperCase() + token.slice(1),
        title: ghJob.title || 'Untitled Role',
        location: loc,
        department: dept,
        absolute_url: ghJob.absolute_url || `https://boards.greenhouse.io/${token}/jobs/${ghId}`,
        content_html: ghJob.content || '',
        first_seen_at: now,
        updated_at_remote: ghJob.updated_at || now,
        is_new: true,
        seen_at: null,
      };

      batch.set(postingRef, newPosting);
      newInsertedCount++;
      pendingInBatch++;

      if (pendingInBatch >= batchSize) {
        await batch.commit();
        batch = db.batch();
        pendingInBatch = 0;
      }
    }

    if (pendingInBatch > 0) {
      await batch.commit();
    }

    const totalNewJobs = existingNewCount + newInsertedCount;

    // Update tracked company metadata
    await companyRef.set(
      {
        board_token: token,
        display_name: companyName || token.charAt(0).toUpperCase() + token.slice(1),
        active: true,
        last_refreshed_at: now,
        last_status: 'success',
        last_error_message: null,
        job_count: ghJobs.length,
        new_job_count: totalNewJobs,
      },
      { merge: true }
    );

    return {
      board_token: token,
      total_remote: ghJobs.length,
      new_inserted: newInsertedCount,
      error: null,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Failed to refresh jobs from Greenhouse';
    console.error(`[Greenhouse Sync Error] Company "${token}":`, errorMsg);

    // Update error state without throwing so callers can handle per-company failures cleanly
    try {
      await companyRef.set(
        {
          last_refreshed_at: new Date().toISOString(),
          last_status: 'error',
          last_error_message: errorMsg,
        },
        { merge: true }
      );
    } catch {
      // Ignore DB write error during error tracking
    }

    return {
      board_token: token,
      total_remote: 0,
      new_inserted: 0,
      error: errorMsg,
    };
  }
}
