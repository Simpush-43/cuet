import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { getYouTubeThumbnail } from '../utils/youtube.js';

export default function Home() {
  const { done } = useProgress();
  const { subjects, chaptersBySubject, lectures, lecturesBySubject } = useContent();

  const allLectures = lectures || [];
  const totalLectures = allLectures.length;

  return (
    <>
      <div className="home-hero">
        <h1>CUET UG 2027, one chapter at a time</h1>
        <p className="lede">
          Every subject has its own section. Each chapter has a lecture, notes, a mind map, a DPP and a timed test.
        </p>

        {totalLectures > 0 && (
          <div className="home-stats-pill">
            <span className="pulse-dot">●</span>
            <span>
              <strong>{totalLectures} Video Lecture{totalLectures > 1 ? 's' : ''}</strong> available to watch across subjects
            </span>
          </div>
        )}
      </div>

      <div className="grid">
        {subjects.map((s) => {
          const list = chaptersBySubject(s.id);
          const lecs = lecturesBySubject ? lecturesBySubject(s.id) : [];
          const finished = list.filter((c) => done[c.id]).length;

          return (
            <Link key={s.id} to={`/subject/${s.id}`} className="card home-subject-card">
              <div className="card-top-row">
                <h2>{s.name}</h2>
                {lecs.length > 0 && (
                  <span className="badge-lec-pill" title={`${lecs.length} Video Lecture(s) Available`}>
                    ▶ {lecs.length} {lecs.length === 1 ? 'Lecture' : 'Lectures'}
                  </span>
                )}
              </div>
              <p>{s.blurb}</p>

              {list.length > 0 ? (
                <div className="card-footer-box">
                  <ProgressBar value={finished} total={list.length} />
                  <div className="card-meta-line">
                    <small>{finished} of {list.length} ready chapters complete</small>
                    {lecs.length > 0 && (
                      <span className="lec-status-tag">● {lecs.length} video{lecs.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card-footer-box">
                  {lecs.length > 0 ? (
                    <div className="card-lec-active">
                      <span className="badge-lecture-available">✓ {lecs.length} Lecture Ready</span>
                      <small>{s.planned?.length || 0} syllabus chapters</small>
                    </div>
                  ) : (
                    <small>{s.planned?.length || 0} chapters planned</small>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Featured Video Lectures Showcase */}
      {allLectures.length > 0 && (
        <section className="home-lectures-section">
          <div className="home-lectures-head">
            <h2 className="sub">Latest Video Lectures ({allLectures.length})</h2>
            <p className="lede">Watch high-yield video lectures with interactive quality control.</p>
          </div>

          <div className="home-lectures-grid">
            {allLectures.map((lec) => (
              <Link
                key={lec.id}
                to={`/subject/${lec.subjectId}`}
                className="home-lecture-card card"
                title={`Watch ${lec.title}`}
              >
                <div className="home-lecture-thumb-wrapper">
                  <img
                    src={getYouTubeThumbnail(lec.videoId, 'mqdefault')}
                    alt={lec.title}
                    className="home-lecture-thumb"
                    loading="lazy"
                  />
                  <span className="home-lecture-play-badge">▶ Watch Lecture</span>
                </div>
                <div className="home-lecture-meta">
                  <div className="home-lecture-pills">
                    <span className="pill pill-subject">{lec.subjectName || lec.subjectId}</span>
                    {lec.chapterTitle && <span className="pill pill-chapter">{lec.chapterTitle}</span>}
                  </div>
                  <h3 className="home-lecture-title">{lec.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
