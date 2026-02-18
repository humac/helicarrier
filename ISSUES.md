# Project Helicarrier Issues

## Open

### [H-002] Gateway RPC contract drift risk (realtime + control plane)

**Status:** Open  
**Created:** 2026-02-17  
**Priority:** High

**Risk:**
Helicarrier depends on Gateway RPC for status and V2 control actions (kill/spawn/reassign). Method names and payloads may drift across OpenClaw builds.

**Mitigation:**
- Keep a stable Helicarrier server API contract for frontend consumption.
- Isolate all upstream mapping in adapter layer (`gatewayClient` + mappers).
- Add mapper/contract tests for canonical states and V2 action responses.
- Return degraded but explicit errors when upstream is incompatible.

**Exit Criteria:**
- Contract verified against deployment target build.
- Canonical status mapping remains stable (`running|idle|failed|done`).
- V2 action endpoints remain frontend-stable despite upstream changes.

---

### [H-003] Docker build failure on Debian Bookworm (user creation syntax mismatch)

**Status:** Open  
**Created:** 2026-02-18  
**Priority:** Medium

**Failure:**
Docker build uses Alpine-style user/group commands (`addgroup -S`, `adduser -S`) that fail on Debian Bookworm.

**Impact:**
Unreliable local/CI container builds.

**Proposed Fix:**
Use Debian-compatible `groupadd`/`useradd` flow (or equivalent), then validate with local `docker build`.

**Exit Criteria:**
- Docker image builds on Bookworm without manual patching.
- CI/local build doc updated with validated command.

---

### [H-004] V1 technical debt carry-over: Log parsing → official API migration

**Status:** Open  
**Created:** 2026-02-18  
**Priority:** Medium

**Debt:**
Legacy log-parsing approach must be fully retired in favor of official OpenClaw API usage.

**Impact on V2:**
Control-plane reliability and maintainability degrade if mixed data/control sources persist.

**Action:**
- Remove remaining log-derived control/status logic where API equivalents exist.
- Centralize API client and response normalization.

**Exit Criteria:**
- No production path depends on log parsing for live control-plane decisions.
- Adapter tests pass for all supported API versions.

---

### [H-005] V1 technical debt carry-over: Auth V2 for public deployment

**Status:** Open  
**Created:** 2026-02-18  
**Priority:** Low

**Debt:**
Current auth posture is insufficient for broader/public deployment.

**Action:**
- Plan and implement Auth V2 (e.g., NextAuth or equivalent) when moving beyond trusted internal usage.

**Exit Criteria:**
- Auth strategy documented and implemented per threat model.
- Session/token handling reviewed by QA/security.

---

### [H-006] V1 technical debt carry-over: Persistent state database for V3 readiness

**Status:** Open  
**Created:** 2026-02-18  
**Priority:** Medium

**Debt:**
Ephemeral/log-based state is insufficient for history, analytics, and cost reporting planned in V3.

**Action:**
- Introduce SQLite/Postgres backing store.
- Define schema for sessions, events, costs, and model outcomes.

**Exit Criteria:**
- Persistent storage integrated for required entities.
- Data retention/query path supports V3 ledger and heatmap features.

## Notes
- Closed/duplicate items should be removed or moved to an archive section in future updates.
- This file currently tracks active issues only.
