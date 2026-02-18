"use client";

import { useEffect, useState } from "react";

type UsagePayload = {
  totals: { runs: number; tokens: number; runtimeMs: number; costUsd: number };
};

type MatrixRow = {
  modelId: string;
  runsTotal: number;
  successRate: number;
  medianRuntimeMs: number;
  medianCostUsd: number;
  sampleWarning: boolean;
};

type AlertRow = {
  ruleId: string;
  metric: string;
  value: number;
  status: string;
  triggeredAt: string;
};

const secret = process.env.NEXT_PUBLIC_HELICARRIER_SECRET;

export default function IntelligencePanel() {
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  useEffect(() => {
    const headers = secret ? { "x-secret-key": secret } : undefined;
    Promise.all([
      fetch("/api/v3/analytics/usage", { headers }).then((r) => r.json()),
      fetch("/api/v3/analytics/performance", { headers }).then((r) => r.json()),
      fetch("/api/v3/alerts/active", { headers }).then((r) => r.json()),
    ])
      .then(([u, m, a]) => {
        setUsage(u as UsagePayload);
        setMatrix(((m as { rows?: MatrixRow[] }).rows ?? []) as MatrixRow[]);
        setAlerts(((a as { rows?: AlertRow[] }).rows ?? []) as AlertRow[]);
      })
      .catch(() => {
        setUsage(null);
        setMatrix([]);
        setAlerts([]);
      });
  }, []);

  return (
    <div className="space-y-6">
      <section className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Usage Analytics</h3>
        {usage ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat label="Runs" value={String(usage.totals.runs)} />
            <Stat label="Tokens" value={usage.totals.tokens.toLocaleString()} />
            <Stat label="Runtime" value={`${Math.round(usage.totals.runtimeMs / 1000)}s`} />
            <Stat label="Cost" value={`$${usage.totals.costUsd.toFixed(4)}`} />
          </div>
        ) : (
          <p className="text-zinc-400 text-sm">No analytics data yet.</p>
        )}
      </section>

      <section className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Model Performance Matrix</h3>
        <div className="space-y-2">
          {matrix.map((row) => (
            <div key={row.modelId} className="grid grid-cols-5 gap-2 text-xs border border-zinc-800 rounded p-2">
              <span className="font-mono text-cyan-300">{row.modelId}</span>
              <span>{row.runsTotal} runs</span>
              <span>{Math.round(row.successRate * 100)}% success</span>
              <span>{Math.round(row.medianRuntimeMs)}ms p50</span>
              <span className={row.sampleWarning ? "text-amber-400" : "text-zinc-300"}>${row.medianCostUsd.toFixed(4)}</span>
            </div>
          ))}
          {!matrix.length && <p className="text-zinc-400 text-sm">No performance records.</p>}
        </div>
      </section>

      <section className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Active Alerts</h3>
        {alerts.length ? (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.ruleId} className="flex items-center justify-between border border-zinc-800 rounded p-2 text-xs">
                <span>{alert.metric}</span>
                <span className="font-mono">{alert.value.toFixed(4)}</span>
                <span className={alert.status === "critical" ? "text-red-400" : "text-amber-400"}>{alert.status}</span>
                <span>{new Date(alert.triggeredAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-400 text-sm">No active alerts.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-800 p-3">
      <p className="text-zinc-500 text-xs uppercase">{label}</p>
      <p className="text-zinc-100 font-semibold mt-1">{value}</p>
    </div>
  );
}
