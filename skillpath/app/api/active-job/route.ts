import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { computeReadiness, nextPinColor } from '@/lib/readiness';
import type { ActiveJob, TrackedSkill, SkillState } from '@/types/active-job';

// ── GET — fetch active job ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserSafe(req);
    if (!user) return NextResponse.json({ active_job: null });

    let db;
    try { db = getDb(); } catch {
      return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
    }

    const doc = await db.collection('active_jobs').doc(user.uid).get();
    if (!doc.exists) return NextResponse.json({ active_job: null });

    return NextResponse.json({ active_job: doc.data() as ActiveJob });
  } catch (e: any) {
    console.error('[ActiveJob GET] Crash:', e);
    return NextResponse.json({ error: 'fetch_failed', message: e?.message }, { status: 500 });
  }
}

// ── POST — pin a job ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserSafe(req);
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    let db;
    try { db = getDb(); } catch {
      return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    if (!body.analysis_id || !body.job_title || !body.skills?.length) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // Get history to pick a fresh color
    const historySnap = await db
      .collection('job_history').doc(user.uid).collection('jobs')
      .orderBy('archived_at', 'desc').limit(10).get();
    const usedColors = historySnap.docs.map(d => d.data().color as string);

    const skills: TrackedSkill[] = body.skills.map((s: any) => ({
      ...s,
      state: 'not_started',
      resources_generated: false,
    }));

    const activeJob: ActiveJob = {
      id: `job_${Date.now()}`,
      analysis_id: body.analysis_id,
      job_title: body.job_title,
      company_type: body.company_type,
      role: body.role,
      seniority: body.seniority,
      pinned_at: new Date().toISOString(),
      color: nextPinColor(usedColors),
      skills,
      readiness_score: computeReadiness(skills),
    };

    // Execute archive and write atomically inside a transaction
    await db.runTransaction(async (transaction) => {
      const activeJobRef = db.collection('active_jobs').doc(user.uid);
      const existingDoc = await transaction.get(activeJobRef);

      if (existingDoc.exists) {
        const prev = existingDoc.data() as ActiveJob;
        const historyRef = db
          .collection('job_history')
          .doc(user.uid)
          .collection('jobs')
          .doc(prev.id);

        transaction.set(historyRef, {
          ...prev,
          archived_at: new Date().toISOString(),
          final_score: prev.readiness_score
        });
      }

      transaction.set(activeJobRef, activeJob);
    });

    return NextResponse.json({ active_job: activeJob }, { status: 201 });
  } catch (e: any) {
    console.error('[ActiveJob POST] Crash:', e);
    return NextResponse.json({ error: 'pin_failed', message: e?.message }, { status: 500 });
  }
}

// ── PATCH — update skill state ──────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  console.log('--- [Skill PATCH] Request Started ---');
  try {
    const user = await getAuthUserSafe(req);
    console.log('[Skill PATCH] user:', user?.uid ?? 'NULL');

    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    let db;
    try { db = getDb(); } catch {
      console.error('[Skill PATCH] Database not initialized');
      return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
    }

    let body: { skill: string; state: SkillState };
    try {
      const rawText = await req.text();
      console.log('[Skill PATCH] raw body:', rawText);
      body = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[Skill PATCH] Parse error:', parseErr);
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    if (!body.skill || !body.state) {
      console.error('[Skill PATCH] Missing fields:', body);
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const ref = db.collection('active_jobs').doc(user.uid);
    const doc = await ref.get();

    console.log('[Skill PATCH] doc exists:', doc.exists, 'uid:', user.uid);
    if (!doc.exists) {
      return NextResponse.json({ error: 'no_active_job' }, { status: 404 });
    }

    const job = doc.data() as ActiveJob;
    const updatedSkills = job.skills.map(s => {
      if (s.skill !== body.skill) return s;

      if (body.state === 'learned') {
        return {
          ...s,
          state: body.state,
          learned_at: new Date().toISOString(),
        };
      }

      const { learned_at: _, ...rest } = s;
      return {
        ...rest,
        state: body.state,
      };
    });

    const newScore = computeReadiness(updatedSkills);
    console.log('[Skill PATCH] new score calculated:', newScore);

    // Find the next highest-priority un-started skill
    const nextSkill = updatedSkills
      .filter(s => s.state === 'not_started')
      .sort((a, b) => (a.priority || 3) - (b.priority || 3))[0] ?? null;

    console.log('[Skill PATCH] committing update to Firestore...');
    await ref.update({
      skills: updatedSkills,
      readiness_score: newScore
    });

    console.log('[Skill PATCH] SUCCESS');
    return NextResponse.json({
      readiness_score: newScore,
      next_skill: nextSkill,
      skills: updatedSkills,
    });
  } catch (e: any) {
    console.error('[Skill PATCH] EXCEPTION:', e);
    return NextResponse.json({
      error: 'update_failed',
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined
    }, { status: 500 });
  }
}
