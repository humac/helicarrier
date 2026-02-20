# [Project Name]

## 1. Project Overview
**What problem are we solving?**
[Brief description of the core problem, user, and value proposition.]

**Scope**
- **In Scope**: ...
- **Out of Scope**: ...

## 2. Architecture
### System Design
[Link to ARCH.md or brief description of components]

### Tech Stack
- **Language**: Node.js / Python / ...
- **Frameworks**: ...
- **Database**: ...
- **Tools**: ...

### Key Decisions
- [Decision 1]: [Reason]

## 3. Getting Started
### Prerequisites
- Node.js v22+ / Python 3.10+
- Docker (optional)
- Access to ...

### Installation
```bash
git clone ...
cd ...
npm install / pip install -r requirements.txt
```

### Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
| Variable | Description | Required? |
|----------|-------------|-----------|
| API_KEY  | ...         | Yes       |

### Running Locally
```bash
npm start / python main.py
```

## 4. Development Workflow
**Directives**
- **Tests**: All new features must have unit tests.
- **Linting**: Code must pass `npm run lint`.
- **Commits**: Conventional Commits (feat: ..., fix: ...).

**Quality Gates**
Before merging/releasing:
1. Unit tests pass (`npm test`).
2. Integration checks pass.
3. `QA.md` updated with verification evidence.
4. Docs (`README`, `API.md`) updated.

## 5. Testing
```bash
npm test
```

## 6. Deployment
[Instructions for deploying to prod/staging]

## 7. Status & Roadmap
- **Current Phase**: ...
- **Roadmap**: See `ROADMAP.md`
- **Known Issues**: See `ISSUES.md`
