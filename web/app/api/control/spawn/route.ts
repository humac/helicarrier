import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type SpawnPayload = {
  agentId?: string;
  prompt?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function extractSessionId(output: string): string | null {
  const trimmed = output.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as { sessionId?: string };
    if (parsed?.sessionId) {
      return parsed.sessionId;
    }
  } catch {
    // fall through to regex parsing
  }

  const match = trimmed.match(/session(?:Id)?[:=\s]+([\w:-]+)/i);
  return match?.[1] ?? null;
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

  let payload: SpawnPayload;
  try {
    payload = (await request.json()) as SpawnPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const agentId = payload.agentId?.trim();
  const prompt = payload.prompt?.trim();

  if (!agentId || !prompt) {
    return NextResponse.json({ error: "agentId and prompt are required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  console.log(`[AUDIT] control.spawn ip=${ip} agentId=${agentId}`);

  try {
    const { stdout, stderr } = await execFileAsync("openclaw", ["sessions", "spawn", agentId, prompt]);
    const output = (stdout || stderr || "").trim();

    return NextResponse.json({
      ok: true,
      sessionId: extractSessionId(output),
      output,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to spawn session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
