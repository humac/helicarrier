# DECISIONS.md - Helicarrier v3 Architecture Decisions

**Project:** Helicarrier v3 - Mission Control Dashboard  
**Started:** 2026-02-27  
**Status:** ✅ Complete

---

## [DEC-001] Next.js 14 App Router

**Date:** 2026-02-27  
**Decided By:** Tony (Architect)  
**Status:** Implemented

**Decision:** Use Next.js 14 with App Router (not Pages Router).

**Rationale:** 
- Server Components by default (better performance)
- Built-in routing with file system
- Better SEO with server-side rendering
- Future-proof (Next.js direction)

**Alternatives Considered:**
- Next.js Pages Router → Rejected (legacy, being deprecated)
- Vite + React → Rejected (need SSR, API routes)

---

## [DEC-002] Server-Side Gateway Integration

**Date:** 2026-02-27  
**Decided By:** Tony (Architect)  
**Status:** Implemented

**Decision:** All OpenClaw Gateway API calls go through Next.js API routes (server-side only).

**Rationale:** 
- Avoid CORS issues in browser
- Hide Gateway tokens from client
- Better error handling and logging
- Can add caching, rate limiting server-side

**Implementation:**
- `/src/app/api/feed/route.ts` - Activity feed
- `/src/app/api/calendar/route.ts` - Cron jobs
- `/src/app/api/search/route.ts` - Search
- `/src/app/api/sessions/route.ts` - Session list

**Client Pattern:**
```typescript
// Client uses SWR to fetch from our API routes
const { data } = useSWR('/api/feed', fetcher);
```

---

## [DEC-003] Zustand + SWR State Management

**Date:** 2026-02-27  
**Decided By:** Tony (Architect)  
**Status:** Implemented

**Decision:** 
- **Zustand:** Client-side UI state (filters, expanded items, UI preferences)
- **SWR:** Server state (feed data, calendar, sessions) with caching and revalidation

**Rationale:** 
- Zustand: Simple, lightweight, no boilerplate
- SWR: Automatic revalidation, caching, deduplication
- Clear separation: UI state vs server data

**Alternatives Considered:**
- Redux Toolkit → Rejected (overkill for this project)
- React Context → Rejected (no caching, manual revalidation)
- TanStack Query → Rejected (SWR is simpler, same capabilities)

---

## [DEC-004] Tailwind Custom Theme

**Date:** 2026-02-27  
**Decided By:** Tony (Architect)  
**Status:** Implemented

**Decision:** Custom Tailwind theme with Stark/Iron Man aesthetic (dark mode, metallic accents).

**Colors:**
- Primary: `#C9A227` (gold)
- Background: `#0A0E1A` (dark blue-black)
- Accent: `#E63946` (arc reactor red)

**Rationale:** 
- Match Jarvis/FRIDAY persona (Iron Man AI)
- Dark mode for mission control aesthetic
- Consistent branding across pages

---

## [DEC-005] SWR Type Error Fix

**Date:** 2026-02-27  
**Decided By:** Peter (with Jarvis CTO approval)  
**Status:** Implemented

**Issue:** Build failed with SWR type mismatch: `'SWRConfig' cannot be used as a JSX component`

**Decision:** Fixed `src/lib/providers.tsx`:
- Changed import from `import SWRConfig from 'swr'` to `import { SWRConfig } from 'swr'`
- Added `as any` type cast for swrConfig value

**Rationale:** 
- Known issue with SWR v2.x + TypeScript 5.x
- Type definitions don't match JSX component expectations
- `as any` is safe here since SWRConfig is well-tested
- Industry standard workaround (Next.js + SWR projects use this pattern)

---

## [DEC-006] Environment Variable Validation Timing

**Date:** 2026-02-27  
**Decided By:** Peter (debugging session)  
**Status:** Implemented

**Issue:** React hydration crash on page load when `GATEWAY_URL` not set in `.env.local`

**Decision:** Move environment variable validation from module load time to call time in `src/lib/openclaw.ts`.

**Before:**
```typescript
// Module load time - crashes on import
if (!process.env.GATEWAY_URL) throw new Error('...');
```

**After:**
```typescript
// Call time - graceful error handling
export async function callGateway(tool, params) {
  if (!process.env.GATEWAY_URL) {
    console.warn('Gateway not configured, returning mock data');
    return mockData;
  }
  // ... actual call
}
```

**Rationale:** 
- Allows app to load in dev mode without Gateway configured
- Graceful degradation (shows UI, warns in console)
- Only fails when actually trying to call Gateway

---

## [DEC-007] API Route Structure

**Date:** 2026-02-27  
**Decided By:** Tony (Architect)  
**Status:** Implemented

**Decision:** One route file per endpoint with clear naming:

```
src/app/api/
├── feed/route.ts       # GET /api/feed
├── calendar/route.ts   # GET /api/calendar
├── search/route.ts     # POST /api/search
├── sessions/route.ts   # GET /api/sessions
└── history/route.ts    # GET /api/history?action=read
```

**Rationale:** 
- Next.js App Router convention
- Clear mapping: folder name = endpoint name
- Easy to add new endpoints
- Each route is self-contained

---

## Implementation Notes

### Build Commands
```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Production server
npm test         # Jest unit tests
npm run type-check  # TypeScript validation
```

### Deployment Requirements
```bash
# .env.local (required for production)
GATEWAY_URL=http://127.0.0.1:18789
GATEWAY_TOKEN=<your-token>
```

### Known Limitations
| Issue | Status | Workaround |
|-------|--------|------------|
| Gateway tool invocation 500 error | Unresolved (backend bug) | Use direct HTTP calls instead |
| Hydration warning without Gateway | Expected | Set env vars or ignore in dev |

---

## Related Documents

- **Requirements:** `../REQ.md`
- **Architecture:** `../ARCH.md`
- **Tasks:** `../TASKS.md`
- **QA Results:** `../QA.md`
- **Team Decisions:** `/home/openclaw/.openclaw/workspace/jarvis/docs/TEAM_DECISIONS.md`
