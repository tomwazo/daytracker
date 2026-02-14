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
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx          # Google Sign-In
│   │   │   ├── ProfileSelect.tsx  # 2x2 grid + dashboard button
│   │   │   ├── DayEntry.tsx       # Score + 3 words form
│   │   │   └── WordInput.tsx      # Autocomplete input
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── api/                       # Azure Functions backend
│   ├── src/
│   │   └── functions/
│   │       ├── getEntry.ts        # GET today's entry for a profile
│   │       ├── createEntry.ts     # POST new daily entry
│   │       └── getWords.ts       # GET word history for autocomplete
│   ├── package.json
│   └── tsconfig.json
├── infra/                     # Azure infrastructure config
│   └── grafana/
│       └── docker-compose.yml     # Grafana container setup
├── staticwebapp.config.json   # SWA routing & auth config
└── package.json               # Root workspace
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

1. User lands on the app → sees Google Sign-In button
2. Google Sign-In returns an ID token
3. The token is sent to the backend on each API call (Authorization header)
4. Azure Functions validate the token and allow/deny access
5. After sign-in, the user sees the profile picker (Daddy, Mommy, Tabitha, Imogen)
6. Profile selection is trust-based within the authenticated family — no per-profile passwords

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
- Integrate Google Sign-In on the frontend
- Add token validation middleware in Azure Functions
- Add `staticwebapp.config.json` route guards

### Phase 5: Deploy
- Create Azure Static Web App resource
- Connect GitHub repo for CI/CD
- Provision Cosmos DB in Azure
- Test end-to-end in production

### Phase 6: Grafana
- Deploy Grafana container on Azure Container Instance
- Connect to Cosmos DB data
- Build the four dashboards
- Link from the app's dashboard button

## Verification

- **Local dev**: Run `swa start` to test frontend + functions together locally
- **API testing**: Use REST client or curl to test each endpoint
- **Auth testing**: Verify Google Sign-In flow end-to-end
- **One-entry-per-day**: Attempt duplicate submissions and verify they're blocked
- **Autocomplete**: Enter words over multiple days and verify suggestions populate
- **Deployment**: Verify the app works at the Azure Static Web Apps URL
- **Grafana**: Verify dashboards display data correctly after entries exist
