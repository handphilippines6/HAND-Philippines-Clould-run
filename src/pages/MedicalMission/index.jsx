import { useEffect } from 'react';
import SmartImage from '../../components/media/SmartImage.jsx';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Callout from '../../components/ui/Callout.jsx';
import StatGrid from '../../components/ui/StatGrid.jsx';
import Button from '../../components/ui/Button.jsx';
import Crumbs from '../../components/ui/Crumbs.jsx';
import FormTriggerCard from '../../components/ui/FormTriggerCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { medicalMission, whyItMatters, org } from '../../data/content.js';
import { missionGallery } from '../../data/galleries.js';

import '../pages.css';

/**
 * Medical Mission (/medical-mission) — design port of model1/medical-mission.js.
 * Reservation interest posts to the /_functions/contactMessage interest lane.
 */
export default function MedicalMission() {
  useEffect(() => {
    document.title = 'Medical Mission 2027 — HAND-Philippines';
  }, []);

  const m = medicalMission;
  const specs = [
    { key: 'Dates', val: m.dates },
    { key: 'Location', val: m.location },
    { key: 'Volunteers', val: m.volunteers },
    { key: 'Services', val: m.services },
    { key: 'Priority', val: m.priority },
  ].concat(m.airports || []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead hp-pagehead--dark">
        <div className="hp-phero">
          <div className="hp-phero__bg">
            <SmartImage src={m.cover} alt="" ratio="16 / 9" priority />
          </div>
          <span className="hp-phero__scrim" aria-hidden="true" />
          <div className="hp-container hp-phero__inner">
            <Reveal>
              <Crumbs items={[{ label: 'Home', to: '/' }, { label: m.title }]} />
              <span className="hp-eyebrow">
                <Icon name="plane" size={14} /> Upcoming mission
              </span>
              <h1 className="hp-phero__title">{m.title}</h1>
              <p className="hp-phero__lead">
                {m.dates} &middot; {m.location}. {m.services}.
              </p>
              <div className="hp-pagehead__cta">
                <Button to="/medical-mission/reserve" variant="sun">
                  Reserve your place
                </Button>
                <Button modal="donate" variant="outline">
                  Donate to the mission
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section" id="mission-info">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader eyebrow="Coming mission information" title={m.title} lead={m.priority} />
              <div className="hp-specs">
                {specs.map((s) => (
                  <div className="hp-specs__row" key={s.key}>
                    <dt className="hp-specs__key">{s.key}</dt>
                    <dd className="hp-specs__val">{s.val}</dd>
                  </div>
                ))}
              </div>
              <Callout tone="sun" title={`Questions? Contact ${m.contactName}`}>
                <p>
                  Call, VM, or text <strong>{m.contactPhone}</strong>. Reservation forms are handled
                  through {m.contactName} - priority goes to those already on the 2026 waitlist.
                </p>
              </Callout>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <SmartImage
                src="field-clinic"
                alt="Volunteers at a community mobile clinic"
                ratio="4 / 3"
                caption="Community-based mobile clinics travel to 3-5 locations per trip."
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="why">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Why it matters"
              title="The cost of waiting, in Bohol"
              align="center"
              tone="sun"
              lead="Coverage is limited even where care is nominally nationalized - so people wait, and waiting has a cost."
            />
          </Reveal>
          <Reveal>
            <ul className="hp-ticks hp-ticks--sun hp-ticks--wide hp-why">
              {whyItMatters.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <div className="hp-grid hp-grid--3 hp-cost">
              <div className="hp-cost__item">
                <span className="hp-cost__val">$1,770</span>
                <span className="hp-cost__label">Average annual family income, Bohol (family of six)</span>
              </div>
              <div className="hp-cost__item">
                <span className="hp-cost__val">~$1,000</span>
                <span className="hp-cost__label">
                  Cataract surgery copay at a subsidized government hospital
                </span>
              </div>
              <div className="hp-cost__item">
                <span className="hp-cost__val">$1,500-$2,000</span>
                <span className="hp-cost__label">
                  Major elective surgery (cholecystectomy, hernia repair)
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="general">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="General information"
              title="Who we need, and what we do"
              align="center"
              lead="Since 2014 we have partnered with Rural Health Units, district hospitals, and local healthcare professionals to expand access to care patients cannot afford."
            />
          </Reveal>
          <div className="hp-grid hp-grid--2 hp-mm-two">
            <Reveal>
              <article className="hp-card">
                <div className="hp-card__body">
                  <h3 className="hp-card__title">About the mission</h3>
                  <ul className="hp-ticks">
                    {m.generalInformation.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
            <Reveal delay={90}>
              <article className="hp-card">
                <div className="hp-card__body">
                  <h3 className="hp-card__title">P2P fundraising</h3>
                  <ul className="hp-ticks hp-ticks--sun">
                    {m.p2p.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <div className="hp-card__foot">
                    <Button modal="inquiry" topic="reserve-2027" variant="primary" size="sm">
                      Open the reservation form
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
          <div className="hp-balance">
            <Reveal>
              <SectionHeader
                eyebrow="Team balance"
                title={m.teamBalance.note}
                align="center"
                tone="sun"
              />
            </Reveal>
            <div className="hp-roles">
              {m.teamBalance.roles.map((r, i) => (
                <Reveal key={r.role} delay={i * 60}>
                  <div className="hp-role">
                    <div className="hp-role__info">
                      <p className="hp-role__name">{r.role}</p>
                      {r.note ? <p className="hp-role__note">{r.note}</p> : null}
                    </div>
                    <span className="hp-role__slots">{r.slots}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="schedule">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader
                eyebrow="Schedule"
                title="Medical Mission 2027 itinerary"
                lead="Eleven days in Bohol: orientation, a lecture day, five clinic days across two mobile teams, and time to rest."
              />
              <ol className="hp-sched">
                {m.schedule.map((s) => (
                  <li className="hp-sched__item" key={s.date}>
                    <span className="hp-sched__date">{s.date}</span>
                    <span className="hp-sched__title">{s.title}</span>
                    {s.detail ? <span className="hp-sched__detail">{s.detail}</span> : null}
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <SmartImage
                src="tent-exam"
                alt="Patients waiting at a medical mission clinic site"
                ratio="3 / 4"
                caption="The waiting area on a mission day."
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section" id="services">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="2027 services"
              title="What we are aiming for"
              align="center"
              lead="Stated goals for the 2027 mission in Bohol."
            />
          </Reveal>
          <div className="hp-grid hp-grid--3">
            {m.serviceGoals.map((g, i) => (
              <Reveal key={g.label} delay={(i % 3) * 70}>
                <article className="hp-card">
                  <div className="hp-card__body">
                    <h3 className="hp-card__title">{g.label}</h3>
                    <p className="hp-card__text">{g.detail}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section className="hp-section hp-section--sunken">
        <div className="hp-container">
          <div className="hp-grid hp-grid--2">
            <Reveal>
              <article className="hp-card">
                <div className="hp-card__body">
                  <span className="hp-card__icon hp-card__icon--blue">
                    <Icon name="book" size={20} />
                  </span>
                  <h3 className="hp-card__title">Volunteer preparation</h3>
                  <ul className="hp-ticks">
                    {m.preparation.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
            <Reveal delay={90}>
              <article className="hp-card">
                <div className="hp-card__body">
                  <span className="hp-card__icon hp-card__icon--sun">
                    <Icon name="heart" size={20} />
                  </span>
                  <h3 className="hp-card__title">What volunteers can expect</h3>
                  <ul className="hp-ticks hp-ticks--sun">
                    {m.expectations.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section" id="gallery">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Photo gallery"
              title="Previous medical missions"
              align="center"
              lead="Open any photo for the full-screen viewer - navigate with the arrows, the keyboard, or by swiping."
            />
          </Reveal>
          <Reveal>
            <PhotoGallery photos={missionGallery} title="Medical missions" columns={3} />
          </Reveal>
        </div>
      </section>

      <section className="hp-section hp-section--sunken">
        <div className="hp-container">
          <div className="hp-grid hp-grid--2">
            <Reveal>
              <Callout tone="info" title="Sponsors">
                <p>{m.sponsorsNote}</p>
                <p style={{ marginTop: '0.75rem' }}>
                  To become a mission sponsor, contact{' '}
                  <a href={`mailto:${org.partnershipsEmail}`}>{org.partnershipsEmail}</a> or call{' '}
                  {org.phone}.
                </p>
              </Callout>
            </Reveal>
            <Reveal delay={90}>
              <Callout tone="sun" title="Patient testimonials">
                <p>{m.testimonialsNote}</p>
              </Callout>
            </Reveal>
          </div>
          <Reveal>
            <StatGrid
              stats={[
                { value: '3,000', label: 'Patient goal', note: 'Across two mobile teams, 2027', tone: 'sun' },
                { value: '70', label: 'Major surgeries', note: 'Up from 53 in 2026', tone: 'blue' },
                { value: '216+', label: 'Cataract surgeries', note: 'Goal to exceed last year', tone: 'blue' },
                { value: '350', label: 'ER & inpatient', note: '300 ER patients, 50 inpatients', tone: 'sun' },
              ]}
            />
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="reserve">
        <div className="hp-container">
          <Reveal>
            <div className="hp-closer">
              <span className="hp-orb hp-orb--yellow" style={{ width: 260, height: 260, top: -60, right: 0 }} />
              <div className="hp-closer__content">
                <h2 className="hp-closer__title">Ready to join us in Bohol?</h2>
                <p className="hp-closer__text">
                  {m.reservation.note} For anything urgent, call or text {m.contactName} at{' '}
                  {m.reservation.phone}.
                </p>
                <div className="hp-hero__cta">
                  <Button to="/medical-mission/reserve" variant="sun" size="lg">
                    Reserve / Register Interest
                  </Button>
                  <Button to="/get-involved" variant="outline" size="lg">
                    Other ways to help
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="hp-ftrigger-wrap" id="reservation-form">
              <FormTriggerCard
                topic="reserve-2027"
                iconName="hands"
                title="Reservation interest form"
                lead="This is an interest form, not clinical registration. Full registration is handled administratively after review."
                cta="Open the reservation form"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

