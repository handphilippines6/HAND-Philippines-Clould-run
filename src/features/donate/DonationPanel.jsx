import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import '../../pages/donate.css';

/*
 * DonationPanel — React port of the model1 donate-v2 giving panel.
 *
 * Works inside:
 *   - the /donate page (donate-page layout), and
 *   - the shared giving dialog (ModalProvider "donate" builder), where the
 *     appendix CSS pins the panel into the dialog flow (inDialog).
 *
 * Current API endpoints (same contract as the Wix backend):
 *   GET  /_functions/stripePublishableKey
 *   POST /_functions/createPaymentIntent      (body: amount in USD dollars)
 *   POST /_functions/updateDonationStatus     (post-payment verification)
 *   POST /_functions/createDonationSessionKey (donor dashboard session)
 *
 * Amounts: the browser submits dollars only. The backend validates the amount
 * and converts it to integer cents for Stripe and the Donations record, so
 * cents here are local UX state (validation + labels) and never the
 * authoritative payment amount.
 *
 * Stripe: Stripe.js (direct Payment Element — no iframe). One-time donations
 * only; monthly requires a Subscription/SetupIntent backend endpoint and is
 * intentionally not activated.
 */

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/_functions`;

const DEFAULT_CAMPAIGN_ID = '8a7355e6-f001-41fc-a120-0a8ab0ca443a';
const DEFAULT_FUNDRAISER_ID = '75b5b9e4-c999-4eda-836b-c226341afda0';

/* Mirrors MIN_DONATION_CENTS / MAX_DONATION_CENTS in backend/validation.js.
   These bounds only drive UX feedback; the backend re-validates the amount. */
const MIN_DONATION_CENTS = 50;
const MAX_DONATION_CENTS = 1000000;

const PROCESSING_TIMEOUT_MS = 120000; // 2 minutes safety net for bank OTP / 3DS

const AMOUNT_PRESETS = [25, 50, 100, 250];

const DESIGNATIONS = [
  {
    value: 'Projects and Programs',
    title: 'Projects and Programs',
    description: 'Support the area of greatest need.',
    icon: 'heart',
  },
  {
    value: 'Repairs and Rebuilding',
    title: 'Repairs and rebuilding',
    description: 'Damaged rural health centers and hospitals.',
    icon: 'building',
  },
  {
    value: 'Humanitarian Aid',
    title: 'Humanitarian aid',
    description: 'Victims of natural disasters.',
    icon: 'cargo',
  },
  {
    value: 'Neonatal Resuscitation Kits',
    title: 'Neonatal Resuscitation Kits',
    description: 'Protect newborn lives with critical equipment and training.',
    icon: 'users',
  },
  {
    value: 'Eye Care Missions',
    title: 'Eye care missions',
    description: 'Restoring sight in communities without ophthalmologists.',
    icon: 'sun',
  },
];

/* Format integer cents as USD. */
function formatUSD(cents) {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/* Parse a dollars string into integer cents (local UX state only). */
function parseAmountToCents(value) {
  const cleaned = String(value ?? '').replace(/[$,\s]/g, '');
  if (!cleaned) return 0;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

async function apiFetch(path, options = {}) {
  const { signal, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    signal,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(rest.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, error: text || 'Invalid server response.' };
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed with HTTP ${response.status}.`);
  }
  return data;
}

async function getPublishableKey(signal) {
  const data = await apiFetch('/stripePublishableKey', { signal });
  const publishableKey = data?.publishableKey;
  if (!publishableKey || !/^pk_(test|live)_/.test(publishableKey)) {
    throw new Error('The Stripe publishable key returned by backend is invalid.');
  }
  return publishableKey;
}

/**
 * Creates the Stripe PaymentIntent for the donation.
 *
 * `amount` is the USD dollar value collected on the page; the backend converts
 * it to integer cents before it reaches Stripe or the Donations record.
 */
async function createPaymentIntent(payload, signal) {
  const body = {
    campaignId: payload.campaignId,
    fundraiserId: payload.fundraiserId,
    amount: payload.amount,
    firstName: payload.firstName,
    lastName: payload.lastName,
    donorName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
    donorEmail: payload.donorEmail,
    tributeMessage: payload.tributeMessage || '',
    isAnonymous: payload.isAnonymous === true,
    impactCategory: payload.impactCategory || 'Projects and Programs',
  };

  /* === Cross-compatibility with donate.js endpoint contract === */
  const forwardBody = { ...body, designation: body.impactCategory };
  return apiFetch('/createPaymentIntent', {
    method: 'POST',
    body: JSON.stringify(forwardBody),
    signal,
  });
}

