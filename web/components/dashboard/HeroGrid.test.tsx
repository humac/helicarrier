import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeroGrid from "@/components/dashboard/HeroGrid";

vi.mock("@/components/dashboard/AgentCard", () => ({
  default: ({ agent, status }: { agent: string; status: string }) => <div>{`${agent}:${status}`}</div>,
}));

describe("HeroGrid", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders statuses from /api/system/status payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          gateway: { connected: true },
          agents: [
            { id: "peter", name: "@peter", status: "running" },
            { id: "tony", name: "@tony", status: "done" },
          ],
        }),
      }),
    );

    render(<HeroGrid />);

    await waitFor(() => {
      expect(screen.getByText("@peter:running")).toBeTruthy();
      expect(screen.getByText("@tony:done")).toBeTruthy();
    });
  });

  it("renders degraded indicator when gateway is offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          gateway: { connected: false },
          agents: [],
        }),
      }),
    );

    render(<HeroGrid />);

    await waitFor(() => {
      expect(screen.getByText(/Gateway connection degraded/i)).toBeTruthy();
    });
  });
});
