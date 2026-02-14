# Day Tracker — Technical Plan

## Context

Building the Day Tracker app described in `day-tracker-idea.md`: a family mindfulness tool where four users score their day (1-10) and enter three descriptive words. The app includes Grafana dashboards for visualizing trends. This plan covers the full technical architecture and implementation order.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + TypeScript |
| Backend | Azure Functions (Node.js/TypeScript) |
| Database | Azure Cosmos DB (NoSQL, free tier) |
| Auth/SSO | Azure Static Web Apps Built-in Auth (Microsoft provider) |
| Dashboards | Grafana (self-hosted on Azure Container Instance) |
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

## Auth Flow

**Azure Static Web Apps Built-in Authentication** — authentication is handled entirely by Azure at the infrastructure level:

1. User attempts to access any route
2. Azure SWA checks if user is authenticated
   - If not authenticated → redirects to Microsoft login page
   - If authenticated but not in allowlist → shows 403 Forbidden
3. User signs in with Microsoft account (works with both Microsoft and Gmail-linked accounts)
4. Azure validates the user's email against the allowlist in `staticwebapp.config.json`
   - Allowed: `tom87moore@gmail.com`, `laura_j_bates87@hotmail.com`
5. If authorized, Azure allows the request to proceed to the app
6. User sees the profile picker (Daddy, Mommy, Tabitha, Imogen)
7. Profile selection is trust-based within the authenticated family — no per-profile passwords

**Key Points:**
- No custom auth code required — fully managed by Azure
- Authentication protects both frontend routes AND API endpoints
- Email allowlist configured in `staticwebapp.config.json`
- No tokens or Authorization headers needed in frontend code

**Environment Variables:**
- `BUILD_NUMBER` (Client build): GitHub Actions run number for version badge
- `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE` (API): Cosmos DB connection

## Grafana Setup

- Run Grafana in an **Azure Container Instance** (ACI)
- Use the **Cosmos DB / Azure Data Explorer plugin** or a **JSON API datasource** pointing at the Azure Functions API
- Four dashboards as specified: score over time, word frequency, words over time, word cloud
- The "View Dashboards" button in the app links to the Grafana instance URL

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
- Configure `staticwebapp.config.json` with Azure SWA built-in auth
- Set provider to Microsoft
- Add email allowlist: `tom87moore@gmail.com`, `laura_j_bates87@hotmail.com`
- Configure route protection for all routes (frontend + API)
- No frontend code changes required — auth handled at Azure level

### Phase 5: Deploy
- Create Azure Static Web App resource
- Connect GitHub repo for CI/CD (auto-generated workflow)
- Provision Cosmos DB in Azure (serverless mode)
- Set Azure app settings: `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`
- Update GitHub workflow to inject `BUILD_NUMBER` at build time
- Add `api_build_command: "npm run build"` to workflow to compile TypeScript
- Test end-to-end in production
- Verify authentication and email allowlist work correctly

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

### Phase 6: Grafana
- Deploy Grafana container on Azure Container Instance
- Connect to Cosmos DB data
- Build the four dashboards
- Link from the app's dashboard button

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
- **Auth testing**:
  - Access the app → should redirect to Microsoft login
  - Sign in with authorized email → should reach profile selection
  - Sign in with unauthorized email → should see 403 Forbidden
  - Verify API endpoints also require authentication
- **Email restriction**: Attempt access with non-allowed email and verify 403 rejection
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

### 403 Forbidden After Login
**Symptom**: User can log in but gets 403 Forbidden
**Cause**: User's email is not in the allowlist in `staticwebapp.config.json`
**Fix**: Add the user's email to the `allowedRoles` section
