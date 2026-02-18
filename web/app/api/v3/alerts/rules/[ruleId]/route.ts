import { NextResponse } from "next/server";
import { requireApiSecret } from "@/lib/v3/auth";
import { patchAlertRule } from "@/lib/v3/store";
import { AlertRule } from "@/lib/v3/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ ruleId: string }> }) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  let patch: Partial<AlertRule>;
  try {
    patch = (await request.json()) as Partial<AlertRule>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { ruleId } = await params;
  const updated = await patchAlertRule(ruleId, patch);
  if (!updated) return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  return NextResponse.json(updated);
}
