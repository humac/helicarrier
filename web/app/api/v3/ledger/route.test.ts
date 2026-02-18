import { beforeEach, describe, expect, it, vi } from "vitest";

const queryLedger = vi.fn();
vi.mock("@/lib/v3/store", () => ({ queryLedger }));

describe("GET /api/v3/ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HELICARRIER_SECRET = "test-secret";
  });

  it("returns 401 without secret", async () => {
    const { GET } = await import("@/app/api/v3/ledger/route");
    const res = await GET(new Request("http://localhost/api/v3/ledger"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid sort", async () => {
    const { GET } = await import("@/app/api/v3/ledger/route");
    const res = await GET(new Request("http://localhost/api/v3/ledger?sort=bad", { headers: { "x-secret-key": "test-secret" } }));
    expect(res.status).toBe(400);
  });

  it("passes filters to query layer", async () => {
    queryLedger.mockResolvedValue({ rows: [{ sessionId: "s1" }], total: 1 });
    const { GET } = await import("@/app/api/v3/ledger/route");
    const res = await GET(new Request("http://localhost/api/v3/ledger?agent=peter&sort=runtime", { headers: { "x-secret-key": "test-secret" } }));
    expect(res.status).toBe(200);
    expect(queryLedger).toHaveBeenCalledWith(expect.objectContaining({ agent: "peter", sort: "runtime" }));
  });
});
