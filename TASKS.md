# Implementation Tasks: Helicarrier (Hologram)

## Phase 1: Core Visibility (Read-Only)

**Goal**: Establish the Next.js frontend, connect to the OpenClaw Gateway via WebSocket, and visualize the live agent tree and logs.
**Gate**: Must demonstrate stable, <200ms latency updates for agent status and logs before proceeding to Phase 2.

### 1.1 Project Setup
- **Task**: Initialize Next.js project with TypeScript + Tailwind CSS.
- **Path**: `projects/helicarrier/`
- **Dependencies**: `lucide-react`, `zustand` (or `jotai`), `socket.io-client` (or native `ws`).
- **Acceptance Criteria**:
    - [x] `npm run dev` starts the server on port 3000.
    - [x] UI shows a basic "Hello Helicarrier" landing page.
    - [x] Project structure follows Next.js App Router conventions.

### 1.2 WebSocket Client & Store
- **Task**: Implement the WebSocket client hook and global state store.
- **Path**: `projects/helicarrier/src/hooks/useAgentSocket.ts`, `src/store/agentStore.ts`.
- **Logic**:
    - Connect to `ws://localhost:8080` (configurable via `.env`).
    - Listen for `agent:update` and `agent:log` events.
    - Update Zustand store with normalized agent data (map by ID).
- **Acceptance Criteria**:
    - [x] Client auto-connects on mount.
    - [x] Disconnect banner appears if Gateway is down.
    - [x] Mock events from a test script populate the store correctly.

### 1.3 Agent Tree Component
- **Task**: Build the visual hierarchy of active agents.
- **Path**: `projects/helicarrier/src/components/AgentTree.tsx`.
- **UI**:
    - Recursive tree structure (Parent -> Children).
    - Status indicators (Green=Running, Gray=Idle, Red=Error).
    - Selecting a node highlights it for the Log View.
- **Acceptance Criteria**:
    - [x] Renders a mock tree of depth 3 correctly.
    - [x] Status color updates instantly upon store change.
    - [x] Click selection updates the `selectedAgentId` in the store.

### 1.4 Live Log Stream
- **Task**: Create the log viewer panel for the selected agent.
- **Path**: `projects/helicarrier/src/components/LogViewer.tsx`.
- **UI**:
    - Monospace font, dark background.
    - Auto-scroll to bottom on new logs (toggleable).
    - Virtualized list for performance (handle 10k+ lines).
- **Acceptance Criteria**:
    - [x] Displays logs for the selected agent only.
    - [x] Auto-scroll pauses when user scrolls up.
    - [x] Rendering remains smooth with 50 lines/sec input.

### 1.5 Basic Metrics Dashboard
- **Task**: Add a summary header/sidebar with aggregate metrics.
- **Path**: `projects/helicarrier/src/components/DashboardStats.tsx`.
- **Metrics**: Total Active Agents, Total Tokens Used (mock/real), Gateway Status.
- **Acceptance Criteria**:
    - [x] Stats update in real-time based on store data.
    - [x] Gateway connection status (Up/Down) is clearly visible.

---

**[GATE]: PHASE 1 REVIEW**
- [ ] Manual verification of <200ms update latency.
- [ ] Code review of WebSocket handling and state normalization.
- [ ] Security check: ensure no write actions are exposed yet.

---

## Phase 2: Active Control (Controlled Write)

**Goal**: Enable operators to intervene (Kill, Steer) and manage sessions directly from the UI.
**Prerequisite**: Phase 1 Gate passed.

### 2.1 Control API Client
- **Task**: Implement API functions to call Gateway control endpoints.
- **Path**: `projects/helicarrier/src/lib/api.ts`.
- **Endpoints**:
    - `POST /api/sessions/{id}/kill`
    - `POST /api/sessions/{id}/steer`
    - `POST /api/sessions/spawn` (optional for now)
- **Acceptance Criteria**:
    - [x] Functions return Promises that resolve on success/fail.
    - [x] Error handling for network failures or 4xx/5xx responses.

### 2.2 Agent Action Menu
- **Task**: Add context menu or action buttons to the Agent Tree/Details view.
- **Path**: `projects/helicarrier/src/components/AgentActions.tsx`.
- **UI**:
    - "Kill" button (Red, requires confirmation).
    - "Steer" button (Opens modal).
- **Acceptance Criteria**:
    - [x] Buttons are disabled if the agent is already terminated.
    - [x] "Kill" triggers a confirmation dialog/popover.
    - [x] Confirmed action calls the API client.

### 2.3 Steering Interface
- **Task**: Create a modal for injecting natural language instructions.
- **Path**: `projects/helicarrier/src/components/SteerModal.tsx`.
- **UI**:
    - Textarea for message.
    - "Send" button.
- **Acceptance Criteria**:
    - [x] Submitting sends the text to the `steer` endpoint.
    - [x] Success notification appears (toast).
    - [x] Modal closes on success.

### 2.4 Emergency Stop (Global)
- **Task**: Implement a global "Kill All" or "Panic" button.
- **Path**: `projects/helicarrier/src/components/GlobalControls.tsx`.
- **Logic**: Iterates through active sessions or calls a specific global kill endpoint.
- **Acceptance Criteria**:
    - [x] Requires double confirmation (e.g., type "STOP").
    - [x] Successfully terminates all active agents in the mock environment.
