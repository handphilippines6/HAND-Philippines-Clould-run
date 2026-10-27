import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import Layout from '../components/layout/Layout.jsx';
import RouteSkeleton from '../components/ui/RouteSkeleton.jsx';
import ErrorBoundary from '../components/ui/ErrorBoundary.jsx';
import { queryClient } from '../lib/queryClient.js';

/* Appendix styles (shell integration + responsive + dialog passes) ported
   from model1/hp-styles.js. Imported AFTER the Layout module so they cascade
   after every component stylesheet, exactly like the Wix shadow tree. */
import '../styles/appendix.css';

/* ---- Route-level code splitting (04_FRONTEND §2) ---------------------
   Every top-level route is its own React.lazy chunk. Only the shell
   (header, footer, router, query client) ships in the initial bundle.   */
const Home = lazy(() => import('../pages/Home/index.jsx'));
const WhoWeAre = lazy(() => import('../pages/WhoWeAre/index.jsx'));
const Programs = lazy(() => import('../pages/Programs/index.jsx'));
const ProgramDetail = lazy(() => import('../pages/ProgramDetail/index.jsx'));
const MedicalMission = lazy(() => import('../pages/MedicalMission/index.jsx'));
const Reserve = lazy(() => import('../pages/MedicalMission/Reserve.jsx'));
const AdoptAnIsland = lazy(() => import('../pages/AdoptAnIsland/index.jsx'));
const Events = lazy(() => import('../pages/Events/index.jsx'));
const Gala = lazy(() => import('../pages/Events/Gala.jsx'));
const ArtAmongTheMeadows = lazy(() => import('../pages/Events/ArtAmongTheMeadows.jsx'));
const GetInvolved = lazy(() => import('../pages/GetInvolved/index.jsx'));
const Donate = lazy(() => import('../pages/Donate/index.jsx'));
const Daf = lazy(() => import('../pages/Donate/Daf.jsx'));
const Check = lazy(() => import('../pages/Donate/Check.jsx'));
const Gratitude = lazy(() => import('../pages/Donate/Gratitude.jsx'));
const Contact = lazy(() => import('../pages/Contact/index.jsx'));
const CampaignDetail = lazy(() => import('../pages/CampaignDetail/index.jsx'));
const FundraiserDetail = lazy(() => import('../pages/FundraiserDetail/index.jsx'));
const Apply = lazy(() => import('../pages/Apply/index.jsx'));
const EmilTraining = lazy(() => import('../pages/EmilTraining/index.jsx'));
const NotFound = lazy(() => import('../pages/NotFound/index.jsx'));

/** Portals (auth-gated) — split so no visitor downloads portal code. */
const DonorApp = lazy(() => import('../portals/DonorApp.jsx'));
const FundraiserApp = lazy(() => import('../portals/FundraiserApp.jsx'));
const AdminApp = lazy(() => import('../portals/AdminApp.jsx'));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<RouteSkeleton />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/who-we-are" element={<WhoWeAre />} />
                  <Route path="/programs" element={<Programs />} />
                  <Route path="/programs/:slug" element={<ProgramDetail />} />
                  <Route path="/medical-mission" element={<MedicalMission />} />
                  <Route path="/medical-mission/reserve" element={<Reserve />} />
                  <Route path="/adopt-an-island" element={<AdoptAnIsland />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/gala-and-auction" element={<Gala />} />
                  <Route path="/events/art-among-the-meadows" element={<ArtAmongTheMeadows />} />
                  <Route path="/get-involved" element={<GetInvolved />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/donate/daf" element={<Daf />} />
                  <Route path="/donate/check" element={<Check />} />
                  <Route path="/donate/gratitude/:donationId" element={<Gratitude />} />
                  <Route path="/campaigns/:slug" element={<CampaignDetail />} />
                  <Route path="/fundraisers/:slug" element={<FundraiserDetail />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/training/emil/*" element={<EmilTraining />} />
                  <Route path="/apply" element={<Apply />} />

                  {/* Auth-gated portals — the model1 portal apps */}
                  <Route path="/portal/donor/*" element={<DonorApp />} />
                  <Route path="/donordashboard" element={<DonorApp />} />
                  <Route path="/portal/fundraiser/*" element={<FundraiserApp />} />
                  <Route path="/admin/*" element={<AdminApp />} />
                  <Route path="/portal/partner/*" element={<DonorApp />} />

                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
          </ErrorBoundary>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
