import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

type LogEntry = {
  ts: string;
  level: string;
  msg: string;
};

const LOG_DIR_CANDIDATES = [
  path.join(os.homedir(), ".openclaw", "state", "logs"),
  path.join(os.homedir(), ".openclaw", "logs"),
];

const LOG_FILE_NAME = "openclaw.log";
const MAX_LINES = 120;

function parseLogLine(line: string): LogEntry | null {
  // Examples handled:
  // 2026-02-17T10:49:00.000Z INFO Spawned agent @peter
  // [2026-02-17 10:49:00] [INFO] Spawned agent @peter
  const m = line.match(/^(?:\[)?(?<ts>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)(?:\])?\s*(?:\[(?<lvl1>[A-Z]+)\]|(?<lvl2>[A-Z]+))\s*(?<msg>.*)$/);
  if (m?.groups) {
    return {
      ts: m.groups.ts,
      level: m.groups.lvl1 ?? m.groups.lvl2 ?? "INFO",
      msg: (m.groups.msg ?? "").trim(),
    };
  }

  if (!line.trim()) {
    return null;
  }

  return {
    ts: new Date().toISOString(),
    level: "INFO",
    msg: line.trim(),
  };
}

async function resolveLogFilePath(): Promise<string | null> {
  for (const dir of LOG_DIR_CANDIDATES) {
    try {
      const stat = await fs.stat(dir);
      if (!stat.isDirectory()) {
        continue;
      }
      const candidate = path.join(dir, LOG_FILE_NAME);
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function GET(request: Request) {
  const expectedSecret = process.env.HELICARRIER_SECRET ?? process.env.OPENCLAW_AUTH_TOKEN;
  const providedSecret = request.headers.get("x-secret-key");

  if (!expectedSecret) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logFilePath = await resolveLogFilePath();

  if (!logFilePath) {
    return NextResponse.json({ logs: [] as LogEntry[] });
  }

  try {
    const raw = await fs.readFile(logFilePath, "utf8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const recent = lines.slice(-MAX_LINES);
    const logs = recent
      .map(parseLogLine)
      .filter((entry): entry is LogEntry => entry !== null);

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] as LogEntry[] });
  }
}
