import db from './db.js';

const parse = (s, fallback) => {
  try { return JSON.parse(s); } catch { return fallback; }
};

export function getContent() {
  const subjects = db.prepare('SELECT * FROM subjects ORDER BY sort, name').all().map((s) => ({
    id: s.id, name: s.name, blurb: s.blurb, planned: parse(s.planned, []),
  }));
  const questions = db.prepare('SELECT * FROM questions ORDER BY chapter_id, kind, position').all();
  const videos = db.prepare('SELECT * FROM videos ORDER BY created_at').all();

  const toQ = (r) => ({ q: r.q, options: parse(r.options, []), answer: r.answer, explanation: r.explanation });

  const chapters = db.prepare('SELECT * FROM chapters ORDER BY sort, title').all().map((c) => ({
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
  }));
  return { subjects, chapters };
}

export function upsertSubject(s, sort = 0) {
  db.prepare(`
    INSERT INTO subjects (id, name, blurb, planned, sort) VALUES (@id, @name, @blurb, @planned, @sort)
    ON CONFLICT(id) DO UPDATE SET name=@name, blurb=@blurb, planned=@planned, sort=@sort
  `).run({ id: s.id, name: s.name, blurb: s.blurb || '', planned: JSON.stringify(s.planned || []), sort });
}

export function validateChapter(ch) {
  if (!ch || typeof ch !== 'object') return 'Body must be a chapter object.';
  if (!/^[a-z0-9-]{2,60}$/.test(ch.id || '')) return 'id must be lowercase letters, digits and dashes.';
  if (!ch.title || typeof ch.title !== 'string') return 'title is required.';
  if (!db.prepare('SELECT 1 FROM subjects WHERE id = ?').get(ch.subject)) return 'Unknown subject id.';
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

export const upsertChapter = db.transaction((ch) => {
  const existing = db.prepare('SELECT sort FROM chapters WHERE id = ?').get(ch.id);
  const sort = existing ? existing.sort : (db.prepare('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM chapters').get().n);
  db.prepare(`
    INSERT INTO chapters (id, subject_id, title, video_url, notes, mind_map, test_minutes, sort)
    VALUES (@id, @subject, @title, @videoUrl, @notes, @mindMap, @testMinutes, @sort)
    ON CONFLICT(id) DO UPDATE SET subject_id=@subject, title=@title, video_url=@videoUrl,
      notes=@notes, mind_map=@mindMap, test_minutes=@testMinutes
  `).run({
    id: ch.id, subject: ch.subject, title: ch.title, videoUrl: ch.videoUrl || '',
    notes: JSON.stringify(ch.notes || []), mindMap: JSON.stringify(ch.mindMap || {}),
    testMinutes: ch.testMinutes ?? null, sort,
  });
  db.prepare('DELETE FROM questions WHERE chapter_id = ?').run(ch.id);
  const ins = db.prepare(`INSERT INTO questions (chapter_id, kind, position, q, options, answer, explanation)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const kind of ['dpp', 'test']) {
    (ch[kind] || []).forEach((q, i) => ins.run(ch.id, kind, i, q.q, JSON.stringify(q.options), q.answer, q.explanation || ''));
  }
});
