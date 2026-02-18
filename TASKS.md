# TASKS.md - Peter Implementation Plan (V2 Command & Control)

## Phase A - Backend (Control Plane)

- [ ] **Gateway Client Update**: Extend `web/lib/gatewayClient.ts` to support Command methods (`kill`, `spawn`, `setModel`).
- [ ] **Route: Kill Switch**: Create `web/app/api/control/kill/route.ts`.
  - Validate `X-Secret-Key`.
  - Validate payload `{ sessionId }`.
  - Call Gateway.
  - Log `[AUDIT]` event.
- [ ] **Route: Task Spawn**: Create `web/app/api/control/spawn/route.ts`.
  - Validate payload `{ agentId, prompt }`.
  - Call Gateway.
- [ ] **Route: Model Selector**: Create `web/app/api/control/model/route.ts`.
  - Validate payload `{ agentId, model }`.
  - Update Gateway/Config.

## Phase B - Frontend (Components)

- [ ] **Component: KillModal**: Create `web/components/dashboard/KillModal.tsx`.
  - Props: `isOpen`, `sessionId`, `onConfirm`, `onCancel`.
  - Styling: Red/Destructive theme.
- [ ] **Component: TaskTerminal**: Create `web/components/dashboard/TaskTerminal.tsx`.
  - Input field with "Matrix" styling.
  - Handle `Enter` key.
  - Show simple "Sending..." -> "Sent" state.
- [ ] **Component: ModelSelector**: Create `web/components/dashboard/ModelSelector.tsx`.
  - Dropdown with available models.
  - "Apply" button appears on change.
- [ ] **Integration: HeroGrid**: Update `HeroGrid.tsx`.
  - Add `Kill` button to active cards (opens Modal).
  - Add `ModelSelector` to agent cards.

## Phase C - State & Integration

- [ ] **Hook**: Create `web/hooks/useControlPlane.ts`.
  - Functions: `killSession`, `spawnTask`, `setModel`.
  - Handle loading states and error toasts.
- [ ] **Dashboard Layout**: Mount `TaskTerminal` at the bottom of the dashboard (sticky footer or dedicated row).

## Phase D - Testing (Acceptance Criteria)

- [ ] **Test: Kill API**: `web/app/api/control/kill/route.test.ts`.
  - Mock Gateway response.
  - Verify 401 without key.
  - Verify 400 without sessionId.
- [ ] **Test: Kill Modal**: `web/components/dashboard/KillModal.test.tsx`.
  - Renders sessionId.
  - Calls `onConfirm` only when clicked.
- [ ] **Test: Terminal**: `web/components/dashboard/TaskTerminal.test.tsx`.
  - Clears input on success.
  - Does not submit empty string.
- [ ] **Manual Verification**:
  - Kill a dummy process -> Status changes to 'failed/killed' in UI.
  - Spawn a task -> New session appears in list.

## Dependencies
- Requires `ARCH.md` V2 specs.
- Requires Gateway running locally for integration testing.
