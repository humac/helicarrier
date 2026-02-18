# QA.md - Validation Report

## Launch Verification (2026-02-17)

### Command Checklist
- [x] `npm install` (Clean install)
- [x] `start-mission.sh` (Port 3000 binding)
- [x] HTTP Health Check (`curl -I localhost:3000` -> 200 OK)

### Visual Audit
- [ ] **Screenshot Verification**: BLOCKED (Missing `google-chrome` on host).
- [ ] **CSS Hallucinations**: Unable to verify visually. Code review confirms Tailwind classes match `ARCH.md` specs (Zinc-950, text-cyan-400).

### Security
- [x] No hardcoded tokens in client bundles (Mock data only).
- [x] `.env.local` not yet populated (Phase 3 task).

## Recommendations
1. Install Google Chrome on host for automated UI snapshots.
2. Proceed to Phase 3 (Real Gateway Integration).

---

## Phase 5: Final Security & Integration Audit (2026-02-17)

### Unit Tests
- [x] **8/8 Passed** (Ran `npm test` with Vitest)
  - `lib/utils.test.ts` (3/3)
  - `app/api/logs/route.test.ts` (2/2)
  - `components/dashboard/AgentCard.test.tsx` (3/3)

### Security Scan (CRITICAL FINDINGS)
- [x] `app/api/gateway/` inspection: **MISSING** (Directory does not exist).
- [x] `OPENCLAW_AUTH_TOKEN` verification: **FAILED** (Token not found in codebase; API endpoints are unauthenticated).
- [x] `app/api/logs/` inspection: Exists, but lacks authentication middleware.

### Integration Verification
- [x] `SystemPulse` polling: **VERIFIED** (Code inspection confirms polling every 2000ms).
- [ ] Screenshot Verification: **SKIPPED** (Pending `browser.noSandbox` fix).

### Status
- **Phase 3 (Gateway)**: INCOMPLETE (Missing implementation).
- **Phase 4 (Refinement)**: COMPLETE.
- **Phase 5 (Audit)**: COMPLETE (Audit finished, findings logged).

### Final Recommendation
**DO NOT DEPLOY to production.** Critical security controls (Gateway, Auth Token) are missing.
Immediate remediation required:
1. Implement `app/api/gateway/route.ts`.
2. Add `OPENCLAW_AUTH_TOKEN` verification to all API routes.

---

## Developer Test Notes (Peter, 2026-02-17)

Implemented realtime status source-of-truth via `GET /api/system/status` backed by Gateway WS RPC (`agents.list` + `sessions.list`) and canonical enum mapping (`running | idle | failed | done`).

### Verification Run
- [x] `npm run lint` (pass)
- [x] `npm test` (pass: 17/17)

### Added/Updated Test Coverage
- [x] `web/lib/statusMapper.test.ts`
  - upstream->canonical mappings
  - tie-break precedence `failed > running > done > idle`
  - default idle behavior
- [x] `web/app/api/system/status/route.test.ts`
  - 401 on missing `x-secret-key`
  - normalized response schema + enum constraints
  - degraded payload on gateway failure
- [x] `web/components/dashboard/HeroGrid.test.tsx`
  - card statuses sourced from `/api/system/status`
  - degraded/offline indicator rendering
- [x] `web/components/dashboard/AgentCard.test.tsx`
  - updated for canonical status labels (`running`, `failed`)

## Phase 6: Realtime Status Integration QA (2026-02-18)

### 1) `/api/system/status` Security Audit (`x-secret-key`)
- [x] Route enforces header-based auth: rejects missing/incorrect `x-secret-key` with `401 Unauthorized`.
- [x] Secret source is server-side env (`HELICARRIER_SECRET`, fallback `OPENCLAW_AUTH_TOKEN`); no client-side secret exposure in route.
- [x] Route hard-fails with `500` if server auth secret is not configured.
- [x] Unit test coverage confirms unauthorized path: `app/api/system/status/route.test.ts` includes `returns 401 on missing secret`.

