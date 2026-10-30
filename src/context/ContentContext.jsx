import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subjects as bundledSubjects } from '../data/subjects.js';
import { chapters as bundledChapters } from '../data/index.js';
import { api } from '../utils/api.js';

const ContentContext = createContext(null);

// Loads content from the backend. If the backend is down or empty (for example a static-only deploy),
// the site falls back to the content bundled in src/data, so it always works.
export function ContentProvider({ children }) {
  const [state, setState] = useState({
    subjects: bundledSubjects,
    chapters: bundledChapters,
    lectures: [],
    source: 'bundled',
  });

  const refresh = useCallback(async () => {
    try {
      const [contentData, lecturesData] = await Promise.allSettled([
        api('/api/content'),
        api('/api/lectures'),
      ]);

      const content = contentData.status === 'fulfilled' ? contentData.value : null;
      const lectures = lecturesData.status === 'fulfilled' && Array.isArray(lecturesData.value)
        ? lecturesData.value
        : (content?.lectures || []);

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
