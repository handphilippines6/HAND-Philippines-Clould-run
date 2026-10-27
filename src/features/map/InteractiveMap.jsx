import { useState } from 'react';
import { MAP_PATH } from './mapPath.js';
import './InteractiveMap.css';

/**
 * Interactive map (React-only) — the Philippines with the northern-Bohol
 * "Vela pilot project area" marked.
 *
 * The marker group is keyboard/click accessible and reveals a callout with the
 * project detail. This component exists only in the React SPA; the Wix model1
 * site keeps its own island-board map and does not mount this one.
 */
const PILOT = {
  title: 'Vela pilot project area',
  body:
    'The islands lie off northern Bohol, in the central Philippines. Vela neonatal resuscitation kits and hands-on training will reach the birth attendants of these island communities.',
};

export default function InteractiveMap() {
  const [active, setActive] = useState(false);

  return (
    <figure className="loc" aria-label="Map of the Philippines with northern Bohol marked">
      <div className="loc__wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 169 265"
          role="img"
          aria-label="Map of the Philippines with northern Bohol marked"
        >
          <rect width="169" height="265" rx="8" fill="#d9e9f5"></rect>
          <path d={MAP_PATH} fill="#f3efe4" stroke="#a3ada6" strokeWidth="0.6"></path>
          <g
            className={`loc__pilot${active ? ' is-active' : ''}`}
            role="button"
            tabIndex={0}
            aria-expanded={active}
            aria-label="Vela pilot project area"
            onClick={() => setActive((v) => !v)}
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActive((v) => !v);
              }
            }}
          >
            <circle className="loc__ring" cx="122.7" cy="174.5" r="6" fill="none" stroke="#D4572A" strokeWidth="1.6"></circle>
            <circle className="loc__dot" cx="122.7" cy="174.5" r="1.6" fill="#D4572A"></circle>
            <line className="loc__line" x1="117.7" y1="170.5" x2="98.7" y2="152.5" stroke="#D4572A" strokeWidth="0.8"></line>
            <text
              className="loc__label"
              x="108.7"
              y="149.5"
              fontSize="7.5"
              fontWeight="700"
              fill="#D4572A"
              textAnchor="end"
              fontFamily="Helvetica,Arial,sans-serif"
            >
              Vela pilot project area
            </text>
          </g>
          <text x="8" y="14" fontSize="8.5" fontWeight="700" fill="#040273" fontFamily="Helvetica,Arial,sans-serif">
            Philippines
          </text>
        </svg>

        {active && (
          <div className="loc__tooltip" role="status">
            <strong>{PILOT.title}</strong>
            <span>{PILOT.body}</span>
          </div>
        )}
      </div>
      <figcaption className="loc__caption">The islands lie off northern Bohol, in the central Philippines.</figcaption>
    </figure>
  );
}
