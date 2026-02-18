import { buildUsageAnalytics, computeFailureRate, computeRuntimeP95Ms } from "@/lib/v3/analytics";
import { AlertRule, AlertState, SessionLedgerEntry, SessionUsage } from "@/lib/v3/types";

function toWindowRange(window: AlertRule["window"]): { from: string; to: string } {
  const now = Date.now();
  const delta = window === "5m" ? 5 * 60_000 : window === "1h" ? 60 * 60_000 : window === "24h" ? 24 * 60 * 60_000 : 7 * 24 * 60 * 60_000;
  return { from: new Date(now - delta).toISOString(), to: new Date(now).toISOString() };
}

function metricValue(rule: AlertRule, ledger: SessionLedgerEntry[], usage: SessionUsage[]): number {
  const range = toWindowRange(rule.window);
  const filters = {
    ...range,
    agent: rule.scopeRef?.agentId,
    model: rule.scopeRef?.modelId,
  };

  if (rule.metric === "daily_cost_usd") return buildUsageAnalytics(ledger, usage, filters).totals.costUsd;
  if (rule.metric === "runtime_p95_ms") return computeRuntimeP95Ms(ledger, usage, filters);
  return computeFailureRate(ledger, filters);
}

function compare(rule: AlertRule, value: number, threshold: number): boolean {
  return rule.comparison === "gte" ? value >= threshold : value > threshold;
}

function nextStatus(rule: AlertRule, value: number): AlertState["status"] {
  if (compare(rule, value, rule.criticalThreshold)) return "critical";
  if (compare(rule, value, rule.warnThreshold)) return "warning";
  return "ok";
}

export function evaluateRule(
  rule: AlertRule,
  previous: AlertState | undefined,
  ledger: SessionLedgerEntry[],
  usage: SessionUsage[],
  nowIso = new Date().toISOString(),
): AlertState {
  const value = metricValue(rule, ledger, usage);
  const status = nextStatus(rule, value);
  const resolved = previous && previous.status !== "ok" && status === "ok";
  const next: AlertState["status"] = resolved ? "resolved" : status;

  const fingerprint = `${rule.ruleId}:${next}:${value.toFixed(4)}`;
  const cooldownMs = rule.dedupCooldownSec * 1000;
  const prevNotifiedMs = previous?.lastNotifiedAt ? Date.parse(previous.lastNotifiedAt) : 0;
  const nowMs = Date.parse(nowIso);
  const sameFingerprint = previous?.activeFingerprint === fingerprint;
  const deduped = sameFingerprint && nowMs - prevNotifiedMs < cooldownMs;

  const transitioned = !previous || previous.status !== next;
  const suppressedUntil = deduped ? new Date(nowMs + cooldownMs).toISOString() : undefined;
  const lifecycleState: AlertState["lifecycleState"] = next === "resolved" ? "resolved" : deduped ? "suppressed" : "active";

  return {
    ruleId: rule.ruleId,
    status: next,
    lifecycleState,
    suppressedUntil,
    lastValue: value,
    lastEvaluatedAt: nowIso,
    lastTransitionAt: transitioned ? nowIso : (previous?.lastTransitionAt ?? nowIso),
    lastNotifiedAt: deduped ? previous?.lastNotifiedAt : nowIso,
    activeFingerprint: fingerprint,
    deduped,
  };
}
