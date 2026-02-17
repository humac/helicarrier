# CLAUDE.md (Project helper)

## Project Context
Helicarrier is a Mission Control dashboard for OpenClaw operations.

## Implementation Priorities
1. Correctness of status/telemetry display
2. Security of API routes and secrets handling
3. Clear operator UX (readability + responsiveness)
4. Maintainability (small modules, test coverage)

## Coding Standards
- TypeScript strict mode
- Components: PascalCase
- Variables/functions: camelCase
- Interfaces: `IPascalCase`
- Keep business logic out of presentational components

## Security Rules
- Never hardcode secrets
- Use `.env.local` / `.env` + `.env.example`
- Protect sensitive API routes (header/session checks)
- Treat client-exposed env vars as non-secret

## Test Requirements
- Add/update unit tests for any changed behavior
- Keep route logic testable and covered
- Run before completion:
  - `npm test`
  - `npm run lint`

## Documentation Requirements
When behavior changes, update relevant docs:
- `README.md`
- `ARCH.md`
- `TASKS.md`
- `QA.md`
- `ISSUES.md` / `ROADMAP.md` (if planning/debt changed)
