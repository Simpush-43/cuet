import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';

// Tiny .env loader so no extra dependency is needed.
try {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  /* no .env file: use real environment variables */
}

export const PORT = Number(process.env.PORT) || 4000;
export const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
export const DB_PATH = path.join(DATA_DIR, 'studybuddy.db');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 500;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
export const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
export const TOKEN_IS_RANDOM = !process.env.TOKEN_SECRET;
export const DIST_DIR = path.resolve('dist');
