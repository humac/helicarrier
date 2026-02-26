# Helicarrier v2 - Architecture Document

## 1. System Overview

Helicarrier is a Mission Control dashboard for OpenClaw, providing real-time visibility into agent sessions, scheduled tasks, and system status.

**Data Flow Pattern**: 
```
Browser ↔ Next.js App Router ↔ API Routes ↔ OpenClaw Gateway
```

All gateway calls are server-side only to protect the gateway token.

---

## 2. API Route Structure

### 2.1 Gateway Health Check
```
GET /api/health
```
**Response**: `{ healthy: boolean, gatewayVersion?: string }`
- Polls gateway `/health` endpoint every 30s (from navigation)
- Returns cached result for 5s to avoid hammering

### 2.2 Session Management
```
GET /api/sessions
```
**Response**: `Session[]`
- Calls `sessions_list` tool via gateway
- Used by: Feed page, Agent Banner (sub-agents section)

```
GET /api/sessions/:id/history
```
**Response**: `HistoryEntry[]`
- Calls `sessions_history` tool via gateway
- Used by: Feed page (timeline details), Agent Banner (session metadata)

### 2.3 Cron Jobs
```
GET /api/cron/jobs
```
**Response**: `CronJob[]`
- Calls `cron` tool with `action: "list"`
- Used by: Calendar page, Search page

```
GET /api/cron/jobs/:id/runs
```
**Response**: `CronRun[]`
- Calls `cron` tool with `action: "runs"`
- Used by: Calendar page (expanded job view)

### 2.4 Memory Search
```
POST /api/search/memory
Body: { query: string, limit?: number }
```
**Response**: `MemoryResult[]`
- Calls `memory_search` tool via gateway
- Used by: Search page

### 2.5 File Search
```
POST /api/search/files
Body: { query: string }
```
**Response**: `FileResult[]`
- Uses `exec` tool with `rg` (ripgrep) for workspace search
- Used by: Search page

### 2.6 System Status
```
GET /api/status
```
**Response**: `SystemStatus`
- Calls `session_status` tool via gateway
- Used by: Agent Banner (version, model, stats)

```
GET /api/openclaw/version
```
**Response**: `{ current: string, latest: string }`
- Checks npm registry for latest openclaw version
- Used by: Agent Banner (version comparison)

---

## 3. Gateway Client (`lib/openclaw.ts`)

### 3.1 Core Client
```typescript
// lib/openclaw.ts

interface GatewayEnvelope {
  ok: boolean;
  result: {
    content: Array<{
      type: "text";
      text: string;
    }>;
    details?: unknown;
  };
}

class OpenClawClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.OPENCLAW_GATEWAY_URL!;
    this.token = process.env.OPENCLAW_GATEWAY_TOKEN!;
  }

  async invoke(tool: string, params: unknown): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      body: JSON.stringify({ tool, params }),
    });

    if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
    
    const envelope: GatewayEnvelope = await res.json();
    if (!envelope.ok) throw new Error("Gateway invocation failed");
    
    return unwrap(envelope);
  }
}

// Singleton instance
export const openclaw = new OpenClawClient();
```

### 3.2 Unwrap Helper
```typescript
// lib/openclaw.ts

/**
 * Unwraps gateway envelope and parses JSON content
 * Gateway returns: { ok, result: { content: [{ type: "text", text: "<JSON>" }] } }
 */
function unwrap<T>(envelope: GatewayEnvelope): T {
  if (!envelope.ok || !envelope.result?.content?.length) {
    throw new Error("Invalid gateway response");
  }

  const textContent = envelope.result.content.find(c => c.type === "text")?.text;
  if (!textContent) throw new Error("No text content in gateway response");

  try {
    return JSON.parse(textContent) as T;
  } catch {
    // Some responses may be plain text, return as-is
    return textContent as unknown as T;
  }
}

export { unwrap };
```

### 3.3 Typed Tool Wrappers
```typescript
// lib/openclaw.ts

export async function listSessions(): Promise<Session[]> {
  return openclaw.invoke("sessions_list", {}) as Promise<Session[]>;
}

export async function getSessionHistory(sessionId: string): Promise<HistoryEntry[]> {
  return openclaw.invoke("sessions_history", { sessionId }) as Promise<HistoryEntry[]>;
}

export async function listCronJobs(): Promise<CronJob[]> {
  return openclaw.invoke("cron", { action: "list" }) as Promise<CronJob[]>;
}

export async function getCronRuns(jobId: string): Promise<CronRun[]> {
  return openclaw.invoke("cron", { action: "runs", jobId }) as Promise<CronRun[]>;
}

export async function searchMemory(query: string, limit = 10): Promise<MemoryResult[]> {
  return openclaw.invoke("memory_search", { query, limit }) as Promise<MemoryResult[]>;
}

export async function getSessionStatus(): Promise<SystemStatus> {
  return openclaw.invoke("session_status", {}) as Promise<SystemStatus>;
}
```

