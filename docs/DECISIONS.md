# Decisions Log: Helicarrier (Hologram)

## [ADR-001] Tech Stack Selection
- **Status**: Accepted
- **Date**: 2026-02-15
- **Decision**: Use Next.js (React), Tailwind CSS, and Zustand.
- **Context**: Need a rapid development cycle with a responsive, modern UI. Zustand selected over Redux for simplicity and performance with frequent atomic updates (logs).

## [ADR-002] Communication Protocol
- **Status**: Accepted
- **Date**: 2026-02-16
- **Decision**: Hybrid WebSocket + REST.
- **Context**: 
    - **WebSockets** for high-frequency read data (logs, status updates) to satisfy <200ms latency NFR.
    - **REST** for control actions (Kill, Steer) to ensure transactional reliability and distinct response codes.

## [ADR-003] Safety Model & Operator Mode
- **Status**: Accepted
- **Date**: 2026-02-20
- **Decision**: Implement a "Default Read-Only" state ("Monitor Mode") and require explicit toggle to "Operator Mode" for write actions.
- **Context**: Prevents accidental clicks on destructive actions (Kill/Steer) during passive monitoring.
- **Refinement**: Global Emergency Stop requires typing "STOP" to confirm, mitigating "fat-finger" risks for total system shutdown.

## [ADR-004] Log Virtualization
- **Status**: Accepted
- **Date**: 2026-02-18
- **Decision**: Use `react-window` for log rendering.
- **Context**: Agents generate massive amounts of text. DOM virtualization is required to prevent browser crashes during long-running sessions.

## [ADR-005] Fallback Model Execution
- **Status**: Accepted
- **Date**: 2026-02-20
- **Decision**: Phase 2 Closeout executed via Fallback Model (Pepper) due to primary model fetch failures.
- **Context**: Ensures project momentum despite upstream API instability.

## [ADR-006] Phase 2 Closeout
- **Status**: Accepted
- **Date**: 2026-02-20
- **Decision**: All Phase 2 deliverables completed, QA passed, and closeout documentation finalized.
- **Context**: Mission control dashboard now supports full operator intervention with safety model in place. Ready for production deployment pending backend integration.

## [ADR-007] Phase 3-6 Expansion (Feed, Detail, Calendar, Search)
- **Status**: Accepted
- **Date**: 2026-02-26
- **Decision**: Expand Helicarrier from basic agent monitoring to full mission control with Feed, Agent Detail, Calendar, and Search pages.
- **Context**: 
    - **Phase 3**: Feed page with unified session/cron/event view and filtering
    - **Phase 4**: Agent Detail page with stats, timeline, and action panel
    - **Phase 5**: Calendar page with week view and cron parsing
    - **Phase 6**: Search page with Memory/Files/Crons tabs
- **Implementation**: 8 API routes built to support all pages, all using OpenClaw Gateway client
- **Result**: 19/19 tasks complete, all phases delivered, ready for Heimdall QA
