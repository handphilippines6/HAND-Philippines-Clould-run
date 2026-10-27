import { useEffect } from 'react';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Button from '../../components/ui/Button.jsx';
import Crumbs from '../../components/ui/Crumbs.jsx';
import FormTriggerCard from '../../components/ui/FormTriggerCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { medicalMission, org } from '../../data/content.js';
import { useModal } from '../../components/ui/ModalProvider.jsx';

import '../pages.css';

/**
 * Reserve (/medical-mission/reserve) — design port of model1/reserve.js.
 * The route is a dialog first: on arrival the reservation interest form opens
 * over this page (model1 routeModals), so a deep link or refresh lands on the
 * form itself while the page still renders underneath.
 */
export default function Reserve() {
  const { open } = useModal();
  const m = medicalMission;

  useEffect(() => {
    document.title = 'Reserve — Medical Mission 2027 — HAND-Philippines';
    open('inquiry', { topic: 'reserve-2027' });
    // Auto-open exactly once per mount, mirroring the shell's routeModals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--yellow" style={{ width: 280, height: 280, top: -90, right: -50 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <Crumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Medical Mission', to: '/medical-mission' },
                { label: 'Reserve' },
              ]}
            />
            <span className="hp-eyebrow hp-eyebrow--sun">Reservation interest</span>
            <h1 className="hp-pagehead__title">Reserve your place for {m.title}</h1>
            <p className="hp-pagehead__lead">
              {m.dates} &middot; {m.location}. {m.reservation.note}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader eyebrow="Before you apply" title="What happens next" />
              <ol className="hp-steps">
                <li className="hp-steps__item">
                  <span className="hp-steps__num">1</span>
                  <div>
                    <h3 className="hp-steps__title">Send your interest</h3>
                    <p className="hp-steps__text">
                      Fill in the form with your contact details and the role you are interested in.
                    </p>
                  </div>
                </li>
                <li className="hp-steps__item">
                  <span className="hp-steps__num">2</span>
                  <div>
                    <h3 className="hp-steps__title">Admin review</h3>
                    <p className="hp-steps__text">
                      Our team reviews the interest list. Priority is given to those on the 2026
                      waitlist, and to keeping an effective balance of skills.
                    </p>
                  </div>
                </li>
                <li className="hp-steps__item">
                  <span className="hp-steps__num">3</span>
                  <div>
                    <h3 className="hp-steps__title">Full registration</h3>
                    <p className="hp-steps__text">
                      Clinical registration is handled administratively with {m.contactName} — this
                      form is interest only, not a confirmed seat.
                    </p>
                  </div>
                </li>
              </ol>
              <Callout
                tone="sun"
                title="Prefer to talk to someone?"
              >
                <p>
                  Call, VM, or text <strong>{m.reservation.phone}</strong> and ask for{' '}
                  {m.contactName}. You can also email{' '}
                  <a href={`mailto:${org.email}`}>{org.email}</a>.
                </p>
              </Callout>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <FormTriggerCard
                topic="reserve-2027"
                iconName="hands"
                title="Reservation interest form"
                lead="Fields marked * are required. We will contact you before confirming anything - this is interest, not a confirmed seat."
                cta="Open the reservation form"
              />
            </Reveal>
          </div>
          <Reveal>
            <div className="hp-cta-row">
              <Button
                to="/medical-mission"
                variant="ghost"
                iconLeft={<span aria-hidden="true">&larr;</span>}
              >
                Back to mission details
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* Keep the Icon import honest for the split layout's future icons. */
export const __icon = Icon;
