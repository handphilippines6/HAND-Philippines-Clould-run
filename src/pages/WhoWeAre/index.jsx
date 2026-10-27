import { useEffect } from 'react';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import FormTriggerCard from '../../components/ui/FormTriggerCard.jsx';
import Timeline from '../../components/ui/Timeline.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import SmartImage from '../../components/media/SmartImage.jsx';
import { timeline, roster, mission, vision } from '../../data/content.js';
import { storyGallery } from '../../data/galleries.js';

import '../pages.css';

/**
 * Who We Are (/who-we-are) — design port of model1/about.js.
 * Pagehead, mission/vision minis, story timeline, roster cards, gallery,
 * and the shared-form trigger card.
 */
export default function WhoWeAre() {
  useEffect(() => {
    document.title = 'Who We Are — HAND-Philippines';
  }, []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--yellow" style={{ width: 300, height: 300, top: -100, right: -60 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <span className="hp-eyebrow">Who we are</span>
            <h1 className="hp-pagehead__title">Our Story, Timeline &amp; Roster</h1>
            <p className="hp-pagehead__lead">
              A grassroots movement of Filipino and American doctors, nurses, and neighbors - grown
              into a 501(c)3 nonprofit serving communities across the Philippines.
            </p>
            <div className="hp-pagehead__cta">
              <Button to="/medical-mission" variant="primary">
                Join Mission 2027
              </Button>
              <Button modal="donate" variant="sun">
                Donate Now
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section hp-section--tight">
        <div className="hp-container">
          <div className="hp-grid hp-grid--2">
            <Reveal className="hp-mini hp-mini--blue">
              <h2 className="hp-mini__title">{mission.label}</h2>
              <p className="hp-mini__text">{mission.text}</p>
            </Reveal>
            <Reveal className="hp-mini hp-mini--sun" delay={80}>
              <h2 className="hp-mini__title">{vision.label}</h2>
              <p className="hp-mini__text">{vision.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section" id="story">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Our Story & Timeline"
              title="From a 2013 grassroots response to today"
              align="center"
              lead="We began when Filipino doctors and nurses and the diaspora in Maine and California started collecting donations. This is how it has grown."
            />
          </Reveal>
          <div className="hp-tl-wrap">
            <Timeline items={timeline} />
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="roster">
        <div className="hp-container">
          <Reveal>
            <SectionHeader eyebrow="Roster" title="Our Roster" align="center" lead={roster.lead} />
          </Reveal>
          {roster.groups.map((group) => (
            <div className="hp-roster__group" key={group.label}>
              <h3 className="hp-roster__group-title hp-reveal">{group.label}</h3>
              <div className="hp-roster__grid">
                {group.people.map((person, i) => (
                  <Reveal key={person.name} delay={(i % 4) * 60}>
                    <article className="hp-person hp-card">
                      <div className="hp-person__media">
                        <SmartImage src={person.photo} alt={person.photo ? person.name : ''} ratio="1" />
                      </div>
                      <div className="hp-person__body">
                        <h4 className="hp-person__name">{person.name}</h4>
                        <p className="hp-person__role">{person.role}</p>
                      </div>
                    </article>
                  </Reveal>
                ))}
                {group.people.length
                  ? null
                  : Array.from({ length: 2 }).map((_, i) => (
                      <Reveal key={`pending-${i}`}>
                        <article className="hp-person hp-card hp-person--pending">
                          <div className="hp-person__media">
                            <SmartImage src="" alt="" ratio="1" />
                          </div>
                          <div className="hp-person__body">
                            <p className="hp-person__name">Name to be added</p>
                            <p className="hp-person__role">Role to be added</p>
                          </div>
                        </article>
                      </Reveal>
                    ))}
              </div>
            </div>
          ))}
          <Reveal>
            <p className="hp-roster__note">{roster.photoNote}</p>
          </Reveal>
        </div>
      </section>

      <section className="hp-section hp-section--sunken">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Photo gallery"
              title="Tungod, and the years since"
              align="center"
              lead="Open any photo to review it full screen. Navigate with the arrow keys, the on-screen arrows, or by swiping."
            />
          </Reveal>
          <Reveal>
            <PhotoGallery photos={storyGallery} title="Our story" columns={4} />
          </Reveal>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container hp-container--narrow">
          <Reveal>
            <FormTriggerCard
              topic="general"
              iconName="mail"
              title="Questions about our organization?"
              lead="Reach the volunteer team with a question, a partnership idea, or a request for our disclosures. The form opens right here - no page change, no lost context."
              bullets={[
                'A volunteer replies personally, usually within a few days',
                'No newsletter engine, no automated drip',
                'Your details are used only to reply to you',
              ]}
              cta="Open the message form"
              note="Prefer email? Our address and phone are in the footer of every page."
            />
            <div className="hp-cta-row">
              <Button modal="inquiry" topic="governance" variant="outline">
                Request governance disclosures
              </Button>
              <Button to="/get-involved" variant="ghost">
                Join the volunteer network
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

