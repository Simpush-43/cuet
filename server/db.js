import fs from 'node:fs';
import Database from 'better-sqlite3';
import pg from 'pg';
import { DATA_DIR, UPLOAD_DIR, DB_PATH } from './config.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

export const isPostgres = !!process.env.DATABASE_URL;

let sqliteDb = null;
let pgPool = null;

if (isPostgres) {
  const connectionString = process.env.DATABASE_URL;
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  pgPool = new pg.Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
} else {
  sqliteDb = new Database(DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
}

// Convert SQLite '?' parameter placeholders to PostgreSQL '$1, $2, ...'
function toPgSql(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export async function queryAll(sql, params = []) {
  if (isPostgres) {
    const { rows } = await pgPool.query(toPgSql(sql), params);
    return rows;
  }
  return sqliteDb.prepare(sql).all(...params);
}

export async function queryOne(sql, params = []) {
  if (isPostgres) {
    const { rows } = await pgPool.query(toPgSql(sql), params);
    return rows[0] || null;
  }
  const row = sqliteDb.prepare(sql).get(...params);
  return row || null;
}

export async function queryRun(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(toPgSql(sql), params);
    return { changes: res.rowCount };
  }
  return sqliteDb.prepare(sql).run(...params);
}

export async function execSql(sql) {
  if (isPostgres) {
    await pgPool.query(sql);
  } else {
    sqliteDb.exec(sql);
  }
}

export async function initDb() {
  if (isPostgres) {
    await pgPool.query(`
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
        id SERIAL PRIMARY KEY,
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
        size BIGINT NOT NULL,
        created_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lectures (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        video_id TEXT NOT NULL,
        video_url TEXT NOT NULL DEFAULT '',
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
        created_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id, kind, position);
      CREATE INDEX IF NOT EXISTS idx_videos_chapter ON videos(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_lectures_subject ON lectures(subject_id);
      CREATE INDEX IF NOT EXISTS idx_lectures_chapter ON lectures(chapter_id);
    `);
  } else {
    sqliteDb.exec(`
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
  }
}

// Automatically initialize tables on load
if (!isPostgres) {
  initDb();
}

const db = {
  isPostgres,
  all: queryAll,
  get: queryOne,
  run: queryRun,
  exec: execSql,
  initDb,
  sqlite: sqliteDb,
  pg: pgPool,
};

export default db;
