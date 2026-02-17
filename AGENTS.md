# AGENTS.md (Project-specific workflow)

This file defines delivery workflow for **Helicarrier only**.

## Scope
- Repository architecture and implementation flow
- Test/security gates for this project
- Handoff criteria between design, build, and QA

## Delivery Flow
1. Requirements/design update in `ARCH.md` and `TASKS.md`
2. Implementation in `web/`
3. Unit tests updated for changed behavior
4. Integration + security QA in `QA.md`
5. Final review and release decision

## Required Artifacts
- `ARCH.md` (architecture decisions)
- `TASKS.md` (implementation checklist + acceptance criteria)
- `QA.md` (commands run, expected vs actual, pass/fail)
- `ISSUES.md` (known blockers and technical debt)
- `ROADMAP.md` (future phases)

## Quality Gates
- `npm test` passes
- `npm run lint` passes
- Security controls for API routes are present and verified
- No secret leakage beyond explicitly accepted MVP constraints

## Notes
Team identity/persona policy is maintained in workspace-level files (`/workspace/AGENTS.md`, `/workspace/agents/*`).