/**
 * Post-payment verification. The backend re-reads the PaymentIntent from
 * Stripe and applies the server-verified status, so this request only proves
 * ownership of the donation via paymentIntentId + verificationToken. The
 * browser never decides the donation status; it only reads the canonical
 * status back.
 */
async function updateDonationStatus({ paymentIntentId, verificationToken }, signal) {
  return apiFetch('/updateDonationStatus', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId, verificationToken }),
    signal,
  });
}

/** Short-lived session key so the donor can land on the dashboard. */
async function requestDonationSessionKey(paymentIntentId, verificationToken, signal) {
  const data = await apiFetch('/createDonationSessionKey', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId, verificationToken }),
    signal,
  });
  return data?.sessionKey || data?.key || null;
}

/** Load Stripe.js dynamically (same loader as model1). */
function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }
    if (document.querySelector('script[src="https://js.stripe.com/v3/"]')) {
      // Script tag present but not yet loaded — poll briefly.
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (window.Stripe) {
          clearInterval(timer);
          resolve(window.Stripe);
        } else if (tries > 50) {
          clearInterval(timer);
          reject(new Error('Stripe.js failed to load.'));
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      if (window.Stripe) resolve(window.Stripe);
      else reject(new Error('Stripe.js failed to load.'));
    };
    script.onerror = () => reject(new Error('Stripe.js failed to load.'));
    document.head.appendChild(script);
  });
}

/**
 * The giving panel. Markup follows the approved modal design (impact meter,
 * impact picker, frequency, amount, donor details, payment step, action
 * footer) while every hook the Stripe flow relies on is preserved.
 */
