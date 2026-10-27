import { useEffect } from 'react';
import SmartImage from '../../components/media/SmartImage.jsx';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Button from '../../components/ui/Button.jsx';
import Crumbs from '../../components/ui/Crumbs.jsx';
import FormTriggerCard from '../../components/ui/FormTriggerCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { gala, org } from '../../data/content.js';
import { galaGallery } from '../../data/galleries.js';

import '../pages.css';

/**
 * Gala & Auction (/events/gala-and-auction) — design port of model1/gala.js.
 * Sponsorship inquiries post to the contactMessage Partnership lane.
 */
export default function Gala() {
  useEffect(() => {
    document.title = `${gala.eventName} — HAND-Philippines`;
  }, []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead hp-pagehead--dark">
        <div className="hp-phero">
          <div className="hp-phero__bg">
            <SmartImage src={gala.cover} alt="" ratio="16 / 9" tone="yellow" priority />
          </div>
          <span className="hp-phero__scrim" aria-hidden="true" />
          <div className="hp-container hp-phero__inner">
            <Reveal>
              <Crumbs
                items={[
                  { label: 'Home', to: '/' },
                  { label: 'Events', to: '/events' },
                  { label: gala.eventName },
                ]}
              />
              <span className="hp-eyebrow hp-eyebrow--sun">
                <Icon name="star" size={14} /> Upcoming event
              </span>
              <h1 className="hp-phero__title">{gala.name}</h1>
              <p className="hp-phero__lead">
                {gala.date} &middot; {gala.location}
              </p>
              <div className="hp-pagehead__cta">
                <Button modal="inquiry" topic="gala-tickets" variant="sun">
                  Reserve tickets
                </Button>
                <Button modal="donate" variant="outline">
                  Donate instead
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section" id="about">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader eyebrow={gala.eventName} title={gala.theme} lead={gala.supports} />
              <div className="hp-specs">
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Date &amp; time</dt>
                  <dd className="hp-specs__val">{gala.date}</dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Location</dt>
                  <dd className="hp-specs__val">{gala.location}</dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Dress code</dt>
                  <dd className="hp-specs__val">{gala.dressCode}</dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Individual tickets</dt>
                  <dd className="hp-specs__val">
                    {gala.ticketPrice} per guest — {gala.ticketIncludes}
                  </dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Reservation System</dt>
                  <dd className="hp-specs__val">
                    {gala.reservation.detail}. <strong>{gala.reservation.note}</strong>
                  </dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Tax</dt>
                  <dd className="hp-specs__val">{gala.taxDeductible}</dd>
                </div>
              </div>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <SmartImage
                src="hall-crowd"
                alt="Guests checking in at the gala registration area"
                ratio="4 / 5"
                caption="Registration and check-in"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="program">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="The evening"
              title="What happens at the Gala"
              align="center"
              tone="sun"
            />
          </Reveal>
          <Reveal>
            <ul className="hp-ticks hp-ticks--sun hp-ticks--center hp-acts">
              {gala.activities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="gallery">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Photo gallery"
              title="Evenings that fund the mission"
              align="center"
              lead="Open any photo full screen and step through the set with the navigator arrows, the keyboard, or a swipe."
            />
          </Reveal>
          <Reveal>
            <PhotoGallery photos={galaGallery} title={gala.eventName} columns={4} />
          </Reveal>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="sponsor">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader
                eyebrow="Get involved as a sponsor"
                title="Business or corporate sponsor"
                lead="We keep sponsorship high-touch and personal - a conversation first, not an application form."
              />
              <ul className="hp-ticks">
                <li>Event visibility for your brand at the Gala and Auction</li>
                <li>Direct, named impact on 2027 Bohol initiatives</li>
                <li>A high-touch presentation, virtual or in person</li>
              </ul>
              <div className="hp-specs" style={{ marginTop: '1.5rem' }}>
                {gala.sponsorContact.map((c) => (
                  <div className="hp-specs__row" key={c.label}>
                    <dt className="hp-specs__key">{c.label}</dt>
                    <dd className="hp-specs__val">
                      {c.value.indexOf('@') >= 0 ? <a href={`mailto:${c.value}`}>{c.value}</a> : c.value}
                    </dd>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <FormTriggerCard
                topic="gala-sponsor"
                iconName="building"
                tone="sun"
                title="Corporate sponsorship inquiry"
                lead="Tell us about your organization and how you would like to be involved. We will follow up with a high-touch presentation."
                bullets={[
                  'Event visibility for your brand at the Gala and Auction',
                  'Direct, named impact on 2027 Bohol initiatives',
                  'A conversation first - not an application form',
                ]}
                cta="Open the sponsorship form"
              />
            </Reveal>
          </div>
          <Reveal>
            <Callout tone="sun" title="Also: donate an auction item">
              <p>
                If your business or group would like to contribute an item to the auction instead of
                sponsoring, use the contact form on our <a href="/get-involved">Get Involved</a> page
                and choose the auction donor option.
              </p>
            </Callout>
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="tickets">
        <div className="hp-container">
          <Reveal>
            <div className="hp-closer">
              <span className="hp-orb hp-orb--yellow" style={{ width: 260, height: 260, top: -60, right: 0 }} />
              <div className="hp-closer__content">
                <h2 className="hp-closer__title">Reserve your seat at the table</h2>
                <p className="hp-closer__text">
                  {gala.ticketPrice} per guest, including dinner, auction participation, and live
                  music. A {gala.reservation.detail.toLowerCase()}. {gala.taxDeductible}
                </p>
                <div className="hp-hero__cta">
                  <Button modal="inquiry" topic="gala-tickets" variant="sun" size="lg">
                    Reserve tickets
                  </Button>
                  <Button to="/events" variant="outline" size="lg">
                    All events
                  </Button>
                </div>
                <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', opacity: 0.8 }}>
                  Questions? {org.phone} &middot; {org.email}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

