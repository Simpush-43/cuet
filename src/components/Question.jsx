// One MCQ. `reveal` shows right/wrong colours and the explanation.
export default function Question({ q, number, selected, onSelect, reveal, locked }) {
  return (
    <fieldset className="q">
      <legend>
        <span className="qn">Q{number}.</span> {q.q}
      </legend>
      <div className="opts">
        {q.options.map((opt, i) => {
          let cls = 'opt';
          if (reveal) {
            if (i === q.answer) cls += ' right';
            else if (i === selected) cls += ' wrong';
          } else if (i === selected) {
            cls += ' picked';
          }
          return (
            <button
              key={opt}
              type="button"
              className={cls}
              disabled={locked}
              onClick={() => onSelect(i)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {reveal && (
        <p className="why">
          {selected === undefined ? 'Not answered. ' : selected === q.answer ? 'Correct. ' : 'Incorrect. '}
          {q.explanation}
        </p>
      )}
    </fieldset>
  );
}
