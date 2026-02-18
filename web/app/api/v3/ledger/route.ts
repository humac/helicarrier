import { NextResponse } from "next/server";
import { requireApiSecret } from "@/lib/v3/auth";
import { queryLedger } from "@/lib/v3/store";
import { SortKey } from "@/lib/v3/types";

export async function GET(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const sort = (url.searchParams.get("sort") ?? "newest") as SortKey;
  if (!["newest", "runtime", "cost"].includes(sort)) {
    return NextResponse.json({ error: "Invalid sort value" }, { status: 400 });
  }

  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");

  const result = await queryLedger({
    agent: url.searchParams.get("agent") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    model: url.searchParams.get("model") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    sort,
    page,
    pageSize,
  });

  return NextResponse.json(result);
}
