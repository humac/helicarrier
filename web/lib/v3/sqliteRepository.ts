import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getV3Config } from "@/lib/v3/config";
import { ImportReport, LedgerQuery, V3Repository } from "@/lib/v3/repository";
import { AlertRule, AlertState, SessionEvent, SessionLedgerEntry, SessionUsage, SortKey, V3Store } from "@/lib/v3/types";

const DATA_FILE = path.join(process.cwd(), "data", "v3-intelligence.json");

const MIGRATIONS = [
  {
    version: "0001_init",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS schema_migrations_lock (id INTEGER PRIMARY KEY CHECK (id = 1), owner TEXT, locked_at TEXT);
      INSERT OR IGNORE INTO schema_migrations_lock(id, owner, locked_at) VALUES (1, NULL, NULL);

      CREATE TABLE IF NOT EXISTS session_ledger (
        session_id TEXT PRIMARY KEY,
        run_id TEXT,
        agent_id TEXT NOT NULL,
        agent_label TEXT NOT NULL,
        model_id TEXT NOT NULL,
        task_title TEXT,
        task_text TEXT,
        task_category TEXT,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        runtime_ms INTEGER NOT NULL,
        artifact_count INTEGER NOT NULL,
        error_code TEXT,
        error_message TEXT,
        source_version TEXT,
        ingested_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_events (
        event_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        event_ts TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_usage (
        session_id TEXT PRIMARY KEY,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        runtime_ms INTEGER NOT NULL,
        cost_usd REAL,
        cost_confidence TEXT NOT NULL,
        provider TEXT,
        pricing_version TEXT,
        computed_at TEXT NOT NULL,
        cost_source TEXT NOT NULL DEFAULT 'unknown',
        token_source TEXT NOT NULL DEFAULT 'missing',
        runtime_source TEXT NOT NULL DEFAULT 'missing',
        token_confidence TEXT NOT NULL DEFAULT 'unknown',
        runtime_confidence TEXT NOT NULL DEFAULT 'unknown',
        cost_confidence_level TEXT NOT NULL DEFAULT 'unknown'
      );
      CREATE TABLE IF NOT EXISTS alert_rules (
        rule_id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL,
        metric TEXT NOT NULL,
        scope_type TEXT NOT NULL,
        scope_ref_json TEXT,
        warn_threshold REAL NOT NULL,
        critical_threshold REAL NOT NULL,
        window TEXT NOT NULL,
        comparison TEXT NOT NULL,
        dedup_cooldown_sec INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS alert_state (
        rule_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        lifecycle_state TEXT NOT NULL DEFAULT 'active',
        suppressed_until TEXT,
        last_value REAL NOT NULL,
        last_evaluated_at TEXT NOT NULL,
        last_transition_at TEXT NOT NULL,
        last_notified_at TEXT,
        active_fingerprint TEXT,
        deduped INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_ledger_agent_started ON session_ledger(agent_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ledger_status_started ON session_ledger(status, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ledger_model_started ON session_ledger(model_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_usage_pricing ON session_usage(pricing_version);
      CREATE INDEX IF NOT EXISTS idx_usage_computed ON session_usage(computed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_alert_state_status ON alert_state(status, last_transition_at DESC);
      CREATE INDEX IF NOT EXISTS idx_alert_lifecycle ON alert_state(lifecycle_state, suppressed_until);
      CREATE VIRTUAL TABLE IF NOT EXISTS session_ledger_fts USING fts5(session_id, task_title, task_text);
    `,
  },
];

function boolToInt(v: boolean): number { return v ? 1 : 0; }

function parseScopeRef(raw?: string | null): AlertRule["scopeRef"] {
  if (!raw) return undefined;
  try { return JSON.parse(raw) as AlertRule["scopeRef"]; } catch { return undefined; }
}

export class SqliteRepository implements V3Repository {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  }

  async ready(): Promise<void> {
    this.runMigrations();
  }

  private runMigrations() {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);");
      const applied = new Set((this.db.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: string }>).map((x) => x.version));
      for (const m of MIGRATIONS) {
        if (applied.has(m.version)) continue;
        this.db.exec(m.sql);
        this.db.prepare("INSERT INTO schema_migrations(version, applied_at) VALUES(?, ?)").run(m.version, new Date().toISOString());
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  async upsertSession(entry: SessionLedgerEntry, usage: SessionUsage, events: SessionEvent[]): Promise<void> {
    this.db.exec("BEGIN");
    try {
      this.db.prepare(`INSERT INTO session_ledger(session_id,run_id,agent_id,agent_label,model_id,task_title,task_text,task_category,status,started_at,ended_at,runtime_ms,artifact_count,error_code,error_message,source_version,ingested_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(session_id) DO UPDATE SET run_id=excluded.run_id,agent_id=excluded.agent_id,agent_label=excluded.agent_label,model_id=excluded.model_id,task_title=excluded.task_title,task_text=excluded.task_text,task_category=excluded.task_category,status=excluded.status,started_at=excluded.started_at,ended_at=excluded.ended_at,runtime_ms=excluded.runtime_ms,artifact_count=excluded.artifact_count,error_code=excluded.error_code,error_message=excluded.error_message,source_version=excluded.source_version,ingested_at=excluded.ingested_at`)
      .run(entry.sessionId, entry.runId ?? null, entry.agentId, entry.agentLabel, entry.modelId, entry.taskTitle ?? null, entry.taskText ?? null, entry.taskCategory ?? null, entry.status, entry.startedAt, entry.endedAt ?? null, entry.runtimeMs, entry.artifactCount, entry.errorCode ?? null, entry.errorMessage ?? null, entry.sourceVersion ?? null, entry.ingestedAt);

      if ((usage.costUsd ?? 0) > 0 && !usage.pricingVersion && usage.costConfidence !== "unknown") {
        throw new Error("pricing_version required for cost-bearing usage rows");
      }

      this.db.prepare(`INSERT INTO session_usage(session_id,prompt_tokens,completion_tokens,total_tokens,runtime_ms,cost_usd,cost_confidence,provider,pricing_version,computed_at,cost_source,token_source,runtime_source,token_confidence,runtime_confidence,cost_confidence_level)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(session_id) DO UPDATE SET prompt_tokens=excluded.prompt_tokens,completion_tokens=excluded.completion_tokens,total_tokens=excluded.total_tokens,runtime_ms=excluded.runtime_ms,cost_usd=excluded.cost_usd,cost_confidence=excluded.cost_confidence,provider=excluded.provider,pricing_version=excluded.pricing_version,computed_at=excluded.computed_at,cost_source=excluded.cost_source,token_source=excluded.token_source,runtime_source=excluded.runtime_source,token_confidence=excluded.token_confidence,runtime_confidence=excluded.runtime_confidence,cost_confidence_level=excluded.cost_confidence_level`)
      .run(usage.sessionId, usage.promptTokens ?? null, usage.completionTokens ?? null, usage.totalTokens ?? null, usage.runtimeMs, usage.costUsd ?? null, usage.costConfidence, usage.provider ?? null, usage.pricingVersion ?? null, usage.computedAt, usage.costSource ?? "unknown", usage.tokenSource ?? "missing", usage.runtimeSource ?? "missing", usage.tokenConfidence ?? "unknown", usage.runtimeConfidence ?? "unknown", usage.costConfidenceLevel ?? "unknown");

      for (const event of events) {
        this.db.prepare("INSERT OR IGNORE INTO session_events(event_id, session_id, seq, event_type, event_ts, payload_json) VALUES(?,?,?,?,?,?)")
          .run(event.eventId, event.sessionId, event.seq, event.eventType, event.eventTs, JSON.stringify(event.payload));
      }

      this.db.prepare("INSERT INTO session_ledger_fts(session_id, task_title, task_text) VALUES(?,?,?)").run(entry.sessionId, entry.taskTitle ?? "", entry.taskText ?? "");
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  async queryLedger(params: LedgerQuery): Promise<{ rows: SessionLedgerEntry[]; total: number }> {
    const where: string[] = [];
    const args: unknown[] = [];
    if (params.agent) { where.push("agent_id=?"); args.push(params.agent); }
    if (params.status) { where.push("status=?"); args.push(params.status); }
    if (params.model) { where.push("model_id=?"); args.push(params.model); }
    if (params.from) { where.push("started_at>=?"); args.push(params.from); }
    if (params.to) { where.push("started_at<=?"); args.push(params.to); }
    if (params.q?.trim()) { where.push("(session_id LIKE ? OR IFNULL(task_title,'') LIKE ? OR IFNULL(task_text,'') LIKE ?)"); args.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sort: SortKey = params.sort ?? "newest";
    const orderBy = sort === "runtime" ? "runtime_ms DESC" : "started_at DESC";

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const total = (this.db.prepare(`SELECT COUNT(*) as c FROM session_ledger ${whereSql}`).get(...args) as { c: number }).c;
    const rows = this.db.prepare(`SELECT * FROM session_ledger ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...args, pageSize, offset) as Array<Record<string, unknown>>;
    return {
      total,
      rows: rows.map(this.mapLedger),
    };
  }

  private mapLedger = (r: Record<string, unknown>): SessionLedgerEntry => ({
    sessionId: String(r.session_id),
    runId: (r.run_id as string | null) ?? undefined,
    agentId: String(r.agent_id),
    agentLabel: String(r.agent_label),
    modelId: String(r.model_id),
    taskTitle: (r.task_title as string | null) ?? undefined,
    taskText: (r.task_text as string | null) ?? undefined,
    taskCategory: (r.task_category as string | null) ?? undefined,
    status: r.status as SessionLedgerEntry["status"],
    startedAt: String(r.started_at),
    endedAt: (r.ended_at as string | null) ?? undefined,
    runtimeMs: Number(r.runtime_ms),
    artifactCount: Number(r.artifact_count),
    errorCode: (r.error_code as string | null) ?? undefined,
    errorMessage: (r.error_message as string | null) ?? undefined,
    sourceVersion: (r.source_version as string | null) ?? undefined,
    ingestedAt: String(r.ingested_at),
  });

  private mapUsage = (r: Record<string, unknown>): SessionUsage => ({
    sessionId: String(r.session_id),
    promptTokens: (r.prompt_tokens as number | null) ?? undefined,
    completionTokens: (r.completion_tokens as number | null) ?? undefined,
    totalTokens: (r.total_tokens as number | null) ?? undefined,
    runtimeMs: Number(r.runtime_ms),
    costUsd: (r.cost_usd as number | null) ?? undefined,
    costConfidence: r.cost_confidence as SessionUsage["costConfidence"],
    provider: (r.provider as string | null) ?? undefined,
    pricingVersion: (r.pricing_version as string | null) ?? undefined,
    computedAt: String(r.computed_at),
    costSource: (r.cost_source as SessionUsage["costSource"] | null) ?? undefined,
    tokenSource: (r.token_source as SessionUsage["tokenSource"] | null) ?? undefined,
    runtimeSource: (r.runtime_source as SessionUsage["runtimeSource"] | null) ?? undefined,
    tokenConfidence: (r.token_confidence as SessionUsage["tokenConfidence"] | null) ?? undefined,
    runtimeConfidence: (r.runtime_confidence as SessionUsage["runtimeConfidence"] | null) ?? undefined,
    costConfidenceLevel: (r.cost_confidence_level as SessionUsage["costConfidenceLevel"] | null) ?? undefined,
  });

  async getSessionDetail(sessionId: string) {
    const ledger = this.db.prepare("SELECT * FROM session_ledger WHERE session_id=?").get(sessionId) as Record<string, unknown> | undefined;
    const usage = this.db.prepare("SELECT * FROM session_usage WHERE session_id=?").get(sessionId) as Record<string, unknown> | undefined;
    const events = this.db.prepare("SELECT * FROM session_events WHERE session_id=? ORDER BY seq ASC").all(sessionId) as Array<Record<string, unknown>>;
    return {
      ledger: ledger ? this.mapLedger(ledger) : undefined,
      usage: usage ? this.mapUsage(usage) : undefined,
      events: events.map((e) => ({
        eventId: String(e.event_id),
        sessionId: String(e.session_id),
        seq: Number(e.seq),
        eventType: e.event_type as SessionEvent["eventType"],
        eventTs: String(e.event_ts),
        payload: JSON.parse(String(e.payload_json)) as Record<string, unknown>,
      })),
    };
  }

  async getStoreSnapshot(): Promise<V3Store> {
    const ledger = (this.db.prepare("SELECT * FROM session_ledger").all() as Array<Record<string, unknown>>).map(this.mapLedger);
    const usage = (this.db.prepare("SELECT * FROM session_usage").all() as Array<Record<string, unknown>>).map(this.mapUsage);
    const events = (this.db.prepare("SELECT * FROM session_events").all() as Array<Record<string, unknown>>).map((e) => ({
      eventId: String(e.event_id), sessionId: String(e.session_id), seq: Number(e.seq), eventType: e.event_type as SessionEvent["eventType"], eventTs: String(e.event_ts), payload: JSON.parse(String(e.payload_json)) as Record<string, unknown>,
    }));
    const alertRules = await this.listAlertRules();
    const alertStates = await this.getAlertStates();
    return { ledger, usage, events, alertRules, alertStates };
  }

  async listAlertRules(): Promise<AlertRule[]> {
    const rows = this.db.prepare("SELECT * FROM alert_rules").all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      ruleId: String(r.rule_id), enabled: Boolean(r.enabled), metric: r.metric as AlertRule["metric"], scopeType: r.scope_type as AlertRule["scopeType"], scopeRef: parseScopeRef(r.scope_ref_json as string | null), warnThreshold: Number(r.warn_threshold), criticalThreshold: Number(r.critical_threshold), window: r.window as AlertRule["window"], comparison: r.comparison as AlertRule["comparison"], dedupCooldownSec: Number(r.dedup_cooldown_sec), createdAt: String(r.created_at), updatedAt: String(r.updated_at),
    }));
  }

  async putAlertRule(rule: AlertRule): Promise<void> {
    this.db.prepare(`INSERT INTO alert_rules(rule_id,enabled,metric,scope_type,scope_ref_json,warn_threshold,critical_threshold,window,comparison,dedup_cooldown_sec,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(rule_id) DO UPDATE SET enabled=excluded.enabled,metric=excluded.metric,scope_type=excluded.scope_type,scope_ref_json=excluded.scope_ref_json,warn_threshold=excluded.warn_threshold,critical_threshold=excluded.critical_threshold,window=excluded.window,comparison=excluded.comparison,dedup_cooldown_sec=excluded.dedup_cooldown_sec,updated_at=excluded.updated_at`)
      .run(rule.ruleId, boolToInt(rule.enabled), rule.metric, rule.scopeType, rule.scopeRef ? JSON.stringify(rule.scopeRef) : null, rule.warnThreshold, rule.criticalThreshold, rule.window, rule.comparison, rule.dedupCooldownSec, rule.createdAt, rule.updatedAt);
  }

  async patchAlertRule(ruleId: string, patch: Partial<AlertRule>): Promise<AlertRule | undefined> {
    const current = (await this.listAlertRules()).find((x) => x.ruleId === ruleId);
    if (!current) return undefined;
    const next = { ...current, ...patch, ruleId, updatedAt: new Date().toISOString() };
    await this.putAlertRule(next);
    return next;
  }

  async getAlertStates(): Promise<AlertState[]> {
    const rows = this.db.prepare("SELECT * FROM alert_state").all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      ruleId: String(r.rule_id), status: r.status as AlertState["status"], lifecycleState: r.lifecycle_state as AlertState["lifecycleState"], suppressedUntil: (r.suppressed_until as string | null) ?? undefined, lastValue: Number(r.last_value), lastEvaluatedAt: String(r.last_evaluated_at), lastTransitionAt: String(r.last_transition_at), lastNotifiedAt: (r.last_notified_at as string | null) ?? undefined, activeFingerprint: (r.active_fingerprint as string | null) ?? undefined, deduped: Boolean(r.deduped),
    }));
  }

  async upsertAlertState(nextState: AlertState): Promise<void> {
    this.db.prepare(`INSERT INTO alert_state(rule_id,status,lifecycle_state,suppressed_until,last_value,last_evaluated_at,last_transition_at,last_notified_at,active_fingerprint,deduped)
      VALUES(?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(rule_id) DO UPDATE SET status=excluded.status,lifecycle_state=excluded.lifecycle_state,suppressed_until=excluded.suppressed_until,last_value=excluded.last_value,last_evaluated_at=excluded.last_evaluated_at,last_transition_at=excluded.last_transition_at,last_notified_at=excluded.last_notified_at,active_fingerprint=excluded.active_fingerprint,deduped=excluded.deduped`)
      .run(nextState.ruleId, nextState.status, nextState.lifecycleState ?? "active", nextState.suppressedUntil ?? null, nextState.lastValue, nextState.lastEvaluatedAt, nextState.lastTransitionAt, nextState.lastNotifiedAt ?? null, nextState.activeFingerprint ?? null, boolToInt(Boolean(nextState.deduped)));
  }

  async resetForTests(seed: Partial<V3Store> = {}): Promise<void> {
    this.db.exec("DELETE FROM session_ledger; DELETE FROM session_events; DELETE FROM session_usage; DELETE FROM alert_rules; DELETE FROM alert_state; DELETE FROM session_ledger_fts;");
    const store: V3Store = { ledger: [], events: [], usage: [], alertRules: [], alertStates: [], ...seed };
    for (const l of store.ledger) {
      const u = store.usage.find((x) => x.sessionId === l.sessionId) ?? { sessionId: l.sessionId, runtimeMs: l.runtimeMs, costConfidence: "unknown", computedAt: new Date().toISOString() } as SessionUsage;
      const e = store.events.filter((x) => x.sessionId === l.sessionId);
      await this.upsertSession(l, u, e);
    }
    for (const r of store.alertRules) await this.putAlertRule(r);
    for (const s of store.alertStates) await this.upsertAlertState(s);
  }

  async importJsonToSqlite(): Promise<ImportReport> {
    const report: ImportReport = { read: 0, written: 0, skipped: 0, errors: 0 };
    let parsed: Partial<V3Store> = {};
    try { parsed = JSON.parse(await readFile(DATA_FILE, "utf8")) as Partial<V3Store>; } catch { return report; }
    const ledger = parsed.ledger ?? [];
    const usageMap = new Map((parsed.usage ?? []).map((u) => [u.sessionId, u]));
    const eventsMap = new Map<string, SessionEvent[]>();
    for (const e of parsed.events ?? []) eventsMap.set(e.sessionId, [...(eventsMap.get(e.sessionId) ?? []), e]);

    for (const l of ledger) {
      report.read += 1;
      try {
        const before = this.db.prepare("SELECT 1 as ok FROM session_ledger WHERE session_id=?").get(l.sessionId) as { ok: number } | undefined;
        await this.upsertSession(l, usageMap.get(l.sessionId) ?? { sessionId: l.sessionId, runtimeMs: l.runtimeMs, costConfidence: "unknown", computedAt: new Date().toISOString() }, eventsMap.get(l.sessionId) ?? []);
        if (before) report.skipped += 1; else report.written += 1;
      } catch {
        report.errors += 1;
      }
    }
    return report;
  }
}

let singleton: SqliteRepository | null = null;
export async function getSqliteRepository(): Promise<SqliteRepository> {
  const cfg = getV3Config();
  if (!cfg.dbPath) throw new Error("HELICARRIER_DB_PATH is required");
  if (!singleton) {
    await mkdir(path.dirname(cfg.dbPath), { recursive: true });
    singleton = new SqliteRepository(cfg.dbPath);
    await singleton.ready();
  }
  return singleton;
}
