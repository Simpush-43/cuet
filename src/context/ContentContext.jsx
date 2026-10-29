import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subjects as bundledSubjects } from '../data/subjects.js';
import { chapters as bundledChapters } from '../data/index.js';
import { api } from '../utils/api.js';

const ContentContext = createContext(null);

// Loads content from the backend. If the backend is down or empty (for example a static-only deploy),
// the site falls back to the content bundled in src/data, so it always works.
export function ContentProvider({ children }) {
  const [state, setState] = useState({ subjects: bundledSubjects, chapters: bundledChapters, source: 'bundled' });

  const refresh = useCallback(async () => {
    try {
      const data = await api('/api/content');
      if (data.subjects?.length && data.chapters?.length) {
        setState({ subjects: data.subjects, chapters: data.chapters, source: 'server' });
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
  }), [state, refresh]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);
