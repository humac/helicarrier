# Requirements: Helicarrier (Hologram)

## 1. Problem Statement
OpenClaw operators currently lack a unified, real-time visual interface to monitor and control agent swarms. Interaction is primarily CLI or chat-based, which becomes unmanageable with multiple active subagents, leading to reduced situational awareness and slower intervention times during critical failures.

## 2. Users & Personas
- **Operator (Main User)**: Needs high-level system health at a glance, with the ability to drill down into specific agent logs and intervene (kill/steer) immediately.
- **Developer**: Needs debug-level visibility into tool calls, latency, and error stacks to diagnose agent misbehavior.

## 3. Functional Requirements

### 3.1 Dashboard & Monitoring
- **FR-01**: Display real-time status of the Main Agent and all active Subagents (Status: Idle, Running, Paused, Error).
- **FR-02**: Visualize the agent hierarchy (Tree view) showing parent-child relationships.
- **FR-03**: Stream recent logs and "thought" processes (reasoning blocks) for selected agents.
- **FR-04**: Display key metrics: Token usage, Session duration, Tool error rates.

### 3.2 Controls (Hologram Interface)
- **FR-05**: Provide a "Kill Switch" for individual agents and a global "Emergency Stop" for the entire swarm.
- **FR-06**: Allow "Steering" messages to be injected into running subagent sessions without killing them.
- **FR-07**: Support manual approval/rejection of sensitive tool calls (Human-in-the-loop).

### 3.3 Session Management
- **FR-08**: List historical sessions with filtering by date, status, and project.
- **FR-09**: specific view for "Zombie" processes or detached agents that need cleanup.

### 3.4 Model Visibility
- **FR-10**: Show which model is backing each agent (e.g., Gemini 3 Pro, Claude 3.7).
- **FR-11**: Visual indicator for context window usage (e.g., progress bar towards limit).

## 4. Non-Functional Requirements
- **NFR-01 (Latency)**: UI updates must reflect agent state changes within < 200ms.
- **NFR-02 (Security)**: Dashboard must be accessible only via authenticated localhost or secured tunnel (no public exposure).
- **NFR-03 (Reliability)**: The dashboard must remain responsive even if the backend agent runtime hangs or crashes.
- **NFR-04 (Tech Stack)**: Frontend: Next.js/React (consistent with existing stack); Backend: Node.js/WebSocket bridge to OpenClaw core.

## 5. Scope
### In Scope
- Web-based Dashboard (Hologram).
- WebSocket integration with OpenClaw runtime.
- Basic read/write controls (Kill, Steer).

### Out of Scope
- Native mobile app.
- Multi-user RBAC (Single operator assumed for Phase 1).
- Voice control integration.

## 6. Acceptance Criteria
- [ ] **Dashboard Load**: Dashboard renders with mock agent data in < 1s.
- [ ] **Live Updates**: Spawning a subagent in CLI immediately (within 1s) appears in the Dashboard tree view.
- [ ] **Kill Command**: Clicking "Kill" on the UI successfully terminates the corresponding CLI process.
- [ ] **Log Stream**: Agent tool outputs are visible in the UI log panel as they happen.
