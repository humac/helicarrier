# Project Helicarrier - Requirements (V4.1 Sprint: Hardening & Scale)

## 1) Product Objective
Stabilize Helicarrier Intelligence (V3) for production-like reliability by hardening data integrity, ingest contracts, and governance policies.

V4.1 delivers a **minimum viable hardening baseline** that reduces drift risk, improves query durability, and increases operator trust in analytics/alerts.

## 2) Sprint Scope (V4.1)
This sprint focuses on three tracks:
1. **Data Store Migration MVP**: move persistence from JSON file storage to **SQLite**.
2. **Contract Hardening (Ingest/Normalization)**: enforce strict, versioned ingest contracts and deterministic normalization behavior.
3. **Alerting/Analytics Governance Minimums**: codify minimum policy and metadata needed for trustworthy alerts/cost analytics.

## 3) MVP Decision: SQLite (V4.1)
**Chosen for V4.1:** SQLite

**Rationale:**
- Lowest operational lift for current deployment model.
- Enables immediate schema/migration/index discipline vs JSON files.
- Provides transactional consistency and better query performance for single-node runtime.

**Deferred:** Postgres as V4.2+ scale path (multi-node/concurrent writer and larger retention demands).

## 4) User Stories

### US-401: Durable Intelligence Storage
As an operator, I need ledger/analytics data persisted in a transactional database so I can trust history and query results across restarts.

### US-402: Ingest Contract Safety
As an operator, I need ingest payload validation and version compatibility checks so upstream contract drift cannot silently corrupt metrics.

### US-403: Governed Analytics & Alerts
As an operator, I need minimum governance for normalization, pricing/version metadata, and alert lifecycle policy so reported insights are explainable and reproducible.

## 5) Functional Requirements

### 5.1 Data Store Migration (FR-DS)
- **FR-DS-01**: System must replace JSON persistence paths for V3 ledger/analytics with SQLite-backed repositories.
- **FR-DS-02**: System must include schema migration mechanism (versioned migrations applied on startup or deploy step).
- **FR-DS-03**: Schema must include indexes for expected V3 query patterns (session lookup, date-range analytics, model/agent filters, active alerts).
- **FR-DS-04**: Existing V3 API behaviors and response contracts must remain compatible (no breaking response shape changes in V4.1).
- **FR-DS-05**: System must define and implement baseline retention/cleanup policy for historical intelligence data.

### 5.2 Contract Hardening (FR-CH)
- **FR-CH-01**: Ingest endpoint must enforce required fields and reject invalid payloads with deterministic 4xx error structure.
- **FR-CH-02**: Normalization layer must include adapter/version guards for supported Gateway/RPC payload variants.
- **FR-CH-03**: Unsupported/incompatible payload versions must fail closed with explicit error reason and observability signal.
- **FR-CH-04**: Contract fixtures must cover known provider/telemetry variants including partial/missing token/cost/runtime fields.
- **FR-CH-05**: Idempotent ingest semantics must be preserved under retries/duplicate payload submission.

### 5.3 Alerting & Analytics Governance Minimums (FR-GV)
- **FR-GV-01**: Canonical telemetry schema must define source/confidence semantics for token/runtime/cost values.
- **FR-GV-02**: Cost records must persist `pricing_version` (or equivalent version pointer) for auditability/reproducibility.
- **FR-GV-03**: Alerting policy must define minimum cadence, severity mapping (`ok|warning|critical`), and dedup/suppression/recovery transitions.
- **FR-GV-04**: Alert event payload contract must remain stable and include rule id, scope, metric value, threshold, and transition timestamp.
- **FR-GV-05**: Governance rules/definitions must be documented in-repo and referenced by implementation/tests.

## 6) Acceptance Criteria (Explicit)

### AC-Data Store (SQLite MVP)
- JSON-backed storage paths used by V3 ledger/analytics are replaced by SQLite repositories in runtime code path.
- Migration runs cleanly from empty DB and from a fixture DB at previous schema version.
- Core V3 endpoints (`/ledger`, `/analytics/usage`, `/analytics/performance`, alerts APIs) return expected results after restart with persisted data intact.
- Query performance for representative dashboard calls is not materially degraded vs V3 baseline under test dataset.

### AC-Contract Hardening
- Invalid ingest payloads (missing required fields, malformed types, unsupported version) return deterministic 4xx with machine-readable error codes.
- Supported payload variants pass validation and produce normalized records with expected canonical fields.
- Duplicate ingest requests do not create duplicate ledger session rows or duplicate alert transitions.
- Contract/integration test suite includes explicit fixtures for drift/partial telemetry cases and passes in CI.

### AC-Governance Minimums
- Each usage/cost record includes confidence/source metadata and a pricing version reference.
- Alert rule evaluation behavior follows documented cadence/severity/dedup policy in automated tests.
- Active alerts feed demonstrates correct transition lifecycle (create, suppress repeat, recover/resolve) under repeated threshold evaluations.
- Governance docs are present and linked from sprint artifacts (`REQ/ARCH/TASKS` chain).

### AC-Non-Regression
- V1/V2 operational surfaces and V3 intelligence APIs continue to pass smoke/integration checks.

## 7) Out of Scope (V4.1)
- Postgres production rollout, replication, and multi-node HA topology.
- Cross-instance federation or multi-tenant data partitioning.
- Advanced forecasting or ML-driven recommendations.
- Full taxonomy backfill for all historical task categories.
- Complete elimination of all legacy log-derived runtime paths unrelated to ingest/normalization hardening in this sprint.

## 8) Dependencies & Risks
- Data migration strategy from existing JSON artifacts into SQLite seed state.
- Contract fixture quality/coverage for upstream payload variants.
- Clear ownership for pricing table/version updates.
- Retention policy tradeoffs (storage growth vs historical forensic depth).

## 9) Handoff Status
**REQ V4.1 Sprint is ready for @tony (Architect)** to produce architecture updates (`ARCH.md`) and implementation plan (`TASKS.md`) for Hardening & Scale MVP.