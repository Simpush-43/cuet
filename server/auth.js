import crypto from 'node:crypto';
import { ADMIN_PASSWORD, TOKEN_SECRET } from './config.js';

const hmac = (s) => crypto.createHmac('sha256', TOKEN_SECRET).update(s).digest('base64url');
const sha = (s) => crypto.createHash('sha256').update(s).digest();

export function checkPassword(input) {
  if (!ADMIN_PASSWORD) return false;
  return crypto.timingSafeEqual(sha(String(input || '')), sha(ADMIN_PASSWORD));
}

export function signToken(hours = 12) {
  const body = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + hours * 3600_000 })).toString('base64url');
  return `${body}.${hmac(body)}`;
}

function verify(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(hmac(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!verify(token)) return res.status(401).json({ error: 'Please log in again.' });
  next();
}

// Very small in-memory brute-force guard: 10 failed logins per IP per 15 minutes.
const fails = new Map();
export function loginGuard(req, res, next) {
  const now = Date.now();
  const rec = (fails.get(req.ip) || []).filter((t) => now - t < 15 * 60_000);
  if (rec.length >= 10) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  req.recordFail = () => fails.set(req.ip, [...rec, now]);
  next();
}
