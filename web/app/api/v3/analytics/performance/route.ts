import { NextResponse } from "next/server";
import { buildPerformanceMatrix } from "@/lib/v3/analytics";
import { requireApiSecret } from "@/lib/v3/auth";
import { getStoreSnapshot } from "@/lib/v3/store";

export async function GET(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  const store = await getStoreSnapshot();
  const url = new URL(request.url);
  const minSample = Number(url.searchParams.get("minSample") ?? "5");

  const rows = buildPerformanceMatrix(
    store.ledger,
    store.usage,
    {
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      agent: url.searchParams.get("agent") ?? undefined,
      task: url.searchParams.get("task") ?? undefined,
    },
    minSample,
  );

  return NextResponse.json({ rows });
}
