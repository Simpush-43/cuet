# Study Buddy: CUET UG 2027

Chapter-wise study site: lecture (your uploaded video or a YouTube embed), notes, mind map, DPP, timed test and progress tracker.
Frontend: React + Vite. Backend: Express + SQLite, with an admin page for uploading videos.

## How it fits together
- The **backend** stores subjects, chapters, questions and uploaded videos (SQLite file + a folder of videos in `DATA_DIR`).
- The **frontend** loads everything from `/api/content`. If the backend is down or empty, it falls back to the content in `src/data`, so the site still works.
- In production one Express server serves both the built site and the API, so there is a single thing to deploy.

## Run locally
```bash
npm install
cp .env.example .env      # then set ADMIN_PASSWORD and TOKEN_SECRET
npm run seed              # copies src/data content into the database (empty DB only)
npm run dev:server        # API on http://localhost:4000   (terminal 1)
npm run dev               # site on http://localhost:5173  (terminal 2)
```
Open `http://localhost:5173/#/admin`, log in, pick a chapter and upload a video.

## Deploy (needs a host with a persistent disk)
Videos and the SQLite file are written to disk, so use a host that keeps a disk between deploys
(Render with a Disk, Railway with a Volume, Fly.io with a Volume, or any VPS).
Vercel and Netlify functions cannot keep uploaded files, so use them only for a static-only deploy (the site then shows the bundled content and has no uploads).

Render example:
1. Push to GitHub, create a **Web Service** from the repo.
2. Build command: `npm install && npm run build`   Start command: `npm start`
3. Add a **Disk** mounted at `/var/data` and set the env vars below.
4. Run `npm run seed` once from the Render shell.

Environment variables: `ADMIN_PASSWORD`, `TOKEN_SECRET` (long random string), `DATA_DIR=/var/data`, optional `MAX_UPLOAD_MB` (default 500).

## API
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/content` | no | subjects, chapters, questions, video links |
| GET | `/api/videos/:id/stream` | no | stream an uploaded video (supports seeking) |
| POST | `/api/admin/login` | no | `{ password }` returns a token (12 hours) |
| GET | `/api/admin/videos` | admin | list uploads |
| POST | `/api/admin/videos` | admin | multipart: `file`, `chapterId`, `title` |
| DELETE | `/api/admin/videos/:id` | admin | delete a video and its file |
| PUT | `/api/admin/chapters/:id` | admin | create or update a chapter (same shape as `src/data/chapters/*.js`) |

## Costs and limits to know about
- Video files use disk space and bandwidth. For long lectures, an unlisted YouTube video pasted into `videoUrl` is usually cheaper and smoother.
- Student progress and test scores are still stored in each student's own browser. Student accounts and synced scores would be the next backend feature.

## Content rules
- Upload only videos you made or have the rights to share. Do not upload anyone's paid course material.
- Write notes, DPPs and tests from NCERT and NTA previous-year papers.
- If you generate questions with AI, solve every one yourself before publishing.

## Add content
- Edit or add a file in `src/data/chapters/`, register it in `src/data/index.js`, then `npm run seed -- --force`, **or**
- send the chapter JSON to `PUT /api/admin/chapters/:id` with your admin token.
# cuet
