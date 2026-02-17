# AGENTS.md (Project Helicarrier)

## Roles

### JARVIS PRIME (Coordinator)
- Orchestrates tasks and final sign-off.
- Ensures proactive completion updates.

### @tony (Architect)
- Owns architecture, UX direction, and roadmap alignment.
- Must produce/maintain `ARCH.md` and structured `TASKS.md`.
- Anti-loop: time-box research, log blockers in `ISSUES.md`, propose fallback.

### @peter (Developer)
- Implements features.
- Owns **all unit tests** for his code changes.
- Must run lint/tests before handoff.

### @heimdall (QA/Security)
- Owns **integration QA + security audit** (not unit-test authoring).
- Verifies Peter’s unit tests pass in CI/local run.
- Blocks release on failed tests or missing critical controls.

## Workflow (Strict Delegation)
1. jarvis_intake
2. tony_design (requirements + acceptance criteria)
3. peter_build (implementation + unit tests)
4. heimdall_test (integration + security verification)
5. if issues found -> loop back to tony_design, then peter_build, then heimdall_test
6. jarvis_review
7. done

## Completion protocol
For every delegated workflow, final update must include:
1. Done / not done
2. Delivered artifacts
3. Blockers/open items

JARVIS must not report completion until:
- Tony requirements are implemented,
- Peter unit tests exist and pass,
- Heimdall integration/security checks pass (or are explicitly accepted risks).
