# REQ.md - Helicarrier "Hologram" (Integrated Web UI)

## Problem
OpenClaw users currently manage complex agent chains via terminal logs, which makes it difficult to track subagent relationships, monitor real-time token usage, and steer sessions without manual command typing.

## Goals
- Provide a real-time visual dashboard for a local OpenClaw instance.
- Allow session management (spawn, kill, steer) from a browser.
- Minimize installation overhead (bundled with the CLI).
- Zero configuration (detects local `.openclaw` workspace).

## Non-Goals
- Remote hosting/multi-user multi-tenant SaaS.
- Replacing the CLI for core automation tasks.
- External database dependencies (remains SQLite-based).

## User Stories
- **Developer/Operator**: "As an OpenClaw operator, I want to see a live graph of my subagent chain so I can identify loops or stalled agents instantly."
- **Analyst**: "As an analyst, I want to see real-time token/cost consumption for the current session to manage project budgets."
- **CTO (Jarvis)**: "As a project orchestrator, I want a single 'Mission Control' view that doesn't require a separate Next.js server setup."

## Functional Requirements
1.  **Dashboard Display**: Live view of all active sessions and their status.
2.  **Session Steer**: Input field to send `steer` messages to any active subagent.
3.  **Visual Log Stream**: Real-time websocket feed of filtered logs (system, agent, tool).
4.  **Integrated Server**: A background process (via the Gateway) that serves static files and provides a local API.

## Acceptance Criteria
- [ ] `openclaw dashboard` command opens the user's default browser to `localhost:4000` (or similar).
- [ ] Real-time updates via WebSockets show subagent activity within <500ms latency.
- [ ] No manual database migration or setup required beyond the standard OpenClaw install.
- [ ] UI is responsive and accessible on modern browsers.

## Risks/Dependencies
- **Port Conflicts**: Local web server might collide with other services.
- **Security**: Ensuring the local dashboard is only accessible from `localhost`.
- **Latency**: WebSocket overhead on low-resource machines.
