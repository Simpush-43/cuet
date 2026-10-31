import db from './db.js';
import { upsertSubject, upsertChapter } from './content.js';
import { subjects } from '../src/data/subjects.js';
import { chapters } from '../src/data/index.js';
import { ensureChapter } from './lectures.js';

// Bundled lectures baked into the server — no external file needed
const bundledLectures = [
  {
    id: 'lec_physics_electric_charges',
    title: 'Electric Charges and Fields',
    videoId: '1moTv15l4o8',
    videoUrl: 'https://www.youtube.com/live/1moTv15l4o8?si=DhhX4ymHs6hQKDd5',
    subjectId: 'physics',
    chapterId: 'electric-charges-and-fields',
    chapterTitle: 'Electric Charges and Fields',
    createdAt: 1793346529598,
  },
  {
    id: 'lec_sample_matrices',
    title: 'Matrices & Operations Full Masterclass',
    videoId: 'vB9_nFh2oXo',
    videoUrl: 'https://www.youtube.com/watch?v=vB9_nFh2oXo',
    subjectId: 'maths',
    chapterId: 'matrices',
    chapterTitle: 'Matrices',
    createdAt: 1793346529598,
  },
];

/**
 * Automatically seeds and initializes the database when the container boots up.
 * Supports both SQLite and Cloud PostgreSQL (DATABASE_URL).
 */
export async function bootstrapDatabase() {
  try {
    await db.initDb();
    const subCount = await db.get('SELECT COUNT(*) AS n FROM subjects');
    if (!subCount || Number(subCount.n) === 0) {
      console.log('Database empty on startup. Auto-seeding subjects and chapters...');
      for (const [i, s] of subjects.entries()) {
        await upsertSubject(s, i);
      }
      for (const c of chapters) {
        await upsertChapter(c);
      }
      console.log(`Auto-seeded ${subjects.length} subjects and ${chapters.length} chapters.`);
    }

    for (const lec of bundledLectures) {
      let resolvedChapterId = lec.chapterId || null;
      if (lec.chapterTitle || lec.chapterId) {
        try {
          const resolved = await ensureChapter(lec.subjectId, lec.chapterTitle || lec.chapterId);
          resolvedChapterId = resolved.cleanChapterId;
        } catch {
          /* fallback */
        }
      }

      const exists = await db.get('SELECT 1 FROM lectures WHERE id = ? OR video_id = ?', [lec.id, lec.videoId]);
      if (!exists) {
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
          lec.id,
          lec.title,
          lec.videoId,
          lec.videoUrl,
          lec.subjectId,
          resolvedChapterId,
          lec.createdAt || Date.now(),
        ]);
        console.log(`Auto-seeded bundled lecture: "${lec.title}" (${lec.videoId})`);
      }
    }
  } catch (err) {
    console.error('Error during database bootstrap:', err);
  }
}
