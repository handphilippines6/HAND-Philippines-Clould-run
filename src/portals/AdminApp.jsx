import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminApp.css';

/**
 * Admin portal (/admin) — React port of the model1 admin-app custom element.
 *
 * Backend contracts (unchanged):
 *   GET  /_functions/currentAdmin       -> { success, loggedIn, isAdmin, email }
 *   POST /_functions/verifyAdminSession { sessionKey }
 *       -> { success, admin, permissions, expiresAt }
 *   POST /_functions/adminLogout        { sessionKey }
 *   GET  /_functions/adminOverview      -> { metrics, recentDonations, campaigns, fundraisers }
 *   GET  /_functions/adminContent | adminCampaigns | adminDonations |
 *        adminFundraisers | adminUsers | adminSettings
 *   GET  /_functions/adminAuditLog?eventType=&from=&to=&limit=&skip=
 *   GET  /_functions/adminInterests?status=&open=1&limit=&skip=
 *   POST /_functions/adminRefund        { donationId, amountCents?, reason?, note? }
 *   POST /_functions/adminInterestStatus { interestId, status, note? }
 *
 * Security rules preserved: short-lived session keys in sessionStorage (never
 * localStorage); every protected request sends Authorization: Bearer
 * <sessionKey>; the server authorizes every operation.
 */

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/_functions`;
const SESSION_KEY = 'hand.admin.sessionKey';

const SECTIONS = [
  ['overview', 'Overview', '/adminOverview'],
  ['donations', 'Donations', '/adminDonations'],
  ['campaigns', 'Campaigns', '/adminCampaigns'],
  ['fundraisers', 'Fundraisers', '/adminFundraisers'],
  ['content', 'Content', '/adminContent'],
  ['users', 'Users', '/adminUsers'],
  ['settings', 'Settings', '/adminSettings'],
  ['audit', 'Audit log', '/adminAuditLog'],
  ['applications', 'Applications', '/adminInterests'],
];

function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(cents || 0) / 100,
  );
}

function escapeValue(value) {
  return String(value ?? '');
}

async function api(path, options = {}) {
  const stored = (() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) || '';
    } catch {
      return '';
    }
  })();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(stored ? { Authorization: `Bearer ${stored}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, error: text };
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed (${response.status}).`);
  }
  return data;
}

/** Generic record table (same columns logic as model1 renderTable). */
function RecordTable({ rows, title }) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const columns = Object.keys(rows[0]).slice(0, 6);
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map((c) => {
                  const value = row[c];
                  const display =
                    typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : escapeValue(value);
                  return <td key={c}>{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminApp() {
  const [checking, setChecking] = useState(true);
  const [loginCopy, setLoginCopy] = useState('');
  const [loginError, setLoginError] = useState('');
  const [admin, setAdmin] = useState(null);
  const [section, setSection] = useState('overview');
  const [sectionData, setSectionData] = useState(null);
  const [loadingSection, setLoadingSection] = useState(false);
  const [sectionError, setSectionError] = useState('');
  const [message, setMessage] = useState('');
  const [messageVariant, setMessageVariant] = useState('');
  const [refundId, setRefundId] = useState('');
  const [triageId, setTriageId] = useState('');
  const [triageStatus, setTriageStatus] = useState('NEW');
  const [triageApplicant, setTriageApplicant] = useState('');
  const [transitions, setTransitions] = useState([]);

  /* authenticate(): cookie session first (currentAdmin), then the stored
     short-lived session key. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const verified = await api('/verifyAdminSession', {
            method: 'POST',
            body: JSON.stringify({ sessionKey: stored }),
          });
          if (!cancelled) {
            setAdmin(verified.admin || { email: 'admin' });
            setChecking(false);
            return;
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }

      try {
        const current = await api('/currentAdmin');
        if (!cancelled && !(current && current.loggedIn && current.isAdmin)) {
          setLoginCopy(
            current && current.loggedIn
              ? 'Your Wix account is signed in, but it is not an administrator.'
              : 'Please sign in with your Wix administrator account, then refresh this page.',
          );
        }
      } catch (error) {
        if (!cancelled) {
          setLoginCopy('Please sign in with your Wix administrator account, then refresh this page.');
          setLoginError(error.message);
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSection = useCallback(async (sectionKey) => {
    const entry = SECTIONS.find(([key]) => key === sectionKey);
    if (!entry) return;
    setSection(sectionKey);
    setLoadingSection(true);
    setSectionError('');
    try {
      const data = await api(entry[2]);
      setSectionData(data);
    } catch (error) {
      setSectionError(error.message);
      setSectionData(null);
    } finally {
      setLoadingSection(false);
    }
  }, []);

  /* Load the overview (or the current section) once authenticated. */
  useEffect(() => {
    if (admin) loadSection('overview');
  }, [admin, loadSection]);

  const logout = async () => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        await api('/adminLogout', { method: 'POST', body: JSON.stringify({ sessionKey: stored }) });
      }
    } catch {
      /* Logout failures never block the UI. */
    }
    sessionStorage.removeItem(SESSION_KEY);
    setAdmin(null);
    setSectionData(null);
    setLoginCopy('You have signed out of the admin console.');
  };

  const applyInterestTransitions = (status, applicant) => {
    /* The server accepts only the transitions declared in
       backend/interests.js; this mirrors the standard ladder. */
    const ladder = {
      NEW: ['REVIEWING', 'DECLINED'],
      REVIEWING: ['APPROVED', 'DECLINED', 'NEW'],
      APPROVED: ['COMPLETED', 'DECLINED'],
      DECLINED: ['NEW'],
      COMPLETED: [],
    };
    setTransitions(ladder[status] || ['REVIEWING']);
    setTriageStatus(status);
    setTriageApplicant(applicant || '');
  };

  const handleRefund = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setMessage('Submitting refund request…');
    setMessageVariant('');
    try {
      const result = await api('/adminRefund', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setMessage(
        `Refund recorded for donation ${
          result.refund?.donationId || values.donationId
        }. Status follows the verified Stripe webhook.`,
      );
      setMessageVariant('success');
      loadSection(section);
    } catch (error) {
      setMessage(error.message);
      setMessageVariant('error');
    }
  };

  const handleInterestStatus = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setMessage('Saving decision…');
    setMessageVariant('');
    try {
      const result = await api('/adminInterestStatus', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setMessage(
        `Application ${values.interestId} updated to ${
          result.application?.status || values.status
        }.`,
      );
      setMessageVariant('success');
      loadSection('applications');
    } catch (error) {
      setMessage(error.message);
      setMessageVariant('error');
    }
  };


  /* ---- Section body rendering (model1 renderSection) -------------------- */
  const renderSection = () => {
    if (loadingSection) return <p className="message">Loading {section}…</p>;
    if (sectionError) {
      return (
        <>
          <p className="message error">{sectionError}</p>
          <button className="primary" type="button" onClick={() => loadSection(section)}>
            Retry
          </button>
        </>
      );
    }
    const data = sectionData || {};
    const m = data.metrics || {};

    if (section === 'overview' && data.metrics) {
      const campaignCount =
        m.campaignCount ?? (Array.isArray(data.campaigns) ? data.campaigns.length : null);
      const fundraiserCount =
        m.fundraiserCount ?? (Array.isArray(data.fundraisers) ? data.fundraisers.length : null);
      const recent = data.recentDonations || data.donations || [];
      return (
        <>
          <h2>Overview</h2>
          <div className="metrics">
            <div className="metric">
              <strong>{formatMoney(m.totalRaisedCents ?? m.totalRaised)}</strong>
              <span>Total raised</span>
            </div>
            <div className="metric">
              <strong>{m.donationCount ?? m.totalDonations ?? m.donations ?? '—'}</strong>
              <span>Donations</span>
            </div>
            <div className="metric">
              <strong>{campaignCount ?? '—'}</strong>
              <span>Campaigns</span>
            </div>
            <div className="metric">
              <strong>{fundraiserCount ?? '—'}</strong>
              <span>Fundraisers</span>
            </div>
          </div>
          {Array.isArray(recent) && recent.length ? (
            <RecordTable rows={recent} title="Recent donations" />
          ) : (
            <p className="message">No recent activity yet.</p>
          )}
          {Array.isArray(data.campaigns) && data.campaigns.length ? (
            <RecordTable rows={data.campaigns} title="Recent campaigns" />
          ) : null}
          {Array.isArray(data.fundraisers) && data.fundraisers.length ? (
            <RecordTable rows={data.fundraisers} title="Recent fundraisers" />
          ) : null}
        </>
      );
    }


    if (section === 'donations') {
      const rows = data.items || data.donations || [];
      return (
        <>
          <h2>Donations</h2>
          {rows.length ? (
            <RecordTable rows={rows} title={`Records (${rows.length})`} />
          ) : (
            <p className="message">No donation records.</p>
          )}
          <section className="card" data-refund>
            <h2>Issue a refund</h2>
            <p className="message">
              The REFUNDED status is written by the verified Stripe webhook, never by this form.
            </p>
            <form className="form" onSubmit={handleRefund}>
              <label className="field">
                Donation ID
                <input
                  name="donationId"
                  required
                  value={refundId}
                  onChange={(e) => setRefundId(e.target.value)}
                />
              </label>
              <label className="field">
                Amount in cents (optional — full refund when empty)
                <input name="amountCents" type="number" min="1" />
              </label>
              <label className="field">
                Reason
                <input name="reason" placeholder="duplicate, staff error, donor request" />
              </label>
              <label className="field">
                Internal note (optional)
                <input name="note" />
              </label>
              <button className="primary" type="submit">
                Submit refund request
              </button>
            </form>
          </section>
        </>
      );
    }

    if (section === 'applications') {
      const items = data.items || [];
      const summary = data.summary || {};
      return (
        <>
          <h2>Applications &amp; interests</h2>
          {summary.total != null ? (
            <p className="message">
              {summary.open ?? items.length} open of {summary.total} total.
            </p>
          ) : null}
          {items.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Applicant</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.interestId || item.id || i}>
                      <td>{item.interestId || item.id}</td>
                      <td>{item.name || item.applicantName || '—'}</td>
                      <td>{item.status || 'NEW'}</td>
                      <td>{item.createdAt || item.receivedAt || '—'}</td>
                      <td>
                        <button
                          className="primary"
                          type="button"
                          data-triage-for={item.interestId || item.id}
                          onClick={() =>
                            applyInterestTransitions(
                              item.status || 'NEW',
                              item.name || item.applicantName,
                            )
                          }
                        >
                          Triage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="message">No applications match the current filter.</p>
          )}
          <section className="card" data-triage>
            <h2>Record a decision</h2>
            <form className="form" onSubmit={handleInterestStatus}>
              <label className="field">
                Interest ID
                <input
                  name="interestId"
                  required
                  value={triageId}
                  onChange={(e) => setTriageId(e.target.value)}
                />
              </label>
              <label className="field">
                Applicant
                <input value={triageApplicant} readOnly />
              </label>
              <label className="field">
                New status
                <select
                  name="status"
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value)}
                >
                  {(transitions.length ? transitions : ['REVIEWING']).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Note (optional)
                <input name="note" />
              </label>
              <button className="primary" type="submit">
                Save decision
              </button>
            </form>
          </section>
        </>
      );
    }


    if (section === 'fundraisers') {
      const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      return (
        <>
          <h2>Fundraisers</h2>
          {items.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || item.slug || i}>
                      <td>{item.name || '—'}</td>
                      <td>{item.slug || '—'}</td>
                      <td>{item.status || '—'}</td>
                      <td>{item.slug ? <Link to={`/fundraisers/${item.slug}`}>View page</Link> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="message">No fundraisers found.</p>
          )}
        </>
      );
    }

    if (section === 'audit') {
      const items = data.items || [];
      return (
        <>
          <h2>Audit log</h2>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              const params = new URLSearchParams(Object.entries(values).filter(([, v]) => v)).toString();
              setSectionData(null);
              setLoadingSection(true);
              api(`/adminAuditLog${params ? `?${params}` : ''}`)
                .then(setSectionData)
                .catch((error) => setSectionError(error.message))
                .finally(() => setLoadingSection(false));
            }}
          >
            <label className="field">
              Event type
              <input name="eventType" placeholder="donation.created" />
            </label>
            <label className="field">
              From (ISO date)
              <input name="from" type="date" />
            </label>
            <label className="field">
              To (ISO date)
              <input name="to" type="date" />
            </label>
            <button className="primary" type="submit">
              Apply filters
            </button>
          </form>
          {items.length ? <RecordTable rows={items} title={`Entries (${items.length})`} /> : null}
        </>
      );
    }

    /* Generic list endpoints */
    const rows =
      data.items ||
      data.donations ||
      data.campaigns ||
      data.fundraisers ||
      data.users ||
      data.content ||
      data.settings ||
      (Array.isArray(data) ? data : null);

    if (Array.isArray(rows) && rows.length) {
      return (
        <>
          <h2>{SECTIONS.find(([key]) => key === section)?.[1] || section}</h2>
          <RecordTable rows={rows} title={`Records (${rows.length})`} />
        </>
      );
    }

    /* Fallback: raw JSON for unimplemented / unknown shapes */
    return (
      <>
        <h2>Response</h2>
        <pre className="message" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </>
    );
  };


  if (checking) {
    return (
      <div className="login">
        <section className="card" style={{ width: 'min(460px, calc(100% - 40px))' }}>
          <p className="eyebrow">Administration</p>
          <h1>Admin sign in</h1>
          <p className="message">Checking your session…</p>
        </section>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="login">
        <section className="card" style={{ width: 'min(460px, calc(100% - 40px))' }}>
          <p className="eyebrow">Administration</p>
          <h1>Admin sign in</h1>
          <p className="message">{loginCopy}</p>
          {loginError ? <p className="message error">{loginError}</p> : null}
          <button className="primary" type="button" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="aa-shell">
      <header className="header">
        <div className="inner">
          <Link className="brand" to="/">
            <span className="mark">H</span>
            <span>HAND Admin{admin?.email ? ` · ${admin.email}` : ''}</span>
          </Link>
          <nav className="nav" data-nav>
            {SECTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`nav-button${section === key ? ' active' : ''}`}
                data-section={key}
                onClick={() => loadSection(key)}
              >
                {label}
              </button>
            ))}
            <button className="nav-button sign-out" type="button" onClick={logout}>
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="main inner" data-main>
        {message ? (
          <div className={`message ${messageVariant}`} data-message aria-live="polite">
            {message}
          </div>
        ) : null}
        {renderSection()}
      </main>

      <footer className="footer">
        <div className="inner">HAND Philippines admin console</div>
      </footer>
    </div>
  );
}

