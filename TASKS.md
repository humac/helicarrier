# TASKS.md - Peter Implementation Plan (V4.1 Hardening & Scale)

## Sprint Objective
Deliver V4.1 hardening baseline across:
1. SQLite persistence migration for V3 intelligence data.
2. Contract hardening for ingest/normalization with fail-closed behavior.
3. Governance minimums for pricing/telemetry/alert lifecycle.
4. Non-regression for V1/V2 control surfaces and V3 intelligence APIs.

---

## Phase 0 - Preflight + Flags

### Tasks
- [ ] Add V4.1 feature flags/config:
  - `HELICARRIER_DB_PATH`
  - `HELICARRIER_ENABLE_SQLITE`
  - `HELICARRIER_ENABLE_JSON_IMPORT`
  - `HELICARRIER_CONTRACT_STRICT=true`
- [ ] Document local/dev/prod startup behavior for migrations.
- [ ] Add health/readiness checks that fail when migrations fail.

### Acceptance Criteria
- Service starts with SQLite path configured and reports readiness only after migrations succeed.
- Misconfigured DB path yields deterministic startup failure and non-ready health status.

### Required Tests
- [ ] Startup config test: missing/invalid DB path -> non-ready.
- [ ] Startup config test: valid DB path + flags -> ready.

---

## Phase 1 - SQLite Migration Baseline (FR-DS)

### Tasks
- [ ] Implement migration runner with version table and lock guard.
- [ ] Add baseline migrations for:
  - `session_ledger`
  - `session_events`
  - `session_usage`
  - `daily_usage_agg`
  - `model_perf_agg`
  - `alert_rules`
  - `alert_state`
- [ ] Add required governance columns:
  - `pricing_version`, `cost_source`, `cost_confidence`
  - telemetry source/confidence fields for token/runtime/cost
  - alert lifecycle fields (`lifecycle_state`, `suppressed_until`)
- [ ] Add required indexes + FTS.
- [ ] Enable SQLite pragmas (WAL, FK, busy_timeout).

### Acceptance Criteria
- Fresh DB boots and applies all migrations without manual intervention.
- Fixture DB at previous schema version migrates to latest successfully.
- Query/index plans for common filters (agent/status/model/date/search) are present and used.
- Service remains non-ready when migration fails (fail-closed startup).

### Required Unit Tests
- [ ] Migration test: empty DB -> latest schema.
- [ ] Migration test: previous version fixture -> latest schema.
- [ ] Migration failure test: malformed migration causes startup non-ready.
- [ ] Repository smoke test on migrated schema.

---

## Phase 2 - Repository Abstraction + JSON->SQLite Transition (FR-DS)

### Tasks
- [ ] Introduce interfaces:
  - `LedgerRepository`
  - `UsageRepository`
  - `PerformanceRepository`
  - `AlertRepository`
- [ ] Implement SQLite repositories in infra layer.
- [ ] Refactor services/APIs to depend on interfaces only.
- [ ] Build one-time JSON importer:
  - Read legacy JSON
  - Normalize through canonical path
  - Idempotent upsert into SQLite
  - Emit import report (read/written/skipped/errors)
- [ ] Disable JSON writes behind cutover flag when SQLite enabled.

### Acceptance Criteria
- Runtime V3 read/write path uses SQLite repositories when flag enabled.
- Importer can run repeatedly without duplicate rows.
- Post-import restart preserves data and routes serve from SQLite only.
- JSON write path is disabled during cutover mode.

### Required Unit/Integration Tests
- [ ] Interface contract tests for each repository impl.
- [ ] Import idempotency test (run importer twice, same row counts).
- [ ] Import parity test on fixture dataset (JSON totals == SQLite totals).
- [ ] Restart persistence test (data survives process restart).

---

## Phase 3 - Contract Hardening Layer (FR-CH)

### Tasks
- [ ] Add ingest envelope with required `envelope_version`.
- [ ] Implement version registry and adapters (`v1`, `v2` supported).
- [ ] Implement canonical validator with deterministic field ordering.
- [ ] Implement stable machine-readable error model:
  - `UNSUPPORTED_CONTRACT_VERSION` (422)
  - `VALIDATION_ERROR` (400)
  - `IDEMPOTENCY_CONFLICT` (409)
- [ ] Enforce fail-closed behavior on unknown/incompatible versions.
- [ ] Add idempotency conflict detection for divergent duplicates.

### Acceptance Criteria
- Unsupported version always returns `422 UNSUPPORTED_CONTRACT_VERSION` with structured error payload.
- Invalid payloads return deterministic `400 VALIDATION_ERROR` (same order/shape each run).
- No invalid payload reaches normalization/write path.
- Duplicate retry with same payload is idempotent; conflicting duplicate returns `409`.

