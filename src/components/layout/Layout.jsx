import Header from './Header.jsx';
import Footer from './Footer.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import ModalProvider from '../ui/ModalProvider.jsx';
import './Layout.css';

/**
 * App shell: header + main + footer, with the single dialog host wrapped
 * around everything (model1: one modal layer for the whole shell, so the
 * header, the drawer, the footer and every view open the same dialogs).
 * Only this ships in the initial bundle.
 */
export default function Layout({ children }) {
  return (
    <ModalProvider>
      <div className="hp-app">
        <a className="hp-skip-link" href="#main">
          Skip to main content
        </a>
        <ScrollToTop />
        <Header />
        <main id="main" className="hp-main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
    </ModalProvider>
  );
}

