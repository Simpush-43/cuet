import { useCallback, useEffect, useState } from 'react';
import { api, upload, getToken, setToken } from '../utils/api.js';
import { useContent } from '../context/ContentContext.jsx';

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export default function AdminPage() {
  const { chapters, source, refresh } = useContent();
  const [token, setTok] = useState(getToken());
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [pct, setPct] = useState(null);
  const [msg, setMsg] = useState('');

  const logout = () => { setToken(''); setTok(''); setVideos([]); };

  const loadVideos = useCallback(async () => {
    try {
      setVideos(await api('/api/admin/videos', { token }));
    } catch (e) {
      if (e.status === 401) logout();
      setMsg(e.message);
    }
  }, [token]);

  useEffect(() => { if (token) loadVideos(); }, [token, loadVideos]);
  useEffect(() => { if (!chapterId && chapters[0]) setChapterId(chapters[0].id); }, [chapters, chapterId]);

  const login = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const { token: t } = await api('/api/admin/login', { method: 'POST', body: { password } });
      setToken(t); setTok(t); setPassword('');
    } catch (err) { setMsg(err.message); }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!file) return setMsg('Choose a video file first.');
    const fd = new FormData();
    fd.append('chapterId', chapterId);
    fd.append('title', title || file.name);
    fd.append('file', file);
    setMsg(''); setPct(0);
    try {
      await upload('/api/admin/videos', fd, token, setPct);
      setFile(null); setTitle(''); e.target.reset();
      setMsg('Uploaded.');
      await Promise.all([loadVideos(), refresh()]);
    } catch (err) {
      if (err.status === 401) logout();
      setMsg(err.message);
    } finally { setPct(null); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this video for good?')) return;
    try {
      await api(`/api/admin/videos/${id}`, { method: 'DELETE', token });
      await Promise.all([loadVideos(), refresh()]);
    } catch (err) { setMsg(err.message); }
  };

  return (
    <>
      <h1>Admin</h1>
      {source !== 'server' && (
        <p className="note">
          The backend is not reachable, so the site is showing its bundled content. Start the server with{' '}
          <code>npm run dev:server</code> (and run <code>npm run seed</code> once).
        </p>
      )}

      {!token ? (
        <form className="form" onSubmit={login}>
          <label>Admin password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <button type="submit" className="primary">Log in</button>
        </form>
      ) : (
        <>
          <p className="meta">Logged in <button type="button" className="ghost" onClick={logout}>Log out</button></p>

          <h2 className="sub">Upload a lecture</h2>
          <p className="lede">Upload only videos you made or have the rights to share.</p>
          <form className="form" onSubmit={send}>
            <label>Chapter
              <select value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
                {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label>Title (optional)
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </label>
            <label>Video file (MP4, WebM or MOV)
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setFile(e.target.files[0] || null)} />
            </label>
            <button type="submit" className="primary" disabled={pct !== null}>
              {pct === null ? 'Upload' : `Uploading ${pct}%`}
            </button>
          </form>

          <h2 className="sub">Uploaded videos</h2>
          {videos.length === 0 ? (
            <p className="lede">Nothing uploaded yet.</p>
          ) : (
            <ul className="chlist">
              {videos.map((v) => (
                <li key={v.id}>
                  <div className="planned row">
                    <span>{v.title}<br /><small>{v.chapterTitle} · {mb(v.size)}</small></span>
                    <button type="button" className="ghost" onClick={() => remove(v.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {msg && <p className="note" role="status">{msg}</p>}
    </>
  );
}
