import { useState } from 'react';
import Question from './Question.jsx';

// Practice mode: each answer is checked straight away, nothing is scored or saved.
export default function Dpp({ questions }) {
  const [answers, setAnswers] = useState({});
  const answered = Object.keys(answers).length;
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div>
      <p className="meta">
        {answered} of {questions.length} answered, {correct} correct
        {answered > 0 && (
          <button type="button" className="ghost" onClick={() => setAnswers({})}>
            Reset
          </button>
        )}
      </p>
      {questions.map((q, i) => (
        <Question
          key={q.q}
          q={q}
          number={i + 1}
          selected={answers[i]}
          reveal={answers[i] !== undefined}
          locked={answers[i] !== undefined}
          onSelect={(opt) => setAnswers((a) => ({ ...a, [i]: opt }))}
        />
      ))}
    </div>
  );
}
