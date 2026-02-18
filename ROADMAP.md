# Project Helicarrier - Strategic Roadmap

> **"I am Iron Man."** - The transition from suit to system.

## V1: The Watchtower (Status: ✅ Live)
**Objective**: Passive monitoring and visualization.
- [x] **Hero Grid**: Live status of active agents.
- [x] **System Pulse**: Real-time log streaming.
- [x] **Secure Link**: Token-authenticated API.
- [x] **Stark HUD**: Glassmorphism UI/UX.

---

## V2: Command & Control (Status: ✅ Done)
**Objective**: Active intervention and task management.

- [x] **Tactical Override (Kill Switch)**
- [x] **Task Injection (Jarvis Terminal)**
- [x] **Control route auth + validation**

---

## V3: Intelligence (Status: ✅ Done)
**Objective**: Cost optimization and forensic analysis.

- [x] **Ledger**: Searchable session history + detail API.
- [x] **Usage Analytics**: Token/runtime/cost totals + daily series.
- [x] **Model Performance Matrix**: Success/failure and sample-aware scoring.
- [x] **Alerts**: Threshold rules, active alerts feed, dedup/suppression lifecycle.
- [x] **Intelligence UI hooks**: Dashboard Intelligence panel with usage/matrix/alerts.

**QA Outcome:** PASS (40/40 tests + lint passing). Prior hardening blocker H-011 (ingest payload validation) is fixed; missing `session.state` now returns `400` as expected (GitHub #4 closed).

---

## V4: Hardening & Scale (Next Phase)
**Objective**: Production reliability and data integrity for Intelligence.

### 4.1 Data Platform Hardening
- [ ] Migrate V3 persistence from JSON file to SQLite/Postgres.
- [ ] Add schema migrations, indexes, and retention policy.

### 4.2 Contract & Ingestion Reliability
- [ ] Finalize adapter/version guards for Gateway/RPC contract drift.
- [x] Close ingest validation gap for required fields (`session.state`, etc.).
- [ ] Expand integration/contract fixtures for telemetry/provider variants.

### 4.3 Analytics Governance
- [ ] Canonical telemetry normalization (tokens/runtime/cost confidence).
- [ ] Task category taxonomy for segmented model performance.
- [ ] Versioned pricing table + `pricing_version` auditability.

### 4.4 Alerting Trustworthiness
- [ ] Formalize threshold cadence/severity policy.
- [ ] Validate dedup/suppression/recovery transitions at scale.

### 4.5 Runtime Operations
- [ ] Complete migration off legacy log-derived paths where API equivalents exist.
- [ ] Produce production deployment checklist and runbook.

---

## Post-V4 Direction (Future)
- **Autonomy / Self-Healing**: Auto-scale workers, stuck-loop sentinel, budget lock automation.