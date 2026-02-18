import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertSession = vi.fn();
vi.mock("@/lib/v3/store", () => ({ upsertSession }));

describe("POST /api/v3/ingest/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HELICARRIER_SECRET = "test-secret";
  });

  it("returns 400 with structured validation error when session is missing", async () => {
    const { POST } = await import("@/app/api/v3/ingest/session/route");
    const res = await POST(new Request("http://localhost/api/v3/ingest/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-secret-key": "test-secret",
      },
      body: JSON.stringify({ envelope_version: "v1", payload: {} }),
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid ingest payload",
        details: [{ field: "session", message: "session object is required" }],
      },
    });
    expect(upsertSession).not.toHaveBeenCalled();
  });

  it("returns 400 when session.state is missing", async () => {
    const { POST } = await import("@/app/api/v3/ingest/session/route");
    const res = await POST(new Request("http://localhost/api/v3/ingest/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-secret-key": "test-secret",
      },
      body: JSON.stringify({
        envelope_version: "v1",
        payload: {
          session: {
            sessionId: "s-1",
            agentId: "peter",
            modelId: "gpt-5",
            startedAt: "2026-02-18T00:00:00.000Z",
          },
        },
      }),
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid ingest payload",
        details: [{ field: "session.state", message: "must be a non-empty string" }],
      },
    });
    expect(upsertSession).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields have invalid types", async () => {
    const { POST } = await import("@/app/api/v3/ingest/session/route");
    const res = await POST(new Request("http://localhost/api/v3/ingest/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-secret-key": "test-secret",
      },
      body: JSON.stringify({
        envelope_version: "v1",
        payload: {
          session: {
            sessionId: 123,
            state: 42,
            agentId: "peter",
            modelId: "gpt-5",
            startedAt: "2026-02-18T00:00:00.000Z",
          },
        },
      }),
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid ingest payload",
        details: [
          { field: "session.sessionId", message: "must be a non-empty string" },
          { field: "session.state", message: "must be a non-empty string" },
        ],
      },
    });
    expect(upsertSession).not.toHaveBeenCalled();
  });
});
