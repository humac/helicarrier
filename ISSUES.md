# Project Helicarrier Issues (Active V3 Debt / Blockers Only)

## Open

### [H-002] Gateway RPC contract drift risk (status + telemetry ingestion)

**Status:** Open  
**Priority:** High

**Risk:**
Upstream Gateway/OpenClaw RPC payload changes can break normalization and downstream Intelligence metrics.

**Impact on V3:**
Ledger/history and analytics correctness can degrade if upstream fields drift.

**Required closure:**
- Adapter-level version guards and compatibility handling.
- Contract fixture coverage for supported upstream payload variants.
- Explicit degraded/error behavior when incompatible.

---

### [H-004] Complete migration from legacy log parsing to official API paths

**Status:** Open  
**Priority:** High

**Debt:**
Residual log-derived code paths can conflict with API-derived truth.

**Impact on V3:**
Mixed data provenance weakens confidence in ledger and analytics outcomes.

**Required closure:**
- Remove production dependencies on log parsing where API equivalents exist.
- Centralize API client/normalization/error handling.

---

### [H-006] Persistent state database for V3 ledger/analytics

**Status:** Open  
**Priority:** High

**Dependency:**
Current file-backed JSON store is suitable for local operation but not production-grade scale/governance.

**Impact on V3:**
Limits query performance, migration discipline, and operational durability expectations.

**Required closure:**
- Introduce SQLite/Postgres backing store.
- Define schema/indexes for ledger + analytics queries.
- Add migration + retention strategy.

---

### [H-007] Telemetry normalization gap (tokens/runtime/cost)

**Status:** Open  
**Priority:** High

**Risk:**
Provider telemetry fields differ and may be partial/missing.

**Impact on V3:**
Usage and cost metrics can become incomparable or misleading.

**Required closure:**
- Canonical telemetry schema with nullable/derived fields.
- Provider-specific mappers + fallback estimation policy.
- Confidence/source annotations in reported metrics.

---

### [H-008] Alerting engine governance (threshold cadence + dedup policy)

**Status:** Open  
**Priority:** Medium

**Risk:**
Without deterministic policy, alerts can be noisy, late, or suppressed incorrectly.

**Impact on V3:**
Operator trust in alerting degrades.

**Required closure:**
- Define evaluation cadence/triggers and severity model.
- Verify dedup/suppression/recovery lifecycle under repeated violations.
- Lock stable HUD notification payload contract.

---

### [H-009] Task category taxonomy for performance segmentation

**Status:** Open  
**Priority:** Medium

**Dependency:**
Performance matrix segmentation requires controlled `task_category` labels.

**Impact on V3:**
Cross-task model comparisons are noisy without taxonomy discipline.

**Required closure:**
- Define canonical category set + mapping rules.
- Add `uncategorized` fallback and labeling guidance.
- Backfill/migrate historical sessions where feasible.

---

### [H-010] Pricing table/version governance for cost estimation

**Status:** Open  
**Priority:** Medium

**Dependency:**
Cost estimates require versioned model pricing metadata.

**Impact on V3:**
Cost analytics lose reproducibility/auditability over time.

**Required closure:**
- Introduce versioned pricing configuration.
- Persist `pricing_version` + confidence per usage row/session.
- Define update cadence and owner.

## Notes
- This file intentionally tracks **only active V3 debt/blockers**.
- H-011 is no longer an active blocker: fixed and closed via GitHub issue **#4** on 2026-02-18.
- Non-V3 items are excluded from this closeout view.