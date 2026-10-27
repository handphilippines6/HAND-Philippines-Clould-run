import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import '../pages.css';
import './Check.css';

/**
 * Mailing-a-Check hidden page (/donate/check) — design port of
 * model1/donate-check.js.
 *
 * Hidden page: reachable from the donate flow's mail-a-check button, never in
 * the navigator. Zero platform fees, so the article keeps it. Instructional
 * content only — no transaction path, no Stripe.
 *
 * The mailing address must stay in sync with the approved source (the contact
 * page and footer already publish PO Box 85, Augusta, ME 04332). If the PO box
 * changes, update that approved source and this page together.
 */
export default function Check() {
  useEffect(() => {
    document.title = 'Mail a Check — HAND-Philippines';
  }, []);

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <div className="hp-container hp-text-center">
          <span className="hp-eyebrow hp-eyebrow--onDark">Mail a Check</span>
          <h1 className="hp-pagehead__title">A Simple, Fee-Free Way to Give</h1>
          <p className="hp-pagehead__lead">
            Every dollar you send by check goes straight to the work — no platform fees in the
            middle. It is old school, and that is exactly the point.
          </p>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-check-container">
          <div className="hp-card">
            <h2 className="hp-card__title">How to mail your gift</h2>
            <ol className="hp-check-steps">
              <li>
                <b>Make the check payable to</b>
                <code>HAND-Philippines</code>
              </li>
              <li>
                <b>Add your email in the memo line</b>
                so we can send a tax receipt (or include a note inside).
              </li>
              <li>
                <b>Mail it to the address below</b>
                and rest easy knowing 100% of the value reaches the work.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-check-container">
          <div className="hp-card hp-check-address">
            <h2 style={{ color: 'var(--hp-blue-900)', marginTop: 0 }}>Mail to</h2>
            <code>HAND-Philippines</code>
            <code>PO Box 85</code>
            <code>Augusta, ME 04332</code>
            <p
              style={{
                margin: 'var(--hp-space-4) 0 0',
                fontSize: 'var(--hp-text-sm)',
                color: 'var(--hp-color-text-muted)',
                fontWeight: 600,
              }}
            >
              HAND-Philippines is a registered 501(c)(3) public charity. EIN: 46-4698622. Your gift
              is tax-deductible to the extent allowed by law.
            </p>
          </div>
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
      </section>
    </div>
  );
}
