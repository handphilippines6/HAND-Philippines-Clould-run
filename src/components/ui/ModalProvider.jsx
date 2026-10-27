import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import ContactForm from '../../features/contact-form/ContactForm.jsx';
import DonationPanel from '../../features/donate/DonationPanel.jsx';
import GivingSideCards from './GivingSideCards.jsx';
import { inquiryTopics } from '../../data/content.js';

/**
 * ModalProvider — the shell's single dialog host (port of the model1
 * createModalLayer + builders).
 *
 * The header, the drawer, the footer and every view open the same dialogs
 * through useModal(), so no view carries dialog markup and the purpose always
 * travels with the button:
 *
 *   open('inquiry', { topic: 'reserve-2027' })  -> the shared contact form,
 *     labelled by the inquiryTopics entry the button chose.
 *   open('donate')                              -> the giving dialog: donation
 *     panel on the left, DAF + mail-a-check routes on the right.
 *
 * Backdrop, close button and Escape dismiss; body scroll locks; focus moves
 * into the dialog (first field when there is one) and returns to the trigger;
 * Tab is trapped inside.
 */
const ModalContext = createContext(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>.');
  return ctx;
}

let seq = 0;

export default function ModalProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { name, ctx, seq }
  const [openClass, setOpenClass] = useState(false);
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const savedOverflow = useRef('');

  const close = useCallback(() => setDialog(null), []);

  const open = useCallback((name, ctx = {}) => {
    openerRef.current =
      ctx.opener || (document.activeElement instanceof Element ? document.activeElement : null);
    setDialog({ name, ctx, seq: ++seq });
  }, []);

  /* Body scroll lock + open transition + focus management. */
  useEffect(() => {
    if (!dialog) return undefined;
    savedOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => setOpenClass(true));

    /* Land on the first real field: inside a dialog that is what the visitor
       came for, and it keeps the flow keyboard-first. Radios and checkboxes are
       skipped so focus never lands on an invisible control. */
    const field = panelRef.current?.querySelector(
      'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea',
    );
    const firstNode = field || panelRef.current?.querySelector('.hp-modal__panel');
    if (firstNode) {
      if (firstNode.classList.contains('hp-modal__panel')) firstNode.tabIndex = -1;
      firstNode.focus({ preventScroll: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = savedOverflow.current;
      setOpenClass(false);
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus({ preventScroll: true });
      }
      openerRef.current = null;
    };
  }, [dialog]);

  /* Escape closes; Tab is trapped. */
  useEffect(() => {
    if (!dialog) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dialog, close]);

  const value = useMemo(
    () => ({ open, close, isOpen: () => Boolean(dialog) }),
    [open, close, dialog],
  );

  /* ---- Builders (name -> { bare, size, eyebrow, title, lead, content }) --- */
  const spec = useMemo(() => {
    if (!dialog) return null;
    const { name, ctx } = dialog;
    if (name === 'inquiry') {
      const topic = inquiryTopics[ctx.topic] || inquiryTopics.general;
      if (!topic) return null;
      return {
        eyebrow: topic.eyebrow || '',
        title: topic.title || 'Get in touch',
        lead: topic.lead || '',
        content: (
          <ContactForm
            lane={topic.lane || 'contact'}
            type={topic.type || 'General Inquiry'}
            typeLabel={topic.typeLabel || 'General inquiry'}
            headless
            subjectValue={topic.typeLabel || topic.title || 'Website inquiry'}
            presets={topic.presets || []}
            showTypeSelect={Boolean(topic.showTypeSelect && topic.presets && topic.presets.length)}
            submitLabel={topic.submitLabel || 'Send message'}
            source={topic.source || 'modal'}
            compact
          />
        ),
      };
    }
    if (name === 'donate') {
      /* No modal header: the surface opens straight onto the giving panel,
         with the title and lead as its first line of content and the floating
         close control over it. */
      return {
        bare: true,
        size: 'standard',
        title: 'Make a gift',
        content: (
          <div className="hp-donate">
            <div className="hp-donate__intro">
              <h2 className="hp-donate__title">Make a gift</h2>
              <p className="hp-donate__lead">
                Give securely in under a minute, or use one of the two routes on the right.
              </p>
            </div>
            <div className="hp-donatemodal">
              <div className="hp-donatemodal__main">
                <DonationPanel inDialog />
              </div>
              <aside className="hp-donatemodal__side">
                <GivingSideCards />
              </aside>
            </div>
          </div>
        ),
      };
    }
    return null;
  }, [dialog]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {spec
        ? createPortal(
            <div className={`hp-modal${openClass ? ' is-open' : ''}`} data-modal-name={dialog.name}>
              <div className="hp-modal__scrim" onClick={close} aria-hidden="true" />
              <div
                ref={panelRef}
                className={`hp-modal__panel${
                  spec.size === 'standard'
                    ? ' hp-modal__panel--standard'
                    : spec.size === 'wide'
                      ? ' hp-modal__panel--wide'
                      : ''
                }`}
                role="dialog"
                aria-modal="true"
                {...(spec.bare
                  ? { 'aria-label': spec.title || 'Form' }
                  : { 'aria-labelledby': `hp-modal-title-${dialog.seq}` })}
              >
                <span className="hp-modal__rule" aria-hidden="true" />
                {spec.bare ? (
                  <button
                    type="button"
                    className="hp-modal__close hp-modal__close--float"
                    onClick={close}
                    aria-label="Close this window"
                  >
                    <Icon name="close" size={20} />
                  </button>
                ) : (
                  <header className="hp-modal__head">
                    <div className="hp-modal__heading">
                      {spec.eyebrow ? (
                        <span className="hp-modal__badge">
                          <Icon name="mail" size={13} />
                          <span>{spec.eyebrow}</span>
                        </span>
                      ) : null}
                      <h2 className="hp-modal__title" id={`hp-modal-title-${dialog.seq}`}>
                        {spec.title || 'Get in touch'}
                      </h2>
                      {spec.lead ? <p className="hp-modal__lead">{spec.lead}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="hp-modal__close"
                      onClick={close}
                      aria-label="Close this window"
                    >
                      <Icon name="close" size={20} />
                    </button>
                  </header>
                )}
                <div className="hp-modal__body">{spec.content}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ModalContext.Provider>
  );
}
