export default function ProgressBar({ value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className="bar"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${value} of ${total} chapters complete`}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
