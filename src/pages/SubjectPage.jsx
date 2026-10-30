import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import SubjectNav from '../components/SubjectNav.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import LecturePlayer from '../components/LecturePlayer.jsx';

export default function SubjectPage() {
  const { subjectId } = useParams();
  const { done } = useProgress();
  const { subjects, chaptersBySubject, lecturesBySubject } = useContent();
  const subject = subjects.find((s) => s.id === subjectId);

  // Active lecture for player in subject view
  const [selectedLectureIndex, setSelectedLectureIndex] = useState(0);

  if (!subject) {
    return (
      <>
        <p>We could not find that subject.</p>
        <Link to="/">Back to subjects</Link>
      </>
    );
  }

  const ready = chaptersBySubject(subject.id);
  const finished = ready.filter((c) => done[c.id]).length;
  const subjectLectures = lecturesBySubject ? lecturesBySubject(subject.id) : [];
  const currentLecture = subjectLectures[selectedLectureIndex] || subjectLectures[0];

  return (
    <>
      <SubjectNav />
      <h1>{subject.name}</h1>
      <p className="lede">{subject.blurb}</p>

      {/* Subject Video Lectures Section */}
      {subjectLectures.length > 0 && (
        <section className="subject-lectures-section">
          <h2 className="sub">Video Lectures ({subjectLectures.length})</h2>
          <div className="subject-player-wrapper card">
            <LecturePlayer
              key={currentLecture.id}
              videoId={currentLecture.videoId}
              title={currentLecture.title}
            />

            {subjectLectures.length > 1 && (
              <div className="subject-playlist-picker">
                <span className="playlist-title">Select Lecture:</span>
                <div className="subject-playlist-grid">
                  {subjectLectures.map((lec, idx) => (
                    <button
                      key={lec.id}
                      type="button"
                      className={`ghost subject-lecture-btn ${idx === selectedLectureIndex ? 'active' : ''}`}
                      onClick={() => setSelectedLectureIndex(idx)}
                    >
                      <span className="lec-idx">#{idx + 1}</span>
                      <span className="lec-title">{lec.title}</span>
                      {lec.chapterTitle && <small className="lec-ch">{lec.chapterTitle}</small>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {ready.length > 0 && (
        <>
          <ProgressBar value={finished} total={ready.length} />
          <h2 className="sub">Ready to study</h2>
          <ul className="chlist">
            {ready.map((c) => (
              <li key={c.id}>
                <Link to={`/chapter/${c.id}`}>
                  <span>{c.title}</span>
                  <small>{done[c.id] ? 'Complete' : 'Not started'}</small>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {subject.planned.length > 0 && (
        <>
          <h2 className="sub">{ready.length > 0 ? 'Coming next' : 'Chapters planned'}</h2>
          <ul className="chlist">
            {subject.planned.map((title) => (
              <li key={title}>
                <div className="planned">
                  <span>{title}</span>
                  <small>Coming soon</small>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
