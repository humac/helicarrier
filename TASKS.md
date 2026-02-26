# Helicarrier v2 - Implementation Tasks

## Phase 1: Core Setup

### Task 1.1: Project Bootstrap
**Files**: `package.json`, `tsconfig.json`, `next.config.js`

- Initialize Next.js project with TypeScript and Tailwind CSS
- Configure dark theme as default
- Set up `src/` directory structure

**Acceptance**:
- `npm run dev` starts dev server on :3000
- Tailwind classes work (test with bg color)

---

### Task 1.2: Environment & Types
**Files**: `.env.local`, `.env.example`, `lib/types.ts`

- Create `.env.local` with gateway URL and token
- Define all TypeScript interfaces from ARCH.md
- Export types for use across app

**Acceptance**:
- Types compile without errors
- `lib/types.ts` exports: Session, HistoryEntry, ContentPart, CronJob, CronRun, MemoryResult, FileResult, SystemStatus, FilterType, FeedItem, SearchResults

---

### Task 1.3: OpenClaw Client
**Files**: `lib/openclaw.ts`

Implement gateway client with:
- `OpenClawClient` class with `invoke()` method
- `unwrap<T>()` helper for envelope parsing
- Typed tool wrappers: `listSessions()`, `getSessionHistory()`, `listCronJobs()`, `getCronRuns()`, `searchMemory()`, `getSessionStatus()`

**Acceptance**:
- Client reads env vars correctly
- `unwrap()` extracts JSON from `{ ok, result: { content: [{ type: "text", text: "<JSON>" }] } }`
- All tool wrappers compile

---

## Phase 2: API Routes

### Task 2.1: Session Routes
**Files**: `app/api/sessions/route.ts`, `app/api/sessions/[id]/history/route.ts`

- `GET /api/sessions` → calls `listSessions()`
- `GET /api/sessions/:id/history` → calls `getSessionHistory(id)`

**Acceptance**:
- Both routes return JSON
- Error handling returns `{ error: string }` on failure
- Test with curl or browser

---

### Task 2.2: Cron Routes
**Files**: `app/api/cron/jobs/route.ts`, `app/api/cron/[id]/runs/route.ts`

- `GET /api/cron/jobs` → calls `listCronJobs()`
- `GET /api/cron/:id/runs` → calls `getCronRuns(id)`

**Acceptance**:
- Routes return job/run data
- Handle cron parse errors gracefully

---

### Task 2.3: Search & Status Routes
**Files**: `app/api/search/memory/route.ts`, `app/api/search/files/route.ts`

- `POST /api/search/memory` → calls `searchMemory(query, limit)`
- `POST /api/search/files` → use `exec` with `rg` for workspace grep

**Acceptance**:
- Memory search accepts `{ query, limit }` body
- File search executes `rg` and parses results
- Both return typed results

---

### Task 2.4: Health & Version Routes
**Files**: `app/api/health/route.ts`, `app/api/status/route.ts`, `app/api/openclaw/version/route.ts`

- `GET /api/health` → check gateway `/health` endpoint
- `GET /api/status` → calls `getSessionStatus()`
- `GET /api/openclaw/version` → check npm registry for latest version

**Acceptance**:
- Health returns `{ healthy: boolean }`
- Version compares current vs latest

---

## Phase 3: Feed Page

### Task 3.1: Feed Utils
**Files**: `app/feed/lib/feedUtils.ts`

Create utility functions:
- `flattenHistory(sessions, histories)` → FeedItem[]
- `parseContentParts(parts)` → extracts text/tool info
- `formatTimestamp(epochMs)` → relative time string

**Acceptance**:
- Correctly parses content parts with type "text" and "toolCall"
- Returns reverse-chronological FeedItem array

---

### Task 3.2: Timeline Components
**Files**: `app/feed/components/TimelineItem.tsx`, `app/feed/components/Timeline.tsx`

- `TimelineItem`: displays single entry with colored dot (blue=tool, green=user, purple=assistant)
- `Timeline`: renders list of TimelineItem

**Acceptance**:
- Dots render correct colors based on type
- Content renders properly

---

### Task 3.3: Feed Container & Page
**Files**: `app/feed/components/FeedContainer.tsx`, `app/feed/page.tsx`, `app/feed/components/FilterBar.tsx`

- `FeedContainer`: client component with filter state, polling logic
- `FilterBar`: All | Tools | Assistant | User buttons
- `page.tsx`: server component fetching initial data

**Acceptance**:
- Feed renders with initial data
- Filter buttons work (show only matching types)
- Auto-refresh every 30 seconds

