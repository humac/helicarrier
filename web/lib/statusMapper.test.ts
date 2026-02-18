import { describe, expect, it } from "vitest";
import { normalizeAgentStatuses, sessionToCanonicalStatus } from "@/lib/statusMapper";

describe("statusMapper", () => {
  it("maps upstream states to canonical statuses", () => {
    expect(sessionToCanonicalStatus({ state: "running" })).toBe("running");
    expect(sessionToCanonicalStatus({ status: "completed" })).toBe("done");
    expect(sessionToCanonicalStatus({ state: "failed" })).toBe("failed");
    expect(sessionToCanonicalStatus({ state: "unknown" })).toBe("idle");
  });

  it("applies tie-break precedence failed > running > done > idle", () => {
    const agents = [{ id: "peter", name: "@peter" }];
    const sessions = [
      { agentId: "peter", state: "completed" },
      { agentId: "peter", state: "running" },
      { agentId: "peter", state: "failed" },
    ];

    const normalized = normalizeAgentStatuses({ agents, sessions });
    expect(normalized[0].status).toBe("failed");
  });

  it("defaults to idle when no matching session exists", () => {
    const normalized = normalizeAgentStatuses({
      agents: [{ id: "tony", name: "@tony" }],
      sessions: [{ agentId: "peter", state: "running" }],
    });

    expect(normalized[0]).toMatchObject({ status: "idle", reason: "no active session" });
  });
});
