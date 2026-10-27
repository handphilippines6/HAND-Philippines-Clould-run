import { Link } from 'react-router-dom';
import { org } from '../../data/content.js';
import './Footer.css';

/**
 * Compact footer (model1 shell design): brand + legal on the left, contact
 * lines on the right, and the credit line in the bottom bar. Only verified
 * profiles are linked (Facebook); the footer never invents socials.
 */
export default function Footer() {
  const facebookUrl = (org.social.find((profile) => profile.label === 'Facebook') || {}).url || '#';

  return (
    <footer className="hp-footer">
      <div className="hp-container">
        <div className="hp-footer__compact">
          <div className="hp-footer__brand">
            <div className="hp-footer__logo">
              <img src={org.logoUrl} alt="" width="40" height="40" />
              <div>
                <p className="hp-footer__name">{org.shortName}</p>
                <p className="hp-footer__full">{org.fullName}</p>
              </div>
            </div>
            <p className="hp-footer__legal">501(c)(3) &middot; EIN {org.ein}</p>
            <p className="hp-footer__legal">Donations are tax-exempt to the fullest extent allowed by law.</p>
          </div>

          <div className="hp-footer__contact">
            <p className="hp-footer__line">
              {org.mailingAddress.line2}, {org.mailingAddress.cityStateZip}
            </p>
            <p className="hp-footer__line">
              <a href={`tel:${org.phone.replace(/[^0-9]/g, '')}`}>{org.phone}</a> ({org.phoneNote})
            </p>
            <p className="hp-footer__line">
              <a href={`mailto:${org.email}`}>{org.email}</a>
            </p>
            <p className="hp-footer__line">
              <a href={facebookUrl} target="_blank" rel="noreferrer noopener">
                Facebook<span className="hp-sr-only"> (opens in a new tab)</span>
              </a>
              <span aria-hidden="true">&middot;</span>
              <Link to="/get-involved" className="hp-footer__link">
                Get Involved
              </Link>
            </p>
          </div>
        </div>

        <div className="hp-footer__bottom">
          <p className="hp-footer__legal">&copy; 2013&ndash;2026 HAND Philippines. 501(c)(3) nonprofit. EIN {org.ein}.</p>
          <p className="hp-footer__credit">This website was developed by MSF SmartShift.</p>
        </div>
      </div>
    </footer>
  );
}

