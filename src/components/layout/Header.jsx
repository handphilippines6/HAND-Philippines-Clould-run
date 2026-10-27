import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';
import { org } from '../../data/content.js';
import './Header.css';

/** Main navigation, mirroring the documented information architecture. */
const nav = [
  { label: 'Home', to: '/' },
  { label: 'Who We Are', to: '/who-we-are' },
  {
    label: 'Programs',
    to: '/programs',
    children: [
      { label: 'Medical Student Rotation', to: '/programs/academic-research' },
      { label: 'All Programs', to: '/programs' },
    ],
  },
  {
    label: 'Medical Mission',
    to: '/medical-mission',
    children: [
      { label: 'Medical Mission Trip 2027', to: '/medical-mission' },
      { label: 'Reserve / Interest Form', to: '/medical-mission/reserve' },
    ],
  },
  {
    label: 'Events',
    to: '/events',
    children: [
      { label: 'Gala 2026', to: '/events/gala-and-auction' },
      { label: 'Art Among the Meadows', to: '/events/art-among-the-meadows' },
    ],
  },
  { label: 'Get Involved', to: '/get-involved' },
  { label: 'Contact', to: '/contact' },
];

/**
 * Prefetch a route's chunk on hover/focus (04_FRONTEND §2) so the perceived
 * page switch is instant. Failures are swallowed — a failed prefetch must
 * never break navigation.
 */
const prefetched = new Set();
const loaders = {
  '/': () => import('../../pages/Home/index.jsx'),
  '/who-we-are': () => import('../../pages/WhoWeAre/index.jsx'),
  '/programs': () => import('../../pages/Programs/index.jsx'),
  '/medical-mission': () => import('../../pages/MedicalMission/index.jsx'),
  '/medical-mission/reserve': () => import('../../pages/MedicalMission/Reserve.jsx'),
  '/events': () => import('../../pages/Events/index.jsx'),
  '/events/gala-and-auction': () => import('../../pages/Events/Gala.jsx'),
  '/events/art-among-the-meadows': () => import('../../pages/Events/ArtAmongTheMeadows.jsx'),
  '/get-involved': () => import('../../pages/GetInvolved/index.jsx'),
  '/contact': () => import('../../pages/Contact/index.jsx'),
  '/donate': () => import('../../pages/Donate/index.jsx'),
};

function prefetch(to) {
  const key = to.split('#')[0];
  if (prefetched.has(key)) return;
  prefetched.add(key);
  try {
    loaders[key]?.().catch(() => {});
  } catch {
    /* non-fatal */
  }
}

function Logo() {
  return (
    <Link to="/" className="hp-logo" aria-label={`${org.shortName} — home`}>
      <span className="hp-logo__mark" aria-hidden="true">
        <img src={org.logoUrl} alt="" width="44" height="44" />
      </span>
      <span className="hp-logo__text">
        <span className="hp-logo__name">HAND-Philippines</span>
        <span className="hp-logo__full">Health Assistance &amp; Network Development</span>
      </span>
    </Link>
  );
}

/** Main navigation, mirroring the documented information architecture (01_SITE_MAP §1). */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A navigation always closes the mobile drawer.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className={`hp-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="hp-container hp-header__inner">
        <Logo />

        <nav className="hp-nav" aria-label="Main navigation">
          <ul className="hp-nav__list">
            {nav.map((item) => (
              <li key={item.to} className="hp-nav__item">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onMouseEnter={() => prefetch(item.to)}
                  onFocus={() => prefetch(item.to)}
                  className={({ isActive }) => `hp-nav__link${isActive ? ' is-active' : ''}`}
                >
                  {item.label}
                </NavLink>

                {item.children ? (
                  <ul className="hp-nav__drop">
                    {item.children.map((child) => (
                      <li key={child.to}>
                        <Link
                          to={child.to}
                          className="hp-nav__drop-link"
                          onMouseEnter={() => prefetch(child.to)}
                          onFocus={() => prefetch(child.to)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <div className="hp-header__actions">
          <Button to="/donate" variant="sun" className="hp-header__donate">
            Donate
          </Button>
          <button
            type="button"
            className="hp-burger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="hp-drawer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <div className="hp-drawer" id="hp-drawer" hidden={!menuOpen}>
        <ul className="hp-drawer__list">
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `hp-drawer__link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
                <Icon name="arrowRight" size={16} />
              </NavLink>

              {item.children ? (
                <ul className="hp-drawer__sub">
                  {item.children
                    .filter((child) => child.to !== item.to)
                    .map((child) => (
                      <li key={child.to}>
                        <Link to={child.to} className="hp-drawer__sub-link">
                          {child.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="hp-drawer__cta">
          <Button to="/donate" variant="sun" full>
            Donate
          </Button>
          <Button to="/medical-mission/reserve" variant="outline" full>
            Join the 2027 mission
          </Button>
        </div>
      </div>
    </header>
  );
}
