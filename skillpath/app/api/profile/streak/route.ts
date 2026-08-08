// app/api/profile/streak/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { todayISO } from '@/lib/profile-utils';
import type { UserProfile } from '@/types/profile';

export async function POST(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const ref = db.collection('profiles').doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'no_profile' }, { status: 404 });

    const profile = snap.data() as UserProfile;
    const today = todayISO();

    // Already updated today — no change needed
    if (profile.streak_last_date === today) {
      return NextResponse.json({ streak: profile.streak_count });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    // Continued streak or start new one
    const newStreak = profile.streak_last_date === yesterdayISO
      ? profile.streak_count + 1
      : 1;

    await ref.update({
      streak_count: newStreak,
      streak_last_date: today,
      total_skills_learned: (profile.total_skills_learned || 0) + 1,
    });

    return NextResponse.json({ streak: newStreak });
  } catch (e) {
    console.error('[Streak POST]', e);
    return NextResponse.json({ error: 'streak_failed' }, { status: 500 });
  }
}
