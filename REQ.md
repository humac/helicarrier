# Project Helicarrier - Requirements (V2 Sprint)

## 1) Product Objective
Evolve Helicarrier from a passive monitoring HUD (V1) into an active **Command & Control** cockpit (V2) that allows operators to:
- terminate unhealthy sessions safely,
- inject new tasks quickly,
- and reassign model runtime per agent/session.

## 2) Sprint Scope (V2)
This sprint implements three operator features:
1. **Kill Switch** (Tactical Override)
2. **Task Input** (Jarvis Terminal)
3. **Model Selector** (Agent Reassignment)

Out of scope for this sprint:
- Historical analytics (V3)
- Auto-healing/autonomy (V4)
- Full auth redesign (Auth V2)

## 3) User Stories

### US-201: Kill Switch
As an operator, I want to terminate a running agent session from the dashboard, so I can stop runaway, unsafe, or stuck work immediately.

### US-202: Task Input
As an operator, I want to submit a task command from the dashboard to spawn/deploy work to agents, so I can issue interventions without leaving Helicarrier.

### US-203: Model Selector
As an operator, I want to change the model assigned to an active agent/session, so I can recover from performance/compliance issues quickly.

## 4) Functional Requirements

### 4.1 Kill Switch (FR-KS)
- **FR-KS-01**: Each active session card must display a visible "Kill"/"Terminate" action.
- **FR-KS-02**: Clicking Kill must open a confirmation modal before any termination call is sent.
- **FR-KS-03**: Confirmation modal must include:
  - Session/agent identifier,
  - warning text about irreversible stop,
  - explicit destructive CTA (e.g., red "Terminate" button),
  - cancel option.
- **FR-KS-04**: Termination API must only execute after explicit confirmation.
- **FR-KS-05**: API integration must call the process/session termination path (`openclaw process kill <pid>` or server adapter equivalent).
- **FR-KS-06**: On success, UI must reflect terminated state within normal refresh/realtime cycle.
- **FR-KS-07**: On failure, UI must show actionable error feedback and keep session state unchanged.
- **FR-KS-08**: Prevent duplicate termination requests while one is in-flight (button disabled/loading).

### 4.2 Task Input (FR-TI)
- **FR-TI-01**: Dashboard must provide a command/task input entry area (Jarvis Terminal).
- **FR-TI-02**: Input must accept commands in approved format, including examples:
  - `spawn @tony "Design a login page"`
  - `deploy @peter "Fix bug #42"`
- **FR-TI-03**: Submission must validate non-empty command and basic format before API call.
- **FR-TI-04**: On submit, backend must invoke session spawn/dispatch flow (`openclaw sessions spawn` or server adapter equivalent).
- **FR-TI-05**: UI must show command execution state: idle, submitting, success, error.
- **FR-TI-06**: On success, newly created/affected session must appear in dashboard without manual page reload.
- **FR-TI-07**: On failure, return clear reason and preserve input text for correction/resubmit.
- **FR-TI-08**: Must support keyboard submit (`Enter`) and explicit button submit.

### 4.3 Model Selector (FR-MS)
- **FR-MS-01**: Each manageable agent/session must expose a model selection control (dropdown minimum; drag/drop optional).
- **FR-MS-02**: Selector must list allowed models from configured roster/policy.
- **FR-MS-03**: Current model must be visible before changes.
- **FR-MS-04**: Changing model must require explicit apply/confirm action (to prevent accidental switch).
- **FR-MS-05**: Backend must persist/apply reassignment via OpenClaw-compatible routing/config path.
- **FR-MS-06**: UI must show in-flight status and block repeated apply while update is pending.
- **FR-MS-07**: On success, updated model must display immediately in card/detail state.
- **FR-MS-08**: On failure, UI must surface error and revert selector to last confirmed model.

## 5) Cross-Feature Requirements
- **FR-CF-01**: All mutating actions (kill, spawn/deploy, model change) must be auditable via server logs.
- **FR-CF-02**: All user-facing errors must be non-silent and readable by operators.
- **FR-CF-03**: UI interactions must be mobile-responsive and remain usable on small viewports.
- **FR-CF-04**: Existing V1 monitoring features must remain functional (no regression to Hero Grid/System Pulse).

## 6) Acceptance Criteria (Sprint-Level)
- Operator can terminate an active session only after confirmation modal approval.
- Operator can submit valid task commands from dashboard and see resulting session updates.
- Operator can change model assignment for a target agent/session and observe applied state.
- For each feature, success and failure paths are visible and testable in UI.
- No breaking regressions to V1 watchtower baseline.

## 7) Dependencies & Risks
- Gateway/API contract stability for kill/spawn/reassign operations.
- Backend adapter must normalize upstream responses to stable frontend contract.
- Permission/policy constraints may limit eligible models per agent.

## 8) Handoff Status
**REQ V2 Sprint is ready for @tony (Architect)** to produce updated architecture/design and task breakdown.
