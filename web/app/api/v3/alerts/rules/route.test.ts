import { beforeEach, describe, expect, it, vi } from "vitest";

const listAlertRules = vi.fn();
const putAlertRule = vi.fn();

vi.mock("@/lib/v3/store", () => ({ listAlertRules, putAlertRule }));

describe("/api/v3/alerts/rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HELICARRIER_SECRET = "test-secret";
  });

  it("rejects invalid rule payload", async () => {
    const { POST } = await import("@/app/api/v3/alerts/rules/route");
    const res = await POST(new Request("http://localhost", {
      method: "POST",
      headers: { "x-secret-key": "test-secret", "content-type": "application/json" },
      body: JSON.stringify({ metric: "failure_rate" }),
    }));
    expect(res.status).toBe(400);
  });

  it("creates a valid rule", async () => {
    const { POST } = await import("@/app/api/v3/alerts/rules/route");
    const res = await POST(new Request("http://localhost", {
      method: "POST",
      headers: { "x-secret-key": "test-secret", "content-type": "application/json" },
      body: JSON.stringify({
        metric: "failure_rate",
        scopeType: "global",
        warnThreshold: 0.2,
        criticalThreshold: 0.5,
        window: "24h",
        comparison: "gte",
      }),
    }));
    expect(res.status).toBe(201);
    expect(putAlertRule).toHaveBeenCalledOnce();
  });

  it("lists rules", async () => {
    listAlertRules.mockResolvedValue([{ ruleId: "r1" }]);
    const { GET } = await import("@/app/api/v3/alerts/rules/route");
    const res = await GET(new Request("http://localhost", { headers: { "x-secret-key": "test-secret" } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ rows: [{ ruleId: "r1" }] });
  });
});
