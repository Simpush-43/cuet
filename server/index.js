import fs from 'node:fs';
import express from 'express';
import {
  PORT, DIST_DIR, ADMIN_PASSWORD, TOKEN_IS_RANDOM, MAX_UPLOAD_MB,
} from './config.js';
import db from './db.js';
import { getContent, upsertChapter, validateChapter } from './content.js';
import { checkPassword, signToken, requireAdmin, loginGuard } from './auth.js';
import { videoUpload, filePath } from './upload.js';
import lectureRouter from './lectures.js';
import { bootstrapDatabase } from './bootstrap.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

// ---------- public ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, isPostgres: db.isPostgres }));

app.get('/api/content', async (_req, res, next) => {
  try {
    const data = await getContent();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.use('/api/lectures', lectureRouter);

// Range requests (seeking) are handled by res.sendFile.
app.get('/api/videos/:id/stream', async (req, res, next) => {
  try {
    const v = await db.get('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (!v || !fs.existsSync(filePath(v.file_name))) return res.status(404).json({ error: 'Video not found.' });
    res.type(v.mime);
    res.sendFile(filePath(v.file_name));
  } catch (err) {
    next(err);
  }
});

// ---------- admin ----------
app.post('/api/admin/login', loginGuard, (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'ADMIN_PASSWORD is not set on the server.' });
  if (!checkPassword(req.body?.password)) {
    req.recordFail();
    return res.status(401).json({ error: 'Wrong password.' });
  }
  res.json({ token: signToken() });
});

app.get('/api/admin/videos', requireAdmin, async (_req, res, next) => {
  try {
    const videos = await db.all(`
      SELECT v.id, v.title, v.chapter_id AS "chapterId", v.original_name AS "originalName", v.size, v.created_at AS "createdAt",
             c.title AS "chapterTitle"
      FROM videos v JOIN chapters c ON c.id = v.chapter_id ORDER BY v.created_at DESC
    `);
    res.json(videos);
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/videos', requireAdmin, (req, res) => {
  videoUpload(req, res, async (err) => {
    if (err) {
      const tooBig = err.code === 'LIMIT_FILE_SIZE';
      return res.status(tooBig ? 413 : 400).json({ error: tooBig ? `File is over ${MAX_UPLOAD_MB} MB.` : err.message });
    }
    const { chapterId, title } = req.body || {};
    const drop = () => req.file && fs.rm(req.file.path, () => {});
    if (!req.file) return res.status(400).json({ error: 'Choose a video file.' });

    try {
      const chapterExists = await db.get('SELECT 1 FROM chapters WHERE id = ?', [chapterId]);
      if (!chapterExists) {
        drop();
        return res.status(400).json({ error: 'Unknown chapter.' });
      }
      const id = req.file.filename.replace(/\.[^.]+$/, '');
      await db.run(`INSERT INTO videos (id, chapter_id, title, file_name, original_name, mime, size, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        id, chapterId, (title || req.file.originalname).slice(0, 120), req.file.filename,
        req.file.originalname.slice(0, 200), req.file.mimetype, req.file.size, Date.now(),
      ]);
      res.status(201).json({ id });
    } catch (e) {
      drop();
      res.status(500).json({ error: 'Failed to record video file.' });
    }
  });
});

app.delete('/api/admin/videos/:id', requireAdmin, async (req, res, next) => {
  try {
    const v = await db.get('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (!v) return res.status(404).json({ error: 'Video not found.' });
    await db.run('DELETE FROM videos WHERE id = ?', [v.id]);
    fs.rm(filePath(v.file_name), () => {});
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Create or update a whole chapter (notes, mind map, DPP, test).
app.put('/api/admin/chapters/:id', requireAdmin, async (req, res, next) => {
  try {
    const ch = { ...req.body, id: req.params.id };
    const problem = await validateChapter(ch);
    if (problem) return res.status(400).json({ error: problem });
    await upsertChapter(ch);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// ---------- serve the built frontend ----------
if (fs.existsSync(DIST_DIR)) app.use(express.static(DIST_DIR));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Initialize database and start listening
async function startServer() {
  await bootstrapDatabase();

  app.listen(PORT, () => {
    console.log(`Study Buddy running on http://localhost:${PORT}`);
    if (db.isPostgres) {
      console.log('Database: Connected to Cloud PostgreSQL (DATABASE_URL). Data is 100% persistent across spin-downs.');
    } else {
      console.log('Database: Local SQLite (./data/studybuddy.db). Auto-bootstrap & client rehydration active.');
    }
    if (!ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD is not set: admin login is disabled.');
    if (TOKEN_IS_RANDOM) console.warn('TOKEN_SECRET is not set: admins will be logged out whenever the server restarts.');
  });
}

startServer();
