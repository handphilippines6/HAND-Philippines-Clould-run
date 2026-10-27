import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SmartImage from './SmartImage.jsx';
import { resolveSrc } from '../../data/photoMap.js';
import './Lightbox.css';

/**
 * Lightbox — full-screen photo review modal with navigator arrows.
 *
 * Interaction & accessibility:
 *  - role="dialog" aria-modal, labelled by the caption
 *  - Esc closes · ArrowLeft / ArrowRight navigate · Home / End jump to ends
 *  - Click the backdrop or the close button to dismiss
 *  - Arrows are disabled (and dimmed) when there is only one photo
 *  - Body scroll is locked while open; focus moves into the dialog
 *  - Swipe left/right on touch devices, plus a filmstrip navigator
 */
export default function Lightbox({
  items = [],
  index = -1,
  open = false,
  onClose,
  onNavigate,
  title,
}) {
  const dialogRef = useRef(null);
  const touchStartX = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const count = items.length;
  const isOpen = Boolean(open && count > 0 && index >= 0 && index < count);
  const current = isOpen ? items[index] : null;

  // Reset the reveal transition whenever the displayed photo changes
  useEffect(() => {
    if (isOpen) setLoaded(false);
  }, [index, isOpen]);

  // A new slide always gets a fresh chance to load.
  useEffect(() => {
    setFailed(false);
  }, [index]);

  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Move focus into the dialog on open
  useEffect(() => {
    if (isOpen && dialogRef.current) dialogRef.current.focus();
  }, [isOpen]);

  const goPrev = useCallback(() => {
    if (!isOpen) return;
    onNavigate(index === 0 ? count - 1 : index - 1);
  }, [isOpen, index, count, onNavigate]);

  const goNext = useCallback(() => {
    if (!isOpen) return;
    onNavigate(index === count - 1 ? 0 : index + 1);
  }, [isOpen, index, count, onNavigate]);

  // Keyboard navigator
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goNext();
          break;
        case 'Home':
          event.preventDefault();
          if (count > 0) onNavigate(0);
          break;
        case 'End':
          event.preventDefault();
          if (count > 0) onNavigate(count - 1);
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, goPrev, goNext, onNavigate, onClose, count]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    isOpen ? (
      <div
        className="hp-lb"
        role="dialog"
        aria-modal="true"
        aria-label={title ? `${title} — photo viewer` : 'Photo viewer'}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="hp-lb__scrim" onClick={onClose} aria-hidden="true" />

        <div className="hp-lb__top">
          <div className="hp-lb__meta">
            {title ? <span className="hp-lb__title">{title}</span> : null}
            <span className="hp-lb__counter" aria-live="polite">
              {index + 1} <span className="hp-lb__counter-sep">/</span> {count}
            </span>
          </div>
          <button
            type="button"
            className="hp-lb__btn hp-lb__btn--close"
            onClick={onClose}
            aria-label="Close photo viewer"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>


        <div className="hp-lb__stage">
          <button
            type="button"
            className="hp-lb__nav hp-lb__nav--prev"
            onClick={goPrev}
            aria-label="Previous photo"
            disabled={count < 2}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <figure className="hp-lb__figure" key={`${current?.src ?? ''}-${index}`}>
            {failed || !current.src ? (
              /* Unavailable photo never shows a broken-image icon. */
              <div className="hp-lb__missing" role="img" aria-label={current.alt || 'Photo unavailable'}>
                <svg viewBox="0 0 64 48" width="120" height="90" focusable="false" aria-hidden="true">
                  <rect width="64" height="48" rx="3" fill="rgba(255,255,255,0.06)" />
                  <circle cx="49" cy="12" r="5" fill="var(--hp-yellow-400)" opacity="0.85" />
                  <path d="M0 38 L16 22 L27 32 L38 21 L64 40 L64 48 L0 48 Z" fill="rgba(255,255,255,0.18)" />
                  <path d="M0 43 L20 32 L33 40 L48 30 L64 39 L64 48 L0 48 Z" fill="rgba(255,255,255,0.12)" />
                </svg>
                <span className="hp-lb__missing-note">Photo coming soon</span>
              </div>
            ) : (
              <img
                src={resolveSrc(current.src, 2000)}
                alt={current.alt || current.caption || ''}
                className={`hp-lb__img ${loaded ? 'is-in' : ''}`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setFailed(true);
                  setLoaded(true);
                }}
                decoding="async"
              />
            )}
            <figcaption className="hp-lb__caption">
              {current.caption ? <span className="hp-lb__cap-text">{current.caption}</span> : null}
              {current.credit ? <span className="hp-lb__credit">{current.credit}</span> : null}
            </figcaption>
          </figure>

          <button
            type="button"
            className="hp-lb__nav hp-lb__nav--next"
            onClick={goNext}
            aria-label="Next photo"
            disabled={count < 2}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {count > 1 ? (
          <div className="hp-lb__strip" role="tablist" aria-label="Photo thumbnails">
            {items.map((item, i) => (
              <button
                key={`${item.src}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Photo ${i + 1}${item.caption ? `: ${item.caption}` : ''}`}
                className={`hp-lb__thumb ${i === index ? 'is-active' : ''}`}
                onClick={() => onNavigate(i)}
              >
                <SmartImage src={item.src} alt="" ratio={1} rounded={false} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    ) : null,
    document.body
  );
}
