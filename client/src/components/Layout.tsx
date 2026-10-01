import { MessageCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { whatsappHref } from '../lib/site';
import { CookieBanner } from './CookieBanner';
import { Footer } from './Footer';
import { Header } from './Header';
import { OrganizationSchema } from './Seo';

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <OrganizationSchema />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <a
        href={whatsappHref()}
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageCircle size={28} />
      </a>
      <CookieBanner />
    </>
  );
}
