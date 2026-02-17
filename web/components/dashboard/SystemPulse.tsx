"use client";

import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

type LogEntry = {
  ts: string;
  level: string;
  msg: string;
};

export default function SystemPulse() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    let alive = true;

    const fetchLogs = async () => {
      try {
        const secret = process.env.NEXT_PUBLIC_HELICARRIER_SECRET;
        const res = await fetch("/api/logs", {
          cache: "no-store",
          headers: secret ? { "x-secret-key": secret } : undefined,
        });
        if (!res.ok) return;

        const data = (await res.json()) as { logs?: LogEntry[] };
        if (alive) {
          setLogs(Array.isArray(data.logs) ? data.logs.slice(-80) : []);
        }
      } catch {
        if (alive) {
          setLogs([]);
        }
      }
    };

    fetchLogs();
    const id = setInterval(fetchLogs, 2000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Terminal className="w-3 h-3" />
          SYSTEM_PULSE // LOG_STREAM
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
      </div>
      <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1">
        {logs.length === 0 && <div className="text-zinc-500">No logs available.</div>}

        {logs.map((log, i) => (
          <div key={`${log.ts}-${i}`} className="flex gap-3 border-b border-zinc-900/50 pb-1 mb-1 last:border-0">
            <span className="text-zinc-600">[{log.ts}]</span>
            <span
              className={
                log.level === "WARN"
                  ? "text-yellow-500"
                  : log.level === "EXEC"
                    ? "text-cyan-500"
                    : log.level === "ERROR"
                      ? "text-red-500"
                      : "text-zinc-500"
              }
            >
              {log.level}
            </span>
            <span className="text-zinc-300">{log.msg}</span>
          </div>
        ))}
        <div className="animate-pulse text-cyan-500">_</div>
      </div>
    </div>
  );
}
