import { useEffect } from 'react';
import SmartImage from '../../components/media/SmartImage.jsx';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import Card from '../../components/ui/Card.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { gala, artAmongTheMeadows } from '../../data/content.js';
import { galaGallery } from '../../data/galleries.js';

import '../pages.css';

/**
 * Events — design port of model1/event.js.
 * Pagehead + upcoming gala feature + event cards + past-events note + gallery.
 */
export default function Events() {
  useEffect(() => {
    document.title = 'Events — HAND-Philippines';
  }, []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--yellow" style={{ width: 320, height: 320, top: -110, right: -70 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <span className="hp-eyebrow hp-eyebrow--sun">Events</span>
            <h1 className="hp-pagehead__title">Gala, Auction &amp; Art Among the Meadows</h1>
            <p className="hp-pagehead__lead">
              Our US events raise the funds that make the missions, cargo, and training possible.
              Come as a guest, volunteer, donate art, or sponsor.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="upcoming">
        <div className="hp-container">
          <Reveal>
            <SectionHeader eyebrow="Upcoming event" title={gala.name} align="center" tone="sun" lead={gala.theme} />
          </Reveal>
          <Reveal>
            <div className="hp-event">
              <div className="hp-event__media">
                <SmartImage src={gala.cover} alt={gala.name} ratio="4 / 3" priority />
              </div>
              <div className="hp-event__body">
                <div className="hp-specs">
                  <div className="hp-specs__row">
                    <dt className="hp-specs__key">Date</dt>
                    <dd className="hp-specs__val">{gala.date}</dd>
                  </div>
                  <div className="hp-specs__row">
                    <dt className="hp-specs__key">Location</dt>
                    <dd className="hp-specs__val">{gala.location}</dd>
                  </div>
                  <div className="hp-specs__row">
                    <dt className="hp-specs__key">Ticket</dt>
                    <dd className="hp-specs__val">
                      {gala.ticketPrice} per guest — {gala.ticketIncludes}
                    </dd>
                  </div>
                  <div className="hp-specs__row">
                    <dt className="hp-specs__key">Dress code</dt>
                    <dd className="hp-specs__val">{gala.dressCode}</dd>
                  </div>
                </div>
                <div className="hp-event__cta">
                  <Button to="/events/gala-and-auction" variant="sun">
                    Gala details &amp; tickets
                  </Button>
                  <Button to="/contact" variant="outline">
                    Sponsor the Gala
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="all-events">
        <div className="hp-container">
          <Reveal>
            <SectionHeader eyebrow="Our events" title="Two ways to show up" align="center" />
          </Reveal>
          <div className="hp-grid hp-grid--2">
            <Reveal>
              <Card
                to="/events/gala-and-auction"
                title={gala.eventName}
                eyebrow="Upcoming"
                tone="sun"
                icon="gavel"
                image={gala.cover}
                imageAlt={gala.name}
                imageRatio={16 / 10}
                text={`${gala.name} — ${gala.date} at ${gala.location}. ${gala.ticketPrice} per guest, with dinner, auction, and live music.`}
                cta="View gala details"
              />
            </Reveal>
            <Reveal delay={90}>
              <Card
                to="/events/art-among-the-meadows"
                title={artAmongTheMeadows.name}
                eyebrow="Coming soon"
                tone="blue"
                icon="brush"
                image={artAmongTheMeadows.cover}
                imageAlt={artAmongTheMeadows.name}
                imageRatio={16 / 10}
                text={artAmongTheMeadows.description}
                cta="How to take part"
              />
            </Reveal>
          </div>
          <Reveal>
            <div className="hp-past">
              <h2 className="hp-past__title">Past events archive</h2>
              <p className="hp-past__text">
                A lightweight, low-maintenance archive of previous events. We add to it as photos
                become available rather than maintaining a full news feed.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Photo gallery"
              title="Moments from our events"
              align="center"
              lead="Select any photo to open the full-screen viewer with the navigator arrows."
            />
          </Reveal>
          <Reveal>
            <PhotoGallery photos={galaGallery} title="Gala and Auction" columns={4} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
