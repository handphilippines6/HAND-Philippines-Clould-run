import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import '../pages.css';
import '../Donate/Daf.css';

/**
 * Donor-Advised Fund (DAF) hidden page (/donate/daf) — design port of
 * model1/donate-daf.js.
 *
 * Hidden page: reachable from the donate flow's prominent DAF button, but
 * never in the navigator. Instructional content only — there is no transaction
 * path here, so no Stripe, no HTTP call, no dollar amounts.
 *
 * The DAF provider's give-through link is the one owner-supplied value on this
 * page. It lives in a single constant so the owner pastes the DAF-account URL
 * without touching markup. When it is empty the page shows written
 * instructions instead of a dead button.
 */

/* >>> Owner: paste the DAF Direct give-through URL here, e.g. a DAF Direct /
   charity recommendation link, or leave "" to show written instructions. <<< */
const DAF_DIRECT_URL = '';

export default function Daf() {
  useEffect(() => {
    document.title = 'Give Through Your DAF — HAND-Philippines';
  }, []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <div className="hp-container hp-text-center">
          <span className="hp-eyebrow hp-eyebrow--onDark">Donor-Advised Fund</span>
          <h1 className="hp-pagehead__title">Give Through Your Donor-Advised Fund</h1>
          <p className="hp-pagehead__lead">
            Make a grant recommendation from your DAF to HAND-Philippines and put the dollars you
            have already set aside to work for rural healthcare equity.
          </p>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-daf-container">
          <div className="hp-card">
            <h2 className="hp-card__title">How it works</h2>
            <ol className="hp-daf-steps">
              <li>
                <b>Log in to your DAF sponsor</b>
                <span>Fidelity Charitable, Schwab Charitable, DAF Direct, or your community foundation.</span>
              </li>
              <li>
                <b>Recommend a grant to HAND-Philippines</b>
                <span>Use our legal name and EIN below so the grant reaches us.</span>
              </li>
              <li>
                <b>We confirm and put it to work</b>
                <span>You will receive a written confirmation and a thank-you from our team.</span>
              </li>
            </ol>

            <p style={{ marginBottom: 'var(--hp-space-4)' }}>
              <strong>Legal name:</strong> HAND-Philippines
              <br />
              <strong>EIN (tax ID):</strong> 46-4698622 — a registered 501(c)(3) public charity.
              Grants are tax-deductible to the extent allowed by law.
            </p>

            {DAF_DIRECT_URL ? (
              <a
                className="hp-btn hp-btn--sun hp-btn--lg"
                href={DAF_DIRECT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Give Through DAF Direct ↗
              </a>
            ) : (
              <span className="hp-btn hp-btn--sun hp-btn--lg" data-daf-hint>
                🤝 Donate Through Your DAF
              </span>
            )}
            <br />
            <Link
              to="/donate"
              className="hp-eyebrow"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--hp-space-2)',
                color: 'var(--hp-blue-600)',
                textDecoration: 'none',
                marginTop: 'var(--hp-space-4)',
                minHeight: '44px',
              }}
            >
              ← Back to donate
            </Link>
          </div>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-daf-container">
          <div className="hp-card hp-daf-mail">
            <h2 className="hp-card__title">Don't use DAF Direct? Mail a grant recommendation.</h2>
            <p className="hp-card__text">
              If your funder does not offer a give-through link, your DAF sponsor can mail us a
              check issued from the fund, or you can use the written recommendation your sponsor
              provides.
            </p>
            <p className="hp-card__text">
              Mail a check (made payable to <strong>HAND-Philippines</strong>) to:
            </p>
            <p className="hp-card__text">
              <code>HAND-Philippines</code>
              <br />
              <code>PO Box 85, Augusta, ME 04332</code>
            </p>
            <p className="hp-card__text">
              Please include your grant letter or a short note with your email address so we can
              send a proper receipt.
            </p>
            <p style={{ margin: 0, fontSize: 'var(--hp-text-xs)', color: 'var(--hp-color-text-muted)' }}>
              Mailing instructions are owned by the organization; if the address changes, update
              the approved source before editing this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
