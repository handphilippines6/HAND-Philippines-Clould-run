import { useRef, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { org } from '../../data/content.js';
import './ContactForm.css';

/**
 * ContactForm — the design's shared form (port of the model1 contactForm()).
 * ONE form component reused across every page and every dialog.
 *
 * lane:    'contact' (default) or 'interest' (adds form:'interest' so the
 *          backend files it under the interest intake).
 * type:    default select/type value (must be backend-allowed).
 * presets: [{value,label}] shown as the "I am interested in" select; when
 *          absent an optional Subject field renders (design behavior).
 * headless: inside a dialog the eyebrow and title already sit in the modal
 *          header, so the form starts straight at the fields.
 * subjectValue: the topic line is stored with the message without asking the
 *          visitor to retype what the button already told us.
 *
 * Form transport contract (backend/http-functions.js post_contactMessage):
 *   POST /_functions/contactMessage
 *   contact lane: { name, email, phone?, type, message, consent, source }
 *   interest lane adds form:'interest'
 *   consent MUST be exactly true; message minimum 10 chars.
 */
const CONTACT_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL || ''}/_functions/contactMessage`;
const GENERIC_SUCCESS =
  'Thank you — we have your message. A volunteer will read your inquiry and reply personally.';

let formSeq = 0;

export default function ContactForm({
  lane = 'contact',
  type = 'General Inquiry',
  typeLabel = 'General inquiry',
  title = 'Get in touch',
  lead = '',
  presets = [],
  showTypeSelect = false,
  submitLabel = 'Send message',
  source = 'contact-page',
  compact = false,
  headless = false,
  subjectValue = '',
}) {
  const id = `hf${++formSeq}`;
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [serverMessage, setServerMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    typeValue: presets[0]?.value || type,
    message: '',
    consent: false,
  });
  const nameRef = useRef(null);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const fieldError = (key, text) => setErrors((prev) => ({ ...prev, [key]: text }));


  const onSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setFormError('');

    const name = values.name.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    let message = values.message.trim();
    const subject = subjectValue || values.subject.trim();
    const consent = values.consent === true;

    let valid = true;
    if (name.length < 2) {
      fieldError('name', 'Please enter your name.');
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      fieldError('email', 'Please enter a valid email address.');
      valid = false;
    }
    if (subject) message = `Subject: ${subject}\n\n${message}`;
    /* A topic select normalizes to the backend-allowed set (design ids would
       coerce server-side), so carry the chosen topic into the stored message
       for the admin (design pattern: 'Volunteer application: <topic>'). */
    if (showTypeSelect && presets.length) {
      const chosen = presets.find((p) => p.value === values.typeValue);
      if (chosen && chosen.label) message = `${chosen.label}: ${message}`;
    }
    if (message.length < 10) {
      fieldError('message', 'Please tell us a little more (at least 10 characters).');
      valid = false;
    }
    if (!consent) {
      fieldError('consent', 'Consent is required before we can store your message.');
      valid = false;
    }
    if (!valid) return;

    const payload = {
      name,
      email,
      type: showTypeSelect && presets.length ? values.typeValue : type,
      message,
      consent: true,
      source: source || 'contact-page',
    };
    if (phone) payload.phone = phone;
    if (lane === 'interest') payload.form = 'interest';

    setStatus('sending');
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.success === false) {
        setFormError(
          json.error || 'We could not send your message just now. Please try again or email us.',
        );
        setStatus('idle');
        return;
      }
      setServerMessage(json.message || '');
      setStatus('done');
    } catch {
      setFormError('We could not reach the server. Please try again.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className="hp-cform hp-cform--done" role="status">
        <span className="hp-cform__done-icon" aria-hidden="true">
          <Icon name="check" size={26} />
        </span>
        <h3 className="hp-cform__done-title">Message received</h3>
        <p className="hp-cform__done-text">
          {serverMessage || GENERIC_SUCCESS} A volunteer will read your inquiry and reply personally
          to <strong>{values.email.trim()}</strong>.
        </p>
        <div className="hp-cform__receipt">
          <div className="hp-cform__receipt-row">
            <span>Reply to</span>
            <strong>{values.email.trim()}</strong>
          </div>
          <div className="hp-cform__receipt-row">
            <span>Time-sensitive?</span>
            <strong>Call, VM or text {org.phone}</strong>
          </div>
        </div>
        <button
          type="button"
          className="hp-btn hp-btn--primary hp-btn--full"
          onClick={() => {
            setStatus('idle');
            setServerMessage('');
            setFormError('');
            setErrors({});
            setValues((v) => ({ ...v, message: '', consent: false }));
            requestAnimationFrame(() => nameRef.current?.focus({ preventScroll: true }));
          }}
        >
          <span className="hp-btn__label">Send another message</span>
        </button>
      </div>
    );
  }

  /* Design layout: Name and Email share the first row; every other control is
     a full-width row (fields are full by default, the pair opts into halves). */
  const typeField = showTypeSelect && presets.length ? (
    <div className="hp-field hp-field--full">
      <label htmlFor={`${id}-type`}>I am interested in</label>
      <select id={`${id}-type`} name="type" value={values.typeValue} onChange={set('typeValue')}>
        {presets.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  ) : subjectValue ? (
    <input type="hidden" name="subject" value={subjectValue} />
  ) : (
    <div className="hp-field hp-field--full">
      <label htmlFor={`${id}-subject`}>
        Subject <span className="hp-field__opt">(optional)</span>
      </label>
      <input
        id={`${id}-subject`}
        name="subject"
        type="text"
        autoComplete="off"
        placeholder="What is this about?"
        value={values.subject}
        onChange={set('subject')}
      />
    </div>
  );

  return (
    <form
      className={`hp-cform${compact ? ' hp-cform--compact' : ''}`}
      onSubmit={onSubmit}
      noValidate
      data-lane={lane}
      data-source={source}
      data-type={type}
    >
      {!headless ? (
        <div className="hp-cform__head">
          <p className="hp-cform__type">{typeLabel}</p>
          <h3 className="hp-cform__title">{title}</h3>
          {lead ? <p className="hp-cform__lead">{lead}</p> : null}
        </div>
      ) : null}

      <div className="hp-cform__grid">
        <div className="hp-field hp-field--half">
          <label htmlFor={`${id}-name`}>
            Name <span className="hp-req" aria-hidden="true">*</span>
          </label>
          <input
            ref={nameRef}
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Maria Santos"
            value={values.name}
            onChange={set('name')}
            aria-invalid={errors.name ? 'true' : undefined}
          />
          {errors.name ? <span className="hp-field__err">{errors.name}</span> : null}
        </div>

        <div className="hp-field hp-field--half">
          <label htmlFor={`${id}-email`}>
            Email <span className="hp-req" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="maria@example.com"
            value={values.email}
            onChange={set('email')}
            aria-invalid={errors.email ? 'true' : undefined}
          />
          {errors.email ? <span className="hp-field__err">{errors.email}</span> : null}
        </div>

        <div className="hp-field hp-field--full">
          <label htmlFor={`${id}-phone`}>
            Phone <span className="hp-field__opt">(optional)</span>
          </label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+63 917 123 4567"
            value={values.phone}
            onChange={set('phone')}
          />
        </div>

        {typeField}

        <div className="hp-field hp-field--full">
          <label htmlFor={`${id}-message`}>
            Message <span className="hp-req" aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${id}-message`}
            name="message"
            placeholder="How can we help you, or how would you like to get involved?"
            value={values.message}
            onChange={set('message')}
            aria-invalid={errors.message ? 'true' : undefined}
          />
          {errors.message ? <span className="hp-field__err">{errors.message}</span> : null}
        </div>
      </div>

      <label className="hp-consent">
        <input
          type="checkbox"
          name="consent"
          checked={values.consent}
          onChange={set('consent')}
        />
        <span>
          I agree that <strong>HAND-Philippines</strong> may store this message and contact me about
          my inquiry. <span className="hp-req" aria-hidden="true">*</span>
        </span>
      </label>
      {errors.consent ? <span className="hp-field__err">{errors.consent}</span> : null}

      <p className="hp-cform__privacy">
        <span aria-hidden="true">
          <Icon name="shield" size={15} />
        </span>
        <span>
          We use your details only to reply. Nothing is shared with third parties and there is no
          mailing list unless you ask to be added.
        </span>
      </p>

      {formError ? (
        <p className="hp-field__err hp-cform__error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="hp-cform__foot">
        <button
          type="submit"
          className="hp-btn hp-btn--primary hp-btn--full"
          disabled={status === 'sending'}
        >
          <span className="hp-btn__label">{status === 'sending' ? 'Sending…' : submitLabel}</span>
          <span className="hp-btn__icon" aria-hidden="true">
            <Icon name="arrowRight" size={16} />
          </span>
        </button>
      </div>
    </form>
  );
}

