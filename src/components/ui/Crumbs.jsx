import { Link } from 'react-router-dom';

/** Breadcrumbs (model1 crumbs markup; links route through React Router). */
export default function Crumbs({ items = [] }) {
  return (
    <nav className="hp-crumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {i > 0 ? <span className="hp-crumbs__sep">/</span> : null}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

