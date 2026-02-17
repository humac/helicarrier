# GEMINI.md (Project helper)

## Product Goal
Helicarrier should provide reliable operational visibility and control for agent activity.

## Functional Focus
- Live activity/status visibility
- Resource and usage reporting
- Assignment/reassignment workflows
- Safe control actions (terminate/restart/inject task)

## Architectural Guidance
- Prefer server-side aggregation for sensitive data
- Use explicit source-of-truth for status (avoid fragile heuristics when possible)
- Keep fallback strategies documented in `ISSUES.md`

## Security Guidance
- Enforce authentication/authorization checks on internal APIs
- Minimize exposed attack surface
- Use least privilege for host mounts and runtime permissions

## Delivery Checklist
- Feature implemented
- Unit tests added/updated and passing
- Integration/security checks captured in `QA.md`
- Docs updated to reflect behavior
- New blockers added to `ISSUES.md`
