# Support Ticket Tracker

A small full-stack app for logging support tickets and moving them through `open → in-progress → done`.

**Live:** https://main.d9ao2e29xnpbw.amplifyapp.com

- **Frontend:** React + TypeScript + Vite, zustand for state, axios for HTTP
- **Backend:** FastAPI + Pydantic, run by gunicorn with uvicorn workers
- **Database:** Supabase Postgres
- **Hosting:** AWS Amplify (frontend, deployed from this repo) and Elastic Beanstalk (backend)

## Architecture

```
Browser
  │  https://main.<app-id>.amplifyapp.com
  ▼
Amplify Hosting ── serves the built React app (frontend/dist)
  │  rewrite: /api/<*>  →  https://<cloudfront-domain>/<*>
  ▼
CloudFront ── HTTPS in front of Beanstalk (caching disabled)
  │  http
  ▼
Elastic Beanstalk (single t3.micro, nginx → gunicorn :8000) ── FastAPI
  │  supabase-py, secret key
  ▼
Supabase Postgres (tickets table, RLS on)
```

The frontend only ever calls `/api/...` on its own origin. Locally the Vite dev server proxies that to
FastAPI; in production an Amplify rewrite does the same job. Both strip the `/api` prefix, so the backend
routes are plain `/tickets` and `/health`. Because the browser never talks to another origin, there is no
CORS configuration and no backend URL baked into the bundle.

CloudFront is there for one reason: Amplify rewrite targets must be HTTPS, and a single-instance Beanstalk
environment only serves HTTP.

## Data model

`backend/sql/001_create_tickets.sql`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | primary key, `gen_random_uuid()` |
| `title` | text | required, not blank |
| `description` | text | optional |
| `priority` | text | `low` / `medium` / `high`, default `medium` |
| `status` | text | `open` / `in-progress` / `done`, default `open` |
| `created_date` | timestamptz | set on insert, never changes |
| `last_modified_date` | timestamptz | equal to `created_date` on insert, bumped by a trigger on every update |

Allowed values are enforced twice: by Pydantic enums in the API and by `CHECK` constraints in Postgres, so
bad data can't get in through another client either.

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/health` | 200 | |
| GET | `/tickets?status=&priority=` | 200, newest first | 422 bad filter value |
| GET | `/tickets/{id}` | 200 | 404, 422 bad UUID |
| POST | `/tickets` | 201 | 422 |
| PATCH | `/tickets/{id}` | 200 | 404, 422 (empty body, null title/priority/status) |
| DELETE | `/tickets/{id}` | 204 | 404 |

Unknown fields are rejected (`extra="forbid"`), so a client can't set `created_date` or `id`.
Interactive docs: `/docs` on the backend.

## Project layout

```
backend/
  app/
    main.py              app + /health
    api/tickets.py       routes: HTTP concerns only
    services/tickets.py  Supabase queries
    schemas/tickets.py   Pydantic models and enums
    core/config.py       settings from the environment
    db/supabase.py       one shared client
  sql/001_create_tickets.sql
  requirements.txt
  Procfile               how Beanstalk starts the app
  .env.example
frontend/
  src/
    api/client.ts        every HTTP call
    store/useTicketStore.ts
    components/          TicketForm, TicketList, TicketItem
    utils/normalizeApiError.ts
    types.ts
  vite.config.ts         /api dev proxy
amplify.yml              Amplify build spec (monorepo, appRoot: frontend)
```

## Running locally

Requirements: Python 3.12, Node 22, pnpm, a Supabase project.

1. Create the table: run `backend/sql/001_create_tickets.sql` in the Supabase SQL editor.

2. Backend:

   ```bash
   cd backend
   python3.12 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   cp .env.example .env        # fill in SUPABASE_URL and SUPABASE_SECRET_KEY
   .venv/bin/uvicorn app.main:app --reload --port 8010
   ```

3. Frontend (second terminal):

   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

   Open http://localhost:5173. Requests to `/api` are proxied to the backend on port 8010.

## Deployment

### Backend: Elastic Beanstalk

1. Zip the backend so `Procfile` sits at the root of the archive:

   ```bash
   cd backend
   zip -r ../backend.zip Procfile requirements.txt app -x '*__pycache__*'
   ```

2. Create an environment: Python 3.12 on Amazon Linux 2023, single instance, `t3.micro`, upload the zip.
3. Add environment properties `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
4. Check `http://<env>.<region>.elasticbeanstalk.com/health`.

Later deploys: build a new zip and use **Upload and deploy** on the environment.

### HTTPS in front of the backend: CloudFront

One distribution with the Beanstalk domain as a custom origin (HTTP only), all HTTP methods allowed,
`CachingDisabled` cache policy and `AllViewerExceptHostHeader` origin request policy.

### Frontend: Amplify

1. Connect the GitHub repo, branch `main`, mark it as a monorepo with root `frontend`. Amplify picks up
   `amplify.yml`.
2. Add the rewrite rules under **Hosting → Rewrites and redirects** (order matters):

   ```json
   [
     { "source": "/api/<*>", "target": "https://<cloudfront-domain>/<*>", "status": "200", "condition": null },
     { "source": "/<*>", "target": "/index.html", "status": "404-200", "condition": null }
   ]
   ```

Every push to `main` rebuilds and redeploys the frontend.

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | `backend/.env`, Beanstalk env properties | Supabase project URL |
| `SUPABASE_SECRET_KEY` | `backend/.env`, Beanstalk env properties | server-side key, bypasses RLS |

The frontend needs no configuration. Row Level Security is enabled on `tickets` with no policies, so the
public key can't read or write it; only the backend's secret key can.

## Known limitations and next steps

- No authentication: anyone with the URL can create and edit tickets.
- The backend runs in Sydney while the database is in Mumbai (the AWS account is limited to one region),
  which adds a few hundred milliseconds to every API call. Both should live in the same region.
- No pagination on `GET /tickets`.
- No automated tests yet; the API was checked with curl against a live database.
- The backend is deployed by hand. A GitHub Actions or CodePipeline job could build the zip and deploy it
  on push, like the frontend.
- For production: a load-balanced Beanstalk environment with an ACM certificate on a custom domain (which
  removes the need for CloudFront), WAF in front of the API, and CloudWatch log streaming with alarms.