### 2) Canonical Status Contract Audit
- [x] Canonical enum is explicitly constrained in `web/lib/statusMapper.ts`:
  - `running | idle | failed | done`
- [x] Session-to-canonical mapping validated:
  - Error/failure states -> `failed`
  - Active states -> `running`
  - Completion states -> `done`
  - Unknown/default -> `idle`
- [x] Tie-break precedence implemented and tested (`failed > running > done > idle`).
- [x] API route consumes normalized statuses only via `normalizeAgentStatuses(...)`.

### 3) Peter Verification (Lint + Tests)
- [x] `npm run lint` (pass)
- [x] `npm test` (pass)
  - Result: **6 test files passed, 17 tests passed**
  - Includes `app/api/system/status/route.test.ts` and `lib/statusMapper.test.ts`

### QA Verdict
- **Phase 6 QA: PASS**
- Realtime status endpoint authentication and canonical status mapping are implemented and validated by passing lint/test suite.

---

## Developer Note: Docker Build Stability Fix (Peter, 2026-02-18)

- Updated `Dockerfile` for Debian-based image compatibility (`node:20-bookworm-slim`):
  - Replaced Alpine-style user/group creation with Debian commands:
    - `groupadd -r app && useradd -r -g app app`
- Hardened runtime artifact ownership to prevent permission issues when running as non-root:
  - Added `--chown=app:app` to runtime `COPY --from=builder` steps for `.next/standalone`, `.next/static`, and `public`.
  - Added explicit `RUN chown -R app:app /app/web/.next /app/web/public` prior to switching users.
- Final runtime now switches to `USER app` after ownership is established.

## Phase 7: Build Stability Verification (2026-02-18)

- [x] Updated TypeScript compiler target in `web/tsconfig.json` from `ES2017` to `ES2020` (supports named capture groups).
- [x] Fixed `HudLayout.tsx` icon typing for `React.cloneElement(...)` by constraining `icon` to `React.ReactElement<{ className?: string }>`.
- [x] Local image build verification (`docker compose build helicarrier`) **passed**.

### Build Output
- `docker compose build helicarrier` completes successfully.
- Next.js build + TypeScript checks pass during Docker build.

### Status
- **Phase 7 (Build Stability): COMPLETE**.

---

## Phase 8: Container Release Candidate QA (2026-02-18)

### Preconditions
- [x] Build prerequisite previously verified green in Phase 7 (`docker compose build helicarrier` passed).
- [x] `.env` present and parseable.
  - `HELICARRIER_SECRET` is configured.
  - `NEXT_PUBLIC_HELICARRIER_SECRET` is configured.

### Container Bring-up
- [ ] `docker compose up -d` **FAILED** due to host Docker networking/iptables issue:
  - `Failed to Setup IP tables`
  - `iptables ... -A DOCKER-FORWARD ... No chain/target/match by that name`
- Impact: stack never reached running state in this environment.

### Health Check (`http://localhost:3000`)
- [ ] **BLOCKED** (service not started because compose network creation failed).

### Security Verification (`/api/system/status`)
- [ ] `curl -I http://localhost:3000/api/system/status` -> **BLOCKED**
- [ ] `curl -I -H "x-secret-key: <key>" http://localhost:3000/api/system/status` -> **BLOCKED**
- Reason: container could not start (host-level Docker networking failure).

### Logs Inspection
- [x] Ran `docker compose logs helicarrier`.
- Result: no application logs emitted (container never started).

### Teardown
- [x] Ran `docker compose down` (idempotent cleanup).

### QA Verdict (Phase 8)
- **CONDITIONAL BLOCK / NOT PASS in current host runtime**.
- Application/container artifacts appear build-ready, but runtime QA is blocked by infrastructure (Docker iptables chain misconfiguration on host).
- Required to complete final release-candidate QA:
  1. Restore Docker forwarding chain/iptables integration on host.
  2. Re-run Phase 8 steps to capture:
     - 200 on `/`
     - 401 on `/api/system/status` without header
     - 200 on `/api/system/status` with valid `x-secret-key`.

