import './ui.css';

/** Reveal-on-scroll wrapper. Respects prefers-reduced-motion via CSS. */
export default function Reveal({ children, as: Tag = 'div', delay = 0, className = '', ...rest }) {
  return (
    <Tag
      className={`hp-reveal ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
