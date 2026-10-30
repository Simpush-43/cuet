# Study Buddy: CUET UG 2027

Chapter-wise study site: YouTube lecture player with quality controls, notes, mind map, DPP, timed test and progress tracker.  
Frontend: React + Vite. Backend: Express + **SQLite (local) or PostgreSQL (cloud)**, with an admin panel for managing YouTube lectures and uploading videos.

## How it fits together
- The **backend** stores subjects, chapters, questions, uploaded videos, and **YouTube lectures** in a database.
- The **frontend** loads everything from `/api/content` and `/api/lectures`. If the backend is down, it falls back to bundled `src/data` content.
- One Express server serves both the built site and the API — a single deploy.
- **Database**: SQLite by default locally. Set `DATABASE_URL` (Postgres) for 100% persistent cloud storage.

## Run locally
```bash
npm install
cp .env.example .env      # then set ADMIN_PASSWORD and TOKEN_SECRET
npm run seed              # seeds subjects, chapters, and bundled lectures into the database
npm run dev:server        # API on http://localhost:4000   (terminal 1)
npm run dev               # site on http://localhost:5173  (terminal 2)
```
Open `http://localhost:5173/#/admin`, log in, and manage YouTube lectures or upload video files.

## Deploy on Render (Free Tier — with Cloud PostgreSQL)

> **For permanent data that survives spin-downs, use Render's free PostgreSQL.**

1. Push to GitHub, go to [render.com](https://render.com) dashboard.
2. Click **New +** → **PostgreSQL** — create a free database (e.g. `study-buddy-db`).
3. Copy the **Internal Database URL** from the database info page.
4. Click **New +** → **Web Service** from your GitHub repo.
5. **Build command:** `npm install && npm run build`  
   **Start command:** `npm start`
6. In the Web Service **Environment** tab, add these variables:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | `your-secret-password` |
| `TOKEN_SECRET` | `a-long-random-string` |
| `DATABASE_URL` | *(paste Internal Database URL from step 3)* |

7. Deploy! The server auto-creates all tables and seeds subjects + bundled lectures on first boot.

> **No Disk attachment needed when using PostgreSQL.** All lectures, chapters, and questions are stored permanently in the cloud database.

### Render Free Tier — SQLite (without PostgreSQL)
If you do not set `DATABASE_URL`, the server uses SQLite stored on the ephemeral container disk:
- Data survives refreshes and normal restarts.
- Data is **wiped on container spin-down** (after 15 min of inactivity on free tier).
- **Mitigation:** Bundled lectures in `src/data/lectures.js` are auto-seeded on every cold boot. Use the Admin panel's **"Copy Code for src/data/lectures.js"** button to bake newly added lectures permanently into the repo.

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `ADMIN_PASSWORD` | yes | — | Admin panel password |
| `TOKEN_SECRET` | recommended | random (changes on restart) | Signs auth tokens |
| `DATABASE_URL` | no | — | PostgreSQL connection URL. If set, Postgres is used instead of SQLite |
| `DATA_DIR` | no | `./data` | Where SQLite file and uploaded video files are stored |
| `PORT` | no | `4000` | Server port |
| `MAX_UPLOAD_MB` | no | `500` | Max upload file size |

## API Reference

### Public
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check (shows if Postgres is active) |
| `GET` | `/api/content` | All subjects, chapters, questions, video links, lectures |
| `GET` | `/api/lectures` | All YouTube lectures (filter with `?subjectId=` or `?chapterId=`) |
| `GET` | `/api/lectures/:id` | Single lecture |
| `GET` | `/api/videos/:id/stream` | Stream an uploaded video file (supports seeking) |

### Admin (require Bearer token from `/api/admin/login`)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/login` | `{ password }` → returns 12-hour token |
| `POST` | `/api/lectures` | Add YouTube lecture |
| `PUT` | `/api/lectures/:id` | Edit YouTube lecture |
| `DELETE` | `/api/lectures/:id` | Delete YouTube lecture |
| `POST` | `/api/lectures/sync` | Re-sync lectures from client cache after cold boot |
| `GET` | `/api/admin/videos` | List uploaded video files |
| `POST` | `/api/admin/videos` | Upload a video file (multipart: `file`, `chapterId`, `title`) |
| `DELETE` | `/api/admin/videos/:id` | Delete a video file |
| `PUT` | `/api/admin/chapters/:id` | Create or update a chapter (notes, mind map, DPP, test) |

## Adding/Bundling Lectures Permanently

### Option A: Admin Panel (easiest, requires PostgreSQL for full persistence)
1. Go to `/#/admin` → log in → **YouTube Lectures (Admin Manager)** tab.
2. Fill in Title, YouTube URL, Subject, and Chapter → **Add Lecture**.
3. With `DATABASE_URL` set, data persists permanently in Postgres.

### Option B: Bake into Source Code
1. In the Admin panel, click **"📋 Copy Code for src/data/lectures.js"**.
2. Paste into [`src/data/lectures.js`](src/data/lectures.js).
3. Commit and push — Render redeploys automatically.

### Option C: Edit src/data directly
Edit or add a chapter file in `src/data/chapters/`, register it in `src/data/index.js`, then run `npm run seed -- --force`.

## Content rules
- Upload only videos you made or have the rights to share. Do not upload anyone else's paid course material.
- Write notes, DPPs and tests from NCERT and NTA previous-year papers.
- If you generate questions with AI, solve every one yourself before publishing.
