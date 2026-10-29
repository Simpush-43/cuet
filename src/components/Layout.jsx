import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage.js';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export default function Layout() {
  const [theme, setTheme] = useLocalStorage('sb:theme', prefersDark() ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">Study Buddy</Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>Subjects</NavLink>
          <NavLink to="/progress">Progress</NavLink>
          <button
            type="button"
            className="ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Switch between light and dark mode"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="foot">
        Notes, DPPs and tests are written from the NCERT syllabus. Check every answer before you rely on it.
        <Link to="/admin">Admin</Link>
      </footer>
    </div>
  );
}
