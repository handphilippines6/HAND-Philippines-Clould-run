import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { org } from '../../data/content.js';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found — HAND-Philippines';
  }, []);

  return (
    <section className="hp-section">
      <span className="hp-orb hp-orb--yellow" style={{ width: 280, height: 280, top: 0, right: -60 }} />
      <div className="hp-container hp-container--narrow">
        <div className="hp-404">
          <span className="hp-404__code">404</span>
          <h1 className="hp-404__title">We could not find that page</h1>
          <p className="hp-404__text">
            The link may be out of date, or the page may have moved. Here are the main places to go
            from here.
          </p>
          <div className="hp-404__cta">
            <Button to="/" variant="primary" size="lg">Back to home</Button>
            <Button to="/programs" variant="outline" size="lg">Browse programs</Button>
            <Button to="/contact" variant="ghost" size="lg">Contact us</Button>
          </div>
          <ul className="hp-404__links">
            <li><Link to="/who-we-are">Who We Are</Link></li>
            <li><Link to="/medical-mission">Medical Mission</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/get-involved">Get Involved</Link></li>
            <li><Link to="/donate">Donate</Link></li>
          </ul>
          <p className="hp-404__help">
            <Icon name="mail" size={15} />
            Think this is a broken link? Let us know at {org.email}.
          </p>
        </div>
      </div>
    </section>
  );
}
