import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './FundraiserApp.css';

/**
 * Fundraiser portal (/portal/fundraiser) — React port of the model1
 * fundraiser-app custom element.
 *
 * Authentication: a sessionKey from ?session= (or sessionStorage from a
 * previous login) is verified with POST /verifyFundraiserSession. Without a
 * session the visitor gets the email/password login (POST /fundraiserLogin),
 * and the dashboard renders the campaign metrics, progress, status, and donor
 * history; Settings saves via POST /updateFundraiserSettings.
 */

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/_functions`;
const SESSION_STORAGE_KEY = 'hand.fundraiser_session';

function money(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    Number(cents || 0) / 100,
  );
}

function daysLabel(days) {
  if (days == null || days === '') return 'Days remaining unavailable';
  const n = Number(days);
  if (!Number.isFinite(n)) return 'Days remaining unavailable';
  if (n <= 0) return 'Campaign ended';
  return `${n} day${n === 1 ? '' : 's'} remaining`;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, error: 'Invalid server response.' };
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Request could not be completed.');
  }
  return data;
}

export default function FundraiserApp() {
  const [searchParams] = useSearchParams();

  /* Accepts the parameter used by other HAND pages + older aliases. */
  const urlSessionKey =
    searchParams.get('session') ||
    searchParams.get('sessionkey') ||
    searchParams.get('session_key') ||
    searchParams.get('sessionKey') ||
    '';

  const [sessionKey, setSessionKey] = useState('');
  const [data, setData] = useState(null);
  const [view, setView] = useState('dashboard');
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [messageVariant, setMessageVariant] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  const verifySession = useCallback(async (key) => {
    const verified = await api('/verifyFundraiserSession', {
      method: 'POST',
      body: JSON.stringify({ sessionKey: key }),
    });
    sessionStorage.setItem(SESSION_STORAGE_KEY, key);
    setSessionKey(key);
    setData(verified);
    return verified;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = (() => {
        try {
          return sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
        } catch {
          return '';
        }
      })();
      const key = urlSessionKey || stored;
      if (!key) {
        setChecking(false);
        return;
      }
      try {
        await verifySession(key);
      } catch (error) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setMessage(error.message);
        setMessageVariant('error');
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [urlSessionKey, verifySession]);

  const slug = data?.fundraiser?.slug || searchParams.get('fundraiser_slug') || searchParams.get('slug') || '';
  const viewPageHref = slug ? `/fundraisers/${encodeURIComponent(slug)}` : '/fundraisers';

  const signOut = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionKey('');
    setData(null);
    setView('dashboard');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    setFormBusy(true);
    setMessage('Signing in…');
    setMessageVariant('');

    try {
      const login = await api('/fundraiserLogin', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      sessionStorage.setItem(SESSION_STORAGE_KEY, login.sessionKey);
      await verifySession(login.sessionKey);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
      setMessageVariant('error');
    } finally {
      setFormBusy(false);
    }
  };

  const handleSettings = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    const formEl = event.currentTarget;
    const button = formEl.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    setFormBusy(true);
    setMessage('Saving…');
    setMessageVariant('');

    try {
      const saved = await api('/updateFundraiserSettings', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          sessionKey,
          fundraiserId: data?.fundraiser?.id,
        }),
      });
      setData((prev) => ({
        ...prev,
        fundraiser: {
          ...(prev?.fundraiser || {}),
          ...(saved.fundraiser || values),
        },
      }));
      setMessage('Saved. Your public page reflects the change.');
      setMessageVariant('success');
    } catch (error) {
      setMessage(error.message);
      setMessageVariant('error');
    } finally {
      setFormBusy(false);
      if (button) button.disabled = false;
    }
  };

  const campaign = data?.campaign || {};
  const metrics = data?.metrics || {};
  const donations = Array.isArray(data?.donations) ? data.donations : [];
  const currency = campaign.currency || 'USD';
  const raised = metrics.totalRaisedCents ?? campaign.raisedCents ?? 0;
  const goal = campaign.goalCents ?? 0;
  const percent = goal > 0 ? Math.min(100, Math.max(0, (raised / goal) * 100)) : 0;
  const fundraiser = data?.fundraiser || {};

  return (
    <div className="fa-shell">
      <header className="header">
        <div className="inner">
          <Link className="brand" to="/">
            <span className="mark">H</span>
            <span>HAND Philippines</span>
          </Link>
          {data ? (
            <nav className="nav" data-nav>
              <Link className="nav-link website" to="/">
                Go to Website
              </Link>
              <button
                className={`nav-button${view === 'dashboard' ? ' active' : ''}`}
                type="button"
                onClick={() => setView('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`nav-button${view === 'settings' ? ' active' : ''}`}
                type="button"
                onClick={() => setView('settings')}
              >
                Settings
              </button>
              <Link className="nav-button view-page" to={viewPageHref}>
                View Page
              </Link>
              <button className="nav-button sign-out" type="button" onClick={signOut}>
                Sign out
              </button>
            </nav>
          ) : null}
        </div>
      </header>

      <main className="main inner" data-main>
        {checking ? (
          <div className="loading-state">
            <div>
              <p className="eyebrow">Fundraiser access</p>
              <p>Checking your session…</p>
            </div>
          </div>
        ) : !data ? (
          <div className="login">
            <section className="card login-card">
              <p className="eyebrow">Fundraiser access</p>
              <h1>Manage your fundraiser</h1>
              <p>Sign in with the fundraiser account you created with HAND Philippines.</p>
              <form data-login onSubmit={handleLogin}>
                <label className="field">
                  Email
                  <input type="email" name="email" autoComplete="username" required />
                </label>
                <label className="field">
                  Password
                  <input type="password" name="password" autoComplete="current-password" required />
                </label>
                <div className={`message ${messageVariant ? messageVariant : ''}`} data-message aria-live="polite">
                  {message}
                </div>
                <button className="primary" type="submit" disabled={formBusy}>
                  Sign in
                </button>
              </form>
              <p className="fine">
                No account yet? Donations of any size create one automatically — check the receipt
                email for your sign-in link.
              </p>
            </section>
          </div>
        ) : view === 'settings' ? (


          <>
            <div className="heading">
              <div>
                <p className="eyebrow">Fundraiser settings</p>
                <h1>Manage your public page</h1>
              </div>
            </div>
            <section className="card">
              <form
                className="form"
                data-settings
                onSubmit={handleSettings}
                key={fundraiser.id || 'settings'}
              >
                <label className="field">
                  Fundraiser name
                  <input name="name" maxLength={120} required defaultValue={fundraiser.name || ''} />
                </label>
                <label className="field">
                  Profile photo URL
                  <input
                    name="profilePhotoUrl"
                    type="url"
                    defaultValue={fundraiser.profilePhotoUrl || ''}
                  />
                </label>
                <label className="field">
                  Fundraising story
                  <textarea name="story" maxLength={5000} defaultValue={fundraiser.story || ''} />
                </label>
                <div className={`message ${messageVariant ? messageVariant : ''}`} data-message aria-live="polite">
                  {message}
                </div>
                <button className="primary" type="submit" disabled={formBusy}>
                  Save settings
                </button>
              </form>
            </section>
          </>
        ) : (
          <>
            <div className="heading">
              <div>
                <p className="eyebrow">Campaign dashboard</p>
                <h1>{campaign.title || fundraiser.name || 'Your fundraiser'}</h1>
              </div>
              <Link className="nav-button view-page" to={viewPageHref}>
                View Page
              </Link>
            </div>

            <div className="metrics">
              <section className="card metric">
                <strong>{money(raised, currency)}</strong>
                <span>Raised</span>
              </section>
              <section className="card metric">
                <strong>{money(goal, currency)}</strong>
                <span>Goal</span>
              </section>
              <section className="card metric">
                <strong>{money(metrics.averageGiftCents, currency)}</strong>
                <span>Average gift</span>
              </section>
              <section className="card metric">
                <strong>{metrics.patientsHelped ?? campaign.patientsHelped ?? 0}</strong>
                <span>Patients helped</span>
              </section>
            </div>

            <div className="dashboard-grid">
              <section className="card">
                <h2>Campaign progress</h2>
                <div className="progress-values">
                  <span>{money(raised, currency)} raised</span>
                  <span>
                    {percent.toFixed(1).replace('.0', '')}% of {money(goal, currency)}
                  </span>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${percent}%` }} />
                  <span className="percent">{percent.toFixed(1).replace('.0', '')}% funded</span>
                </div>
              </section>
              <section className="card">
                <h2>Campaign status</h2>
                <p>{campaign.status || 'Active'}</p>
                <p>{daysLabel(campaign.daysRemaining)}</p>
              </section>
            </div>

            <section className="card history">
              <h2>Donor history</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supporter</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length ? (
                    donations.map((donation, i) => {
                      const donorName =
                        donation.anonymous === true || donation.isAnonymous === true
                          ? 'Anonymous'
                          : donation.donorName || 'Supporter';
                      return (
                        <tr key={donation.id || i}>
                          <td>{new Date(donation.createdAt).toLocaleDateString()}</td>
                          <td>{donorName}</td>
                          <td>{money(donation.amountCents, currency)}</td>
                          <td className="success">{donation.status || 'succeeded'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4}>No donations recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="inner">HAND Philippines fundraiser management</div>
      </footer>
    </div>
  );
}

