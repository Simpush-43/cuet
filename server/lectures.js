import { Router } from 'express';
import db from './db.js';
import { requireAdmin } from './auth.js';

export function extractYouTubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();

  // Raw 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL formats (standard watch, shortened youtu.be, embed, live, shorts)
  const pattern = /(?:youtu\.be\/|(?:[a-z0-9-]+\.)?youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|e\/|live\/|shorts\/|watch\?.*?[?&]v=))([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(pattern);
  if (match && match[1]) {
    return match[1];
  }

  // URL parsing fallback for complex query strings and subpaths
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/')[1];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const segments = parsed.pathname.split('/').filter(Boolean);
      const prefixIdx = segments.findIndex((s) => ['live', 'shorts', 'embed', 'v', 'e'].includes(s.toLowerCase()));
      if (prefixIdx !== -1 && segments[prefixIdx + 1]) {
        const id = segments[prefixIdx + 1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
    }
  } catch {
    /* invalid url string */
  }

  return null;
}

export async function ensureChapter(subjectId, chapterInput) {
  if (!chapterInput || typeof chapterInput !== 'string' || chapterInput.trim() === '') {
    return { cleanChapterId: null, chapterTitle: null };
  }

  let title = chapterInput.trim();
  if (title.startsWith('create:')) {
    title = title.replace(/^create:/, '').trim();
  }

  // 1. Try finding by chapter ID
  let existing = await db.get('SELECT id, title, subject_id FROM chapters WHERE id = ?', [title]);
  if (existing) {
    if (existing.subject_id !== subjectId) {
      throw new Error('Selected chapter belongs to a different subject.');
    }
    return { cleanChapterId: existing.id, chapterTitle: existing.title };
  }

  // 2. Try finding by Title in the same subject
  existing = await db.get('SELECT id, title, subject_id FROM chapters WHERE subject_id = ? AND LOWER(title) = LOWER(?)', [subjectId, title]);
  if (existing) {
    return { cleanChapterId: existing.id, chapterTitle: existing.title };
  }

  // 3. Auto-promote/create chapter for this subject
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `ch_${Date.now().toString(36)}`;
  const maxSort = await db.get('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM chapters WHERE subject_id = ?', [subjectId]);

  await db.run(`
    INSERT INTO chapters (id, subject_id, title, sort)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title
  `, [slug, subjectId, title, maxSort?.n || 1]);

  // 4. Remove this title from subject.planned if it was listed there
  const sub = await db.get('SELECT planned FROM subjects WHERE id = ?', [subjectId]);
  if (sub && sub.planned) {
    try {
      const planned = typeof sub.planned === 'string' ? JSON.parse(sub.planned) : sub.planned;
      if (Array.isArray(planned)) {
        const filtered = planned.filter((t) => t.toLowerCase() !== title.toLowerCase());
        if (filtered.length !== planned.length) {
          await db.run('UPDATE subjects SET planned = ? WHERE id = ?', [JSON.stringify(filtered), subjectId]);
        }
      }
    } catch {
      /* ignore JSON error */
    }
  }

  return { cleanChapterId: slug, chapterTitle: title };
}

const router = Router();

// GET /api/lectures - Retrieve all lectures with optional subject/chapter filter
router.get('/', async (req, res) => {
  const { subjectId, chapterId } = req.query;

  let query = `
    SELECT l.id, l.title, l.video_id AS "videoId", l.video_url AS "videoUrl",
           l.subject_id AS "subjectId", l.chapter_id AS "chapterId", l.created_at AS "createdAt",
           s.name AS "subjectName", c.title AS "chapterTitle"
    FROM lectures l
    JOIN subjects s ON s.id = l.subject_id
    LEFT JOIN chapters c ON c.id = l.chapter_id
  `;
  const conditions = [];
  const params = [];

  if (subjectId) {
    conditions.push('l.subject_id = ?');
    params.push(subjectId);
  }
  if (chapterId) {
    conditions.push('l.chapter_id = ?');
    params.push(chapterId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY l.created_at DESC';

  const lectures = await db.all(query, params);
  res.json(lectures);
});

// GET /api/lectures/:id - Retrieve single lecture
router.get('/:id', async (req, res) => {
  const lecture = await db.get(`
    SELECT l.id, l.title, l.video_id AS "videoId", l.video_url AS "videoUrl",
           l.subject_id AS "subjectId", l.chapter_id AS "chapterId", l.created_at AS "createdAt",
           s.name AS "subjectName", c.title AS "chapterTitle"
    FROM lectures l
    JOIN subjects s ON s.id = l.subject_id
    LEFT JOIN chapters c ON c.id = l.chapter_id
    WHERE l.id = ?
  `, [req.params.id]);

  if (!lecture) {
    return res.status(404).json({ error: 'Lecture not found.' });
  }

  res.json(lecture);
});

// POST /api/lectures - Create lecture (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { title, videoUrl, videoId: rawVideoId, subjectId, chapterId } = req.body || {};

  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return res.status(400).json({ error: 'Lecture title is required.' });
  }
  if (cleanTitle.length > 200) {
    return res.status(400).json({ error: 'Lecture title must be 200 characters or less.' });
  }

  const videoInput = (videoUrl || rawVideoId || '').trim();
  const extractedId = extractYouTubeId(videoInput);
  if (!extractedId) {
    return res.status(400).json({
      error: 'Invalid YouTube Video Link or ID. Please provide a valid YouTube link (e.g., https://youtu.be/... or https://youtube.com/watch?v=...) or an 11-character Video ID.',
    });
  }

  if (!subjectId) {
    return res.status(400).json({ error: 'Subject is required.' });
  }
  const subjectExists = await db.get('SELECT id, name FROM subjects WHERE id = ?', [subjectId]);
  if (!subjectExists) {
    return res.status(400).json({ error: 'Selected subject does not exist.' });
  }

  let cleanChapterId = null;
  let chapterTitle = null;
  if (chapterId && chapterId.trim() !== '') {
    try {
      const resolved = await ensureChapter(subjectId, chapterId);
      cleanChapterId = resolved.cleanChapterId;
      chapterTitle = resolved.chapterTitle;
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Invalid chapter.' });
    }
  }

  const id = `lec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = Date.now();

  await db.run(`
    INSERT INTO lectures (id, title, video_id, video_url, subject_id, chapter_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, cleanTitle, extractedId, videoInput, subjectId, cleanChapterId, createdAt]);

  res.status(201).json({
    id,
    title: cleanTitle,
    videoId: extractedId,
    videoUrl: videoInput,
    subjectId,
    subjectName: subjectExists.name,
    chapterId: cleanChapterId,
    chapterTitle,
    createdAt,
  });
});

