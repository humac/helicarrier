import { NextResponse } from "next/server";
import { evaluateRule } from "@/lib/v3/alerts";
import { requireApiSecret } from "@/lib/v3/auth";
import { getAlertStates, getStoreSnapshot, listAlertRules, upsertAlertState } from "@/lib/v3/store";

export async function GET(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  const store = await getStoreSnapshot();
  const rules = await listAlertRules();
  const states = await getAlertStates();
  const byRule = new Map(states.map((s) => [s.ruleId, s]));

  const nextStates = [];
  for (const rule of rules.filter((r) => r.enabled)) {
    const state = evaluateRule(rule, byRule.get(rule.ruleId), store.ledger, store.usage);
    await upsertAlertState(state);
    nextStates.push({
      ruleId: rule.ruleId,
      metric: rule.metric,
      scope: rule.scopeRef ?? { type: rule.scopeType },
      value: state.lastValue,
      warnThreshold: rule.warnThreshold,
      criticalThreshold: rule.criticalThreshold,
      status: state.status,
      triggeredAt: state.lastTransitionAt,
      deduped: state.deduped ?? false,
    });
  }

  const active = nextStates.filter((row) => ["warning", "critical", "resolved"].includes(row.status));
  return NextResponse.json({ rows: active });
}
