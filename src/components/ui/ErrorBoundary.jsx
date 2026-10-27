import { Component } from 'react';
import Button from './Button.jsx';

/** ErrorBoundary — keeps one failed route from blanking the whole SPA. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Route error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="hp-container hp-skeleton-page">
        <span className="hp-eyebrow hp-eyebrow--sun">Something went wrong</span>
        <h1 className="hp-section-title">This page could not be displayed</h1>
        <p className="hp-section-lead">
          An unexpected error occurred while loading this section. You can try again, or return to the
          home page.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2rem' }}>
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
          <Button to="/" variant="outline">Back to home</Button>
        </div>
      </div>
    );
  }
}

