// Copies the bundled content (src/data) into the database.
// Runs only on an empty database. Use `npm run seed -- --force` to overwrite chapters with the same id.
import db from './db.js';
import { upsertSubject, upsertChapter } from './content.js';
import { subjects } from '../src/data/subjects.js';
import { chapters } from '../src/data/index.js';

const force = process.argv.includes('--force');
const count = db.prepare('SELECT COUNT(*) AS n FROM chapters').get().n;

if (count > 0 && !force) {
  console.log(`Database already has ${count} chapters. Nothing changed. Use --force to overwrite.`);
} else {
  subjects.forEach((s, i) => upsertSubject(s, i));
  chapters.forEach((c) => upsertChapter(c));
  console.log(`Seeded ${subjects.length} subjects and ${chapters.length} chapters.`);
}
