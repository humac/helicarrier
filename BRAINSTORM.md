# Brainstorming: Native OpenClaw Dashboard & Management

> **Note**: Historical document — Decision made, project executed. Kept for reference.

## Context
The "Standalone Sidecar" model (Helicarrier V4.1) has been archived. We are pivoting to a more integrated, cost-effective, and seamless way to manage a local OpenClaw instance.

## Objectives
- Monitor agent activity in real-time.
- Manage sessions (spawn/kill/steer).
- Minimize architectural redundancy (secrets, data, latency).
- Leverage the same-machine environment (CLI, filesystem, local API).

## Participants
- **Jarvis**: Strategic Orchestrator.
- **Tony**: Architectural Designer.
- **Pepper**: Operational Analyst.

## Initial Ideas
- [x] Native integrated dashboard (`openclaw dashboard`).
- [x] Terminal User Interface (TUI) via `ink` or `blessed`.
- [x] Lightweight headless direct-link (Next.js Static + core API).

---

## Architectural Paths (Tony & Pepper)

### Path 1: The "Command Deck" (Integrated TUI)
*   **Architectural Concept**: A rich Terminal User Interface (TUI) built directly into the `openclaw` CLI using a library like `ink` (React-based) or `blessed`.
*   **Mechanism**: Runs as a sub-command (`openclaw dash`). Communicates with the Gateway via local IPC or direct library calls to the database/process manager.
*   **Evaluation**:
    *   **Ease of Use**: High for CLI power users; zero setup required.
    *   **Latency**: Lowest (no network stack, direct memory/IPC).
    *   **Security**: High (stays within the terminal session, no open ports).
    *   **Maintenance**: Medium (Requires specialized TUI library knowledge).

### Path 2: The "Hologram" (Integrated Web UI)
*   **Architectural Concept**: A React/Next.js frontend embedded within the OpenClaw package, served by the existing Gateway daemon.
*   **Mechanism**: The Gateway starts a local web server (e.g., on `localhost:4000`) serving a static-exported SPA. Uses WebSockets for real-time monitoring.
*   **Evaluation**:
    *   **Ease of Use**: Very High (familiar browser-based GUI).
    *   **Latency**: Low (local network loopback).
    *   **Security**: Medium (requires local port management; potential CORS/Auth needs if exposed).
    *   **Maintenance**: Low (Standard web stack; easier to iterate on UI).

### Path 3: The "Satellite" (Local Electron/Native Wrapper)
*   **Architectural Concept**: A separate native application (Electron or Tauri) that connects to the local OpenClaw workspace.
*   **Mechanism**: A standalone binary that detects the `.openclaw` directory and communicates with the Gateway API.
*   **Evaluation**:
    *   **Ease of Use**: High (Desktop app experience, system tray integration).
    *   **Latency**: Low (Local API calls).
    *   **Security**: Medium (Standard desktop app sandbox).
    *   **Maintenance**: High (Managing cross-platform builds, distribution, and large binary sizes).

---

## The Winner: Path 2 - The "Hologram" (Integrated Web UI)

### Reasoning
While the **Command Deck (TUI)** is elegant for developers, the **Hologram (Integrated Web UI)** provides the best balance of rich visualization (crucial for complex agent trees) and development speed. 

**Key Benefits:**
1.  **Zero Installation**: Bundled with the CLI; `openclaw dashboard` just works.
2.  **Rich Visuals**: Real-time graph visualization of subagent chains is significantly easier in a browser than in a TUI.
3.  **Extensibility**: Allows for future remote access (via SSH tunnel or auth) without re-architecting the core.
4.  **Operational Efficiency**: Pepper notes that maintenance costs are minimized by using standard React components already familiar to the team.

### Next Steps
1.  Tony to design the "Hologram" component architecture in `ARCH.md`.
2.  Pepper to refine requirements for the real-time monitoring API in `REQ.md`.
3.  Jarvis to review and greenlight implementation.