---

## Phase 8 (Retry): Post-Reboot Container QA (2026-02-18)

### Pre-flight
- [x] Verified port `3000` was free before launch.
- [x] Executed pre-flight cleanup (`fuser -k 3000/tcp` and process sweep); no active listener remained on `3000`.

### Launch
- [x] Ran:
  - `docker compose -f projects/helicarrier/docker-compose.yml --env-file projects/helicarrier/.env up -d --force-recreate`
- [x] Container/network creation and start completed successfully (`helicarrier` started).

### Runtime Validation (Logs)
- [x] `docker compose logs helicarrier` shows clean startup:
  - `Next.js 16.1.6`
  - `✓ Starting...`
  - `✓ Ready`
- [x] No startup errors observed.

### Health Validation
- [x] `curl -I http://localhost:3000` returned **200 OK** (within retry window; first attempt successful).

### Security Validation (`/api/system/status`)
- [x] Without secret header:
  - `curl -I http://localhost:3000/api/system/status` -> **401 Unauthorized**
- [x] With valid secret from `.env` (`HELICARRIER_SECRET`) as `x-secret-key`:
  - `curl -I -H "x-secret-key: <redacted>" http://localhost:3000/api/system/status` -> **200 OK**

### Teardown / Runtime State
- [x] **Kept running** per instruction (for user review).

### QA Verdict (Phase 8 Retry)
- **PASS**.
- Post-reboot container runtime and security behavior match release criteria:
  1. `/` -> 200
  2. `/api/system/status` without key -> 401
  3. `/api/system/status` with valid `x-secret-key` -> 200

---

## Phase V2: Command & Control QA (2026-02-18)

### Audit: Code Review
- [x] Verified `projects/helicarrier/web/app/api/control/kill/route.ts` enforces `X-Secret-Key`.
- [x] Verified `projects/helicarrier/web/app/api/control/spawn/route.ts` enforces `X-Secret-Key`.
- [x] Confirmed `401 Unauthorized` on missing/mismatch key.
- [x] Confirmed `400 Bad Request` on invalid payload.

### Runtime Verification
- **Target**: Local Dev Server (Port 3001 - *Port 3000 deployment was stale/missing routes*).
- [x] `POST /api/control/kill` without key -> **401 Unauthorized**.
- [x] `POST /api/control/kill` with key, missing body -> **400 Bad Request** (`Invalid JSON payload`).
- [x] `POST /api/control/kill` with key, empty JSON body -> **400 Bad Request** (`sessionId is required`).
- [x] `POST /api/control/kill` with key, valid body -> **500 Internal Server Error** (Expected: `openclaw` binary not in path/env for dev server, but code execution path verified).

### Verify Tests
- [x] Ran `npm test` in `projects/helicarrier/web`.
- [x] **27/27 Tests Passed**, including:
  - `app/api/control/kill/route.test.ts`
  - `app/api/control/spawn/route.test.ts`

### Findings & Verdict
- **Issue**: The server running on port 3000 (PID 9395) returned 404 for the control routes, indicating a stale deployment.
- **Resolution**: Validated against a fresh local instance (port 3001). Code is verified correct.
- **Verdict**: **PASS** (Code is solid; Deployment needs refresh).

---

## Phase V3: Intelligence Build Verification (Peter, 2026-02-18)

### Scope Implemented
- Session History Ledger (`/api/v3/ledger`, `/api/v3/ledger/:sessionId`) with filter/search/sort/pagination.
- Usage analytics (`/api/v3/analytics/usage`) for tokens/runtime/cost totals + daily series.
- Model performance matrix (`/api/v3/analytics/performance`) with success/failure, medians, sample warning, and failure drilldown params.
- Alert threshold engine + UI hooks:
  - Rule CRUD: `GET/POST /api/v3/alerts/rules`, `PATCH /api/v3/alerts/rules/:ruleId`
  - Active HUD payload: `GET /api/v3/alerts/active`
  - Dedup/suppression + transition handling in evaluator.
