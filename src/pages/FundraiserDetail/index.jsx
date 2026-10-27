import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './FundraiserDetail.css';

/**
 * Fundraiser (/fundraisers/:slug) — design port of model1/fundraising.js.
 *
 * Serves the documented /fundraisers/:slug route (also /fundraiser/:slug
 * legacy). Loads the fundraiser + supporters from the read-only endpoints and
 * renders a public page with story, gallery, supporters, thermometer, and a
 * QR share card.
 */

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/_functions`;
const FUNDRAISER_STORAGE_KEY = 'hand.fundraiser_id';
const DEFAULT_IMAGE =
  'https://static.wixstatic.com/media/f3ccce_bb82f3d2b6c2408f9dadca528a4723f6~mv2.jpg/v1/fit/w_1200,h_1200,q_75/donate-hero-kids.jpg';

function formatMoney(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    Number(cents || 0) / 100,
  );
}

function daysLabel(days) {
  if (days == null || days === '') return null;
  const n = Number(days);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return 'Campaign ended';
  return `${n} day${n === 1 ? '' : 's'} left`;
}

function getFundraiserId(data) {
  return data?.fundraiser?.id || data?.data?.fundraiser?.id || data?.id || null;
}

function getFundraiser(data) {
  return data?.fundraiser || data?.data?.fundraiser || data?.data || data || {};
}

async function apiFetch(path) {
  const response = await fetch(`${API_BASE}${path}`, {
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
  return data;
}

async function loadFundraiser(slug) {
  const data = await apiFetch(`/fundraiser?slug=${encodeURIComponent(slug)}`);
  const fundraiser = getFundraiser(data);
  const donorsData = await apiFetch(`/fundraiserDonors?slug=${encodeURIComponent(slug)}`).catch(
    () => ({ supporters: [] }),
  );

  return {
    fundraiser,
    supporters: donorsData.supporters || donorsData.donors || donorsData.data || [],
  };
}

function SafeImage({ src, alt, className }) {
  return (
    <img
      className={className}
      src={src || DEFAULT_IMAGE}
      alt={alt || 'HAND Philippines'}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = DEFAULT_IMAGE;
      }}
    />
  );
}

export default function FundraiserDetail() {
  const { slug: slugParam } = useParams();
  const slug = slugParam || '';

  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Fundraiser — HAND-Philippines';
    if (!slug) return undefined;
    let cancelled = false;
    loadFundraiser(slug)
      .then((data) => {
        if (cancelled) return;
        setPayload(data);
        const id = getFundraiserId(data);
        if (id) {
          try {
            localStorage.setItem(FUNDRAISER_STORAGE_KEY, String(id));
          } catch {
            /* storage may be unavailable */
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError('This fundraiser could not be loaded. Please try again later.');
        console.error('[Fundraising] Load failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const fundraiser = payload?.fundraiser || {};
  const campaign = fundraiser.campaign || payload?.campaign || {};
  const metrics = campaign.metrics || {};
  const name = fundraiser.name || 'HAND Philippines Fundraiser';
  const raisedCents = campaign.raisedCents ?? campaign.currentRaised ?? 0;
  const goalCents = campaign.goalCents ?? campaign.goalAmountCents ?? campaign.goal ?? 0;
  const percent = goalCents > 0 ? Math.min(100, Math.max(0, (raisedCents / goalCents) * 100)) : 0;
  const currency = campaign.currency || 'USD';
  const campaignUrl = `${window.location.origin}/fundraisers/${encodeURIComponent(slug || fundraiser.slug || '')}`;
  const qrUrl =
    fundraiser.qrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(campaignUrl)}`;
  const story =
    fundraiser.story || campaign.description || 'This fundraiser is supporting HAND Philippines healthcare programs.';
  const profilePhoto = fundraiser.profilePhotoUrl || DEFAULT_IMAGE;
  const photos = campaign.photos || fundraiser.photos || [];
  const fundraiserId = fundraiser.id || null;
  const daysText = daysLabel(metrics.daysRemaining ?? campaign.daysRemaining);
  const supporters = payload?.supporters || [];
  const safePhotos = photos.filter((p) => p?.url).slice(0, 6);
  const donateUrl = `/donate?${new URLSearchParams({
    ...(fundraiserId ? { fundraiser: String(fundraiserId) } : {}),
    ...(slug || fundraiser.slug ? { fundraiser_slug: slug || fundraiser.slug } : {}),
  }).toString()}`;

  return (
    <div className="fundraising-page" data-fundraiser-slug={slug}>
      <header className="fundraising-header">
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
        <div className="loading" data-fundraiser-state>
          Add a fundraiser_slug (or open /fundraiser/your-slug) to view a fundraiser page.
        </div>
      ) : error ? (
        <div className="error" data-fundraiser-state>
          {error}
        </div>
      ) : !payload ? (
        <div className="loading" data-fundraiser-state>
          Loading fundraiser…
        </div>
      ) : (
        <main className="content" data-fundraiser-content>
          <section className="hero">
            <div className="hero-grid">
              <div>
                <p className="eyebrow">{campaign.status || 'Active fundraiser'}</p>
                <h1>{campaign.title || name}</h1>
                <p className="hero-copy">
                  {campaign.description ||
                    'Join this personal appeal to help bring care and opportunity to Filipino communities.'}
                </p>
              </div>
              <div className="profile">
                <SafeImage className="profile-photo" src={profilePhoto} alt={name} />
                <div className="profile-name">{name}</div>
                <div className="profile-slug">@{fundraiser.slug || slug}</div>
              </div>
            </div>
          </section>

          <div className="layout">
            <div>
              <section className="section card">
                <h2>Campaign Story</h2>
                <div className="story">{story}</div>
              </section>

              <section className="section card">
                <h2>Campaign Gallery</h2>
                <div className="gallery">
                  {safePhotos.length ? (
                    safePhotos.map((photo, i) => (
                      <SafeImage
                        key={`${photo.url}-${i}`}
                        src={photo.url}
                        alt={photo.alt || 'Fundraiser campaign photo'}
                      />
                    ))
                  ) : (
                    <SafeImage src={DEFAULT_IMAGE} alt="HAND Philippines campaign" />
                  )}
                </div>
              </section>

              <section className="section card">
                <h2>Supporters</h2>
                <div className="supporters">
                  {supporters.length ? (
                    supporters.slice(0, 30).map((supporter, i) => {
                      const supporterName =
                        supporter.anonymous === true || supporter.isAnonymous === true
                          ? 'Anonymous'
                          : supporter.name || supporter.donorName || 'Supporter';
                      const amount = supporter.amountCents ? (
                        <strong>{formatMoney(supporter.amountCents)}</strong>
                      ) : null;
                      return (
                        <div className="supporter" key={`${supporterName}-${i}`}>
                          <span>{supporterName}</span>
                          {amount}
                        </div>
                      );
                    })
                  ) : (
                    <p className="loading">
                      Supporter information will appear here as gifts are received.
                    </p>
                  )}
                </div>
              </section>
            </div>


            <aside>
              <section className="section card">
                <h2>Campaign Snapshot</h2>
                <div className="snapshot">
                  <div className="metric">
                    <strong>{formatMoney(raisedCents, currency)}</strong>
                    <span>Raised</span>
                  </div>
                  <div className="metric">
                    <strong>{formatMoney(goalCents, currency)}</strong>
                    <span>Goal</span>
                  </div>
                  <div className="metric">
                    <strong>{metrics.donorCount ?? supporters.length ?? 0}</strong>
                    <span>Supporters</span>
                  </div>
                  <div className="metric">
                    <strong>{metrics.patientsHelped ?? campaign.patientsHelped ?? '—'}</strong>
                    <span>Patients helped</span>
                  </div>
                </div>

                <div className="thermometer">
                  <div className="thermometer-values">
                    <span>{formatMoney(raisedCents, currency)}</span>
                    <span>{percent.toFixed(1).replace('.0', '')}%</span>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: `${percent}%` }} />
                    <span className="percent">{percent.toFixed(1).replace('.0', '')}% funded</span>
                  </div>
                  {daysText ? (
                    <p
                      style={{
                        margin: '10px 0 0',
                        color: 'var(--muted)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {daysText}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="section card qr">
                <h2>Share This Fundraiser</h2>
                <a href={campaignUrl} target="_blank" rel="noopener noreferrer">
                  <SafeImage className="qr-img" src={qrUrl} alt={`QR code for ${name} fundraiser`} />
                </a>
                <p>@{fundraiser.slug || slug}</p>
              </section>
            </aside>
          </div>
        </main>
      )}

      <footer className="fundraising-footer">
        <div className="footer-inner">
          Every gift helps strengthen healthcare in the Philippines.
        </div>
      </footer>
    </div>
  );
}

