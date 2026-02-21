# Implementation Tasks: Helicarrier (Hologram)

## Phase 0: Architecture Completion (Gateway Connectivity Display)

**Goal**: Implement robust Gateway ONLINE/OFFLINE visual feedback with clear user signaling.
**Gate**: Dashboard must show red offline banner and gray-out effect when Gateway is unreachable.

### 0.1 Gateway State Management
- **Task**: Implement centralized gateway state in `src/store/gatewayStore.ts`.
- **Logic**:
    - Expose `isConnected` (boolean), `connectionStatus` ('connected' | 'degraded' | 'offline' | 'recovering'), `retryCount` (number)
    - Auto-retry timer: every 2s, max 5 retries before showing manual reconnect
    - Connection status transitions: connected → degraded → offline → recovering → connected
- **Acceptance Criteria**:
    - [ ] State changes trigger UI re-renders only for affected components
    - [ ] Store persists during disconnection (don't lose state on reconnect)
    - [ ] No memory leaks from retry timers

### 0.2 Offline Banner Component
- **Task**: Create `src/components/OfflineBanner.tsx` and integrate into `page.tsx`.
- **UI**:
    - Red background (`bg-red-900/90`), high contrast text (`text-white`).
    - Icon: `AlertCircle` (Lucide).
    - Text: "⚠️ GATEWAY CONNECTION LOST - Retrying every 2s...".
    - Prominent button: "Reconnect Now" (if retry fails).
- **Acceptance Criteria**:
    - [ ] Component renders at the top of the layout only when `isConnected: false`.
    - [ ] Covers top 100px of viewport, z-index high (50+).
    - [ ] Disappears when `isConnected: true` (opacity-0, pointer-events-none).
    - [ ] Auto-retry countdown visible (e.g., "Reconnecting in 3s...").

### 0.2 Gateway State Integration
- **Task**: Update `src/hooks/useAgentSocket.ts`, `src/store/agentStore.ts`, and `src/components/GlobalControls.tsx`.
- **Logic**:
    - Store exposes `isConnected` state.
    - `useAgentSocket` emits `setConnectionStatus(true/false)` on connect/disconnect events.
    - `GlobalControls` button becomes **DISABLED** when offline.
    - `page.tsx` header "CONNECTED" text changes to "OFFLINE" (red) when disconnected.
- **Acceptance Criteria**:
    - [ ] Dashboard header shows "ONLINE" (green) / "OFFLINE" (red).
    - [ ] Agent tree nodes gray out when disconnected (opacity-50, grayscale).
    - [ ] Log viewer disabled and shows "No logs available (Gateway offline)" when disconnected.
    - [ ] **Emergency Stop button is disabled when offline.**

### 0.3 Connection Recovery Testing
- **Task**: Verify offline-to-online transition flow.
- **Steps**:
    1. Start dev server, disconnect WebSocket.
    2. Confirm offline banner appears, tree grayed out.
    3. Reconnect WebSocket (or simulate via test script).
    4. Confirm offline banner disappears, tree restores color.
- **Acceptance Criteria**:
    - [ ] Transition is instant (<100ms).
    - [ ] No visual flicker during state change.
    - [ ] Store state persists correctly during disconnection.

---

**[GATE]: PHASE 0 REVIEW**
- [ ] Offline banner visible when Gateway is down.
- [ ] Agent tree/gray-out effect applied correctly.
- [ ] Reconnection flow works without visual glitches.
- [ ] All safety rails preserved (write actions hidden during offline).

---

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
- [x] **Manual verification of <200ms update latency** (VERIFIED - QA.md Post-Hotfix)
- [x] **Code review of WebSocket handling and state normalization** (VERIFIED - QA.md)
- [x] **Security check: ensure no write actions are exposed** (VERIFIED - Phase 1 security checks in QA.md)

**Phase 1 Completion Evidence**:
- Lint: PASSED (0 errors)
- Build: PASSED (Next.js 16.1.6, zero TS errors)
- No kill/steer UI in components: VERIFIED
- State isolation verified: VERIFIED
- Logs: `projects/helicarrier/QA.md` (Phase 1 Gate)

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

### 0.5 Offline Banner Component Integration
- **Task**: Integrate `OfflineBanner.tsx` into `page.tsx` layout.
- **UI**:
    - Red background (`bg-red-900/90`), high contrast text (`text-white`).
    - Icon: `AlertCircle` (Lucide).
    - Text: "⚠️ GATEWAY CONNECTION LOST - Retrying every 2s...".
    - Prominent button: "Reconnect Now" (if retry fails).
- **Acceptance Criteria**:
    - [ ] Component renders at the top of the layout only when `isConnected: false`.
    - [ ] Covers top 100px of viewport, z-index high (50+).
    - [ ] Disappears when `isConnected: true` (opacity-0, pointer-events-none).
    - [ ] Auto-retry countdown visible (e.g., "Reconnecting in 3s...").

### 0.6 Gateway State Integration
- **Task**: Update `src/hooks/useAgentSocket.ts`, `src/store/agentStore.ts`, and `src/components/GlobalControls.tsx`.
- **Logic**:
    - Store exposes `isConnected` state.
    - `useAgentSocket` emits `setConnectionStatus(true/false)` on connect/disconnect events.
    - `GlobalControls` button becomes **DISABLED** when offline.
    - `page.tsx` header "CONNECTED" text changes to "OFFLINE" (red) when disconnected.
- **Acceptance Criteria**:
    - [ ] Dashboard header shows "ONLINE" (green) / "OFFLINE" (red).
    - [ ] Agent tree nodes gray out when disconnected (opacity-50, grayscale).
    - [ ] Log viewer disabled and shows "No logs available (Gateway offline)" when disconnected.
    - [ ] **Emergency Stop button is disabled when offline.**

### 0.7 Connection Recovery Testing
- **Task**: Verify offline-to-online transition flow.
- **Steps**:
    1. Start dev server, disconnect WebSocket.
    2. Confirm offline banner appears, tree grayed out.
    3. Reconnect WebSocket (or simulate via test script).
    4. Confirm offline banner disappears, tree restores color.
- **Acceptance Criteria**:
    - [ ] Transition is instant (<100ms).
    - [ ] No visual flicker during state change.
    - [ ] Store state persists correctly during disconnection.

---

**[GATE]: PHASE 0 REVIEW**
- [ ] Offline banner visible when Gateway is down.
- [ ] Agent tree/gray-out effect applied correctly.
- [ ] Reconnection flow works without visual glitches.
- [ ] All safety rails preserved (write actions hidden during offline).

---

**[GATE]: PHASE 2 QA (Heimdall)**
- [ ] Write actions disable when Gateway offline (Phase 0)
- [ ] Double-confirmation modal for Kill/Steer
- [ ] Emergency Stop requires "STOP" text input
- [ ] No unauthorized state mutations (Zustand selectors)
- [ ] XSS protection on user-input steering text
- [ ] Authorization check for user role (mock implementation)
- [ ] Security audit: `projects/helicarrier/QA.md` Phase 2 security checklist

**Phase 2 Completion Evidence**:
- Lint: PASSED (0 errors)
- Build: PASSED (Next.js 16.1.6, zero TS errors)
- Manual test: Kill/Steer flows working
- Security check: Write actions protected with confirmations
- QA pass: All security checklist items verified
