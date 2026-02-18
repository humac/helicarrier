import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExecFile = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: mockExecFile,
  default: { execFile: mockExecFile },
}));

describe("POST /api/control/spawn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.HELICARRIER_SECRET = "test-secret";
  });

  it("returns 401 when secret is missing", async () => {
    const { POST } = await import("@/app/api/control/spawn/route");
    const res = await POST(new Request("http://localhost/api/control/spawn", { method: "POST" }));

    expect(res.status).toBe(401);
  });

  it("returns 400 for missing payload fields", async () => {
    const { POST } = await import("@/app/api/control/spawn/route");
    const res = await POST(
      new Request("http://localhost/api/control/spawn", {
        method: "POST",
        headers: { "x-secret-key": "test-secret", "content-type": "application/json" },
        body: JSON.stringify({ agentId: "peter" }),
      }),
    );

    expect(res.status).toBe(400);
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it("executes openclaw sessions spawn", async () => {
    mockExecFile.mockImplementation((_cmd, _args, cb) => cb(null, '{"sessionId":"sess-1"}', ""));

    const { POST } = await import("@/app/api/control/spawn/route");
    const res = await POST(
      new Request("http://localhost/api/control/spawn", {
        method: "POST",
        headers: { "x-secret-key": "test-secret", "content-type": "application/json" },
        body: JSON.stringify({ agentId: "peter", prompt: "build this" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockExecFile).toHaveBeenCalledWith(
      "openclaw",
      ["sessions", "spawn", "peter", "build this"],
      expect.any(Function),
    );

    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
