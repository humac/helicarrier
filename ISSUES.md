# Project Helicarrier Issues

## Open

### [H-001] Gateway API Integration Blocked (Missing Public REST Endpoints)

**Status:** Blocked / Workaround Active
**Created:** 2026-02-17

**Description:**
During Phase 3 of Project Helicarrier (Mission Control Dashboard), we attempted to fetch agent/session status from the OpenClaw Gateway.

**Findings:**
- `GET /v1/sessions` and `/api/v1/sessions` return the HTML Control UI, not JSON.
- Documentation implies `tRPC` or WebSocket usage, which is complex to reverse-engineer for a simple dashboard.

**Workaround:**
- We are currently tailing `~/.openclaw/state/logs/` to infer status.

**Future Task:**
- Revisit this when OpenClaw exposes a documented, read-only REST API for system status (`/v1/system/status`).
- Refactor `components/dashboard/SystemPulse.tsx` to use the API instead of log parsing.
