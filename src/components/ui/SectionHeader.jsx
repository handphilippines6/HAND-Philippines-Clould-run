/** Section heading with eyebrow + title + optional lead + rule. */
export default function SectionHeader({
  eyebrow,
  title,
  lead,
  align = 'left',
  tone = 'blue',
  as: Tag = 'h2',
  id,
  children,
}) {
  return (
    <div className={`hp-sh hp-sh--${align}`} style={id ? { scrollMarginTop: '100px' } : undefined}>
      {eyebrow ? (
        <span className={`hp-eyebrow ${tone === 'sun' ? 'hp-eyebrow--sun' : ''}`}>{eyebrow}</span>
      ) : null}
      <Tag className="hp-section-title" id={id}>
        {title}
      </Tag>
      {lead ? <p className="hp-section-lead">{lead}</p> : null}
      {align === 'center' ? <div className="hp-rule" /> : children}
    </div>
  );
}