---

## 4. Type Definitions (`lib/types.ts`)

```typescript
// lib/types.ts

// === Gateway Responses ===

export interface Session {
  id: string;
  label: string;
  model: string;
  tokenCount: number;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  status: "active" | "idle" | "completed";
}

export interface HistoryEntry {
  id: string;
  role: "user" | "assistant" | "system";
  timestamp: number; // epoch ms
  content: ContentPart[];
}

export type ContentPart = 
  | { type: "text"; text: string }
  | { type: "toolCall"; name: string; arguments: string };

export interface CronJob {
  id: string;
  name: string;
  schedule: {
    kind: "cron";
    expr: string; // "0 5 * * *"
    tz?: string;
  };
  enabled: boolean;
  lastRun?: number; // epoch ms
  nextRun?: number; // epoch ms
}

export interface CronRun {
  id: string;
  jobId: string;
  status: "success" | "failure" | "running";
  startedAt: number; // epoch ms
  completedAt?: number; // epoch ms
  output?: string;
}

export interface MemoryResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface FileResult {
  path: string;
  line: number;
  content: string;
}

export interface SystemStatus {
  agentName: string;
  version: string;
  model: string;
  contextUsage: { current: number; max: number };
  activeSessions: number;
  runtimeMode: string;
  capabilities: string[];
  resources: string[];
}

// === UI Types ===

export type FilterType = "all" | "user" | "assistant" | "tool";

export interface FeedItem {
  id: string;
  sessionId: string;
  sessionLabel: string;
  timestamp: number;
  type: FilterType;
  content: string;
  toolName?: string;
}

export interface SearchResults {
  memories: MemoryResult[];
  files: FileResult[];
  sessions: Session[];
  cronJobs: CronJob[];
}
```

---

## 5. Component Hierarchy

### 5.1 Layout Components
```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Redirect to /feed
├── globals.css             # Tailwind + theme variables
│
├── components/
│   ├── Navigation.tsx      # Sticky top bar (FR-20)
│   ├── AgentBanner.tsx     # Collapsible system status (FR-13..FR-19)
│   ├── ThemeProvider.tsx   # Dark mode context
│   └── Skeleton.tsx        # Loading placeholders
│
├── hooks/
│   ├── usePolling.ts       # Auto-refresh every N seconds
│   └── useDebounce.ts      # Search input debounce
│
├── lib/
│   ├── openclaw.ts         # Gateway client + unwrap helper
│   ├── types.ts            # TypeScript definitions
│   └── utils.ts            # cn() helper, formatters
│
└── api/                    # Server-side API routes
    ├── health/
    │   └── route.ts
    ├── sessions/
    │   ├── route.ts
    │   └── [id]/
    │       └── history/
    │           └── route.ts
    ├── cron/
    │   ├── jobs/
    │   │   └── route.ts
    │   └── [id]/
    │       └── runs/
    │           └── route.ts
    ├── search/
    │   ├── memory/
    │   │   └── route.ts
    │   └── files/
    │       └── route.ts
    ├── status/
    │   └── route.ts
    └── openclaw/
        └── version/
            └── route.ts
```

### 5.2 Feed Page Structure
```
app/feed/
├── page.tsx                # Server component, fetches initial data
├── layout.tsx              # Feed-specific layout
├── components/
│   ├── FeedContainer.tsx   # Client component with state
│   ├── Timeline.tsx        # Reverse-chronological list
│   ├── TimelineItem.tsx    # Single entry with colored dot
│   ├── FilterBar.tsx       # All | Tools | Assistant | User buttons
│   └── FeedSkeleton.tsx    # Loading state
└── lib/
    └── feedUtils.ts        # Parse content parts, flatten history
```

**Data Flow**:
```
page.tsx (Server) 
  → fetch /api/sessions + /api/sessions/:id/history for recent
  → FeedContainer (Client)
    → usePolling(30000) → refresh data
    → FilterBar → setFilter(type)
    → Timeline 
      → TimelineItem[] (colored dots based on type)
```

