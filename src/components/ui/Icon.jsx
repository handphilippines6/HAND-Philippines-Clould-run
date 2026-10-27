/** Small inline SVG icon set — no icon library, no default-import bloat. */
const paths = {
  arrowRight: <><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="m11 19-7-7 7-7" /></>,
  stethoscope:
    <><path d="M5 3v6a4 4 0 0 0 8 0V3" /><path d="M4 3h2M12 3h2" /><path d="M9 13v2a5 5 0 0 0 10 0v-1" /><circle cx="19" cy="11" r="2" /></>,
  cargo: <><path d="M3 7h10v10H3z" /><path d="M13 10h4l4 3v4h-8z" /><circle cx="7" cy="19" r="2" /><circle cx="17" cy="19" r="2" /></>,
  heart: <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />,
  shield: <><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" /><path d="m9 12 2 2 4-4" /></>,
  book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M8 7h8M8 11h6" /></>,
  cap: <><path d="m2 8 10-4 10 4-10 4z" /><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" /></>,
  hands: <><path d="M11 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M14 12V4.5a1.5 1.5 0 0 1 3 0V13" /><path d="M17 13V7.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.2-3L5 15.5A1.7 1.7 0 0 1 8 13.4l3 3.1" /></>,
  star: <path d="m12 2.5 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1-5.9 3.1 1.1-6.4L2.5 10l6.5-1z" />,
  brush: <><path d="M9.5 14.5 3 21l6.5-2.5 8-8a2.1 2.1 0 0 0-3-3z" /><path d="M14 5.5 18.5 2 22 5.5 18.5 9" /></>,
  gavel: <><path d="m3 21 8-8" /><path d="m7 9 8 8" /><path d="m13 5 6 6" /><path d="m9 3 6 6-4 4-6-6z" /></>,
  building: <><path d="M3 21h18" /><path d="M5 21V4h9v17" /><path d="M14 9h5v12" /><path d="M8 8h3M8 12h3M8 16h3" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></>,
  sun: <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  hands2: <><path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11" /><path d="M10 11V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M13 11V7.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-5.2-3L2.5 15A1.7 1.7 0 0 1 5 13l2 2" /></>,
  check: <path d="m20 6-11 11-5-5" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>,
  phone: <path d="M5 3h3.5l2 5-2.2 1.4a12 12 0 0 0 5.3 5.3L15 12.5l5 2V18a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2 2 2 0 0 1 5 3z" />,
  mail: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="m3 6.5 9 6.5 9-6.5" /></>,
  users: <><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M17 5.3a3.4 3.4 0 0 1 0 6.6" /><path d="M18.5 20a6.5 6.5 0 0 0-2.2-4.8" /></>,
  camera: <><path d="M3 8.5A2 2 0 0 1 5 6.5h2.5L9 4.5h6L16.5 6.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.6" /></>,
  plane: <path d="M21 15.5 13 11V4.5a1.5 1.5 0 0 0-3 0V11l-8 4.5V18l8-2.2V20l-2.5 1.5V23L12 22l4.5 1.5v-1.5L14 21v-4.2l7 2.2z" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  quote: <path d="M9 7H5.5A2.5 2.5 0 0 0 3 9.5V13a2 2 0 0 0 2.5 2.5H7v1.5A2.5 2.5 0 0 1 4.5 19M20 7h-3.5A2.5 2.5 0 0 0 14 9.5V13a2.5 2.5 0 0 0 2.5 2.5H18v1.5a2.5 2.5 0 0 1-2.5 2.5" />,
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.9, ...rest }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {d}
    </svg>
  );
}
