import { beforeEach, describe, expect, it } from "vitest";

describe("POST /api/control/model", () => {
  beforeEach(() => {
    process.env.HELICARRIER_SECRET = "test-secret";
  });

  it("rejects unauthorized", async () => {
    const { POST } = await import("@/app/api/control/model/route");
    const res = await POST(new Request("http://localhost/api/control/model", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("accepts provider+model", async () => {
    const { POST } = await import("@/app/api/control/model/route");
    const res = await POST(new Request("http://localhost/api/control/model", {
      method: "POST",
      headers: { "x-secret-key": "test-secret", "content-type": "application/json" },
      body: JSON.stringify({ provider: "openai", model: "gpt-5" }),
    }));
    expect(res.status).toBe(200);
  });
});
