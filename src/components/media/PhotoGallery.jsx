import { useState, useCallback } from 'react';
import SmartImage from './SmartImage.jsx';
import Lightbox from './Lightbox.jsx';
import './PhotoGallery.css';

/**
 * PhotoGallery — responsive grid of real photographs, each opening the
 * full-screen Lightbox with previous/next navigator arrows.
 *
 * @param {Array<{src,alt,caption,credit,ratio,tone}>} photos
 * @param {string} title   Accessible name for the viewer, e.g. "Medical Mission".
 * @param {number} columns Grid columns on desktop (2–4).
 * @param {string} tone    Placeholder tint for any missing photo.
 */
export default function PhotoGallery({
  photos = [],
  title = 'Photo gallery',
  columns = 3,
  tone = 'blue',
  lead,
}) {
  const [openIndex, setOpenIndex] = useState(-1);
  const count = photos.length;
  const isOpen = openIndex >= 0;

  const close = useCallback(() => setOpenIndex(-1), []);
  const navigate = useCallback((next) => setOpenIndex(next), []);

  /* Navigator arrows on the grid itself: open the viewer at the previous or
     next photo, wrapping around at both ends. */
  const step = useCallback(
    (from, delta) => {
      if (!count) return;
      setOpenIndex((from + delta + count) % count);
    },
    [count]
  );

  if (!count) return null;

  return (
    <div className="hp-gallery">
      {lead ? <p className="hp-gallery__lead">{lead}</p> : null}

      <ul className={`hp-gallery__grid hp-gallery__grid--${columns}`}>
        {photos.map((photo, i) => (
          <li key={`${photo.src}-${i}`} className="hp-gallery__item">
            <button
              type="button"
              className="hp-gallery__btn"
              onClick={() => setOpenIndex(i)}
              aria-label={`Review photo: ${photo.caption || photo.alt || `photo ${i + 1}`}`}
            >
              <SmartImage
                src={photo.src}
                alt={photo.alt || ''}
                ratio={photo.ratio || (columns === 4 ? 1 : 4 / 3)}
                tone={photo.tone || tone}
              />
              <span className="hp-gallery__veil" aria-hidden="true">
                <span className="hp-gallery__zoom">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                  </svg>
                  Review
                </span>
              </span>
              {photo.caption ? <span className="hp-gallery__cap">{photo.caption}</span> : null}
            </button>

            {count > 1 ? (
              <div className="hp-gallery__nav" role="group" aria-label="Photo navigator">
                <button
                  type="button"
                  className="hp-gallery__nav-btn hp-gallery__nav-btn--prev"
                  onClick={() => step(i, -1)}
                  aria-label={`Previous photo (${i === 0 ? count : i}) of ${count}`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="hp-gallery__nav-count">
                  {i + 1}
                  <span aria-hidden="true"> / </span>
                  {count}
                </span>
                <button
                  type="button"
                  className="hp-gallery__nav-btn hp-gallery__nav-btn--next"
                  onClick={() => step(i, 1)}
                  aria-label={`Next photo (${i === count - 1 ? 1 : i + 2}) of ${count}`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <Lightbox
        items={photos}
        index={openIndex}
        open={isOpen}
        onClose={close}
        onNavigate={navigate}
        title={title}
      />
    </div>
  );
}
