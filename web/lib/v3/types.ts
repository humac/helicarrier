export type LedgerStatus = "success" | "failed" | "killed" | "cancelled" | "running" | "queued";

export type SortKey = "newest" | "runtime" | "cost";

export type SessionLedgerEntry = {
  sessionId: string;
  runId?: string;
  agentId: string;
  agentLabel: string;
  modelId: string;
  taskTitle?: string;
  taskText?: string;
  taskCategory?: string;
  status: LedgerStatus;
  startedAt: string;
  endedAt?: string;
  runtimeMs: number;
  artifactCount: number;
  errorCode?: string;
  errorMessage?: string;
  sourceVersion?: string;
  ingestedAt: string;
};

export type SessionEvent = {
  eventId: string;
  sessionId: string;
  seq: number;
  eventType: "tool_call" | "message" | "state_transition" | "artifact" | "error" | "metric";
  eventTs: string;
  payload: Record<string, unknown>;
};

export type SessionUsage = {
  sessionId: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  runtimeMs: number;
  costUsd?: number;
  costConfidence: "exact" | "estimated" | "unknown";
  provider?: string;
  pricingVersion?: string;
  computedAt: string;
  tokenSource?: "provider_reported" | "derived" | "missing";
  runtimeSource?: "provider_reported" | "derived" | "missing";
  costSource?: "provider_reported" | "derived" | "missing" | "unknown";
  tokenConfidence?: "high" | "medium" | "low" | "unknown";
  runtimeConfidence?: "high" | "medium" | "low" | "unknown";
  costConfidenceLevel?: "high" | "medium" | "low" | "unknown";
};

export type AlertMetric = "daily_cost_usd" | "runtime_p95_ms" | "failure_rate";

export type AlertRule = {
  ruleId: string;
  enabled: boolean;
  metric: AlertMetric;
  scopeType: "global" | "agent" | "model" | "agent_model";
  scopeRef?: { agentId?: string; modelId?: string };
  warnThreshold: number;
  criticalThreshold: number;
  window: "5m" | "1h" | "24h" | "7d";
  comparison: "gt" | "gte";
  dedupCooldownSec: number;
  createdAt: string;
  updatedAt: string;
};

export type AlertStatus = "ok" | "warning" | "critical" | "resolved";

export type AlertState = {
  ruleId: string;
  status: AlertStatus;
  lifecycleState?: "active" | "suppressed" | "resolved";
  suppressedUntil?: string;
  lastValue: number;
  lastEvaluatedAt: string;
  lastTransitionAt: string;
  lastNotifiedAt?: string;
  activeFingerprint?: string;
  deduped?: boolean;
};

export type V3Store = {
  ledger: SessionLedgerEntry[];
  events: SessionEvent[];
  usage: SessionUsage[];
  alertRules: AlertRule[];
  alertStates: AlertState[];
};

export type ProviderPayload = {
  sessionId: string;
  agentId: string;
  agentLabel?: string;
  modelId: string;
  title?: string;
  task?: string;
  taskCategory?: string;
  startedAt: string;
  endedAt?: string;
  terminalAt?: string;
  state: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  billedCostUsd?: number;
  provider?: string;
};
