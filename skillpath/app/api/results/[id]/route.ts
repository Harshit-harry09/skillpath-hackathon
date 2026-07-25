/**
 * GET /api/results/[id]
 *
 * Fetch a saved analysis by its share token.
 * Uses lazy Firebase init so a transient boot failure doesn't permanently block reads.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "missing_id", message: "Share token is required." },
        { status: 400 }
      );
    }

    let db;
    try {
      db = getDb();
    } catch (e) {
      console.warn("[Results] Firebase unavailable, returning 404 fallback:", e instanceof Error ? e.message : e);
      return NextResponse.json(
        { error: "not_found", message: "Analysis not found or database unconfigured." },
        { status: 404 }
      );
    }

    // Fetch from Firestore
    const doc = await db.collection("analyses").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "not_found", message: "Analysis not found." },
        { status: 404 }
      );
    }

    const data = doc.data();

    // Strip the raw JD/resume text from public results for privacy
    const { jd_text: _jd, resume_text: _resume, ...publicData } = data as Record<string, unknown>;

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { error: "not_found", message: "Analysis not found." },
      { status: 404 }
    );
  }
}
