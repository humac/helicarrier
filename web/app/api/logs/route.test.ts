import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStat = vi.fn();
const mockAccess = vi.fn();
const mockReadFile = vi.fn();

vi.mock("node:fs", () => {
  const promises = {
    stat: mockStat,
    access: mockAccess,
    readFile: mockReadFile,
  };

  return {
    promises,
    default: { promises },
  };
});

describe("GET /api/logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed logs from file", async () => {
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue([
      "2026-02-17T10:49:00.000Z INFO Spawned agent @peter",
      "[2026-02-17 10:49:01] [ERROR] Tool failed",
      "unstructured message",
    ].join("\n"));

    const { GET } = await import("@/app/api/logs/route");
    const response = await GET();
    const data = await response.json();

    expect(data.logs).toHaveLength(3);
    expect(data.logs[0]).toEqual({
      ts: "2026-02-17T10:49:00.000Z",
      level: "INFO",
      msg: "Spawned agent @peter",
    });
    expect(data.logs[1]).toEqual({
      ts: "2026-02-17 10:49:01",
      level: "ERROR",
      msg: "Tool failed",
    });
    expect(data.logs[2].level).toBe("INFO");
    expect(data.logs[2].msg).toBe("unstructured message");
    expect(typeof data.logs[2].ts).toBe("string");
  });

  it("returns empty logs when no log path resolves", async () => {
    mockStat.mockRejectedValue(new Error("missing"));

    const { GET } = await import("@/app/api/logs/route");
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ logs: [] });
    expect(mockReadFile).not.toHaveBeenCalled();
  });
});
