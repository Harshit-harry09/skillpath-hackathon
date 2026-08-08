// updated
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    let db;
    try {
      db = getDb();
    } catch {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const doc = await db.collection("explorations").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