### 5.3 Calendar Page Structure
```
app/calendar/
├── page.tsx                # Server component
├── components/
│   ├── CalendarContainer.tsx
│   ├── WeekGrid.tsx        # 7-day grid view
│   ├── DayCell.tsx         # Single day with job list
│   ├── JobCard.tsx         # Mini job display in cell
│   ├── JobDetail.tsx       # Expanded job with run history
│   ├── Navigation.tsx      # Prev/Next week, Today button
│   └── CronParser.ts       # Parse "0 5 * * *" to next occurrences
└── lib/
    └── cronUtils.ts        # cron expression parsing
```

**Data Flow**:
```
page.tsx (Server)
  → fetch /api/cron/jobs
  → CalendarContainer (Client)
    → Navigation (week offset state)
    → CronParser (generate week's occurrences)
    → WeekGrid
      → DayCell[] (filtered jobs for that day)
        → JobCard[] (click to expand)
          → JobDetail (fetch /api/cron/jobs/:id/runs)
```

### 5.4 Search Page Structure
```
app/search/
├── page.tsx
├── components/
│   ├── SearchContainer.tsx
│   ├── SearchInput.tsx     # Debounced input
│   ├── ResultsTabs.tsx     # Memories | Files | Conversations | Tasks
│   ├── ResultGroup.tsx     # Section with count badge
│   ├── MemoryResult.tsx    # Memory card with highlight
│   ├── FileResult.tsx      # File match with context
│   ├── SessionResult.tsx   # Session card
│   └── CronResult.tsx      # Task card
└── lib/
    └── searchUtils.ts      # Highlight matching terms
```

**Data Flow**:
```
SearchContainer (Client)
  → SearchInput (debounced 300ms)
    → onChange → trigger search
  → Promise.all([
      fetch(/api/search/memory),
      fetch(/api/search/files),
      fetch(/api/sessions),
      fetch(/api/cron/jobs)
    ])
  → ResultsTabs (tab state)
    → ResultGroup[]
```

### 5.5 Agent Banner Component Spec

**Location**: `app/components/AgentBanner.tsx`

**Props**:
```typescript
interface AgentBannerProps {
  initialStatus: SystemStatus;
  initialVersion: { current: string; latest: string };
  sessions: Session[];
}
```

**Sections** (collapsible):
```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Agent Name    v1.2.3  ✓ Up to date        [▼ Collapse]  │
├─────────────────────────────────────────────────────────────┤
│  Model: glm-5    Context: 45%    Sessions: 3    Mode: dev │
├─────────────────────────────────────────────────────────────┤
│  Resources: [GitHub] [Telegram] [Brave]                     │
├─────────────────────────────────────────────────────────────┤
│  Capabilities: [Web Browse] [Shell] [Files] [Browser]       │
├─────────────────────────────────────────────────────────────┤
│  Sub-Agents (2):                                            │
│  🟢 tony-architect    glm-5    12.4k tokens    [2min ago]   │
│  🟡 peter-dev         qwen3    8.1k tokens     [15min ago]  │
├─────────────────────────────────────────────────────────────┤
│  Workspace: ~/projects/helicarrier    GitHub: @huy         │
└─────────────────────────────────────────────────────────────┘
```

**Status Dot Logic**:
- 🟢 Pulsing green: updated < 2 minutes ago
- 🟡 Yellow: updated < 15 minutes ago
- 🔴 Gray: older than 15 minutes

---

## 6. Data Flow Diagrams

### 6.1 Feed Page Data Flow
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js Server  │────▶│  OpenClaw GW    │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                      │                        │
       │ GET /feed            │ POST /tools/invoke     │
       │─────────────────────▶| sessions_list        │
       │                      │ sessions_history       │
       │                      │◀──────────────────────▶│
       │                      │                        │
       │  HTML + JSON         │ Gateway Envelope:      │
       │◀─────────────────────│ { ok, result: {        │
       │                      │   content: [{          │
       │                      │     type: "text",       │
       │                      │     text: "[...]"       │
       │                      │   }]                    │
       │                      │ }}                      │
       │                      │                        │
       │◀─────────────────────│ unwrap() parses JSON   │
       │                      │ from envelope.result    │
       │                      │.content[0].text         │
       │                      │                        │
       │   (Client-side)      │                        │
       │   usePolling(30s)    │                        │
       │   ──────────────────▶│ fetch('/api/sessions') │
       │                      │ (repeats server flow)   │
