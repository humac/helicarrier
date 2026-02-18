# Helicarrier

Mission Control dashboard for OpenClaw.

## V1 Release Status (Final)

Helicarrier V1 is **live** as a **containerized Next.js application**.

- Runtime: Next.js (App Router) in Docker
- Default URL: `http://localhost:3000`
- Port: **3000**
- Auth: `HELICARRIER_SECRET` is required (`x-secret-key` protected API routes)
- Current data source: **local log parsing workaround** (until full Gateway/API migration is finalized)

## What it does

- Live **Agent Hero Grid** (status visualization)
- Live **System Pulse** log stream
- "Stark HUD" UI (glassmorphism, dark mode)
- Protected API endpoints using shared secret auth

## Tech stack

- Next.js (App Router)
- Tailwind CSS
- Framer Motion
- Vitest + Testing Library
- Docker / Docker Compose

## Project structure

```text
helicarrier/
  ARCH.md
  TASKS.md
  ROADMAP.md
  ISSUES.md
  docker-compose.yml
  Dockerfile
  web/
    app/
    components/
    lib/
```

## Containerized run (recommended)

1. Create `.env` in project root (next to `docker-compose.yml`):

```bash
HELICARRIER_SECRET=change-me
NEXT_PUBLIC_HELICARRIER_SECRET=change-me
OPENCLAW_HOME=$HOME/.openclaw
```

2. Build and run:

```bash
docker compose up --build -d
```

3. Check health:

```bash
curl -I http://localhost:3000
```

## Local development (non-container)

```bash
cd web
npm ci
npm run dev -- -p 3000
```

Open: http://localhost:3000

### Required env (local)

Create `web/.env.local`:

```bash
HELICARRIER_SECRET=change-me
NEXT_PUBLIC_HELICARRIER_SECRET=change-me
# Optional fallback for server-side auth lookup
OPENCLAW_AUTH_TOKEN=
```

## Test & lint

```bash
cd web
npm test
npm run lint
```

## Command & Control

Helicarrier V2 introduces active operations controls directly in the dashboard:

- **Kill Switch (Tactical Override):** terminate a running agent/session from the UI for immediate intervention.
- **Task Terminal (Task Injection / Jarvis Terminal):** submit operational commands to spawn and dispatch new work from the dashboard.

### Security requirement

Both Command & Control features are protected and require the `X-Secret-Key` header (validated against `HELICARRIER_SECRET`) for authorized access.

## Security notes

- `/api/system/status` and protected APIs require `x-secret-key` matching `HELICARRIER_SECRET` (or configured server auth fallback).
- Do not commit real secrets.
- Logs are read from host OpenClaw paths mounted read-only into container.

## Current limitations

- Status/log view currently relies on local log parsing as a workaround for upstream API contract constraints.
- Full API-backed migration remains tracked in roadmap/technical debt.

## Backlog

- Replace log parsing data source with official OpenClaw Gateway/API contract when stable.
- Add full user login/auth system (Auth V2) for public deployment.
