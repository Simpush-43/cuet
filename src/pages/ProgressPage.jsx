import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ScoreChart from '../components/ScoreChart.jsx';

export default function ProgressPage() {
  const { done, scores } = useProgress();
  const { chapters } = useContent();
  const finished = chapters.filter((c) => done[c.id]).length;

  return (
    <>
      <h1>Your progress</h1>
      <h2 className="sub">Chapters</h2>
      <ProgressBar value={finished} total={chapters.length} />
      <p className="meta">{finished} of {chapters.length} chapters complete</p>

      <h2 className="sub">Test scores (percent, latest 12)</h2>
      <ScoreChart scores={scores} />

      {scores.length > 0 && (
        <ul className="chlist">
          {[...scores].reverse().slice(0, 10).map((s) => (
            <li key={s.at}>
              <Link to={`/chapter/${s.chapterId}`}>
                <span>{s.title}</span>
                <small>{s.score} / {s.total} on {new Date(s.at).toLocaleDateString()}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
