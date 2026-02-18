"use client";

import { useEffect, useMemo, useState } from "react";
import AgentCard from "./AgentCard";
import KillModal from "./KillModal";

type AgentStatus = "running" | "idle" | "failed" | "done";

type StatusAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  sessionId?: string | null;
};

type StatusResponse = {
  gateway?: { connected?: boolean };
  agents?: StatusAgent[];
};

type AgentDef = {
  id: string;
  name: string;
  role: string;
  load: string;
};

const BASE_AGENTS: AgentDef[] = [
  { id: "jarvis", name: "JARVIS PRIME", role: "Orchestrator", load: "34%" },
  { id: "tony", name: "@tony", role: "Architect", load: "2%" },
  { id: "peter", name: "@peter", role: "Developer", load: "89%" },
  { id: "heimdall", name: "@heimdall", role: "QA Sentry", load: "5%" },
];

export default function HeroGrid() {
  const [statusAgents, setStatusAgents] = useState<StatusAgent[]>([]);
  const [gatewayConnected, setGatewayConnected] = useState(true);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [killLoading, setKillLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    const fetchStatus = async () => {
      try {
        const secret = process.env.NEXT_PUBLIC_HELICARRIER_SECRET;
        const res = await fetch("/api/system/status", {
          cache: "no-store",
          headers: secret ? { "x-secret-key": secret } : undefined,
        });
        if (!res.ok) return;

        const data = (await res.json()) as StatusResponse;
        if (alive) {
          setStatusAgents(Array.isArray(data.agents) ? data.agents : []);
          setGatewayConnected(Boolean(data.gateway?.connected ?? true));
        }
      } catch {
        if (alive) {
          setGatewayConnected(false);
        }
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 2000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const byId = useMemo(() => {
    const map = new Map<string, StatusAgent>();
    for (const agent of statusAgents) {
      map.set(agent.id, agent);
    }
    return map;
  }, [statusAgents]);

  const agents = BASE_AGENTS.map((agent) => {
    const dynamic = byId.get(agent.id);
    return {
      ...agent,
      status: dynamic?.status ?? "idle",
      sessionId: dynamic?.sessionId ?? `${agent.id}-active`,
    };
  });

  const handleKill = async () => {
    if (!targetSessionId) return;
    setKillLoading(true);

    try {
      const secret = process.env.NEXT_PUBLIC_HELICARRIER_SECRET;
      await fetch("/api/control/kill", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(secret ? { "x-secret-key": secret } : {}),
        },
        body: JSON.stringify({ sessionId: targetSessionId }),
      });
    } finally {
      setKillLoading(false);
      setTargetSessionId(null);
    }
  };

  return (
    <>
      {!gatewayConnected && (
        <div className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Gateway connection degraded. Agent cards are showing fallback idle states.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent.name}
            role={agent.role}
            status={agent.status}
            load={agent.load}
            onKill={agent.status === "running" ? () => setTargetSessionId(agent.sessionId) : undefined}
          />
        ))}
      </div>

      <KillModal
        isOpen={Boolean(targetSessionId)}
        sessionId={targetSessionId}
        isLoading={killLoading}
        onConfirm={() => void handleKill()}
        onCancel={() => setTargetSessionId(null)}
      />
    </>
  );
}