// PUT /api/lectures/:id - Update existing lecture (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const existing = await db.get('SELECT * FROM lectures WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Lecture not found.' });
  }

  const { title, videoUrl, videoId: rawVideoId, subjectId, chapterId } = req.body || {};

  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return res.status(400).json({ error: 'Lecture title is required.' });
  }
  if (cleanTitle.length > 200) {
    return res.status(400).json({ error: 'Lecture title must be 200 characters or less.' });
  }

  const videoInput = (videoUrl || rawVideoId || '').trim();
  const extractedId = extractYouTubeId(videoInput);
  if (!extractedId) {
    return res.status(400).json({
      error: 'Invalid YouTube Video Link or ID. Please provide a valid YouTube link or an 11-character Video ID.',
    });
  }

  if (!subjectId) {
    return res.status(400).json({ error: 'Subject is required.' });
  }
  const subjectExists = await db.get('SELECT id, name FROM subjects WHERE id = ?', [subjectId]);
  if (!subjectExists) {
    return res.status(400).json({ error: 'Selected subject does not exist.' });
  }

  let cleanChapterId = null;
  let chapterTitle = null;
  if (chapterId && chapterId.trim() !== '') {
    try {
      const resolved = await ensureChapter(subjectId, chapterId);
      cleanChapterId = resolved.cleanChapterId;
      chapterTitle = resolved.chapterTitle;
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Invalid chapter.' });
    }
  }

  await db.run(`
    UPDATE lectures
    SET title = ?, video_id = ?, video_url = ?, subject_id = ?, chapter_id = ?
    WHERE id = ?
  `, [cleanTitle, extractedId, videoInput, subjectId, cleanChapterId, id]);

  res.json({
    id,
    title: cleanTitle,
    videoId: extractedId,
    videoUrl: videoInput,
    subjectId,
    subjectName: subjectExists.name,
    chapterId: cleanChapterId,
    chapterTitle,
    createdAt: existing.created_at,
  });
});

// DELETE /api/lectures/:id - Delete lecture (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const existing = await db.get('SELECT * FROM lectures WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Lecture not found.' });
  }

  await db.run('DELETE FROM lectures WHERE id = ?', [id]);
  res.json({ ok: true, id });
});

// POST /api/lectures/sync - Auto-sync/rehydrate lectures after container cold boot
router.post('/sync', async (req, res) => {
  const { lectures: incomingList } = req.body || {};
  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return res.json({ ok: true, synced: 0 });
  }

  let count = 0;
  for (const item of incomingList) {
    if (!item.title || !item.subjectId) continue;
    const vId = extractYouTubeId(item.videoUrl || item.videoId);
    if (!vId) continue;

    let cleanChapterId = null;
    if (item.chapterTitle || item.chapterId) {
      try {
        const resolved = await ensureChapter(item.subjectId, item.chapterTitle || item.chapterId);
        cleanChapterId = resolved.cleanChapterId;
      } catch {
        /* fallback */
      }
    }

    try {
      await db.run(`
        INSERT INTO lectures (id, title, video_id, video_url, subject_id, chapter_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          video_id = excluded.video_id,
          video_url = excluded.video_url,
          subject_id = excluded.subject_id,
          chapter_id = excluded.chapter_id
      `, [
        item.id || `lec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        item.title.trim(),
        vId,
        item.videoUrl || `https://www.youtube.com/watch?v=${vId}`,
        item.subjectId,
        cleanChapterId,
        item.createdAt || Date.now(),
      ]);
      count++;
    } catch {
      /* ignore single conflict */
    }
  }

  res.json({ ok: true, synced: count });
});

export default router;
