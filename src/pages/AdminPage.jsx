import { useCallback, useEffect, useState } from 'react';
import { api, upload } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useContent } from '../context/ContentContext.jsx';
import AdminLectureManager from '../components/AdminLectureManager.jsx';

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export default function AdminPage() {
  const { isAdmin, token, login, logout } = useAuth();
  const { chapters, source, refresh } = useContent();

  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube' | 'files'
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [pct, setPct] = useState(null);
  const [msg, setMsg] = useState('');

  const loadVideos = useCallback(async () => {
    if (!token) return;
    try {
      setVideos(await api('/api/admin/videos', { token }));
    } catch (e) {
      if (e.status === 401) logout();
      setMsg(e.message);
    }
  }, [token, logout]);

  useEffect(() => {
    if (isAdmin && activeTab === 'files') {
      loadVideos();
    }
  }, [isAdmin, activeTab, loadVideos]);

  useEffect(() => {
    if (!chapterId && chapters && chapters[0]) {
      setChapterId(chapters[0].id);
    }
  }, [chapters, chapterId]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await login(password);
      setPassword('');
    } catch (err) {
      setMsg(err.message || 'Login failed.');
    }
  };

  const sendFile = async (e) => {
    e.preventDefault();
    if (!file) return setMsg('Choose a video file first.');
    const fd = new FormData();
    fd.append('chapterId', chapterId);
    fd.append('title', title || file.name);
    fd.append('file', file);
    setMsg('');
    setPct(0);
    try {
      await upload('/api/admin/videos', fd, token, setPct);
      setFile(null);
      setTitle('');
      e.target.reset();
      setMsg('Uploaded video file successfully.');
      await Promise.all([loadVideos(), refresh()]);
    } catch (err) {
      if (err.status === 401) logout();
      setMsg(err.message);
    } finally {
      setPct(null);
    }
  };

  const removeVideo = async (id) => {
    if (!window.confirm('Delete this video for good?')) return;
    try {
      await api(`/api/admin/videos/${id}`, { method: 'DELETE', token });
      await Promise.all([loadVideos(), refresh()]);
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <>
      <div className="admin-title-row">
        <h1>Admin Dashboard</h1>
        {isAdmin && (
          <div className="admin-quick-meta">
            <span>Signed in as <strong>Admin</strong></span>
            <button type="button" className="ghost" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>

      {source !== 'server' && (
        <p className="note">
          The backend server is currently offline or unreachable. Start the server with{' '}
          <code>npm run dev:server</code>.
        </p>
      )}

      {!isAdmin ? (
        <section className="card admin-auth-card">
          <h2>Admin Sign-in</h2>
          <p className="lede">Enter your administrator password to unlock full lecture management.</p>
          <form className="form" onSubmit={handleLoginSubmit}>
            <label>
              Admin password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter admin password"
                required
              />
            </label>
            <button type="submit" className="primary">
              Log in
            </button>
          </form>
          {msg && <p className="note" role="status">{msg}</p>}
        </section>
      ) : (
        <>
          {/* Admin Navigation Tabs */}
          <nav className="tabs admin-tabs" aria-label="Admin Navigation">
            <button
              type="button"
              className={`tab ${activeTab === 'youtube' ? 'on' : ''}`}
              onClick={() => setActiveTab('youtube')}
            >
              YouTube Lectures (Admin Manager)
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'files' ? 'on' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              Direct Video Files (MP4/WebM)
            </button>
          </nav>

          <div className="admin-tab-content">
            {activeTab === 'youtube' ? (
              <AdminLectureManager />
            ) : (
              <section className="admin-files-section">
                <h2 className="sub">Upload Direct Video File</h2>
                <p className="lede">Upload local MP4 or WebM video files to be hosted directly on this server.</p>
                <form className="form" onSubmit={sendFile}>
                  <label>
                    Chapter
                    <select value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
                      {chapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Title (optional)
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={120}
                      placeholder="e.g. Chapter Introduction"
                    />
                  </label>
                  <label>
                    Video file (MP4, WebM or MOV)
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setFile(e.target.files[0] || null)}
                    />
                  </label>
                  <button type="submit" className="primary" disabled={pct !== null}>
                    {pct === null ? 'Upload Video File' : `Uploading ${pct}%`}
                  </button>
                </form>

                <h2 className="sub">Direct Uploaded Files</h2>
                {videos.length === 0 ? (
                  <p className="lede">No local video files uploaded yet.</p>
                ) : (
                  <ul className="chlist">
                    {videos.map((v) => (
                      <li key={v.id}>
                        <div className="planned row">
                          <span>
                            {v.title}
                            <br />
                            <small>
                              {v.chapterTitle} · {mb(v.size)}
                            </small>
                          </span>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => removeVideo(v.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {msg && <p className="note" role="status">{msg}</p>}
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}
