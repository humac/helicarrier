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

---

## V4.1: Hardening & Scale (Status: ✅ Complete)
**Objective**: Production reliability and data integrity baseline for Intelligence.

- [x] SQLite repository + migration runner (fail-closed startup).
- [x] Repository abstraction and config-based backend selection.
- [x] Staged JSON -> SQLite import path with idempotent semantics.
- [x] Versioned ingest envelope contract hardening (`v1`, `v2`).
- [x] Ingest idempotency conflict enforcement.
- [x] Governance minimums (`pricingVersion`, telemetry provenance/confidence).
- [x] Alert lifecycle/suppression persistence hardening.
- [x] Non-regression coverage including control model route.

**QA Outcome:** ✅ **PASS** (**47/47 tests + lint + integration/runtime checks**).

---

## V4.2: Scale & Operability (Next Phase Target)
**Objective**: Production-scale operations, observability, and migration confidence at volume.

### 4.2 Focus Areas
- [ ] Postgres production profile and migration path beyond SQLite baseline.
- [ ] Migration/cutover runbook hardening (backup/restore drills, rollback automation, parity checks).
- [ ] Expanded contract fixture matrix for upstream/provider payload variants.
- [ ] Deep observability for ingest/analytics/alert pipelines (SLOs, error budgets, tracing).
- [ ] Alert governance tuning under load (cadence, suppression policy, operator UX thresholds).

---

## Post-V4 Direction (Future)
- **Autonomy / Self-Healing**: Auto-scale workers, stuck-loop sentinel, budget lock automation.
