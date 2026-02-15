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

- **Login** — Google Sign-In button, with dev-mode fallback when no client ID is configured
- **ProfileSelect** — 2x2 grid of family member cards + link to Grafana dashboards
- **DayEntry** — Score slider with color-coded value (red/amber/green), 3 word inputs, loads existing entry on mount, shows confirmation after submission
- **WordInput** — Text input with dropdown autocomplete filtered from past words
- API client module (`client/src/api.ts`) with auth headers on all requests
- Clean CSS with design tokens (CSS variables for colors, radius, shadows)

### Phase 4: Authentication

- **Status: Needs re-implementation** (switching from Azure AD to username/password)
- Simple username/password login (usernames: `tom` and `laura`)
- JWT-based session management
- "Remember me" option for persistent login
- Passwords stored as bcrypt hashes in API code
- Token validation middleware on all protected endpoints

### Build Verification

- All TypeScript compiles cleanly (both `client/` and `api/`)
- Full production build succeeds (`npm run build`)
- All dependencies installed (131 packages, 0 vulnerabilities)

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
   | `GOOGLE_CLIENT_ID` | Your Google OAuth client ID (see step 5.5) |

3. Click **Save**

#### 5.5 — Set Up Google Sign-In

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g. `Day Tracker`)
3. Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** user type
   - Fill in the app name, support email, and developer email
   - No scopes needed — click through to finish
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - **Application type**: Web application
   - **Name**: `Day Tracker Web`
   - **Authorized JavaScript origins**: add both:
     - `http://localhost:5173` (for local dev)
     - `https://<your-app-name>.azurestaticapps.net` (your SWA URL, found in the Azure Portal overview)
5. Copy the **Client ID** (looks like `xxxx.apps.googleusercontent.com`)
6. Add it to your Azure Static Web App application settings as `GOOGLE_CLIENT_ID` (done in step 5.4)
7. For local development, create a `.env` file in `client/`:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   ```
8. For production builds, add `VITE_GOOGLE_CLIENT_ID` as an environment variable in your GitHub Actions workflow file (`.github/workflows/azure-static-web-apps-*.yml`):
   ```yaml
   env:
     VITE_GOOGLE_CLIENT_ID: xxxx.apps.googleusercontent.com
   ```

#### 5.6 — Test End-to-End

1. Push your changes to GitHub — the GitHub Action will auto-deploy
2. Visit your SWA URL (e.g. `https://<your-app-name>.azurestaticapps.net`)
3. Verify:
   - [ ] Google Sign-In button appears and works
   - [ ] Profile selection screen shows after login
   - [ ] Submitting a day entry succeeds (check Cosmos DB Data Explorer to confirm)
   - [ ] Returning to the same profile on the same day loads the existing entry
   - [ ] Submitting again upserts (updates) the same entry

---

### Phase 6: Interactive Dashboard

⚠️ **STATUS: BLOCKED - JWT Authentication Issue**

**Current Problem:**
The analytics dashboard is fully implemented (code complete, deployed) but **NOT FUNCTIONAL** due to a JWT token verification issue in Azure Functions. All analytics endpoints return `401 Unauthorized` with error: `{"error":"Invalid token","debug":"invalid signature"}`.

**What's Working:**
- ✅ Dashboard UI components fully built (Dashboard, ScoreChart, WordFrequencyChart, StatsCards)
- ✅ Analytics API endpoints deployed (`/api/analytics/entries`, `/api/analytics/word-frequency`, `/api/analytics/stats`)
- ✅ Login creates JWT tokens successfully
- ✅ JWT_SECRET configured in Azure and accessible to all functions
- ✅ Tokens verify successfully immediately after creation (within same function)

**What's Broken:**
- ❌ Analytics endpoints reject tokens with "invalid signature" even though they use the same JWT_SECRET
- ❌ Verified via debug endpoints: all functions report identical JWT_SECRET (SHA-256 hash matches)
- ❌ Even hardcoding JWT_SECRET in source code doesn't fix the issue
- ❌ Suggests potential Azure Functions module caching or instance isolation bug

