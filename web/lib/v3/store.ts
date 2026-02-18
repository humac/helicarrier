import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getV3Config } from "@/lib/v3/config";
import { LedgerQuery, V3Repository } from "@/lib/v3/repository";
import { getSqliteRepository } from "@/lib/v3/sqliteRepository";
import { AlertRule, AlertState, SessionEvent, SessionLedgerEntry, SessionUsage, V3Store } from "@/lib/v3/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "v3-intelligence.json");

const EMPTY_STORE: V3Store = { ledger: [], events: [], usage: [], alertRules: [], alertStates: [] };
let cache: V3Store | null = null;

class JsonRepository implements V3Repository {
  async ready(): Promise<void> {}

  private async loadStore(): Promise<V3Store> {
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

  private async saveStore(store: V3Store): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(store, null, 2));
    cache = store;
  }

  async upsertSession(entry: SessionLedgerEntry, usage: SessionUsage, events: SessionEvent[] = []): Promise<void> {
    const store = await this.loadStore();
    const ledgerIndex = store.ledger.findIndex((row) => row.sessionId === entry.sessionId);
    if (ledgerIndex >= 0) store.ledger[ledgerIndex] = { ...store.ledger[ledgerIndex], ...entry };
    else store.ledger.push(entry);

    if ((usage.costUsd ?? 0) > 0 && !usage.pricingVersion && usage.costConfidence !== "unknown") {
      throw new Error("pricing_version required for cost-bearing usage rows");
    }

    const usageIndex = store.usage.findIndex((row) => row.sessionId === usage.sessionId);
    if (usageIndex >= 0) store.usage[usageIndex] = { ...store.usage[usageIndex], ...usage };
    else store.usage.push(usage);

    for (const event of events) {
      if (!store.events.some((row) => row.eventId === event.eventId)) store.events.push(event);
    }

    await this.saveStore(store);
  }

  async queryLedger(params: LedgerQuery): Promise<{ rows: SessionLedgerEntry[]; total: number }> {
    const store = await this.loadStore();
    const usageMap = new Map(store.usage.map((u) => [u.sessionId, u]));
    let rows = [...store.ledger];
    if (params.agent) rows = rows.filter((x) => x.agentId === params.agent);
    if (params.status) rows = rows.filter((x) => x.status === params.status);
    if (params.model) rows = rows.filter((x) => x.modelId === params.model);
    if (params.from) rows = rows.filter((x) => Date.parse(x.startedAt) >= Date.parse(params.from as string));
    if (params.to) rows = rows.filter((x) => Date.parse(x.startedAt) <= Date.parse(params.to as string));
    const q = params.q?.trim().toLowerCase();
    if (q) rows = rows.filter((x) => [x.sessionId, x.taskTitle, x.taskText].filter(Boolean).join(" ").toLowerCase().includes(q));
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

  async getSessionDetail(sessionId: string) {
    const store = await this.loadStore();
    return {
      ledger: store.ledger.find((row) => row.sessionId === sessionId),
      usage: store.usage.find((row) => row.sessionId === sessionId),
      events: store.events.filter((row) => row.sessionId === sessionId).sort((a, b) => a.seq - b.seq),
    };
  }

  async getStoreSnapshot(): Promise<V3Store> { return this.loadStore(); }
  async listAlertRules(): Promise<AlertRule[]> { return [...(await this.loadStore()).alertRules]; }

  async putAlertRule(rule: AlertRule): Promise<void> {
    const store = await this.loadStore();
    const idx = store.alertRules.findIndex((row) => row.ruleId === rule.ruleId);
    if (idx >= 0) store.alertRules[idx] = rule; else store.alertRules.push(rule);
    await this.saveStore(store);
  }

  async patchAlertRule(ruleId: string, patch: Partial<AlertRule>): Promise<AlertRule | undefined> {
    const store = await this.loadStore();
    const idx = store.alertRules.findIndex((row) => row.ruleId === ruleId);
    if (idx < 0) return undefined;
    const next = { ...store.alertRules[idx], ...patch, ruleId, updatedAt: new Date().toISOString() };
    store.alertRules[idx] = next;
    await this.saveStore(store);
    return next;
  }

  async getAlertStates(): Promise<AlertState[]> { return [...(await this.loadStore()).alertStates]; }

  async upsertAlertState(nextState: AlertState): Promise<void> {
    const store = await this.loadStore();
    const idx = store.alertStates.findIndex((row) => row.ruleId === nextState.ruleId);
    if (idx >= 0) store.alertStates[idx] = nextState; else store.alertStates.push(nextState);
    await this.saveStore(store);
  }

  async resetForTests(seed: Partial<V3Store> = {}): Promise<void> {
    cache = { ...structuredClone(EMPTY_STORE), ...seed };
    await this.saveStore(cache);
  }
}

let repository: V3Repository | null = null;

async function getRepository(): Promise<V3Repository> {
  if (repository) return repository;
  const cfg = getV3Config();
  if (cfg.enableSqlite) {
    const sqlite = await getSqliteRepository();
    if (cfg.enableJsonImport && sqlite.importJsonToSqlite) await sqlite.importJsonToSqlite();
    repository = sqlite;
    return repository;
  }
  repository = new JsonRepository();
  return repository;
}

export async function upsertSession(entry: SessionLedgerEntry, usage: SessionUsage, events: SessionEvent[] = []): Promise<void> {
  return (await getRepository()).upsertSession(entry, usage, events);
}

export async function queryLedger(params: LedgerQuery): Promise<{ rows: SessionLedgerEntry[]; total: number }> {
  return (await getRepository()).queryLedger(params);
}

export async function getSessionDetail(sessionId: string): Promise<{ ledger?: SessionLedgerEntry; usage?: SessionUsage; events: SessionEvent[] }> {
  return (await getRepository()).getSessionDetail(sessionId);
}

export async function getStoreSnapshot(): Promise<V3Store> { return (await getRepository()).getStoreSnapshot(); }
export async function listAlertRules(): Promise<AlertRule[]> { return (await getRepository()).listAlertRules(); }
export async function putAlertRule(rule: AlertRule): Promise<void> { return (await getRepository()).putAlertRule(rule); }
export async function patchAlertRule(ruleId: string, patch: Partial<AlertRule>): Promise<AlertRule | undefined> { return (await getRepository()).patchAlertRule(ruleId, patch); }
export async function getAlertStates(): Promise<AlertState[]> { return (await getRepository()).getAlertStates(); }
export async function upsertAlertState(nextState: AlertState): Promise<void> { return (await getRepository()).upsertAlertState(nextState); }

export async function __resetStoreForTests(seed: Partial<V3Store> = {}): Promise<void> {
  repository = null;
  return (await getRepository()).resetForTests(seed);
}

export async function importJsonToSqlite(): Promise<{ read: number; written: number; skipped: number; errors: number } | null> {
  const repo = await getRepository();
  if (!repo.importJsonToSqlite) return null;
  return repo.importJsonToSqlite();
}
