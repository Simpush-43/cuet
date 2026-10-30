import fs from 'node:fs';
import Database from 'better-sqlite3';
import { DATA_DIR, UPLOAD_DIR, DB_PATH } from './config.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  blurb TEXT NOT NULL DEFAULT '',
  planned TEXT NOT NULL DEFAULT '[]',
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '[]',
  mind_map TEXT NOT NULL DEFAULT '{}',
  test_minutes INTEGER,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('dpp','test')),
  position INTEGER NOT NULL,
  q TEXT NOT NULL,
  options TEXT NOT NULL,
  answer INTEGER NOT NULL,
  explanation TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lectures (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  video_id TEXT NOT NULL,
  video_url TEXT NOT NULL DEFAULT '',
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id, kind, position);
CREATE INDEX IF NOT EXISTS idx_videos_chapter ON videos(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lectures_subject ON lectures(subject_id);
CREATE INDEX IF NOT EXISTS idx_lectures_chapter ON lectures(chapter_id);
`);

export default db;
