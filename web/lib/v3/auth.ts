import { NextResponse } from "next/server";

export function requireApiSecret(request: Request): NextResponse | null {
  const expectedSecret = process.env.HELICARRIER_SECRET ?? process.env.OPENCLAW_AUTH_TOKEN;
  const providedSecret = request.headers.get("x-secret-key");

  if (!expectedSecret) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
