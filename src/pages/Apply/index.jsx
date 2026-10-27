import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import '../pages.css';

/**
 * Apply — /apply?token=...&id=...
 * Token-gated route reached only after an admin confirms a reservation
 * interest (03_WORKFLOWS §6). The server validates the single-use,
 * time-bound token; the client never decides validity.
 */
export default function Apply() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const id = params.get('id');

  useEffect(() => {
    document.title = 'Application — HAND-Philippines';
  }, []);

  return (
    <>
      <section className="hp-pagehead">
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <nav className="hp-crumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="hp-crumbs__sep">/</span>
              <span aria-current="page">Application</span>
            </nav>
            <span className="hp-eyebrow">Token-gated</span>
            <h1 className="hp-pagehead__title">Full application</h1>
            <p className="hp-pagehead__lead">
              This page opens only with the single-use link sent after your reservation interest was
              confirmed by our team.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container hp-container--narrow">
          <Reveal>
            <SectionHeader
              eyebrow="Access"
              title="Checking your invitation link"
              align="center"
            />
            {token ? (
              <Callout tone="info" title="Invitation link detected">
                <p>
                  We received a token for application <strong>{id || '—'}</strong>. The full
                  application form will load here once the application service is connected.
                </p>
              </Callout>
            ) : (
              <Callout tone="sun" title="No invitation link found">
                <p>
                  Open the link we emailed you, or{' '}
                  <Link to="/medical-mission/reserve">submit a reservation interest</Link> first and
                  we will confirm your place and send a link.
                </p>
              </Callout>
            )}
            <div className="hp-cta-row" style={{ marginTop: '2rem' }}>
              <Button to="/medical-mission" variant="primary">Back to the Medical Mission</Button>
              <Button to="/contact" variant="ghost">Contact us</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
