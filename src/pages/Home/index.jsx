import { useEffect } from 'react';
import SmartImage from '../../components/media/SmartImage.jsx';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import Button from '../../components/ui/Button.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import StatGrid from '../../components/ui/StatGrid.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import ImpactMap from '../../features/map/ImpactMap.jsx';
import { useModal } from '../../components/ui/ModalProvider.jsx';
import { org, mission, vision, principles, impact, financialTransparency } from '../../data/content.js';
import { homeGallery } from '../../data/galleries.js';

import '../pages.css';
import './Home.css';

/**
 * Home — design port of model1/home.js.
 * Hero, mission/vision, principles, interactive impact map, impact numbers,
 * field gallery, closing callout.
 *
 * `/donate` is a dialog first (model1 routeModals): the Donate route renders
 * this view with autoDonate so a deep link or the header button lands on the
 * giving dialog itself, over the page.
 */
export default function Home({ autoDonate = false }) {
  const { open } = useModal();

  useEffect(() => {
    document.title = `HAND-Philippines — ${org.fullName}`;
    if (autoDonate) open('donate');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="hp-page">
      {/* ---- 1. Hero ------------------------------------------------------ */}
      <section className="hp-hero">
        <span className="hp-orb hp-orb--yellow" style={{ width: 340, height: 340, top: -90, right: -60 }} />
        <span className="hp-orb hp-orb--blue" style={{ width: 420, height: 420, bottom: -150, left: -120 }} />
        <div className="hp-container hp-hero__inner">
          <div className="hp-hero__content">
            <span className="hp-eyebrow hp-eyebrow--sun">
              <Icon name="sun" size={14} /> {org.name}
            </span>
            <h1 className="hp-hero__title">
              Bayanihan in action for
              <span className="hp-hero__accent"> health equity</span> in the Philippines
            </h1>
            <p className="hp-hero__lead">{org.generalPrinciple}</p>
            <div className="hp-hero__cta">
              <Button modal="donate" variant="sun" size="lg">
                Donate Now
              </Button>
              <Button to="/medical-mission" variant="outline" size="lg">
                Medical Mission 2027
              </Button>
              <Button to="/get-involved" variant="ghost" size="lg">
                Get Involved
              </Button>
            </div>
            <ul className="hp-hero__facts">
              <li>
                <Icon name="calendar" size={16} /> Next mission: April 20-30, 2027
              </li>
              <li>
                <Icon name="pin" size={16} /> Bohol, Philippines
              </li>
              <li>
                <Icon name="heart" size={16} /> 501(c)3 &middot; EIN {org.ein}
              </li>
            </ul>
          </div>
          <div className="hp-hero__media">
            <div className="hp-hero__frame">
              <SmartImage
                src="barrio-children"
                alt="Children of Barangay Tungod, northern Bohol, with volunteers"
                ratio="4 / 5"
                priority
              />
            </div>
            <div className="hp-hero__badge">
              <span className="hp-hero__badge-value">2,800</span>
              <span className="hp-hero__badge-label">patients served 2025-2026</span>
            </div>
            <div className="hp-hero__chip">
              <SmartImage src="field-clinic" alt="Volunteers at a community mobile clinic" ratio="1" tone="yellow" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- 2 & 3. Mission + Vision -------------------------------------- */}
      <section className="hp-section" id="mission">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Who we are"
              title="Mission & Vision"
              align="center"
              lead="Two halves of one name: Health Assistance, and Network Development."
            />
          </Reveal>
          <div className="hp-grid hp-grid--2 hp-mv">
            <Reveal className="hp-mv__card hp-mv__card--blue">
              <span className="hp-mv__label">
                <Icon name="heart" size={15} /> {mission.label}
              </span>
              <h3 className="hp-mv__title">{mission.text}</h3>
            </Reveal>
            <Reveal className="hp-mv__card hp-mv__card--sun" delay={90}>
              <span className="hp-mv__label">
                <Icon name="users" size={15} /> {vision.label}
              </span>
              <h3 className="hp-mv__title">{vision.text}</h3>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- 4. Principles / Guidance ------------------------------------- */}
      <section className="hp-section hp-section--sunken" id="principles">
        <div className="hp-container">
          <div className="hp-princ">
            <Reveal className="hp-princ__intro">
              <SectionHeader
                eyebrow="Principles & Guidance"
                title="Inspired by the Bayanihan Spirit"
                lead="A concept deeply rooted in Filipino culture and tradition referring to the spirit of communal unity, cooperation, and helping one another in need."
              />
            </Reveal>
            <Reveal className="hp-princ__media" delay={120}>
              <SmartImage
                src="mission-banner"
                alt="A community carrying a house together - the Bayanihan spirit"
                ratio="4 / 3"
                caption="Bayanihan: a community carrying a home together."
              />
            </Reveal>
          </div>
          <div className="hp-grid hp-grid--3 hp-princ__grid">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <article className="hp-princ__card hp-card">
                  <div className="hp-card__body">
                    <span className={`hp-princ__num hp-princ__num--${i % 2 ? 'sun' : 'blue'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="hp-card__title">{p.title}</h3>
                    <p className="hp-card__text">{p.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="hp-values">
              <span className="hp-values__label">Core values</span>
              <ul className="hp-values__list">
                <li>Generosity</li>
                <li>Compassion</li>
                <li>Unity</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 5. Interactive impact map ------------------------------------ */}
      <section className="hp-section hp-section--sunken" id="map">
        <div className="hp-container">
          <div className="hp-map__head">
            <Reveal>
              <span className="hp-eyebrow">Our Reach Across Islands</span>
              <h2 className="hp-section-title">Interactive Impact Map</h2>
            </Reveal>
            <p className="hp-section-lead">
              Click on mapped project nodes below to see details about our ongoing Adopt-a-RHU
              installations, neonatal resuscitation clinics, and disaster response sites.
            </p>
          </div>
          <Reveal>
            <ImpactMap />
          </Reveal>
        </div>
      </section>

      {/* ---- 6. Impact ------------------------------------------------------ */}
      <section className="hp-section" id="impact">
        <span className="hp-orb hp-orb--blue" style={{ width: 300, height: 300, top: 10, right: -110 }} />
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Our Impact"
              title="2025-2026 in numbers"
              align="center"
              tone="sun"
              lead="Verified, server-approved figures only. Zero percent of donations goes toward administrative salaries."
            />
          </Reveal>
          <Reveal>
            <StatGrid stats={impact} />
          </Reveal>
          <Reveal>
            <div className="hp-impact__note">
              <ul className="hp-ticks hp-ticks--sun">
                {financialTransparency.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Gallery --------------------------------------------------------- */}
      <section className="hp-section hp-section--sunken" id="gallery">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Photo gallery"
              title="Faces, not stock imagery"
              lead="Every photograph here was taken by our volunteers in the field. Select any photo to review it full screen - use the arrow keys or swipe to move through the set."
            />
          </Reveal>
          <Reveal>
            <PhotoGallery photos={homeGallery} title="In the field" columns={3} />
          </Reveal>
        </div>
      </section>

      {/* ---- Closing CTA ------------------------------------------------------ */}
      <section className="hp-section">
        <div className="hp-container">
          <Reveal>
            <Callout
              tone="sun"
              title="A small, volunteer-run organization"
            >
              <p>
                We do not have a huge budget for glitzy things, so we keep it simple. Executive
                leadership operates purely on a volunteer basis, and{' '}
                <strong>
                  100% of gifts directly fund medical shipments, operations, training, and clinic
                  upgrades.
                </strong>
              </p>
            </Callout>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

