# Day Tracker — Project Status

## Overview

A family mindfulness app where four users (Daddy, Mommy, Tabitha, Imogen) score their day (1–10) and enter three descriptive words. Includes Grafana dashboards for visualizing trends.

## Completed

### Phase 1: Project Scaffolding

- React + Vite + TypeScript frontend in `client/`
- Azure Functions (Node.js/TypeScript) backend in `api/`
- Root npm workspace with unified build/dev scripts
- `staticwebapp.config.json` for Azure Static Web Apps routing and auth
- `.gitignore` configured (excludes `node_modules`, `dist`, `local.settings.json`)
- Grafana `docker-compose.yml` in `infra/grafana/`

### Phase 2: Database & API

- Cosmos DB client helper (`api/src/cosmosClient.ts`)
- **POST `/api/entry`** — Create/upsert daily entry with validation:
  - Profile must be one of: daddy, mommy, tabitha, imogen
  - Date must be YYYY-MM-DD format
  - Score must be an integer 1–10
  - Exactly 3 non-empty words required
  - Document ID format (`profileId-date`) enforces one entry per profile per day
- **GET `/api/entry/{profileId}/{date}`** — Fetch entry for a profile on a given date
- **GET `/api/words/{profileId}`** — Fetch all unique past words for autocomplete suggestions
- **GET `/api/me`** — Auth check endpoint: returns user email if on allowlist, 403 if not

### Phase 3: Frontend Core

- **ProfileSelect** — 2x2 grid of family member cards + "View Insights" button
- **DayEntry** — Score slider with color-coded value (red/amber/green), 3 word inputs, loads existing entry on mount, shows confirmation after submission
- **WordInput** — Text input with dropdown autocomplete filtered from past words
- API client module (`client/src/api.ts`)
- Clean CSS with design tokens (CSS variables for colors, radius, shadows)

### Phase 4: Authentication

