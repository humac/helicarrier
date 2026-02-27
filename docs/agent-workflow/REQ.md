# Helicarrier v3 - Requirements Document

## 1. Project Overview

**Mission Control Dashboard for OpenClaw**

Helicarrier v3 is a real-time mission control dashboard that provides visibility into OpenClaw agent operations. It serves as the central interface for monitoring agent activity, managing scheduled tasks, and searching across all agent interactions.

**Purpose:**
- Real-time activity feed of agent operations
- Cron job management and visualization
- Global search across agent history
- Agent status and capability overview

---

## 2. Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Framework** | Next.js 14+ | App Router, Server Components |
| **Styling** | Tailwind CSS 3.x | Utility-first CSS |
| **Language** | TypeScript 5.x | Type safety |
| **State** | React Query / SWR | Server state management |
| **Icons** | Lucide React | Icon library |
| **Date Handling** | date-fns | Timestamp formatting |

---

## 3. Architecture

### 3.1 High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser UI    │────▶│  Next.js App     │────▶│  OpenClaw       │
│   (Client)      │◀────│  (Server)        │◀────│  Gateway API    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  .env.local      │
                       │  (Secrets)       │
                       └──────────────────┘
```

### 3.2 Server-Side Gateway Client

- All Gateway API calls made from **server-side only**
- Never expose `GATEWAY_URL` or `GATEWAY_TOKEN` to client
- Use Next.js API routes as proxy layer
- Implement retry logic with exponential backoff

### 3.3 Environment Configuration

**.env.local** (required, never commit):
```bash
GATEWAY_URL=http://localhost:8080
GATEWAY_TOKEN=your-gateway-token-here
NEXT_PUBLIC_APP_NAME=Helicarrier
NEXT_PUBLIC_POLL_INTERVAL_MS=5000
```

### 3.4 Directory Structure

```
projects/helicarrier/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Redirect to /feed
│   ├── feed/
│   │   └── page.tsx
│   ├── calendar/
│   │   └── page.tsx
│   ├── search/
│   │   └── page.tsx
│   └── api/
│       ├── gateway/
│       │   └── route.ts      # Gateway proxy
│       ├── feed/
│       │   └── route.ts
│       ├── calendar/
│       │   └── route.ts
│       └── search/
│           └── route.ts
├── components/
│   ├── ui/                   # Base UI components
│   ├── layout/               # Layout components
│   │   ├── Navigation.tsx
│   │   └── AgentBanner.tsx
│   └── features/             # Feature-specific components
├── lib/
│   ├── gateway.ts            # Gateway client
│   ├── utils.ts              # Utilities
│   └── types.ts              # TypeScript types
├── hooks/                    # Custom React hooks
├── styles/
│   └── globals.css
└── .env.local.example
```

---

## 4. Gateway Integration

### 4.1 API Endpoint

**Base URL:** `{GATEWAY_URL}/tools/invoke`

### 4.2 Authentication

```http
Authorization: Bearer {GATEWAY_TOKEN}
Content-Type: application/json
```

### 4.3 Request Format

```typescript
interface GatewayRequest {
  tool: string;
  action: string;
  params?: Record<string, unknown>;
}
```

### 4.4 Response Envelope

```typescript
interface GatewayResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

**Important:** Always unwrap the response envelope before using data.

### 4.5 Gateway Client Implementation

```typescript
// lib/gateway.ts
export async function invokeGateway<T>(
  tool: string,
  action: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${process.env.GATEWAY_URL}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tool, action, params }),
  });

  const envelope: GatewayResponse<T> = await response.json();

  if (!envelope.success) {
    throw new Error(envelope.error?.message || 'Gateway request failed');
  }

  return envelope.data!;
}
```

---

## 5. Pages

### 5.1 Activity Feed (`/feed`)

**Purpose:** Real-time timeline of agent activities and interactions.

**Features:**
- Chronological list of agent actions
- Filter by agent name, tool, action type
- Infinite scroll with pagination
- Real-time updates via polling (configurable interval)
- Expandable action details

