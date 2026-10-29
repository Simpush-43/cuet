import { useState, useCallback } from 'react';

// localStorage can be empty or blocked, so every access is wrapped in try/catch.
export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* storage unavailable: keep working in memory */
        }
        return v;
      });
    },
    [key]
  );

  return [value, set];
}
