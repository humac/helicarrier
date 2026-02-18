import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchGatewayStatusData = vi.fn();

vi.mock("@/lib/gatewayClient", () => ({
  fetchGatewayStatusData,
}));

describe("GET /api/system/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.HELICARRIER_SECRET = "test-secret";
  });

  it("returns 401 on missing secret", async () => {
    const { GET } = await import("@/app/api/system/status/route");
    const response = await GET(new Request("http://localhost/api/system/status"));

    expect(response.status).toBe(401);
  });

  it("returns normalized schema with allowed enum values", async () => {
    fetchGatewayStatusData.mockResolvedValue({
      healthy: true,
      agents: [{ id: "peter", name: "@peter" }],
      sessions: [{ agentId: "peter", state: "running", updatedAt: "2026-02-17T21:44:58.000Z" }],
    });

    const { GET } = await import("@/app/api/system/status/route");
    const response = await GET(
      new Request("http://localhost/api/system/status", {
        headers: { "x-secret-key": "test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.source).toBe("gateway-ws");
    expect(data.gateway).toEqual({ connected: true, healthy: true });
    expect(data.agents).toHaveLength(1);
    expect(["running", "idle", "failed", "done"]).toContain(data.agents[0].status);
    expect(data.agents[0]).toMatchObject({ id: "peter", name: "@peter", status: "running" });
  });

  it("returns degraded payload when gateway unavailable", async () => {
    fetchGatewayStatusData.mockRejectedValue(new Error("gateway down"));

    const { GET } = await import("@/app/api/system/status/route");
    const response = await GET(
      new Request("http://localhost/api/system/status", {
        headers: { "x-secret-key": "test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.gateway.connected).toBe(false);
    expect(data.gateway.healthy).toBe(false);
    expect(Array.isArray(data.agents)).toBe(true);
  });
});
