import { Analytics } from '@vercel/analytics/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ContentProvider } from './lib/content';
import './styles/global.css';

// Pre-rendered pages (see scripts/prerender.mjs) carry their own <title>/meta for search engines.
// The app renders those itself, so drop the static copies to avoid duplicates.
document.querySelectorAll('[data-prerender]').forEach((el) => el.remove());

// Visitor statistics (Vercel Web Analytics, cookie-free). Staff pages and signing links - whose URLs carry
// private tokens - are never reported.
const untracked = /^\/(admin|sign\/)/;

// createRoot replaces the pre-rendered markup with the live app.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <App />
      </ContentProvider>
    </BrowserRouter>
    <Analytics beforeSend={(e) => (untracked.test(new URL(e.url).pathname) ? null : { ...e, url: e.url.split('?')[0] })} />
  </StrictMode>,
);
