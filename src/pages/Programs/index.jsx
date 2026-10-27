import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/ui/Card.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Button from '../../components/ui/Button.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { programs, excludedPrograms, impact } from '../../data/content.js';
import { api } from '../../lib/apiClient.js';

import '../pages.css';

/**
 * Programs — design port of model1/program.js.
 * The CMS (Programs collection) overrides the hardcoded catalog title/summary/
 * cover when a record exists for the slug; everything else stays from content.
 */
export default function Programs() {
  useEffect(() => {
    document.title = 'Programs — HAND-Philippines';
  }, []);

  const { data: cmsPrograms } = useQuery({
    queryKey: ['cms-programs'],
    queryFn: () => api.getOptional('/_functions/programs', []),
    staleTime: 5 * 60 * 1000,
  });

  const list = programs.map((p) => {
    const c = (Array.isArray(cmsPrograms) ? cmsPrograms : []).find((x) => x.slug === p.slug);
    return c
      ? { ...p, title: c.title || p.title, summary: c.summary || p.summary, cover: c.cover || p.cover }
      : p;
  });

  return (
    <div className="hp-page">
      <section className="hp-pagehead">
        <span className="hp-orb hp-orb--blue" style={{ width: 320, height: 320, top: -110, left: -80 }} />
        <div className="hp-container hp-pagehead__inner">
          <Reveal>
            <span className="hp-eyebrow">Our programs</span>
            <h1 className="hp-pagehead__title">Six active programs in the Philippines</h1>
            <p className="hp-pagehead__lead">
              Every program is built with a local partner and designed to leave behind capability,
              not dependency. This is the active catalog — nothing discontinued, nothing
              aspirational.
            </p>
            <div className="hp-pagehead__cta">
              <Button modal="donate" variant="sun">
                Donate to a program
              </Button>
              <Button to="/get-involved" variant="outline">
                Volunteer with us
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          <div className="hp-grid hp-grid--3">
            {list.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 70}>
                <Card
                  to={`/programs/${p.slug}`}
                  title={p.title}
                  text={p.summary}
                  image={p.cover}
                  imageAlt={p.title}
                  imageRatio={16 / 10}
                  tone={p.tone}
                  icon={p.icon}
                  cta="Explore program"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--sunken">
        <div className="hp-container">
          <div className="hp-split">
            <Reveal className="hp-split__body">
              <SectionHeader
                eyebrow="Program model"
                title="Overview, activities, gallery, how to help"
                lead="Each program page follows the same path so you always know what the work is, what it produced, who was in it, and what you can do next."
              />
              <ul className="hp-ticks">
                <li>
                  <strong>Adopt-a-RHU</strong> — material, technological, and financial support for
                  village-level Rural Health Units recovering from disaster.
                </li>
                <li>
                  <strong>Many Hands, Lasting Change</strong> — $340,000 of biomedical cargo
                  delivered to hospitals and rural health centers.
                </li>
                <li>
                  <strong>Vela Neonatal Resuscitation</strong> — resuscitation equipment and
                  frontline training in birth centers.
                </li>
                <li>
                  <strong>Educational Forums</strong> — the annual lecture series during missions.
                </li>
              </ul>
            </Reveal>
            <Reveal className="hp-split__media" delay={100}>
              <div className="hp-specs">
                {impact.map((s) => (
                  <div className="hp-specs__row" key={s.label}>
                    <dt className="hp-specs__key">{s.label}</dt>
                    <dd className="hp-specs__val">
                      {s.value} — {s.note}
                    </dd>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section hp-section--tight">
        <div className="hp-container">
          <Reveal>
            <Callout tone="info" title="Not currently offered">
              <p style={{ marginBottom: '0.75rem' }}>
                These are intentionally absent from the active catalog, per the current program list:
              </p>
              <ul style={{ paddingLeft: '1.1rem' }}>
                {excludedPrograms.map((x) => (
                  <li key={x.title}>
                    <strong>{x.title}</strong> — {x.reason}
                  </li>
                ))}
              </ul>
            </Callout>
          </Reveal>
          <Reveal>
            <div className="hp-cta-row" style={{ marginTop: '2.5rem' }}>
              <Button to="/medical-mission" variant="primary">
                See the 2027 Medical Mission
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
