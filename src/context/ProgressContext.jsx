import { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [done, setDone] = useLocalStorage('sb:done', {});
  const [scores, setScores] = useLocalStorage('sb:scores', []);

  const toggleDone = (chapterId) =>
    setDone((d) => ({ ...d, [chapterId]: !d[chapterId] }));

  const addScore = (entry) =>
    setScores((list) => [...list, { ...entry, at: Date.now() }].slice(-100));

  return (
    <ProgressContext.Provider value={{ done, toggleDone, scores, addScore }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
