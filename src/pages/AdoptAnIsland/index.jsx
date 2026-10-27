import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdoptIsland from '../../features/adopt-island/AdoptIsland.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import '../../pages/pages.css';

/**
 * Adopt an Island — Vela Neonatal Resuscitation Project.
 * The board itself (interactive map, sponsor form, Stripe) lives in the
 * adopt-island feature; this page supplies the public page shell.
 */
export default function AdoptAnIsland() {
  useEffect(() => {
    document.title = 'Adopt an Island — HAND-Philippines';
  }, []);

  return (
    <>
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--blue" style={{ width: 280, height: 280, top: -90, right: -50 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <nav className="hp-crumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="hp-crumbs__sep">/</span>
              <Link to="/medical-mission">Medical Mission</Link>
              <span className="hp-crumbs__sep">/</span>
              <span aria-current="page">Adopt an Island</span>
            </nav>
            <span className="hp-eyebrow hp-eyebrow--sun">Vela Neonatal Resuscitation</span>
            <h1 className="hp-pagehead__title">Adopt an Island</h1>
            <p className="hp-pagehead__lead">
              Sponsor a neonatal resuscitation kit for an island community off northern Bohol —
              and your name appears beside the island you support.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          <AdoptIsland />
        </div>
      </section>
    </>
  );
}
