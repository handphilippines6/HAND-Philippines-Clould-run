import { useEffect, useRef, useState } from 'react';

/**
 * LazySection — component-level code splitting for heavy widgets.
 * Per 04_FRONTEND_SPA_PERFORMANCE.md §2, optional widgets are only
 * loaded when scrolled into view (IntersectionObserver), not bundled into
 * the route chunk. Render a lightweight skeleton until then.
 */
export default function LazySection({
  children,
  loader,
  fallback = null,
  rootMargin = '200px',
  minHeight = 200,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // If IntersectionObserver is unavailable, load immediately.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Dynamic import only once the section scrolls near the viewport
  useEffect(() => {
    let cancelled = false;
    if (!visible || !loader) return undefined;
    Promise.resolve()
      .then(() => loader())
      .then((mod) => {
        if (!cancelled) setComponent(() => mod.default || mod);
      })
      .catch(() => {
        // A failed lazy import must never break the page.
        if (!cancelled) setComponent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, loader]);

  return (
    <div ref={ref} style={Component ? undefined : { minHeight }}>
      {Component ? <Component /> : fallback}
    </div>
  );
}
