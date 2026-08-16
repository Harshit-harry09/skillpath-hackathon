import { NextRequest, NextResponse } from "next/server";
import { executeAtlasAgentRun } from "@/lib/atlas/atlas-dag-runner";
import type { AtlasSessionState } from "@/lib/atlas/orchestrator";
import { getAuthUserSafe } from "@/lib/auth-helpers";
import { guardAiRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_AGENT_IDS = new Set([
  'agent5_matcher',
  'agent8_roadmap',
  'agent9_inclusion',
  'agent10_simulator',
  'agent14_employer_readiness',
  'full_swarm',
]);

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return rateLimitError;

    const body = await req.json().catch(() => ({})) as {
      agentId?: unknown;
      params?: unknown;
      sessionState?: unknown;
    };
    const agentId = typeof body.agentId === 'string' ? body.agentId : '';
    const params = body.params && typeof body.params === 'object' && !Array.isArray(body.params)
      ? body.params as Record<string, unknown>
      : {};
    const sessionState = body.sessionState && typeof body.sessionState === 'object' && !Array.isArray(body.sessionState)
      ? body.sessionState
      : {};

    if (!ALLOWED_AGENT_IDS.has(agentId)) {
      return NextResponse.json({ success: false, error: "A supported Atlas agentId is required." }, { status: 400 });
    }

    const result = await executeAtlasAgentRun({
      agentId,
      params,
      sessionState: sessionState as AtlasSessionState,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Agent rerun failed.";
    console.error("Agent Rerun API error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
