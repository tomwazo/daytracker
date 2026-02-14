# Day Tracker — Technical Plan

## Context

Building the Day Tracker app described in `day-tracker-idea.md`: a family mindfulness tool where four users score their day (1-10) and enter three descriptive words. The app includes Grafana dashboards for visualizing trends. This plan covers the full technical architecture and implementation order.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + TypeScript |
| Backend | Azure Functions (Node.js/TypeScript) |
| Database | Azure Cosmos DB (NoSQL, free tier) |
| Auth/SSO | Google Sign-In |
| Dashboards | Grafana (self-hosted on Azure Container Instance) |
| Hosting | Azure Static Web Apps (free tier, includes Azure Functions) |
| CI/CD | GitHub → Azure Static Web Apps (built-in) |

## Project Structure

```
mindfulness/
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx           # Google Sign-In with email validation
│   │   │   ├── Login.css
│   │   │   ├── ProfileSelect.tsx   # 2x2 grid + dashboard button
│   │   │   ├── ProfileSelect.css
│   │   │   ├── DayEntry.tsx        # Score + 3 words form
│   │   │   ├── DayEntry.css
│   │   │   ├── WordInput.tsx       # Autocomplete input
│   │   │   ├── WordInput.css
│   │   │   ├── VersionBadge.tsx    # Version number display
│   │   │   └── VersionBadge.css
│   │   ├── api.ts                  # API client with auth headers
│   │   ├── auth.ts                 # Token management
│   │   ├── App.tsx                 # Main router
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   └── vite-env.d.ts           # TypeScript declarations
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
│   │   ├── cosmosClient.ts         # Cosmos DB connection
│   │   └── authMiddleware.ts       # Google token validation & email allowlist
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
├── staticwebapp.config.json        # SWA routing config (no auth guards)
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

1. User lands on the app → sees Google Sign-In button (uses Google GSI library)
2. Google Sign-In returns an ID token (JWT)
3. Frontend makes a test API call to verify the email is authorized
   - If 403 returned, shows error: "This email is not authorized to use Day Tracker"
   - If successful, proceeds to profile selection
4. The token is sent to the backend on each API call via `Authorization: Bearer <token>` header
5. Azure Functions middleware validates the token:
   - Calls Google's tokeninfo endpoint to verify signature and expiry
   - Checks `aud` (audience) matches the configured `GOOGLE_CLIENT_ID`
   - Extracts email and verifies it's in the allowed list (defaults to `tom87moore@gmail.com`)
   - Returns 401 for invalid tokens, 403 for unauthorized emails
6. After sign-in, the user sees the profile picker (Daddy, Mommy, Tabitha, Imogen)
7. Profile selection is trust-based within the authenticated family — no per-profile passwords

**Environment Variables:**
- `GOOGLE_CLIENT_ID` (API): OAuth client ID, enables auth validation
- `VITE_GOOGLE_CLIENT_ID` (Client build): Shows real Google button vs dev mode
- `ALLOWED_EMAILS` (API, optional): Comma-separated list of allowed emails (default: `tom87moore@gmail.com`)
- `BUILD_NUMBER` (Client build): GitHub Actions run number for version badge

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
- Integrate Google Sign-In on the frontend using GSI library
- Add token validation middleware in Azure Functions
- Implement email allowlist check (defaults to `tom87moore@gmail.com`)
- Add frontend error handling for unauthorized emails
- ~~Add `staticwebapp.config.json` route guards~~ (removed - conflicts with custom auth)

### Phase 5: Deploy
- Create Azure Static Web App resource
- Connect GitHub repo for CI/CD (auto-generated workflow)
- Provision Cosmos DB in Azure (serverless mode)
- Configure Google OAuth client ID in Google Cloud Console
  - Add authorized JavaScript origins: production SWA URL
  - Add authorized redirect URIs: production SWA URL
- Set Azure app settings: `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`, `GOOGLE_CLIENT_ID`, `ALLOWED_EMAILS`
- Update GitHub workflow to inject `VITE_GOOGLE_CLIENT_ID` and `BUILD_NUMBER` at build time
- Add `api_build_command: "npm run build"` to workflow to compile TypeScript
- Test end-to-end in production

### Phase 7: Version Display (Added)
- Create `VersionBadge` component showing version in top-right corner
- Configure Vite to inject `__APP_VERSION__` from `BUILD_NUMBER` env var
- GitHub Actions run number auto-increments on each deployment
- Shows "vdev" in local development

### Phase 8: Email Restriction (Added)
- Update `authMiddleware.ts` to extract and validate email from Google token
- Implement allowlist check (configurable via `ALLOWED_EMAILS` env var)
- Add frontend validation in Login component (test API call after sign-in)
- Display error message for unauthorized emails

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
  - Verify Google Sign-In button appears (not dev mode)
  - Sign in with authorized email → should reach profile selection
  - Sign in with unauthorized email → should see error message
  - API calls include valid token in Authorization header
- **Email restriction**: Attempt sign-in with non-allowed email and verify rejection
- **Version display**: Check top-right corner shows `v{number}` matching GitHub Actions run number
- **One-entry-per-day**: Attempt duplicate submissions and verify they're blocked/updated
- **Autocomplete**: Enter words over multiple days and verify suggestions populate
- **Deployment**: Verify the app works at the Azure Static Web Apps URL
- **Grafana**: Verify dashboards display data correctly after entries exist

## Known Issues & Solutions

### Google Sign-In 400 Bad Request
**Symptom**: Google button fails to load with 400 error
**Cause**: Missing authorized JavaScript origins in Google Cloud Console
**Fix**: Add `https://nice-meadow-0cb162303.1.azurestaticapps.net` to authorized JavaScript origins and redirect URIs

### API returns 401 "Invalid token"
**Symptom**: All API calls fail with 401 after sign-in
**Possible causes**:
1. `VITE_GOOGLE_CLIENT_ID` not set in build → client shows dev mode instead of real Google button
2. Google OAuth config missing authorized origins → token is invalid
3. `GOOGLE_CLIENT_ID` mismatch between client and server → audience validation fails
**Fix**: Verify all three are correctly configured

### SWA 401 before reaching API functions
**Symptom**: API returns 401 before auth middleware runs
**Cause**: `staticwebapp.config.json` has route guards requiring SWA's built-in auth
**Fix**: Remove route guards from config — auth is handled in functions middleware
