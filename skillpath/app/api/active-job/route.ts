import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { computeReadiness, nextPinColor } from '@/lib/readiness';
import type { ActiveJob, TrackedSkill, SkillState, AppRole } from '@/types/active-job';

export const dynamic = 'force-dynamic';

function inferRoleCategory(skillName: string): AppRole {
  const lower = skillName.toLowerCase();
  if (lower.includes('admin') || lower.includes('devops') || lower.includes('docker') || lower.includes('kubernetes') || lower.includes('aws') || lower.includes('cloud')) return 'admin';
  if (lower.includes('security') || lower.includes('compliance') || lower.includes('audit') || lower.includes('auth') || lower.includes('governance')) return 'authority';
  if (lower.includes('health') || lower.includes('hipaa') || lower.includes('medical') || lower.includes('clinical') || lower.includes('hospital')) return 'hospital';
  if (lower.includes('flaw') || lower.includes('investigat') || lower.includes('debug') || lower.includes('fraud') || lower.includes('forensic')) return 'investigator';
  if (lower.includes('review') || lower.includes('quality') || lower.includes('testing') || lower.includes('qa') || lower.includes('code review')) return 'reviewer';
  return 'user';
}

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

    const job = doc.data() as ActiveJob;
    const roleParam = req.nextUrl.searchParams.get('role') as AppRole | null;

    // Ensure all skills have inferred role categories
    const enrichedSkills = job.skills.map(s => ({
      ...s,
      role_category: s.role_category || inferRoleCategory(s.skill),
    }));

    const filteredSkills = (roleParam && roleParam !== ('all' as any))
      ? enrichedSkills.filter(s => s.role_category === roleParam)
      : enrichedSkills;

    return NextResponse.json({
      active_job: {
        ...job,
        skills: filteredSkills,
        current_role_filter: roleParam || undefined,
      }
    });
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
      role_category: s.role_category || inferRoleCategory(s.skill),
      premium: typeof s.premium === 'number' ? s.premium : undefined,
    }));

    const resumeSkills = Array.isArray(body.resume_skills) ? body.resume_skills : [];
    const baselineScore = typeof body.readiness_score === 'number' ? body.readiness_score : undefined;
    const initialScore = computeReadiness(skills, resumeSkills, baselineScore);

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
      readiness_score: initialScore,
      baseline_score: baselineScore ?? initialScore,
      resume_skills: resumeSkills,
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

// ── PATCH — update skill state and reflection note ──────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUserSafe(req);
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    let db;
    try { db = getDb(); } catch {
      return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
    }

    let body: { skill: string; state?: SkillState; note?: string; role_category?: AppRole };
    try {
      const rawText = await req.text();
      body = JSON.parse(rawText);
    } catch (parseErr) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    if (!body.skill) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const ref = db.collection('active_jobs').doc(user.uid);
    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'no_active_job' }, { status: 404 });
    }

    const job = doc.data() as ActiveJob;
    const updatedSkills = job.skills.map(s => {
      if (s.skill !== body.skill) return s;

      const updated: TrackedSkill = { ...s };

      if (body.state) {
        updated.state = body.state;
        if (body.state === 'learned') {
          updated.learned_at = new Date().toISOString();
        } else {
          delete updated.learned_at;
        }
      }

      if (typeof body.note === 'string') {
        updated.note = body.note.trim();
        updated.note_updated_at = new Date().toISOString();
      }

      if (body.role_category) {
        updated.role_category = body.role_category;
      } else if (!updated.role_category) {
        updated.role_category = inferRoleCategory(s.skill);
      }

      return updated;
    });

    const newScore = computeReadiness(updatedSkills, job.resume_skills, job.baseline_score);

    // Find the next highest-priority un-started skill
    const nextSkill = updatedSkills
      .filter(s => s.state === 'not_started')
      .sort((a, b) => (a.priority || 3) - (b.priority || 3))[0] ?? null;

    await ref.update({
      skills: updatedSkills,
      readiness_score: newScore
    });

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
    }, { status: 500 });
  }
}
