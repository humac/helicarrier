import { SessionLedgerEntry, SessionUsage } from "@/lib/v3/types";

type UsageFilters = {
  from?: string;
  to?: string;
  agent?: string;
  model?: string;
  task?: string;
};

function inRange(ts: string, filters: UsageFilters): boolean {
  const val = Date.parse(ts);
  if (filters.from && val < Date.parse(filters.from)) return false;
  if (filters.to && val > Date.parse(filters.to)) return false;
  return true;
}

export function buildUsageAnalytics(ledger: SessionLedgerEntry[], usage: SessionUsage[], filters: UsageFilters) {
  const usageMap = new Map(usage.map((u) => [u.sessionId, u]));
  const selected = ledger.filter((row) => {
    if (!inRange(row.startedAt, filters)) return false;
    if (filters.agent && row.agentId !== filters.agent) return false;
    if (filters.model && row.modelId !== filters.model) return false;
    if (filters.task && row.taskCategory !== filters.task) return false;
    return true;
  });

  const byDay = new Map<string, { tokens: number; runtimeMs: number; costUsd: number; runs: number }>();

  let totalTokens = 0;
  let totalRuntimeMs = 0;
  let totalCostUsd = 0;

  for (const row of selected) {
    const u = usageMap.get(row.sessionId);
    const day = row.startedAt.slice(0, 10);
    const cur = byDay.get(day) ?? { tokens: 0, runtimeMs: 0, costUsd: 0, runs: 0 };
    const tokens = u?.totalTokens ?? 0;
    const runtime = u?.runtimeMs ?? row.runtimeMs;
    const cost = u?.costUsd ?? 0;

    cur.tokens += tokens;
    cur.runtimeMs += runtime;
    cur.costUsd += cost;
    cur.runs += 1;
    byDay.set(day, cur);

    totalTokens += tokens;
    totalRuntimeMs += runtime;
    totalCostUsd += cost;
  }

  const series = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));

  const provenance = {
    token: usage.filter((u) => u.tokenSource).reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.tokenSource as string]: (acc[u.tokenSource as string] ?? 0) + 1 }), {}),
    runtime: usage.filter((u) => u.runtimeSource).reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.runtimeSource as string]: (acc[u.runtimeSource as string] ?? 0) + 1 }), {}),
    cost: usage.filter((u) => u.costSource).reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.costSource as string]: (acc[u.costSource as string] ?? 0) + 1 }), {}),
  };

  return {
    totals: {
      runs: selected.length,
      tokens: totalTokens,
      runtimeMs: totalRuntimeMs,
      costUsd: Number(totalCostUsd.toFixed(6)),
    },
    provenance,
    series,
  };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 1) return arr[mid];
  return (arr[mid - 1] + arr[mid]) / 2;
}

export function buildPerformanceMatrix(
  ledger: SessionLedgerEntry[],
  usage: SessionUsage[],
  filters: UsageFilters,
  minSample = 5,
) {
  const usageMap = new Map(usage.map((u) => [u.sessionId, u]));
  const terminal = new Set(["success", "failed", "killed", "cancelled"]);

  const selected = ledger.filter((row) => {
    if (!terminal.has(row.status)) return false;
    if (!inRange(row.startedAt, filters)) return false;
    if (filters.agent && row.agentId !== filters.agent) return false;
    if (filters.task && row.taskCategory !== filters.task) return false;
    return true;
  });

  const grouped = new Map<string, SessionLedgerEntry[]>();
  for (const row of selected) {
    const key = row.modelId;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return [...grouped.entries()].map(([modelId, rows]) => {
    const success = rows.filter((x) => x.status === "success").length;
    const failed = rows.filter((x) => x.status === "failed").length;
    const runtime = rows.map((x) => usageMap.get(x.sessionId)?.runtimeMs ?? x.runtimeMs).filter((x) => x > 0);
    const costs = rows.map((x) => usageMap.get(x.sessionId)?.costUsd ?? 0).filter((x) => x > 0);

    return {
      modelId,
      runsTotal: rows.length,
      successCount: success,
      failureCount: failed,
      successRate: rows.length ? success / rows.length : 0,
      medianRuntimeMs: median(runtime),
      medianCostUsd: median(costs),
      sampleWarning: rows.length < minSample,
      failedDrilldown: {
        status: "failed",
        model: modelId,
        from: filters.from,
        to: filters.to,
        agent: filters.agent,
      },
    };
  });
}

export function computeFailureRate(ledger: SessionLedgerEntry[], filters: UsageFilters): number {
  const terminal = ledger.filter((row) => ["success", "failed"].includes(row.status) && inRange(row.startedAt, filters));
  if (!terminal.length) return 0;
  const failed = terminal.filter((row) => row.status === "failed").length;
  return failed / terminal.length;
}

export function computeRuntimeP95Ms(ledger: SessionLedgerEntry[], usage: SessionUsage[], filters: UsageFilters): number {
  const usageMap = new Map(usage.map((u) => [u.sessionId, u]));
  const samples = ledger
    .filter((row) => inRange(row.startedAt, filters))
    .map((row) => usageMap.get(row.sessionId)?.runtimeMs ?? row.runtimeMs)
    .sort((a, b) => a - b);
  if (!samples.length) return 0;
  const idx = Math.min(samples.length - 1, Math.ceil(samples.length * 0.95) - 1);
  return samples[idx];
}
