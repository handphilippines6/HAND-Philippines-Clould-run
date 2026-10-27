import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import Callout from '../components/ui/Callout.jsx';
import '../pages/pages.css';

/**
 * PortalPlaceholder — auth-gated portal shell.
 * These routes are code-split so a public visitor never downloads portal or
 * admin code. Real portals require a server session; until then they render
 * a clear, non-misleading notice rather than a fake dashboard.
 */
export default function PortalPlaceholder({ portal = 'Portal', phase }) {
  useEffect(() => {
    document.title = `${portal} — HAND-Philippines`;
  }, [portal]);

  return (
    <section className="hp-section">
      <div className="hp-container hp-container--narrow">
        <div className="hp-portal">
          <span className="hp-portal__icon">
            <Icon name="shield" size={28} />
          </span>
          <span className="hp-eyebrow">Sign-in required</span>
          <h1 className="hp-portal__title">{portal}</h1>
          <p className="hp-portal__text">
            This area requires an authenticated session. Access is granted by our team after your
            application is reviewed — there is no public sign-up.
          </p>

          {phase ? (
            <Callout tone="sun" title={`Scheduled for ${phase}`}>
              <p>
                This portal is gated on the Philippine Data Privacy Act (2012) review and does not go
                live until that review is recorded.
              </p>
            </Callout>
          ) : null}

          <div className="hp-portal__cta">
            <Button to="/contact" variant="primary">Request access</Button>
            <Button to="/" variant="ghost">Back to home</Button>
          </div>

          <p className="hp-portal__links">
            Looking to volunteer instead? <Link to="/get-involved">Get Involved</Link> ·{' '}
            <Link to="/medical-mission/reserve">join the 2027 mission</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
