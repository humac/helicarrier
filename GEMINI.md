# GEMINI.md (AI Helper)

## Mission context
Helicarrier is a command HUD for OpenClaw operations. Priorities:
1. Reliability
2. Security
3. Operator clarity

## Feature focus
- Agent activity monitoring
- Usage visibility (cost/runtime)
- Assignment and reassignment workflows
- Safe operator actions (kill/restart/inject)

## Implementation guidance
- Prefer incremental changes with clear acceptance criteria.
- For ambiguous APIs, add fallback + issue entry in `ISSUES.md`.
- Keep roadmap progression in `ROADMAP.md` (V2 Command, V3 Intelligence, V4 Autonomy).

## Security posture
- API route protection required.
- Avoid exposing privileged tokens client-side in non-MVP phases.
- Default to least privilege and read-only host mounts where possible.

## Delivery checklist
- Code implemented
- Tests added/updated
- Docs updated
- Risks noted in `QA.md` or `ISSUES.md`
