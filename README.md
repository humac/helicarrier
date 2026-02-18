# Helicarrier

Mission Control dashboard for OpenClaw.

## Release Status

- **V1 Watchtower:** ✅ Live
- **V2 Command & Control:** ✅ Delivered
- **V3 Intelligence:** ✅ Delivered (QA: full pass; release blocker H-011 closed via GitHub #4)

## V3 Intelligence (Delivered)

Helicarrier now includes an Intelligence layer for history, analytics, and operator alerts.

### 1) Session History Ledger
- `GET /api/v3/ledger`
- `GET /api/v3/ledger/:sessionId`
- Search/filter/sort/pagination for historical sessions.

### 2) Usage Analytics
- `GET /api/v3/analytics/usage`
- Token/runtime/cost totals plus daily usage series.

### 3) Model Performance Matrix
- `GET /api/v3/analytics/performance`
- Success/failure rates by model with sample-size caveats and drilldown params.

### 4) Alerting / Threshold Engine
- `GET/POST /api/v3/alerts/rules`
- `PATCH /api/v3/alerts/rules/:ruleId`
- `GET /api/v3/alerts/active`
- Dedup/suppression + state transition support for active HUD alerts.

### 5) Ingestion Path
- `POST /api/v3/ingest/session`
- Canonical normalization + idempotent session upsert into the V3 store.

## Runtime & Environment Notes

### Required server auth
All protected APIs (including `/api/v3/*`) require:

- `HELICARRIER_SECRET` (primary)
- `OPENCLAW_AUTH_TOKEN` (optional server fallback)

Requests must provide `x-secret-key` matching configured server secret.

### V3 persistence (current)
- V3 data is persisted to file-backed storage at:
  - `web/data/v3-intelligence.json`
- This is restart-safe for local/single-node operation.
- Migration to SQLite/Postgres remains tracked as V3 hardening debt.

### Container/runtime notes
- Default URL: `http://localhost:3000`
- Runtime: Next.js 16 in Docker (or local Node runtime)
- Docker image/build stability fixes for Debian Bookworm are applied.

## Containerized run (recommended)

1. Create `.env` in project root (next to `docker-compose.yml`):

```bash
HELICARRIER_SECRET=change-me
NEXT_PUBLIC_HELICARRIER_SECRET=change-me
OPENCLAW_HOME=$HOME/.openclaw
# Optional server fallback
OPENCLAW_AUTH_TOKEN=
```

2. Build and run:

```bash
docker compose up --build -d
```

3. Quick checks:

```bash
curl -I http://localhost:3000
curl -I http://localhost:3000/api/v3/ledger
curl -I -H "x-secret-key: change-me" http://localhost:3000/api/v3/ledger
```

Expected:
- `/` -> `200`
- `/api/v3/ledger` without key -> `401`
- `/api/v3/ledger` with valid key -> `200`

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
```

## Test & lint

```bash
cd web
npm test
npm run lint
```

## Known V3 hardening debt

See `ISSUES.md` for active V3-only blockers/dependencies (contract drift, API migration completion, persistent DB migration, telemetry normalization, ingest validation gap, alert governance, taxonomy, pricing governance).