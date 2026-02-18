import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import IntelligencePanel from "@/components/dashboard/IntelligencePanel";

describe("IntelligencePanel", () => {
  it("renders model sample warning style", async () => {
    const fetchMock = vi.spyOn(global, "fetch" as never).mockImplementation((url: string | URL | Request) => {
      if (String(url).includes("/usage")) {
        return Promise.resolve(new Response(JSON.stringify({ totals: { runs: 1, tokens: 10, runtimeMs: 1000, costUsd: 0.01 } }))) as never;
      }
      if (String(url).includes("/performance")) {
        return Promise.resolve(new Response(JSON.stringify({ rows: [{ modelId: "gpt", runsTotal: 1, successRate: 1, medianRuntimeMs: 1000, medianCostUsd: 0.01, sampleWarning: true }] }))) as never;
      }
      return Promise.resolve(new Response(JSON.stringify({ rows: [] }))) as never;
    });

    render(<IntelligencePanel />);

    await waitFor(() => screen.getByText("gpt"));
    const costs = screen.getAllByText("$0.0100");
    expect(costs.at(-1)?.className).toContain("text-amber-400");
    fetchMock.mockRestore();
  });
});
