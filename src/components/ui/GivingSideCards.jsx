import { useModal } from './ModalProvider.jsx';
import { daf, mailACheck } from '../../data/content.js';

/**
 * GivingSideCards — the right-hand column of the giving dialog (port of the
 * model1 shell's givingSideHtml): the two non-card routes (DAF grant and
 * check by mail) with the legal name, EIN, and mailing address, so nobody has
 * to leave the dialog to find them.
 */
export default function GivingSideCards() {
  const { open } = useModal();

  const facts = (fields) => (
    <dl className="hp-give__facts">
      {fields.map((field) => (
        <div key={field.label}>
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="hp-give">
      <article className="hp-give__card">
        <span className="hp-eyebrow">Another route</span>
        <h3 className="hp-give__title">{daf.title}</h3>
        <p className="hp-give__lead">{daf.intro}</p>
        <ol className="hp-give__steps">
          <li>Log in to your DAF sponsor — {daf.providers.join(', ')}.</li>
          <li>Recommend a grant with the legal name and EIN below.</li>
          <li>We confirm by email and put the grant to work.</li>
        </ol>
        {facts(daf.manual.fields)}
        <button
          type="button"
          className="hp-btn hp-btn--outline hp-btn--sm hp-btn--full"
          onClick={() => open('inquiry', { topic: 'daf-help' })}
        >
          <span className="hp-btn__label">Ask us for a grant link</span>
        </button>
      </article>

      <article className="hp-give__card">
        <span className="hp-eyebrow">No platform fees</span>
        <h3 className="hp-give__title">{mailACheck.title}</h3>
        <p className="hp-give__lead">{mailACheck.intro}</p>
        <ol className="hp-give__steps">
          {mailACheck.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {facts(mailACheck.fields)}
      </article>
    </div>
  );
}