**Data Source:** Gateway `message` tool with `action=list` or custom feed endpoint

**Acceptance Criteria:**
- [ ] Displays agent activities in reverse chronological order
- [ ] Shows timestamp, agent name, tool, action, and preview
- [ ] Supports filtering by agent, tool, and date range
- [ ] Auto-refreshes every 5 seconds (configurable)
- [ ] Handles empty state gracefully
- [ ] Shows loading states during fetch
- [ ] Handles errors with user-friendly messages
- [ ] Infinite scroll loads more items on scroll

---

### 5.2 Calendar (`/calendar`)

**Purpose:** View and manage scheduled cron jobs.

**Features:**
- Monthly calendar view
- List of scheduled jobs per day
- Job details (schedule, command, last run, next run)
- Enable/disable toggle for jobs
- Manual trigger option

**Data Source:** Gateway healthcheck or custom cron management tool

**Acceptance Criteria:**
- [ ] Displays current month with job indicators
- [ ] Shows job list in sidebar or panel
- [ ] Each job shows: name, cron schedule, status, last/next run
- [ ] Can enable/disable jobs with confirmation
- [ ] Can manually trigger a job
- [ ] Visual distinction between active/inactive jobs
- [ ] Shows job execution history (last 5 runs)
- [ ] Handles timezone correctly (display in user's local time)

---

### 5.3 Search (`/search`)

**Purpose:** Global search across all agent activities and messages.

**Features:**
- Full-text search across message history
- Filter by channel, agent, date range
- Highlighted search terms in results
- Result grouping by conversation/channel
- Export search results option

**Data Source:** Gateway `message` tool with search parameters

**Acceptance Criteria:**
- [ ] Search box with debounced input (300ms)
- [ ] Returns results matching query text
- [ ] Supports filters: channel, agent, date range, message type
- [ ] Highlights matched terms in results
- [ ] Groups results by conversation/channel
- [ ] Shows result count and pagination
- [ ] Handles special characters and operators
- [ ] Export results as JSON or CSV
- [ ] Empty state with search tips

---

## 6. Shared Components

### 6.1 Agent Banner

**Location:** Top of every page (below navigation)

**Purpose:** Display current agent status and capabilities.

**Content:**
- Agent name and avatar
- Current status (online, busy, offline)
- Key statistics:
  - Messages sent (24h)
  - Active sub-agents
  - Uptime
- Capability badges (tools available)
- Quick actions (refresh status, view logs)

**Acceptance Criteria:**
- [ ] Shows agent name and avatar prominently
- [ ] Status indicator with color coding (green/yellow/red)
- [ ] Displays 3-4 key statistics
- [ ] Lists available capabilities as badges
- [ ] Refreshes status on page load
- [ ] Clicking agent name opens detailed view
- [ ] Responsive design (collapses on mobile)

---

### 6.2 Navigation

**Location:** Left sidebar (desktop) / Bottom bar (mobile)

**Purpose:** Primary navigation between pages.

**Items:**
- Feed (icon: `Activity`)
- Calendar (icon: `Calendar`)
- Search (icon: `Search`)
- Settings (icon: `Settings`) - future

**Acceptance Criteria:**
- [ ] Fixed position navigation
- [ ] Active state highlighting for current page
- [ ] Responsive: sidebar on desktop, bottom bar on mobile
- [ ] Smooth transitions between pages
- [ ] Keyboard navigation support (Tab, Enter)
- [ ] Tooltips on hover (desktop only)
- [ ] Logo/brand in header area

---

## 7. Theme

### 7.1 Dark Mode (Default)

**Color Palette:**

```css
/* Background */
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--bg-tertiary: #1a1a25;
--bg-elevated: #252535;

/* Text */
--text-primary: #f0f0f5;
--text-secondary: #a0a0b0;
--text-muted: #606070;

/* Accent Colors */
--accent-primary: #6366f1;      /* Indigo */
--accent-secondary: #8b5cf6;    /* Violet */
--accent-success: #10b981;      /* Emerald */
--accent-warning: #f59e0b;      /* Amber */
--accent-error: #ef4444;        /* Red */
--accent-info: #3b82f6;         /* Blue */

/* Borders */
--border-default: #2a2a3a;
--border-subtle: #1f1f2a;

/* Status Colors */
--status-online: #10b981;
--status-busy: #f59e0b;
--status-offline: #6b7280;
```

### 7.2 Typography

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
```

### 7.3 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a25',
          elevated: '#252535',
        },
        accent: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
    },
  },
}
```

**Acceptance Criteria:**
- [ ] Dark mode is default (no toggle needed for v1)
- [ ] All colors match the specified palette
- [ ] Sufficient contrast ratios (WCAG AA compliant)
- [ ] Consistent spacing using Tailwind scale
- [ ] Typography hierarchy is clear and readable

---

## 8. Key Gotchas

### 8.1 Timestamp Handling

⚠️ **Critical:** Gateway timestamps are in **milliseconds**, NOT seconds.

```typescript
// ✅ Correct
const date = new Date(timestampMs);

// ❌ Wrong
const date = new Date(timestampMs * 1000);
```

**Formatting:**
```typescript
import { format, formatDistanceToNow } from 'date-fns';

// Display format: "Feb 27, 2026 05:43 UTC"
format(timestampMs, 'MMM d, yyyy HH:mm:ss z');

// Relative: "5 minutes ago"
formatDistanceToNow(timestampMs, { addSuffix: true });
```

---

### 8.2 Content Field Handling

⚠️ **Critical:** Message `content` can be **string OR array**.

```typescript
// Handle both cases
function getMessageContent(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content.map(part => part.text || '').join('');
  }
  return '';
}
```

**Type Definition:**
```typescript
interface Message {
  id: string;
  content: string | Array<{ type: string; text?: string; [key: string]: unknown }>;
  timestamp: number; // milliseconds
  channel: string;
  author: string;
  // ... other fields
}
```

---

### 8.3 Cron Schedule Object

⚠️ **Critical:** Cron schedules may be objects, not just strings.

```typescript
// Could be either:
type CronSchedule = string | {
  expression: string;  // "0 */6 * * *"
  timezone?: string;   // "UTC"
  enabled?: boolean;
};

// Normalize before use
function normalizeCronSchedule(schedule: CronSchedule): string {
  if (typeof schedule === 'string') {
    return schedule;
  }
  return schedule.expression;
}
```

---

### 8.4 Error Handling

- Always check `response.ok` before parsing JSON
- Handle network errors gracefully
- Show user-friendly error messages (not stack traces)
- Implement retry logic for transient failures
- Log errors to console in development

---

### 8.5 Security Considerations

- Never expose `GATEWAY_TOKEN` to client-side code
- Use API routes as server-side proxy
- Validate and sanitize all user inputs
- Implement rate limiting on API routes
- Use HTTPS in production

---

## 9. Acceptance Criteria Summary

### Phase 1: Setup & Foundation
- [ ] Next.js project initialized with TypeScript
- [ ] Tailwind CSS configured with custom theme
- [ ] Gateway client implemented and tested
- [ ] Environment variables properly configured
- [ ] Basic layout with navigation scaffolded

### Phase 2: Core Pages
- [ ] `/feed` displays activity timeline with all criteria
- [ ] `/calendar` shows cron jobs with all criteria
- [ ] `/search` provides global search with all criteria

### Phase 3: Components
- [ ] Agent Banner displays all required information
- [ ] Navigation works across all screen sizes
- [ ] All components are responsive

### Phase 4: Polish
- [ ] Dark theme fully implemented
- [ ] All gotchas addressed in code
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Performance optimized (lazy loading, memoization)

---

## 10. Out of Scope (v3)

- User authentication (Gateway auth only)
- Real-time WebSocket updates (polling for v1)
- Mobile app (responsive web only)
- Advanced analytics/dashboard customization
- Multi-Gateway support
- Plugin system

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-27  
**Author:** @pepper (Analyst)