export default function DonationPanel({ inDialog = false }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  /* The page pins the panel to the viewport; inside a dialog the shell's
     appendix CSS puts the panel in flow (.hp-donatemodal__main .donation-panel). */
  const panelClass = 'donation-panel';

  const [amountValue, setAmountValue] = useState('25.00');
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [comboOpen, setComboOpen] = useState(false);
  const [monthly, setMonthly] = useState(false);
  const [donor, setDonor] = useState({
    firstName: '',
    lastName: '',
    donorEmail: '',
    comment: '',
    isAnonymous: false,
  });
  const [step, setStep] = useState('details'); // details | payment
  const [formStatus, setFormStatus] = useState(null); // {tone, text}
  const [stripeError, setStripeErrorState] = useState('');
  /* Button label follows the model1 setButtonState contract: the footer CTA
     names the step — "Continue to Payment" on the details step, "Pay $X Now"
     on the payment step — while transient texts ("Preparing payment...",
     "Processing...") show verbatim. */
  const [button, setButton] = useState({ disabled: false, transient: '' });
  const [loading, setLoading] = useState({ visible: false, title: '', message: '' });
  const [successOpen, setSuccessOpen] = useState(false);

  const stripeRef = useRef(null); // { stripeInstance, elementsInstance, paymentEl }
  const intentRef = useRef({}); // { paymentIntentId, verificationToken, clientSecret }
  const abortRef = useRef(null);
  const timeoutRef = useRef(null);
  const elementHostRef = useRef(null);

  const campaignId = params.get('program') || params.get('campaign') || DEFAULT_CAMPAIGN_ID;
  const fundraiserId = params.get('fundraiser') || DEFAULT_FUNDRAISER_ID;

  const amountCents = useMemo(() => parseAmountToCents(amountValue), [amountValue]);
  const amountLabel = amountCents > 0 ? formatUSD(amountCents) : '$0.00';
  const selectedPreset = AMOUNT_PRESETS.find((a) => a === Math.round(amountCents / 100));
  const paying = step === 'payment';
  const buttonLabel =
    button.transient || (paying ? `Pay ${amountLabel} Now` : 'Continue to Payment');

  const setFormStatusSafe = useCallback((tone, text) => {
    setFormStatus(text ? { tone, text } : null);
  }, []);

  /* model1 setButtonState: the three "step" labels map onto the dynamic label;
     anything else (progress texts) is shown verbatim. */
  const setButtonStateSafe = useCallback((disabled, text) => {
    if (
      text === 'Complete Your Gift' ||
      text === 'Continue to Secure Payment' ||
      text === 'Continue to Payment'
    ) {
      setButton({ disabled, transient: '' });
    } else {
      setButton({ disabled, transient: text || '' });
    }
  }, []);


  /* Unmount the Stripe element when the panel goes away (dialog close /
     route change) so no listener outlives the DOM. */
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
      try {
        stripeRef.current?.paymentEl?.unmount?.();
      } catch {
        /* non-fatal */
      }
    },
    [],
  );

  /* model1 showDonorDetailsStep: unmount the Stripe element, clear the mount
     point, abort the in-flight controller, and reset status/labels. */
  const backToDetails = () => {
    if (stripeRef.current?.paymentEl && typeof stripeRef.current.paymentEl.unmount === 'function') {
      try {
        stripeRef.current.paymentEl.unmount();
      } catch {
        /* ignore cleanup errors */
      }
    }
    if (
      stripeRef.current?.elementsInstance &&
      typeof stripeRef.current.elementsInstance.clear === 'function'
    ) {
      try {
        stripeRef.current.elementsInstance.clear();
      } catch {
        /* ignore cleanup errors */
      }
    }
    if (elementHostRef.current) elementHostRef.current.innerHTML = '';

    stripeRef.current = null;
    intentRef.current = {};
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setStep('details');
    setStripeErrorState('');
    setFormStatusSafe(null, '');
    setLoading({ visible: false, title: '', message: '' });
    setButtonStateSafe(false, 'Continue to Secure Payment');
  };

  const startPayment = async () => {
    setStripeErrorState('');
    setFormStatusSafe(null, '');

    /* ---- Client-side validation (model1 validateDonationForm) ---------- */
    const firstName = donor.firstName.trim();
    const lastName = donor.lastName.trim();
    const donorEmail = donor.donorEmail.trim();
    if (amountCents < MIN_DONATION_CENTS || amountCents > MAX_DONATION_CENTS) {
      setFormStatusSafe('error', 'Please enter a donation between $0.50 and $10,000.');
      return;
    }
    if (!firstName) {
      setFormStatusSafe('error', 'Please enter your first name.');
      return;
    }
    if (!lastName) {
      setFormStatusSafe('error', 'Please enter your last name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      setFormStatusSafe('error', 'Please enter a valid email address.');
      return;
    }

    /* ---- First click: create PaymentIntent + load the Stripe form ------- */
    if (!stripeRef.current) {
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;
      try {
        setLoading({
          visible: true,
          title: 'Preparing secure payment',
          message: 'Connecting securely to Stripe...',
        });
        setButtonStateSafe(true, 'Preparing payment...');

        const paymentIntent = await createPaymentIntent(
          {
            campaignId,
            fundraiserId,
            amount: Number(amountCents) / 100, // dollars; backend converts to cents
            firstName,
            lastName,
            donorEmail,
            tributeMessage: donor.comment.trim(),
            isAnonymous: donor.isAnonymous,
            impactCategory: designation.value,
          },
          signal,
        );

        if (!paymentIntent?.success) {
          throw new Error(paymentIntent?.error || 'Unable to create the payment.');
        }

        intentRef.current = {
          paymentIntentId: paymentIntent.paymentIntentId,
          verificationToken: paymentIntent.verificationToken,
        };

        const publishableKey = await getPublishableKey(signal);
        const clientSecret = paymentIntent?.clientSecret || paymentIntent?.data?.clientSecret;
        if (!clientSecret) {
          throw new Error('The secure payment session is incomplete. Please try again.');
        }
        intentRef.current.clientSecret = clientSecret;

        await loadStripeJs();
        if (!window.Stripe) {
          throw new Error(
            'The secure payment script did not load. Please try again or use a different browser.',
          );
        }

        const stripeInstance = window.Stripe(publishableKey);
        const elementsInstance = stripeInstance.elements({
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0b6bcb',
              colorBackground: '#ffffff',
              colorText: '#0f172a',
              colorDanger: '#dc2626',
              borderRadius: '8px',
            },
          },
        });

        const paymentEl = elementsInstance.create('payment', {
          defaultValues: {
            billingDetails: {
              name: `${firstName} ${lastName}`.trim() || undefined,
              email: donorEmail || undefined,
            },
          },
          layout: { type: 'accordion', radios: 'always', visibleAccordionItemsCount: 3 },
          paymentMethodOrder: ['card', 'link', 'paypal', 'klarna'],
          wallets: { applePay: 'never', googlePay: 'never' },
        });

        paymentEl.on('loaderror', (evt) => {
          console.error('[Donate] Stripe Payment Element load error:', evt.error);
        });

        paymentEl.mount(elementHostRef.current);
        stripeRef.current = { stripeInstance, elementsInstance, paymentEl, ready: true };

        setStep('payment');
        setLoading({ visible: false, title: '', message: '' });
        setButtonStateSafe(false, 'Complete Your Gift');
        setFormStatusSafe(
          'info',
          'Your secure payment form is ready. Review your payment details, then click Complete Your Gift.',
        );
        return;
      } catch (error) {
        console.error('[Donate] Payment initialization failed:', error);
        setLoading({ visible: false, title: '', message: '' });
        setButtonStateSafe(false, 'Continue to Payment');
        setFormStatusSafe('error', error.message || 'Unable to prepare payment.');
        return;
      }
    }

    /* ---- Second click: actual payment submission ------------------------ */
    const { stripeInstance, elementsInstance } = stripeRef.current;
    if (!stripeInstance || !elementsInstance) {
      setFormStatusSafe('info', 'The secure payment form is still loading. Please try again.');
      return;
    }

    setButtonStateSafe(true, 'Processing...');
    setFormStatusSafe(
      'info',
      'Processing your donation. If your bank asks for a code or confirmation, please complete it in the form above.',
    );
    setStripeErrorState('');

    /* Safety net for bank OTP / 3DS. */
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setButtonStateSafe(false, 'Complete Your Gift');
      setFormStatusSafe(
        'error',
        'Payment is taking longer than expected. If you already completed bank authentication, please check your email or refresh the page. Otherwise try again.',
      );
    }, PROCESSING_TIMEOUT_MS);

    const finishTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    try {
      const result = await elementsInstance.submit();
      if (result?.error) {
        finishTimeout();
        setButtonStateSafe(false, 'Complete Your Gift');
        setStripeErrorState(result.error.message || 'Payment could not be submitted. Please try again.');
        setFormStatusSafe(
          'error',
          result.error.message || 'Payment could not be submitted. Please try again.',
        );
        return;
      }

      const confirmation = await stripeInstance.confirmPayment({
        elements: elementsInstance,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (confirmation?.error) {
        finishTimeout();
        setButtonStateSafe(false, 'Complete Your Gift');
        setStripeErrorState(
          confirmation.error.message || 'Payment could not be confirmed. Please try again.',
        );
        setFormStatusSafe(
          'error',
          confirmation.error.message || 'Payment could not be confirmed. Please try again.',
        );
        return;
      }

      finishTimeout();
      const resolvedStatus = String(confirmation?.paymentIntent?.status || 'succeeded').toLowerCase();
      await handleSuccessfulPayment(resolvedStatus);
    } catch (error) {
      console.error('[Donate] Payment submission failed:', error);
      finishTimeout();
      setButtonStateSafe(false, 'Complete Your Gift');
      setFormStatusSafe('error', error.message || 'Payment could not be completed. Please try again.');
    }
  };

  /* Post-payment workflow: verify server-side, then hand the donor a
     dashboard session (or the thank-you modal as the fallback). */
  const handleSuccessfulPayment = async (resolvedStatus) => {
    /* CRITICAL: always hide the processing overlay first. */
    setLoading({ visible: false, title: '', message: '' });
    setButtonStateSafe(false, 'Complete Your Gift');
    setFormStatusSafe(null, '');

    const { paymentIntentId, verificationToken } = intentRef.current;

    if (!paymentIntentId || !verificationToken) {
      setFormStatusSafe('success', 'Payment successful. Thank you for your generosity!');
      setSuccessOpen(true);
      return;
    }

    try {
      setFormStatusSafe('success', 'Payment successful. Verifying your donation...');
      const statusResult = await updateDonationStatus(
        { paymentIntentId, verificationToken },
        abortRef.current?.signal,
      );

      /* Fall back to the Stripe.js status only when the server response is
         missing a status; comparisons are case-insensitive because the backend
         returns the canonical upper-case vocabulary (SUCCEEDED/PROCESSING). */
      const finalStatus = String(
        statusResult?.donation?.status || statusResult?.status || resolvedStatus || 'succeeded',
      ).toLowerCase();

      if (finalStatus !== 'succeeded' && finalStatus !== 'processing') {
        setFormStatusSafe(
          'error',
          'Payment was received but could not be fully verified. Please contact support with your receipt.',
        );
        setSuccessOpen(true); // still thank the donor
        return;
      }

      setFormStatusSafe('success', 'Payment successful. Preparing your donor dashboard...');
      const sessionKey = await requestDonationSessionKey(
        paymentIntentId,
        verificationToken,
        abortRef.current?.signal,
      );

      if (sessionKey) {
        navigate(
          `/donordashboard?session=${encodeURIComponent(sessionKey)}&pi=${encodeURIComponent(paymentIntentId)}`,
        );
        return;
      }

      setFormStatusSafe('success', 'Payment successful. Thank you!');
      setSuccessOpen(true);
    } catch (error) {
      console.error('[Donate] Post-payment workflow failed:', error);
      /* Payment already succeeded at Stripe – never leave the user hanging. */
      setFormStatusSafe(
        'success',
        'Your payment was successful. We could not open the donor dashboard automatically. Please check your email for the receipt.',
      );
      setSuccessOpen(true);
    }
  };


  const chevron = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );

  const impactPicker = (
    <div className="field-block">
      <span className="field-label" id="hp-impact-label">
        Where would you like to make an impact?
      </span>
      <div className="combo" data-combo>
        <button
          type="button"
          className="combo__trigger"
          data-combo-trigger
          aria-expanded={comboOpen}
          aria-haspopup="listbox"
          aria-labelledby="hp-impact-label"
          onClick={() => setComboOpen((o) => !o)}
        >
          <span className="combo__icon" data-combo-icon>
            <Icon name={designation.icon} size={15} />
          </span>
          <span className="combo__text">
            <span className="combo__title" data-combo-title>
              {designation.title}
            </span>
            <span className="combo__sub" data-combo-sub>
              {designation.description}
            </span>
          </span>
          <span className="combo__chevron" aria-hidden="true">
            {chevron}
          </span>
        </button>
        {comboOpen ? (
          <div className="combo__menu" data-combo-menu>
            <div className="designation-list" role="listbox" aria-labelledby="hp-impact-label">
              {DESIGNATIONS.map((item) => (
                <label
                  key={item.value}
                  className={`designation-option${item.value === designation.value ? ' is-selected' : ''}`}
                  data-designation-option
                >
                  <input
                    type="radio"
                    name="designation"
                    value={item.value}
                    checked={item.value === designation.value}
                    onChange={() => {
                      setDesignation(item);
                      setComboOpen(false);
                    }}
                  />
                  <span className="designation-content">
                    <span className="designation-icon">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span>
                      <span className="designation-title">{item.title}</span>
                      <span className="designation-description">{item.description}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  /* ---- Render ---------------------------------------------------------- */
  return (
    <>
    <aside className={panelClass} id="donation-panel">
      <div className="donation-box">
        <div
          className={`donation-details${step === 'payment' ? ' is-collapsed' : ''}`}
          data-donation-details
        >
          {/* Impact picker */}
          {impactPicker}

          {/* Frequency */}
          <div className="giving-type" role="group" aria-label="Giving frequency">
            <button
              type="button"
              className={monthly ? '' : 'is-active'}
              data-giving-type="once"
              onClick={() => setMonthly(false)}
            >
              Give once
            </button>
            <button
              type="button"
              className={monthly ? 'is-active' : ''}
              data-giving-type="monthly"
              disabled
              title="Monthly giving opens soon - give once today and we will email you when it starts."
              onClick={() => setMonthly(true)}
            >
              Monthly
            </button>
          </div>

          {/* Amount */}
          <div className="amount-block">
            <div className="amount-presets">
              {AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`amount-button${selectedPreset === preset ? ' is-selected' : ''}`}
                  data-amount={preset}
                  onClick={() => setAmountValue(preset.toFixed(2))}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <div className="amount-input-wrap">
              <span className="amount-input-prefix" aria-hidden="true">$</span>
              <input
                className="amount-input"
                type="number"
                min="0.50"
                max="10000"
                step="0.01"
                value={amountValue}
                inputMode="decimal"
                placeholder="0.00"
                aria-label="Donation amount in US dollars"
                data-amount-input
                onChange={(e) => setAmountValue(e.target.value)}
              />
              <span className="amount-input-suffix" aria-hidden="true">USD</span>
            </div>
            <p className="amount-help">Donations are processed in USD. Minimum $0.50.</p>
          </div>

          {/* Donor details */}
          <div className="donor-fields" data-donor-fields>
            <div className="field-row">
              <div>
                <span className="field-label">
                  First name <span aria-hidden="true">*</span>
                </span>
                <input
                  className="donor-input"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  aria-label="First name"
                  data-first-name
                  value={donor.firstName}
                  onChange={updateDonor('firstName')}
                />
              </div>
              <div>
                <span className="field-label">
                  Last name <span aria-hidden="true">*</span>
                </span>
                <input
                  className="donor-input"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  aria-label="Last name"
                  data-last-name
                  value={donor.lastName}
                  onChange={updateDonor('lastName')}
                />
              </div>
            </div>
            <div>
              <span className="field-label">
                Email address <span aria-hidden="true">*</span>
              </span>
              <input
                className="donor-input"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                aria-label="Email address"
                data-email
                value={donor.donorEmail}
                onChange={updateDonor('donorEmail')}
              />
            </div>
            <div>
              <span className="field-label">
                Message <span className="field-hint">optional</span>
              </span>
              <textarea
                className="donor-textarea"
                maxLength={500}
                placeholder="A note for the team"
                aria-label="Message or comment (optional)"
                data-comment
                value={donor.comment}
                onChange={updateDonor('comment')}
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                data-anonymous
                checked={donor.isAnonymous}
                onChange={updateDonor('isAnonymous')}
              />
            </label>
          </div>
        </div>

        {/* Step 2: payment */}
        <section className={`stripe-section${step === 'payment' ? ' is-visible' : ''}`} data-stripe-section>
          <div className="stripe-head">
            <h3 className="stripe-title">Payment details</h3>
            <span className="ssl-badge">256-bit SSL</span>
          </div>
          <div className="payment-summary">
            <div>
              <span className="payment-summary__label">Total contribution</span>
              <span className="payment-summary__text" data-payment-summary-text>
                {designation.value} • {monthly ? 'Monthly' : 'Once'}
              </span>
            </div>
            <span className="payment-summary__amount" data-payment-summary-amount>
              {amountLabel}
            </span>
          </div>
          <span className="field-label">Credit / debit card</span>
          <div className="stripe-input-mock">
            <div className="stripe-element" data-stripe-element ref={elementHostRef}>
              {/* Direct Stripe Payment Element is mounted here */}
            </div>
          </div>
          <div className={`stripe-error${stripeError ? ' is-visible' : ''}`} data-stripe-error role="alert">
            {stripeError}
          </div>
          <p className="secure-note">Secure payment processing through Stripe.</p>
        </section>

        <div className="form-status" data-form-status role="status" aria-live="polite">
          {formStatus ? (
            <span className={formStatus.tone}>{formStatus.text}</span>
          ) : null}
        </div>

        <div className={`panel-actions${step === 'payment' ? ' is-paying' : ''}`} data-panel-actions>
          {step === 'payment' ? (
            <button
              type="button"
              className="panel-actions__back"
              data-stripe-back
              aria-label="Back to donor details"
              onClick={backToDetails}
            >
              <span aria-hidden="true">←</span>
            </button>
          ) : null}
          <button
            type="button"
            className="panel-actions__cta"
            data-complete-button
            disabled={button.disabled}
            onClick={startPayment}
          >
            <span data-button-text>{buttonLabel}</span>
            <span className="panel-actions__icon" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </aside>

    {/* Payment overlays (loading + success) — shared by the page and the dialog. */}
    <div className={`loading-overlay${loading.visible ? ' is-visible' : ''}`} data-loading-overlay aria-hidden={!loading.visible}>
      <div className="loading-card">
        <div className="loading-spinner" />
        <strong data-loading-title>{loading.title || 'Preparing secure payment'}</strong>
        <span data-loading-message>{loading.message || 'Please wait...'}</span>
      </div>
    </div>
    <div className={`modal-overlay${successOpen ? ' is-visible' : ''}`} data-success-modal aria-hidden={!successOpen}>
      <div className="modal-card">
        <div className="modal-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </div>
        <h3>Thank You!</h3>
        <p>
          Your donation was successful. Your generous support empowers families and strengthens
          medical care across rural health communities.
        </p>
        <button type="button" className="modal-button" data-modal-ok onClick={() => { window.location.reload(); }}>
          OK
        </button>
      </div>
    </div>
  </>
  );
}
