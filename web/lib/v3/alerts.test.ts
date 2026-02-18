import { describe, expect, it } from "vitest";
import { evaluateRule } from "@/lib/v3/alerts";
import { AlertRule } from "@/lib/v3/types";

const rule: AlertRule = {
  ruleId: "r1",
  enabled: true,
  metric: "failure_rate",
  scopeType: "global",
  warnThreshold: 0.2,
  criticalThreshold: 0.8,
  window: "24h",
  comparison: "gte",
  dedupCooldownSec: 300,
  createdAt: "2026-02-18T00:00:00.000Z",
  updatedAt: "2026-02-18T00:00:00.000Z",
};

const usage = [];

const ledger = [
  { sessionId: "1", agentId: "a", agentLabel: "a", modelId: "m", status: "failed", startedAt: "2026-02-18T00:10:00.000Z", runtimeMs: 1, artifactCount: 0, ingestedAt: "" },
  { sessionId: "2", agentId: "a", agentLabel: "a", modelId: "m", status: "success", startedAt: "2026-02-18T00:20:00.000Z", runtimeMs: 1, artifactCount: 0, ingestedAt: "" },
] as const;

describe("alert evaluator", () => {
  it("transitions to warning/critical and dedups unchanged violation", () => {
    const first = evaluateRule(rule, undefined, [...ledger], [...usage], "2026-02-18T01:00:00.000Z");
    expect(first.status).toBe("warning");

    const second = evaluateRule(rule, first, [...ledger], [...usage], "2026-02-18T01:01:00.000Z");
    expect(second.deduped).toBe(true);

    const recover = evaluateRule(rule, second, [{ ...ledger[1] }], [...usage], "2026-02-18T01:10:00.000Z");
    expect(recover.status).toBe("resolved");
  });
});
