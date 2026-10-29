import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { UPLOAD_DIR, MAX_UPLOAD_MB } from './config.js';

// Only these video types are accepted; the extension comes from the type, never from the user's filename.
export const MIME_EXT = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => cb(null, crypto.randomUUID() + MIME_EXT[file.mimetype]),
});

export const videoUpload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    MIME_EXT[file.mimetype] ? cb(null, true) : cb(new Error('Only MP4, WebM or MOV videos are allowed.')),
}).single('file');

export const filePath = (name) => path.join(UPLOAD_DIR, path.basename(name));
