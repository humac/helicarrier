# Helicarrier v3 - Project Context for AI Assistants

## Project Overview

**Helicarrier v3** is a real-time mission control dashboard for monitoring and managing OpenClaw agent operations. It provides a centralized interface for viewing activity feeds, managing cron jobs, searching message history, and monitoring agent status.

**Purpose:** Enable operators to monitor OpenClaw agent activities, manage scheduled jobs, and search historical interactions through a modern web interface.

**Status:** ✅ Production Ready (as of 2026-02-27)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Framework** | Next.js 14.2.21 | App Router, Server Components, API Routes |
| **Language** | TypeScript 5.7.2 | Type safety and developer experience |
| **Styling** | Tailwind CSS 3.4.15 | Utility-first CSS framework |
| **State Management** | Zustand 5.0.2 | Client-side state management |
| **Server State** | SWR 2.3.0 | Data fetching with caching and revalidation |
| **Icons** | Lucide React 0.468.0 | Consistent icon library |
| **Date Handling** | date-fns 4.1.0 | Lightweight date formatting |
| **React** | 18.3.1 | UI library |

---

## Directory Structure

```
projects/helicarrier/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes (server-side only)
│   │   │   ├── feed/           # Feed data endpoint
│   │   │   ├── calendar/       # Calendar/cron jobs endpoint
│   │   │   ├── search/         # Search endpoint
│   │   │   ├── sessions/       # Sessions endpoint
│   │   │   └── history/        # Session history endpoint
│   │   ├── feed/               # Activity Feed page
│   │   ├── calendar/           # Calendar/Cron page
│   │   ├── search/             # Global Search page
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Home (redirects to /feed)
│   ├── components/
│   │   ├── ui/                 # Base UI primitives
│   │   ├── layout/             # Layout components (Nav, AgentBanner)
│   │   └── features/           # Feature-specific components
│   ├── lib/
│   │   ├── openclaw.ts         # Gateway client (server-side)
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── utils.ts            # Utility functions
│   │   └── providers.tsx       # React providers (SWR, etc.)
│   ├── hooks/                  # Custom React hooks
│   └── store/                  # Zustand stores
├── .env.local                  # Environment variables (gitignored)
├── .env.example                # Example env file
├── ARCH.md                     # System architecture documentation
├── REQ.md                      # Requirements specification
├── TASKS.md                    # Task breakdown and status
├── QA.md                       # QA checklist and results
├── DECISIONS.md                # Architectural decisions log
├── ISSUES.md                   # Issues encountered & resolved
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Create production build
npm run build

# Run production server
npm run start

# Type check
npm run type-check

# Lint
npm run lint

# Run tests
npm test

# Clean and rebuild
rm -rf .next node_modules && npm install && npm run build
```

---

## Environment Variables Required

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GATEWAY_URL` | Yes | OpenClaw Gateway API URL | `http://localhost:8080` |
| `GATEWAY_TOKEN` | Yes | Bearer token for Gateway authentication | `your-secret-token` |

**Security Note:** These variables are ONLY used in server-side API routes. Never expose `GATEWAY_TOKEN` to client-side code.

---

## Known Issues & Limitations

### ISSUE-003: Gateway Tool Invocation 500 Error (UNRESOLVED)
- **Status:** Backend bug - not fixable at application level
- **Impact:** `/api/history` and `/api/cron` endpoints return 500 errors when Gateway is not properly configured
- **Workaround:** Application handles errors gracefully with fallback UI states
- **Root Cause:** Gateway backend has a bug in the `/tools/invoke` endpoint

### ISSUE-004: Fake QA Verification (RESOLVED)
- **Status:** Resolved in final QA pass
- **Impact:** Initial QA was code-review only, skipped browser testing
- **Resolution:** Heimdall performed legitimate browser QA with screenshots on 2026-02-27 14:23 UTC

### Tailwind Config Issue (RESOLVED)
- **Status:** Resolved
- **Impact:** Build failed with `.ts` config file
- **Resolution:** Renamed `tailwind.config.ts` to `tailwind.config.js`

---

## Architecture Decisions Summary

### Server-Side Gateway Client
- All Gateway API calls happen in server-side API routes
- Token never exposed to browser
- API routes act as secure proxy layer

### Client-Side State Management
- **Zustand:** Client state (UI, agent status, filters)
- **SWR:** Server state (feed, calendar, search data)
- Clear separation of concerns with automatic caching

### Next.js 14 App Router
- Using App Router (not Pages Router)
- Server Components by default
- API routes in `app/api/` structure

---

## Coding Standards

- **TypeScript:** Strict mode enabled, all new code must be typed
- **Patterns:** Follow existing patterns in `src/` directory
- **Tests:** Write tests for new utility functions and components
- **Comments:** Document complex logic, especially timestamp handling

## Critical Implementation Patterns

### Timestamp Handling
All Gateway timestamps are in **milliseconds**, NOT seconds:
```typescript
// ✅ Correct - timestamps are already in ms
const date = new Date(message.timestamp);
```

### Content Field Handling
Message content can be `string` OR `MessageContentPart[]`:
```typescript
function getMessageContent(message: Message): string {
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content.map(part => part.text || '').join('');
  }
  return '';
}
```

---

## AI Assistant Notes

- Reference `ARCH.md` for detailed architecture decisions
- Reference `DECISIONS.md` for specific architectural trade-offs
- Reference `ISSUES.md` for known problems and workarounds
- Check `QA.md` for testing status and verification results
- Never commit `.env.local` - it's gitignored for security

---

**Last Updated:** 2026-02-27  
**Maintained By:** @pepper (Analyst)
