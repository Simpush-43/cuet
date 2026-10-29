import { useCallback, useEffect, useRef, useState } from 'react';
import Question from './Question.jsx';
import { useProgress } from '../context/ProgressContext.jsx';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function ChapterTest({ chapter }) {
  const { addScore } = useProgress();
  const qs = chapter.test;
  const minutes = chapter.testMinutes ?? Math.ceil(qs.length * 1.5);

  const [phase, setPhase] = useState('intro'); // intro | running | result
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(minutes * 60);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const finish = useCallback(() => {
    const score = qs.reduce((n, q, i) => n + (answersRef.current[i] === q.answer ? 1 : 0), 0);
    addScore({ chapterId: chapter.id, title: chapter.title, score, total: qs.length });
    setPhase('result');
  }, [qs, chapter.id, chapter.title, addScore]);

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && left <= 0) finish();
  }, [left, phase, finish]);

  const start = () => {
    setAnswers({});
    setLeft(minutes * 60);
    setPhase('running');
  };

  if (phase === 'intro') {
    return (
      <div className="empty">
        <p>
          {qs.length} questions, {minutes} minutes. Your score is saved when you submit.
        </p>
        <button type="button" className="primary" onClick={start}>Start test</button>
      </div>
    );
  }

  if (phase === 'running') {
    return (
      <div>
        <p className="meta sticky">
          Time left <strong>{fmt(Math.max(left, 0))}</strong>
          <span>{Object.keys(answers).length} of {qs.length} answered</span>
        </p>
        {qs.map((q, i) => (
          <Question
            key={q.q}
            q={q}
            number={i + 1}
            selected={answers[i]}
            onSelect={(opt) => setAnswers((a) => ({ ...a, [i]: opt }))}
          />
        ))}
        <button type="button" className="primary" onClick={finish}>Submit test</button>
      </div>
    );
  }

  const score = qs.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  return (
    <div>
      <div className="result">
        <strong>{score} / {qs.length}</strong>
        <span>{Math.round((score / qs.length) * 100)}%</span>
        <button type="button" className="primary" onClick={start}>Try again</button>
      </div>
      {qs.map((q, i) => (
        <Question key={q.q} q={q} number={i + 1} selected={answers[i]} reveal locked onSelect={() => {}} />
      ))}
    </div>
  );
}
