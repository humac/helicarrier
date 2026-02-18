# Helicarrier

Mission Control dashboard for OpenClaw.

## Release Status

- **V1 Watchtower:** ✅ Live
- **V2 Command & Control:** ✅ Delivered
- **V3 Intelligence:** ✅ Delivered
- **V4.1 Hardening & Scale:** ✅ Delivered (**QA PASS**)

## V4.1 Hardening Highlights (Delivered)

Helicarrier V4.1 hardens runtime reliability, ingest contracts, and analytics governance.

### 1) Data Platform Hardening
- SQLite repository + migration runner added.
- Startup is **fail-closed** on migration/init failure (no partial degraded write path).
- Baseline schema/indexes included for ledger/analytics/alerts persistence.
- Optional staged JSON -> SQLite importer supports idempotent import behavior.

### 2) Contract & Ingestion Reliability
- Strict ingest contract envelope support with version adapters (`v1`, `v2`).
- Deterministic validation responses for malformed payloads.
- Unsupported contract versions are explicitly rejected.
- Idempotency conflict protection enforced for reused keys with mismatched payloads.

### 3) Governance Hardening
- Cost-bearing usage rows require `pricingVersion`.
- Usage telemetry tracks provenance/source + confidence metadata.
- Alert lifecycle and suppression state persistence is formalized.

### 4) Non-Regression
- Existing V1/V2/V3 surfaces remain green.
- `POST /api/control/model` route is implemented and test-covered.

## Runtime & Configuration Notes (V4.1)

### Required server auth
Protected APIs require a configured server secret and `x-secret-key` request header match.

- `HELICARRIER_SECRET` (primary)
- `OPENCLAW_AUTH_TOKEN` (optional fallback)

### Persistence backend selection
- `HELICARRIER_ENABLE_SQLITE=true` -> use SQLite repository.
- otherwise -> JSON repository path remains available.

### SQLite runtime configuration
- `HELICARRIER_DB_PATH` controls SQLite database file location.
- `HELICARRIER_ENABLE_JSON_IMPORT=true` enables one-time staged JSON import during SQLite initialization.

### Ingest contract behavior (strict)
- Missing `envelope_version` -> `400 VALIDATION_ERROR`
- Unsupported contract version -> `422 UNSUPPORTED_CONTRACT_VERSION`
- Same `idempotency_key` + changed payload -> `409 IDEMPOTENCY_CONFLICT`

## QA Evidence (V4.1)

- `npm test` -> ✅ **47/47 passed**
- `npm run lint` -> ✅ pass
- Integration checks -> ✅ pass (contract, runtime persistence behavior, governance fields, non-regression checks)
- Final QA verdict -> ✅ **PASS**

## Containerized run (recommended)

1. Create `.env` in project root (next to `docker-compose.yml`):

```bash
HELICARRIER_SECRET=change-me
NEXT_PUBLIC_HELICARRIER_SECRET=change-me
OPENCLAW_HOME=$HOME/.openclaw
OPENCLAW_AUTH_TOKEN=

# V4.1 persistence/config toggles
HELICARRIER_ENABLE_SQLITE=true
HELICARRIER_DB_PATH=/app/web/data/helicarrier.sqlite
HELICARRIER_ENABLE_JSON_IMPORT=false
```

2. Build and run:

```bash
docker compose up --build -d
```

## Local development

```bash
cd web
npm ci
npm run dev -- -p 3000
```

Create `web/.env.local`:

```bash
HELICARRIER_SECRET=change-me
NEXT_PUBLIC_HELICARRIER_SECRET=change-me
OPENCLAW_AUTH_TOKEN=
HELICARRIER_ENABLE_SQLITE=true
HELICARRIER_DB_PATH=./data/helicarrier.sqlite
HELICARRIER_ENABLE_JSON_IMPORT=false
```

## Test & lint

```bash
cd web
npm test
npm run lint
```

## Current Active Debt

See `ISSUES.md` for active post-V4.1 debt and next hardening targets.
