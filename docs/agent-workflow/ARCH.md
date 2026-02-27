# Helicarrier v3 - System Architecture

**Version:** 1.0  
**Date:** 2026-02-27  
**Author:** @tony (Architect)

---

## 1. Executive Summary

Helicarrier v3 is a real-time mission control dashboard for OpenClaw agent operations. This document defines the system architecture, technology decisions, and implementation patterns for building a type-safe, performant, and secure dashboard application.

---

## 2. Technology Stack

### 2.1 Core Technologies

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Framework** | Next.js 14+ | App Router, Server Components | Server-side rendering, API routes, optimal caching |
| **Styling** | Tailwind CSS 3.x | Utility-first CSS | Rapid development, consistent design system |
| **Language** | TypeScript 5.x | Type safety | Compile-time error detection, IntelliSense |
| **State Management** | Zustand | Client state | Minimal boilerplate, reactive, devtools support |
| **Server State** | SWR | Data fetching | Built-in caching, revalidation, optimistic updates |
| **Icons** | Lucide React | Icon library | Consistent design, tree-shakeable |
| **Date Handling** | date-fns | Timestamp formatting | Lightweight, functional, timezone support |

### 2.2 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code quality |
| Prettier | Code formatting |
| TypeScript | Type checking |
| Jest + React Testing Library | Unit/integration tests |

---

## 3. Project Structure

### 3.1 Directory Layout

```
projects/helicarrier/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home (redirects to /feed)
│   ├── feed/
│   │   └── page.tsx              # Activity Feed page
│   ├── calendar/
│   │   └── page.tsx              # Calendar/Cron page
│   ├── search/
│   │   └── page.tsx              # Global Search page
│   └── api/                      # API Routes (server-side only)
│       ├── gateway/
│       │   └── route.ts          # Generic Gateway proxy
│       ├── feed/
│       │   └── route.ts          # Feed data endpoint
│       ├── calendar/
│       │   └── route.ts          # Calendar/jobs endpoint
│       └── search/
│           └── route.ts          # Search endpoint
├── components/
│   ├── ui/                       # Base UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Spinner.tsx
│   │   └── Skeleton.tsx
│   ├── layout/                   # Layout components
│   │   ├── Navigation.tsx        # Sidebar/bottom nav
│   │   ├── AgentBanner.tsx       # Agent status header
│   │   └── PageContainer.tsx     # Page wrapper
│   └── features/                 # Feature-specific components
│       ├── feed/
│       │   ├── FeedList.tsx
│       │   ├── FeedItem.tsx
│       │   ├── FeedFilters.tsx
│       │   └── FeedDetail.tsx
│       ├── calendar/
│       │   ├── CalendarGrid.tsx
│       │   ├── JobList.tsx
│       │   ├── JobCard.tsx
│       │   └── JobDetail.tsx
│       └── search/
│           ├── SearchInput.tsx
│           ├── SearchResults.tsx
│           ├── SearchResultItem.tsx
│           └── SearchFilters.tsx
├── lib/
│   ├── openclaw.ts               # Gateway client (server-side)
│   ├── types.ts                  # TypeScript interfaces
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # App constants
├── hooks/                        # Custom React hooks
│   ├── useFeed.ts
│   ├── useCalendar.ts
│   ├── useSearch.ts
│   └── useAgentStatus.ts
├── store/                        # Zustand stores
│   ├── agentStore.ts
│   └── uiStore.ts
├── styles/
│   └── globals.css               # Global styles, CSS variables
├── .env.local                    # Environment variables (gitignored)
├── .env.local.example            # Example env file
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 3.2 Key Structural Decisions

- **`app/`** - Next.js 14 App Router structure with route groups
- **`components/ui/`** - Reusable primitive components (buttons, inputs)
- **`components/layout/`** - App-level layout components (nav, banner)
- **`components/features/`** - Domain-specific components organized by feature
- **`lib/`** - Server-side utilities and Gateway client
- **`hooks/`** - Custom hooks for data fetching and state
- **`store/`** - Zustand stores for client state management

---

## 4. Gateway Client Architecture

### 4.1 Security Model

**CRITICAL:** The Gateway token must NEVER be exposed to the browser.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser UI    │────▶│  Next.js Server  │────▶│  OpenClaw       │
│   (Client)      │◀────│  (API Routes)    │◀────│  Gateway API    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  .env.local      │
                       │  GATEWAY_TOKEN   │
                       └──────────────────┘
```

