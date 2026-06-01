# GitHub Actions Secrets

Configure these in: Settings → Secrets and variables → Actions

## CI / All Workflows

| Secret | Description |
|---|---|
| (none required for CI job) | CI uses sqlite in-memory for tests |

## Backend Deploy (`deploy-backend.yml`)

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not password) |
| `RENDER_API_KEY` | Render API key (from Render dashboard → Account → API Keys) |
| `RENDER_SERVICE_ID` | Render service ID (from service URL: `srv-XXXXXX`) |

## Frontend Web Deploy (`deploy-frontend-web.yml`)

| Secret | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend URL, e.g. `https://meu-guia-do-super.onrender.com/api/v1` |
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel team/org ID (from `.vercel/project.json` after `vercel link`) |
| `VERCEL_PROJECT_ID` | Vercel project ID (from `.vercel/project.json`) |

## EAS Build (`eas-build.yml`)

| Secret | Description |
|---|---|
| `EXPO_TOKEN` | Expo access token (from expo.dev → Account → Access Tokens) |

## Render Environment Variables

Set these in Render dashboard → Service → Environment:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (asyncpg driver: `postgresql+asyncpg://...`) |
| `JWT_SECRET` | Random 64-char secret (generate: `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Random 64-char secret (different from JWT_SECRET) |
| `REDIS_URL` | Upstash Redis REST URL (`rediss://...`) |
| `RESEND_API_KEY` | Resend API key (for contact form emails) |
| `ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app,http://localhost:8081` |
