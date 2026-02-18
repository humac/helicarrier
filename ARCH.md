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

---

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

### 8.4 Usage Analytics Semantics
- **Runtime**: `ended_at - started_at`; if ended missing and terminal event exists, use terminal timestamp.
- **Tokens**: use provider-reported prompt/completion/total when present; otherwise partial nulls allowed.
- **Cost**:
  - `exact`: provider includes billed amount.
  - `estimated`: derived from pricing table version + token counts.
  - `unknown`: insufficient inputs.
- UI must expose confidence/source for non-exact cost.

---

### 8.5 Model Performance Matrix Logic
- Eligible runs for success-rate denominator: terminal outcomes only (`success|failed|killed|cancelled`).
- `failure_count` includes `failed`; `killed/cancelled` retained as separate operational buckets.
- Median runtime/cost computed on eligible runs with non-null metrics.
- `sample_warning=true` when `runs_total < MIN_SAMPLE_N` (default 5; configurable).
- Segmentation precedence: date range required; optional `agent_id`, optional `task_category`.

---

### 8.6 Alerting Rules & Threshold Engine

#### 8.6.1 Evaluation triggers
- On ingestion completion for a terminal session.
- On periodic sweep (e.g., every 5 min) for missed events.

#### 8.6.2 State machine
- `ok -> warning -> critical` on threshold crossing.
- `critical/warning -> resolved -> ok` when metric returns below warn threshold.
- Persist every transition with timestamp and metric value.

#### 8.6.3 Dedup/suppression
- Fingerprint: `rule_id + scope + status + rounded(metric)`.
- Suppress notifications while fingerprint unchanged and cooldown active.
- Always notify on severity escalation or resolved transition.

#### 8.6.4 HUD payload contract
- `ruleId`, `metric`, `scope`, `value`, `warnThreshold`, `criticalThreshold`, `status`, `triggeredAt`, `deduped`.

---

### 8.7 Reliability & Non-Regression
- V1/V2 APIs remain intact; V3 mounted under `/api/v3/*`.
- If ingestion pipeline degrades, ledger remains queryable for already persisted data.
- No control-plane decisions may depend on log parsing.
- Contract tests required at adapter boundary for upstream payload changes.
