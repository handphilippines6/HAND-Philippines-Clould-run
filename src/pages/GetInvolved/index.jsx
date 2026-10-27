import { useEffect } from 'react';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import FormTriggerCard from '../../components/ui/FormTriggerCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { getInvolved, org } from '../../data/content.js';
import { homeGallery, galaGallery } from '../../data/galleries.js';
import { useModal } from '../../components/ui/ModalProvider.jsx';

import '../pages.css';

/**
 * Get Involved — design port of model1/get-involved.js.
 * Every option card opens the shared interest dialog with its own topic.
 */
export default function GetInvolved() {
  const { open } = useModal();

  useEffect(() => {
    document.title = 'Get Involved — HAND-Philippines';
  }, []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--blue" style={{ width: 320, height: 320, top: -110, right: -60 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <span className="hp-eyebrow">Get involved</span>
            <h1 className="hp-pagehead__title">There is more than one way to help</h1>
            <p className="hp-pagehead__lead">
              Volunteer in the Philippines, volunteer at our US events, bring a youth or school
              group, donate art or auction items, partner as an organization, or simply keep up
              with what we are doing.
            </p>
            <div className="hp-pagehead__cta">
              <Button to="/medical-mission" variant="primary">
                Join the 2027 mission
              </Button>
              <Button modal="donate" variant="sun">
                Donate
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="ways">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Ways to take part"
              title="Choose what fits you"
              align="center"
              lead="Each of these uses the same contact form - pick the one that matches, and we will follow up personally."
            />
          </Reveal>
          <div className="hp-grid hp-grid--3">
            {getInvolved.map((g, i) => (
              <Reveal key={g.id} delay={(i % 3) * 70}>
                <article className="hp-card hp-card--interactive" id={g.id}>
                  <div className="hp-card__body">
                    <div className="hp-card__top">
                      <span className={`hp-card__icon hp-card__icon--${g.tone}`}>
                        <Icon name={g.icon} size={20} />
                      </span>
                    </div>
                    <h3 className="hp-card__title">{g.title}</h3>
                    <p className="hp-card__text">{g.text}</p>
                    {g.contacts && g.contacts.length ? (
                      <ul className="hp-involved__contacts">
                        {g.contacts.map((c) => (
                          <li key={c.label}>
                            <span className="hp-involved__contact-label">{c.label}</span>
                            {c.href ? (
                              <a href={c.href}>{c.value}</a>
                            ) : (
                              <span className="hp-involved__contact-val">{c.value}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      className={`hp-card__cta hp-card__cta--${g.tone}`}
                      onClick={() => open('inquiry', { topic: g.id })}
                    >
                      Ask about this <Icon name="arrowRight" size={16} />
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="involvement-form">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader
                eyebrow="One form"
                title="Tell us how you want to help"
                lead="This single form serves every option on this page, plus artist, auction, youth group, sponsorship, and update sign-ups."
              />
              <ul className="hp-ticks">
                <li>We reply personally - usually within a few days</li>
                <li>No newsletter engine, no automated drip</li>
                <li>Your details are used only to respond to you</li>
              </ul>
              <div className="hp-specs" style={{ marginTop: '1.5rem' }}>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Email</dt>
                  <dd className="hp-specs__val">
                    <a href={`mailto:${org.email}`}>{org.email}</a>
                  </dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Phone</dt>
                  <dd className="hp-specs__val">
                    <a href={`tel:${String(org.phone).replace(/[^0-9]/g, '')}`}>{org.phone}</a> (
                    {org.phoneNote})
                  </dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Partnerships</dt>
                  <dd className="hp-specs__val">
                    <a href={`mailto:${org.partnershipsEmail}`}>{org.partnershipsEmail}</a>
                  </dd>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <Button to="/contact" variant="outline" iconLeft={<Icon name="arrowRight" size={17} />}>
                  General contact page
                </Button>
              </div>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <FormTriggerCard
                topic="volunteer"
                iconName="hands"
                title="Get involved"
                lead="Choose what you are interested in, then tell us a little about yourself. One dialog serves every option on this page."
                bullets={[
                  'Pick the option that fits you best inside the form',
                  'We reply personally - usually within a few days',
                  'No newsletter engine, no automated drip',
                ]}
                cta="Open the interest form"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section" id="us-events">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Volunteer with us in the US"
              title="Gala and Art Sale volunteers"
              align="center"
              tone="sun"
              lead="We need hands on the ground in Maine and California - registration, setup, hosting, and follow-up."
            />
          </Reveal>
          <Reveal>
            <PhotoGallery photos={galaGallery} title="US events" columns={4} />
          </Reveal>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="field">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="In the field"
              title="What you would be joining"
              align="center"
              lead="Our volunteers work alongside Filipino doctors, nurses, and local health workers - not instead of them."
            />
          </Reveal>
          <Reveal>
            <PhotoGallery photos={homeGallery} title="In the field" columns={3} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

