// Bars for the most recent test attempts (percentage score).
export default function ScoreChart({ scores }) {
  const recent = scores.slice(-12);
  if (recent.length === 0) {
    return <div className="empty"><p>No tests taken yet. Finish a chapter test and your scores show up here.</p></div>;
  }
  const w = 480;
  const h = 160;
  const gap = 8;
  const bw = (w - gap * (recent.length + 1)) / recent.length;

  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h + 22}`} role="img" aria-label="Recent test scores in percent">
      <line className="axis" x1="0" y1={h} x2={w} y2={h} />
      {recent.map((s, i) => {
        const pct = Math.round((s.score / s.total) * 100);
        const bh = (pct / 100) * (h - 18);
        const x = gap + i * (bw + gap);
        return (
          <g key={s.at}>
            <rect className="barfill" x={x} y={h - bh} width={bw} height={bh} rx="3" />
            <text className="lbl" x={x + bw / 2} y={h + 15} textAnchor="middle">{pct}</text>
          </g>
        );
      })}
    </svg>
  );
}
