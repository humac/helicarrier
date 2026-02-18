import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type KillPayload = {
  sessionId?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const expectedSecret = process.env.HELICARRIER_SECRET ?? process.env.OPENCLAW_AUTH_TOKEN;
  const providedSecret = request.headers.get("x-secret-key");

  if (!expectedSecret) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return unauthorized();
  }

  let payload: KillPayload;
  try {
    payload = (await request.json()) as KillPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const sessionId = payload.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  console.log(`[AUDIT] control.kill ip=${ip} sessionId=${sessionId}`);

  try {
    const { stdout, stderr } = await execFileAsync("openclaw", ["process", "kill", sessionId]);

    return NextResponse.json({
      ok: true,
      sessionId,
      output: stdout?.trim() || stderr?.trim() || "kill signal sent",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to kill session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
