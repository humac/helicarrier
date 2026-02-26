# Requirements: Helicarrier Mission Control (v2)

## 1. Problem Statement
OpenClaw operators lack a unified visual interface to monitor agent activity, session history, and scheduled tasks. Current interaction is CLI/chat-based, making it hard to get situational awareness across multiple sessions and agents.

## 2. Users & Personas
- **Operator (Main User)**: Needs high-level system health, activity feed, and ability to navigate sessions/logs quickly.
- **Developer**: Needs visibility into tool calls, session history, and scheduled jobs for debugging.

## 3. Functional Requirements

### 3.1 Activity Feed (/feed)
- **FR-01**: Fetch session list + full history via `sessions_list` and `sessions_history` tools
- **FR-02**: Parse messages: content is array of `{ type: "text"|"toolCall", text?, name?, arguments? }` parts
- **FR-03**: Display reverse-chronological timeline with colored dots (blue=tool, green=user, purple=assistant)
- **FR-04**: Filter buttons: All, Tools, Assistant, User
- **FR-05**: Auto-refresh every 30 seconds

### 3.2 Cron Calendar (/calendar)
- **FR-06**: Fetch jobs via `cron` tool with `action: "list"`
- **FR-07**: Parse schedule as object `{ kind: "cron", expr: "0 5 * * *", tz: "..." }` — extract `expr` for parsing
- **FR-08**: Weekly grid view with prev/next navigation, today highlighted
- **FR-09**: Click jobs to expand and show run history via `cron` tool with `action: "runs"`

### 3.3 Global Search (/search)
- **FR-10**: Debounced input that searches in parallel: `memory_search`, workspace grep via `exec`, `sessions_list`, and `cron list`
- **FR-11**: Group results into Memories, Files, Conversations, Tasks sections
- **FR-12**: Highlight matching terms

### 3.4 Agent Banner (Top of Every Page)
- **FR-13**: Show agent name, version (parsed from `session_status` tool output), and whether up to date (check npm registry for latest openclaw version)
- **FR-14**: Stats row: model, context usage, active sessions, runtime mode
- **FR-15**: Connected Resources section: badges for each API key/service available
- **FR-16**: Capabilities section: badges for each tool category (Web Browse, Shell Exec, File System, etc.)
- **FR-17**: Sub-Agents section: list all sessions with keys matching `:subagent:` or `:cron:`, show label, model, token count, running status (pulsing green dot if updated <2min ago), and task description
- **FR-18**: Quick info: human name, GitHub username, workspace path, secrets manager
- **FR-19**: Collapsible — click header to toggle

### 3.5 Navigation
- **FR-20**: Sticky top bar with 🦀 logo, page links (/feed, /calendar, /search), and gateway status indicator (green/red dot, polls /health every 30s)

## 4. Non-Functional Requirements

### 4.1 Architecture
- **NFR-01**: All gateway calls go server-side through API routes using `/tools/invoke` endpoint
- **NFR-02**: Gateway URL and token stored in `.env.local` (never expose to browser)
- **NFR-03**: Gateway wraps responses in envelope: `{ ok, result: { content: [{ type: "text", text: "<JSON>" }], details } }` — write unwrap helper to extract actual data
- **NFR-04**: Gateway timestamps are epoch milliseconds, not seconds

### 4.2 Tech Stack
- **NFR-05**: Next.js (App Router), Tailwind CSS, TypeScript
- **NFR-06**: Project location: `~/projects/helicarrier/`

### 4.3 Theme
- **NFR-07**: Dark: `#0A0A0F` background, `#1A1A2E` cards, `#2A2A3E` borders
- **NFR-08**: Accents: blue (`#60A5FA`), green (`#34D399`), purple (`#A78BFA`), red, yellow
- **NFR-09**: Subtle fade-in animations, loading skeletons

## 5. Prerequisites
- OpenClaw running with gateway accessible (default: http://127.0.0.1:18789)
- Node.js installed
- Gateway token (found in OpenClaw config)

## 6. Acceptance Criteria
- [ ] **Feed Loads**: /feed renders session history with proper message parsing in < 2s
- [ ] **Calendar View**: /calendar shows weekly grid with cron jobs parsed correctly
- [ ] **Search Works**: /search returns grouped results from memory, files, sessions, and cron
- [ ] **Gateway Status**: Top bar indicator accurately reflects gateway health (polls every 30s)
- [ ] **Auto-Refresh**: Feed updates every 30 seconds without manual refresh
- [ ] **Server-Side Only**: No gateway tokens exposed in browser network tab