### 4.2 Gateway Client Implementation

**File:** `lib/openclaw.ts`

```typescript
import { GatewayResponse, GatewayRequest } from './types';

/**
 * Server-side Gateway client
 * NEVER import this file in client components
 */

const GATEWAY_URL = process.env.GATEWAY_URL;
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

if (!GATEWAY_URL || !GATEWAY_TOKEN) {
  throw new Error('Missing GATEWAY_URL or GATEWAY_TOKEN environment variables');
}

/**
 * Invoke a Gateway tool action
 * @param tool - Tool name (e.g., 'message', 'healthcheck')
 * @param action - Action name (e.g., 'list', 'send')
 * @param params - Optional parameters
 * @returns Unwrapped response data
 */
export async function invokeGateway<T>(
  tool: string,
  action: string,
  params?: Record<string, unknown>
): Promise<T> {
  const url = `${GATEWAY_URL}/tools/invoke`;
  
  const request: GatewayRequest = {
    tool,
    action,
    params: params || {},
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status} ${response.statusText}`);
  }

  const envelope: GatewayResponse<T> = await response.json();

  if (!envelope.success) {
    throw new Error(envelope.error?.message || 'Gateway request failed');
  }

  if (envelope.data === undefined) {
    throw new Error('Gateway returned no data');
  }

  return envelope.data;
}

/**
 * Retry wrapper with exponential backoff
 */
export async function invokeGatewayWithRetry<T>(
  tool: string,
  action: string,
  params?: Record<string, unknown>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await invokeGateway<T>(tool, action, params);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (lastError.message.includes('400') || lastError.message.includes('401')) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Gateway request failed after retries');
}
```

### 4.3 Response Unwrapping Helper

```typescript
// lib/utils.ts

/**
 * Unwrap Gateway response envelope
 * Handles both success and error cases
 */
