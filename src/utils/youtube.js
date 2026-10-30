// YouTube utility functions for ID extraction, URLs, and quality mappings

export function extractYouTubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();

  // Raw 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, shortened youtu.be, embed, nocookie, and shorts
  const pattern = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(pattern);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback URL parameter parser
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
  } catch {
    /* ignore malformed URL string */
  }

  return null;
}

export function formatYouTubeUrl(videoId) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
}

export function getYouTubeThumbnail(videoId, quality = 'mqdefault') {
  return videoId ? `https://img.youtube.com/vi/${videoId}/${quality}.jpg` : '';
}

export const QUALITY_OPTIONS = [
  { value: 'default', label: 'Auto' },
  { value: 'hd1080', label: '1080p (Full HD)' },
  { value: 'hd720', label: '720p (HD)' },
  { value: 'large', label: '480p' },
  { value: 'medium', label: '360p' },
  { value: 'small', label: '240p' },
  { value: 'tiny', label: '144p' },
];

export function qualityLabel(code) {
  switch (code) {
    case 'hd2160': return '4K (2160p)';
    case 'hd1440': return '1440p';
    case 'hd1080': return '1080p';
    case 'hd720': return '720p';
    case 'large': return '480p';
    case 'medium': return '360p';
    case 'small': return '240p';
    case 'tiny': return '144p';
    case 'default':
    case 'auto': return 'Auto';
    default: return code || 'Auto';
  }
}