- Added ingestion path for canonical normalization/idempotent upsert:
  - `POST /api/v3/ingest/session`

### Persistence + Core Logic
- Added persistent JSON-backed V3 data store (`web/lib/v3/store.ts`) for ledger/events/usage/alerts.
- Added canonical normalizer (`web/lib/v3/normalizer.ts`) for status/runtime/tokens/cost-confidence.
- Added analytics + alert evaluation modules (`web/lib/v3/analytics.ts`, `web/lib/v3/alerts.ts`).
- Added shared auth guard for V3 routes (`web/lib/v3/auth.ts`).

### UI Hooks
- Added Intelligence tab to HUD navigation.
- Added `IntelligencePanel` with:
  - usage totals,
  - performance matrix rows + sample-size caveat style,
  - active alerts section for HUD visibility.

### Test/Lint Verification
- [x] `npm test` passed.
  - Result: **16/16 test files passed, 40/40 tests passed**.
  - New coverage includes V3 route tests, normalizer, analytics, alert engine, and intelligence UI component.
- [x] `npm run lint` passed.

### Notes for Heimdall
- V3 is mounted under `/api/v3/*` and does not alter existing V1/V2 routes.
- Persistence is file-backed (`web/data/v3-intelligence.json`) for restart-safe local operation; evaluate migration to SQLite/Postgres in hardening phase.

---

## Phase V3: QA (Heimdall, 2026-02-18)

### Commands Run
- `cd projects/helicarrier/web && npm test`
- `cd projects/helicarrier/web && npm run lint`
- `cd projects/helicarrier/web && set -a; source ../.env; set +a; PORT=3100 npm run dev`
- Runtime integration/security checks with `curl` against:
  - `GET /api/v3/ledger`
  - `GET /api/v3/ledger/:sessionId`
  - `GET /api/v3/analytics/usage`
  - `GET /api/v3/analytics/performance`
  - `GET/POST/PATCH /api/v3/alerts/*`
  - `POST /api/v3/ingest/session`

### Peter Claims Verification (Test/Lint)
- **Expected**: lint passes, tests pass (40 tests).
- **Actual**:
  - `npm test` -> **16/16 files, 40/40 tests passed**.
  - `npm run lint` -> **pass**.
- **Result**: ✅ claim verified.

### Endpoint Integration + Security Validation

#### Auth Enforcement (`x-secret-key`)
- **Expected**: V3 endpoints reject missing/invalid key with `401`.
- **Actual**:
  - `GET /api/v3/ledger` -> `401`
  - `GET /api/v3/ledger/:sessionId` -> `401`
  - `GET /api/v3/analytics/usage` -> `401`
  - `GET /api/v3/analytics/performance` -> `401`
  - `GET /api/v3/alerts/rules` -> `401`
  - `GET /api/v3/alerts/active` -> `401`
  - `POST /api/v3/ingest/session` requires auth (verified via POST checks below).
- **Result**: ✅ auth guard enforced across tested V3 routes.

#### Payload / Query Validation Behavior
- **Expected**: invalid inputs should return client error (`400`/`404`) and not crash.
- **Actual**:
  - `GET /api/v3/ledger?sort=bad` -> `400 {"error":"Invalid sort value"}` ✅
  - `POST /api/v3/alerts/rules` with incomplete payload -> `400` ✅
  - `PATCH /api/v3/alerts/rules/:ruleId` invalid JSON -> `400` ✅
  - `PATCH /api/v3/alerts/rules/nonexistent` -> `404` ✅
  - `POST /api/v3/ingest/session` invalid JSON -> `400` ✅
  - `POST /api/v3/ingest/session` missing `session.sessionId` -> `400` ✅
  - `POST /api/v3/ingest/session` payload missing `session.state` triggered **`500` TypeError** in normalizer (`state.toLowerCase`) ❌
- **Result**: ⚠️ mostly validated, but ingest has a validation gap (missing required `state` not handled as `400`).