export function unwrapGatewayResponse<T>(
  envelope: unknown,
  context: string = 'Gateway request'
): T {
  const response = envelope as GatewayResponse<T>;
  
  if (!response || typeof response !== 'object') {
    throw new Error(`${context}: Invalid response format`);
  }
  
  if (!response.success) {
    throw new Error(`${context}: ${response.error?.message || 'Unknown error'}`);
  }
  
  if (response.data === undefined) {
    throw new Error(`${context}: No data returned`);
  }
  
  return response.data;
}
```

---

## 5. API Route Patterns

### 5.1 Pattern Overview

All Gateway interactions happen through Next.js API routes as a proxy layer.

```
Client Component → API Route (/api/*) → Gateway Client → OpenClaw Gateway
```

### 5.2 API Route Template

**File:** `app/api/feed/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { invokeGatewayWithRetry } from '@/lib/openclaw';
import { Message } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');
    
    // Invoke Gateway to fetch feed data
    const messages = await invokeGatewayWithRetry<Message[]>(
      'message',
      'list',
      { limit, cursor }
    );
    
    return NextResponse.json({
      success: true,
      data: messages,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Feed API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FEED_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch feed',
        },
      },
      { status: 500 }
    );
  }
}
```

### 5.3 Standard Response Format

All API routes return a consistent envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: number;  // epoch ms
}
```

### 5.4 API Route Endpoints

| Endpoint | Method | Gateway Tool | Description |
|----------|--------|--------------|-------------|
| `/api/feed` | GET | `message.list` | Fetch activity feed |
| `/api/calendar` | GET | `healthcheck.status` | Fetch cron jobs |
| `/api/calendar/:id/toggle` | POST | `healthcheck.toggle` | Enable/disable job |
| `/api/calendar/:id/trigger` | POST | `healthcheck.trigger` | Manual job trigger |
| `/api/search` | GET | `message.search` | Global search |
| `/api/agent/status` | GET | Custom | Agent status overview |

---

## 6. State Management

### 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client State (Zustand)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  agentStore  │  │   uiStore    │  │  filterStore │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SWR (server state)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server State (SWR)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  /api/feed   │  │ /api/calendar│  │  /api/search │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Zustand Stores

**File:** `store/agentStore.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AgentStatus {
  name: string;
  status: 'online' | 'busy' | 'offline';
  messagesSent24h: number;
  activeSubAgents: number;
  uptime: number;  // milliseconds
  capabilities: string[];
  lastSeen: number;  // epoch ms
}

interface AgentState {
  status: AgentStatus | null;
  isLoading: boolean;
  error: Error | null;
  setStatus: (status: AgentStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  refresh: () => Promise<void>;
}

export const useAgentStore = create<AgentState>()(
  devtools((set, get) => ({
    status: null,
    isLoading: false,
    error: null,
    
    setStatus: (status) => set({ status, error: null }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    refresh: async () => {
      set({ isLoading: true });
      try {
        const response = await fetch('/api/agent/status');
        const data = await response.json();
        if (data.success) {
          set({ status: data.data, error: null });
        } else {
          set({ error: new Error(data.error.message) });
        }
      } catch (error) {
        set({ error: error as Error });
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);
```

**File:** `store/uiStore.ts`

```typescript
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark';  // v1 is dark-only
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

### 6.3 SWR Configuration

**File:** `lib/swr.ts`

```typescript
import SWRConfig from 'swr';

export const swrConfig = {
  fetcher: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }
    const data = await response.json();
    return data.data;  // Unwrap API response
  },
  refreshInterval: 5000,  // 5 seconds for real-time feel
  dedupingInterval: 2000,  // Don't refetch within 2s
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Stop retrying after 3 attempts
    if (retryCount >= 3) return false;
    // Don't retry on 4xx errors
    if (error.message.includes('40')) return false;
    // Exponential backoff
    setTimeout(() => revalidate({ retryCount }), Math.pow(2, retryCount) * 1000);
  },
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
```

---

## 7. Data Flow Diagrams

### 7.1 Feed Data Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   FeedPage  │─────▶│  useFeed()  │─────▶│  SWR Hook   │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │ /api/feed   │
                                         └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │openclaw.ts  │
                                         └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │   Gateway   │
                                         └─────────────┘
```

### 7.2 State Update Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ API Response│─────▶│  SWR Cache  │─────▶│  Component  │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  │
                    ┌─────────────────────────────┘
                    ▼
             ┌─────────────┐
             │  Re-render  │
             └─────────────┘
```

### 7.3 User Action Flow (Toggle Cron Job)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  User Click │─────▶│  JobCard    │─────▶│  onClick    │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │  mutate()   │
                                         │(optimistic) │
                                         └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │POST /api/...│
                                         └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │   Gateway   │
                                         └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │ Revalidate  │
                                         └─────────────┘
```

---

## 8. Type Definitions

### 8.1 Core Types

**File:** `lib/types.ts`

```typescript
// Gateway request/response envelope
export interface GatewayRequest {
  tool: string;
  action: string;
  params?: Record<string, unknown>;
}

export interface GatewayResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// API response envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: number;
}

// Message types (content can be string OR array)
export interface Message {
  id: string;
  content: string | MessageContentPart[];
  timestamp: number;  // epoch milliseconds
  channel: string;
  author: string;
  tool?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageContentPart {
  type: string;
  text?: string;
  [key: string]: unknown;
}

// Cron job types (schedule can be string OR object)
export interface CronJob {
  id: string;
  name: string;
  schedule: string | CronScheduleObject;
  command: string;
  enabled: boolean;
  lastRun?: number;  // epoch ms
  nextRun?: number;  // epoch ms
  history?: JobExecution[];
}

export interface CronScheduleObject {
  expression: string;
  timezone?: string;
  enabled?: boolean;
}

export interface JobExecution {
  timestamp: number;  // epoch ms
  duration: number;   // milliseconds
  success: boolean;
  output?: string;
}

// Agent status
export interface AgentStatus {
  name: string;
  status: 'online' | 'busy' | 'offline';
  messagesSent24h: number;
  activeSubAgents: number;
  uptime: number;  // milliseconds
  capabilities: string[];
  lastSeen: number;  // epoch ms
}
```

### 8.2 Utility Types

```typescript
// Helper to extract content from message
export function getMessageContent(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content
      .map(part => part.text || '')
      .join('');
  }
  return '';
}

// Helper to normalize cron schedule
export function normalizeCronSchedule(
  schedule: string | CronScheduleObject
): string {
  if (typeof schedule === 'string') {
    return schedule;
  }
  return schedule.expression;
}

// Helper to format timestamp (epoch ms)
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);  // timestamp is already in ms
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return formatTimestamp(timestamp);
}
```

---

## 9. Security Considerations

### 9.1 Environment Variables

**.env.local** (never commit):

```bash
# Gateway Configuration
GATEWAY_URL=http://localhost:8080
GATEWAY_TOKEN=your-secret-token-here

# Application Configuration
NEXT_PUBLIC_APP_NAME=Helicarrier
NEXT_PUBLIC_POLL_INTERVAL_MS=5000
```

**.env.local.example** (safe to commit):

```bash
# Gateway Configuration
GATEWAY_URL=http://localhost:8080
GATEWAY_TOKEN=your-gateway-token-here

# Application Configuration
NEXT_PUBLIC_APP_NAME=Helicarrier
NEXT_PUBLIC_POLL_INTERVAL_MS=5000
```

### 9.2 Security Rules

1. **NEVER expose `GATEWAY_TOKEN` to client**
   - Token only used in server-side API routes
   - Never include in `NEXT_PUBLIC_*` variables
   - Never send to browser in any form

2. **API Route Protection**
   - Validate all incoming requests
   - Implement rate limiting (future)
   - Sanitize user inputs

3. **CORS Configuration**
   - Restrict to trusted origins in production
   - Use `next.config.js` CORS settings

4. **Input Validation**
   - Validate all query parameters
   - Sanitize search inputs
   - Type-check all API responses

### 9.3 Bearer Authentication

All Gateway requests use Bearer token authentication:

```typescript
headers: {
  'Authorization': `Bearer ${process.env.GATEWAY_TOKEN}`,
  'Content-Type': 'application/json',
}
```

---

## 10. Performance Considerations

### 10.1 Caching Strategy

| Layer | Strategy | Duration |
|-------|----------|----------|
| **SWR Cache** | In-memory | 5s (poll interval) |
| **API Route** | No cache (dynamic) | - |
| **Gateway** | Gateway-managed | Varies |

### 10.2 SWR/React Query Benefits

- **Automatic caching** - Responses cached by URL
- **Background revalidation** - Stale-while-revalidate pattern
- **Optimistic updates** - UI updates before server confirmation
- **Deduping** - Prevents duplicate requests
- **Retry logic** - Exponential backoff on failures

### 10.3 Optimization Techniques

1. **Code Splitting**
   - Next.js automatic route-based splitting
   - Dynamic imports for heavy components

2. **Memoization**
   - `React.memo()` for expensive components
   - `useMemo()` for computed values
   - `useCallback()` for event handlers

3. **Virtual Scrolling**
   - Use `react-window` or `tanstack-virtual` for long lists
   - Feed page should virtualize after 100 items

4. **Image Optimization**
   - Use Next.js `<Image>` component
   - Lazy loading for off-screen images

5. **Bundle Size**
   - Tree-shake Lucide icons (import individual icons)
   - Analyze bundle with `@next/bundle-analyzer`

### 10.4 Loading States

```typescript
// Skeleton loader pattern
function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

// Usage in component
function FeedPage() {
  const { data, isLoading, error } = useFeed();
  
  if (isLoading) return <FeedSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState />;
  
  return <FeedList data={data} />;
}
```

---

## 11. Error Boundaries

### 11.1 Global Error Boundary

**File:** `components/ui/ErrorBoundary.tsx`

```typescript
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded">
          <h2 className="text-lg font-semibold text-red-400">Something went wrong</h2>
          <p className="text-sm text-red-300 mt-2">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 11.2 Usage Pattern

```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

## 12. Accessibility

### 12.1 ARIA Labels

```typescript
// Navigation example
<nav aria-label="Main navigation">
  <ul>
    <li>
      <a 
        href="/feed" 
        aria-current={pathname === '/feed' ? 'page' : undefined}
        aria-label="View activity feed"
      >
        <ActivityIcon aria-hidden="true" />
        Feed
      </a>
    </li>
  </ul>
</nav>
```

### 12.2 Keyboard Navigation

- All interactive elements focusable via Tab
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys for list navigation

### 12.3 Color Contrast

- All text meets WCAG AA (4.5:1 minimum)
- Status colors have sufficient contrast
- Don't rely on color alone for information

### 12.4 Screen Reader Support

- Semantic HTML (nav, main, article, etc.)
- ARIA live regions for dynamic content
- Alt text for images/icons where needed

---

## 13. Key Implementation Details

### 13.1 Timestamp Handling

**CRITICAL:** All Gateway timestamps are in **milliseconds**, NOT seconds.

```typescript
// ✅ Correct - timestamps are already in ms
const date = new Date(message.timestamp);

// ❌ Wrong - don't multiply by 1000
const date = new Date(message.timestamp * 1000);
```

### 13.2 Content Field Handling

**CRITICAL:** Message content can be string OR array.

```typescript
function renderContent(message: Message) {
  const content = getMessageContent(message);
  return <p>{content}</p>;
}
```

### 13.3 Cron Schedule Extraction

**CRITICAL:** Schedule can be string OR object.

```typescript
function displaySchedule(job: CronJob) {
  const expr = normalizeCronSchedule(job.schedule);
  return <code>{expr}</code>;
}
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

- Gateway client functions
- Utility functions (timestamp formatting, content extraction)
- Zustand store actions

### 14.2 Component Tests

- UI primitives (Button, Input, Card)
- Feature components (FeedItem, JobCard)
- Layout components (Navigation, AgentBanner)

### 14.3 Integration Tests

- API route handlers
- SWR hook data fetching
- End-to-end user flows

### 14.4 Test Files Structure

```
__tests__/
├── lib/
│   ├── openclaw.test.ts
│   └── utils.test.ts
├── components/
│   ├── ui/
│   └── features/
└── app/
    └── api/
```

---

## 15. Deployment Considerations

### 15.1 Environment-Specific Config

| Environment | GATEWAY_URL | Notes |
|-------------|-------------|-------|
| Development | http://localhost:8080 | Local Gateway |
| Staging | https://staging-gateway | Staging Gateway |
| Production | https://gateway.example.com | Production Gateway |

### 15.2 Build Configuration

```javascript
// next.config.js
module.exports = {
  output: 'standalone',  // For Docker deployment
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_POLL_INTERVAL_MS: process.env.NEXT_PUBLIC_POLL_INTERVAL_MS,
  },
};
```

---

## 16. Summary

This architecture provides:

- **Security:** Server-side Gateway client, token never exposed
- **Type Safety:** Comprehensive TypeScript types for all data
- **Performance:** SWR caching, optimistic updates, lazy loading
- **Reliability:** Error boundaries, retry logic, graceful degradation
- **Accessibility:** ARIA labels, keyboard navigation, screen reader support
- **Maintainability:** Clean separation of concerns, reusable components

---

**Next Steps:**
1. Peter (Build) will implement Phase 1 setup based on this architecture
2. All implementation must follow the patterns defined herein
3. Any deviations must be documented and justified

---

## ✅ Tony Architecture Complete

| Metric | Value |
|--------|-------|
| **Session Key** | agent:jarvis:subagent:c69d73cc-3b85-40a4-bcf5-cb1c17af3a8b |
| **Model Used** | ollama/qwen3.5:397b-cloud |
| **Tokens** | ~8500 in / ~3200 out |
| **Runtime** | 3 minutes |
| **Deliverables** | ARCH.md, updated TASKS.md |
| **Acceptance** | ✅ |

**Next**: Peter (Build - Phase 1 Setup)
