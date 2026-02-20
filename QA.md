# QA.md - Phase 1 Gate

## Ownership
- QA/Security Lead: Heimdall
- Dev Lead: Peter

## Commands Run
- `npm run lint` (Fixed 1 `any` type error)
- `npm run build` (Fixed missing `clsx`, updated `react-window` / `react-virtualized-auto-sizer` API usage)

## Security Checks (Phase 1 Read-Only)
- [x] **No Kill/Steer UI**: Verified `AgentTree.tsx`, `LogViewer.tsx`, `DashboardStats.tsx` contain no buttons or API calls for `kill`, `steer`, or `spawn`.
- [x] **No Write API Clients**: Verified `src/hooks/useAgentSocket.ts` only listens for events (`agent:update`, `agent:log`) and does not emit control messages.
- [x] **State Isolation**: Zustand store `agentStore.ts` contains `upsertAgent` and `addLog` but no actions to mutate backend state.

## Test Results
- **Lint**: PASSED (clean).
- **Build**: PASSED (Next.js production build succeeded).
- **Component Logic**:
    - `AgentTree`: Correctly uses recursion and `useMemo` for efficient rendering.
    - `LogViewer`: Correctly uses `react-window` (virtualization) and `react-virtualized-auto-sizer` for high-performance log streaming (handles NFR-01/05).
    - `DashboardStats`: Correctly derives metrics from store.

## Verdict
- **PASS**

## Notes
- **Library Updates**: The project uses `react-window` v2+ and `react-virtualized-auto-sizer` v2+, which have breaking API changes compared to v1.
    - `FixedSizeList` -> `List` (with `rowHeight` prop).
    - `AutoSizer` children as function -> `renderProp` prop.
    - **Action Taken**: Codebase updated to match these APIs during QA fix cycle.
- **Metrics**: Token usage is currently hardcoded to 0 (mocked) as backend support is pending. This is acceptable for Phase 1.

## Next Steps
- Proceed to Phase 2 (Controlled Write).

# QA.md - Phase 2 Gate

## Ownership
- QA/Security Lead: Heimdall
- Dev Lead: Peter

## Commands Run
- `npm run lint` (Fixed 5 errors: `any` types in tests, unescaped entities, unused imports)
- `npm run test` (Passed: `agentStore` actions, toggle logic, API mocking)
- `npm run build` (PASSED: Next.js production build succeeded)

## Security Checks (Phase 2 Controlled Write)
- [x] **Default Read-Only**: `agentStore.ts` initializes `isOperatorMode: false`. UI components (`AgentActions`, `GlobalControls`) hide write actions by default.
- [x] **Operator Mode Toggle**: `GlobalControls.tsx` allows toggling. (Note: No confirmation for enabling mode itself, but actions are gated).
- [x] **Individual Kill Safety**: `AgentActions.tsx` requires confirmation dialog.
- [x] **Global Kill Safety**: `GlobalControls.tsx` requires typing "STOP" to confirm (Fixed during QA).
- [x] **Steering Safety**: `SteerModal.tsx` provides a dedicated UI for injection, preventing accidental clicks.

## Test Results
- **Lint**: PASSED.
- **Tests**: PASSED (5/5).
- **Build**: PASSED.
- **Component Logic**:
    - `ConfirmationDialog`: Updated to support `requiredInput` for critical actions.
    - `AgentActions`: Correctly hides buttons when not in Operator Mode.
    - `SteerModal`: Correctly captures input and calls API.

## Verdict
- **PASS**

## Notes
- **Safety Improvement**: Added "Type STOP to confirm" for the Emergency Stop button to meet ARCH requirements.
- **Code Quality**: Cleaned up `any` types in test files to ensure type safety.

## Next Steps
- Deploy to staging/production environment.
- Verify WebSocket real-time updates with actual backend (if available).
