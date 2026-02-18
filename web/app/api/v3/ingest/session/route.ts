import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getV3Config } from "@/lib/v3/config";
import { adaptEnvelope, ContractError, normalizeEnvelope } from "@/lib/v3/contract";
import { normalizeLedgerEntry, normalizeUsage } from "@/lib/v3/normalizer";
import { requireApiSecret } from "@/lib/v3/auth";
import { upsertSession } from "@/lib/v3/store";

const idempotencyIndex = new Map<string, string>();

function formatError(error: ContractError) {
  return NextResponse.json(error.toBody(), { status: error.status });
}

export async function POST(request: Request) {
  const authErr = requireApiSecret(request);
  if (authErr) return authErr;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const strict = getV3Config().contractStrict;
    const envelope = normalizeEnvelope(payload, strict);
    const adapted = adaptEnvelope(envelope);

    const previous = idempotencyIndex.get(adapted.idempotencyKey);
    if (previous && previous !== adapted.fingerprint) {
      throw new ContractError("IDEMPOTENCY_CONFLICT", 409, [{ field: "idempotency_key", message: "conflicting payload for idempotency key" }]);
    }
    idempotencyIndex.set(adapted.idempotencyKey, adapted.fingerprint);

    const ledger = normalizeLedgerEntry(adapted.session);
    const usage = normalizeUsage(adapted.session);
    const events = (adapted.events ?? []).map((event, index) => ({
      ...event,
      eventId: event.eventId ?? randomUUID(),
      sessionId: adapted.session.sessionId,
      seq: event.seq ?? index + 1,
    }));

    await upsertSession(ledger, usage, events);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ContractError) return formatError(error);
    const message = error instanceof Error ? error.message : "failed ingest";
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message, details: [] } }, { status: 400 });
  }
}
