# Helicarrier v3 - Gemini-Specific Context

## Project Summary

**Helicarrier v3** is a real-time mission control dashboard for OpenClaw agent operations.

**Purpose:** Monitor agent activities, manage cron jobs, search message history, and view agent status through a modern web interface.

**Status:** ✅ Production Ready (2026-02-27)

---

## Tech Stack

```
Framework: Next.js 14.2.21 (App Router)
Language: TypeScript 5.7.2
Styling: Tailwind CSS 3.4.15
State: Zustand 5.0.2 (client) + SWR 2.3.0 (server)
Icons: Lucide React 0.468.0
Dates: date-fns 4.1.0
React: 18.3.1
```

---

## Current Phase

**COMPLETE** - Project finished 2026-02-27. All documentation created.

---

## Files to Reference

| File | Purpose |
|------|---------|
| `REQ.md` | Requirements specification |
| `ARCH.md` | System architecture (detailed) |
| `TASKS.md` | Task breakdown (completed) |
| `QA.md` | QA checklist and results |
| `DECISIONS.md` | Architectural decisions log |
| `ISSUES.md` | Issues encountered & resolved |
| `CLAUDE.md` | General AI assistant context |

---

## Development Commands

```bash
# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Test
npm test

# Type Check
npm run type-check

# Lint
npm run lint

# Clean Rebuild
rm -rf .next node_modules && npm install && npm run build
```

---

## Key Architecture Points

### 1. Server-Side Gateway Client
- Gateway token NEVER exposed to browser
- All API calls through Next.js API routes
- Token in `.env.local` (server-side only)

### 2. State Management Split
- **Zustand:** UI state, agent status, filters
- **SWR:** API data (feed, calendar, search)
- Auto-caching with 5s revalidation

### 3. Critical Gotchas

**Timestamps are in milliseconds:**
```typescript
const date = new Date(timestamp); // ✅ Already ms
const date = new Date(timestamp * 1000); // ❌ Wrong
```

**Content field is union type:**
```typescript
type Content = string | MessageContentPart[];
```

**Cron schedule is union type:**
```typescript
type Schedule = string | CronScheduleObject;
```

---

## Gemini-Specific Tooling Notes

### When Generating Code

1. **Always use TypeScript** - strict mode, explicit types
2. **Follow App Router patterns** - `page.tsx`, `route.ts`, `layout.tsx`
3. **Server/Client separation** - `'use client'` directive when needed
4. **Import paths** - use `@/` alias for `src/` directory

### Common Patterns

**API Route Template:**
```typescript
// app/api/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'ERROR', message: 'Failed' } },
      { status: 500 }
    );
  }
}
```

**SWR Hook Pattern:**
```typescript
import useSWR from 'swr';

export function useFeed() {
  const { data, error, isLoading, mutate } = useSWR('/api/feed');
  return { data, error, isLoading, mutate };
}
```

**Zustand Store Pattern:**
```typescript
import { create } from 'zustand';

interface State {
  value: string;
  setValue: (v: string) => void;
}

export const useStore = create<State>((set) => ({
  value: '',
  setValue: (v) => set({ value: v }),
}));
```

---

## Environment Variables

```bash
# Required (server-side only)
GATEWAY_URL=http://localhost:8080
GATEWAY_TOKEN=your-secret-token
```

**NEVER** use `NEXT_PUBLIC_GATEWAY_TOKEN` - token must stay server-side.

---

## Known Issues

| Issue | Status | Impact |
|-------|--------|--------|
| Gateway invoke 500 error | UNRESOLVED (backend bug) | `/api/history`, `/api/cron` fail |
| Tailwind .ts config | RESOLVED | Was causing build failure |
| Fake QA (no browser) | RESOLVED | Fixed with real browser QA |

---

## Quick Reference

**Pages:**
- `/` → Home (redirects to `/feed`)
- `/feed` → Activity feed timeline
- `/calendar` → Cron job management
- `/search` → Global message search

**API Endpoints:**
- `/api/feed` → GET feed messages
- `/api/calendar` → GET/POST cron jobs
- `/api/search` → GET search results
- `/api/sessions` → GET active sessions
- `/api/history` → GET session history

**Components:**
- `AgentBanner` → Status header
- `Navigation` → Sidebar/bottom nav
- `FeedList` → Activity timeline
- `CalendarGrid` → Monthly view
- `SearchInput` → Debounced search

---

**Last Updated:** 2026-02-27  
**Maintained By:** @pepper (Analyst)
