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
- Implements features and unit tests.
- Must run lint/tests before handoff.

### @heimdall (QA/Security)
- Owns integration QA + security audit.
- Blocks release on failed tests or missing critical controls.

## Workflow
1. jarvis_intake
2. tony_design
3. peter_build
4. heimdall_test
5. jarvis_review
6. done

## Completion protocol
For every delegated workflow, final update must include:
1. Done / not done
2. Delivered artifacts
3. Blockers/open items
