// Copies the bundled content (src/data) into the database.
// Runs only on an empty database. Use `npm run seed -- --force` to overwrite chapters with the same id.
import db from './db.js';
import { upsertSubject, upsertChapter } from './content.js';
import { subjects } from '../src/data/subjects.js';
import { chapters } from '../src/data/index.js';
import { bundledLectures } from '../src/data/lectures.js';
import { ensureChapter } from './lectures.js';

async function seed() {
  await db.initDb();
  const force = process.argv.includes('--force');
  const countRow = await db.get('SELECT COUNT(*) AS n FROM chapters');
  const count = Number(countRow?.n || 0);

  if (count > 0 && !force) {
    console.log(`Database already has ${count} chapters. Nothing changed. Use --force to overwrite.`);
  } else {
    for (const [i, s] of subjects.entries()) {
      await upsertSubject(s, i);
    }
    for (const c of chapters) {
      await upsertChapter(c);
    }
    console.log(`Seeded ${subjects.length} subjects and ${chapters.length} chapters.`);
  }

  for (const lec of bundledLectures) {
    let chId = lec.chapterId;
    if (lec.chapterTitle || lec.chapterId) {
      try {
        const resolved = await ensureChapter(lec.subjectId, lec.chapterTitle || lec.chapterId);
        chId = resolved.cleanChapterId;
      } catch {
        /* ignore */
      }
    }
    const exists = await db.get('SELECT 1 FROM lectures WHERE id = ? OR video_id = ?', [lec.id, lec.videoId]);
    if (!exists) {
      await db.run(`
        INSERT INTO lectures (id, title, video_id, video_url, subject_id, chapter_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [lec.id, lec.title, lec.videoId, lec.videoUrl, lec.subjectId, chId, lec.createdAt || Date.now()]);
      console.log(`Seeded lecture: "${lec.title}"`);
    }
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
