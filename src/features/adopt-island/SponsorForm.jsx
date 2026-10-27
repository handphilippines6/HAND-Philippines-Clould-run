import { useState } from 'react';
import { KIT_PRICE } from '../../data/islandData.js';

const NAME_MAX = 14;

/**
 * Sponsor form (React port of model1 neonatal/sponsor-form.js). `list` is the
 * slot(s) being sponsored. onSubmit receives the payload
 * { slotIds, name, email, firstName, lastName } and a `mode` of 'pay'|'reserve'.
 */
export default function SponsorForm({ list, error, busy, onPay, onReserve }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');

  const amount = KIT_PRICE * list.length;

  function validate() {
    if (!firstName.trim()) {
      setFormError('Enter your first name for the receipt.');
      return false;
    }
    if (!lastName.trim()) {
      setFormError('Enter your last name for the receipt.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError('Enter an email address for your receipt.');
      return false;
    }
    if (!name.trim()) {
      setFormError('Enter the name to show beside your island.');
      return false;
    }
    if (name.trim().length > NAME_MAX) {
      setFormError('Keep the island name to 14 characters or fewer.');
      return false;
    }
    setFormError('');
    return true;
  }

  function submit(mode) {
    if (busy) return;
    if (!validate()) return;
    const payload = {
      slotIds: list.map((s) => s._id),
      name: name.trim(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };
    if (mode === 'pay') onPay(payload);
    else onReserve(payload);
  }

  const message = formError || error || '';

  return (
    <form
      className="aisp__form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit('pay');
      }}
    >
      <div className="aisp__row">
        <label className="aisp__field">
          <span>First name</span>
          <input
            type="text"
            maxLength="50"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="aisp__field">
          <span>Last name</span>
          <input
            type="text"
            maxLength="50"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
      </div>

      <label className="aisp__field">
        <span>Email for your receipt</span>
        <input
          type="email"
          maxLength="120"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="aisp__field">
        <span>Name to show beside your island (up to 14 characters)</span>
        <input
          type="text"
          maxLength={NAME_MAX}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="aisp__acts">
        <button type="submit" className="aisp__btn aisp__btn--primary" disabled={busy}>
          Give ${amount} now
        </button>
        <button
          type="button"
          className="aisp__btn aisp__btn--ghost"
          disabled={busy}
          onClick={() => submit('reserve')}
        >
          Pledge ${amount} by check
        </button>
      </div>

      {message && (
        <p className="aisp__err" role="alert">
          {message}
        </p>
      )}
      <p className="aisp__note">
        Paying online shows your name right away. A check pledge shows as “Reserved by” your name
        until the check arrives.
      </p>
    </form>
  );
}
