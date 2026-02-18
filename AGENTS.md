# AGENTS.md (Project-specific workflow)

This file defines delivery workflow for **Helicarrier only**.

## Scope
- Repository architecture and implementation flow
- Test/security gates for this project
- Handoff criteria between design, build, and QA

## Delivery Flow
1. Pepper requirements + issue hygiene (`REQ.md`, `ISSUES.md`)
2. Tony architecture/design updates (`ARCH.md`, `TASKS.md`)
3. Peter implementation in `web/` + unit tests for changed behavior
4. Heimdall integration + security QA in `QA.md`
5. Pepper closeout docs + release packaging

Chain notation: **Pepper -> Tony -> Peter -> Heimdall -> Pepper**.
If QA finds issues, loop back through **Tony -> Peter -> Heimdall** until pass.
At every handoff, send a short progress notification (informational; continue unless blocked).

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
