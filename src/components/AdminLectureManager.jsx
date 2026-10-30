import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useContent } from '../context/ContentContext.jsx';
import { api } from '../utils/api.js';
import { extractYouTubeId, getYouTubeThumbnail } from '../utils/youtube.js';
import LecturePlayer from './LecturePlayer.jsx';

export default function AdminLectureManager() {
  const { isAdmin, token, login, logout } = useAuth();
  const { subjects, chapters, refresh: refreshContent } = useContent();

  // Authentication state
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Lectures data
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Form state
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview state
  const [previewLecture, setPreviewLecture] = useState(null);

  // Filter state for the table
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-extracted YouTube ID from the current form input
  const extractedId = useMemo(() => extractYouTubeId(videoInput), [videoInput]);

  // Load lectures from the API
  const loadLectures = async () => {
    try {
      setLoading(true);
      const data = await api('/api/lectures');
      const list = Array.isArray(data) ? data : [];
      setLectures(list);
      try {
        if (list.length > 0) window.localStorage.setItem('sb:lectures_cache', JSON.stringify(list));
      } catch {}
    } catch (err) {
      setMsg({ text: err.message || 'Failed to load lectures.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyLecturesCode = () => {
    const code = `// Permanent bundled lectures for src/data/lectures.js
export const bundledLectures = ${JSON.stringify(lectures, null, 2)};
`;
    navigator.clipboard.writeText(code);
    setMsg({
      text: '✓ Copied lectures code! Paste into src/data/lectures.js and commit to make them 100% permanent on Render.',
      type: 'success',
    });
  };

  useEffect(() => {
    if (isAdmin) {
      loadLectures();
    }
  }, [isAdmin]);

  // Default subjectId to the first subject available if not selected
  useEffect(() => {
    if (!subjectId && subjects && subjects.length > 0) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const activeSubject = useMemo(() => {
    return (subjects || []).find((s) => s.id === subjectId);
  }, [subjects, subjectId]);

  // Active chapters already in database
  const readyChapters = useMemo(() => {
    if (!subjectId) return [];
    return (chapters || []).filter((c) => c.subject === subjectId);
  }, [chapters, subjectId]);

  // Planned syllabus chapters from subjects
  const plannedChapters = useMemo(() => {
    if (!activeSubject || !Array.isArray(activeSubject.planned)) return [];
    const readyTitles = new Set(readyChapters.map((c) => c.title.toLowerCase()));
    return activeSubject.planned.filter((p) => !readyTitles.has(p.toLowerCase()));
  }, [activeSubject, readyChapters]);

  // Handle Admin Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await login(password);
      setPassword('');
    } catch (err) {
      setAuthError(err.message || 'Incorrect password.');
    }
  };

  // Reset the form back to Create mode
  const resetForm = () => {
    setEditId(null);
    setTitle('');
    setVideoInput('');
    setChapterId('');
    if (subjects && subjects.length > 0) {
      setSubjectId(subjects[0].id);
    }
  };

  // Populate form with existing lecture data for editing
  const handleStartEdit = (lecture) => {
    setEditId(lecture.id);
    setTitle(lecture.title);
    setVideoInput(lecture.videoUrl || lecture.videoId);
    setSubjectId(lecture.subjectId);
    setChapterId(lecture.chapterId || '');
    setMsg({ text: `Editing lecture: "${lecture.title}"`, type: 'info' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!title.trim()) {
      setMsg({ text: 'Please enter a lecture title.', type: 'error' });
      return;
    }

    if (!extractedId) {
      setMsg({
        text: 'Please enter a valid YouTube Video URL (e.g. https://youtu.be/... or https://youtube.com/watch?v=...) or an 11-character Video ID.',
        type: 'error',
      });
      return;
    }

    if (!subjectId) {
      setMsg({ text: 'Please select a subject.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        videoUrl: videoInput.trim(),
        videoId: extractedId,
        subjectId,
        chapterId: chapterId ? chapterId : null,
      };

      if (editId) {
        // Edit existing lecture
        await api(`/api/lectures/${editId}`, {
          method: 'PUT',
          body: payload,
          token,
        });
        setMsg({ text: 'Lecture updated successfully!', type: 'success' });
      } else {
        // Create new lecture
        await api('/api/lectures', {
          method: 'POST',
          body: payload,
          token,
        });
        setMsg({ text: 'Lecture saved successfully!', type: 'success' });
      }

      resetForm();
      await Promise.all([loadLectures(), refreshContent()]);
    } catch (err) {
      setMsg({ text: err.message || 'Operation failed.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Lecture
  const handleDelete = async (lecture) => {
    if (!window.confirm(`Are you sure you want to delete the lecture "${lecture.title}"?`)) {
      return;
    }

    try {
      await api(`/api/lectures/${lecture.id}`, {
        method: 'DELETE',
        token,
      });
      setMsg({ text: `Lecture "${lecture.title}" deleted.`, type: 'success' });
      if (editId === lecture.id) resetForm();
      if (previewLecture?.id === lecture.id) setPreviewLecture(null);
      await Promise.all([loadLectures(), refreshContent()]);
    } catch (err) {
      setMsg({ text: err.message || 'Failed to delete lecture.', type: 'error' });
    }
  };

  // Filter lectures for the management table
  const filteredLectures = useMemo(() => {
    return lectures.filter((l) => {
      const matchSub = filterSubject === 'all' || l.subjectId === filterSubject;
      const matchSearch =
        searchQuery === '' ||
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.videoId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.chapterTitle && l.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSub && matchSearch;
    });
  }, [lectures, filterSubject, searchQuery]);

  // 1. Guard: Accessible ONLY when user is an Admin
  if (!isAdmin) {
    return (
      <section className="admin-auth-card card">
        <h2>Admin Authentication Required</h2>
        <p className="lede">
          Please authenticate with the admin password to manage YouTube lectures, curriculum subjects, and video content.
        </p>

        <form className="form" onSubmit={handleLogin}>
          <label>
            Admin Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="primary">
            Unlock Admin Panel
          </button>
        </form>

        {authError && <p className="note" role="alert" style={{ borderLeftColor: 'var(--bad)', color: 'var(--bad)' }}>{authError}</p>}
      </section>
    );
  }

  return (
    <div className="admin-lecture-manager">
      <div className="admin-header-bar">
        <div>
          <h2>YouTube Lecture Management</h2>
          <p className="lede">
            Add, update, or remove YouTube lectures linked directly to subjects and chapters.
          </p>
        </div>
        <div className="admin-auth-status">
          <span className="badge-admin">Admin Mode</span>
          <button type="button" className="ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {msg.text && (
        <div
          className={`note ${msg.type === 'error' ? 'note-error' : msg.type === 'success' ? 'note-success' : ''}`}
          role="status"
        >
          {msg.text}
        </div>
      )}

      {/* LECTURE FORM (ADD / EDIT) */}
      <section className="admin-form-section card">
        <div className="form-section-head">
          <h3>{editId ? 'Edit Lecture' : 'Add New YouTube Lecture'}</h3>
          {editId && (
            <button type="button" className="ghost" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form className="form admin-lecture-form" onSubmit={handleSubmit}>
          {/* Lecture Title */}
          <label>
            Lecture Title <span className="req">*</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Determinants: Properties & Solved Examples"
              maxLength={200}
              required
            />
          </label>

          {/* YouTube Video Link or ID */}
          <label>
            YouTube Video Link or Video ID <span className="req">*</span>
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
              required
            />
            {/* Auto-extraction feedback & thumbnail preview */}
            {videoInput.trim().length > 0 && (
              <div className="video-detection-feedback">
                {extractedId ? (
                  <div className="detected-success">
                    <span>✓ Detected YouTube Video ID: <code>{extractedId}</code></span>
                    <img
                      src={getYouTubeThumbnail(extractedId, 'default')}
                      alt="Thumbnail preview"
                      className="detected-thumb"
                    />
                  </div>
                ) : (
                  <span className="detected-warn">
                    ⚠ Could not extract 11-char Video ID. Provide a valid YouTube link or ID.
                  </span>
                )}
              </div>
            )}
          </label>

          {/* Subject Selector */}
          <div className="form-row">
            <label>
              Subject <span className="req">*</span>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId(''); // Reset chapter when subject changes
                }}
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Chapter Selector */}
            <label>
              Chapter / Topic (Optional)
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
              >
                <option value="">General / Entire Subject</option>
                {readyChapters.length > 0 && (
                  <optgroup label="Active Chapters">
                    {readyChapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {plannedChapters.length > 0 && (
                  <optgroup label="Syllabus Chapters (Auto-create Chapter)">
                    {plannedChapters.map((title) => (
                      <option key={`create:${title}`} value={`create:${title}`}>
                        {title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary" disabled={isSubmitting || !extractedId}>
              {isSubmitting ? 'Saving...' : editId ? 'Save Changes' : 'Add Lecture'}
            </button>
            {editId && (
              <button type="button" className="ghost" onClick={resetForm}>
                Discard
              </button>
            )}
          </div>
        </form>
      </section>

      {/* INTERACTIVE PLAYER PREVIEW MODAL / DRAWER */}
      {previewLecture && (
        <section className="preview-container card">
          <div className="preview-head">
            <h3>Player Preview: {previewLecture.title}</h3>
            <button
              type="button"
              className="ghost"
              onClick={() => setPreviewLecture(null)}
            >
              Close Preview
            </button>
          </div>
          <LecturePlayer
            videoId={previewLecture.videoId}
            title={previewLecture.title}
            autoPlay
          />
        </section>
      )}

      {/* LECTURES DIRECTORY / TABLE */}
      <section className="admin-table-section card">
        <div className="table-controls-bar">
          <h3>Existing Lectures ({filteredLectures.length})</h3>

          <div className="table-filters">
            <input
              type="search"
              placeholder="Search lectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-search"
            />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="filter-subject"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="lede">Loading lectures...</p>
        ) : filteredLectures.length === 0 ? (
          <div className="empty">
            <p>No lectures match your filter.</p>
            {lectures.length === 0 && (
              <p>Add your first YouTube lecture using the form above.</p>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Title</th>
                  <th>Subject & Chapter</th>
                  <th>YouTube ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLectures.map((lec) => (
                  <tr key={lec.id} className={editId === lec.id ? 'row-editing' : ''}>
                    <td className="cell-thumb">
                      <img
                        src={getYouTubeThumbnail(lec.videoId, 'default')}
                        alt=""
                        className="table-thumb"
                        loading="lazy"
                      />
                    </td>
                    <td className="cell-title">
                      <strong>{lec.title}</strong>
                      {editId === lec.id && <span className="editing-pill">Currently Editing</span>}
                    </td>
                    <td className="cell-tags">
                      <span className="pill pill-subject">{lec.subjectName || lec.subjectId}</span>
                      <span className="pill pill-chapter">
                        {lec.chapterTitle || 'Subject General'}
                      </span>
                    </td>
                    <td className="cell-videoid">
                      <code>{lec.videoId}</code>
                    </td>
                    <td className="cell-actions">
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="ghost action-btn"
                          onClick={() => setPreviewLecture(lec)}
                          title="Preview in custom player"
                        >
                          ▶ Play
                        </button>
                        <button
                          type="button"
                          className="ghost action-btn"
                          onClick={() => handleStartEdit(lec)}
                          title="Edit this lecture"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          className="ghost action-btn btn-danger"
                          onClick={() => handleDelete(lec)}
                          title="Delete lecture"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-persistence-bar">
          <div className="persistence-info">
            <strong>Render Cloud Persistence:</strong>
            <p>
              Free-tier Render services sleep when inactive and reset local files. Click below to copy code for{' '}
              <code>src/data/lectures.js</code> to permanently bake current lectures into your repository.
            </p>
          </div>
          <button
            type="button"
            className="ghost copy-code-btn"
            onClick={copyLecturesCode}
            disabled={lectures.length === 0}
          >
            📋 Copy Code for src/data/lectures.js
          </button>
        </div>
      </section>
    </div>
  );
}
