# ARCH.md - Project Helicarrier Architecture

## Realtime Agent Status Source-of-Truth (No Log Inference)

### 1) Decision
Agent card status must come from the Gateway realtime control plane, not parsed log lines.

- **Primary source**: Gateway WebSocket RPC (`ws://127.0.0.1:18789`)
- **Primary methods**:
  - `agents.list` (agent inventory + runtime metadata)
  - `sessions.list` (live session state)
- **Optional enrichers**:
  - `health` (gateway health)
  - `last-heartbeat` (staleness detection)

Logs remain for **SystemPulse console only** (observability), not status truth.

---

### 2) Architecture

#### 2.1 Data Plane
- Add server-only route: `GET /api/system/status`
- Route uses a **server-side Gateway client** (WebSocket RPC), authenticated by gateway token.
- Route aggregates `agents.list` + `sessions.list` into a normalized payload for UI.
- HeroGrid polls this route; UI never talks directly to Gateway WS.

#### 2.2 Why server-side adapter
- Keeps gateway token off browser.
- Allows strict status normalization contract for frontend.
- Decouples UI from Gateway schema churn.

---

### 3) Normalized Status Model

Helicarrier canonical status enum:

- `running`
- `idle`
- `failed`
- `done`

#### 3.1 Mapping rules (priority order)
For each agent, derive status from structured session/agent data:

1. **failed**
   - any active/recent session has terminal error (`error`, `failed`, `crashed`) or non-empty error field.
2. **running**
   - agent has active run / in-progress state / currently executing.
3. **done**
   - most recent terminal state is success (`done`, `completed`, `finished`) with no active run.
4. **idle**
   - default when reachable and none of the above.

Tie-break rule: `failed > running > done > idle`.

#### 3.2 Response shape
`GET /api/system/status` returns:

```json
{
  "generatedAt": "2026-02-17T21:45:00.000Z",
  "source": "gateway-ws",
  "gateway": { "connected": true, "healthy": true },
  "agents": [
    {
      "id": "tony",
      "name": "Tony",
      "status": "running",
      "lastActivityAt": "2026-02-17T21:44:58.000Z",
      "reason": "active session"
    }
  ]
}
```

---

### 4) Polling Cadence / Freshness

- **UI poll interval**: `2000ms`.
- **Server cache TTL**: `1000ms` (de-duplicate bursts).
- **Degraded mode**:
  - If Gateway unavailable for >10s, mark all agents `idle` with `gateway.connected=false` and expose error banner.

Future upgrade: SSE push from `/api/system/status/stream` once stable.

---

### 5) Security Model

1. **Server-only Gateway auth**
   - `OPENCLAW_AUTH_TOKEN` (or `HELICARRIER_GATEWAY_TOKEN`) used only in server runtime.
   - Never exposed via `NEXT_PUBLIC_*`.

2. **Client -> Helicarrier API auth**
   - Require `X-Secret-Key` on `/api/system/status` and `/api/logs`.
   - Validate against `HELICARRIER_SECRET` (fallback `OPENCLAW_AUTH_TOKEN` allowed only for local dev).

3. **Network scope**
   - Bind Helicarrier to localhost/Tailscale trusted interface only.

4. **Failure behavior**
   - Fail closed on auth mismatch (`401`).
   - Do not silently fall back to log-derived status.

---

### 6) Migration Notes

- Replace HeroGrid data source from `/api/agents`/log inference to `/api/system/status`.
- Keep `SystemPulse` on `/api/logs` for operator visibility.
- Remove any regex-based status parser paths after cutover.

---

### 7) Command & Control (V2)

#### 7.1 Command API
New write-path routes to interact with the OpenClaw Gateway/Runtime.

- **POST /api/control/kill**
  - **Payload**: `{ "sessionId": "string" }`
  - **Action**: Invokes termination on the specific session ID.
  - **Upstream**: Calls `openclaw process kill <pid>` or `sessions kill` equivalent via Gateway adapter.
  - **Response**: `200 OK` (signal sent) or `4xx/5xx` (error).