---

## Phase 4: Calendar Page

### Task 4.1: Cron Parser Utils
**Files**: `app/calendar/lib/cronUtils.ts`

Implement:
- `parseCronExpression(expr)` → parses cron to object
- `getNextRuns(expr, tz, count)` → generates next N occurrence timestamps
- `getWeekOccurrences(jobs, weekStart)` → maps jobs to days in week

**Acceptance**:
- Correctly parses standard cron expressions
- Generates occurrences in specified timezone

---

### Task 4.2: Calendar Components
**Files**: `app/calendar/components/WeekGrid.tsx`, `app/calendar/components/DayCell.tsx`, `app/calendar/components/JobCard.tsx`

- `WeekGrid`: 7-column grid for week
- `DayCell`: single day with job list
- `JobCard`: mini job display

**Acceptance**:
- Grid shows 7 days
- Jobs appear on correct days

---

### Task 4.3: Calendar Container & Detail
**Files**: `app/calendar/components/CalendarContainer.tsx`, `app/calendar/components/JobDetail.tsx`, `app/calendar/page.tsx`

- `CalendarContainer`: week navigation state, today highlight
- `JobDetail`: expanded view with run history (fetches `/api/cron/:id/runs`)
- Navigation: Prev/Next week buttons, Today button

**Acceptance**:
- Week navigation works
- Today is highlighted
- Clicking job expands to show runs

---

## Phase 5: Search Page

### Task 5.1: Search Utils
**Files**: `app/search/lib/searchUtils.ts`

Implement:
- `highlightTerms(text, query)` → wraps matches in `<mark>`
- `groupResults(results)` → organizes by category
- `filterResults(results, activeTab)` → filters by tab

**Acceptance**:
- Highlight function wraps matching text
- Grouping organizes results correctly

---

### Task 5.2: Search Components
**Files**: `app/search/components/SearchInput.tsx`, `app/search/components/ResultsTabs.tsx`, `app/search/components/ResultGroup.tsx`

- `SearchInput`: debounced input (300ms)
- `ResultsTabs`: Memories | Files | Conversations | Tasks
- `ResultGroup`: section with count badge

**Acceptance**:
- Debounce delays search by 300ms
- Tabs switch between result categories

---

### Task 5.3: Search Results & Page
**Files**: `app/search/components/SearchContainer.tsx`, `app/search/components/MemoryResult.tsx`, `app/search/components/FileResult.tsx`, `app/search/page.tsx`

- `SearchContainer`: parallel fetch logic (Promise.all)
- `MemoryResult`: memory card with highlighted terms
- `FileResult`: file match with line context
- `page.tsx`: initial empty state

**Acceptance**:
- Parallel requests fire simultaneously
- Results grouped by category
- Matching terms highlighted

---

## Phase 6: Agent Banner & Navigation

### Task 6.1: Agent Banner Component
**Files**: `app/components/AgentBanner.tsx`

Implement collapsible banner with:
- Agent name, version, up-to-date status
- Stats row: model, context usage, active sessions, runtime mode
- Connected Resources section (badges)
- Capabilities section (badges)
- Sub-Agents section (session list with pulsing status dots)
- Quick info: workspace path, human name, GitHub

**Acceptance**:
- Collapses/expands on click
- Sub-agent dots pulse green if updated <2min ago
- Version comparison shows checkmark or update available

---

### Task 6.2: Navigation Component
**Files**: `app/components/Navigation.tsx`

Implement sticky top bar with:
- 🦀 logo
- Page links: /feed, /calendar, /search
- Gateway status indicator (polls /api/health every 30s)

**Acceptance**:
- Links navigate correctly
- Status dot green when healthy, red when not
- Updates every 30 seconds

---

### Task 6.3: Root Layout & Styling
**Files**: `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`

- Update root layout with Navigation and AgentBanner
- Apply dark theme colors from ARCH.md
- Add fade-in animations and loading skeletons

**Acceptance**:
- Dark theme applied globally
- Animations work
- Skeleton components render correctly

---

## Summary

| Phase | Tasks | Key Deliverables |
|-------|-------|----------------|
| 1 | 3 | Project setup, types, openclaw client |
| 2 | 4 | All API routes (8 total) |
| 3 | 3 | Feed page with auto-refresh |
| 4 | 3 | Calendar with cron parsing |
| 5 | 3 | Search with parallel fetch |
| 6 | 3 | Navigation, Agent Banner, styling |

**Total Tasks**: 19
**Estimated Time**: 6-8 hours
