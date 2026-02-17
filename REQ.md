# Project Helicarrier - Mission Control HUD

## 1. The Objective
Build a high-performance, mobile-responsive web dashboard to monitor the OpenClaw environment, agent states, and server resources.

## 2. Tactical Tech Stack (Stark Standards)
- **Framework**: Next.js 15+ (App Router).
- **Styling**: Tailwind CSS + Shadcn/UI.
- **Aesthetic**: "Stark HUD" – Translucent glassmorphism, Framer Motion animations, and dark mode.
- **Data**: Interface with OpenClaw Gateway API (Port 18789) and local `/opt/openclaw` logs.

## 3. Agent Assignments

### @tony (Architect)
- Create `ARCH.md`.
- Design "Hero Grid" (4 agents) and "System Pulse" (log stream).
- Define Framer Motion animation constants ("tactical ripple").

### @peter (Developer)
- Scaffold project in `projects/helicarrier/`.
- Implement components (PascalCase).
- Create `start-mission.sh` (Port 3000).

### @heimdall (QA)
- Audit data flow in `QA.md`.
- Ensure `.env.local` for Auth Token (Server-side only).
- Verify Tailscale IP restrictions.

## 4. Execution Protocol
- **Status**: Phase 1 (Architecture) initialized.
- **Next**: Peter scaffold upon Tony's signoff.
