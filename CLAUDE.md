# CLAUDE.md (AI Helper)

## Purpose
Guidance for AI assistants contributing to this repository.

## Rules
1. Keep architecture aligned with `ARCH.md` and priorities in `TASKS.md`.
2. Never hardcode secrets; use `.env.local` / `.env` and `.env.example` patterns.
3. Preserve the Stark HUD visual language (dark, glass, clean spacing).
4. Keep API security intact (`x-secret-key` checks on sensitive routes).
5. Add or update tests for any changed behavior.

## Coding conventions
- Components: PascalCase
- Variables/functions: camelCase
- Interfaces/types: IPascalCase for interfaces
- Keep modules focused and small

## Quality gate before completion
- Tony's acceptance criteria are implemented.
- Peter-authored unit tests exist for changed behavior and `npm test` passes.
- Heimdall integration/security audit passes (or risks are explicitly accepted).
- `npm run lint` passes.
- No secret leakage to client unless explicitly accepted for MVP.
- Update docs (`README.md`, `ISSUES.md`, `ROADMAP.md`) when relevant.
