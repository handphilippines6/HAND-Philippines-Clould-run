import { useEffect } from 'react';
import SmartImage from '../../components/media/SmartImage.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Button from '../../components/ui/Button.jsx';
import Crumbs from '../../components/ui/Crumbs.jsx';
import FormTriggerCard from '../../components/ui/FormTriggerCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { artAmongTheMeadows } from '../../data/content.js';

import '../pages.css';

/**
 * Art Among the Meadows (/events/art-among-the-meadows) — design port of
 * model1/art.js. Artist inquiries post to the contactMessage Donation lane.
 */
export default function ArtAmongTheMeadows() {
  useEffect(() => {
    document.title = 'Art Among the Meadows — HAND-Philippines';
  }, []);

  const a = artAmongTheMeadows;

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--blue" style={{ width: 300, height: 300, top: -100, left: -70 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Events', to: '/events' }, { label: a.name }]} />
            <span className="hp-eyebrow">
              <Icon name="brush" size={14} /> {a.status}
            </span>
            <h1 className="hp-pagehead__title">{a.name}</h1>
            <p className="hp-pagehead__lead">{a.description}</p>
            <div className="hp-pagehead__cta">
              <Button to="/contact" variant="sun">
                Donate artwork
              </Button>
              <Button to="/events" variant="outline">
                All events
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="about">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader eyebrow="Description" title={a.name} lead={a.description} />
              <ul className="hp-ticks">
                <li>A community art sale raising funds for HAND-Philippines programs</li>
                <li>Local artists and supporters come together in one place</li>
                <li>Proceeds support the same work as our Gala and missions</li>
              </ul>
              <div style={{ marginTop: '1.75rem' }}>
                <Callout tone="info" title="Event details are still being finalized">
                  <p>{a.photoNote}</p>
                  <p style={{ marginTop: '0.6rem' }}>
                    If you would like artwork donated, or would like to attend, reach out below and
                    we will send the details as soon as they are confirmed.
                  </p>
                </Callout>
              </div>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <SmartImage
                src={a.cover}
                alt="Guests mingling at a community event"
                ratio="4 / 3"
                caption="Our community events bring people together in the same way."
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="involve">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader
                eyebrow="How to get involved as an artist"
                title="Donate artwork"
                lead={a.howToInvolve}
              />
              <ul className="hp-ticks hp-ticks--sun">
                <li>Reach out with the medium and size of the piece</li>
                <li>We will confirm whether it fits the event format</li>
                <li>Artists are welcome to attend and exhibit their own work</li>
              </ul>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <FormTriggerCard
                topic="art-inquiry"
                iconName="brush"
                tone="sun"
                title="Artist inquiry"
                lead="Tell us about the work you would like to donate and we will follow up."
                bullets={[
                  'Send the medium and size of the piece',
                  'We confirm whether it fits the event format',
                  'Artists are welcome to exhibit in person',
                ]}
                cta="Open the artist form"
              />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