```

### 6.2 Search Page Parallel Flow
```
┌─────────────────────────────────────────────────────────────┐
│                     SearchContainer                          │
│                         (Client)                            │
└────────────────────┬────────────────────────────────────────┘
                     │ debounced query
                     ▼
        ┌────────────────────────────┐
        │    Promise.all([...])        │
        │   Parallel requests          │
        └────────┬──────────┬───────────┘
                 │          │
        ┌────────┘          └────────┐
        ▼                            ▼
┌───────────────┐            ┌───────────────┐
│ /api/search/  │            │ /api/sessions │
│   memory      │            │               │
│   files       │            │ /api/cron/    │
│               │            │   jobs        │
└───────┬───────┘            └───────┬───────┘
        │                            │
        ▼                            ▼
┌─────────────────────────────────────────┐
│           Next.js API Routes            │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ memory_ │ │  exec   │ │sessions_ │  │
│  │ search  │ │  (rg)   │ │ list     │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       └───────────┴───────────┘        │
│                   │                     │
│                   ▼                     │
│         ┌─────────────────┐            │
│         │ /tools/invoke   │            │
│         │ (server-side)   │            │
│         └─────────────────┘            │
└─────────────────────────────────────────┘
```

### 6.3 Gateway Communication Pattern (All Routes)
```
┌─────────────────┐
│  API Route      │
│  (app/api/...)  │
└────────┬────────┘
         │
         │ import { openclaw } from '@/lib/openclaw'
         │
         ▼
┌─────────────────┐
│ OpenClawClient  │
│  .invoke(tool,  │
│   params)       │
└────────┬────────┘
         │
         │ POST /tools/invoke
         │ Authorization: Bearer {token}
         │ Body: { tool, params }
         ▼
┌─────────────────┐
│ Gateway         │
│ 127.0.0.1:18789 │
└────────┬────────┘
         │
         │ Response Envelope:
         │ {
         │   ok: true,
         │   result: {
         │     content: [{
         │       type: "text",
         │       text: "<JSON STRING>"
         │     }],
         │     details: {...}
         │   }
         │ }
         ▼
┌─────────────────┐
│ unwrap(envelope)│
│  → JSON.parse(  │
│    content.text)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Return typed   │
│  response to    │
│  client         │
└─────────────────┘
```

---

## 7. Environment Variables

Create `.env.local`:
```bash
# OpenClaw Gateway
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your_token_here

# App Config
NEXT_PUBLIC_APP_NAME=Helicarrier
NEXT_PUBLIC_REFRESH_INTERVAL=30000
```

---

## 8. Styling Architecture

### 8.1 Tailwind Config Extensions
```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#0A0A0F',
        'bg-card': '#1A1A2E',
        'bg-border': '#2A2A3E',
        
        // Accents
        'accent-blue': '#60A5FA',
        'accent-green': '#34D399',
        'accent-purple': '#A78BFA',
        'accent-red': '#F87171',
        'accent-yellow': '#FBBF24',
        
        // Text
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
}
```

### 8.2 CSS Variables (globals.css)
```css
:root {
  --bg-primary: #0A0A0F;
  --bg-card: #1A1A2E;
  --bg-border: #2A2A3E;
  --accent-blue: #60A5FA;
  --accent-green: #34D399;
  --accent-purple: #A78BFA;
}

body {
  background-color: var(--bg-primary);
  color: #F9FAFB;
}
```

---

## 9. Error Handling Strategy

### 9.1 Gateway Errors
- API routes catch errors and return `{ error: string }` with 500 status
- Client components show error states with retry buttons
- Navigation health check shows red dot on failure

### 9.2 Fallback Behaviors
| Scenario | Fallback |
|----------|----------|
| Gateway unreachable | Show cached data + warning banner |
| Session history empty | Show "No activity" placeholder |
| Cron parse error | Show raw expression |
| Search timeout | Return partial results |

---

## 10. Performance Considerations

1. **Server-side rendering**: All initial data fetched in Server Components
2. **Polling**: 30s interval for feed, 30s for health check
3. **Debouncing**: 300ms for search input
4. **Caching**: Health check cached 5s on server
5. **Pagination**: Feed limited to last 100 entries
6. **Parallel fetching**: Search uses Promise.all for concurrent requests

---

## 11. Security Checklist

- [ ] Gateway token never exposed to browser
- [ ] All `/api/*` routes validate auth if needed
- [ ] No sensitive data in client-side JS bundles
- [ ] `.env.local` in `.gitignore`
- [ ] Input sanitization on search queries
