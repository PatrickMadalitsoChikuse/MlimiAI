# Mlimi AI — Malawi Agriculture Chatbot

A modern chatbot for Malawian farmers. Flask backend using an external English model inference endpoint
(swappable for future language-specific models), React + Tailwind + shadcn-style UI
with a farmer-themed palette.

```
chatbot/
├── backend/        Flask API (external model inference, streaming-compatible SSE, SQLite auth)
└── frontend/       Vite + React + TypeScript + Tailwind + shadcn UI
```

---

## Quick start (local)

### 1. Backend

```bash
cd chatbot/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
$EDITOR .env             # set ENGLISH_MODEL_URL, change JWT_SECRET, etc.

python app.py            # runs on http://localhost:5050
```

On first run the backend:
- Creates `mlimi.db` (SQLite) next to `app.py`
- Auto-applies any schema migrations
- **Seeds the default admin + test user** (see [Default users](#default-users))

### 2. Frontend

```bash
cd chatbot/frontend
npm install
npm run dev              # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5050`, so start the
backend first and the frontend connects automatically.

---

## Default users

These are created on the **first** backend start (idempotent — re-running
doesn't overwrite existing users). All credentials are configurable via env
vars in `backend/.env`.

| Role  | Email (default)        | Password (default) | Where to change                  |
| ----- | ---------------------- | ------------------ | -------------------------------- |
| Admin | `admin@mlimi.local`    | `admin12345`       | `DEFAULT_ADMIN_*` env vars       |
| User  | `farmer@mlimi.local`   | `farmer12345`      | `DEFAULT_USER_*` env vars        |

The admin account can:
- View the `/admin` panel (dashboard, user management, system info)
- See chat analytics (signups, chat volume, language split, token usage / est. cost)
- Suspend / re-enable / delete users
- Reset any user's password (returns a one-time temp password)

**Change the default passwords before deploying to production.** Set them in
`.env` *before* the first `python app.py` run, or change them later via the
admin "Reset password" action in the UI.

To skip the seeded test user entirely, set `SEED_DEFAULT_USER=0`.

### Adding extra admins

The `DEFAULT_ADMIN_EMAIL` is **always** treated as admin. To grant admin to
additional accounts:

```bash
# in backend/.env
ADMIN_EMAILS=alice@example.com,bob@example.com
```

These users still need to sign up (or be seeded) first; the env var just
controls who the backend recognises as admin.

---

## Environment variables

All live in `backend/.env`. See `backend/.env.example` for a complete template.

| Var                     | Default                | Notes                                              |
| ----------------------- | ---------------------- | -------------------------------------------------- |
| `ENGLISH_MODEL_URL`    | bundled ngrok URL      | English model `/chat` inference endpoint           |
| `ENGLISH_MODEL_NAME`   | `english-agriculture-model` | Display/logging name for the English model   |
| `MODEL_TIMEOUT_SECONDS`| `120`                  | Timeout for model inference calls                  |
| `PORT`                  | `5050`                 | Flask listen port                                  |
| `JWT_SECRET`            | dev-only fallback      | **Change for production** — random 48+ char string |
| `MLIMI_DB`              | `backend/mlimi.db`     | SQLite path                                        |
| `DEFAULT_ADMIN_EMAIL`   | `admin@mlimi.local`    | Seeded admin email (always-admin)                  |
| `DEFAULT_ADMIN_NAME`    | `Mlimi Admin`          |                                                    |
| `DEFAULT_ADMIN_PASSWORD`| `admin12345`           | Only used on first seed                            |
| `DEFAULT_USER_EMAIL`    | `farmer@mlimi.local`   |                                                    |
| `DEFAULT_USER_NAME`     | `Test Farmer`          |                                                    |
| `DEFAULT_USER_PASSWORD` | `farmer12345`          | Only used on first seed                            |
| `SEED_DEFAULT_USER`     | `1`                    | Set `0` to skip seeding the test user              |
| `ADMIN_EMAILS`          | *(empty)*              | Extra admin emails, comma-separated                |

---

## Deployment

### Recommended: single-host deploy with a reverse proxy

The simplest production setup is one VPS with:
- Backend run by `gunicorn`
- Frontend built and served as static files by `nginx`
- `nginx` proxies `/api/*` to the backend on `127.0.0.1:5050`

#### 1. Build the frontend

```bash
cd chatbot/frontend
npm install
npm run build            # outputs to chatbot/frontend/dist/
```

#### 2. Run the backend with gunicorn

```bash
cd chatbot/backend
source venv/bin/activate
pip install gunicorn
gunicorn -w 2 -k gthread -b 127.0.0.1:5050 app:app
```

For SSE streaming, `gthread` (or `gevent`) workers handle long-lived
connections better than the default sync worker. Two workers is fine for
small-scale traffic; scale up based on concurrent users.

Recommended systemd unit (`/etc/systemd/system/mlimi-backend.service`):

```ini
[Unit]
Description=Mlimi AI backend
After=network.target

[Service]
User=mlimi
WorkingDirectory=/srv/mlimi/chatbot/backend
EnvironmentFile=/srv/mlimi/chatbot/backend/.env
ExecStart=/srv/mlimi/chatbot/backend/venv/bin/gunicorn \
  -w 2 -k gthread -b 127.0.0.1:5050 app:app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now mlimi-backend
```

#### 3. nginx vhost

```nginx
server {
  listen 80;
  server_name mlimi.example.com;

  # Static frontend
  root /srv/mlimi/chatbot/frontend/dist;
  index index.html;

  location / {
    try_files $uri /index.html;          # SPA fallback
  }

  # API proxy
  location /api/ {
    proxy_pass http://127.0.0.1:5050;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # SSE streaming: disable buffering, allow long reads
    proxy_buffering off;
    proxy_read_timeout 600s;
  }
}
```

Add TLS with `certbot --nginx -d mlimi.example.com`.

#### 4. First boot

SSH in, then:

```bash
# Edit env (especially JWT_SECRET, default admin password, ENGLISH_MODEL_URL)
sudo -u mlimi $EDITOR /srv/mlimi/chatbot/backend/.env

# Start the backend — this seeds the default users
sudo systemctl restart mlimi-backend

# Visit the site, log in as the default admin, change the password
#   (sign in and reset via the admin panel)
```

### Alternative: containerised deploy

You can wrap this in Docker easily — `backend/` is a single Flask app and
`frontend/dist/` is static. A two-stage Compose file (backend container +
nginx serving the built frontend) maps cleanly to the single-host setup.
Not included here; ask if you want a `Dockerfile` / `compose.yaml` scaffold.

### Deploy on Render (Blueprint, free tier)

A `render.yaml` at the **repo root** defines a single Render Web Service
that builds the frontend, runs the Flask backend with gunicorn, and serves
the built React app from the same origin.

**Free-tier trade-offs:**
- No persistent disk → SQLite is **wiped on every redeploy / restart**.
  The admin + test farmer accounts are re-seeded on every boot from env
  vars, so login still works after a redeploy — but any *signed-up* users
  and their chat analytics are gone.
- Service sleeps after ~15 min idle. First request after sleep is a
  30–60s cold start.
- 750 instance-hours/month combined across all free services.

#### 1. Push the repo to GitHub

The Blueprint expects `render.yaml` at the repo root and `rootDir: chatbot`
inside it (already set).

#### 2. Create the Blueprint

In Render: **New → Blueprint → connect this repo**. Render reads
`render.yaml` and prompts for the secrets marked `sync: false`:

| Env var                  | What to set it to                                  |
| ------------------------ | -------------------------------------------------- |
| `DEFAULT_ADMIN_EMAIL`    | Your admin email (always treated as admin)         |
| `DEFAULT_ADMIN_PASSWORD` | Password the admin will use to log in             |

Everything else is pre-set in `render.yaml`:
- `JWT_SECRET` is auto-generated once by Render and pinned.
- `ENGLISH_MODEL_URL` points to the English model inference endpoint.
- `SEED_DEFAULT_USER` is left at its default (`1`) so the demo farmer
  account `farmer@mlimi.local` / `farmer12345` is always available after
  a redeploy. Set to `0` in the dashboard to skip it.

#### 3. First deploy

Render runs:

```bash
pip install -r backend/requirements.txt
cd frontend && npm ci && npm run build
# then:
cd backend && gunicorn -w 1 -k gthread --threads 8 --timeout 120 -b 0.0.0.0:$PORT app:app
```

Only one gunicorn worker on the free tier — free instances have ~512 MB
RAM, which a single `gthread` worker with 8 threads handles fine for a
demo. Health check is wired to `/api/health`.

#### 4. Log in

Visit your `*.onrender.com` URL and log in with the
`DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` you set in step 2.

> **Heads-up:** because the SQLite DB is ephemeral on free tier, changing
> the admin password via the UI only lasts until the next redeploy or
> restart. To rotate, update `DEFAULT_ADMIN_PASSWORD` in the Render
> dashboard and let the service restart.

#### Notes & gotchas

- **Cold starts:** if the service has been idle 15 min, the first request
  spins it back up (30–60s). Subsequent requests are normal speed.
- **Build environment:** Render's Python runtime ships with Node at build
  time. `NODE_VERSION` is pinned to 20.11.1 in the blueprint.
- **SSE streaming:** `gthread` with 8 threads handles long-lived
  `/api/chat/stream` connections. `--timeout 120` applies per-request;
  raise it if you have very long generations.
- **When you outgrow free tier:** switch `plan: free` → `plan: starter`
  in `render.yaml`, add a `disk:` block mounted at `/var/data`, and set
  `MLIMI_DB=/var/data/mlimi.db`. ~$7.25/mo, persistence solved.

---

## Endpoints

### Public
- `GET  /api/health`        — sanity check
- `POST /ussd`              — Africa's Talking USSD callback for user registration/login

### Auth
- `POST /api/auth/signup`   — `{ name, email, password }` → `{ token, user }`
- `POST /api/auth/login`    — `{ email, password }`        → `{ token, user }`
- `GET  /api/auth/me`       — requires bearer token; returns `{ user }` (includes `isAdmin`, `disabled`)

### Chat (auth required)
- `POST /api/chat`          — `{ messages, language? }` → `{ reply }`
- `POST /api/chat/stream`   — SSE stream of `event: token`, ends with `event: done`

### Admin (admin only — 403 otherwise)
- `GET    /api/admin/stats`                       — totals + 30-day series + language split
- `GET    /api/admin/users?q=`                    — list users (search by name/email)
- `PATCH  /api/admin/users/:id`                   — `{ disabled?, name? }`
- `DELETE /api/admin/users/:id`
- `POST   /api/admin/users/:id/reset-password`    — `{ tempPassword }`

---

## Routes (frontend)

| Path      | Access    | What it is                                  |
| --------- | --------- | ------------------------------------------- |
| `/`       | Public    | Landing page                                |
| `/login`  | Public    | Sign-in                                     |
| `/signup` | Public    | Account creation                            |
| `/chat`   | Auth      | The chatbot                                 |
| `/admin`  | Admin     | Dashboard / users / system                  |

---

## USSD via Africa's Talking

The backend includes a simple user-only USSD flow at:

```txt
POST /ussd
```

Configure your Africa's Talking USSD callback URL to:

```txt
https://mlimiai-backend.onrender.com/ussd
```

Current USSD menu:

```txt
Welcome to Mlimi AI
1. Register
2. Login
```

After login:

```txt
Welcome back, Farmer Name.
Ask your farming question, or type 0 to exit:
```

After each AI answer, the session stays open for free-text chat:

```txt
[short AI answer]

Ask another question, or type 0 to exit:
```

Registration stores users in the same SQLite `users` table used by the web app.
USSD accounts use the caller's phone number automatically through an internal
login ID like `ussd-265...@mlimi.local`, so users only enter their name and PIN.
Login only asks for the PIN from the same phone number. After login, every user
input is treated as a farming question until the user types `0` or cancels the
USSD session. Responses use the same English AI model endpoint as the web chat
and are shortened for USSD. Admin functions are not available in USSD.

---

## Languages

Two languages ship today: **English** and **Chichewa**. The user picks via the
selector in the chat header; the choice is sent with every request and the
backend swaps in a language-locked system prompt that strictly instructs the
model to reply in that language (with narrow exceptions for proper nouns,
technical terms, and untranslatable local words like *nsima*).

To add more languages: edit `LANGUAGES` in `frontend/src/components/Header.tsx`
and add a `<code>_LANGUAGE_RULE` + branch in
`backend/app.py::system_prompt_for`.

---

## Switching to the fine-tuned model

In `backend/app.py`, both `chat()` and `chat_stream()` build the same
`messages` array and send it to `ENGLISH_MODEL_URL`. To add Chichewa later, add a
`CHICHEWA_MODEL_URL` env var and branch on `language` inside the chat handler.
The frontend, auth, and analytics logging do not need to change.

---

## Design notes

- **Palette** — leaf greens, harvest gold, cream background, soil dark text.
  Tokens live in `frontend/tailwind.config.js` and `frontend/src/index.css`.
- **UI primitives** — minimal shadcn-style components in `frontend/src/components/ui/`.
- **Streaming** — backend yields SSE `event: token` chunks; frontend parses them
  in `src/lib/chat.ts` via `fetch` + `ReadableStream`.
- **Persistence** — conversations live in `localStorage` (`mlimi.conversations.v1`).
  Server-side, only token-usage metadata is logged per request (no message content).

---

## Security checklist before deploying

- [ ] Generate a fresh `JWT_SECRET` (48+ random chars) and put it in `.env`.
- [ ] Change `DEFAULT_ADMIN_PASSWORD` (or sign in and reset it on first boot).
- [ ] Set `SEED_DEFAULT_USER=0` if you don't want the test farmer account in prod.
- [ ] Terminate TLS in front of the backend (don't expose Flask directly).
- [ ] Restrict port 5050 to localhost; only nginx should reach it.
- [ ] Schedule SQLite backups (copy `mlimi.db` periodically, or migrate to Postgres).
# mlimi
