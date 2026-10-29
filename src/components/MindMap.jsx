export default function MindMap({ map }) {
  return (
    <div className="mm" aria-label={`Mind map: ${map.center}`}>
      <div className="mm-center">{map.center}</div>
      <div className="mm-branches">
        {map.branches.map((b) => (
          <div className="mm-branch" key={b.label}>
            <h4>{b.label}</h4>
            <ul>
              {b.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
