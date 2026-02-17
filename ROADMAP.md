# Project Helicarrier - Strategic Roadmap

> **"I am Iron Man."** - The transition from suit to system.

## V1: The Watchtower (Current Status: ✅ Live)
**Objective**: Passive monitoring and visualization.
- [x] **Hero Grid**: Live status of active agents.
- [x] **System Pulse**: Real-time log streaming.
- [x] **Secure Link**: Token-authenticated API (Log-based).
- [x] **Stark HUD**: Glassmorphism UI/UX.

---

## V2: Command & Control (Next Priority)
**Objective**: Active intervention and task management. Turn the HUD into a cockpit.

### 2.1 Tactical Override ("Kill Switch")
- **Feature**: Button on `AgentCard` to immediately terminate a session.
- **Backend**: API route to execute `openclaw process kill <pid>`.
- **UX**: "Are you sure?" modal with a red "Terminate" confirmation.

### 2.2 Task Injection ("Jarvis Terminal")
- **Feature**: A command line input in the Dashboard to spawn new agents.
- **Capabilities**:
  - `spawn @tony "Design a login page"`
  - `deploy @peter "Fix bug #42"`
- **Backend**: Hooks into `openclaw sessions spawn`.

### 2.3 Agent Reassignment
- **Feature**: Drag-and-drop or dropdown menu to change an agent's active model.
- **Use Case**: "Peter is failing with GPT-3.5; switch him to GPT-4 immediately."

---

## V3: Intelligence (Analytics & History)
**Objective**: Cost optimization and forensic analysis.

### 3.1 The Ledger (Session History)
- **Feature**: Searchable archive of all past sessions.
- **Filter**: By Agent, Outcome (Success/Fail), or Date.
- **Detail View**: Click a session to see the full transcript and artifact diffs.

### 3.2 Cost Heatmap
- **Feature**: Visualization of Token Usage vs. Time.
- **Insight**: Identify which agents/tasks are burning the most budget.
- **Alerts**: "Daily Budget Exceeded" notifications on the HUD.

### 3.3 Model Performance Matrix
- **Feature**: Success rate tracking per model.
- **Data**: "Gemini-Pro passed 8/10 coding tasks; GPT-4 passed 9/10."

---

## V4: Autonomy (Self-Healing)
**Objective**: Automated system regulation.

- **Auto-Scale**: Automatically spawn more @peter instances if the task queue grows.
- **Sentinel Protocol**: If an agent loops for >10 mins without output, auto-kill and respawn.
- **Budget Lock**: Hard stop agents when project budget hits 100%.

---

## Technical Debt / Enablers
- [ ] **API Migration**: Move from "Log Parsing" to true OpenClaw API (when available).
- [ ] **Auth V2**: Implement full User Login (NextAuth) if deploying publicly.
- [ ] **State Database**: Migrate from ephemeral logs to SQLite/Postgres for history (V3 requirement).
