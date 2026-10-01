// Writes static HTML for each public page so search engines see full content, titles and meta tags.
// Runs after `vite build` and the SSR build of src/entry-server.tsx (see package.json "build").
//
// Optional: PRERENDER_API_URL=https://kadawalegalservices.com bakes in the wording edited in the admin.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = path.resolve('dist');
const ssrEntry = path.resolve('dist-ssr/entry-server.js');

const ROUTES = [
  '/',
  '/about',
  '/about/court-experience',
  '/services',
  '/services/legal-documents',
  '/services/translation-interpretation',
  '/services/matrimonial-civil',
  '/sign-a-document',
  '/payment',
  '/team',
  '/faq',
  '/contact',
  '/privacy-policy',
  '/terms-of-use',
];

// Tags React renders inside components that belong in <head>.
const HEAD_TAG =
  /<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel="canonical"[^>]*>|<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g;

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(ssrEntry).href);

let content = {};
if (process.env.PRERENDER_API_URL) {
  try {
    const res = await fetch(`${process.env.PRERENDER_API_URL.replace(/\/$/, '')}/api/content`);
    if (res.ok) content = await res.json();
    console.log(`prerender: using ${Object.keys(content).length} edited content blocks`);
  } catch {
    console.warn('prerender: could not reach PRERENDER_API_URL, using default wording');
  }
}

// Untouched SPA shell for routes that are not pre-rendered (/admin, /sign/:token, /payment/callback, 404s).
fs.writeFileSync(path.join(dist, 'app.html'), template);

for (const route of ROUTES) {
  const head = [];
  const body = render(route, content).replace(HEAD_TAG, (tag) => {
    head.push(tag.replace(/^<(\w+)/, '<$1 data-prerender=""'));
    return '';
  });
  const html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace('</head>', `    ${head.join('\n    ')}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(html)?.[1];
  console.log(`prerender: ${route.padEnd(38)} ${title}`);
}

fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true });
