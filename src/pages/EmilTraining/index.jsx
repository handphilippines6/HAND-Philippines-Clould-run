import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { medicalMission, org } from '../../data/content.js';
import '../pages.css';

/**
 * EmilTraining — /training/emil/*  (unlinked hidden route)
 * Emergency / mission volunteer training material for confirmed volunteers.
 */
export default function EmilTraining() {
  useEffect(() => {
    document.title = 'EMIL Training — HAND-Philippines';
  }, []);

  const modules = [
    {
      title: 'Before you travel',
      points: [
        'Role-specific educational materials, instructional videos, and reading assignments are sent approximately four weeks before departure',
        'Live Zoom Q&A sessions with medical mission leadership in the weeks leading up to departure',
        'In-person mission orientation focuses on hands-on practice, teamwork, and final preparation',
      ],
    },
    {
      title: 'Community health education topics',
      points: [
        'Violence against women',
        'Community-level management of common psychiatric cases',
        'HIV prevention',
        'Basic life support and bystander CPR training',
      ],
    },
    {
      title: 'Field conduct',
      points: [
        'We work alongside local doctors, nurses, and health workers — follow the guidance of the Municipal Health Office and our local partners',
        'Missions are coordinated with the Philippine Department of Health through the Bureau of International Health Cooperation',
        'Follow-up care and referrals run through the Municipal Health Office partnership',
      ],
    },
    {
      title: 'Logistics',
      points: [
        `Primary airport: ${medicalMission.airports[0].value}`,
        medicalMission.airports[1].value,
        `Questions before departure: ${org.phone} — ask for ${medicalMission.contactName}`,
      ],
    },
  ];

  return (
    <>
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--blue" style={{ width: 280, height: 280, top: -90, left: -50 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <span className="hp-eyebrow">EMIL Training</span>
            <h1 className="hp-pagehead__title">Mission volunteer training</h1>
            <p className="hp-pagehead__lead">
              Training materials for confirmed volunteers on {medicalMission.title}. This page is
              unlinked from the main navigation by design — access is by invitation.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          <div className="hp-grid hp-grid--2">
            {modules.map((m, i) => (
              <Reveal key={m.title} delay={(i % 2) * 80}>
                <article className="hp-card">
                  <div className="hp-card__body">
                    <span className={`hp-card__icon hp-card__icon--${i % 2 ? 'sun' : 'blue'}`}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{i + 1}</span>
                    </span>
                    <h2 className="hp-card__title">{m.title}</h2>
                    <ul className="hp-ticks">
                      {m.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div style={{ marginTop: '2.5rem' }}>
              <Callout tone="info" title="Confirmed volunteer?">
                <p>
                  If you have not received your invitation link, or your token has expired, contact{' '}
                  <a href={`mailto:${org.email}`}>{org.email}</a> or call {org.phone} and ask for{' '}
                  {medicalMission.contactName}. We will reissue a link.
                </p>
              </Callout>
            </div>
          </Reveal>

          <Reveal>
            <div className="hp-cta-row" style={{ marginTop: '2rem' }}>
              <Button to="/medical-mission" variant="primary">Medical Mission details</Button>
              <Button to="/" variant="ghost">Back to home</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
