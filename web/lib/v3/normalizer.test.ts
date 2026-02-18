import { describe, expect, it } from "vitest";
import { deriveRuntimeMs, normalizeStatus, normalizeUsage } from "@/lib/v3/normalizer";

describe("v3 normalizer", () => {
  it("maps provider states into canonical status", () => {
    expect(normalizeStatus("completed")).toBe("success");
    expect(normalizeStatus("error")).toBe("failed");
    expect(normalizeStatus("terminated")).toBe("killed");
    expect(normalizeStatus("active")).toBe("running");
  });

  it("derives runtime using terminal fallback when endedAt missing", () => {
    const runtime = deriveRuntimeMs({
      sessionId: "s1",
      agentId: "peter",
      modelId: "gpt",
      startedAt: "2026-02-18T10:00:00.000Z",
      terminalAt: "2026-02-18T10:00:04.000Z",
      state: "completed",
    });

    expect(runtime).toBe(4000);
  });

  it("sets cost confidence branches", () => {
    const exact = normalizeUsage({
      sessionId: "e",
      agentId: "p",
      modelId: "m",
      startedAt: "2026-02-18T10:00:00.000Z",
      endedAt: "2026-02-18T10:00:01.000Z",
      state: "completed",
      billedCostUsd: 0.12,
    });
    expect(exact.costConfidence).toBe("exact");

    const estimated = normalizeUsage({
      sessionId: "x",
      agentId: "p",
      modelId: "m",
      startedAt: "2026-02-18T10:00:00.000Z",
      endedAt: "2026-02-18T10:00:01.000Z",
      state: "completed",
      totalTokens: 1000,
    });
    expect(estimated.costConfidence).toBe("estimated");

    const unknown = normalizeUsage({
      sessionId: "u",
      agentId: "p",
      modelId: "m",
      startedAt: "2026-02-18T10:00:00.000Z",
      endedAt: "2026-02-18T10:00:01.000Z",
      state: "completed",
    });
    expect(unknown.costConfidence).toBe("unknown");
  });
});
