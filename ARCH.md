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
    UI -->|Visibility Control| OfflineBanner[Offline Banner]
    OfflineBanner -.->|Controls| UI
```

### Key Components
1.  **Helicarrier UI (Frontend)**:
    - **Tech**: Next.js (React), Tailwind CSS, Lucide Icons.
    - **State**: Zustand (Client-side global state for active agents).
    - **Role**: Renders the "Hologram" dashboard, visualizes agent trees, and captures user intent.

2.  **Offline Banner Component** (Critical):
    - **Location**: `src/components/OfflineBanner.tsx`
    - **Visual**: Red background, high contrast text, prominent "Gateway Connection Lost" warning.
    - **Behavior**:
        - Appears only when `isConnected: false`.
        - Covers top 100px of viewport.
        - Displays retry countdown (e.g., "Reconnecting in 3s...").
        - Disappears on successful reconnect.

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

### 2.2 Gateway Connectivity Lifecycle

**Connected State**:
- `isConnected: true` (Zustand store)
- `OfflineBanner` component hidden (opacity-0, pointer-events-none)
- All UI components fully interactive and color-saturated
- Agent tree and logs render normally

**Offline State** (Gateway Down):
- `isConnected: false` (Zustand store)
- `OfflineBanner` component appears at top of viewport
- All agent tree nodes visually grayed out (opacity-50, grayscale)
- Log viewer disabled (no new logs, no auto-scroll)
- Dashboard stats show "OFFLINE" in red
- Auto-retry timer starts (every 2s) with visible countdown

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

### 3.2 Gateway Connectivity State Machine

**State: CONNECTED**
- Condition: WebSocket connection established, Gateway responding to ping
- Behavior:
  - UI shows full color saturation (no grayscale/opacity reductions)
  - All controls enabled (based on permission level)
  - Real-time updates active (<200ms latency)
  - OfflineBanner hidden (opacity-0, pointer-events-none)
- UX: Green status indicator, "Gateway: ONLINE"

**State: DEGRADED**
- Condition: WebSocket connection unstable, intermittent failures
- Behavior:
  - UI shows warning banner (yellow/orange)
  - Auto-retry interval: 5s
  - Write actions disabled but read-only continues
- UX: "Gateway: DEGRADED - Reconnecting..."

**State: OFFLINE**
- Condition: Gateway unreachable (WS disconnect, port down, or network failure)
- Behavior:
  - UI shows red OfflineBanner at top (100px height, z-index 50)
  - Agent tree grayed out (opacity-50, grayscale)
  - Log viewer disabled with "No logs available (Gateway offline)"
  - All write actions hidden/disabled
  - Auto-retry every 2s with visible countdown
- UX: "⚠️ GATEWAY CONNECTION LOST - Retrying every 2s..."

**State: RECOVERING**
- Condition: Auto-retry timer active during disconnection
- Behavior:
  - OfflineBanner shows countdown: "Reconnecting in Xs..."
  - Retry attempts: 3-5 max before showing manual reconnect button
  - Store state persists; UI reflects pending state
- UX: Dynamic countdown in banner

### 3.3 Access Control Levels

**Level 1: Read-Only (Monitor) - Phase 1**
- Allowed: View logs, view tree, view metrics, monitor agent health.
- Blocked: Kill, Steer, Spawn, Pause, any write actions.
- Safeguard: Write UI completely hidden or disabled (no buttons/inputs).

**Level 2: Controlled Write (Operator) - Phase 2**
- Allowed: All Level 1 + Kill, Steer, Pause.
- Safeguard: "Double-confirmation" UI for destructive actions (Kill Swarm, Emergency Stop).
- Permission check: Requires user role verification before write access.

## 4. Failure & Degraded Modes

| Scenario | System Behavior | UX Response |
| :--- | :--- | :--- |
| **Gateway Down** | WebSocket disconnects. API fails. | **UI shows red "OFFLINE BANNER"** at top of dashboard. Agent tree and logs remain visible but **grayed out** (opacity-50). Auto-retry connection every 2s. **All interactive control buttons (Kill, Steer, Panic) are strictly DISABLED** to prevent ghost writes. |

## 5. Performance Strategy (<200ms)

1.  **WebSocket vs Polling**: Strict usage of WebSockets for high-frequency data (Logs/Status). Polling reserved only for initial historical sync.
2.  **Optimistic UI**: For control actions (e.g., Kill), UI marks the agent as "Stopping..." immediately upon button click, awaiting final confirmation.
3.  **Virtualization**: Use `react-window` or similar for Log Stream to handle 10k+ lines without DOM bloating.
4.  **Selective Rendering**: Zustand selectors to ensure a log update for Agent A does not re-render Agent B's component tree.
