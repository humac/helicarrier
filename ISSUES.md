# Project Helicarrier Issues (Active Debt Only)

## Open

### [H-004] Complete migration from residual legacy log parsing to API-native paths

**Status:** Open  
**Priority:** Medium

**Debt:**
Some legacy log-derived paths remain and should be fully retired in favor of official API-backed normalization.

**Impact:**
Mixed provenance can reduce confidence in historical/analytics interpretation.

**Required closure:**
- Remove remaining production dependencies on log parsing where API equivalents exist.
- Centralize API client normalization/error handling for all ingestion sources.

---

### [H-009] Task category taxonomy governance for performance segmentation

**Status:** Open  
**Priority:** Medium

**Debt:**
Model performance segmentation needs a stricter canonical taxonomy for `task_category`.

**Impact:**
Cross-task comparisons and optimization insights remain noisier than target.

**Required closure:**
- Finalize canonical category set + mapping rules.
- Enforce fallback behavior (`uncategorized`) and labeling guidance.
- Backfill/migrate historical sessions where feasible.

---

### [H-013] SQLite test harness parity in CI/runtime matrix

**Status:** Open  
**Priority:** Medium

**Debt:**
SQLite-specific paths are runtime-validated, but unit-level coverage is constrained in current Vitest environment (`node:sqlite` bundling behavior).

**Impact:**
Regression detection for DB-specific edge cases is less direct than desired in CI.

**Required closure:**
- Add deterministic sqlite-capable test lane (or equivalent harness) in CI.
- Add migration failure-path and importer parity fixtures in automated pipeline.
- Document and enforce expected DB backend test matrix for release gates.

## Notes
- V4.1 resolved/closed hardening items: **H-002, H-006, H-007, H-008, H-010, H-012**.
- H-011 remains previously closed (GitHub #4).
- This file tracks only currently active debt after V4.1 release signoff.
