# AutoResolve Backend

Node.js/Express backend for Gmail OAuth, email sync (history + Pub/Sub), and ChatGPT-powered reply generation.

## Quick start (after Supabase + SQL migration)

1. **Redis** – The queue needs Redis. Run locally: `docker run -p 6379:6379 redis` (or use [Upstash](https://upstash.com) free Redis and set `REDIS_URL` in `.env`).
2. **Backend** – From repo root: `npm run dev:backend` (or `cd backend && npm run dev`). Server runs at `http://localhost:3001`.
3. **Frontend** – In another terminal: `npm run dev`. Open `http://localhost:3000/dashboard`.
4. **Connect Gmail** – Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `backend/.env` (from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0). Set redirect URI to `http://localhost:3001/api/auth/gmail/callback`.
5. **AI replies** – Add `OPENAI_API_KEY` to `backend/.env` for reply generation. Without it, drafts won’t be generated.

## Setup

1. **Install dependencies**

   ```bash
   cd backend && npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – PostgreSQL connection string
   - `REDIS_URL` – Redis connection string (default: `redis://localhost:6379`)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` – Gmail OAuth
   - `OPENAI_API_KEY` – OpenAI API key
   - `ENCRYPTION_KEY` – 32-byte key (base64): `openssl rand -base64 32`
   - `FRONTEND_URL` – Frontend origin (e.g. `http://localhost:3000`)

   Optional for Pub/Sub: `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_PUBSUB_TOPIC`, `GOOGLE_PUBSUB_AUDIENCE`, `GOOGLE_PUBSUB_VERIFICATION_ENABLED=true`.

3. **Database: Connect with Supabase**

   Follow these steps exactly.

   **Step A – Create a Supabase project**

   1. Go to **[supabase.com](https://supabase.com)** and sign in (or sign up with GitHub/email).
   2. On the dashboard, click the green **"New project"** button.
   3. Choose your **Organization** (or create one).
   4. Fill in:
      - **Name:** e.g. `autoresolve`
      - **Database Password:** choose a strong password and **save it** (you need it for `DATABASE_URL`).
      - **Region:** pick the one closest to you.
   5. Click **"Create new project"**. Wait until the project is ready (1–2 minutes).

   **Step B – Get your database connection string**

   **Option 1 – Connect panel (easiest)**  
   1. From your project dashboard, in the **left sidebar** click **"Project"** (or your project name) so you’re on the project home.
   2. Look for a **"Connect"** button or **"Connect to your database"** panel on the page.
   3. Open it and find **"Direct connection"** or **"URI"** – that’s your connection string. Copy it and replace `[YOUR-PASSWORD]` with your database password.

   **Option 2 – Project Settings → Database**  
   1. In the left sidebar, click the **gear icon** at the bottom → **"Project Settings"**.
   2. In the **Project Settings** left menu, scroll down. Click **"Database"** (it’s in the list under General, Compute and Disk, Infrastructure, etc. – keep scrolling if you don’t see it).
   3. On the Database page, scroll to **"Connection string"**.
   4. Select the **"URI"** tab (not "JDBC" or "DotNet").
   5. You’ll see **Direct connection** (port 5432, host `db.xxxxx.supabase.co`) and optionally **Session** / **Transaction** pooler (port 6543). For this backend, use the **Direct** URI.
   6. Copy the URI. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`
   7. Replace **`[YOUR-PASSWORD]`** with the database password you set in Step A.
   8. In your project, open **`backend/.env`** and set:
      ```env
      DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxxxxxxxxx.supabase.co:5432/postgres
      ```
      (Use your real password and the host from the Supabase URI.)

   **Step C – Create the tables (run the migration)**

   1. In the Supabase left sidebar, click **"SQL Editor"** (icon that looks like `</>`).
   2. Click **"New query"** (top right).
   3. Open the file **`backend/src/db/migrations/0000_initial.sql`** in your code editor, select all, and copy.
   4. Paste the full SQL into the Supabase SQL Editor.
   5. Click **"Run"** (or press Cmd/Ctrl + Enter).
   6. You should see **"Success. No rows returned"**. That’s correct.

   **Step D – Check that tables exist**

   1. In the left sidebar, click **"Table Editor"**.
   2. You should see tables: **users**, **oauth_tokens**, **email_threads**, **emails**, **email_replies**.
   3. Run the Guardrails migration: open **`backend/src/db/migrations/0001_user_guardrails.sql`**, copy its contents into a new SQL Editor query, and run it. You should then see **user_guardrails** in the Table Editor.
   4. Run the Notifications migration: open **`backend/src/db/migrations/0002_notifications.sql`**, copy its contents into a new SQL Editor query, and run it. You should then see **notifications** in the Table Editor.
   5. **Required:** Run the notification thread_id migration: open **`backend/src/db/migrations/0003_notification_thread_id.sql`**, copy its contents into a new SQL Editor query, and run it. This adds **thread_id** to **notifications**. Without it you will see `column "thread_id" does not exist` when loading notifications or creating human-intervention notifications.
   6. If you see all tables, the backend is ready to use this database.

   **If you use the pooler (Transaction mode) instead**

   - In **Project Settings → Database → Connection string**, copy the **Transaction** / pooler URI (port 6543).
   - Replace `[YOUR-PASSWORD]` and set that as `DATABASE_URL` in `backend/.env`. The rest of the steps are the same.

4. **Run**

   - API server: `npm run dev`
   - Email worker: `npm run worker` (in another terminal)
   - Token refresh worker: `npm run token-worker` (optional)

## Troubleshooting

- **"Gmail connection failed"** – Check the **backend terminal** for the real error. Common causes:
  - **Redirect URI mismatch:** `GOOGLE_REDIRECT_URI` in `.env` must match **exactly** what’s in [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth 2.0 Client ID → **Authorized redirect URIs** (e.g. `http://localhost:3001/api/auth/gmail/callback` — no trailing slash unless it’s in the Console).
  - **Access blocked / test users:** Add your Google account under OAuth consent screen → **Test users** (see earlier in this README).
  - **Database/encryption:** Ensure Supabase is reachable and `ENCRYPTION_KEY` is set (32 bytes, e.g. `openssl rand -base64 32`).
- **"Database unreachable" / ENOTFOUND** – Backend can’t resolve or reach your Supabase host. Fix: (1) Check internet; (2) In [Supabase Dashboard](https://supabase.com/dashboard), open the project and **restore** it if paused; (3) Confirm `DATABASE_URL` in `.env` matches the project’s connection string; **Better fix:** Use the **connection pooler** URL. In Supabase Dashboard → your project → Project Settings → Database → Connection string → URI tab, copy the **Session** or **Transaction** pooler URI (host `aws-0-REGION.pooler.supabase.com`). Replace `[YOUR-PASSWORD]` and set as `DATABASE_URL` in `backend/.env`. The pooler host often resolves when the direct host does not. Or try another network (e.g. phone hotspot) or disable VPN.
- **EADDRNOTAVAIL / connection read error** – Supabase’s pooler requires TLS. The backend enables SSL automatically when `DATABASE_URL` contains `supabase.com`. If you still see this, confirm you’re using the pooler URI (not the direct DB host) and that no firewall or VPN is blocking outbound 5432.
- **SELF_SIGNED_CERT_IN_CHAIN** – The backend uses `rejectUnauthorized: false` for Supabase so the pooler’s certificate chain is accepted. If you still see this after restarting the backend, ensure `DATABASE_URL` points at a Supabase host (so the SSL override is applied).
- **column "thread_id" does not exist** – Run the migration **`backend/src/db/migrations/0003_notification_thread_id.sql`** in the Supabase SQL Editor (Step D.5 above). Copy the file contents, paste into a new query, run it. Then restart the backend.
- **SELF_SIGNED_CERT_IN_CHAIN** or **Sync failed: self-signed certificate** – The backend uses `rejectUnauthorized: false` for Supabase. If you still see this, run the backend with Node’s TLS check disabled for that process only: `NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev` (or add `NODE_TLS_REJECT_UNAUTHORIZED=0` to your shell before starting). Use only in development.
- **EADDRNOTAVAIL** or **read EADDRNOTAVAIL** – Usually a stale or dropped DB connection. The pool logs the error and continues. Restart the backend; if it persists, check network/VPN and that `DATABASE_URL` uses the Supabase **pooler** URI (Transaction mode, port 6543).

## API

- `GET /health` – Health check
- `GET /api/auth/gmail` – Start Gmail OAuth
- `GET /api/auth/gmail/callback` – OAuth callback
- `GET /api/auth/status?userId=` – Auth status
- `POST /api/auth/gmail/disconnect` – Disconnect (body: `{ userId }`)
- `POST /api/emails/sync` – Trigger sync (body: `{ userId }`)
- `GET /api/emails/threads?userId=` – List threads
- `GET /api/emails/threads/:threadId?userId=` – Thread + messages
- `GET /api/emails/replies?userId=` – Draft replies
- `POST /api/emails/replies/:replyId/approve` – Approve and send (body: `{ userId }`)
- `POST /api/emails/replies/:replyId/reject` – Reject draft (body: `{ userId }`)
- `PATCH /api/users/me` – Set mode (body: `{ userId, mode: "auto" | "approval" }`)
- `POST /api/pubsub/gmail` – Pub/Sub push (internal)

Frontend should set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001`) when calling this API.
