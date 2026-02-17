# ARCH.md - Project Helicarrier Architecture

> **"Sometimes you gotta run before you can walk."** - Tony Stark

## 1. Design System: "Stark HUD"

We are building a **Combat Information Center**, not a dashboard.

- **Theme**: `Zinc` (Slate/Gray) base with cyan/blue accents.
- **Surface**: Glassmorphism (`backdrop-blur-md`, `bg-black/40`).
- **Typography**: `Geist Mono` or `Inter` (Tech/Tactical look).
- **Motion**: High-velocity, spring-based animations.

### 1.1 Visual Constants (Tailwind)
```css
/* Glass Panel */
.hud-panel {
  @apply bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl;
}

/* Critical Alert */
.hud-alert {
  @apply border-red-500/50 bg-red-950/20 text-red-400;
}
```

### 1.2 Animation Constants (Framer Motion)
```typescript
export const tacticalRipple = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 300, damping: 20 }
};

export const listStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};
```

## 2. Component Architecture

### 2.1 The Hero Grid (`<HeroGrid />`)
A responsive CSS Grid displaying the 4 Active Agents.
- **Card**: `<AgentCard agent="heimdall" status="idle" load="12%" />`
- **Visuals**: Each card pulses based on CPU/Activity.
- **Data**: Polls `/api/agents` (Next.js internal API) -> Gateway.

### 2.2 System Pulse (`<SystemPulse />`)
A real-time log stream console.
- **Look**: Terminal-style, monospaced, auto-scroll.
- **Filters**: `[ERROR]`, `[WARN]`, `[EXEC]`.

### 2.3 Command Deck (`<CommandDeck />`)
Quick actions:
- `Restart Gateway`
- `Emergency Stop`
- `Deploy Agent`

## 3. Data Source Strategy

> **"If we can't get in through the front door, we'll listen through the walls."**

Due to the Gateway API returning HTML UI instead of JSON (Issue [H-001]), we are adopting a phased approach.

### 3.1 V1: "The Tape Recorder" (Current Implementation)
We bypass the HTTP API entirely and read the truth from the disk.

- **Source**: `~/.openclaw/state/logs/` (primary log rotation).
- **Mechanism**:
  - **Server**: Next.js API Route uses `fs` to tail the log file.
  - **Parsing**: Regex patterns extract `[AGENT]`, `[STATUS]`, and `[ERROR]` lines.
  - **Transport**: Polling `GET /api/system/logs` which returns the last N lines or parsed status object.
- **Pros**: Zero dependency on undocumented APIs; works immediately.
- **Cons**: Brittle (log format changes break it); high I/O if logs are verbose.

### 3.2 V2: "Direct Uplink" (Roadmap)
Once the Gateway exposes a stable, documented programmatic interface.

- **Source**: `http://localhost:18789/v1/system/status` (or similar).
- **Mechanism**: Direct authenticated JSON fetch or WebSocket subscription.
- **Triggers**:
  - Official REST API release.
  - OR: Successful reverse-engineering of the existing tRPC/WebSocket protocol.

## 4. Security
- **Local Only**: The dashboard binds to localhost/Tailscale IP.
- **Read-Only**: V1 is inherently read-only (parsing logs). Command execution (restarts) will require specific, secured shell execs via the Node runtime, effectively acting as a separate control plane.

## 5. Security Architecture

### 5.1 API Protection
The `app/api/logs` endpoint (and future control endpoints) MUST be secured to prevent unauthorized local or network access.

- **Mechanism**: `X-Secret-Key` Header.
- **Secret Source**: `process.env.OPENCLAW_AUTH_TOKEN` (or `HELICARRIER_SECRET` if distinct).
- **Implementation**:
  - **Middleware**: A lightweight check in `app/api/logs/route.ts` (or global middleware).
  - **Client**: `HeroGrid` and `SystemPulse` components must include this header in all fetch requests.
  - **Environment**: The secret is injected at runtime via `.env.local` or process environment.

### 5.2 Token Strategy
- **Development**: Use a mock token in `.env.local` (e.g., `simulated-stark-token`).
- **Production**: Auto-generated high-entropy string managed by OpenClaw.

## 6. Unknowns
- Does Gateway expose a WebSocket for logs, or do we poll?
  - *Answer*: We utilize file system polling for V1.
- Log file access permissions?
  - *Mitigation*: Run Next.js as the `openclaw` user.
