import { Link } from 'react-router-dom';
import SmartImage from '../media/SmartImage.jsx';
import Icon from './Icon.jsx';

/**
 * Card — content-linked image card.
 * Renders <Link> when `to` is provided, otherwise a static article.
 * The image holder degrades gracefully if the photo is unavailable.
 */
export default function Card({
  to,
  title,
  text,
  image,
  imageAlt = '',
  imageRatio = 16 / 10,
  tone = 'blue',
  icon,
  eyebrow,
  cta = 'Learn more',
  children,
  className = '',
}) {
  const body = (
    <>
      {image ? (
        <div className="hp-card__media">
          <SmartImage src={image} alt={imageAlt} ratio={imageRatio} tone={tone} />
        </div>
      ) : null}
      <div className="hp-card__body">
        <div className="hp-card__top">
          {icon ? (
            <span className={`hp-card__icon hp-card__icon--${tone}`}>
              <Icon name={icon} size={20} />
            </span>
          ) : null}
          {eyebrow ? <span className="hp-pill">{eyebrow}</span> : null}
        </div>
        <h3 className="hp-card__title">{title}</h3>
        {text ? <p className="hp-card__text">{text}</p> : null}
        {children}
        {cta ? (
          <span className={`hp-card__cta hp-card__cta--${tone}`}>
            {cta}
            <Icon name="arrowRight" size={16} />
          </span>
        ) : null}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`hp-card hp-card--interactive ${className}`.trim()}>
        {body}
      </Link>
    );
  }
  return <article className={`hp-card ${className}`.trim()}>{body}</article>;
}