**Debugging Attempts** (Feb 15, 2026):
1. Verified JWT_SECRET environment variable across all endpoints (identical SHA-256 hashes)
2. Added immediate token verification in login endpoint (works - proves tokens are valid)
3. Hardcoded JWT_SECRET directly in `authMiddleware.ts` and `login.ts` (still fails)
4. Forced rebuild of all analytics endpoints
5. Tested with completely fresh tokens and cleared browser storage

**Next Steps** (for future resolution):
- Consider switching to Azure AD authentication or Azure Static Web Apps built-in auth
- Try deploying to a completely fresh Azure Static Web App instance
- Investigate Azure Functions cold start behavior and module caching
- Possibly move to API Key authentication instead of JWT

**Temporary Workaround:**
None available. Dashboard is inaccessible until authentication issue is resolved.

---

Build an integrated analytics dashboard directly in the app using Recharts.

#### 6.1 — Add Analytics API Endpoints

Create three new Azure Functions for aggregated data:

1. **GET `/api/analytics/entries`**
   - Query parameters: `startDate`, `endDate`, `profileId` (optional)
   - Returns all entries in date range, optionally filtered by profile
   - Used for: score chart, entries table

2. **GET `/api/analytics/word-frequency`**
   - Query parameters: `startDate`, `endDate`, `profileId` (optional)
   - Returns word frequency counts for the period
   - Used for: word frequency bar chart

3. **GET `/api/analytics/stats`**
   - Query parameters: `startDate`, `endDate`
   - Returns summary statistics (average score per profile)
   - Used for: stats cards display

All endpoints require authentication (JWT token).

#### 6.2 — Install Dependencies

```bash
npm install recharts --workspace=client
npm install date-fns --workspace=client  # for date manipulation
```

#### 6.3 — Build Dashboard Components

Create new components in `client/src/components/`:

1. **Dashboard.tsx** — Main dashboard page
   - Date range selector (Last 7/30/90 days, All time, Custom)
   - Profile filter dropdown
   - Layout with charts and stats

2. **ScoreChart.tsx** — Line chart component
   - Uses Recharts `LineChart`
   - One line per family member
   - Y-axis range: 1-10

3. **WordFrequencyChart.tsx** — Bar chart component
   - Uses Recharts `BarChart`
   - Top 20 most-used words
   - Horizontal bars for readability

4. **StatsCards.tsx** — Summary statistics
   - Average score per profile
   - Total entries in period
   - Card-based layout

5. **EntriesTable.tsx** — Recent entries table
   - Paginated list of entries
   - Columns: Date, Profile, Score, Words
   - Click to view details

#### 6.4 — Add Navigation

1. Update `ProfileSelect.tsx`:
   - Change "View Dashboards" button to "View Insights"
   - Click navigates to `/dashboard` route

2. Update `App.tsx`:
   - Add `dashboard` screen to state
   - Add Dashboard component to rendering logic

#### 6.5 — Style the Dashboard

- Use existing CSS variables for consistency
- Responsive layout (mobile-friendly)
- Loading states while fetching data
- Empty states when no data in range

## File Structure

```
mindfulness/
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx           # Google Sign-In
│   │   │   ├── Login.css
│   │   │   ├── ProfileSelect.tsx   # 2x2 profile grid
│   │   │   ├── ProfileSelect.css
│   │   │   ├── DayEntry.tsx        # Score + 3 words form
│   │   │   ├── DayEntry.css
│   │   │   ├── WordInput.tsx       # Autocomplete input
│   │   │   └── WordInput.css
│   │   ├── api.ts                  # API client with auth
│   │   ├── auth.ts                 # Google token management
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
│   │   │   └── getWords.ts         # GET /api/words/:profileId
│   │   ├── cosmosClient.ts         # Cosmos DB connection
│   │   └── authMiddleware.ts       # Google token validation
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
