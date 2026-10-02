import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { ContentProvider } from './lib/content';

export { SITE } from './lib/site';

/** Used at build time by scripts/prerender.mjs to produce static HTML for public pages. */
export function render(url: string, content: Record<string, string>) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <ContentProvider initial={content}>
          <App />
        </ContentProvider>
      </StaticRouter>
    </StrictMode>,
  );
}
