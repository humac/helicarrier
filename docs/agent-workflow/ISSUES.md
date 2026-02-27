# Helicarrier v3 - Issues Encountered & Resolved

This document tracks all issues encountered during the Helicarrier v3 project, their resolution status, and lessons learned.

---

## ISSUE-001: Tailwind Config .ts vs .js (Build Failure)

**Date Found:** 2026-02-27  
**Status:** ✅ RESOLVED  
**Severity:** High (Build Blocker)

### Description
Tailwind configuration was initially set up as `tailwind.config.ts` (TypeScript). This caused build failures because Next.js/Tailwind expected a `.js` file.

### Error Message
```
Error: Cannot find module 'tailwind.config.ts'
```

### Root Cause
Tailwind CSS v3.x expects configuration files to be CommonJS (`.js`), not TypeScript (`.ts`). While some setups support `.ts`, the standard Tailwind + Next.js setup requires `.js`.

### Resolution
Renamed `tailwind.config.ts` to `tailwind.config.js` and converted syntax:

**Before (.ts):**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

**After (.js):**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

### Verification
- `npm run build` passes successfully
- All pages compile without errors

### Lessons Learned
1. Always use `.js` for Tailwind config in Next.js projects
2. Check Tailwind docs for framework-specific setup instructions
3. Don't over-engineer config files - JS is sufficient

---

## ISSUE-002: React Hydration Crash (openclaw.ts Module-Level Throw)

**Date Found:** 2026-02-27  
**Status:** ✅ RESOLVED  
**Severity:** High (Runtime Crash)

### Description
The Gateway client (`src/lib/openclaw.ts`) validated environment variables at module load time with an immediate `throw`. This caused React hydration errors because the module was imported in server components that ran during initial page load.

### Error Message
```
Error: Missing GATEWAY_URL or GATEWAY_TOKEN environment variables
    at Object.<anonymous> (src/lib/openclaw.ts:10:7)
```

### Root Cause
Module-level validation throws before React can hydrate, causing a mismatch between server-rendered HTML and client-side React tree.

### Resolution
Moved environment variable validation from module-level to **function-level** in API routes:

**Before (Module-Level):**
```typescript
// src/lib/openclaw.ts
const GATEWAY_URL = process.env.GATEWAY_URL;
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

if (!GATEWAY_URL || !GATEWAY_TOKEN) {
  throw new Error('Missing GATEWAY_URL or GATEWAY_TOKEN');
}

export async function invokeGateway(...) { ... }
```

**After (Function-Level):**
```typescript
// src/lib/openclaw.ts
export async function invokeGateway(...) {
  const GATEWAY_URL = process.env.GATEWAY_URL;
  const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;
  
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    throw new Error('Missing GATEWAY_URL or GATEWAY_TOKEN');
  }
  
  // ... rest of function
}
```

### Verification
- Application starts without hydration errors
- Environment variables validated when actually used
- Error messages still clear and actionable

### Lessons Learned
1. Never throw at module load time in Next.js - causes hydration issues
2. Validate environment variables at the point of use
3. Consider using a validation helper that can be called on startup

---

## ISSUE-003: Gateway Tool Invocation 500 Error (UNRESOLVED)

**Date Found:** 2026-02-27  
**Status:** ⚠️ UNRESOLVED (Backend Bug)  
**Severity:** Medium (Gracefully Handled)

### Description
API endpoints `/api/history` and `/api/cron` return 500 Internal Server Error when calling the Gateway's `/tools/invoke` endpoint.

### Error Message
```
Gateway request failed: 500 Internal Server Error
```

### Root Cause
**Backend bug in OpenClaw Gateway.** The `/tools/invoke` endpoint has an issue that causes it to return 500 errors for certain tool/action combinations. This is NOT a Helicarrier application bug.

### Impact
- `/api/history` endpoint fails - session history page cannot load
- `/api/cron` endpoint fails - calendar page shows error state
- Application handles errors gracefully with fallback UI

### Workaround
Application implements defensive error handling:

```typescript
// API routes catch errors and return graceful fallback
export async function GET() {
  try {
    const data = await invokeGateway('healthcheck', 'cron');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Return error state instead of crashing
    return NextResponse.json(
      { success: false, error: { code: 'GATEWAY_ERROR', message: 'Failed to fetch' } },
      { status: 500 }
    );
  }
}
```

### Resolution Status
- **Application Level:** ✅ Handled gracefully with error states
- **Backend Level:** ❌ UNRESOLVED - requires Gateway team to fix

### Next Steps
1. Report bug to OpenClaw Gateway team
2. Monitor for backend fix
3. Application will work automatically once backend is fixed

### Lessons Learned
1. Always implement defensive error handling for external API calls
2. Graceful degradation is better than crashing
3. Distinguish between application bugs and external dependency bugs

---

## ISSUE-004: Fake QA Verification (Peter/Heimdall Skipped Browser Testing)

**Date Found:** 2026-02-27  
**Status:** ✅ RESOLVED  
**Severity:** High (Process Failure)

### Description
Initial QA sign-off was based on **code review only** - no actual browser testing was performed. Peter and Heimdall both marked QA as "complete" without verifying that pages actually rendered in a browser.

### Discovery
During Pepper closeout, it was discovered that:
- No screenshots were captured
- No browser console checks were performed
- QA.md checklist was marked complete without runtime verification

### Root Cause
1. **Process gap:** QA checklist didn't explicitly require browser screenshots
2. **Assumption:** Team assumed code review = QA
3. **Time pressure:** Rushed to complete pipeline

### Resolution
Heimdall performed **legitimate browser QA** on 2026-02-27 14:23 UTC:

**Verification Performed:**
- ✅ Opened all 4 pages in browser (`/`, `/feed`, `/calendar`, `/search`)
- ✅ Captured screenshots for each page (4 total)
- ✅ Checked browser console for errors (0 critical errors)
- ✅ Verified UI renders correctly (dark theme, sidebar, navigation)
- ✅ Tested API endpoints live (`/api/status`, `/api/sessions`)

**Screenshots Captured:**
- Home: `/home/openclaw/.openclaw/media/browser/ea933172-...png`
- Feed: `/home/openclaw/.openclaw/media/browser/764ede5a-...png`
- Calendar: `/home/openclaw/.openclaw/media/browser/bf641506-...png`
- Search: `/home/openclaw/.openclaw/media/browser/5c2ddc34-...png`

### Process Improvement
Updated QA.md checklist to require:
1. Browser screenshots for EVERY page
2. Console error check (must be empty or expected only)
3. Live API endpoint tests
4. Visual verification of UI elements

### Lessons Learned
1. **Code review ≠ QA** - Must verify actual runtime behavior
2. **Screenshot proof required** - No QA sign-off without visual evidence
3. **Browser testing is mandatory** - Not optional
4. **Process enforcement** - Checklists must be followed, not just checked

---

## Summary Table

| Issue | Status | Severity | Resolution Date |
|-------|--------|----------|-----------------|
| ISSUE-001: Tailwind .ts config | ✅ Resolved | High | 2026-02-27 |
| ISSUE-002: Hydration crash | ✅ Resolved | High | 2026-02-27 |
| ISSUE-003: Gateway 500 error | ⚠️ Unresolved (backend) | Medium | N/A |
| ISSUE-004: Fake QA | ✅ Resolved | High | 2026-02-27 |

---

## Open Issues

| Issue | Owner | Blocker |
|-------|-------|---------|
| ISSUE-003: Gateway 500 error | Gateway Team | Backend bug in /tools/invoke |

---

**Last Updated:** 2026-02-27  
**Maintained By:** @pepper (Analyst)
