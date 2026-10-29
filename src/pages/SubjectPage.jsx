import { Link, useParams } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import SubjectNav from '../components/SubjectNav.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function SubjectPage() {
  const { subjectId } = useParams();
  const { done } = useProgress();
  const { subjects, chaptersBySubject } = useContent();
  const subject = subjects.find((s) => s.id === subjectId);

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

  return (
    <>
      <SubjectNav />
      <h1>{subject.name}</h1>
      <p className="lede">{subject.blurb}</p>

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
