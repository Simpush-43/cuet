import db from './db.js';

const parse = (s, fallback) => {
  if (typeof s !== 'string') return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
};

export async function getContent() {
  const subjectsRows = await db.all('SELECT * FROM subjects ORDER BY sort, name');
  const subjects = subjectsRows.map((s) => ({
    id: s.id,
    name: s.name,
    blurb: s.blurb,
    planned: parse(s.planned, []),
  }));

  const questions = await db.all('SELECT * FROM questions ORDER BY chapter_id, kind, position');
  const videos = await db.all('SELECT * FROM videos ORDER BY created_at');

  const lectures = await db.all(`
    SELECT l.id, l.title, l.video_id AS "videoId", l.video_url AS "videoUrl",
           l.subject_id AS "subjectId", l.chapter_id AS "chapterId", l.created_at AS "createdAt",
           s.name AS "subjectName", c.title AS "chapterTitle"
    FROM lectures l
    JOIN subjects s ON s.id = l.subject_id
    LEFT JOIN chapters c ON c.id = l.chapter_id
    ORDER BY l.created_at DESC
  `);

  const toQ = (r) => ({
    q: r.q,
    options: parse(r.options, []),
    answer: r.answer,
    explanation: r.explanation,
  });

  const chaptersRows = await db.all('SELECT * FROM chapters ORDER BY sort, title');
  const chapters = chaptersRows.map((c) => ({
    id: c.id,
    subject: c.subject_id,
    title: c.title,
    videoUrl: c.video_url,
    testMinutes: c.test_minutes ?? undefined,
    notes: parse(c.notes, []),
    mindMap: parse(c.mind_map, { center: c.title, branches: [] }),
    dpp: questions.filter((r) => r.chapter_id === c.id && r.kind === 'dpp').map(toQ),
    test: questions.filter((r) => r.chapter_id === c.id && r.kind === 'test').map(toQ),
    videos: videos
      .filter((v) => v.chapter_id === c.id)
      .map((v) => ({ id: v.id, title: v.title, url: `/api/videos/${v.id}/stream` })),
    lectures: lectures.filter((l) => l.chapterId === c.id),
  }));

  return { subjects, chapters, lectures };
}

export async function upsertSubject(s, sort = 0) {
  await db.run(`
    INSERT INTO subjects (id, name, blurb, planned, sort) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, blurb=excluded.blurb, planned=excluded.planned, sort=excluded.sort
  `, [s.id, s.name, s.blurb || '', JSON.stringify(s.planned || []), sort]);
}

export async function validateChapter(ch) {
  if (!ch || typeof ch !== 'object') return 'Body must be a chapter object.';
  if (!/^[a-z0-9-]{2,60}$/.test(ch.id || '')) return 'id must be lowercase letters, digits and dashes.';
  if (!ch.title || typeof ch.title !== 'string') return 'title is required.';
  const subExists = await db.get('SELECT 1 FROM subjects WHERE id = ?', [ch.subject]);
  if (!subExists) return 'Unknown subject id.';
  for (const kind of ['dpp', 'test']) {
    const list = ch[kind] || [];
    if (!Array.isArray(list)) return `${kind} must be an array.`;
    for (const [i, q] of list.entries()) {
      if (!q.q || !Array.isArray(q.options) || q.options.length < 2) return `${kind}[${i}] needs q and 2+ options.`;
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) return `${kind}[${i}] answer is out of range.`;
    }
  }
  return null;
}

export async function upsertChapter(ch) {
  const existing = await db.get('SELECT sort FROM chapters WHERE id = ?', [ch.id]);
  const maxRow = await db.get('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM chapters');
  const sort = existing ? existing.sort : (maxRow?.n || 1);

  await db.run(`
    INSERT INTO chapters (id, subject_id, title, video_url, notes, mind_map, test_minutes, sort)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET subject_id=excluded.subject_id, title=excluded.title, video_url=excluded.video_url,
      notes=excluded.notes, mind_map=excluded.mind_map, test_minutes=excluded.test_minutes
  `, [
    ch.id, ch.subject, ch.title, ch.videoUrl || '',
    JSON.stringify(ch.notes || []), JSON.stringify(ch.mindMap || {}),
    ch.testMinutes ?? null, sort,
  ]);

  await db.run('DELETE FROM questions WHERE chapter_id = ?', [ch.id]);
  for (const kind of ['dpp', 'test']) {
    for (const [i, q] of (ch[kind] || []).entries()) {
      await db.run(
        'INSERT INTO questions (chapter_id, kind, position, q, options, answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ch.id, kind, i, q.q, JSON.stringify(q.options), q.answer, q.explanation || '']
      );
    }
  }
}
