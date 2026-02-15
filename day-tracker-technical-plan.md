# Day Tracker — Technical Plan

## Context

Building the Day Tracker app described in `day-tracker-idea.md`: a family mindfulness tool where four users score their day (1-10) and enter three descriptive words. The app includes Grafana dashboards for visualizing trends. This plan covers the full technical architecture and implementation order.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + TypeScript |
| Backend | Azure Functions (Node.js/TypeScript) |
| Database | Azure Cosmos DB (NoSQL, free tier) |
| Auth | None (open access, profile-based identity) |
| Hosting | Azure Static Web Apps (free tier, includes Azure Functions) |
| CI/CD | GitHub → Azure Static Web Apps (built-in) |

## Project Structure

```
mindfulness/
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProfileSelect.tsx   # 2x2 grid + dashboard button
│   │   │   ├── ProfileSelect.css
│   │   │   ├── DayEntry.tsx        # Score + 3 words form
│   │   │   ├── DayEntry.css
│   │   │   ├── WordInput.tsx       # Autocomplete input
│   │   │   ├── WordInput.css
│   │   │   ├── VersionBadge.tsx    # Version number display
│   │   │   └── VersionBadge.css
│   │   ├── api.ts                  # API client
│   │   ├── App.tsx                 # Main router
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   └── vite-env.d.ts           # TypeScript declarations
│   ├── public/
│   │   └── favicon.svg             # App favicon
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts              # Vite config with version injection
├── api/                            # Azure Functions backend
│   ├── src/
│   │   ├── functions/
│   │   │   ├── getEntry.ts         # GET entry for profile/date
│   │   │   ├── createEntry.ts      # POST new daily entry
│   │   │   └── getWords.ts         # GET word history for autocomplete
│   │   ├── getAnalyticsEntries.ts   # GET analytics entries
│   │   │   ├── getAnalyticsStats.ts    # GET analytics stats
│   │   │   └── getWordFrequency.ts     # GET word frequency
│   │   └── cosmosClient.ts         # Cosmos DB connection
│   ├── host.json
│   ├── local.settings.json         # Local env vars (gitignored)
│   ├── package.json
│   └── tsconfig.json
├── infra/                          # Azure infrastructure config
│   └── grafana/
│       └── docker-compose.yml      # Grafana container setup
├── .github/
│   └── workflows/
│       └── azure-static-web-apps-*.yml  # CI/CD with version injection
├── staticwebapp.config.json        # SWA config with auth and routing
├── .gitignore
└── package.json                    # Root workspace
```

## Database Design (Cosmos DB)

**Database:** `daytracker`

**Container:** `entries`
- Partition key: `/profileId`
- Each document:
```json
{
  "id": "daddy-2026-02-14",
  "profileId": "daddy",
  "date": "2026-02-14",
  "score": 7,
  "words": ["productive", "sunny", "grateful"],
  "createdAt": "2026-02-14T20:30:00Z"
}
```

The `id` format (`profileId-date`) enforces one entry per profile per day naturally — an upsert or conflict on the same ID prevents duplicates.

## API Endpoints (Azure Functions)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/entry/{profileId}/{date}` | Get entry for a profile on a date |
| POST | `/api/entry` | Create a new daily entry |
| GET | `/api/words/{profileId}` | Get all unique past words for autocomplete |
| GET | `/api/analytics/entries?startDate={date}&endDate={date}&profileId={id}` | Get entries for date range, optionally filtered by profile |
| GET | `/api/analytics/word-frequency?startDate={date}&endDate={date}&profileId={id}` | Get word frequency counts for date range |
| GET | `/api/analytics/stats?startDate={date}&endDate={date}` | Get summary statistics (avg scores per profile) |

## App Flow

No authentication — the app opens directly to profile selection:

1. User visits the app and sees the profile picker (Daddy, Mommy, Tabitha, Imogen)
2. Profile selection is trust-based within the family — no passwords
3. Selecting a profile takes the user to their daily entry screen
4. API endpoints are open (no token validation)

**Environment Variables:**
- `BUILD_NUMBER` (Client build): GitHub Actions run number for version badge
- `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE` (API): Cosmos DB connection

## Interactive Dashboard

Built-in analytics dashboard using **Recharts** (React charting library):