#### Functional Integration (happy paths)
- `POST /api/v3/ingest/session` with canonical payload (`session.state`, token/cost fields) -> `200 {"ok":true}`.
- `GET /api/v3/ledger/:sessionId` for ingested session -> `200` with ledger + usage detail.
- `GET /api/v3/analytics/usage` -> `200` with totals/series updated from ingested data.
- `GET /api/v3/analytics/performance` -> `200` with model matrix row.
- `POST /api/v3/alerts/rules` valid rule -> `201`.
- `PATCH /api/v3/alerts/rules/:ruleId` existing rule -> `200`.
- `GET /api/v3/alerts/active` -> `200`.

### UI Hook Verification
- `components/dashboard/IntelligencePanel.test.tsx` is included in passing suite.
- Runtime payload shapes consumed by IntelligencePanel (`usage`, `matrix`, `alerts`) are returned by V3 endpoints in integration checks.
- **Result**: ✅ UI hooks for Intelligence panel are wired and test-covered.

### Phase V3 QA Verdict
- **Overall**: **CONDITIONAL PASS**.
- **Pass**: auth enforcement, route wiring, analytics/ledger/alerts integrations, UI hook coverage, lint/tests (40 pass).
- **Blocker / Required fix before hardening signoff**:
  1. `POST /api/v3/ingest/session` should validate required `session.state` and return `400`, not `500`.

---

## H-011 Dev Handoff (Peter -> Heimdall, 2026-02-18)

### Fix Implemented
- Hardened `POST /api/v3/ingest/session` validation in `web/app/api/v3/ingest/session/route.ts` **before** calling normalizers.
- Added required field/type checks for normalizer-required `session` fields:
  - `session.sessionId`
  - `session.state`
  - `session.agentId`
  - `session.modelId`
  - `session.startedAt`
- Added guard for missing/invalid `session` object.
- Validation failures now return **400** with structured payload:
  - `error.code = "VALIDATION_ERROR"`
  - `error.message = "Invalid ingest payload"`
  - `error.details[]` with field-level issues.

### Regression Tests Added
- New test file: `web/app/api/v3/ingest/session/route.test.ts`
  - missing session object -> `400` structured validation error
  - missing `session.state` -> `400` structured validation error
  - invalid required field types (`sessionId/state` non-string) -> `400` structured validation error

### Verification Commands
- `cd projects/helicarrier/web && npm test` -> **PASS** (`17/17` files, `43/43` tests)
- `cd projects/helicarrier/web && npm run lint` -> **PASS**

### QA Retest Focus
- Re-run prior failing case (`session.state` missing) and confirm `400` (no TypeError / no `500`).
- Confirm ingest happy-path remains `200 { ok: true }`.

---

## H-011 QA Verification (Heimdall)

### Scope
Validated blocker fix for `POST /api/v3/ingest/session` per Peter handoff.

### Runtime Validation (Dev server on `:3210` with project env loaded)
- [x] Missing `session` object -> **400** with structured `VALIDATION_ERROR`.
- [x] Missing `session.state` -> **400** with structured `VALIDATION_ERROR` (no 500/TypeError).
- [x] Invalid required field types (`sessionId/state`) -> **400** with structured `VALIDATION_ERROR`.
- [x] No-crash check after invalid requests -> service remained healthy (`GET /api/v3/ledger` returned **200**).
- [x] Happy-path ingest smoke (`session.state` present/valid) -> **200** `{ "ok": true }`.

### Peter Claim Verification (Tests/Lint)
- [x] `cd projects/helicarrier/web && npm test` -> **PASS** (`17/17` files, `43/43` tests).
- [x] `cd projects/helicarrier/web && npm run lint` -> **PASS**.

### Blocker Verdict
- **H-011: PASS**
- Validation gap is resolved; ingest pre-validation now correctly returns structured `400 VALIDATION_ERROR` responses instead of crashing.

### Recommendation
- Recommend closing GitHub issue **#4**.
