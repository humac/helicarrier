import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiSecret } from "@/lib/v3/auth";
import { listAlertRules, putAlertRule } from "@/lib/v3/store";
import { AlertRule } from "@/lib/v3/types";

type InputRule = Partial<AlertRule>;

function validateRule(input: InputRule): string | null {
  if (!input.metric) return "metric is required";
  if (!input.scopeType) return "scopeType is required";
  if (typeof input.warnThreshold !== "number") return "warnThreshold must be a number";
  if (typeof input.criticalThreshold !== "number") return "criticalThreshold must be a number";
  if (input.criticalThreshold < input.warnThreshold) return "criticalThreshold must be >= warnThreshold";
  if (!input.window) return "window is required";
  if (!input.comparison) return "comparison is required";
  return null;
}

export async function GET(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;
  return NextResponse.json({ rows: await listAlertRules() });
}

export async function POST(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  let payload: InputRule;
  try {
    payload = (await request.json()) as InputRule;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const validationErr = validateRule(payload);
  if (validationErr) return NextResponse.json({ error: validationErr }, { status: 400 });

  const now = new Date().toISOString();
  const rule: AlertRule = {
    ruleId: randomUUID(),
    enabled: payload.enabled ?? true,
    metric: payload.metric as AlertRule["metric"],
    scopeType: payload.scopeType as AlertRule["scopeType"],
    scopeRef: payload.scopeRef,
    warnThreshold: payload.warnThreshold as number,
    criticalThreshold: payload.criticalThreshold as number,
    window: payload.window as AlertRule["window"],
    comparison: payload.comparison as AlertRule["comparison"],
    dedupCooldownSec: payload.dedupCooldownSec ?? 300,
    createdAt: now,
    updatedAt: now,
  };

  await putAlertRule(rule);
  return NextResponse.json(rule, { status: 201 });
}
