# Helicarrier v3 - Architectural Decisions Log

This document records all significant architectural decisions made during the Helicarrier v3 project.

---

## DEC-001: Next.js 14 App Router (vs Pages Router)

**Date:** 2026-02-27  
**Status:** ✅ Adopted

### Context
Next.js offers two routing paradigms: the traditional Pages Router and the newer App Router (introduced in v13, stable in v14).

### Decision
Use **Next.js 14 App Router** with Server Components.

### Alternatives Considered
- **Pages Router:** More mature, simpler mental model, but lacks Server Component benefits
- **Remix:** Great alternative but team familiarity with Next.js

### Rationale
1. **Server Components by default** - Reduced bundle size, direct backend access
2. **Better data fetching patterns** - Colocated data requirements with components
3. **Future-proof** - App Router is the direction Next.js is heading
4. **API route organization** - Cleaner structure with `app/api/` pattern

### Consequences
- **Positive:** Better performance, cleaner code organization, modern patterns
- **Negative:** Slightly steeper learning curve for team members unfamiliar with App Router
- **Mitigation:** Documented patterns in `ARCH.md`

---

## DEC-002: Server-Side Gateway Integration (vs Client-Side)

**Date:** 2026-02-27  
**Status:** ✅ Adopted

### Context
The OpenClaw Gateway API requires Bearer token authentication. The token must not be exposed to the browser.

### Decision
Implement **server-side Gateway client** in Next.js API routes. Token is NEVER sent to the client.

### Alternatives Considered
- **Client-side with proxy:** More complex, adds latency
- **Client-side with token:** Security violation - rejected immediately
- **Edge Functions:** Considered but standard API routes sufficient

### Rationale
1. **Security:** Token stays on server, never exposed in browser dev tools
2. **Control:** API routes can implement rate limiting, caching, error handling
3. **Simplicity:** Standard Next.js pattern, well-documented
4. **Flexibility:** Can add authentication/authorization layer later

### Consequences
- **Positive:** Secure by design, centralized error handling, easy to add middleware
- **Negative:** Extra network hop (client → API route → Gateway)
- **Mitigation:** Minimal latency impact, SWR caching reduces repeated calls

---

## DEC-003: Zustand + SWR State Management (vs Redux/Context)

**Date:** 2026-02-27  
**Status:** ✅ Adopted

### Context
React applications need state management for both client state (UI, filters) and server state (API data).

### Decision
Use **Zustand for client state** and **SWR for server state**.

### Alternatives Considered
- **Redux Toolkit:** Overkill for this project, too much boilerplate
- **React Context:** Not suitable for frequently changing data, causes re-renders
- **React Query:** Similar to SWR, but team preference for SWR's simplicity
- **Zustand only:** Would work but SWR provides better server-state features out of the box

### Rationale
1. **Clear separation:** Client state (Zustand) vs server state (SWR)
2. **Minimal boilerplate:** Zustand requires ~10 lines vs ~100 for Redux
3. **Built-in caching:** SWR provides caching, revalidation, optimistic updates
4. **DevTools:** Zustand has Redux DevTools support via middleware
5. **Bundle size:** Both are lightweight (~3KB each)

### Consequences
- **Positive:** Clean architecture, minimal code, excellent DX
- **Negative:** Two libraries to learn (but both are simple)
- **Mitigation:** Documented patterns in `ARCH.md`

---

## DEC-004: Tailwind CSS Custom Theme (vs Default)

**Date:** 2026-02-27  
**Status:** ✅ Adopted

### Context
Tailwind provides default design tokens. Projects can customize via `tailwind.config`.

### Decision
Use **custom Tailwind theme** with dark-mode-first design, custom colors, and extended spacing.

### Alternatives Considered
- **Default Tailwind:** Faster setup but generic look
- **CSS Modules:** More flexibility but slower development
- **Styled Components:** Runtime overhead, not aligned with Next.js App Router

### Rationale
1. **Design consistency:** Custom theme ensures cohesive visual identity
2. **Dark mode first:** Mission control dashboard aesthetic
3. **Development speed:** Utility classes faster than writing custom CSS
4. **Bundle optimization:** PurgeCSS removes unused styles in production

### Consequences
- **Positive:** Fast development, consistent design, optimized bundle
- **Negative:** Large HTML with many class names
- **Mitigation:** Prettier formats class names, component abstraction for repeated patterns

