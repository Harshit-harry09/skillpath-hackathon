// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAdminAuth } from '@/lib/firebase-admin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { nameToColor } from '@/lib/profile-utils';
import type { UserProfile } from '@/types/profile';

export async function GET(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  const nameHint = user.name || 'Skill Explorer';
  const emailHint = user.email || '';

  try {
    const ref = db.collection('profiles').doc(user.uid);
    const snap = await ref.get();

    if (snap.exists) {
      const data = snap.data() as UserProfile;
      return NextResponse.json({ profile: data });
    }

    // First visit — bootstrap profile
    let name = nameHint;
    let email = emailHint;

    try {
      const authService = getAdminAuth();
      if (!email) {
        const authUser = await authService.getUser(user.uid);
        name = authUser.displayName || authUser.email?.split('@')[0] || name;
        email = authUser.email ?? email;
      }
    } catch (e) {
      console.warn('[Profile GET] Could not fetch from Firebase Auth, using fallback info.');
    }

    const profile: UserProfile = {
      uid: user.uid,
      display_name: name,
      email: email,
      avatar_color: nameToColor(name),
      streak_count: 0,
      streak_last_date: '',
      total_skills_learned: 0,
      created_at: new Date().toISOString(),
    };

    await ref.set(profile);
    return NextResponse.json({ profile });
  } catch (e) {
    console.error('[Profile GET]', e);
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let db;
  try { db = getDb(); } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  let body: { display_name?: string; target_role?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  try {
    const update: Partial<UserProfile> = {};
    if (body.display_name?.trim()) {
      update.display_name = body.display_name.trim().slice(0, 60);
      update.avatar_color = nameToColor(update.display_name);
    }
    if (body.target_role !== undefined) {
      update.target_role = body.target_role.trim().slice(0, 80);
    }

    await db.collection('profiles').doc(user.uid).update(update);
    return NextResponse.json({ updated: true });
  } catch (e) {
    console.error('[Profile PATCH]', e);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}