- **POST /api/control/spawn**
  - **Payload**: `{ "agentId": "string", "prompt": "string" }`
  - **Action**: Spawns a new session for the given agent.
  - **Upstream**: Calls `openclaw sessions spawn`.
  - **Response**: `{ "sessionId": "..." }` or error.

- **POST /api/control/model**
  - **Payload**: `{ "agentId": "string", "model": "string" }`
  - **Action**: Updates the preferred model for an agent.
  - **Upstream**: Updates runtime config or session context.
  - **Response**: `200 OK` (updated).

#### 7.2 Security (Write Actions)
- **Mechanism**: Same `X-Secret-Key` header as read-paths.
- **Policy**:
  - Write actions are **strictly** gated.
  - Missing or invalid key returns `401 Unauthorized` immediately.
  - **Audit**: All control actions are logged to server-side stdout with `[AUDIT]` tag (Operator IP + Action).

#### 7.3 UI Specifications

##### 7.3.1 Task Terminal (Jarvis Input)
- **Location**: Bottom of Dashboard or dedicated "Command" card.
- **Style**: Monospace input, terminal aesthetic (dark background, green cursor).
- **Behavior**:
  - `Enter` to submit.
  - `Up/Down` arrow for history (nice to have).
  - **Feedback**: optimizing for "Command Sent" toast vs. full stream output (V2 MVP = fire and forget).
- **Validation**: Client-side check for empty strings.

##### 7.3.2 Kill Modal (Safety Interlock)
- **Trigger**: "Kill" button on an Active Session card.
- **Visuals**:
  - Danger/Destructive styling (Red accents).
  - **Content**: "Terminate Session [ID]?"
  - **Action**: "Terminate" (Red) / "Cancel" (Gray).
- **Logic**:
  - Must display the exact Session ID being targeted.
  - Button disabled while request is in-flight.

---

## 8) V3 Intelligence Architecture (Ledger + Analytics + Matrix + Alerting)

### 8.1 Goals
Translate V3 requirements into a restart-safe, auditable intelligence layer that can answer:
- What happened in prior sessions? (Ledger)
- Where are tokens/runtime/cost trending? (Usage Analytics)
- Which models are effective for which work? (Performance Matrix)
- When should operators intervene? (Alerting)

### 8.2 Canonical Data Model

#### 8.2.1 `session_ledger`
Immutable top-level session record (upsert by `session_id`).

- `session_id` (pk)
- `run_id` (nullable)
- `agent_id` (indexed)
- `agent_label`
- `model_id` (indexed)
- `task_title` (nullable)
- `task_text` (text, searchable)
- `task_category` (nullable, indexed)
- `status` (`success|failed|killed|cancelled|running|queued`)
- `started_at` (indexed)
- `ended_at` (nullable, indexed)
- `runtime_ms` (derived if missing)
- `artifact_count`
- `error_code` (nullable)
- `error_message` (nullable)
- `source_version` (gateway schema version)
- `ingested_at`

Indexes:
- `(agent_id, started_at desc)`
- `(status, started_at desc)`
- `(model_id, started_at desc)`
- FTS index over `session_id, task_title, task_text`

#### 8.2.2 `session_events`
Timeline/events for detail view and forensic replay.

- `event_id` (pk)
- `session_id` (fk -> `session_ledger`)
- `seq` (monotonic within session)
- `event_type` (`tool_call|message|state_transition|artifact|error|metric`)
- `event_ts`
- `payload_json`

Indexes:
- `(session_id, seq)`
- `(session_id, event_ts)`

#### 8.2.3 `session_usage`
Normalized usage facts (one row per session; optionally provider facets in child table).

- `session_id` (pk/fk)
- `prompt_tokens` (nullable)
- `completion_tokens` (nullable)
- `total_tokens` (nullable)
- `runtime_ms`
- `cost_usd` (nullable/derived)
- `cost_confidence` (`exact|estimated|unknown`)
- `provider` / `pricing_version` (nullable)
- `computed_at`

