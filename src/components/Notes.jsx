export default function Notes({ sections }) {
  return (
    <div className="notes">
      {sections.map((s) => (
        <section key={s.heading}>
          <h3>{s.heading}</h3>
          <ul>
            {s.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
