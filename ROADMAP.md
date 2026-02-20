# Roadmap: Helicarrier (Hologram)

## Phase 1: Core Visibility (Delivered)
- [x] **Project Setup**: Next.js + Tailwind + Zustand.
- [x] **WebSocket Integration**: Live event streaming from Gateway.
- [x] **Agent Tree**: Visual hierarchy visualization.
- [x] **Log Viewer**: High-performance virtualized log stream (<200ms latency).
- [x] **Basic Metrics**: Dashboard header stats.

## Phase 2: Active Control (Delivered)
- [x] **Control API**: Integration with Gateway `kill`/`steer` endpoints.
- [x] **Operator Mode**: Toggleable UI state for safety.
- [x] **Steering UI**: Modal for injecting instructions.
- [x] **Emergency Stop**: Global kill switch with "STOP" confirmation.
- [x] **Safety Gates**: Double-confirmation dialogs for destructive actions.

## Phase 3: Advanced Ops (Next Milestone)
- [ ] **Replay Mode**: Step-through playback of past session logs.
- [ ] **Multi-Host Support**: Toggle controls across distributed nodes.
- [ ] **Context Explorer**: Visual browser for agent memory/context window.
- [ ] **Input Requests**: UI handling for agent `ask` events (replacing CLI prompts).

## Future / TBD
- [ ] **Mobile Interface**: Responsive view for tablet/phone monitoring.
- [ ] **RBAC**: Multi-user role-based access control.
