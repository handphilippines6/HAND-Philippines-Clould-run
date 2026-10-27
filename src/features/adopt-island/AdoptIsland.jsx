import { useEffect, useRef, useState } from 'react';
import { ISLANDS, KIT_LABELS, KIT_PRICE } from '../../data/islandData.js';
import IslandMap from './IslandMap.jsx';
import SponsorForm from './SponsorForm.jsx';
import { openStripeCheckout } from './stripeGateway.js';
import * as api from './api.js';
import './adopt-island.css';

function slotsOf(slots, no) {
  return (slots || []).filter((s) => s.islandNo === no).sort((a, b) => a.slot - b.slot);
}

/**
 * Adopt an Island board (React port of model1's <adopt-island> element).
 * Loads the IslandBuddies board from the Wix `/_functions/islandBoard`
 * endpoint, renders the interactive map, and runs the sponsor / Stripe flow.
 */
export default function AdoptIsland() {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openForm, setOpenForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [flash, setFlash] = useState({ ok: false, message: '' });
  const [publishableKey, setPublishableKey] = useState('');
  const pollRef = useRef(null);

  async function refreshBoard() {
    try {
      const res = await api.getIslandBoard();
      if (Array.isArray(res.slots)) setSlots(res.slots);
    } catch (e) {
      console.error('[adopt-island] board', e);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const key = await api.getPublishableKey();
        if (!cancelled) setPublishableKey((key && (key.publishableKey || key.key)) || '');
      } catch (e) {
        console.error('[adopt-island] publishable key', e);
      }
      await refreshBoard();
    }

    boot();
    pollRef.current = setInterval(refreshBoard, 20000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const done = slots.filter((s) => s.state === 'paid').length;
  const reserved = slots.filter((s) => s.state === 'reserved').length;
  const sponsoredTotal = done + reserved;

  function pick(island) {
    setSelected(island.no);
    setOpenForm(null);
    setFormErr('');
  }

  function closePanel() {
    setSelected(null);
    setOpenForm(null);
    setFormErr('');
  }

  const selectedIsland = selected ? ISLANDS.find((i) => i.no === selected) : null;
  const selectedSlots = selectedIsland ? slotsOf(slots, selectedIsland.no) : [];
  const allOpen = selectedSlots.length === 2 && selectedSlots.every((s) => s.state === 'open');

  async function pay(island, list, payload) {
    if (busy) return;
    if (!publishableKey) {
      setFormErr('Payment setup is not ready. Please try again in a moment.');
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      const res = await api.startIslandGift(payload.slotIds, payload.name, payload.email, payload.firstName, payload.lastName);
      if (!res.ok) {
        setFormErr(res.message || 'Unable to start the payment.');
        return;
      }
      closePanel();
      openStripeCheckout({
        publishableKey,
        clientSecret: res.clientSecret,
        island: island.name,
        amount: res.amount,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        onSuccess: () => paymentSucceeded(payload, island.name),
        onCancel: () => paymentCancelled(res.paymentIntentId),
      });
    } catch (e) {
      setFormErr('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function reserve(island, list, payload) {
    if (busy) return;
    setBusy(true);
    setFormErr('');
    try {
      const res = await api.reserveIslandSlots(payload.slotIds, payload.name, payload.email, payload.firstName, payload.lastName);
      if (!res.ok) {
        setFormErr(res.message || 'Unable to reserve.');
        return;
      }
      closePanel();
      setFlash({ ok: true, message: `Thank you, ${payload.firstName}. Your spot for ${island.name} is reserved as “${payload.name}.”` });
      await refreshBoard();
    } catch (e) {
      setFormErr('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function paymentSucceeded(payload, islandName) {
    setFlash({ ok: true, message: `Thank you, ${payload.firstName}. “${payload.name}” will appear on the map beside ${islandName} as soon as your payment clears.` });
    [2000, 5000, 10000].forEach((ms) => setTimeout(refreshBoard, ms));
  }

  async function paymentCancelled(paymentIntentId) {
    if (paymentIntentId) {
      try {
        await api.releaseIslandHold(paymentIntentId);
      } catch (e) {
        /* noop */
      }
    }
    await refreshBoard();
  }

  return (
    <div className="adopt-island">
      <div className="ai-intro">
        <h2 className="ai-title">Adopt an Island</h2>
        <p className="ai-vela">
          Vela is Latin for “sail.” A sail needs wind to move; a newborn needs a first breath. This
          project helps babies who struggle to breathe catch that breath and survive.
        </p>
        <p className="ai-lead">
          <strong>Why:</strong> A baby who is not breathing needs help within the first minute of
          life. With the nearest hospital a boat ride away, infants born in island communities may
          not survive.
        </p>
        <p className="ai-lead">
          <strong>The plan:</strong> Vela Neonatal Resuscitation Kits will be delivered to the
          islands’ birth attendants. Hands-on training will be provided by our pediatrician, Rosie
          Davis, MD.
        </p>
      </div>

      <div className="ai-stats" aria-live="polite">
        <span className="ai-count">{sponsoredTotal} of 40</span>
        <span className="ai-raised">
          {done ? `$${(done * KIT_PRICE).toLocaleString('en-US')} given of $10,000` : ''}
        </span>
      </div>

      <div className="ai-pips" aria-hidden="true">
        {Array.from({ length: 40 }, (_, k) => (
          <span
            key={k}
            className={'ai-pip' + (k < done ? ' is-paid' : k < sponsoredTotal ? ' is-reserved' : '')}
          />
        ))}
      </div>

      <div className="ai-mapbox">
        <IslandMap slots={slots} onPick={pick} />

        {selectedIsland && (
          <aside className="ai-panel" role="dialog" aria-label={`Sponsor ${selectedIsland.name}`}>
            <button type="button" className="ai-close" aria-label="Close" onClick={closePanel}>
              ×
            </button>
            <h3>{selectedIsland.name}</h3>
            <p className="ai-muni">{selectedIsland.muni}</p>

            {selectedSlots.map((s) => (
              <div className="ai-slot" key={s._id}>
                <div className="ai-slot__who">
                  <i className={'ai-dot' + (s.state === 'open' ? '' : ' is-' + s.state)} />
                  <span>
                    {s.state === 'paid'
                      ? s.name || 'Anonymous'
                      : s.state === 'reserved'
                        ? 'Reserved by ' + (s.name || 'a friend')
                        : s.state === 'held'
                          ? 'Checkout in progress'
                          : 'Needs a sponsor'}
                  </span>
                  <small>{KIT_LABELS[s.slot] || 'Kit'}</small>
                </div>
                {s.state === 'open' && (
                  <button
                    type="button"
                    className="ai-slot__btn"
                    onClick={() => setOpenForm(openForm === s._id ? null : s._id)}
                  >
                    {openForm === s._id ? 'Close' : 'Sponsor $250'}
                  </button>
                )}
                {openForm === s._id && (
                  <SponsorForm
                    list={[s]}
                    error={formErr}
                    busy={busy}
                    onPay={(p) => pay(selectedIsland, [s], p)}
                    onReserve={(p) => reserve(selectedIsland, [s], p)}
                  />
                )}
              </div>
            ))}

            {allOpen && (
              <div className="ai-slot">
                <div className="ai-slot__who">
                  <span>Or adopt the whole island</span>
                </div>
                <button
                  type="button"
                  className="ai-slot__btn"
                  onClick={() => setOpenForm(openForm === 'both' ? null : 'both')}
                >
                  {openForm === 'both' ? 'Close' : 'Both kits $500'}
                </button>
                {openForm === 'both' && (
                  <SponsorForm
                    list={selectedSlots}
                    error={formErr}
                    busy={busy}
                    onPay={(p) => pay(selectedIsland, selectedSlots, p)}
                    onReserve={(p) => reserve(selectedIsland, selectedSlots, p)}
                  />
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {flash.message && (
        <div className={'ai-flash' + (flash.ok ? ' is-ok' : ' is-err')} role="status">
          {flash.message}
        </div>
      )}

      <div className="ai-key">
        <span>
          <i className="ai-dot" /> Needs a sponsor
        </span>
        <span>
          <i className="ai-dot is-reserved" /> Reserved (pledged by check; name in italics)
        </span>
        <span>
          <i className="ai-dot is-paid" /> Sponsored
        </span>
      </div>

      <p className="ai-foot">
        HAND-Philippines (Health Assistance and Network Development-Philippines) is a 501(c)(3)
        nonprofit, EIN 46-4698622. Gifts are tax-deductible to the extent allowed by law. To pledge
        by check, mail your gift to HAND-Philippines, PO Box 85, Augusta, ME 04332.
      </p>
    </div>
  );
}


