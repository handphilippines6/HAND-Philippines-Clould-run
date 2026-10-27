import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { impactMapProjects } from '../../data/galleries.js';
import './ImpactMap.css';

/**
 * Interactive impact map (home) — port of the model1 hp-map markup plus its
 * setupImpactMap runtime as React state: SVG pins on a stylised Philippines
 * outline, a details card, and a "Select Region" tab grid. Clicking a pin or a
 * tab selects that project; the card and the active markers follow.
 */
export default function ImpactMap() {
  const [activeId, setActiveId] = useState(impactMapProjects[0]?.id);
  const active = impactMapProjects.find((p) => p.id === activeId) || impactMapProjects[0];

  return (
    <div className="hp-map">
      <div className="hp-map__canvas">
        <svg
          viewBox="0 0 500 700"
          className="hp-map__svg"
          role="img"
          aria-label="Simplified map of the Philippines showing project locations"
        >
          <g className="hp-map__land">
            <path d="M 200,60 L 250,50 L 270,100 L 290,160 L 260,220 L 230,240 L 210,180 L 190,120 Z" />
            <path d="M 280,210 L 320,240 L 300,280 L 270,240 Z" />
            <path d="M 230,300 L 270,290 L 280,330 L 240,340 Z" />
            <path d="M 290,320 L 320,300 L 330,360 L 300,380 Z" />
            <path d="M 270,350 L 290,340 L 285,400 L 265,390 Z" />
            <path d="M 260,430 L 350,420 L 370,510 L 300,560 L 250,520 L 280,470 Z" />
            <path d="M 180,460 L 230,480 L 210,510 Z" />
          </g>
          {impactMapProjects.map((p) => (
            <g key={p.id} transform={`translate(${p.pin.x}, ${p.pin.y})`}>
              <g
                className={`hp-map__pin${p.tone === 'sun' ? ' hp-map__pin--sun' : ''}${p.id === active.id ? ' is-active' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={p.id === active.id}
                aria-label={`${p.region}: ${p.title}`}
                onClick={() => setActiveId(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveId(p.id);
                  }
                }}
              >
                <circle className="hp-map__ping" r="12" />
                <circle className="hp-map__dot" r="8" />
                <text className="hp-map__label" x={p.pin.labelX} y="4">
                  {p.pin.label}
                </text>
              </g>
            </g>
          ))}
        </svg>
        <p className="hp-map__hint">Tap any marked node to view details</p>
      </div>

      <div className="hp-map__panel">
        <div className="hp-map__card" role="region" aria-live="polite" aria-label="Project details">
          <span className="hp-map__region">
            <Icon name="pin" size={14} />
            <span className="hp-map__region-text">{active.region}</span>
          </span>
          <h3 className="hp-map__title">{active.title}</h3>
          <p className="hp-map__desc">{active.desc}</p>
          <ul className="hp-map__tags">
            {active.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="hp-map__cta">
            <a href="/get-involved">
              Inquire about volunteering here <Icon name="arrowRight" size={14} />
            </a>
          </p>
        </div>

        <div className="hp-map__tabs">
          <p className="hp-map__tabs-label">Select Region:</p>
          <div className="hp-map__tabs-grid">
            {impactMapProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`hp-map__tab${p.id === active.id ? ' is-active' : ''}`}
                aria-pressed={p.id === active.id}
                onClick={() => setActiveId(p.id)}
              >
                {p.pin.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
