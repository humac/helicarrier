# TASKS.md - Implementation Plan

## Phase 1: Setup (The Frame)
- [ ] **Scaffold**: `npx create-next-app@latest helicarrier --typescript --tailwind --eslint`
- [ ] **Dependencies**: `npm install framer-motion clsx tailwind-merge lucide-react`
- [ ] **Shadcn**: `npx shadcn-ui@latest init` (Default: Slate, CSS Variables)
- [ ] **Cleanup**: Strip default Next.js boilerplate.

## Phase 2: Components (The Armor)
- [ ] **Layout**: Create `components/layout/HudLayout.tsx` (Glass sidebar + main content).
- [ ] **AgentCard**: Create `components/dashboard/AgentCard.tsx` (Avatar, Status, Pulse).
- [ ] **HeroGrid**: Create `components/dashboard/HeroGrid.tsx`.
- [ ] **LogStream**: Create `components/dashboard/SystemPulse.tsx`.

## Phase 3: Integration (The Arc Reactor)
- [ ] **Log Reader API**: Create `app/api/system/logs/route.ts` to tail `~/.openclaw/state/logs/` and parse status lines (V1 Strategy).
- [ ] **Env**: Setup `.env.local` with `OPENCLAW_LOG_PATH` (default: `~/.openclaw/state/logs/openclaw.log`).
- [ ] **Hooks**: Create `hooks/useSystemPulse.ts` to poll the log API.

## Phase 4: Launch
- [ ] **Script**: Create `start-mission.sh` to build and run on port 3000.
- [ ] **Verification**: Run `npm run dev` and screenshot.

## Phase 5: Security Hardening (Priority: Critical)
- [ ] **Secret Generation**: Generate a secure token (or use `OPENCLAW_AUTH_TOKEN`) and place it in `.env.local`.
- [ ] **API Middleware**: Update `app/api/logs/route.ts` to check `request.headers.get("x-secret-key")`. Return `401 Unauthorized` if mismatch.
- [ ] **Client Auth**: Update `hooks/useSystemPulse.ts` (and any other fetchers) to pass `X-Secret-Key` from `process.env.NEXT_PUBLIC_API_KEY` (or similar exposed env var, though server-side proxying is safer if possible).
  - *Note*: Since this is a client-side fetch to a Next.js API route, the API route protects the *server* resources. The client needs a way to pass a valid token. For a simple dashboard, we might rely on a server-side session or a static public key if the threat model allows.
  - *Refinement*: For this phase, rely on the Next.js API route checking a server-side secret. The Client (browser) acts as the trusted user.
- [ ] **Audit**: Verify `curl -H "X-Secret-Key: wrong" ...` returns 401.

## Phase 6: Future Improvements
- [ ] **Gateway Uplink (Low Priority)**: Explore tRPC or WebSocket client to replace log tailing with direct API communication once documented.
