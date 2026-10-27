/** RouteSkeleton — Suspense fallback that reserves layout height (no layout jump). */
export default function RouteSkeleton() {
  return (
    <div className="hp-container hp-skeleton-page" role="status" aria-busy="true" aria-label="Loading page">
      <div className="hp-skeleton" style={{ height: 18, width: 140, marginBottom: 24 }} />
      <div className="hp-skeleton" style={{ height: 44, width: '70%', marginBottom: 16 }} />
      <div className="hp-skeleton hp-skeleton-line" style={{ width: '52%' }} />
      <div className="hp-skeleton" style={{ height: 260, marginTop: 40, borderRadius: 18 }} />
      <span className="hp-sr-only">Loading…</span>
    </div>
  );
}
