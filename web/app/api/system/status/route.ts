import { NextResponse } from "next/server";
import { fetchGatewayStatusData } from "@/lib/gatewayClient";
import { normalizeAgentStatuses } from "@/lib/statusMapper";

const CACHE_TTL_MS = 1000;
const DEGRADED_AFTER_MS = 10_000;

type StatusPayload = {
  generatedAt: string;
  source: "gateway-ws";
  gateway: {
    connected: boolean;
    healthy: boolean;
  };
  agents: ReturnType<typeof normalizeAgentStatuses>;
};

let cache: { at: number; payload: StatusPayload } | null = null;
let lastSuccessAt = 0;
let knownAgents: Array<{ id: string; name: string }> = [];

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const expectedSecret = process.env.HELICARRIER_SECRET ?? process.env.OPENCLAW_AUTH_TOKEN;
  const providedSecret = request.headers.get("x-secret-key");

  if (!expectedSecret) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return unauthorized();
  }

  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload);
  }

  try {
    const gateway = await fetchGatewayStatusData();
    const agents = normalizeAgentStatuses({ agents: gateway.agents, sessions: gateway.sessions });
    knownAgents = agents.map((agent) => ({ id: agent.id, name: agent.name }));

    const payload: StatusPayload = {
      generatedAt: new Date(now).toISOString(),
      source: "gateway-ws",
      gateway: { connected: true, healthy: gateway.healthy },
      agents,
    };

    lastSuccessAt = now;
    cache = { at: now, payload };

    return NextResponse.json(payload);
  } catch {
    const staleMs = now - lastSuccessAt;
    const degrade = staleMs > DEGRADED_AFTER_MS;

    const payload: StatusPayload = {
      generatedAt: new Date(now).toISOString(),
      source: "gateway-ws",
      gateway: { connected: false, healthy: false },
      agents: knownAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        status: "idle" as const,
        reason: "gateway unavailable",
        lastActivityAt: null,
      })),
    };

    if (degrade) {
      cache = { at: now, payload };
      return NextResponse.json(payload);
    }

    if (cache) {
      return NextResponse.json(cache.payload);
    }

    return NextResponse.json(payload);
  }
}
