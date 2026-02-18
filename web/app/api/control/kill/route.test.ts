import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExecFile = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: mockExecFile,
  default: { execFile: mockExecFile },
}));

describe("POST /api/control/kill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.HELICARRIER_SECRET = "test-secret";
  });

  it("returns 401 when secret is missing", async () => {
    const { POST } = await import("@/app/api/control/kill/route");
    const res = await POST(new Request("http://localhost/api/control/kill", { method: "POST" }));

    expect(res.status).toBe(401);
  });

  it("returns 400 when sessionId is missing", async () => {
    const { POST } = await import("@/app/api/control/kill/route");
    const res = await POST(
      new Request("http://localhost/api/control/kill", {
        method: "POST",
        headers: { "x-secret-key": "test-secret", "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it("executes openclaw process kill", async () => {
    mockExecFile.mockImplementation((_cmd, _args, cb) => cb(null, "killed", ""));

    const { POST } = await import("@/app/api/control/kill/route");
    const res = await POST(
      new Request("http://localhost/api/control/kill", {
        method: "POST",
        headers: { "x-secret-key": "test-secret", "content-type": "application/json" },
        body: JSON.stringify({ sessionId: "session-123" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockExecFile).toHaveBeenCalledWith("openclaw", ["process", "kill", "session-123"], expect.any(Function));
  });
});
