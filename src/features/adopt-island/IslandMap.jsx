import { ISLANDS, TOWNS, KIT_LABELS } from '../../data/islandData.js';

/** Slot color: paid green, reserved amber, held gray, open white. */
function slotColor(state) {
  if (state === 'paid') return '#0F7B5F';
  if (state === 'reserved') return '#C98A00';
  if (state === 'held') return '#9aa5ac';
  return '#ffffff';
}

function slotsOf(slots, no) {
  return (slots || []).filter((s) => s.islandNo === no).sort((a, b) => a.slot - b.slot);
}

function labelPos(i) {
  const x = i.x;
  const y = i.y;
  if (i.side === 'l') return { x: x - 22, y: y + 5, anchor: 'end' };
  if (i.side === 't') return { x, y: y - 16, anchor: 'middle' };
  if (i.side === 'b') return { x, y: y + 28, anchor: 'middle' };
  return { x: x + 22, y: y + 5, anchor: 'start' };
}

/**
 * Interactive island board. `slots` is the IslandBuddies array; `onPick`
 * receives the selected island. Faithful port of model1 neonatal/map.js.
 */
export default function IslandMap({ slots, onPick }) {
  return (
    <svg viewBox="0 0 1400 820" role="img" aria-label="Interactive map of the Adopt an Island board">
      <rect width="1400" height="820" fill="#d9e9f5" />
      <g className="aimap__towns">
        {TOWNS.map((t) => (
          <g key={t.n}>
            <rect x={t.x - 3} y={t.y - 3} width="6" height="6" fill="#8a949b" />
            <text x={t.x + 8} y={t.y + 5} fontSize="15" fill="#7a858c" fontStyle="italic">
              {t.n}
            </text>
          </g>
        ))}
      </g>

      <g className="aimap__marks">
        {ISLANDS.map((i) => {
          const ss = slotsOf(slots, i.no);
          const label = labelPos(i);
          const sponsor = ss.find((s) => s.state === 'paid' || s.state === 'reserved');
          return (
            <g
              key={i.no}
              className="aimap__island"
              role="button"
              tabIndex={0}
              aria-label={i.name}
              onClick={() => onPick(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPick(i);
                }
              }}
            >
              {[0, 1].map((k) => {
                const st = ss[k] ? ss[k].state : 'open';
                return (
                  <circle
                    key={k}
                    cx={i.x - 8 + k * 16}
                    cy={i.y}
                    r="7.5"
                    fill={slotColor(st)}
                    stroke={st === 'open' ? '#D4572A' : slotColor(st)}
                    strokeWidth="3"
                  />
                );
              })}
              <text
                x={label.x}
                y={label.y}
                fontSize="17"
                fontWeight="700"
                fill="#040273"
                textAnchor={label.anchor}
                stroke="#fff"
                strokeWidth="4"
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {i.name}
              </text>
              {sponsor && (
                <text
                  x={label.x}
                  y={label.y + 18}
                  fontSize="13"
                  fontWeight={sponsor.state === 'reserved' ? '400' : '700'}
                  fill={sponsor.state === 'paid' ? '#0F7B5F' : '#8a5a00'}
                  fontStyle={sponsor.state === 'reserved' ? 'italic' : 'normal'}
                  textAnchor={label.anchor}
                  stroke="#fff"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {sponsor.name || (sponsor.state === 'reserved' ? 'Reserved' : 'Sponsored')}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
