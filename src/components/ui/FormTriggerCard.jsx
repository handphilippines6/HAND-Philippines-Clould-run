import Icon from './Icon.jsx';
import Button from './Button.jsx';

/**
 * FormTriggerCard — what stands where an inline form used to be (port of the
 * model1 formTriggerCard). The topic travels with the button, so clicking it
 * opens the shared dialog already labelled with the purpose the visitor chose.
 */
export default function FormTriggerCard({
  topic = 'general',
  iconName = 'mail',
  tone = 'blue',
  title = 'Get in touch',
  lead = '',
  bullets = [],
  cta = 'Open the form',
  note = '',
  className = '',
}) {
  return (
    <article className={`hp-card hp-ftrigger${className ? ` ${className}` : ''}`}>
      <div className="hp-card__body">
        <span className={`hp-card__icon hp-card__icon--${tone}`}>
          <Icon name={iconName} size={20} />
        </span>
        <h3 className="hp-card__title">{title}</h3>
        {lead ? <p className="hp-card__text">{lead}</p> : null}
        {bullets.length ? (
          <ul className="hp-ticks hp-ftrigger__ticks">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
        <div className="hp-ftrigger__foot">
          <Button modal="inquiry" topic={topic} variant="primary" full iconRight={<Icon name="arrowRight" size={16} />}>
            {cta}
          </Button>
        </div>
        {note ? <p className="hp-ftrigger__note">{note}</p> : null}
      </div>
    </article>
  );
}