**Frontend Components:**
- `Dashboard.tsx` — Main dashboard page with charts and filters
- `DateRangePicker.tsx` — Date range selector component
- `ScoreChart.tsx` — Line chart showing scores over time
- `WordFrequencyChart.tsx` — Bar chart of word usage
- `StatsCards.tsx` — Summary statistics display
- `EntriesTable.tsx` — Paginated table of entries

**Date Filtering:**
- Preset ranges: "Last 7 days", "Last 30 days", "Last 90 days", "All time"
- Custom date picker for specific date ranges
- Profile filter to show one person or all
- All filters update charts in real-time

**API Integration:**
- Three new analytics endpoints for aggregated data
- All endpoints support date range and profile filtering
- Data cached on frontend for smooth interactions

## Implementation Order

### Phase 1: Project scaffolding
- Initialize React app with Vite + TypeScript in `client/`
- Initialize Azure Functions project in `api/`
- Set up root workspace with scripts
- Configure `staticwebapp.config.json`

### Phase 2: Database & API
- Set up Cosmos DB (database + container)
- Implement `createEntry` function
- Implement `getEntry` function
- Implement `getWords` function
- Add input validation (score 1-10, exactly 3 words)

### Phase 3: Frontend core
- Build `DayEntry` component (score slider/input + 3 word inputs)
- Build `WordInput` component with autocomplete
- Build `ProfileSelect` component (2x2 grid + dashboard button)
- Wire up API calls

### Phase 4: Authentication
- **Removed** — authentication was stripped out in favour of direct profile selection
- The app opens straight to the profile picker with no login required
- API endpoints are open (no token validation)

### Phase 5: Deploy
- Create Azure Static Web App resource
- Connect GitHub repo for CI/CD (auto-generated workflow)
- Provision Cosmos DB in Azure (serverless mode)
- Set Azure app settings: `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`
- Update GitHub workflow to inject `BUILD_NUMBER` at build time
- Add `api_build_command: "npm run build"` to workflow to compile TypeScript
- Test end-to-end in production
- Verify profile selection loads on first visit

### Phase 7: Version Display (Added)
- Create `VersionBadge` component showing version in top-right corner
- Configure Vite to inject `__APP_VERSION__` from `BUILD_NUMBER` env var
- GitHub Actions run number auto-increments on each deployment
- Shows "vdev" in local development

### Phase 8: Word Validation (Added)
- Prevent spaces in word input fields
- Validate no duplicate words in a single entry
- Add frontend validation in WordInput and DayEntry components
- Add backend validation in createEntry function

### Phase 6: Interactive Dashboard
- Install Recharts library (`npm install recharts`)
- Create analytics API endpoints (entries, word-frequency, stats)
- Build Dashboard component with date range controls
- Implement ScoreChart (line chart), WordFrequencyChart (bar chart)
- Add StatsCards for summary metrics (avg scores per profile)
- Create EntriesTable for browsing past entries
- Add "View Insights" button in ProfileSelect
- Add navigation to Dashboard page in App.tsx

## Deployment & Git Workflow

- **Repo**: `tomwazo/daytracker` on GitHub
- **Branches**:
  - `main` — production deployments (triggers SWA CI/CD)
  - `develop` — active development branch
- **Workflow**: Push to `develop`, merge to `main` via PR to deploy
- **Live URL**: `https://nice-meadow-0cb162303.1.azurestaticapps.net`

## Verification

- **Local dev**: Run `swa start` to test frontend + functions together locally
- **API testing**: Use REST client or curl to test each endpoint
- **App flow**: Open the app → should go straight to profile selection
- **Version display**: Check top-right corner shows `v{number}` matching GitHub Actions run number
- **One-entry-per-day**: Attempt duplicate submissions and verify they're blocked/updated
- **Word validation**: Try entering words with spaces and duplicate words, verify rejection
- **Autocomplete**: Enter words over multiple days and verify suggestions populate
- **Deployment**: Verify the app works at the Azure Static Web Apps URL
- **Grafana**: Verify dashboards display data correctly after entries exist

## Known Issues & Solutions

### Missing Entry Shows 404 in Network Tab (Fixed)
**Symptom**: When a profile hasn't submitted today, the API shows 404 in browser Network tab
**Cause**: API returned 404 for missing entries
**Fix**: Changed API to return 200 with `{ entry: null }` for missing entries

### Missing Favicon (Fixed)
**Symptom**: Browser requests `/favicon.ico` and gets 404 from Azure
**Cause**: No favicon file provided
**Fix**: Added `client/public/favicon.svg` with simple DT logo

