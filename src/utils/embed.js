import { extractYouTubeId } from './youtube.js';

// Turns a normal YouTube video, live stream, or playlist link into an official embed URL.
// Returns null if the link is empty or not a YouTube link.
export function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const list = u.searchParams.get('list');
    const host = u.hostname;

    if (host.includes('youtube.com') && u.pathname === '/playlist' && list) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`;
    }

    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}${list ? `?list=${list}` : ''}`;
    }
  } catch {
    /* not a valid URL */
  }
  return null;
}
