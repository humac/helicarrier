import { createHash } from "node:crypto";
import { ProviderPayload, SessionEvent } from "@/lib/v3/types";

export type IngestEnvelope = {
  envelope_version: "v1" | "v2";
  idempotency_key?: string;
  payload: unknown;
};

export type ContractErrorCode = "UNSUPPORTED_CONTRACT_VERSION" | "VALIDATION_ERROR" | "IDEMPOTENCY_CONFLICT";

export class ContractError extends Error {
  constructor(public code: ContractErrorCode, public status: number, public details: Array<{ field: string; message: string }>) {
    super(code);
  }

  toBody() {
    const message = this.code === "VALIDATION_ERROR" ? "Invalid ingest payload" : this.code.replaceAll("_", " ");
    return { error: { code: this.code, message, details: this.details } };
  }
}

function sortIssues(issues: Array<{ field: string; message: string }>) {
  return [...issues].sort((a, b) => a.field.localeCompare(b.field) || a.message.localeCompare(b.message));
}

function assertSessionBase(session: Record<string, unknown>) {
  const req = ["sessionId", "state", "agentId", "modelId", "startedAt"];
  const issues: Array<{ field: string; message: string }> = [];
  for (const f of req) {
    if (typeof session[f] !== "string" || String(session[f]).trim().length === 0) issues.push({ field: `session.${f}`, message: "must be a non-empty string" });
  }
  if (issues.length) throw new ContractError("VALIDATION_ERROR", 400, sortIssues(issues));
}

function adaptV1(payload: unknown): { session: ProviderPayload; events: SessionEvent[] } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ContractError("VALIDATION_ERROR", 400, [{ field: "payload", message: "must be an object" }]);
  const body = payload as { session?: unknown; events?: unknown };
  if (!body.session || typeof body.session !== "object" || Array.isArray(body.session)) throw new ContractError("VALIDATION_ERROR", 400, [{ field: "session", message: "session object is required" }]);
  const session = body.session as Record<string, unknown>;
  assertSessionBase(session);
  return { session: session as ProviderPayload, events: Array.isArray(body.events) ? body.events as SessionEvent[] : [] };
}

function adaptV2(payload: unknown): { session: ProviderPayload; events: SessionEvent[] } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ContractError("VALIDATION_ERROR", 400, [{ field: "payload", message: "must be an object" }]);
  const body = payload as { run?: unknown; timeline?: unknown[] };
  if (!body.run || typeof body.run !== "object" || Array.isArray(body.run)) throw new ContractError("VALIDATION_ERROR", 400, [{ field: "run", message: "run object is required" }]);
  const run = body.run as Record<string, unknown>;
  const session: ProviderPayload = {
    sessionId: String(run.sessionId ?? ""),
    state: String(run.state ?? ""),
    agentId: String(run.agentId ?? ""),
    modelId: String(run.modelId ?? ""),
    startedAt: String(run.startedAt ?? ""),
    endedAt: typeof run.endedAt === "string" ? run.endedAt : undefined,
    terminalAt: typeof run.terminalAt === "string" ? run.terminalAt : undefined,
    provider: typeof run.provider === "string" ? run.provider : undefined,
    title: typeof run.title === "string" ? run.title : undefined,
    task: typeof run.task === "string" ? run.task : undefined,
    taskCategory: typeof run.taskCategory === "string" ? run.taskCategory : undefined,
    totalTokens: typeof run.totalTokens === "number" ? run.totalTokens : undefined,
    promptTokens: typeof run.promptTokens === "number" ? run.promptTokens : undefined,
    completionTokens: typeof run.completionTokens === "number" ? run.completionTokens : undefined,
    billedCostUsd: typeof run.billedCostUsd === "number" ? run.billedCostUsd : undefined,
  };
  assertSessionBase(session as unknown as Record<string, unknown>);
  return { session, events: Array.isArray(body.timeline) ? body.timeline as SessionEvent[] : [] };
}

export function normalizeEnvelope(input: unknown, strict = true): IngestEnvelope {
  if (!strict) return { envelope_version: "v1", payload: input };
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ContractError("VALIDATION_ERROR", 400, [{ field: "payload", message: "payload must be an object" }]);
  const envelope = input as Partial<IngestEnvelope>;
  if (!envelope.envelope_version) throw new ContractError("VALIDATION_ERROR", 400, [{ field: "envelope_version", message: "is required" }]);
  if (!envelope.payload) throw new ContractError("VALIDATION_ERROR", 400, [{ field: "payload", message: "is required" }]);
  if (!["v1", "v2"].includes(envelope.envelope_version)) throw new ContractError("UNSUPPORTED_CONTRACT_VERSION", 422, [{ field: "envelope_version", message: "unsupported" }]);
  return envelope as IngestEnvelope;
}

export function adaptEnvelope(envelope: IngestEnvelope): { session: ProviderPayload; events: SessionEvent[]; fingerprint: string; idempotencyKey: string } {
  const adapted = envelope.envelope_version === "v2" ? adaptV2(envelope.payload) : adaptV1(envelope.payload);
  const raw = JSON.stringify(adapted);
  const fingerprint = createHash("sha256").update(raw).digest("hex");
  const idempotencyKey = envelope.idempotency_key ?? adapted.session.sessionId;
  return { ...adapted, fingerprint, idempotencyKey };
}
