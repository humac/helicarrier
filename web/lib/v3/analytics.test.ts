import { describe, expect, it } from "vitest";
import { buildPerformanceMatrix, buildUsageAnalytics } from "@/lib/v3/analytics";

const ledger = [
  { sessionId: "a", agentId: "peter", modelId: "gpt", status: "success", startedAt: "2026-02-18T00:00:00.000Z", runtimeMs: 1000, artifactCount: 0, ingestedAt: "", agentLabel: "p", },
  { sessionId: "b", agentId: "peter", modelId: "gpt", status: "failed", startedAt: "2026-02-18T01:00:00.000Z", runtimeMs: 2000, artifactCount: 0, ingestedAt: "", agentLabel: "p", },
  { sessionId: "c", agentId: "tony", modelId: "claude", status: "success", startedAt: "2026-02-18T02:00:00.000Z", runtimeMs: 3000, artifactCount: 0, ingestedAt: "", agentLabel: "t", },
] as const;

const usage = [
  { sessionId: "a", runtimeMs: 1000, totalTokens: 100, costUsd: 0.1, costConfidence: "exact", computedAt: "" },
  { sessionId: "b", runtimeMs: 2000, totalTokens: 300, costUsd: 0.3, costConfidence: "exact", computedAt: "" },
  { sessionId: "c", runtimeMs: 3000, totalTokens: 500, costUsd: 0.5, costConfidence: "exact", computedAt: "" },
] as const;

describe("v3 analytics", () => {
  it("builds usage totals and series", () => {
    const payload = buildUsageAnalytics([...ledger], [...usage], { agent: "peter" });
    expect(payload.totals.runs).toBe(2);
    expect(payload.totals.tokens).toBe(400);
    expect(payload.totals.costUsd).toBe(0.4);
    expect(payload.series).toHaveLength(1);
  });

  it("builds performance matrix with sample warning", () => {
    const rows = buildPerformanceMatrix([...ledger], [...usage], {}, 5);
    const gpt = rows.find((row) => row.modelId === "gpt");
    expect(gpt?.runsTotal).toBe(2);
    expect(gpt?.successCount).toBe(1);
    expect(gpt?.failureCount).toBe(1);
    expect(gpt?.sampleWarning).toBe(true);
    expect(gpt?.failedDrilldown.model).toBe("gpt");
  });
});
