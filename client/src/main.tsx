import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ContentProvider } from './lib/content';
import './styles/global.css';

// Pre-rendered pages (see scripts/prerender.mjs) carry their own <title>/meta for search engines.
// The app renders those itself, so drop the static copies to avoid duplicates.
document.querySelectorAll('[data-prerender]').forEach((el) => el.remove());

// createRoot replaces the pre-rendered markup with the live app.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <App />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
);
