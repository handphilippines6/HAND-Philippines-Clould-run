import Icon from './Icon.jsx';

/** Callout — note, info, or quote block. */
export default function Callout({ tone = 'info', title, children, icon }) {
  const iconName = icon || (tone === 'quote' ? 'quote' : tone === 'sun' ? 'star' : 'bell');
  return (
    <aside className={`hp-callout hp-callout--${tone}`}>
      <span className="hp-callout__icon">
        <Icon name={iconName} size={20} />
      </span>
      <div className="hp-callout__body">
        {title ? <p className="hp-callout__title">{title}</p> : null}
        <div className="hp-callout__text">{children}</div>
      </div>
    </aside>
  );
}
