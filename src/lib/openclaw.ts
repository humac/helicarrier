import {
  type Session,
  type HistoryEntry,
  type CronJob,
  type CronRun,
  type MemoryResult,
  type FileResult,
  type SystemStatus,
} from "@/lib/types";

/**
 * Gateway envelope response structure
 * Gateway returns: { ok, result: { content: [{ type: "text", text: "<JSON>" }] } }
 */
export interface GatewayEnvelope {
  ok: boolean;
  result: {
    content: Array<{
      type: "text";
      text: string;
    }>;
    details?: unknown;
  };
}

/**
 * Unwraps gateway envelope and parses JSON content
 * Gateway returns: { ok, result: { content: [{ type: "text", text: "<JSON>" }] } }
 */
function unwrap<T>(envelope: GatewayEnvelope): T {
  if (!envelope.ok || !envelope.result?.content?.length) {
    throw new Error("Invalid gateway response");
  }

  const textContent = envelope.result.content.find((c) => c.type === "text")?.text;
  if (!textContent) {
    throw new Error("No text content in gateway response");
  }

  try {
    return JSON.parse(textContent) as T;
  } catch {
    // Some responses may be plain text, return as-is
    return textContent as unknown as T;
  }
}

/**
 * OpenClaw Gateway Client
 * All gateway calls are server-side via /tools/invoke endpoint
 */
export class OpenClawClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.OPENCLAW_GATEWAY_URL!;
    this.token = process.env.OPENCLAW_GATEWAY_TOKEN!;
  }

  /**
   * Invoke a tool via the gateway
   */
  async invoke(tool: string, params: unknown): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ tool, params }),
    });

    if (!res.ok) {
      throw new Error(`Gateway error: ${res.status}`);
    }

    const envelope: GatewayEnvelope = await res.json();
    if (!envelope.ok) {
      throw new Error("Gateway invocation failed");
    }

    return unwrap(envelope);
  }
}

// Singleton instance
export const openclaw = new OpenClawClient();

// === Typed Tool Wrappers ===

/**
 * List all active sessions
 */
export async function listSessions(): Promise<Session[]> {
  return openclaw.invoke("sessions_list", {}) as Promise<Session[]>;
}

/**
 * Get history for a specific session
 */
export async function getSessionHistory(sessionId: string): Promise<HistoryEntry[]> {
  return openclaw.invoke("sessions_history", { sessionId }) as Promise<HistoryEntry[]>;
}

/**
 * List all cron jobs
 */
export async function listCronJobs(): Promise<CronJob[]> {
  return openclaw.invoke("cron", { action: "list" }) as Promise<CronJob[]>;
}

/**
 * Get runs for a specific cron job
 */
export async function getCronRuns(jobId: string): Promise<CronRun[]> {
  return openclaw.invoke("cron", { action: "runs", jobId }) as Promise<CronRun[]>;
}

/**
 * Search memory with a query
 */
export async function searchMemory(query: string, limit = 10): Promise<MemoryResult[]> {
  return openclaw.invoke("memory_search", { query, limit }) as Promise<MemoryResult[]>;
}

/**
 * Get system status
 */
export async function getSessionStatus(): Promise<SystemStatus> {
  return openclaw.invoke("session_status", {}) as Promise<SystemStatus>;
}

// Export utility functions
export { unwrap };
