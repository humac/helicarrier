# TASKS.md - Peter Implementation Plan (V3 Intelligence)

## Objective
Implement V3 Intelligence features end-to-end:
1) Session History Ledger
2) Usage Analytics (tokens/runtime/cost)
3) Model Performance Matrix
4) Alerting Thresholds (with dedup + state transitions)

---

## Priority Hotfix - H-011 (Ingest Validation)

- [ ] Guard `POST /api/v3/ingest/session` with required-field validation before normalization.
- [ ] Add/confirm required ingest fields include `session.state`.
- [ ] Return structured `400` validation error payloads for missing required fields (no `500` on client payload defects).
- [ ] Add regression tests for malformed ingest payloads.

### Acceptance Criteria (H-011)
- Missing required field(s) returns `400 Bad Request`.
- Response body is structured validation output (includes field-level detail such as `session.state`).
- No missing-field ingest case can trigger unhandled exceptions/`500`.
- Regression tests cover malformed ingest payloads and pass in CI.

### Required Tests (H-011)
- [ ] API test: missing `session.state` -> `400` with structured validation details.
- [ ] API test: other missing required ingest field(s) -> `400`.
- [ ] Regression test: malformed payloads never reach `state.toLowerCase`-style runtime faults.

---

## Phase 1 - Data Foundation (Schema + Migrations)

- [ ] Create persistent schema/migrations for:
  - `session_ledger`
  - `session_events`
  - `session_usage`
  - `daily_usage_agg`
  - `model_perf_agg`
  - `alert_rules`
  - `alert_state`
- [ ] Add required indexes (agent/status/model/date + FTS for ledger search).
- [ ] Add repository/DAO layer with typed interfaces.
- [ ] Add migration smoke check in CI.

### Acceptance Criteria
- DB initializes from clean state and applies migrations successfully.
- Restart preserves prior session history and aggregate rows.
- Ledger query by agent/status/date/model and keyword search returns expected records.

### Required Unit Tests
- [ ] Migration test: applies up/down sequence on empty DB.
- [ ] Repository test: CRUD + index-backed filter queries.
- [ ] FTS test: keyword search matches session id/title/task text.

---

## Phase 2 - Ingestion + Normalization Pipeline

- [ ] Implement ingestion worker from Gateway/API telemetry.
- [ ] Build canonical normalizer:
  - status mapping (`success|failed|killed|cancelled|running|queued`)
  - runtime derivation logic
  - token normalization (prompt/completion/total)
  - cost confidence (`exact|estimated|unknown`)
- [ ] Implement idempotent upsert semantics for repeated events.
- [ ] Write/update aggregate updater for `daily_usage_agg` and `model_perf_agg`.

### Acceptance Criteria
- Re-processing same source events does not duplicate ledger/session usage rows.
- Completed sessions appear in analytics aggregates within SLA target (≤5 min).
- Derived cost and runtime are populated consistently when raw payload is partial.

### Required Unit Tests
- [ ] Normalizer fixtures for at least 2 provider payload variants.
- [ ] Idempotency test: duplicate ingest batch yields no double-counted aggregates.
- [ ] Runtime derivation test: fallback to terminal timestamp when ended_at missing.
- [ ] Cost confidence test for exact/estimated/unknown branches.

---

## Phase 3 - V3 Read APIs

- [ ] Implement `GET /api/v3/ledger` (filters + search + sort + pagination).
- [ ] Implement `GET /api/v3/ledger/:sessionId` (session detail + timeline + artifacts).
- [ ] Implement `GET /api/v3/analytics/usage` (timeseries + totals).
- [ ] Implement `GET /api/v3/analytics/performance` (matrix rows + sample warning + drilldown link params).
- [ ] Define API contracts in shared types.

