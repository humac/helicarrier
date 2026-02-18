import { ProviderPayload, SessionLedgerEntry, SessionUsage } from "@/lib/v3/types";

const TERMINAL_STATES = new Set(["success", "failed", "killed", "cancelled", "done", "completed", "error"]);

export function normalizeStatus(state: string): SessionLedgerEntry["status"] {
  const s = state.toLowerCase();
  if (["success", "done", "completed", "finished"].includes(s)) return "success";
  if (["failed", "error", "crashed"].includes(s)) return "failed";
  if (["killed", "terminated"].includes(s)) return "killed";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  if (["running", "in_progress", "active"].includes(s)) return "running";
  return "queued";
}

export function deriveRuntimeMs(payload: ProviderPayload): number {
  const started = Date.parse(payload.startedAt);
  const endCandidate = payload.endedAt ?? (TERMINAL_STATES.has(payload.state.toLowerCase()) ? payload.terminalAt : undefined);
  const ended = endCandidate ? Date.parse(endCandidate) : started;
  if (Number.isNaN(started) || Number.isNaN(ended) || ended < started) return 0;
  return ended - started;
}

export function normalizeUsage(payload: ProviderPayload): SessionUsage {
  const promptTokens = payload.promptTokens;
  const completionTokens = payload.completionTokens;
  const totalTokens = payload.totalTokens ??
    (typeof promptTokens === "number" || typeof completionTokens === "number"
      ? (promptTokens ?? 0) + (completionTokens ?? 0)
      : undefined);

  let costUsd = payload.billedCostUsd;
  let costConfidence: SessionUsage["costConfidence"] = "unknown";

  if (typeof payload.billedCostUsd === "number") {
    costConfidence = "exact";
  } else if (typeof totalTokens === "number") {
    costUsd = Number(((totalTokens / 1_000_000) * 2).toFixed(6));
    costConfidence = "estimated";
  }

  return {
    sessionId: payload.sessionId,
    promptTokens,
    completionTokens,
    totalTokens,
    runtimeMs: deriveRuntimeMs(payload),
    costUsd,
    costConfidence,
    provider: payload.provider,
    pricingVersion: costConfidence === "estimated" ? "v3-default" : undefined,
    computedAt: new Date().toISOString(),
  };
}

export function normalizeLedgerEntry(payload: ProviderPayload): SessionLedgerEntry {
  const now = new Date().toISOString();
  return {
    sessionId: payload.sessionId,
    agentId: payload.agentId,
    agentLabel: payload.agentLabel ?? payload.agentId,
    modelId: payload.modelId,
    taskTitle: payload.title,
    taskText: payload.task,
    taskCategory: payload.taskCategory,
    status: normalizeStatus(payload.state),
    startedAt: payload.startedAt,
    endedAt: payload.endedAt ?? payload.terminalAt,
    runtimeMs: deriveRuntimeMs(payload),
    artifactCount: 0,
    ingestedAt: now,
  };
}