- **Phase 1 (complete):** Azure SWA built-in Microsoft (Entra ID) login required for all frontend routes
- Non-Microsoft auth providers (GitHub, Twitter) blocked via `staticwebapp.config.json`
- Unauthenticated users automatically redirected to `/.auth/login/aad`
- **Phase 2 (complete):** API endpoints require authentication and check user email against `ALLOWED_USERS` allowlist
- Shared `authHelper.ts` decodes SWA's `x-ms-client-principal` header and validates against allowlist
- Users not on the allowlist receive 403 Access Denied
- Frontend handles 401/403 gracefully (redirect to login or show error message)
- **Phase 3 (complete, Issue #37):** Frontend authorization gate
- `App.tsx` calls `/api/me` on load before rendering any content
- Unauthorized users see an "Access Denied" screen instead of the profile grid
- New `getMe.ts` Azure Function returns user email if on allowlist, 403 if not
- `DayEntry.tsx` no longer silently swallows 403 errors

### Phase 5: Deployment

- Azure Static Web App deployed and connected to GitHub
- Cosmos DB provisioned (serverless mode)
- Application settings configured (`COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`, `ALLOWED_USERS`)
- GitHub Actions workflow for CI/CD

### Phase 6: Interactive Dashboard

- Dashboard UI components fully built (Dashboard, ScoreChart, WordFrequencyChart, StatsCards)
- Analytics API endpoints deployed (`/api/analytics/entries`, `/api/analytics/word-frequency`, `/api/analytics/stats`)
- "View Insights" button on profile selection screen
- Date range presets (7d, 30d, 90d, all time) and profile filter

### Phase 7: Date Picker for Entry Submission (Issue #24)

- Users can submit entries for past dates (not just today)
- `<input type="date">` in the DayEntry header, defaults to today, max set to today
- Re-fetches entry data when selected date changes
- Shows existing entry in read-only view if already submitted

### Phase 8: Word Validation

- Words cannot contain spaces (stripped on input in WordInput, validated on backend)
- Duplicate words rejected in a single entry (frontend + backend validation)

### Phase 9: Codebase Documentation

- JSDoc file-level comments added to all 27 source files
- Function documentation, interface descriptions, and inline comments
- CSS files documented with section headers and selector group descriptions
- Covers API functions, client components, CSS stylesheets, and config files

### Phase 10: Tag-Based Versioning & Deployment (Issue #34)

- CI/CD now triggers **only on `v*` Git tag pushes** (not every push to `main`)
- Merging to `main` alone no longer triggers a deployment
- Version badge displays the Git tag name (e.g. "v1.4") instead of build run number
- Shows "dev" in local development
- Deleted unused root `deploy.yml`

### Build Verification

- All TypeScript compiles cleanly (both `client/` and `api/`)
- Full production build succeeds (`npm run build`)
- All dependencies installed (131 packages, 0 vulnerabilities)

### Release Tags

- `v1.0` — Auth removed, direct profile selection, dashboard working
- `v1.1` — Pre-auth baseline: date picker, dashboard, profile selection working
- `v1.2` — Auth phase 1: Microsoft login required for frontend routes
- `v1.3` — Auth phase 2: API allowlist and auth enforcement
- `v1.4` — Tag-based versioning and deployment, codebase documentation

## Deployment & Release Workflow

1. Develop on `develop` branch
2. Merge PR from `develop` → `main`
3. Tag the commit: `git tag -a v1.x -m "Description"`
4. Push the tag: `git push origin v1.x` → triggers CI/CD deployment
5. App displays the tag name (e.g. "v1.4") in the version badge

**Live URL**: `https://nice-meadow-0cb162303.1.azurestaticapps.net`

---

## File Structure

```
mindfulness/
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProfileSelect.tsx   # 2x2 profile grid
│   │   │   ├── ProfileSelect.css
│   │   │   ├── DayEntry.tsx        # Score + 3 words form
│   │   │   ├── DayEntry.css
│   │   │   ├── WordInput.tsx       # Autocomplete input
│   │   │   ├── WordInput.css
│   │   │   ├── Dashboard.tsx       # Analytics dashboard
│   │   │   ├── Dashboard.css
│   │   │   ├── ScoreChart.tsx      # Score line chart
│   │   │   ├── WordFrequencyChart.tsx # Word frequency bar chart
│   │   │   ├── StatsCards.tsx      # Summary stats
│   │   │   ├── StatsCards.css
│   │   │   ├── VersionBadge.tsx    # Version display
│   │   │   └── VersionBadge.css
│   │   ├── api.ts                  # API client (includes checkAccess for auth gate)
│   │   ├── App.tsx                 # Screen router (with frontend auth gate)
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   └── vite-env.d.ts
│   ├── public/
│   │   ├── favicon.svg             # App favicon
│   │   └── staticwebapp.config.json # SWA config (auth routes, provider blocks)
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── api/                            # Azure Functions backend
│   ├── src/
│   │   ├── functions/
│   │   │   ├── createEntry.ts      # POST /api/entry
│   │   │   ├── getEntry.ts         # GET /api/entry/:profileId/:date
│   │   │   ├── getWords.ts         # GET /api/words/:profileId
│   │   │   ├── getMe.ts                # GET /api/me — auth check endpoint
│   │   │   ├── getAnalyticsEntries.ts  # GET /api/analytics/entries
│   │   │   ├── getAnalyticsStats.ts    # GET /api/analytics/stats
│   │   │   └── getWordFrequency.ts     # GET /api/analytics/word-frequency
│   │   ├── authHelper.ts           # Allowlist check (decodes x-ms-client-principal)
│   │   └── cosmosClient.ts         # Cosmos DB connection
│   ├── host.json
│   ├── local.settings.json         # Local env vars (git-ignored)
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   └── workflows/
│       └── azure-static-web-apps-nice-meadow-0cb162303.yml  # CI/CD (tag-triggered)
├── infra/
│   └── grafana/
│       └── docker-compose.yml
├── .gitignore
└── package.json                    # Root workspace
```
