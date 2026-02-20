# TASKS.md

## Workflow Rules
- Delivery chain: **Design -> Implementation -> QA -> Closeout**.
- If QA fails, loop: **Design -> Implementation -> QA** until pass.
- **Blocker Rule**: Any QA blocker must be tracked in a GitHub issue before the fix loop starts.
- **Auto-Loop Rule**: On blocker, enforce the loop automatically (no user prompt required).
- **Handoff Notification Rule**: Send a short progress notification at each phase transition.
- **Evidence Rule**: Blocker issue link must be recorded in `QA.md` and release report before closeout.

## Sprint Plan

### Design / Architecture
- [ ] Architecture updated
- [ ] Acceptance criteria explicit

### Implementation + Unit Tests
- [ ] Implement feature
- [ ] Add/update unit tests
- [ ] `npm test` / equivalent passes

### Integration + Security QA
- [ ] Integration checks
- [ ] Security checks
- [ ] QA evidence captured
- [ ] PASS/FAIL decision documented in `QA.md`
- [ ] If FAIL, blocker GitHub issue link added to `QA.md` before loopback

### Documentation + Closeout
- [ ] README updated
- [ ] Issues/Roadmap updated
- [ ] Release report generated
- [ ] Blocker issue links (if any) included in release report
