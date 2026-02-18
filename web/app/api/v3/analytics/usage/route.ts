import { NextResponse } from "next/server";
import { buildUsageAnalytics } from "@/lib/v3/analytics";
import { requireApiSecret } from "@/lib/v3/auth";
import { getStoreSnapshot } from "@/lib/v3/store";

export async function GET(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  const store = await getStoreSnapshot();
  const url = new URL(request.url);
  const payload = buildUsageAnalytics(store.ledger, store.usage, {
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    agent: url.searchParams.get("agent") ?? undefined,
    model: url.searchParams.get("model") ?? undefined,
    task: url.searchParams.get("task") ?? undefined,
  });

  return NextResponse.json(payload);
}
