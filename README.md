# Helicarrier v3

**Real-time Mission Control Dashboard for OpenClaw Agent Operations**

## Overview

Helicarrier v3 is a real-time mission control dashboard for monitoring and managing OpenClaw agent operations. It provides a centralized interface for viewing activity feeds, managing cron jobs, searching message history, and monitoring agent status.

**Version:** 3.0.0  
**Status:** ✅ Production Ready  
**Build Date:** 2026-02-27

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Framework** | Next.js 14.2.21 | App Router, Server Components, API Routes |
| **Language** | TypeScript 5.7.2 | Type safety and developer experience |
| **Styling** | Tailwind CSS 3.4.15 | Utility-first CSS framework |
| **State Management** | Zustand 5.0.2 | Client-side state management |
| **Server State** | SWR 2.3.0 | Data fetching with caching and revalidation |
| **Icons** | Lucide React 0.468.0 | Consistent icon library |
| **Date Handling** | date-fns 4.1.0 | Lightweight date formatting |
| **React** | 18.3.1 | UI library |

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenClaw Gateway access (URL + token)

### Installation

```bash
# Clone the repository
cd projects/helicarrier

# Install dependencies
npm install

# Copy environment example and configure
cp .env.example .env.local

# Edit .env.local with your Gateway credentials
# GATEWAY_URL=http://localhost:8080
# GATEWAY_TOKEN=your-secret-token-here
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build

```bash
# Create production build
npm run build

# Verify build artifacts in .next/
```

### Run Production

```bash
# Start production server
npm run start
```

### Type Check

```bash
# Run TypeScript type checking
npm run type-check
```

### Lint

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
projects/helicarrier/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes (server-side only)
│   │   │   ├── feed/           # Feed data endpoint
│   │   │   ├── calendar/       # Calendar/cron jobs endpoint
│   │   │   ├── search/         # Search endpoint
│   │   │   └── sessions/       # Sessions endpoint
│   │   ├── feed/               # Activity Feed page
│   │   ├── calendar/           # Calendar/Cron page
│   │   ├── search/             # Global Search page
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Home (redirects to /feed)
│   ├── components/
│   │   ├── ui/                 # Base UI primitives
│   │   ├── layout/             # Layout components (Nav, AgentBanner)
│   │   └── features/           # Feature-specific components
│   ├── lib/
│   │   ├── openclaw.ts         # Gateway client (server-side)
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── utils.ts            # Utility functions
│   │   └── providers.tsx       # React providers (SWR, etc.)
│   ├── hooks/                  # Custom React hooks
│   └── store/                  # Zustand stores
├── .env.local                  # Environment variables (gitignored)
├── .env.example                # Example env file
├── ARCH.md                     # System architecture documentation
├── REQ.md                      # Requirements specification
├── TASKS.md                    # Task breakdown and status
├── QA.md                       # QA checklist and results
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Deployment Notes

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GATEWAY_URL` | Yes | OpenClaw Gateway API URL |
| `GATEWAY_TOKEN` | Yes | Bearer token for Gateway authentication |

### Security Considerations

- **NEVER** expose `GATEWAY_TOKEN` to the client-side
- Token is only used in server-side API routes
- All Gateway communication happens through Next.js API route proxy
- Environment variables are validated on startup

### Deployment Options

1. **Standalone Mode** (Recommended)
   ```bash
   npm run build
   # Output: .next/standalone/
   # Deploy the standalone folder to your server
   ```

2. **Docker Deployment**
   - Use Next.js standalone output
   - Configure environment variables in container
   - Expose port 3000

3. **Vercel/Netlify**
   - Push to Git repository
   - Configure environment variables in platform
   - Automatic builds on push

### Production Checklist

- [ ] Set `GATEWAY_URL` to production Gateway endpoint
- [ ] Rotate `GATEWAY_TOKEN` for production
- [ ] Enable HTTPS
- [ ] Configure CORS if needed
- [ ] Set up monitoring and logging
- [ ] Test all API endpoints
- [ ] Verify error handling

## Features

### Activity Feed (`/feed`)
- Real-time message feed from OpenClaw Gateway
- Filter by agent, tool, date range
- Infinite scroll with pagination
- Auto-refresh every 5 seconds
- Expandable message details

### Calendar (`/calendar`)
- View scheduled cron jobs
- Enable/disable jobs with one click
- Manual job trigger
- Job execution history
- Monthly calendar view

### Search (`/search`)
- Global search across all messages
- Filter by channel, agent, date, type
- Search result highlighting
- Export results (JSON/CSV)
- Conversation grouping

### Agent Status Banner
- Real-time agent status (online/busy/offline)
- Statistics: messages sent, active sub-agents, uptime
- Capability badges
- Auto-refresh

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/feed` | GET | Fetch activity feed messages |
| `/api/calendar` | GET | Fetch cron jobs |
| `/api/calendar/:id/toggle` | POST | Enable/disable job |
| `/api/calendar/:id/trigger` | POST | Manual job trigger |
| `/api/search` | GET | Search messages |
| `/api/sessions` | GET | List active sessions |
| `/api/history` | GET | Fetch session history |

## Screenshots

> _Screenshots section - placeholders for future additions_

- Feed Page: `[TBD]`
- Calendar Page: `[TBD]`
- Search Page: `[TBD]`
- Agent Banner: `[TBD]`

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Gateway Connection Errors

- Verify `GATEWAY_URL` is correct and accessible
- Check `GATEWAY_TOKEN` is valid
- Ensure Gateway service is running
- Check network/firewall settings

### TypeScript Errors

```bash
# Run type check to see detailed errors
npm run type-check
```

## Contributing

1. Follow the architecture in `ARCH.md`
2. Update `TASKS.md` with progress
3. Run QA checks before merging
4. Document decisions in `DECISIONS.md`

## License

Internal project - OpenClaw Workspace

---

**Last Updated:** 2026-02-27  
**Maintained By:** @pepper (Analyst)
