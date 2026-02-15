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

### Phase 3: Frontend Core

- **ProfileSelect** — 2x2 grid of family member cards + "View Insights" button
- **DayEntry** — Score slider with color-coded value (red/amber/green), 3 word inputs, loads existing entry on mount, shows confirmation after submission
- **WordInput** — Text input with dropdown autocomplete filtered from past words
- API client module (`client/src/api.ts`)
- Clean CSS with design tokens (CSS variables for colors, radius, shadows)

### Phase 4: Authentication

- **Removed** — authentication was stripped out in favour of direct profile selection
- The app opens straight to the profile picker with no login required
- API endpoints are open (no token validation)

### Build Verification

- All TypeScript compiles cleanly (both `client/` and `api/`)
- Full production build succeeds (`npm run build`)
- All dependencies installed (131 packages, 0 vulnerabilities)

### Release Tags

- `v1.0` — Auth removed, direct profile selection, dashboard working (tagged on `main`)

## Remaining

### Phase 5: Deploy

#### 5.1 — Initialize Git & GitHub

1. Run `git init` in the project root
2. Run `git add .` then `git commit -m "Initial commit"`
3. Create a new GitHub repository (e.g. `day-tracker`)
4. Run `git remote add origin https://github.com/<your-username>/day-tracker.git`
5. Run `git push -u origin main`

#### 5.2 — Provision Cosmos DB

1. Go to the [Azure Portal](https://portal.azure.com) → **Create a resource** → search **Azure Cosmos DB**
2. Select **Azure Cosmos DB for NoSQL** and click **Create**
3. Fill in:
   - **Subscription**: your subscription
   - **Resource Group**: create new (e.g. `daytracker-rg`)
   - **Account Name**: e.g. `daytracker-cosmos`
   - **Capacity mode**: select **Serverless** (free-tier eligible, no provisioned throughput needed)
4. Click **Review + Create** → **Create** and wait for deployment
5. Once deployed, go to the Cosmos DB account → **Data Explorer**
6. Click **New Database** → name it `daytracker`
7. Inside the database, click **New Container**:
   - **Container id**: `entries`
   - **Partition key**: `/profileId`
8. Go to **Keys** in the left sidebar and copy:
   - **URI** → this is your `COSMOS_ENDPOINT`
   - **PRIMARY KEY** → this is your `COSMOS_KEY`

#### 5.3 — Create Azure Static Web App

1. Go to Azure Portal → **Create a resource** → search **Static Web App**
2. Click **Create** and fill in:
   - **Resource Group**: `daytracker-rg` (same as above)
   - **Name**: e.g. `daytracker-app`
   - **Plan type**: **Free**
   - **Source**: **GitHub** → authorize and select your repo/branch
3. In the **Build Details** section:
   - **Build Preset**: Custom
   - **App location**: `/client`
   - **Api location**: `/api`
   - **Output location**: `dist`
4. Click **Review + Create** → **Create**
5. Azure will automatically add a GitHub Actions workflow file to your repo

#### 5.4 — Configure Application Settings

1. Go to your Static Web App in the Azure Portal → **Configuration** (under Settings)
2. Add the following **Application settings**:

   | Name | Value |
   |------|-------|
   | `COSMOS_ENDPOINT` | The URI copied from Cosmos DB Keys |
   | `COSMOS_KEY` | The primary key copied from Cosmos DB Keys |
   | `COSMOS_DATABASE` | `daytracker` |

3. Click **Save**

#### 5.5 — Test End-to-End

1. Push your changes to GitHub — the GitHub Action will auto-deploy
2. Visit your SWA URL (e.g. `https://<your-app-name>.azurestaticapps.net`)
3. Verify:
   - [ ] Profile selection screen shows immediately on load
   - [ ] Submitting a day entry succeeds (check Cosmos DB Data Explorer to confirm)
   - [ ] Returning to the same profile on the same day loads the existing entry
   - [ ] Submitting again upserts (updates) the same entry

---

### Phase 6: Interactive Dashboard

- ✅ Dashboard UI components fully built (Dashboard, ScoreChart, WordFrequencyChart, StatsCards)
- ✅ Analytics API endpoints deployed (`/api/analytics/entries`, `/api/analytics/word-frequency`, `/api/analytics/stats`)
- ✅ JWT authentication blocker resolved by removing auth entirely
- ✅ "View Insights" button on profile selection screen

### Phase 7: Date Picker for Entry Submission (Issue #24)

**Goal:** Allow users to submit entries for past dates they may have missed, rather than being limited to today only.

**Changes — Frontend only (`client/src/components/DayEntry.tsx` and `DayEntry.css`):**

1. **Add date state and date picker input**
   - Replace the hardcoded `getToday()` date with a `useState` defaulting to today
   - Add an `<input type="date">` to the entry page header
   - Set `max` attribute to today's date to prevent future date selection

2. **Re-fetch entry when date changes**
   - Update the `useEffect` to trigger when the selected date changes
   - If an entry exists for the selected date, display it in the existing read-only confirmation view
   - If no entry exists, reset the form to allow a new submission

3. **Use selected date on submit**
   - Pass the selected date (instead of hardcoded today) to the `submitEntry` API call

**No backend changes required** — the API already accepts any valid `YYYY-MM-DD` date and the existing `fetchEntry` endpoint supports fetching by arbitrary date.

**Acceptance Criteria Mapping:**

| Acceptance Criterion | Addressed By |
|---|---|
| The submit an entry page should contain a date picker | Change #1 — `<input type="date">` added to the page |
| The value selected in this date picker will be used when the entry is submitted | Change #3 — selected date passed to `submitEntry` |
| If the selected date already has an entry submitted for that profile, then we should show what was submitted | Change #2 — existing entry loaded and shown in read-only view |
| The date picker should always default to today's date | Change #1 — `useState` initialised with `getToday()` |
| The user should never be able to select a date in the future | Change #1 — `max` attribute set to today's date |

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
│   │   │   ├── VersionBadge.tsx    # Version display
│   │   │   └── VersionBadge.css
│   │   ├── api.ts                  # API client
│   │   ├── App.tsx                 # Screen router
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   └── vite-env.d.ts
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
│   │   │   ├── getAnalyticsEntries.ts  # GET /api/analytics/entries
│   │   │   ├── getAnalyticsStats.ts    # GET /api/analytics/stats
│   │   │   └── getWordFrequency.ts     # GET /api/analytics/word-frequency
│   │   └── cosmosClient.ts         # Cosmos DB connection
│   ├── host.json
│   ├── local.settings.json         # Local env vars (git-ignored)
│   ├── package.json
│   └── tsconfig.json
├── infra/
│   └── grafana/
│       └── docker-compose.yml
├── staticwebapp.config.json
├── .gitignore
└── package.json                    # Root workspace
```
