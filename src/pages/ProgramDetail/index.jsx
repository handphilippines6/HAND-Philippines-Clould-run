import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SmartImage from '../../components/media/SmartImage.jsx';
import PhotoGallery from '../../components/media/PhotoGallery.jsx';
import Card from '../../components/ui/Card.jsx';
import SectionHeader from '../../components/ui/SectionHeader.jsx';
import Callout from '../../components/ui/Callout.jsx';
import Button from '../../components/ui/Button.jsx';
import Crumbs from '../../components/ui/Crumbs.jsx';
import FormTriggerCard from '../../components/ui/FormTriggerCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { programs, org } from '../../data/content.js';
import {
  missionGallery,
  disasterGallery,
  academicGallery,
  childcareGallery,
} from '../../data/galleries.js';
import { api } from '../../lib/apiClient.js';

import '../pages.css';

/**
 * Program detail (/programs/:slug) — design port of model1/program-detail.js.
 * One page serves all six program routes. The CMS supplies title/summary/cover/
 * body when a record exists; tone/icon/gallery stay in the content layer.
 */
const galleryFor = {
  'medical-missions-adopt-a-rhu': missionGallery,
  'many-hands-lasting-change': missionGallery.slice(4, 9),
  'vela-neonatal-resuscitation': childcareGallery,
  'disaster-response-rebuilding': disasterGallery,
  'educational-forums': academicGallery,
  'academic-research': academicGallery,
};

export default function ProgramDetail() {
  const { slug = '' } = useParams();

  const { data: cmsProgram } = useQuery({
    queryKey: ['cms-program', slug],
    queryFn: () => api.getOptional(`/_functions/program?slug=${encodeURIComponent(slug)}`, null),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const base = programs.find((p) => p.slug === slug);
    const title = cmsProgram?.title || base?.title;
    if (title) document.title = `${title} — HAND-Philippines`;
    else document.title = 'Program — HAND-Philippines';
  }, [slug, cmsProgram]);

  const base = programs.find((p) => p.slug === slug);

  /* CMS supplies title/summary/cover/body; tone/icon/gallery stay in content. */
  const program =
    base && cmsProgram
      ? {
          ...base,
          title: cmsProgram.title || base.title,
          summary: cmsProgram.summary || base.summary,
          cover: cmsProgram.cover || base.cover,
          body: cmsProgram.body && cmsProgram.body.length ? cmsProgram.body : base.body,
        }
      : base;

  if (!program) {
    return (
      <div className="hp-page">
        <section className="hp-section">
          <div className="hp-container" style={{ textAlign: 'center', paddingBlock: '4rem' }}>
            <span className="hp-eyebrow">Program not found</span>
            <h1 className="hp-section-title">That program page does not exist</h1>
            <p className="hp-section-lead">The active catalog is listed on the Programs page.</p>
            <div className="hp-cta-row" style={{ justifyContent: 'center' }}>
              <Button to="/programs" variant="primary">
                All programs
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const photos = galleryFor[program.slug] || [];
  const related = programs.filter((p) => p.slug !== program.slug).slice(0, 3);

  return (
    <div className="hp-page">
      <section className="hp-pagehead hp-pagehead--dark">
        <div className="hp-phero">
          <div className="hp-phero__bg">
            <SmartImage src={program.cover} alt="" ratio="16 / 9" tone={program.tone} priority />
          </div>
          <span className="hp-phero__scrim" aria-hidden="true" />
          <div className="hp-container hp-phero__inner">
            <Reveal>
              <Crumbs
                items={[
                  { label: 'Home', to: '/' },
                  { label: 'Programs', to: '/programs' },
                  { label: program.title },
                ]}
              />
              <span className={`hp-eyebrow${program.tone === 'sun' ? ' hp-eyebrow--sun' : ''}`}>
                <Icon name={program.icon} size={14} /> Program
              </span>
              <h1 className="hp-phero__title">{program.title}</h1>
              <p className="hp-phero__lead">{program.summary}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          {program.body.map((block, bi) => (
            <div className="hp-progblock" key={block.heading}>
              <Reveal>
                <SectionHeader
                  eyebrow={bi === 0 ? 'Overview' : 'Activities'}
                  title={block.heading}
                  tone={program.tone}
                />
              </Reveal>
              <Reveal delay={70}>
                <ul className="hp-ticks hp-ticks--wide">
                  {block.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {photos.length ? (
        <section className="hp-section hp-section--sunken">
          <div className="hp-container">
            <Reveal>
              <SectionHeader
                eyebrow="In the field"
                title="Photos from this program"
                align="center"
                lead="Select any photo for the full-screen viewer - navigate with the arrows, the keyboard, or by swiping."
              />
            </Reveal>
            <Reveal>
              <PhotoGallery photos={photos} title={program.title} columns={3} />
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="hp-section">
        <div className="hp-container">
          <Reveal>
            <SectionHeader
              eyebrow="Take action"
              title="Support this program"
              align="center"
              lead="Every option below feeds the same work."
            />
          </Reveal>
          <div className="hp-grid hp-grid--3">
            <Reveal>
              <article className="hp-act hp-card">
                <div className="hp-card__body">
                  <span className="hp-card__icon hp-card__icon--blue">
                    <Icon name="heart" size={20} />
                  </span>
                  <h3 className="hp-card__title">Donate</h3>
                  <p className="hp-card__text">
                    Fund cargo shipments, surgery, training, and clinic upgrades. 100% of gifts go
                    to the work.
                  </p>
                  <Button modal="donate" variant="sun" full>
                    Donate Now
                  </Button>
                </div>
              </article>
            </Reveal>
            <Reveal delay={80}>
              <article className="hp-act hp-card">
                <div className="hp-card__body">
                  <span className="hp-card__icon hp-card__icon--sun">
                    <Icon name="hands" size={20} />
                  </span>
                  <h3 className="hp-card__title">Get Involved</h3>
                  <p className="hp-card__text">
                    Volunteer in the Philippines or at our US events, join a youth group, or donate
                    artwork.
                  </p>
                  <Button to="/get-involved" variant="outline" full>
                    Get Involved
                  </Button>
                </div>
              </article>
            </Reveal>
            <Reveal delay={160}>
              <article className="hp-act hp-card">
                <div className="hp-card__body">
                  <span className="hp-card__icon hp-card__icon--blue">
                    <Icon name="mail" size={20} />
                  </span>
                  <h3 className="hp-card__title">Contact</h3>
                  <p className="hp-card__text">
                    Ask a question about this program, or reach {org.leadership.name} about a
                    partnership.
                  </p>
                  <Button to="/contact" variant="outline" full>
                    Contact Us
                  </Button>
                </div>
              </article>
            </Reveal>
          </div>
          <Reveal>
            <div className="hp-ftrigger-wrap">
              <FormTriggerCard
                topic="program-question"
                iconName="mail"
                title={`Ask about ${program.title}`}
                lead={`A volunteer will get back to you. For urgent medical mission questions, call or text ${org.phone}. The form opens right here.`}
                cta="Open the question form"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="hp-section hp-section--sunken">
        <div className="hp-container">
          <Reveal>
            <SectionHeader eyebrow="Keep exploring" title="Other programs" align="center" />
          </Reveal>
          <div className="hp-grid hp-grid--3">
            {related.map((p, i) => (
              <Reveal key={p.slug} delay={i * 70}>
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
          <Reveal>
            <Callout tone="sun" title="A note on scope">
              <p>
                We are a small, volunteer-run organization, so we keep our program list to what we
                can actually sustain and account for. If something is not listed here, it is not
                something we are currently running.
              </p>
            </Callout>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