#### 8.2.4 `daily_usage_agg`
Materialized aggregate for dashboard speed.

- `bucket_date` (pk part)
- `agent_id` (pk part, nullable for global)
- `model_id` (pk part, nullable for global)
- `task_category` (pk part, nullable)
- `runs_total`
- `runtime_ms_total`
- `prompt_tokens_total`
- `completion_tokens_total`
- `total_tokens_total`
- `cost_usd_total`
- `updated_at`

#### 8.2.5 `model_perf_agg`
Precomputed matrix facts by scope + range bucket.

- `window_start` / `window_end`
- `agent_id` (nullable)
- `task_category` (nullable)
- `model_id`
- `runs_total`
- `success_count`
- `failure_count`
- `killed_count`
- `cancelled_count`
- `success_rate` (derived = `success_count / runs_total`)
- `median_runtime_ms`
- `median_cost_usd`
- `sample_warning` (bool when `runs_total < min_sample_n`)
- `updated_at`

#### 8.2.6 `alert_rules` and `alert_state`
Rule definitions separated from runtime state machine.

`alert_rules`:
- `rule_id` (pk)
- `enabled`
- `metric` (`daily_cost_usd|runtime_p95_ms|failure_rate`)
- `scope_type` (`global|agent|model|agent_model`)
- `scope_ref` (nullable JSON)
- `warn_threshold`
- `critical_threshold`
- `window` (`5m|1h|24h|7d`)
- `comparison` (`gt|gte`)
- `dedup_cooldown_sec`
- `created_at` / `updated_at`

`alert_state`:
- `rule_id` (fk)
- `status` (`ok|warning|critical|resolved`)
- `last_value`
- `last_evaluated_at`
- `last_transition_at`
- `last_notified_at`
- `active_fingerprint` (for dedup)

### 8.3 Ingestion & Retrieval Flow

#### 8.3.0 Ingest validation contract (blocking)
For `POST /api/v3/ingest/session`, Helicarrier MUST validate required fields before any normalization/runtime transforms.

