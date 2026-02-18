export type CanonicalStatus = "running" | "idle" | "failed" | "done";

export type StatusAgent = {
  id: string;
  name: string;
  status: CanonicalStatus;
  lastActivityAt: string | null;
  reason: string;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function extractAgentId(input: UnknownRecord): string {
  return (
    asString(input.id) ??
    asString(input.agentId) ??
    asString(input.name) ??
    asString(input.label) ??
    "unknown"
  );
}

function extractSessionAgentId(input: UnknownRecord): string | undefined {
  return (
    asString(input.agentId) ??
    asString(input.agent_id) ??
    asString(asRecord(input.agent).id) ??
    asString(asRecord(input.agent).name)
  );
}

function pickTimestamp(input: UnknownRecord): string | null {
  const candidate =
    asString(input.lastActivityAt) ??
    asString(input.updatedAt) ??
    asString(input.createdAt) ??
    asString(input.finishedAt) ??
    asString(input.endedAt) ??
    null;

  return candidate;
}

function statusRank(status: CanonicalStatus): number {
  return {
    failed: 4,
    running: 3,
    done: 2,
    idle: 1,
  }[status];
}

export function sessionToCanonicalStatus(session: unknown): CanonicalStatus {
  const s = asRecord(session);
  const state = (asString(s.state) ?? asString(s.status) ?? "").toLowerCase();
  const error = s.error;

  if (typeof error === "string" && error.trim()) {
    return "failed";
  }
  if (error && typeof error === "object" && Object.keys(error as object).length > 0) {
    return "failed";
  }

  if (["error", "failed", "crashed"].some((v) => state.includes(v))) {
    return "failed";
  }

  if (["running", "active", "in_progress", "processing", "executing"].some((v) => state.includes(v))) {
    return "running";
  }

  if (["done", "completed", "finished", "success", "succeeded"].some((v) => state.includes(v))) {
    return "done";
  }

  return "idle";
}

export function normalizeAgentStatuses(params: {
  agents: unknown[];
  sessions: unknown[];
}): StatusAgent[] {
  const sessionsByAgent = new Map<string, unknown[]>();

  for (const rawSession of params.sessions ?? []) {
    const session = asRecord(rawSession);
    const agentId = extractSessionAgentId(session);
    if (!agentId) continue;

    const prev = sessionsByAgent.get(agentId) ?? [];
    prev.push(rawSession);
    sessionsByAgent.set(agentId, prev);
  }

  return (params.agents ?? []).map((rawAgent) => {
    const agent = asRecord(rawAgent);
    const id = extractAgentId(agent);
    const name = asString(agent.name) ?? id;
    const sessions = sessionsByAgent.get(id) ?? [];

    let status: CanonicalStatus = "idle";
    let reason = "no active session";
    let lastActivityAt = pickTimestamp(agent);

    for (const rawSession of sessions) {
      const session = asRecord(rawSession);
      const candidate = sessionToCanonicalStatus(rawSession);
      if (statusRank(candidate) > statusRank(status)) {
        status = candidate;
        reason =
          candidate === "failed"
            ? "session error"
            : candidate === "running"
              ? "active session"
              : candidate === "done"
                ? "last session completed"
                : "idle";
      }

      const ts = pickTimestamp(session);
      if (ts) {
        lastActivityAt = ts;
      }
    }

    return { id, name, status, reason, lastActivityAt };
  });
}
