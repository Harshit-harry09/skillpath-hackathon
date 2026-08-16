import { NextRequest, NextResponse } from 'next/server';
import { runRoleSwitchComparisonAgent } from '@/lib/atlas/agent12-role-switch-comparison';
import type { CareerTwinOutput } from '@/lib/atlas/agent4-career-twin';
import { getAuthUserSafe } from '@/lib/auth-helpers';
import { guardAiRequest } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getAuthUserSafe(req);
  const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json().catch(() => ({})) as {
      currentSkills?: unknown;
      targetRole?: unknown;
      comparisonRole?: unknown;
    };
    const targetRole = typeof body.targetRole === 'string' ? body.targetRole.trim() : '';
    const comparisonRole = typeof body.comparisonRole === 'string' ? body.comparisonRole.trim() : undefined;
    const currentSkills = Array.isArray(body.currentSkills)
      ? body.currentSkills.filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0).slice(0, 60)
      : [];

    if (!targetRole || targetRole.length > 120) {
      return NextResponse.json({ success: false, error: 'A target role is required.' }, { status: 400 });
    }

    const twin = { skills: currentSkills.map((name) => ({ name })) } as CareerTwinOutput;
    const data = await runRoleSwitchComparisonAgent(twin, targetRole, comparisonRole);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Atlas Compare API] Failed:', error);
    return NextResponse.json({ success: false, error: 'Atlas could not compare these roles.' }, { status: 500 });
  }
}
