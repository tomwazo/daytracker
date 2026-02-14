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

- Google Sign-In integration via GSI library (`client/src/components/Login.tsx`)
- Token stored in memory and sent as `Authorization: Bearer <token>` on API calls
- Auth middleware (`api/src/authMiddleware.ts`) validates Google ID tokens against `GOOGLE_CLIENT_ID`
- Auth is skipped in local dev when `GOOGLE_CLIENT_ID` is not set
- `staticwebapp.config.json` route guard requires `authenticated` role for `/api/*`

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

### Phase 6: Grafana Dashboards

#### 6.1 — Deploy Grafana on Azure Container Instance

1. Go to Azure Portal → **Create a resource** → search **Container Instances**
2. Click **Create** and fill in:
   - **Resource Group**: `daytracker-rg`
   - **Container name**: `daytracker-grafana`
   - **Image source**: Docker Hub
   - **Image**: `grafana/grafana:latest`
   - **OS type**: Linux
   - **Size**: 1 vCPU, 1.5 GiB memory (minimum)
3. On the **Networking** tab:
   - **DNS name label**: e.g. `daytracker-grafana` (gives you `daytracker-grafana.<region>.azurecontainer.io`)
   - **Port**: `3000` (TCP)
4. On the **Advanced** tab, add environment variables:
   - `GF_SECURITY_ADMIN_PASSWORD` = a strong password
   - `GF_SERVER_ROOT_URL` = `http://daytracker-grafana.<region>.azurecontainer.io:3000`
5. Click **Review + Create** → **Create**
6. Once running, open `http://daytracker-grafana.<region>.azurecontainer.io:3000` and log in with `admin` / your password

**Alternative (local):** Run `docker-compose up -d` from `infra/grafana/` for local testing.

#### 6.2 — Connect Grafana to Data

**Option A — JSON API datasource (recommended, simpler):**

1. In Grafana, go to **Connections** → **Add new connection** → search **JSON API**
2. Install the JSON API datasource plugin if prompted
3. Set the URL to your Azure Functions API:
   - `https://<your-app-name>.azurestaticapps.net/api`
4. Under **Custom HTTP Headers**, add:
   - Header: `Authorization`, Value: `Bearer <a-valid-google-token>` (or create a separate service token)
5. Click **Save & Test**

**Option B — Direct Cosmos DB connection:**

1. Install the **Azure Data Explorer** plugin in Grafana
2. Configure it with your Cosmos DB connection string
3. Write KQL queries against the `entries` container

#### 6.3 — Build the Dashboards

Create a new dashboard in Grafana and add the following panels:

**Panel 1: Score Over Time (line chart)**
- Query: fetch all entries, group by `profileId`
- Visualization: Time series / Line chart
- X-axis: `date`, Y-axis: `score`
- One line per profile (Daddy, Mommy, Tabitha, Imogen)
- Set Y-axis range to 1–10

**Panel 2: Word Frequency (bar chart)**
- Query: count occurrences of each word across all entries
- Visualization: Bar chart
- X-axis: word, Y-axis: count
- Optionally filter by profile using a dashboard variable
- Sort by count descending, show top 20

**Panel 3: Words Over Time (table)**
- Query: fetch all entries ordered by date descending
- Visualization: Table
- Columns: Date, Profile, Score, Word 1, Word 2, Word 3
- Add filters for profile and date range

**Panel 4: Word Cloud**
- Install the **Word Cloud** panel plugin (search Grafana plugin marketplace)
- Query: same as word frequency — each word with its count
- Configure font size scaling based on frequency

#### 6.4 — Link the App to Grafana

1. Find your Grafana URL (e.g. `http://daytracker-grafana.<region>.azurecontainer.io:3000`)
2. Update `client/src/components/ProfileSelect.tsx`:
   - Change `const GRAFANA_URL = "http://localhost:3000"` to your deployed URL
3. Commit and push — the app's "View Dashboards" button will now link to Grafana

#### 6.5 — Secure Grafana

1. In Grafana, go to **Administration** → **General** → **Settings**
2. Consider enabling anonymous access for read-only dashboard viewing:
   - Set `GF_AUTH_ANONYMOUS_ENABLED` = `true`
   - Set `GF_AUTH_ANONYMOUS_ORG_ROLE` = `Viewer`
   - This lets family members view dashboards without a separate Grafana login
3. Alternatively, create individual Grafana viewer accounts for each family member
4. For production, consider putting Grafana behind HTTPS using Azure Application Gateway or a reverse proxy

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