### Required Unit/Integration Tests
- [ ] Adapter compatibility tests for known v1/v2 fixtures.
- [ ] Version guard tests (unknown version rejected).
- [ ] Validation determinism test (repeat same invalid payload 10x, identical response body).
- [ ] Fail-closed test (unsupported fields/enums rejected, no writes).
- [ ] Idempotency tests (replay vs conflict branches).
- [ ] Non-regression test for valid historical fixtures.

---

## Phase 4 - Governance Minimums (FR-GV)

### Tasks
- [ ] Enforce `pricing_version` persistence rule for cost rows.
- [ ] Persist telemetry provenance metadata for token/runtime/cost:
  - source (`provider_reported|derived|missing`)
  - confidence (`high|medium|low|unknown`)
- [ ] Update analytics responses to include provenance metadata.
- [ ] Implement alert lifecycle policy persistence:
  - transitions (`ok|warning|critical` + lifecycle `active|suppressed|resolved`)
  - dedup cooldown and suppression persistence
- [ ] Update governance docs references in code comments/docs.

### Acceptance Criteria
- Every cost-bearing usage row has `pricing_version` + source/confidence metadata.
- API exposes provenance metadata without breaking existing V3 field shapes.
- Alert transitions persist deterministically with transition timestamp and lifecycle state.
- Suppressed repeats do not emit duplicate notifications.

### Required Unit/Integration Tests
- [ ] Write-boundary test: estimated cost without pricing_version is rejected.
- [ ] Telemetry provenance mapping test across complete/partial/missing fixtures.
- [ ] Alert lifecycle state machine tests (active/suppressed/resolved).
- [ ] Dedup cooldown tests with repeated evaluations.
- [ ] HUD/alert payload contract stability test.

---

## Phase 5 - V3 Route Compatibility + Query Behavior (FR-DS-04)

### Tasks
- [ ] Validate route compatibility for:
  - `GET /api/v3/ledger`
  - `GET /api/v3/ledger/:sessionId`
  - `GET /api/v3/analytics/usage`
  - `GET /api/v3/analytics/performance`
  - alerts APIs
- [ ] Ensure response shapes remain backward compatible with V3 clients.
- [ ] Ensure required indexes are used for representative filter combinations.

### Acceptance Criteria
- Existing V3 clients can consume V4.1 responses without schema migration.
- Representative dashboard queries are not materially slower than V3 baseline fixture.
- Ledger/analytics/alerts data remains correct after restart.

### Required Unit/Integration Tests
- [ ] Snapshot contract tests for V3 response JSON shapes.
- [ ] Filter-combination tests (agent/model/status/date/search).
- [ ] Query performance guard test on seeded dataset.
- [ ] Restart + read consistency integration test.

---

## Phase 6 - Non-Regression (Mandatory Gate: V1/V2/V3)

### Tasks
- [ ] Run and extend non-regression suite for:
  - V1/V2 routes: `/api/system/status`, `/api/control/kill`, `/api/control/spawn`, `/api/control/model`, `/api/logs`
  - V3 routes: ingest + ledger + analytics + performance + alerts
- [ ] Ensure strict ingest does not break valid legacy fixtures.
- [ ] Add CI gates for regression suites.

### Acceptance Criteria
- **V1** operational status APIs pass smoke/integration.
- **V2** control endpoints pass auth/behavior regression.
- **V3** intelligence APIs pass non-regression plus new hardening tests.
- CI blocks merge on any regression failure.

### Required Tests
- [ ] Auth regression tests (401/403) for control + ingest endpoints.
- [ ] End-to-end chain: ingest -> persistence -> aggregates -> alert eval -> API read.
- [ ] Regression pack for legacy valid payload fixtures (no false rejects).

---

## Release Checklist (Peter)

- [ ] Migrations shipped and verified on clean + upgrade path.
- [ ] JSON importer + report implemented and tested.
- [ ] Contract hardening + deterministic errors implemented.
- [ ] Governance metadata persisted and returned by APIs.
- [ ] Alert lifecycle policy implemented with suppression persistence.
- [ ] V1/V2/V3 non-regression suites green in CI.
- [ ] Short operator runbook added (`how to migrate`, `how to rollback`, `where import report lives`).

---

## Definition of Done (V4.1)

Work is done only when all are true:
1. FR-DS, FR-CH, FR-GV acceptance criteria are met in automated tests.
2. SQLite is the active persistence path for V3 intelligence features.
3. Deterministic fail-closed ingest behavior is enforced and observable.
4. Governance minimums (`pricing_version`, provenance metadata, alert lifecycle) are implemented end-to-end.
5. Non-regression coverage for V1/V2/V3 is passing in CI.
