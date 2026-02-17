"use client";

import { useEffect, useMemo, useState } from "react";
import AgentCard from "./AgentCard";

type AgentStatus = "idle" | "active" | "error" | "thinking";

type LogEntry = {
  ts: string;
  level: string;
  msg: string;
};

type AgentDef = {
  name: string;
  role: string;
  load: string;
};

const BASE_AGENTS: AgentDef[] = [
  { name: "JARVIS PRIME", role: "Orchestrator", load: "34%" },
  { name: "@tony", role: "Architect", load: "2%" },
  { name: "@peter", role: "Developer", load: "89%" },
  { name: "@heimdall", role: "QA Sentry", load: "5%" },
];

function inferStatus(agent: string, logs: LogEntry[]): AgentStatus {
  const lowerAgent = agent.toLowerCase();

  for (let i = logs.length - 1; i >= 0; i--) {
    const line = `${logs[i].level} ${logs[i].msg}`.toLowerCase();
    const mentionsAgent = line.includes(lowerAgent) || (agent === "JARVIS PRIME" && line.includes("jarvis"));

    if (!mentionsAgent && agent !== "JARVIS PRIME") {
      continue;
    }

    if (line.includes("error") || line.includes("failed") || line.includes("exception")) {
      return "error";
    }
    if (line.includes("thinking") || line.includes("planning") || line.includes("analyzing")) {
      return "thinking";
    }
    if (
      line.includes("spawned agent") ||
      line.includes("spawning agent") ||
      line.includes("running") ||
      line.includes("started") ||
      line.includes("active")
    ) {
      return "active";
    }
    if (line.includes("done") || line.includes("completed") || line.includes("idle") || line.includes("waiting")) {
      return "idle";
    }
  }

  return "idle";
}

export default function HeroGrid() {
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
          setLogs(Array.isArray(data.logs) ? data.logs : []);
        }
      } catch {
        // keep previous state on transient failures
      }
    };

    fetchLogs();
    const id = setInterval(fetchLogs, 2000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const agents = useMemo(
    () =>
      BASE_AGENTS.map((agent) => ({
        ...agent,
        status: inferStatus(agent.name, logs),
      })),
    [logs],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {agents.map((agent) => (
        <AgentCard key={agent.name} agent={agent.name} role={agent.role} status={agent.status} load={agent.load} />
      ))}
    </div>
  );
}
