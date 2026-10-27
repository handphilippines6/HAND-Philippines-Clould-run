import { Link } from 'react-router-dom';
import { useModal } from './ModalProvider.jsx';
import './Button.css';

/**
 * Button — the single call-to-action primitive (port of the model1 hpButton).
 * Renders as <button>, react-router <Link>, or <a> depending on props.
 * Variants: primary (blue) · sun (yellow) · ghost · outline · quiet
 *
 *   modal="inquiry" topic="reserve-2027"  -> opens the shared dialog; the
 *     topic travels with the button so the visitor never has to classify
 *     their own request (data-modal-open + data-modal-topic in model1).
 *   scroll="#anchor"                      -> header-aware smooth in-page scroll.
 * All interactive targets are >= 44px tall.
 */
export default function Button({
  children,
  to,
  href,
  modal,
  topic = '',
  scroll,
  variant = 'primary',
  size = 'md',
  icon,
  iconLeft,
  iconRight,
  full = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const { open } = useModal();

  const classes = [
    'hp-btn',
    `hp-btn--${variant}`,
    `hp-btn--${size}`,
    full ? 'hp-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <>
      {iconLeft ? <span className="hp-btn__icon">{iconLeft}</span> : null}
      <span className="hp-btn__label">{children}</span>
      {(icon || iconRight) ? <span className="hp-btn__icon">{icon || iconRight}</span> : null}
    </>
  );

  /* A form button names its own purpose: one dialog serves every form. */
  if (modal) {
    return (
      <button
        type={type}
        className={classes}
        data-modal-open={modal}
        data-modal-topic={topic || undefined}
        onClick={(event) => {
          if (typeof rest.onClick === 'function') rest.onClick(event);
          open(modal, { topic: topic || 'general', opener: event.currentTarget });
        }}
        disabled={rest.disabled}
      >
        {inner}
      </button>
    );
  }

  /* In-page trigger: preventDefault + header-aware smooth scroll (model1
     setupScroll). */
  if (scroll) {
    return (
      <a
        href={scroll}
        className={classes}
        onClick={(event) => {
          if (typeof rest.onClick === 'function') rest.onClick(event);
          event.preventDefault();
          const target = document.querySelector(scroll);
          if (!target) return;
          const header = document.querySelector('.hp-header');
          const headerHeight = header ? header.offsetHeight : 72;
          const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }}
      >
        {inner}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {inner}
      </Link>
    );
  }
  if (href) {
    const external = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:');
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {inner}
    </button>
  );
}