### Acceptance Criteria
- Ledger endpoint supports agent/outcome/model/date + keyword query and default newest-first sorting.
- Session detail endpoint returns timeline ordered and artifact links when present.
- Usage endpoint returns totals and trend points for tokens/runtime/cost over selected range.
- Performance endpoint returns runs/success/failure/success_rate/median runtime/median cost with sample-size caveat.

### Required Unit Tests
- [ ] API auth/validation tests (401/400).
- [ ] Ledger filter-combination tests.
- [ ] Ledger sort tests (`newest`, `runtime`, `cost`).
- [ ] Performance matrix computation test with controlled fixture dataset.
- [ ] Drilldown query builder test for failed rows.

---

## Phase 4 - Alerting Rules Engine

- [ ] Implement rule CRUD endpoints:
  - `GET /api/v3/alerts/rules`
  - `POST /api/v3/alerts/rules`
  - `PATCH /api/v3/alerts/rules/:id`
- [ ] Implement evaluator for metrics:
  - `daily_cost_usd`
  - `runtime_p95_ms`
  - `failure_rate`
- [ ] Implement state transitions (`ok|warning|critical|resolved`).
- [ ] Implement dedup/suppression using rule fingerprint + cooldown.
- [ ] Expose active alerts payload for HUD.

### Acceptance Criteria
- Rules can be created/updated and persisted.
- Threshold crossings produce correct warning/critical transitions with payload.
- Repeated violating evaluations without value/state changes do not spam duplicates.
- Recovery below threshold resolves/downgrades alert state correctly.

### Required Unit Tests
- [ ] Rule validation tests (scope + thresholds + window).
- [ ] Transition tests for escalate/de-escalate/recover scenarios.
- [ ] Dedup cooldown tests (same fingerprint suppressed).
- [ ] HUD payload contract test includes metric value + threshold + scope.

---

## Phase 5 - UI Integration (Dashboard V3)

- [ ] Add Ledger view (table + filters + search + detail drawer/page).
- [ ] Add Usage Analytics view (totals + timeseries chart + range filters).
- [ ] Add Performance Matrix view (sortable model rows + sample warning + failure drilldown).
- [ ] Add Alerting config + Active Alerts HUD section.
- [ ] Ensure V1/V2 controls remain operational and visible.

### Acceptance Criteria
- Operator can perform all AC flows from REQ.md (ledger, analytics, matrix, alerting).
- Active alerts are visible with severity + timestamp + metric payload.
- Failed matrix row click opens ledger filtered to matching failures.
- V1/V2 smoke checks pass after V3 UI integration.

### Required Unit/Component Tests
- [ ] Ledger filter/search component tests.
- [ ] Usage chart data mapping test.
- [ ] Matrix sample-warning rendering test (`n < 5`).
- [ ] Alert rule form validation tests.
- [ ] Active alert card rendering + severity style test.

---

## Phase 6 - Non-Regression + Performance

- [ ] Keep V1/V2 APIs and existing command controls stable.
- [ ] Add regression suite for hero status + control endpoints.
- [ ] Add query performance checks for typical date windows.
- [ ] Add audit logging for ingestion errors and alert transitions.

### Acceptance Criteria
- Existing V1/V2 smoke tests remain green.
- Ledger query and analytics API latencies are acceptable for target window (document baseline).
- Error paths return operator-readable messages (not silent failures).

### Required Tests
- [ ] Regression tests for `/api/system/status`, `/api/control/kill`, `/api/control/spawn`.
- [ ] Integration test: ingest -> aggregates -> alert eval chain.
- [ ] Load-ish test for ledger query pagination under seeded dataset.

---

## Definition of Done (Peter)

All phases complete when:
1. V3 features satisfy REQ acceptance criteria (AC-Ledger, AC-Usage Analytics, AC-Performance Matrix, AC-Alerting).
2. Required unit/integration tests are implemented and passing in CI.
3. Non-regression checks for V1/V2 are passing.
4. API contracts and metric definitions are documented in code-level docs/README notes.