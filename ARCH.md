# Architecture: Helicarrier (Hologram)

## 1. System Context & Components

Helicarrier serves as the visual frontend for the OpenClaw agent runtime. It adheres to a strict client-server separation where the OpenClaw Gateway acts as the source of truth.

### Component Diagram

```mermaid
graph TD
    User[Operator] -->|HTTP/WS| UI[Helicarrier UI (Next.js)]
    UI -->|REST (Commands)| Gateway[OpenClaw Gateway]
    Gateway -->|WebSocket (Events)| UI
    Gateway -->|Spawns/Controls| Agents[Agent Runtime]
    Agents -->|Logs/Status| Gateway
    Gateway -->|Persists| DB[(Session Store / Files)]
```

### Key Components
1.  **Helicarrier UI (Frontend)**:
    - **Tech**: Next.js (React), Tailwind CSS, Lucide Icons.
    - **State**: Zustand (Client-side global state for active agents).
    - **Role**: Renders the "Hologram" dashboard, visualizes agent trees, and captures user intent.

2.  **OpenClaw Gateway (Backend)**:
    - **Tech**: Node.js / TypeScript (Existing).
    - **Role**: Manages agent lifecycles, aggregates logs, and broadcasts state changes.
    - **Interface**: Exposes WebSocket endpoint (events) and REST/RPC endpoints (actions).

## 2. Data Flow

### 2.1 Real-Time Updates (Read Path)
To meet the **<200ms latency** requirement (NFR-01), we prioritize push-based updates over polling.

1.  **Event Generation**: An agent (e.g., Peter) changes state (Run -> Idle) or emits a log.
2.  **Gateway Ingestion**: The Gateway receives this event internally.
3.  **Broadcast**: Gateway pushes a JSON payload via WebSocket to all connected Helicarrier clients.
    - *Topic*: `agent:update` or `agent:log`
    - *Payload*: `{ sessionId: "uuid", status: "idle", timestamp: 123456789 }`
4.  **UI Ingestion**:
    - WebSocket hook receives message.
    - Zustand store updates the specific agent node.
    - React components re-render only the affected node (using selective state subscription).

### 2.2 Control Actions (Write Path)
1.  **User Trigger**: User clicks "Kill" on Agent X.
2.  **API Request**: UI sends `POST /api/sessions/{id}/kill` to Gateway.
3.  **Gateway Execution**: Gateway terminates the process.
4.  **Confirmation**: Gateway broadcasts `agent:update` { status: "terminated" }.
5.  **UI Update**: UI reflects the new status via the standard Read Path (ensuring consistency).

## 3. Security Model

### 3.1 Network Scope
- **Default**: Localhost (127.0.0.1) binding only.
- **Remote**: Requires SSH Tunnel or VPN. No public internet exposure.

### 3.2 Access Control Levels
- **Level 1: Read-Only (Monitor)**
    - Allowed: View logs, view tree, view metrics.
    - Blocked: Kill, Steer, Spawn.
    - *Phase 1 Implementation*.
- **Level 2: Controlled Write (Operator)**
    - Allowed: All Level 1 + Kill, Steer, Pause.
    - Safeguard: "Double-confirmation" UI for destructive actions (Kill Swarm).
    - *Phase 2 Implementation*.

## 4. Failure & Degraded Modes

| Scenario | System Behavior | UX Response |
| :--- | :--- | :--- |
| **Gateway Down** | WebSocket disconnects. API fails. | UI shows red "Offline" banner. Auto-retry connection every 2s. Cached state remains visible but grayed out. |
| **Agent Crash** | Gateway detects process exit code > 0. | UI updates agent node to "Error" red state. Last log lines highlighted. |
| **High Load** | Log volume exceeds UI render cap. | UI throttles log rendering (e.g., max 60fps or windowing). "Pause Scroll" auto-activates. |

## 5. Performance Strategy (<200ms)

1.  **WebSocket vs Polling**: Strict usage of WebSockets for high-frequency data (Logs/Status). Polling reserved only for initial historical sync.
2.  **Optimistic UI**: For control actions (e.g., Kill), UI marks the agent as "Stopping..." immediately upon button click, awaiting final confirmation.
3.  **Virtualization**: Use `react-window` or similar for Log Stream to handle 10k+ lines without DOM bloating.
4.  **Selective Rendering**: Zustand selectors to ensure a log update for Agent A does not re-render Agent B's component tree.
