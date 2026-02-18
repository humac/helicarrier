import { describe, expect, it } from "vitest";
import { ContractError, adaptEnvelope, normalizeEnvelope } from "@/lib/v3/contract";

describe("v4.1 contract", () => {
  it("fails closed on unknown envelope version", () => {
    expect(() => normalizeEnvelope({ envelope_version: "v9", payload: {} }, true)).toThrow(ContractError);
  });

  it("adapts v2 payload into canonical session", () => {
    const env = normalizeEnvelope({
      envelope_version: "v2",
      payload: {
        run: { sessionId: "s-1", state: "completed", agentId: "peter", modelId: "gpt-5", startedAt: "2026-02-18T00:00:00.000Z" },
      },
    }, true);

    const adapted = adaptEnvelope(env);
    expect(adapted.session.sessionId).toBe("s-1");
    expect(adapted.idempotencyKey).toBe("s-1");
  });
});
