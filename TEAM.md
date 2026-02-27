# TEAM.md - Agent Roster & Routing

## Roster

### Jarvis (Coordinator)
- **Role**: CTO / Orchestrator
- **Responsibility**: Intake, delegation, review, final signoff
- **Model**: `ollama/qwen3.5:397b-cloud` (configured in openclaw.json)

### @tony (Architect)
- **Role**: Lead Designer / Architect
- **Responsibility**: System design, UI/UX patterns, ARCH.md, TASKS.md
- **Primary**: `ollama/kimi-k2.5:cloud` — Multimodal visual reasoning
- **Backup**: `ollama/qwen3.5:35b-cloud` — Balanced architecture & code

### @peter (Developer)
- **Role**: Technical Execution
- **Responsibility**: Implementation, testing, refactoring, bug fixes
- **Primary**: `ollama/qwen3-coder-next:cloud` — Specialized coding model (80B)
- **Backup**: `ollama/devstral-2:123b-cloud` — Complex multi-file refactoring

### @heimdall (QA)
- **Role**: The Sentry / QA
- **Responsibility**: Security audit, testing, validation, runtime verification
- **Primary**: `ollama/glm-5:cloud` — Deep systems analysis & security
- **Backup**: `ollama/kimi-k2.5:cloud` — Thinking mode for edge cases

### @pepper (Analyst)
- **Role**: Operations Analyst
- **Responsibility**: Requirements (REQ.md), Documentation, Final reporting, Cleanup
- **Primary**: `ollama/qwen3.5:397b-cloud` — Most reliable for file ops
- **Backup**: `ollama/glm-5:cloud` — Strong reasoning, proven reliable
- **Note**: Changed 2026-02-27 from gpt-oss:120b-cloud due to malformed output paths

---

## Workflow (Mandatory)

```
Jarvis Intake → Pepper (Reqs) → Tony (Design) → Peter (Build) → Heimdall (QA)
                                                              ↓
                                                          PASS? → Jarvis Review → Pepper Closeout → DONE
                                                              ↓
                                                          FAIL? → Back to Tony/Peter
```

## Key Rules

1. **Never skip Heimdall** — Peter "done" ≠ actually done
2. **Completion footer on EVERY message** — Model, tokens, runtime, session key
3. **Max 3 active subagents** — Cloud models have no VRAM limits
4. **Autonomous handoffs** — No waiting for user approval between phases
5. **Heimdall must verify**: build passes, runtime healthy, visual UI check via browser

---

## Model Fallback Policy

| Trigger | Action |
|---------|--------|
| Primary fails 2x in a row | Switch to backup |
| Contradictory output | Switch to backup |
| Can't resolve after 2 iterations | Switch to backup |
| Subagent startup fails (0s) | Retry once, then fallback |

Log all failures in `.openclaw/logs/ROUTING.md`

---

## Completion Footer Format (Every Subagent Message)

```markdown
## ✅ [Agent] [Task] Complete

| Metric | Value |
|--------|-------|
| **Session Key** | agent:jarvis:subagent:xxx |
| **Model Used** | ollama/xxx:cloud |
| **Tokens** | Xk in / Yk out |
| **Runtime** | X minutes |
| **Deliverables** | Files created |
| **Acceptance** | ✅/❌ |

**Next**: [Heimdall QA / Next Phase]
```
