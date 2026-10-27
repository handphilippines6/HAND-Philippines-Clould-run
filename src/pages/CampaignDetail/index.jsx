import { useEffect, useState } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import './CampaignDetail.css';

/**
 * Campaign (/campaigns/:slug) — design port of model1/campaign.js.
 *
 * Serves the documented /campaigns/:slug route. Reads the slug from the path
 * (or ?slug= / ?campaign=), loads the active campaign from
 * GET /_functions/campaign?slug=<slug>, and renders a read-only public page
 * with progress and a donate call-to-action.
 *
 * Presentation only by construction: no Stripe key, no secrets, and the
 * backend decides publication (only ACTIVE campaigns are returned).
 */

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/_functions`;
const DEFAULT_IMAGE =
  'https://static.wixstatic.com/media/f3ccce_bb82f3d2b6c2408f9dadca528a4723f6~mv2.jpg/v1/fit/w_1200,h_1200,q_75/donate-hero-kids.jpg';

function formatMoney(cents, currency = 'USD') {
  const value = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString('en-US')}`;
  }
}

async function loadCampaign(slug) {
  const response = await fetch(`${API_BASE}/campaign?slug=${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, error: 'Invalid server response.' };
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed (${response.status}).`);
  }
  return data.campaign || data.data?.campaign || data.data || data || {};
}

export default function CampaignDetail() {
  const { slug: slugParam } = useParams();
  const [searchParams] = useSearchParams();
  const slug = (slugParam || searchParams.get('slug') || searchParams.get('campaign') || '')
    .trim()
    .toLowerCase();

  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Campaign — HAND-Philippines';
    if (!slug) return undefined;
    let cancelled = false;
    loadCampaign(slug)
      .then((data) => {
        if (cancelled) return;
        setCampaign(data);
        document.title = `${data.title || 'Campaign'} — HAND-Philippines`;
      })
      .catch((err) => {
        if (cancelled) return;
        setError('This campaign could not be loaded. Please try again later.');
        console.error('[Campaign] Load failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* Build the donate link carrying the campaign context (same params the
     donation panel reads back). */
  const donateUrl = `/donate${
    campaign?.id
      ? `?campaign=${encodeURIComponent(campaign.id)}${
          campaign?.slug ? `&campaign_slug=${encodeURIComponent(campaign.slug)}` : ''
        }`
      : ''
  }`;

  const goalCents = Number(campaign?.goalCents || 0);
  const raisedCents = Number(campaign?.raisedCents || 0);
  const percent = goalCents > 0 ? Math.min(100, (raisedCents / goalCents) * 100) : 0;
  const title = campaign?.title || 'Campaign';
  const summary = campaign?.summaryPitch || campaign?.description || '';
  const story = campaign?.description || campaign?.summaryPitch || '';

  return (
    <div className="campaign-page" data-campaign-slug={slug}>
      <header className="campaign-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">H</span>
            <span>HAND Philippines</span>
          </Link>
          <div className="header-actions">
            <Link className="home-link" to="/">
              Home
            </Link>
            <Link className="donate-button" to={donateUrl}>
              Donate Now
            </Link>
          </div>
        </div>
      </header>

      {!slug ? (
        <div className="loading" data-campaign-state>
          Add a campaign slug (or open /campaigns/your-slug) to view a campaign.
        </div>
      ) : error ? (
        <div className="error" data-campaign-state>
          {error}
        </div>
      ) : !campaign ? (
        <div className="loading" data-campaign-state>
          Loading campaign…
        </div>
      ) : (
        <main className="content" data-campaign-content>
          <section className="hero">
            <div className="hero-inner">
              <p className="eyebrow">Campaign</p>
              <h1>{title}</h1>
              {summary ? <p className="hero-summary">{summary}</p> : null}
            </div>
          </section>

          <div className="layout">
            <div>
              {campaign.image ? (
                <section className="card">
                  <img
                    className="hero-image"
                    src={campaign.image || DEFAULT_IMAGE}
                    alt={title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_IMAGE;
                    }}
                  />
                </section>
              ) : null}
              <section className="card">
                <h2>About This Campaign</h2>
                <div className="story">
                  {story || 'Learn more about this campaign and the impact your gift makes.'}
                </div>
              </section>
            </div>

            <aside>
              <section className="card">
                <h2>Campaign Snapshot</h2>
                <div className="snapshot">
                  <div className="metric">
                    <strong>{formatMoney(raisedCents)}</strong>
                    <span>Raised</span>
                  </div>
                  <div className="metric">
                    <strong>{formatMoney(goalCents)}</strong>
                    <span>Goal</span>
                  </div>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${percent.toFixed(1)}%` }} />
                </div>
                <span className="percent">{percent.toFixed(1).replace('.0', '')}% funded</span>
                <Link className="cta" to={donateUrl}>
                  Donate Now
                </Link>
              </section>
            </aside>
          </div>
        </main>
      )}

      <footer className="campaign-footer">
        <div className="footer-inner">
          Every gift helps strengthen healthcare in the Philippines.
        </div>
      </footer>
    </div>
  );
}

