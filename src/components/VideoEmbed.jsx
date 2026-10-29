import { toEmbedUrl } from '../utils/embed.js';
import { apiUrl } from '../utils/api.js';

// Shows videos uploaded through the admin page first, then the YouTube link if there is one.
export default function VideoEmbed({ chapter }) {
  const yt = toEmbedUrl(chapter.videoUrl);
  const own = chapter.videos || [];

  if (!yt && own.length === 0) {
    return (
      <div className="empty">
        <p>No video added for this chapter yet.</p>
        <p>Upload one from the Admin page, or paste a YouTube link into <code>videoUrl</code> for this chapter.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {own.map((v) => (
        <figure key={v.id} className="vfig">
          <video controls preload="metadata" src={apiUrl(v.url)} />
          <figcaption>{v.title}</figcaption>
        </figure>
      ))}
      {yt && (
        <div className="video">
          <iframe
            src={yt}
            title={`${chapter.title} lecture`}
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
