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

  // Common YouTube URL formats (standard watch, shortened youtu.be, embed, shorts)
  const pattern = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(pattern);
  if (match && match[1]) {
    return match[1];
  }

  // URL parsing fallback for complex query strings
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
  } catch {
    /* invalid url string */
  }

  return null;
}

const router = Router();

// GET /api/lectures - Retrieve all lectures with optional subject/chapter filter
router.get('/', (req, res) => {
  const { subjectId, chapterId } = req.query;

  let query = `
    SELECT l.id, l.title, l.video_id AS videoId, l.video_url AS videoUrl,
           l.subject_id AS subjectId, l.chapter_id AS chapterId, l.created_at AS createdAt,
           s.name AS subjectName, c.title AS chapterTitle
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

  const lectures = db.prepare(query).all(...params);
  res.json(lectures);
});

// GET /api/lectures/:id - Retrieve single lecture
router.get('/:id', (req, res) => {
  const lecture = db.prepare(`
    SELECT l.id, l.title, l.video_id AS videoId, l.video_url AS videoUrl,
           l.subject_id AS subjectId, l.chapter_id AS chapterId, l.created_at AS createdAt,
           s.name AS subjectName, c.title AS chapterTitle
    FROM lectures l
    JOIN subjects s ON s.id = l.subject_id
    LEFT JOIN chapters c ON c.id = l.chapter_id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!lecture) {
    return res.status(404).json({ error: 'Lecture not found.' });
  }

  res.json(lecture);
});

// POST /api/lectures - Create lecture (Admin only)
router.post('/', requireAdmin, (req, res) => {
  const { title, videoUrl, videoId: rawVideoId, subjectId, chapterId } = req.body || {};

  // 1. Validate title
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return res.status(400).json({ error: 'Lecture title is required.' });
  }
  if (cleanTitle.length > 200) {
    return res.status(400).json({ error: 'Lecture title must be 200 characters or less.' });
  }

  // 2. Extract and validate YouTube Video ID
  const videoInput = (videoUrl || rawVideoId || '').trim();
  const extractedId = extractYouTubeId(videoInput);
  if (!extractedId) {
    return res.status(400).json({
      error: 'Invalid YouTube Video Link or ID. Please provide a valid YouTube link (e.g., https://youtu.be/... or https://youtube.com/watch?v=...) or an 11-character Video ID.',
    });
  }

  // 3. Validate subject existence
  if (!subjectId) {
    return res.status(400).json({ error: 'Subject is required.' });
  }
  const subjectExists = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(subjectId);
  if (!subjectExists) {
    return res.status(400).json({ error: 'Selected subject does not exist.' });
  }

  // 4. Validate chapter existence if provided
  let cleanChapterId = null;
  let chapterTitle = null;
  if (chapterId && chapterId.trim() !== '') {
    const chapter = db.prepare('SELECT id, title, subject_id FROM chapters WHERE id = ?').get(chapterId);
    if (!chapter) {
      return res.status(400).json({ error: 'Selected chapter does not exist.' });
    }
    if (chapter.subject_id !== subjectId) {
      return res.status(400).json({ error: 'Selected chapter does not belong to the selected subject.' });
    }
    cleanChapterId = chapter.id;
    chapterTitle = chapter.title;
  }

  // 5. Generate ID and persist to database
  const id = `lec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = Date.now();
  const canonicalUrl = videoInput.startsWith('http')
    ? videoInput
    : `https://www.youtube.com/watch?v=`;

  db.prepare(`
    INSERT INTO lectures (id, title, video_id, video_url, subject_id, chapter_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, cleanTitle, extractedId, videoInput, subjectId, cleanChapterId, createdAt);

  const newLecture = {
    id,
    title: cleanTitle,
    videoId: extractedId,
    videoUrl: videoInput,
    subjectId,
    subjectName: subjectExists.name,
    chapterId: cleanChapterId,
    chapterTitle,
    createdAt,
  };

  res.status(201).json(newLecture);
});

// PUT /api/lectures/:id - Update existing lecture (Admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id);
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
  const subjectExists = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(subjectId);
  if (!subjectExists) {
    return res.status(400).json({ error: 'Selected subject does not exist.' });
  }

  let cleanChapterId = null;
  let chapterTitle = null;
  if (chapterId && chapterId.trim() !== '') {
    const chapter = db.prepare('SELECT id, title, subject_id FROM chapters WHERE id = ?').get(chapterId);
    if (!chapter) {
      return res.status(400).json({ error: 'Selected chapter does not exist.' });
    }
    if (chapter.subject_id !== subjectId) {
      return res.status(400).json({ error: 'Selected chapter does not belong to the selected subject.' });
    }
    cleanChapterId = chapter.id;
    chapterTitle = chapter.title;
  }

  db.prepare(`
    UPDATE lectures
    SET title = ?, video_id = ?, video_url = ?, subject_id = ?, chapter_id = ?
    WHERE id = ?
  `).run(cleanTitle, extractedId, videoInput, subjectId, cleanChapterId, id);

  const updatedLecture = {
    id,
    title: cleanTitle,
    videoId: extractedId,
    videoUrl: videoInput,
    subjectId,
    subjectName: subjectExists.name,
    chapterId: cleanChapterId,
    chapterTitle,
    createdAt: existing.created_at,
  };

  res.json(updatedLecture);
});

// DELETE /api/lectures/:id - Delete lecture (Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Lecture not found.' });
  }

  db.prepare('DELETE FROM lectures WHERE id = ?').run(id);
  res.json({ ok: true, id });
});

export default router;