---

## DEC-005: SWR Type Error Fix (as any cast)

**Date:** 2026-02-27  
**Status:** ✅ Adopted

### Context
SWR's type inference was causing compilation errors with our custom fetcher pattern.

### Decision
Use **`as any` type cast** for SWR hook return values where type inference fails.

### Alternatives Considered
- **Explicit generic types:** Verbose, doesn't always work with SWR's complex types
- **Custom hook wrapper:** Adds abstraction layer, more code to maintain
- **Suppress type errors:** Less explicit than `as any`

### Rationale
1. **Pragmatism:** Gets the job done without excessive complexity
2. **Type safety preserved:** Only affects the specific problematic line
3. **Common pattern:** Widely used in React/TypeScript community for edge cases
4. **Maintainability:** Easy to understand and fix later if SWR types improve

### Consequences
- **Positive:** Build passes, minimal type safety loss
- **Negative:** Loses type inference at that specific point
- **Mitigation:** Isolated to SWR hooks, rest of codebase remains fully typed

---

## DEC-006: openclaw.ts Env Var Validation (Module Load vs Call Time)

**Date:** 2026-02-27  
**Status:** ✅ Adopted

### Context
Environment variables must be validated before use. Question: validate at module load time or function call time?

### Decision
Validate **at module load time** with immediate `throw` if missing.

### Alternatives Considered
- **Call-time validation:** Check inside each function
- **Runtime warning:** Log warning but continue
- **Default values:** Use fallbacks if missing

### Rationale
1. **Fail fast:** Immediate crash on startup is better than runtime errors
2. **Clear error message:** Developer knows exactly what's wrong
3. **No silent failures:** Application won't run in broken state
4. **Single source of truth:** Validation happens once, not repeated

### Implementation
```typescript
const GATEWAY_URL = process.env.GATEWAY_URL;
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

if (!GATEWAY_URL || !GATEWAY_TOKEN) {
  throw new Error('Missing GATEWAY_URL or GATEWAY_TOKEN environment variables');
}
```

### Consequences
- **Positive:** Immediate feedback, prevents subtle bugs
- **Negative:** Module-level throw can cause hydration issues in development
- **Mitigation:** Moved validation to API route level where appropriate

---

## DEC-007: API Route Structure (/api/* Pattern)

**Date:** 2026-02-27  
**Status:** ✅ Adopted

### Context
Next.js App Router allows flexible API route organization.

### Decision
Use **`/api/*` pattern** with one route per endpoint, following RESTful conventions.

### Alternatives Considered
- **Single catch-all route:** More flexible but harder to maintain
- **GraphQL:** Overkill for this use case
- **tRPC:** Adds complexity, team prefers REST for simplicity

### Rationale
1. **Simplicity:** One file per endpoint, easy to find and modify
2. **RESTful:** Standard HTTP methods (GET, POST, etc.)
3. **Scalability:** Easy to add new endpoints without affecting existing ones
4. **Testing:** Each endpoint can be tested independently

### Structure
```
app/api/
├── feed/route.ts          # GET - Activity feed
├── calendar/route.ts      # GET/POST - Cron jobs
├── search/route.ts        # GET - Search
├── sessions/route.ts      # GET - Active sessions
├── history/route.ts       # GET - Session history
└── status/route.ts        # GET - Health check
```

### Consequences
- **Positive:** Clear organization, easy to test, follows conventions
- **Negative:** More files than catch-all approach
- **Mitigation:** File count is manageable, clarity worth the trade-off

---

## Summary Table

| Decision | Status | Impact |
|----------|--------|--------|
| DEC-001: Next.js 14 App Router | ✅ Adopted | High - Foundation |
| DEC-002: Server-Side Gateway | ✅ Adopted | Critical - Security |
| DEC-003: Zustand + SWR | ✅ Adopted | High - Architecture |
| DEC-004: Tailwind Custom Theme | ✅ Adopted | Medium - UX |
| DEC-005: SWR Type Cast | ✅ Adopted | Low - Build fix |
| DEC-006: Env Var Validation | ✅ Adopted | Medium - DX |
| DEC-007: API Route Structure | ✅ Adopted | High - Organization |

---

**Last Updated:** 2026-02-27  
**Maintained By:** @pepper (Analyst)
