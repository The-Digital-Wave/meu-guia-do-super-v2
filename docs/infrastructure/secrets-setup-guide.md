# Secrets & Environment Variables — Setup Guide

Step-by-step instructions for obtaining every credential required to run CI/CD pipelines and the production backend.

**GitHub Actions secrets location:** repo → Settings → Secrets and variables → Actions → New repository secret

**Render env vars location:** Render dashboard → your service → Environment → Add Environment Variable

Do the groups in order — you need the Render service URL (Group 2) before you can fill in `EXPO_PUBLIC_API_URL` and `ALLOWED_ORIGINS`.

---

## Group 1 — Docker Hub

**Secrets:** `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
**Used by:** `deploy-backend.yml` (pushes the Docker image)

1. Go to [hub.docker.com](https://hub.docker.com) and sign in (or create a free account).
2. Click your avatar → **Account settings** → **Personal access tokens** → **Generate new token**.
3. Name it `meu-guia-cicd`, set **Access permissions** to `Read & Write`, click **Generate**.
4. Copy the token — you won't see it again.
5. Add to GitHub Actions secrets:
   - `DOCKERHUB_USERNAME` = your Docker Hub username
   - `DOCKERHUB_TOKEN` = the token from step 4

---

## Group 2 — Render

**Secrets:** `RENDER_API_KEY`, `RENDER_SERVICE_ID`
**Used by:** `deploy-backend.yml` (triggers a redeploy after pushing the image)

1. Go to [dashboard.render.com](https://dashboard.render.com) → avatar → **Account Settings** → **API Keys** → **Create API Key**.
2. Name it, click **Create**. Copy the key — you won't see it again.
3. Create the Render service: **New** → **Web Service** → **Deploy an existing image from a registry**.
4. Enter the Docker Hub image: `<your-dockerhub-username>/meu-guia-do-super-api:latest`. Click **Connect**.
5. Configure the service:
   - Name: `meu-guia-do-super-api`
   - Region: Oregon (free-tier) or closest to you
   - Plan: **Free**
   - Click **Create Web Service**
6. Once created, look at the browser URL: `https://dashboard.render.com/web/srv-XXXXXXXXXX`. The `srv-XXXXXXXXXX` part is the Service ID.
7. Add to GitHub Actions secrets:
   - `RENDER_API_KEY` = key from step 2
   - `RENDER_SERVICE_ID` = `srv-XXXXXXXXXX` from step 6

---

## Group 3 — Render environment variables

**Where:** Render dashboard → your service → Environment → Add Environment Variable
(These are NOT GitHub secrets — they live in Render's encrypted env store)

### `DATABASE_URL`

1. Go to [supabase.com](https://supabase.com) → open your project → **Project Settings** → **Database** → **Connection string** tab.
2. Select **URI** format. Example:
   `postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
3. Change the driver prefix from `postgresql://` to `postgresql+asyncpg://` (required by SQLAlchemy async).
4. Set as `DATABASE_URL` in Render.

### `JWT_SECRET` and `JWT_REFRESH_SECRET`

1. Open a terminal and run this command **twice** (one output per secret):
   ```bash
   openssl rand -hex 32
   ```
   Or with Python if you don't have OpenSSL:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. Set `JWT_SECRET` = first output, `JWT_REFRESH_SECRET` = second output.
3. They **must be different strings**.

### `REDIS_URL`

1. Go to [upstash.com](https://upstash.com) → sign in → **Redis** → **Create Database**.
2. Name it `meu-guia-do-super`, pick the region closest to your Render region, keep **TLS enabled**. Click **Create**.
3. On the database page → **Details** tab → copy the **Redis URL** (starts with `rediss://`).
4. Set as `REDIS_URL` in Render. The double `s` in `rediss://` means TLS — required by Upstash.

### `RESEND_API_KEY`

1. Go to [resend.com](https://resend.com) → sign in → **API Keys** → **Create API Key**.
2. Name it `meu-guia-production`, permission: **Full access**, click **Add**.
3. Copy the key (starts with `re_`). Set as `RESEND_API_KEY` in Render.

### `ALLOWED_ORIGINS`

Fill this in **after** you have your Vercel URL (from Group 4 below). Format:
```
https://your-app-name.vercel.app,http://localhost:8081
```

---

## Group 4 — Vercel

**Secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `EXPO_PUBLIC_API_URL`
**Used by:** `deploy-frontend-web.yml` (publishes the Expo Web build)

1. Go to [vercel.com](https://vercel.com) → sign in → avatar → **Settings** → **Tokens** → **Create Token**.
2. Name it `meu-guia-cicd`, scope: **Full Account**, no expiry. Click **Create**. Copy the token.
3. Link the project locally so Vercel generates the project/org IDs:
   ```bash
   npm i -g vercel
   vercel login
   cd client
   vercel link
   ```
   Follow the prompts — create a new project named `meu-guia-do-super`.
4. After `vercel link` completes, open `client/.vercel/project.json`:
   ```json
   { "orgId": "team_XXXXXXXXX", "projectId": "prj_XXXXXXXXX" }
   ```
5. Add to GitHub Actions secrets:
   - `VERCEL_TOKEN` = token from step 2
   - `VERCEL_ORG_ID` = `orgId` value from `project.json`
   - `VERCEL_PROJECT_ID` = `projectId` value from `project.json`
   - `EXPO_PUBLIC_API_URL` = your Render service URL + `/api/v1`
     (e.g. `https://meu-guia-do-super-api.onrender.com/api/v1`)

> `client/.vercel/` is already in `.gitignore` — do not commit it.

After getting your Vercel URL, go back to Group 3 and fill in `ALLOWED_ORIGINS`.

---

## Group 5 — Expo

**Secret:** `EXPO_TOKEN`
**Used by:** `eas-build.yml` (triggers EAS builds from CI)

1. Go to [expo.dev](https://expo.dev) → sign in → avatar → **Access Tokens** → **Create Token**.
2. Name it `meu-guia-cicd`. Click **Create Token**. Copy it.
3. Add to GitHub Actions secrets:
   - `EXPO_TOKEN` = token from step 2

---

## Completion checklist

| Secret | Destination | Done |
|---|---|---|
| `DOCKERHUB_USERNAME` | GitHub Actions secrets | ☐ |
| `DOCKERHUB_TOKEN` | GitHub Actions secrets | ☐ |
| `RENDER_API_KEY` | GitHub Actions secrets | ☐ |
| `RENDER_SERVICE_ID` | GitHub Actions secrets | ☐ |
| `VERCEL_TOKEN` | GitHub Actions secrets | ☐ |
| `VERCEL_ORG_ID` | GitHub Actions secrets | ☐ |
| `VERCEL_PROJECT_ID` | GitHub Actions secrets | ☐ |
| `EXPO_PUBLIC_API_URL` | GitHub Actions secrets | ☐ |
| `EXPO_TOKEN` | GitHub Actions secrets | ☐ |
| `DATABASE_URL` | Render dashboard → Environment | ☐ |
| `JWT_SECRET` | Render dashboard → Environment | ☐ |
| `JWT_REFRESH_SECRET` | Render dashboard → Environment | ☐ |
| `REDIS_URL` | Render dashboard → Environment | ☐ |
| `RESEND_API_KEY` | Render dashboard → Environment | ☐ |
| `ALLOWED_ORIGINS` | Render dashboard → Environment | ☐ |
