// Stripe Payment Element gateway for the Adopt an Island React component.
// Ported from model1 neonatal/stripe-gateway.js ("Direct Payment Element, no
// iframe" pattern from donate-v2.js). The checkout is a separate modal appended
// to document.body so position:fixed is reliable.

function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }
    if (document.querySelector('script[src="https://js.stripe.com/v3/"]')) {
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
    script.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error('Stripe.js failed to load.')));
    script.onerror = () => reject(new Error('Stripe.js failed to load.'));
    document.head.appendChild(script);
  });
}

async function mountStripeElement(host, publishableKey, clientSecret, donorDetails) {
  host.innerHTML = '<div id="stripe-payment-element-mount"></div>';
  const mountPoint = host.querySelector('#stripe-payment-element-mount');
  if (!mountPoint) throw new Error('The secure payment form could not be placed on this page.');

  await loadStripeJs();
  if (!window.Stripe) throw new Error('The secure payment script did not load. Please try again.');

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
        name: `${donorDetails.firstName} ${donorDetails.lastName}`.trim() || undefined,
        email: donorDetails.email || undefined,
      },
    },
    layout: { type: 'tabs', defaultCollapsed: false },
    paymentMethodOrder: ['card', 'paypal', 'link', 'klarna'],
    wallets: { applePay: 'auto', googlePay: 'auto' },
  });

  paymentEl.mount(mountPoint);
  return { stripeInstance, elementsInstance, paymentEl };
}

const CHECKOUT_TIMEOUT_MS = 20 * 60 * 1000;

let modalRoot = null;

function buildModal() {
  if (modalRoot) return modalRoot;
  modalRoot = document.createElement('div');
  modalRoot.id = 'island-stripe-modal';
  modalRoot.innerHTML = `
    <style>
      #island-stripe-modal{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:16px}
      #island-stripe-modal.is-visible{display:flex}
      #island-stripe-modal .backdrop{position:absolute;inset:0;background:rgba(4,2,115,.55)}
      #island-stripe-modal .dialog{position:relative;background:#fff;border-radius:12px;width:min(480px,94vw);max-height:90vh;overflow:auto;padding:20px 22px;box-shadow:0 12px 40px rgba(4,2,115,.3);font-family:Helvetica,Arial,sans-serif;color:#040273}
      #island-stripe-modal .dialog h3{font-size:20px;margin:0 0 4px}
      #island-stripe-modal .sum{color:#5b6770;font-size:14px;margin:0 0 14px}
      #island-stripe-modal .acts{display:flex;gap:10px;margin-top:14px}
      #island-stripe-modal .cancel{background:#fff;border:1.5px solid #d7dde3;color:#040273;border-radius:8px;padding:10px 14px;cursor:pointer}
      #island-stripe-modal .pay{flex:1;background:#2064B7;border:none;color:#fff;border-radius:8px;padding:10px 14px;font-size:16px;cursor:pointer}
      #island-stripe-modal .pay:disabled{opacity:.6;cursor:not-allowed}
      #island-stripe-modal .err{color:#dc2626;font-size:13px;margin:10px 0 0}
      #island-stripe-modal .note{font-size:12px;color:#7a858c;margin:10px 0 0}
    </style>
    <div class="backdrop"></div>
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Complete your gift">
      <h3>Complete your gift</h3>
      <p class="sum"></p>
      <div class="mount"></div>
      <p class="err" role="alert"></p>
      <div class="acts">
        <button class="cancel" type="button">Cancel</button>
        <button class="pay" type="button" disabled>Pay now</button>
      </div>
      <p class="note">Secure payment powered by Stripe. Your card is never stored on this site.</p>
    </div>`;
  document.body.appendChild(modalRoot);
  return modalRoot;
}

export async function openStripeCheckout({
  publishableKey,
  clientSecret,
  island,
  amount,
  firstName,
  lastName,
  email,
  onSuccess,
  onCancel,
}) {
  const modal = buildModal();
  const sum = modal.querySelector('.sum');
  const err = modal.querySelector('.err');
  const payBtn = modal.querySelector('.pay');
  const cancelBtn = modal.querySelector('.cancel');
  const mount = modal.querySelector('.mount');

  sum.textContent = `Sponsoring ${island} — $${amount}`;
  err.textContent = '';
  payBtn.textContent = 'Pay now';
  payBtn.disabled = true;
  modal.classList.add('is-visible');

  let closed = false;
  let timer = null;

  function close() {
    if (closed) return;
    closed = true;
    if (timer) clearTimeout(timer);
    modal.classList.remove('is-visible');
    mount.innerHTML = '';
    payBtn.onclick = null;
    cancelBtn.onclick = null;
  }

  timer = setTimeout(() => {
    close();
    onCancel();
  }, CHECKOUT_TIMEOUT_MS);

  try {
    const stripe = await mountStripeElement(mount, publishableKey, clientSecret, { firstName, lastName, email });
    if (closed) {
      mount.innerHTML = '';
      return;
    }
    payBtn.disabled = false;
    payBtn.onclick = async () => {
      payBtn.disabled = true;
      payBtn.textContent = 'Processing…';
      err.textContent = '';
      const { error, paymentIntent } = await stripe.stripeInstance.confirmPayment({
        elements: stripe.elementsInstance,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) {
        close();
        onCancel();
        return;
      }
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        close();
        onSuccess(paymentIntent);
      }
    };
  } catch (error) {
    err.textContent = error?.message || 'The secure payment form did not load.';
    payBtn.disabled = false;
    return;
  }

  cancelBtn.onclick = () => {
    close();
    onCancel();
  };
}

