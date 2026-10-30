import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subjects as bundledSubjects } from '../data/subjects.js';
import { chapters as bundledChapters } from '../data/index.js';
import { bundledLectures } from '../data/lectures.js';
import { api } from '../utils/api.js';

const ContentContext = createContext(null);

// Loads content from the backend. If the backend is down or empty (for example a static-only deploy),
// the site falls back to the content bundled in src/data, so it always works.
export function ContentProvider({ children }) {
  const [state, setState] = useState({
    subjects: bundledSubjects,
    chapters: bundledChapters,
    lectures: bundledLectures || [],
    source: 'bundled',
  });

  const refresh = useCallback(async () => {
    try {
      const [contentData, lecturesData] = await Promise.allSettled([
        api('/api/content'),
        api('/api/lectures'),
      ]);

      const content = contentData.status === 'fulfilled' ? contentData.value : null;
      let lectures = lecturesData.status === 'fulfilled' && Array.isArray(lecturesData.value)
        ? lecturesData.value
        : (content?.lectures || []);

      // Check local cache for persistence across ephemeral host restarts
      let localCached = [];
      try {
        localCached = JSON.parse(window.localStorage.getItem('sb:lectures_cache') || '[]');
      } catch {
        localCached = [];
      }

      // Check if any lectures in local cache are missing from the server
      const existingIds = new Set(lectures.map((l) => l.id || l.videoId));
      const missingFromDb = localCached.filter((l) => !existingIds.has(l.id) && !existingIds.has(l.videoId));

      if (missingFromDb.length > 0) {
        // Auto-rehydrate/sync missing lectures to server
        try {
          await api('/api/lectures/sync', {
            method: 'POST',
            body: { lectures: missingFromDb },
          });
          const reloaded = await api('/api/lectures');
          if (Array.isArray(reloaded) && reloaded.length > 0) lectures = reloaded;
        } catch {
          lectures = [...lectures, ...missingFromDb];
        }
      }

      // Keep cache updated
      if (lectures.length > 0) {
        try {
          window.localStorage.setItem('sb:lectures_cache', JSON.stringify(lectures));
        } catch {}
      }

      if (content?.subjects?.length && content?.chapters?.length) {
        setState({
          subjects: content.subjects,
          chapters: content.chapters,
          lectures,
          source: 'server',
        });
      } else if (lectures.length > 0) {
        setState((prev) => ({ ...prev, lectures }));
      }
    } catch {
      /* keep bundled content */
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({
    ...state,
    refresh,
    chaptersBySubject: (id) => state.chapters.filter((c) => c.subject === id),
    getChapter: (id) => state.chapters.find((c) => c.id === id),
    lecturesBySubject: (subjectId) => (state.lectures || []).filter((l) => l.subjectId === subjectId),
    lecturesByChapter: (chapterId) => (state.lectures || []).filter((l) => l.chapterId === chapterId),
  }), [state, refresh]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);
