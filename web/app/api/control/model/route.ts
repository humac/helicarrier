import { NextResponse } from "next/server";
import { requireApiSecret } from "@/lib/v3/auth";

type Body = { provider?: string; model?: string };

export async function POST(request: Request) {
  const auth = requireApiSecret(request);
  if (auth) return auth;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.provider || !body.model) {
    return NextResponse.json({ error: "provider and model are required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, provider: body.provider, model: body.model });
}
