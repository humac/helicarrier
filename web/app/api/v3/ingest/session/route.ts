import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeLedgerEntry, normalizeUsage } from "@/lib/v3/normalizer";
import { requireApiSecret } from "@/lib/v3/auth";
import { upsertSession } from "@/lib/v3/store";
import { ProviderPayload, SessionEvent } from "@/lib/v3/types";

type Payload = {
  session: ProviderPayload;
  events?: Array<Omit<SessionEvent, "eventId" | "sessionId"> & { eventId?: string }>;
};

type ValidationIssue = {
  field: string;
  message: string;
};

function validationError(details: ValidationIssue[]) {
  return NextResponse.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid ingest payload",
        details,
      },
    },
    { status: 400 },
  );
}

function getRequiredStringIssues(payload: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [{ field: "payload", message: "payload must be an object" }];
  }

  const candidate = payload as { session?: unknown };
  if (!candidate.session || typeof candidate.session !== "object" || Array.isArray(candidate.session)) {
    return [{ field: "session", message: "session object is required" }];
  }

  const session = candidate.session as Record<string, unknown>;
  const requiredStringFields: Array<keyof ProviderPayload> = ["sessionId", "state", "agentId", "modelId", "startedAt"];

  for (const field of requiredStringFields) {
    const value = session[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push({ field: `session.${field}`, message: "must be a non-empty string" });
    }
  }

  return issues;
}

export async function POST(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const issues = getRequiredStringIssues(payload);
  if (issues.length > 0) {
    return validationError(issues);
  }

  const ledger = normalizeLedgerEntry(payload.session);
  const usage = normalizeUsage(payload.session);
  const events = (payload.events ?? []).map((event, index) => ({
    ...event,
    eventId: event.eventId ?? randomUUID(),
    sessionId: payload.session.sessionId,
    seq: event.seq ?? index + 1,
  }));

  await upsertSession(ledger, usage, events);
  return NextResponse.json({ ok: true });
}