- Required minimum: `session.id`, `session.agent_id`, `session.state`, `session.started_at`.
- If any required field is missing/invalid, API MUST return `400 Bad Request` (never `500`).
- Error payload MUST be structured and machine-readable, e.g.:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ingest payload",
    "details": [
      { "field": "session.state", "issue": "required" }
    ]
  }
}
```

- Normalization logic may assume validated inputs; no direct field transforms (e.g., string case ops) may run before this gate.
- Regression coverage is mandatory for malformed payloads to prevent fallback to 500-class errors.

#### 8.3.1 Ingestion pipeline
1. **Source adapters** consume session lifecycle + telemetry events from Gateway/API.
2. **Normalizer** maps provider payloads into canonical schema (status/runtime/tokens/cost taxonomy).
3. **Idempotent writer** upserts `session_ledger`, appends `session_events`, upserts `session_usage`.
4. **Aggregator job** updates `daily_usage_agg` and `model_perf_agg` incrementally.
5. **Alert evaluator** runs on fresh aggregates and updates `alert_state`.
6. **HUD notifier** emits only on state transitions or dedup expiry.

SLA target: completed session appears in ledger quickly; analytics/matrix visible within ≤5 minutes.

#### 8.3.2 Ledger query flow
- `GET /api/v3/ledger?agent=&status=&model=&from=&to=&q=&sort=`
  - Query planner hits indexed filter columns + FTS for keyword.
  - Returns paged summaries (newest-first default).
- `GET /api/v3/ledger/:sessionId`
  - Fetches `session_ledger`, ordered `session_events`, linked artifacts.

#### 8.3.3 Analytics query flow
- `GET /api/v3/analytics/usage?from=&to=&groupBy=day&agent=&model=&task=`
  - Reads from `daily_usage_agg`; backfills from facts if bucket missing.
  - Returns timeseries + totals (tokens/runtime/cost).

#### 8.3.4 Performance matrix query flow
- `GET /api/v3/analytics/performance?from=&to=&agent=&task=`
  - Reads from `model_perf_agg`.
  - Adds `sample_warning` when row count below threshold.
  - Drilldown link points to ledger failures with same filters.

---

## 9) V4.1 Hardening & Scale Architecture Baseline

### 9.1 Scope Linkage
This section defines the V4.1 implementation baseline for FR-DS, FR-CH, and FR-GV from `REQ.md`. It is intentionally minimum-viable and fail-closed.

### 9.2 SQLite Migration Baseline (FR-DS)

#### 9.2.1 Physical DB + operational mode
- Engine: SQLite 3 in WAL mode (`journal_mode=WAL`) for single-node read/write concurrency.
- Foreign keys: enabled on every connection (`PRAGMA foreign_keys=ON`).
- Busy timeout set (e.g., 5000ms) to avoid transient lock failures.
- DB path: configurable via `HELICARRIER_DB_PATH`; default under project data dir.

#### 9.2.2 Schema baseline (v1)
V4.1 keeps existing V3 entities but codifies them as migration-managed tables:
- `session_ledger`
- `session_events`
- `session_usage`
- `daily_usage_agg`
- `model_perf_agg`
- `alert_rules`
- `alert_state`

Governance-required columns in baseline schema:
- `session_usage.pricing_version` (TEXT, nullable only when `cost_confidence=unknown`)
- `session_usage.cost_source` (`provider_reported|estimated_from_pricing|unknown`)
- `session_usage.cost_confidence` (`exact|estimated|unknown`)
- `session_usage.token_source` + `runtime_source` (provider vs derived)
- `alert_state.lifecycle_state` (`active|suppressed|resolved`) and `suppressed_until` (nullable)

Indexes (minimum):
- Ledger: `(agent_id, started_at DESC)`, `(status, started_at DESC)`, `(model_id, started_at DESC)`
- Usage: `(pricing_version)`, `(computed_at DESC)`
- Alerts: `(status, last_transition_at DESC)`, `(lifecycle_state, suppressed_until)`
- FTS for session search remains enabled.

#### 9.2.3 Migration strategy
- Use forward-only versioned SQL migrations: `0001_init.sql`, `0002_v41_governance.sql`, etc.
- Migration runner executes at service startup before API mounts.
- Migration lock: single-process guard table (`schema_migrations_lock`) to prevent duplicate runners.
- Startup behavior:
  1) Open DB
  2) Acquire migration lock
  3) Apply unapplied migrations transactionally
  4) Release lock
  5) Expose readiness
- On migration failure: service is **not ready**; all API routes fail with 503 health signal until fixed.

#### 9.2.4 Repository abstraction
Define repository interfaces decoupled from transport/storage:
- `LedgerRepository`
- `UsageRepository`
- `PerformanceRepository`
- `AlertRepository`
- `MigrationRepository`

Rules:
- API/services depend on interfaces only.
- SQLite implementation lives in infra layer (`infra/sqlite/*`).
- Existing JSON store (legacy) moved behind same interfaces for read-only fallback/import.

#### 9.2.5 JSON -> SQLite transition plan
Two-stage cutover with rollback window:
1. **Import stage (one-time backfill)**
   - Read JSON artifacts, transform via same normalizer, write into SQLite using idempotent upserts.
   - Produce import report: rows read/written/skipped/errors.
2. **Dual-read verification stage (short-lived)**
   - Primary reads from SQLite.
   - Diagnostic endpoint compares sampled JSON vs SQLite aggregates for drift.
3. **Cutover stage**
   - Disable JSON writes entirely.
   - Keep JSON files as immutable backup until V4.2 cleanup.

Rollback policy:
- If SQLite migration/import fails pre-cutover, continue JSON path and block V4.1 release.
- If post-cutover critical defect appears, restore previous build + DB snapshot; no mixed writer mode.

Retention baseline:
- Keep raw session/event rows for 90 days minimum.
- Aggregates retained 365 days.
- Daily cleanup job with dry-run support and audit logs.

### 9.3 Contract Hardening Layer (FR-CH)

#### 9.3.1 Version guards and adapters
Introduce explicit ingress envelope contract:
- `envelope_version` (required)
- `source` (gateway/provider id)
- `payload`

`ContractRegistry` maps supported versions to adapters:
- `v1` -> `GatewayV1Adapter`
- `v2` -> `GatewayV2Adapter`
- unknown -> reject

Behavior:
- Adapter performs structural coercion only (no hidden defaults for required fields).
- Canonical validator runs after adapter output.

#### 9.3.2 Deterministic validation + error model
Validation uses stable error schema:
```json
{
  "error": {
    "code": "<ENUM>",
    "message": "<human summary>",
    "details": [
      { "field": "session.state", "issue": "required", "expected": "string" }
    ],
    "requestId": "<trace id>"
  }
}
```

Error code set (minimum):
- `UNSUPPORTED_CONTRACT_VERSION` (422)
- `VALIDATION_ERROR` (400)
- `IDEMPOTENCY_CONFLICT` (409)
- `INGEST_NOT_AUTHORIZED` (401)
- `INGEST_INTERNAL_ERROR` (500, reserved for unexpected faults only)

Determinism rule:
- Same invalid payload must return same status + error code + field path ordering.

#### 9.3.3 Fail-closed behavior
- If adapter or validator cannot prove payload compatibility, request is rejected.
- No partial writes on rejected ingest.
- Unknown enum values are rejected unless explicitly mapped.
- Incompatible versions emit structured error + telemetry signal (`contract_rejection_total{code,version}`).

#### 9.3.4 Idempotency contract
- Idempotency key: `session_id` + terminal state marker.
- Duplicate retries return success with `idempotent_replay=true` and no duplicate rows/transitions.
- Conflicting duplicate (same key, divergent immutable fields) returns `409 IDEMPOTENCY_CONFLICT`.

### 9.4 Governance Minimums (FR-GV)

#### 9.4.1 Pricing version persistence
- Every persisted cost-bearing usage row must include:
  - `pricing_version`
  - `cost_source`
  - `cost_confidence`
- If source is provider-reported with no pricing lookup, set `pricing_version='provider_native'`.
- Any estimated cost without pricing_version is invalid and rejected at write boundary.

#### 9.4.2 Telemetry confidence/source model
For each metric family (`tokens`, `runtime_ms`, `cost_usd`) store:
- `*_value`
- `*_source` (`provider_reported|derived|missing`)
- `*_confidence` (`high|medium|low|unknown`)

Confidence policy baseline:
- `high`: directly provider reported and internally consistent
- `medium`: derived from complete supporting fields
- `low`: derived with assumptions/fallback heuristics
- `unknown`: insufficient data

API responses expose both value and provenance metadata for auditability.

#### 9.4.3 Alert lifecycle policy
Alert engine persists deterministic lifecycle with explicit transitions:
- `active` (new warning/critical)
- `suppressed` (same fingerprint within cooldown)
- `resolved` (metric back below warn threshold)

Policy minimums:
- Evaluation cadence: on terminal ingest + periodic sweep every 5m.
- Severity mapping: `ok|warning|critical`.
- Dedup key: `rule_id + scope + severity + rounded(metric)`.
- Notify on: first active, severity escalation, resolved.
- Do not notify on: repeated suppressed evaluations.

### 9.5 Backward Compatibility + Non-Regression
- V1/V2 routes untouched functionally.
- V3 route response shapes remain backward compatible in V4.1.
- Contract hardening is additive (stricter ingest) and must not break valid historical fixtures.
- Non-regression suite must gate release for `/api/system/status`, `/api/control/*`, and all V3 read routes.
