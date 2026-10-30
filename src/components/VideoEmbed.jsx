import { useState } from 'react';
import { apiUrl } from '../utils/api.js';
import { useContent } from '../context/ContentContext.jsx';
import LecturePlayer, { extractYouTubeId } from './LecturePlayer.jsx';

/**
 * Renders the custom LecturePlayer for saved YouTube lectures and chapter video links,
 * complete with resolution/quality switching and responsive 16:9 view.
 */
export default function VideoEmbed({ chapter }) {
  const { lecturesByChapter } = useContent();

  // Get YouTube lectures assigned to this chapter from the database
  const chapterLectures = lecturesByChapter ? lecturesByChapter(chapter.id) : (chapter.lectures || []);

  // Check if the chapter object itself has a legacy/bundled videoUrl
  const fallbackYtId = extractYouTubeId(chapter.videoUrl);

  // Combine lectures list
  const allYtLectures = [...chapterLectures];
  if (fallbackYtId && !allYtLectures.some((l) => l.videoId === fallbackYtId)) {
    allYtLectures.push({
      id: `ch_default_${chapter.id}`,
      title: `${chapter.title} - Overview Lecture`,
      videoId: fallbackYtId,
      videoUrl: chapter.videoUrl,
      chapterId: chapter.id,
    });
  }

  // Active lecture selection
  const [activeLectureIndex, setActiveLectureIndex] = useState(0);
  const activeLecture = allYtLectures[activeLectureIndex] || allYtLectures[0];

  const ownVideos = chapter.videos || [];

  if (allYtLectures.length === 0 && ownVideos.length === 0) {
    return (
      <div className="empty">
        <p>No video lecture added for this chapter yet.</p>
        <p>
          Administrators can add YouTube lectures with quality controls from the <strong>Admin</strong> dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="stack lecture-embed-stack">
      {/* If multiple YouTube lectures exist for this chapter, show selector pills */}
      {allYtLectures.length > 1 && (
        <div className="lecture-playlist-bar">
          <span className="playlist-label">Lectures for {chapter.title}:</span>
          <div className="playlist-pills">
            {allYtLectures.map((lec, idx) => (
              <button
                key={lec.id || idx}
                type="button"
                className={`ghost pill-btn ${idx === activeLectureIndex ? 'active' : ''}`}
                onClick={() => setActiveLectureIndex(idx)}
              >
                Part {idx + 1}: {lec.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main YouTube Custom Player with programmatic quality control */}
      {activeLecture && (
        <LecturePlayer
          key={activeLecture.videoId}
          videoId={activeLecture.videoId}
          title={activeLecture.title}
        />
      )}

      {/* Locally hosted MP4/WebM videos if any exist */}
      {ownVideos.length > 0 && (
        <div className="direct-videos-container">
          {ownVideos.map((v) => (
            <figure key={v.id} className="vfig">
              <video controls preload="metadata" src={apiUrl(v.url)} />
              <figcaption>{v.title}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
