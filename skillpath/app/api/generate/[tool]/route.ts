import { NextRequest, NextResponse } from "next/server";
import { runGeneratorTool } from "@/lib/ai/generator-factory";
import { GeneratorToolId } from "@/lib/ai/generator-registry";
import { getAuthUserSafe } from "@/lib/auth-helpers";
import { guardAiRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const resolvedParams = await params;
  const toolId = resolvedParams.tool as GeneratorToolId;

  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return rateLimitError;
    const body = await req.json().catch(() => ({}));
    const result = await runGeneratorTool(toolId, body);
    return NextResponse.json({
      ...result.data,
      fallback: result.fallback,
      source: result.source,
    });
  } catch (error) {
    console.error(`[Generator Tool Route Error] tool=${toolId}:`, error);
    return NextResponse.json(
      { error: "bad_request", message: error instanceof Error ? error.message : "Invalid input payload" },
      { status: 400 }
    );
  }
}
