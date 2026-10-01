import { lazy, ReactNode, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import About from './pages/About';
import Contact from './pages/Contact';
import CourtExperience from './pages/CourtExperience';
import Faq from './pages/Faq';
import Home from './pages/Home';
import { Privacy, Terms } from './pages/Legal';
import NotFound from './pages/NotFound';
import Payment from './pages/Payment';
import PaymentCallback from './pages/PaymentCallback';
import ServiceDetail from './pages/ServiceDetail';
import Services from './pages/Services';
import SignDocument from './pages/SignDocument';
import Team from './pages/Team';

// Loaded on demand: keeps the admin dashboard and PDF.js out of the public bundle.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const SignPortal = lazy(() => import('./pages/SignPortal'));

const OnDemand = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<p className="admin-loading">Loading...</p>}>{children}</Suspense>
);

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <OnDemand>
            <AdminApp />
          </OnDemand>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="about/court-experience" element={<CourtExperience />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:slug" element={<ServiceDetail />} />
        <Route path="sign-a-document" element={<SignDocument />} />
        <Route
          path="sign/:token"
          element={
            <OnDemand>
              <SignPortal />
            </OnDemand>
          }
        />
        <Route path="payment" element={<Payment />} />
        <Route path="payment/callback" element={<PaymentCallback />} />
        <Route path="team" element={<Team />} />
        <Route path="faq" element={<Faq />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy-policy" element={<Privacy />} />
        <Route path="terms-of-use" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
