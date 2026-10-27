import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './DonorApp.css';

/**
 * Donor dashboard portal (/portal/donor, /donordashboard) — React port of the
 * model1 donor-app custom element.
 *
 * No Wix frontend module is used: members are recognised server-side
 * (/getCurrentWixMember), and the emailed one-time code is the interactive
 * sign-in. A sessionKey issued by POST /createDonationSessionKey (donate flow)
 * is accepted via ?session= for the post-payment redirect.
 *
 * Frontend API base: `${API_BASE}/_functions` — the same endpoints and
 * structures documented in the source header (verifyDonationSession,
 * requestDonorOtp, verifyDonorOtp, donationReceipt, getCurrentWixMember,
 * createSessionFromWixMember).
 */

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/_functions`;

const DONATION_URL = '/donate';
const DEFAULT_SESSION_TTL_MESSAGE = 'Your dashboard session has expired. Please request a new code.';

function formatMoney(cents) {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function userMessage(value, fallback) {
  if (!value) return fallback;
  let message = String(value);
  try {
    message = decodeURIComponent(message);
  } catch {
    /* Keep plain text. */
  }
  return message.replace(/\s+/g, ' ').trim() || fallback;
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
    data = { success: false, error: text };
  }
  if (!response.ok || (data !== null && (data.success === false || data.ok === false))) {
    throw new Error(userMessage(data.error || data.message, 'We could not complete that request.'));
  }
  return data ?? {};
}

export default function DonorApp() {
  const [searchParams] = useSearchParams();

  /* Accepts the parameter name used by the donate page (`session`) as well as
     older aliases for backward compatibility. */
  const sessionKeyParam =
    searchParams.get('session') ||
    searchParams.get('sessionkey') ||
    searchParams.get('session_key') ||
    searchParams.get('sessionKey');

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authVariant, setAuthVariant] = useState('error');
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(''); // 'request' | 'verify' | null
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRef = useRef(null);
  const resendTimer = useRef(null);
  const sessionRef = useRef(null);

  /* Focus the code field when the verify step appears. */
  useEffect(() => {
    if (otpSent && codeRef.current) codeRef.current.focus();
  }, [otpSent]);

  const enterDashboard = useCallback(async (key) => {
    if (!key) throw new Error('No dashboard session was issued.');
    const data = await api('/verifyDonationSession', {
      method: 'POST',
      body: JSON.stringify({ sessionKey: key }),
    });
    sessionRef.current = key;
    setDashboard(data);
    setAuthOpen(false);
  }, []);

  /* Initial verification: Wix member bridge, then ?session=, then the
     one-time-code modal. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const member = await api('/getCurrentWixMember');
        if (!cancelled && member && member.loggedIn) {
          const data = await api('/createSessionFromWixMember', { method: 'POST', body: '{}' });
          await enterDashboard(data.sessionKey);
          setLoading(false);
          return;
        }
      } catch {
        /* Fall through to the session-key and one-time-code flows. */
      }

      if (!cancelled && sessionKeyParam) {
        try {
          await enterDashboard(sessionKeyParam);
          setLoading(false);
          return;
        } catch (error) {
          if (!cancelled) {
            setAuthMessage(userMessage(error.message, DEFAULT_SESSION_TTL_MESSAGE));
            setAuthVariant('error');
            setAuthOpen(true);
            setLoading(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setLoading(false);
        setAuthOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionKeyParam, enterDashboard]);

  /* Resend countdown. */
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    resendTimer.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1 && resendTimer.current) {
          clearInterval(resendTimer.current);
          resendTimer.current = null;
        }
        return Math.max(0, s - 1);
      });
    }, 1000);
    return () => {
      if (resendTimer.current) {
        clearInterval(resendTimer.current);
        resendTimer.current = null;
      }
    };
  }, [resendCooldown]);


  const setAuthMsg = (text, variant = 'error') => {
    setAuthMessage(text || '');
    setAuthVariant(variant);
  };

  const handleRequestOtp = async (overrideIdentifier) => {
    const target = (overrideIdentifier || identifier).trim();

    if (!target) {
      setAuthMsg('Enter the email address you donated with.');
      return;
    }
    if (!consent) {
      setAuthMsg('Please agree to receive a one-time code by email.');
      return;
    }

    setBusy('request');
    setAuthMsg('', 'info');

    try {
      const data = await api('/requestDonorOtp', {
        method: 'POST',
        body: JSON.stringify({
          identifier: target,
          consent: { accepted: true, version: 'donor-otp-1' },
        }),
      });
      setIdentifier(target);
      setChallengeId(data.challengeId);
      setOtpSent(true);
      setResendCooldown(60);
      setAuthMsg(`We sent a six-digit code to ${target}.`, 'info');
    } catch (error) {
      setAuthMsg(userMessage(error.message, 'We could not send the code. Please try again.'));
    } finally {
      setBusy('');
    }
  };

  const handleVerifyOtp = async () => {
    const code = (otpCode || '').replace(/\D/g, '');
    if (!challengeId || code.length !== 6) {
      setAuthMsg('Enter the six-digit code from the email.');
      return;
    }

    setBusy('verify');
    setAuthMsg('', 'info');

    try {
      const data = await api('/verifyDonorOtp', {
        method: 'POST',
        body: JSON.stringify({ challengeId, identifier, otp: code }),
      });
      await enterDashboard(data.sessionKey);
    } catch (error) {
      setAuthMsg(userMessage(error.message, 'That code is invalid or has expired.'));
    } finally {
      setBusy('');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !identifier) return;
    const previous = resendCooldown;
    setAuthMsg('', 'info');

    try {
      const data = await api('/requestDonorOtp', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          consent: { accepted: true, version: 'donor-otp-1' },
        }),
      });
      setChallengeId(data.challengeId);
      setAuthMsg(`A new code was sent to ${identifier}.`, 'info');
    } catch (error) {
      setAuthMsg(userMessage(error.message, 'We could not resend the code.'));
    } finally {
      setResendCooldown(previous > 0 ? previous : 60);
    }
  };

  const downloadReceipt = async (donationId, event) => {
    if (!donationId || !sessionRef.current) return;
    const button = event.currentTarget;
    button.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/donationReceipt?id=${encodeURIComponent(donationId)}`, {
        headers: {
          Accept: 'application/pdf',
          Authorization: `Bearer ${sessionRef.current}`,
        },
      });

      if (!response.ok) throw new Error('Receipt unavailable');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hand-philippines-receipt-${donationId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert('We could not download this receipt right now. Please try again later.');
    }

    button.disabled = false;
  };

  const donor = dashboard?.donor || {};
  const summary = dashboard?.summary || {};
  const donations = Array.isArray(dashboard?.donations) ? dashboard.donations : [];
  const recurring = dashboard?.recurring;

  return (
    <div className="shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" rel="noopener">
            <span className="brand-mark">H</span>
            <span>
              Hand Philippines<small>Donor dashboard</small>
            </span>
          </a>
          <a className="button" href={DONATION_URL}>
            Donate Again
          </a>
        </div>
      </header>

      <main>
        {loading ? (
          <div className="state">
            <div className="state-card">
              <h1>Loading your dashboard</h1>
              <p>We are securely checking your donor session.</p>
            </div>
          </div>
        ) : dashboard ? (
          <>
            <section className="banner">
              <div>
                <p className="eyebrow">Thank you for your generosity</p>
                <h1>Welcome{donor.firstName ? `, ${donor.firstName}` : ''}.</h1>
                <p>
                  Your support helps HAND Philippines deliver practical healthcare and stronger
                  local health systems.
                </p>
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <h2>Your impact at a glance</h2>
              </div>
              <div className="summary-grid">
                <div className="card metric">
                  <strong>
                    {formatMoney(summary.totalContributedCents ?? summary.totalContributed)}
                  </strong>
                  <span>Total contributed</span>
                </div>
                <div className="card metric">
                  <strong>{summary.donationCount ?? donations.length}</strong>
                  <span>Gifts made</span>
                </div>
                <div className="card metric">
                  <strong>{summary.patientsHelped ?? '0'}</strong>
                  <span>Patients supported</span>
                </div>
              </div>
            </section>

            <section className="section" id="history">
              <div className="section-heading">
                <h2>Donation history</h2>
              </div>
              <div className="card history">
                <div className="history-row history-head">
                  <span>Date</span>
                  <span>Designation</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Receipt</span>
                </div>
                {donations.length ? (
                  donations.map((donation) => (
                    <div className="history-row" key={donation.id}>
                      <span>{formatDate(donation.date || donation.createdAt)}</span>
                      <span>{donation.designation || 'General support'}</span>
                      <span className="amount">
                        {formatMoney(donation.amountCents ?? donation.amount)}
                      </span>
                      <span className="status">{donation.status || 'completed'}</span>
                      <button
                        className="receipt"
                        type="button"
                        disabled={!donation.id}
                        onClick={(e) => downloadReceipt(donation.id, e)}
                      >
                        Receipt
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty">Your donation history will appear here.</div>
                )}
              </div>
            </section>


            <section className="section">
              <div className="section-heading">
                <h2>Keep your records close</h2>
              </div>
              <div className="recommendations">
                <article className="card recommendation">
                  <h3>Download receipts</h3>
                  <p>Keep your donation records ready for tax preparation.</p>
                  <a className="button secondary" href="#history">
                    View receipts
                  </a>
                </article>
                <article className="card recommendation">
                  <h3>Recurring giving</h3>
                  <p>Review the current status of your ongoing support.</p>
                  <a className="button secondary" href="#recurring">
                    See status
                  </a>
                </article>
                <article className="card recommendation">
                  <h3>Profile settings</h3>
                  <p>Update the contact details used to reach your donor account.</p>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => window.alert('Please contact HAND Philippines to update your donor profile.')}
                  >
                    Contact support
                  </button>
                </article>
              </div>
            </section>

            <section className="section card recurring" id="recurring">
              <div>
                {recurring?.active ? (
                  <>
                    <strong>
                      {formatMoney(recurring.amountCents)} {recurring.interval || 'monthly'}
                    </strong>
                    <span>Next charge: {formatDate(recurring.nextChargeDate)}</span>
                  </>
                ) : (
                  <>
                    <strong>No recurring donation</strong>
                    <span>One-time gifts are always welcome.</span>
                  </>
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          You can return here anytime using the email address you donated with.
        </div>
      </footer>

      {authOpen ? (
        <div className="modal-backdrop">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <h2 id="auth-title">Access your donor dashboard</h2>
            <p data-auth-copy>
              {authMessage && authVariant === 'error'
                ? authMessage
                : 'Receive a one-time code at the email address you donated with.'}
            </p>

            {!otpSent ? (
              <div data-otp-step="request">
                <label className="label" htmlFor="otp-identifier">
                  Email address
                </label>
                <input
                  className="field"
                  id="otp-identifier"
                  data-otp-identifier
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>Yes, send me a one-time sign-in code by email (policy E9).</span>
                </label>
                <button
                  className="button"
                  type="button"
                  data-otp-request
                  style={{ width: '100%', marginTop: 12 }}
                  disabled={busy === 'request'}
                  onClick={() => handleRequestOtp()}
                >
                  {busy === 'request' ? 'Sending code…' : 'Email me a code'}
                </button>
              </div>
            ) : (
              <div data-otp-step="verify">
                <label className="label" htmlFor="otp-code">
                  Six-digit code
                </label>
                <input
                  ref={codeRef}
                  className="field"
                  id="otp-code"
                  data-otp-code
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
                <button
                  className="button"
                  type="button"
                  data-otp-verify
                  style={{ width: '100%', marginTop: 12 }}
                  disabled={busy === 'verify'}
                  onClick={handleVerifyOtp}
                >
                  {busy === 'verify' ? 'Verifying…' : 'Verify code'}
                </button>
                <button
                  className="link-button"
                  type="button"
                  data-otp-resend
                  disabled={resendCooldown > 0}
                  onClick={handleResendOtp}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            )}

            {authMessage && authVariant !== 'error' ? (
              <div className={`form-message ${authVariant}`} data-auth-message aria-live="polite">
                {authMessage}
              </div>
            ) : (
              <div className="form-message" data-auth-message aria-live="polite" />
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

