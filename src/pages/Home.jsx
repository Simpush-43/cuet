import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Home() {
  const { done } = useProgress();
  const { subjects, chaptersBySubject } = useContent();
  return (
    <>
      <h1>CUET UG 2027, one chapter at a time</h1>
      <p className="lede">
        Every subject has its own section. Each chapter has a lecture, notes, a mind map, a DPP and a timed test.
      </p>
      <div className="grid">
        {subjects.map((s) => {
          const list = chaptersBySubject(s.id);
          const finished = list.filter((c) => done[c.id]).length;
          return (
            <Link key={s.id} to={`/subject/${s.id}`} className="card">
              <h2>{s.name}</h2>
              <p>{s.blurb}</p>
              {list.length > 0 ? (
                <>
                  <ProgressBar value={finished} total={list.length} />
                  <small>{finished} of {list.length} ready chapters complete</small>
                </>
              ) : (
                <small>{s.planned.length} chapters planned</small>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
