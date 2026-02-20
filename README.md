# Helicarrier (Hologram)

> **Status**: Phase 2 Complete (Active Control)
> **Access**: Localhost Only (Security Level 2)

Helicarrier is the mission control dashboard for OpenClaw. "Hologram" provides a real-time visual interface for monitoring agent swarms, streaming logs, and intervening in active sessions. It serves as the primary "Head-Up Display" for operators managing autonomous agents.

## 🚀 Capabilities

### Core Visibility (Phase 1)
- **Live Agent Tree**: Visual hierarchy of parent/child agent relationships.
- **Real-Time Logs**: Streaming stdout/stderr with <200ms latency via WebSockets.
- **Status Monitoring**: Instant visual feedback for Idle, Running, Error, or Terminated states.
- **Metrics**: Aggregated view of active agents and system health.

### Active Control (Phase 2)
- **Operator Mode**: Toggleable interface for high-stakes actions (Default: Read-Only).
- **Steer**: Inject natural language instructions into running agents without killing them.
- **Kill Switch**: Terminate individual agent sessions with confirmation.
- **Emergency Stop**: Global "Kill All" functionality for rogue swarms.

## 🛡️ Safety Model

Helicarrier implements a strict "Human-in-the-Loop" safety architecture:

1.  **Default Read-Only**: The dashboard boots in specific "Monitor" mode. Write actions (Kill/Steer) are hidden until "Operator Mode" is explicitly enabled.
2.  **Double Confirmation**:
    - **Individual Kill**: Requires a confirmation dialog.
    - **Global Kill (Panic)**: Requires typing **"STOP"** to execute. This prevents accidental swarm termination.
3.  **Localhost Binding**: The dashboard is bound to `127.0.0.1` by default to prevent network exposure.

## 🛠️ Installation & Usage

### Prerequisites
- Node.js v20+
- OpenClaw Gateway running (default `ws://localhost:8080`)

### Quick Start
```bash
cd projects/helicarrier
npm install
npm run dev
```
Access the dashboard at `http://localhost:3000`.

## 🏗️ Architecture
- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide React.
- **State**: Zustand (Client-side), WebSocket (Real-time sync).
- **Protocol**: 
    - `agent:update` / `agent:log` (Downstream Events)
    - `POST /api/sessions/{id}/{action}` (Upstream Control)

## 🤝 Contributing
Refer to `docs/DECISIONS.md` for architectural context.
- **Architect**: @tony
- **Developer**: @peter
- **QA**: @heimdall
