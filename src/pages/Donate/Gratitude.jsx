import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import { org } from '../../data/content.js';
import { homeGallery } from '../../data/galleries.js';
import '../pages.css';

const POLL_MS = 3000;

/**
 * Gratitude / confirmation page — /donate/gratitude/:donationId
 *
 * Per 03_WORKFLOWS §1, this page only appears once the server has reported
 * SUCCEEDED. The client polls GET /api/donations/:id/status and never writes
 * a final status itself.
 */
export default function Gratitude() {
  const { donationId } = useParams();
  const [state, setState] = useState('checking');

  useEffect(() => {
    document.title = 'Thank you — HAND-Philippines';
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const poll = async () => {
      try {
        const res = await fetch(`/api/donations/${donationId}/status`);
        if (!res.ok) throw new Error('status unavailable');
        const data = await res.json();
        if (cancelled) return;
        if (data.status === 'SUCCEEDED') setState('succeeded');
        else if (['FAILED', 'CANCELED'].includes(data.status)) setState('failed');
        else timer = setTimeout(poll, POLL_MS);
      } catch {
        if (!cancelled) setState('unavailable');
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [donationId]);

  return (
    <>
      <section className="hp-section">
        <div className="hp-container hp-container--narrow">
          {state === 'succeeded' ? (
            <Reveal className="hp-thanks">
              <span className="hp-thanks__icon">
                <Icon name="check" size={34} />
              </span>
              <h1 className="hp-thanks__title">Salamat po — your gift is confirmed.</h1>
              <p className="hp-thanks__text">
                Thank you. Your donation has been verified and recorded. A receipt is on its way to
                your email, and your gift goes directly to medical shipments, operations, training, and
                clinic upgrades.
              </p>
              <p className="hp-thanks__ref">
                Confirmation reference: <strong>{donationId}</strong>
              </p>
              <div className="hp-thanks__cta">
                <Button to="/" variant="primary">Back to home</Button>
                <Button to="/get-involved" variant="outline">Get involved</Button>
                <Button to="/donate" variant="ghost">Donate again</Button>
              </div>
            </Reveal>
          ) : state === 'failed' ? (
            <Reveal className="hp-thanks hp-thanks--error">
              <span className="hp-thanks__icon hp-thanks__icon--error">
                <Icon name="close" size={30} />
              </span>
              <h1 className="hp-thanks__title">That payment did not go through.</h1>
              <p className="hp-thanks__text">
                Nothing was charged. You can try again, or use one of the zero-fee routes instead.
              </p>
              <div className="hp-thanks__cta">
                <Button to="/donate" variant="primary">Retry donation</Button>
                <Button to="/donate/daf" variant="outline">Use a DAF</Button>
                <Button to="/donate/check" variant="ghost">Mail a check</Button>
              </div>
            </Reveal>
          ) : (
            <Reveal className="hp-thanks">
              <span className="hp-thanks__icon hp-thanks__icon--pending">
                <Icon name="calendar" size={30} />
              </span>
              <h1 className="hp-thanks__title">
                {state === 'checking' ? 'Confirming your donation…' : 'We are confirming your donation'}
              </h1>
              <p className="hp-thanks__text">
                A payment is only treated as complete once our payment provider confirms it to us. This
                page will update automatically. You can safely close it — we will email your receipt
                either way.
              </p>
              {state === 'unavailable' ? (
                <p className="hp-thanks__ref">
                  We could not reach the donation service just now. If you were charged, your gift is
                  still recorded — contact us at{' '}
                  <a href={`mailto:${org.email}`}>{org.email}</a> with reference{' '}
                  <strong>{donationId}</strong>.
                </p>
              ) : null}
              <div className="hp-thanks__cta">
                <Button to="/" variant="primary">Back to home</Button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="hp-section hp-section--sunken">
        <div className="hp-container">
          <Reveal>
            <h2 className="hp-section-title hp-text-center">What your gift is working on</h2>
            <p className="hp-section-lead hp-text-center" style={{ marginInline: 'auto' }}>
              216 cataract surgeries, 59 major surgeries, and 2,800 patients served in 2025–2026 — with
              zero percent of donations going to administrative salaries.
            </p>
          </Reveal>
          <Reveal>
            <div style={{ marginTop: '2rem' }}>
              <PhotoGallery photos={homeGallery.slice(0, 3)} title="In the field" columns={3} />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
