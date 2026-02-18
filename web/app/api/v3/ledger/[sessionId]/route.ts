import { NextResponse } from "next/server";
import { requireApiSecret } from "@/lib/v3/auth";
import { getSessionDetail } from "@/lib/v3/store";

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  const { sessionId } = await params;
  const detail = await getSessionDetail(sessionId);
  if (!detail.ledger) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
