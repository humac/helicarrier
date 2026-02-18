import { AlertRule, AlertState, SessionEvent, SessionLedgerEntry, SessionUsage, SortKey, V3Store } from "@/lib/v3/types";

export type LedgerQuery = {
  agent?: string;
  status?: string;
  model?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export type ImportReport = { read: number; written: number; skipped: number; errors: number };

export interface V3Repository {
  ready(): Promise<void>;
  upsertSession(entry: SessionLedgerEntry, usage: SessionUsage, events: SessionEvent[]): Promise<void>;
  queryLedger(params: LedgerQuery): Promise<{ rows: SessionLedgerEntry[]; total: number }>;
  getSessionDetail(sessionId: string): Promise<{ ledger?: SessionLedgerEntry; usage?: SessionUsage; events: SessionEvent[] }>;
  getStoreSnapshot(): Promise<V3Store>;
  listAlertRules(): Promise<AlertRule[]>;
  putAlertRule(rule: AlertRule): Promise<void>;
  patchAlertRule(ruleId: string, patch: Partial<AlertRule>): Promise<AlertRule | undefined>;
  getAlertStates(): Promise<AlertState[]>;
  upsertAlertState(nextState: AlertState): Promise<void>;
  resetForTests(seed?: Partial<V3Store>): Promise<void>;
  importJsonToSqlite?(): Promise<ImportReport>;
}
