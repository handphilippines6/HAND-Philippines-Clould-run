import { useEffect } from 'react';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Icon from '../../components/ui/Icon.jsx';
import ContactForm from '../../features/contact-form/ContactForm.jsx';
import { org, getInvolved, gala } from '../../data/content.js';

import '../pages.css';

/**
 * Contact — design port of model1/contact.js.
 * The single contact form posts to /_functions/contactMessage (contact lane);
 * design preset labels ride along in the stored message for admins.
 */
const channels = [
  {
    icon: 'mail',
    label: 'General email',
    value: org.email,
    href: `mailto:${org.email}`,
    note: 'Best for most questions',
  },
  {
    icon: 'building',
    label: 'Partnerships',
    value: org.partnershipsEmail,
    href: `mailto:${org.partnershipsEmail}`,
    note: 'Corporate & institutional',
  },
  {
    icon: 'phone',
    label: 'Phone',
    value: org.phone,
    href: `tel:${String(org.phone).replace(/[^0-9]/g, '')}`,
    note: org.phoneNote,
  },
  {
    icon: 'pin',
    label: 'Mailing address',
    value: org.mailingAddress.full,
    note: 'For checks and DAF grants',
  },
];

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact — HAND-Philippines';
  }, []);

  const presets = [
    { value: 'general', label: 'General inquiry' },
    ...getInvolved.map((g) => ({ value: g.id, label: g.title })),
    { value: 'artist', label: 'Artist - donate artwork' },
    { value: 'sponsor', label: 'Gala sponsorship' },
    { value: 'reservation', label: 'Medical Mission reservation' },
    { value: 'updates', label: 'Sign up for updates' },
  ];

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--yellow" style={{ width: 300, height: 300, top: -100, right: -60 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <span className="hp-eyebrow">Contact us</span>
            <h1 className="hp-pagehead__title">Get in touch</h1>
            <p className="hp-pagehead__lead">
              One form serves every inquiry on this site - general questions, event volunteering,
              artist and auction donations, corporate partnerships, youth groups, and update
              sign-ups. We answer these ourselves, so please allow a few days.
            </p>
            <div className="hp-pagehead__cta">
              <Button to="/get-involved" variant="outline">
                Get Involved
              </Button>
              <Button to="/medical-mission" variant="primary">
                Medical Mission 2027
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section" id="channels">
        <div className="hp-container">
          <Reveal>
            <SectionHeader eyebrow="Direct lines" title="Reach us however suits you" align="center" />
          </Reveal>
          <div className="hp-grid hp-grid--4">
            {channels.map((c, i) => (
              <Reveal key={c.label} delay={i * 70}>
                <div className="hp-channel">
                  <span className="hp-channel__icon">
                    <Icon name={c.icon} size={20} />
                  </span>
                  <h3 className="hp-channel__label">{c.label}</h3>
                  {c.href ? (
                    <a className="hp-channel__value" href={c.href}>
                      {c.value}
                    </a>
                  ) : (
                    <p className="hp-channel__value">{c.value}</p>
                  )}
                  <p className="hp-channel__note">{c.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken" id="form">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader
                eyebrow="Weekly admin meeting"
                title="We hold a weekly admin meeting"
                lead="Our executive leadership is entirely volunteer-run, so we meet on a set weekly rhythm. If your question is time-sensitive - especially anything about the medical mission or the Gala - please call or text."
              />
              <ul className="hp-ticks">
                <li>Medical mission questions: {org.phone} - ask for Andy</li>
                <li>
                  Gala 2026 ({gala.date}): {org.partnershipsEmail}
                </li>
                <li>Everything else: {org.email}</li>
              </ul>
              <div className="hp-specs" style={{ marginTop: '1.75rem' }}>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Address</dt>
                  <dd className="hp-specs__val">{org.mailingAddress.full}</dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Leadership</dt>
                  <dd className="hp-specs__val">
                    {org.leadership.name} - {org.leadership.role}
                  </dd>
                </div>
                <div className="hp-specs__row">
                  <dt className="hp-specs__key">Status</dt>
                  <dd className="hp-specs__val">
                    {org.taxStatus} &middot; EIN {org.ein}
                  </dd>
                </div>
              </div>
              <ul className="hp-social">
                {org.social.map((s) => (
                  <li key={s.label}>
                    <a href={s.url} target="_blank" rel="noreferrer noopener">
                      {s.label}
                      <span className="hp-sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <ContactForm
                type="General Inquiry"
                typeLabel="General inquiry"
                title="Send us a message"
                lead="Fields marked * are required. Choose the closest topic so your message reaches the right person."
                showTypeSelect
                presets={presets}
                submitLabel="Send message"
                source="contact-page"
              />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}

