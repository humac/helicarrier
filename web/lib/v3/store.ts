import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AlertRule, AlertState, SessionEvent, SessionLedgerEntry, SessionUsage, SortKey, V3Store } from "@/lib/v3/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "v3-intelligence.json");

const EMPTY_STORE: V3Store = {
  ledger: [],
  events: [],
  usage: [],
  alertRules: [],
  alertStates: [],
};

let cache: V3Store | null = null;

async function loadStore(): Promise<V3Store> {
  if (cache) return cache;
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    cache = { ...EMPTY_STORE, ...(JSON.parse(raw) as Partial<V3Store>) };
    return cache;
  } catch {
    cache = structuredClone(EMPTY_STORE);
    return cache;
  }
}

async function saveStore(store: V3Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2));
  cache = store;
}

export async function upsertSession(entry: SessionLedgerEntry, usage: SessionUsage, events: SessionEvent[] = []): Promise<void> {
  const store = await loadStore();

  const ledgerIndex = store.ledger.findIndex((row) => row.sessionId === entry.sessionId);
  if (ledgerIndex >= 0) store.ledger[ledgerIndex] = { ...store.ledger[ledgerIndex], ...entry };
  else store.ledger.push(entry);

  const usageIndex = store.usage.findIndex((row) => row.sessionId === usage.sessionId);
  if (usageIndex >= 0) store.usage[usageIndex] = { ...store.usage[usageIndex], ...usage };
  else store.usage.push(usage);

  for (const event of events) {
    if (!store.events.some((row) => row.eventId === event.eventId)) {
      store.events.push(event);
    }
  }

  await saveStore(store);
}

export async function queryLedger(params: {
  agent?: string;
  status?: string;
  model?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: SessionLedgerEntry[]; total: number }> {
  const store = await loadStore();
  const usageMap = new Map(store.usage.map((u) => [u.sessionId, u]));

  let rows = [...store.ledger];
  if (params.agent) rows = rows.filter((x) => x.agentId === params.agent);
  if (params.status) rows = rows.filter((x) => x.status === params.status);
  if (params.model) rows = rows.filter((x) => x.modelId === params.model);
  if (params.from) rows = rows.filter((x) => Date.parse(x.startedAt) >= Date.parse(params.from as string));
  if (params.to) rows = rows.filter((x) => Date.parse(x.startedAt) <= Date.parse(params.to as string));

  const q = params.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((x) => [x.sessionId, x.taskTitle, x.taskText].filter(Boolean).join(" ").toLowerCase().includes(q));
  }

  const sort = params.sort ?? "newest";
  rows.sort((a, b) => {
    if (sort === "runtime") return b.runtimeMs - a.runtimeMs;
    if (sort === "cost") return (usageMap.get(b.sessionId)?.costUsd ?? 0) - (usageMap.get(a.sessionId)?.costUsd ?? 0);
    return Date.parse(b.startedAt) - Date.parse(a.startedAt);
  });

  const total = rows.length;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const start = (page - 1) * pageSize;

  return { rows: rows.slice(start, start + pageSize), total };
}

export async function getSessionDetail(sessionId: string): Promise<{ ledger?: SessionLedgerEntry; usage?: SessionUsage; events: SessionEvent[] }> {
  const store = await loadStore();
  return {
    ledger: store.ledger.find((row) => row.sessionId === sessionId),
    usage: store.usage.find((row) => row.sessionId === sessionId),
    events: store.events
      .filter((row) => row.sessionId === sessionId)
      .sort((a, b) => a.seq - b.seq),
  };
}

export async function getStoreSnapshot(): Promise<V3Store> {
  return loadStore();
}

export async function listAlertRules(): Promise<AlertRule[]> {
  const store = await loadStore();
  return [...store.alertRules];
}

export async function putAlertRule(rule: AlertRule): Promise<void> {
  const store = await loadStore();
  const idx = store.alertRules.findIndex((row) => row.ruleId === rule.ruleId);
  if (idx >= 0) store.alertRules[idx] = rule;
  else store.alertRules.push(rule);
  await saveStore(store);
}

export async function patchAlertRule(ruleId: string, patch: Partial<AlertRule>): Promise<AlertRule | undefined> {
  const store = await loadStore();
  const idx = store.alertRules.findIndex((row) => row.ruleId === ruleId);
  if (idx < 0) return undefined;
  const next = { ...store.alertRules[idx], ...patch, ruleId, updatedAt: new Date().toISOString() };
  store.alertRules[idx] = next;
  await saveStore(store);
  return next;
}

export async function getAlertStates(): Promise<AlertState[]> {
  const store = await loadStore();
  return [...store.alertStates];
}

export async function upsertAlertState(nextState: AlertState): Promise<void> {
  const store = await loadStore();
  const idx = store.alertStates.findIndex((row) => row.ruleId === nextState.ruleId);
  if (idx >= 0) store.alertStates[idx] = nextState;
  else store.alertStates.push(nextState);
  await saveStore(store);
}

export async function __resetStoreForTests(seed: Partial<V3Store> = {}): Promise<void> {
  cache = { ...structuredClone(EMPTY_STORE), ...seed };
  await saveStore(cache);
}
