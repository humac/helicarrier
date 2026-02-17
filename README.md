# Helicarrier

Mission Control dashboard for OpenClaw.

## What it does

- Live **Agent Hero Grid** (status inference from logs)
- Live **System Pulse** log stream
- "Stark HUD" UI (glassmorphism, dark mode)
- API route protection using `x-secret-key`

## Tech stack

- Next.js (App Router)
- Tailwind CSS
- Framer Motion
- Vitest + Testing Library

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

## Local development

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

> For MVP, `NEXT_PUBLIC_HELICARRIER_SECRET` is intentionally client-visible and must match `HELICARRIER_SECRET`.

## Containerized run

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

3. Check:

```bash
curl -I http://localhost:3000
```

## Test & lint

```bash
cd web
npm test
npm run lint
```

Current baseline:

- Unit tests: **8/8 passing**

## Security notes

- `/api/logs` requires `x-secret-key` matching server secret.
- Do not commit real secrets.
- Logs are read from host OpenClaw paths mounted read-only into container.

## Backlog

- Replace log-parsing data source with official OpenClaw Gateway API when available.
- Add real user login (Phase 7).
