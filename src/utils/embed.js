// Turns a normal YouTube video or playlist link into an official embed URL.
// Returns null if the link is empty or not a YouTube link.
export function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const list = u.searchParams.get('list');
    const host = u.hostname;

    if (host.includes('youtu.be')) {
      const id = u.pathname.slice(1);
      return `https://www.youtube-nocookie.com/embed/${id}${list ? `?list=${list}` : ''}`;
    }
    if (host.includes('youtube.com')) {
      if (u.pathname === '/playlist' && list) {
        return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`;
      }
      const v = u.searchParams.get('v');
      if (v) {
        return `https://www.youtube-nocookie.com/embed/${v}${list ? `?list=${list}` : ''}`;
      }
    }
  } catch {
    /* not a valid URL */
  }
  return null;
}
