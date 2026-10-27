/** Impact metrics — read-only display values (per 01_SITE_MAP §3: server-approved metrics only). */
export default function StatGrid({ stats = [], columns }) {
  return (
    <ul className="hp-stats" style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` } : undefined}>
      {stats.map((s) => (
        <li key={s.label} className={`hp-stat hp-stat--${s.tone === 'sun' ? 'sun' : 'blue'}`}>
          <span className="hp-stat__value">{s.value}</span>
          <span className="hp-stat__label">{s.label}</span>
          {s.note ? <span className="hp-stat__note">{s.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}
