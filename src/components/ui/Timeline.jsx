import SmartImage from '../media/SmartImage.jsx';

/** Our Story & Timeline — 2014 grassroots response to the present. */
export default function Timeline({ items = [] }) {
  return (
    <ol className="hp-timeline">
      {items.map((item) => (
        <li key={item.year} className={`hp-tl hp-tl--${item.tone === 'sun' ? 'sun' : 'blue'}`}>
          <div className="hp-tl__marker" aria-hidden="true">
            <span className="hp-tl__dot" />
          </div>

          <div className="hp-tl__card hp-card">
            {item.cover ? (
              <div className="hp-tl__media">
                <SmartImage src={item.cover} alt="" ratio={16 / 9} tone={item.tone === 'sun' ? 'yellow' : 'blue'} />
              </div>
            ) : null}
            <div className="hp-tl__body">
              <div className="hp-tl__head">
                <span className="hp-tl__year">{item.year}</span>
                <h3 className="hp-tl__title">{item.title}</h3>
              </div>
              {item.points?.length ? (
                <ul className="hp-ticks hp-ticks--sun">
                  {item.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
