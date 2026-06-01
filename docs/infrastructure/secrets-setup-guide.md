# Secrets & Environment Variables — Setup Guide

Step-by-step instructions for obtaining every credential required to run CI/CD pipelines and the production backend.

**GitHub Actions secrets location:** repo → Settings → Secrets and variables → Actions → New repository secret

**Render env vars location:** Render dashboard → your service → Environment → Add Environment Variable

Do the groups in order — you need the Render service URL (Group 2) before you can fill in `EXPO_PUBLIC_API_URL` and `ALLOWED_ORIGINS`.

---

## Secret storage strategy

Secrets live in three places depending on their purpose:

| Where | What goes there |
|---|---|
| **GitHub Actions secrets** | CI/CD tokens (Docker Hub, Render, Vercel, Expo) |
| **Render dashboard → Environment** | Backend runtime secrets (DB, JWT, Redis, Resend) |
| **Bitwarden vault** (personal) | Master copy of every secret value — see [Bitwarden setup](#bitwarden-setup) below |

`.env.example` files in the repo document every variable name and where to obtain its value, but **never store actual secrets in any committed file**.

---

## .env.example files

Three example files are committed and kept in sync with the actual variables:

| File | Purpose |
|---|---|
| `.env.example` | Root — CI/CD secrets passed through GitHub Actions |
| `server/.env.example` | Backend local development |
| `client/.env.example` | Expo/React Native local development |

To start local development:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
# Then fill in the values from your Bitwarden vault
```

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

Docker Hub repositories are created automatically on first push, so you need to push the image manually once before Render can reference it.

### 2a — Push the image to Docker Hub for the first time

1. Make sure Docker Desktop is running on your machine.
2. Open a terminal at the repo root and log in to Docker Hub:
   ```bash
   docker login
   ```
   Enter your Docker Hub username and password (or token from Group 1).
3. Build the image:
   ```bash
   docker build -t <your-dockerhub-username>/meu-guia-do-super-api:latest ./server
   ```
4. Push it — this creates the repository on Docker Hub automatically:
   ```bash
   docker push <your-dockerhub-username>/meu-guia-do-super-api:latest
   ```
5. Verify at [hub.docker.com/repositories](https://hub.docker.com/repositories) — you should see `meu-guia-do-super-api` listed.

### 2b — Create the Render API key

6. Go to [dashboard.render.com](https://dashboard.render.com) → avatar → **Account Settings** → **API Keys** → **Create API Key**.
7. Name it, click **Create**. Copy the key — you won't see it again.

### 2c — Create the Render service

8. On the Render dashboard: **New** → **Web Service** → **Deploy an existing image from a registry**.
9. Enter the Docker Hub image: `<your-dockerhub-username>/meu-guia-do-super-api:latest`. Click **Connect**.
10. Configure the service:
    - Name: `meu-guia-do-super-api`
    - Region: Oregon (free-tier) or closest to you
    - Plan: **Free**
    - Click **Create Web Service**
11. Once created, look at the browser URL: `https://dashboard.render.com/web/srv-XXXXXXXXXX`. The `srv-XXXXXXXXXX` part is the Service ID.
12. Add to GitHub Actions secrets:
    - `RENDER_API_KEY` = key from step 7
    - `RENDER_SERVICE_ID` = `srv-XXXXXXXXXX` from step 11

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

### `REDIS_URL` and `REDIS_TOKEN`

The production setup uses **Upstash Redis** via its REST API (HTTP, not the Redis wire protocol).

1. Go to [upstash.com](https://upstash.com) → sign in → **Redis** → **Create Database**.
2. Name it `meu-guia-do-super`, pick the region closest to your Render region, keep **TLS enabled**. Click **Create**.
3. On the database page → **Details** tab → **REST API** section:
   - Copy the **UPSTASH_REDIS_REST_URL** → set as `REDIS_URL` in Render.
   - Copy the **UPSTASH_REDIS_REST_TOKEN** → set as `REDIS_TOKEN` in Render.

> Note: `REDIS_URL` here is the Upstash HTTPS endpoint (e.g. `https://communal-humpback-xxxxx.upstash.io`), not a `rediss://` Redis wire-protocol URL. The backend uses the Upstash REST client, which requires the token separately.

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

## Bitwarden setup

Bitwarden is the personal vault for storing all actual secret values. It keeps a master copy independent of any service, so you can recover credentials after rotating tokens or rebuilding environments.

**Free account at:** [bitwarden.com](https://bitwarden.com) — the free tier covers everything needed here.

### First-time setup

1. Go to [vault.bitwarden.com](https://vault.bitwarden.com) → **Create account**.
2. Use a strong master password (20+ chars). Store it somewhere completely offline (paper, hardware key) — Bitwarden cannot recover it for you.
3. Install the browser extension or desktop app for easy access during setup.

### Creating the secure note

All project secrets are stored in a single **Secure Note** (not a Login item):

1. In your vault: **+ New item** → **Secure Note**.
2. **Name:** `meu-guia-do-super-v2 — Environment Secrets`
3. **Folder:** Create a folder called `Projects` if you don't have one.
4. In the **Notes** field, paste this template and fill in your real values:

```
=== GitHub Actions Secrets ===
DOCKERHUB_USERNAME=
DOCKERHUB_TOKEN=
RENDER_API_KEY=
RENDER_SERVICE_ID=
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
EXPO_TOKEN=
EXPO_PUBLIC_API_URL=

=== Render Environment Variables ===
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
REDIS_TOKEN=
RESEND_API_KEY=
ALLOWED_ORIGINS=

=== Local Dev Only (never in production) ===
DATABASE_URL (local)=postgresql+asyncpg://meuguia:meuguia@localhost:5432/meuguia
REDIS_URL (local)=redis://localhost:6379
```

5. Click **Save**.

### Rotating a secret

When you rotate a credential (e.g. a compromised token):

1. Generate the new value at the service dashboard.
2. Update it in GitHub Actions secrets / Render dashboard immediately.
3. Open the Bitwarden note → edit → replace the old value → save.
4. Add a one-line comment in the note next to the entry with the rotation date, e.g. `# rotated 2026-06-01`.

### Sharing with a co-developer (future)

When the team grows beyond one person, use a **Bitwarden Organization** (free for 2 users):

1. In Bitwarden: avatar → **Organizations** → **New Organization** → Free plan.
2. Invite the co-developer by email.
3. Move the secure note to a shared **Collection** within the org.
4. They get read access to secrets without ever seeing your master password.

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
| `REDIS_TOKEN` | Render dashboard → Environment | ☐ |
| `RESEND_API_KEY` | Render dashboard → Environment | ☐ |
| `ALLOWED_ORIGINS` | Render dashboard → Environment | ☐ |
| All of the above | Bitwarden secure note | ☐ |
