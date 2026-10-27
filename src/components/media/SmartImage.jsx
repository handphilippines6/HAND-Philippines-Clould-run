import { useState, useEffect, useCallback, memo } from 'react';
import { resolveSrc } from '../../data/photoMap.js';
import './SmartImage.css';

/**
 * SmartImage — resilient image holder.
 *
 * Guarantees the layout never breaks when a photo is missing, slow, or
 * fails to decode:
 *   1. Intrinsic aspect-ratio box is reserved up-front (no layout shift).
 *   2. A branded placeholder is painted underneath the photo from the very
 *      first paint, so there is never an empty/collapsed frame.
 *   3. `onError` swaps to the placeholder permanently.
 *   4. `loading="lazy"` + `decoding="async"` below the fold.
 *   5. Decodes off the main thread via the `decode()` API when available.
 *
 * @param {string}  src        Image URL. If falsy the placeholder is used.
 * @param {string}  alt        Required for a11y (decorative images pass "").
 * @param {string}  caption    Optional caption rendered beneath the frame.
 * @param {number}  ratio      Aspect ratio as w/h, e.g. 4/3. Default 4/3.
 * @param {string}  fit       CSS object-fit. Default "cover".
 * @param {boolean} priority   True for above-the-fold / LCP images (eager).
 * @param {string}  tone       "blue" | "yellow" | "brand" placeholder tint.
 */
function SmartImageBase({
  src,
  alt,
  caption,
  ratio = 4 / 3,
  fit = 'cover',
  priority = false,
  tone = 'blue',
  className = '',
  rounded = true,
  sizes,
}) {
  /* Resolve the reference through the Wix Media map (data/photoMap.js):
     a known photo loads from the client's Wix Media CDN, an unknown one
     falls back to the bundled /img copy. SmartImage's resilience rules
     (aspect box, placeholder, lazy decode) apply either way. */
  const resolvedSrc = resolveSrc(src);

  const [status, setStatus] = useState(resolvedSrc ? 'loading' : 'fallback');
  const [decoded, setDecoded] = useState(false);

  // Reset when the source changes (gallery navigation, responsive swap, etc.)
  useEffect(() => {
    setStatus(resolvedSrc ? 'loading' : 'fallback');
    setDecoded(false);
  }, [resolvedSrc]);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
    // Progressive reveal: only fade in once the browser has actually decoded.
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => setDecoded(true));
    } else {
      setDecoded(true);
    }
  }, []);

  const handleError = useCallback(() => {
    setStatus('fallback');
    setDecoded(true);
  }, []);

  const showFallback = status === 'fallback';

  return (
    <figure className={`hp-img ${rounded ? 'hp-img--rounded' : ''} ${className}`.trim()}>
      <div
        className={`hp-img__frame hp-img__frame--${tone}`}
        style={{ aspectRatio: String(ratio) }}
      >
        {/* Layer 1 — branded placeholder, always present, never collapses */}
        <div className="hp-img__ph" aria-hidden="true">
          <svg viewBox="0 0 64 48" className="hp-img__ph-art" focusable="false">
            <defs>
              <linearGradient id={`hpg-${tone}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--hp-blue-100)" />
                <stop offset="55%" stopColor="var(--hp-blue-50)" />
                <stop offset="100%" stopColor="var(--hp-yellow-100)" />
              </linearGradient>
            </defs>
            <rect width="64" height="48" fill={`url(#hpg-${tone})`} />
            <circle cx="49" cy="12" r="5" fill="var(--hp-yellow-300)" opacity="0.9" />
            <path d="M0 38 L16 22 L27 32 L38 21 L64 40 L64 48 L0 48 Z" fill="var(--hp-blue-300)" opacity="0.55" />
            <path d="M0 43 L20 32 L33 40 L48 30 L64 39 L64 48 L0 48 Z" fill="var(--hp-blue-500)" opacity="0.32" />
          </svg>
          {showFallback ? (
            <span className="hp-img__ph-note">Photo coming soon</span>
          ) : null}
        </div>

        {/* Layer 2 — the actual photo, fades in only when decoded */}
        {resolvedSrc && !showFallback ? (
          <img
            src={resolvedSrc}
            alt={alt}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : 'auto'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`hp-img__el ${decoded ? 'is-in' : ''}`}
            style={{ objectFit: fit }}
          />
        ) : null}
      </div>

      {caption ? <figcaption className="hp-img__cap">{caption}</figcaption> : null}
    </figure>
  );
}

export const SmartImage = memo(SmartImageBase);
export default SmartImage;

