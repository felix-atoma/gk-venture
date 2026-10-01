# G|K Ventures — kadawalegalservices.com

Commission for Oaths and Paralegal Service in ADR Centre — Under the ADR Act, 2010 (Act 798).

| Part | Stack |
| --- | --- |
| `client/` | React 19 + Vite 7 + TypeScript + React Router 7 |
| `server/` | NestJS 11 + Prisma 6 + PostgreSQL |

Layout modelled on the Colorlib **PrimeLaw** template structure (top bar, sticky nav with dropdowns, hero with CTA,
practice-area cards, highlights band, process steps, team, CTA band, multi-column footer), rebuilt from scratch in
React with the G|K navy/gold palette. No Colorlib code or assets are included.

## Features

- Pages: Home, About, Court Experience gallery, Services (+3 service pages), Sign a Document, Make a Payment, Team, FAQ, Contact, Privacy Policy, Terms of Use
- **Inquiry form** with file upload (PDF/Word/JPG/PNG, 3 × 10 MB), honeypot + optional Cloudflare Turnstile CAPTCHA, rate limiting, emails to office + client confirmation
- **Payments** via Paystack (GHS, mobile money + card): server-side verification, HMAC-verified webhook, amount tamper check, emailed receipts
- **E-signature portal** (built in, no third-party subscription): admin uploads PDF → signer gets a single-use, expiring link → reviews, consents, draws signature → server stamps every page and appends a *Certificate of Electronic Signature* (IP, browser, timestamps, SHA-256 of original) → signed copy emailed to both parties
- **Encrypted storage** (AES-256-GCM) for all uploads and signed documents, with integrity check on read
- **Audit trail** for logins, inquiries, downloads, signing events, payments, content changes
- **Admin dashboard** at `/admin`: inquiries, payments, e-signing, editable site content, court gallery (with clearance reminder), password change
- SEO: per-page titles/descriptions mapped to the brief's keywords, canonical URLs, `LegalService`/`LocalBusiness` + `FAQPage` JSON-LD, sitemap.xml, robots.txt
- Accessibility: text-size controls, high-contrast mode, skip link, keyboard-friendly nav, reduced-motion support
- Act 843: cookie consent banner; Google Maps only loads after consent
- WhatsApp click-to-chat (floating button + CTAs)

## Local development

Prereqs: Node 20.19+ / 22.12+, PostgreSQL.

```bash
npm run install:all                 # root + server + client
cp server/.env.example server/.env  # then fill in values (see below)
npm run db:setup                    # migrate + create first admin
npm run dev                         # API :3000, web :5173
```

Admin: http://localhost:5173/admin — log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then change the password under **Account**.

Without `SMTP_HOST`, emails (including signing links) are printed in the API console.

### Environment (`server/.env`)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | long random string |
| `FILE_ENCRYPTION_KEY` | 32 bytes base64. **Back it up; never change it** — stored files become unreadable |
| `FRONTEND_URL` / `CORS_ORIGINS` | `https://kadawalegalservices.com` in production |
| `SMTP_*`, `MAIL_FROM`, `NOTIFY_EMAIL` | e.g. Google Workspace, Zoho, Brevo, Mailgun |
| `PAYSTACK_SECRET_KEY` | Paystack dashboard → Settings → API Keys. Payment page shows a "being set up" notice until set |
| `TURNSTILE_SECRET_KEY` | optional; pair with `VITE_TURNSTILE_SITE_KEY` in `client/.env` |

## Content the client still needs to supply

Drop files into `client/public/` (the site falls back gracefully until then):

- `logo.png` (navy logo for white header) and `logo-light.png` (for dark footer/admin) — replaces the typographic wordmark
- `images/hero.jpg`, `images/banner.jpg`, `images/about.jpg`, `images/founder.jpg`, `images/team-ceo.jpg` (+ `team-secretary.jpg`, `team-messenger.jpg`)
- Court photos → upload in **Admin → Court Gallery** (confirm clearance; no identifiable parties, witnesses or minors)
- Business hours and exact office location → **Admin → Site Content**
- `og-image.png` (1200×630) for social sharing, then add `<meta property="og:image">` in `client/index.html`

## Production deployment (outline)

1. VPS (e.g. DigitalOcean/Hetzner) or Render/Railway + managed PostgreSQL.
2. `npm run build`; run `server` with `npm --prefix server run db:deploy && node server/dist/main.js` under pm2/systemd.
3. Serve `client/dist` with Nginx (SPA fallback `try_files $uri /index.html`) and proxy `/api` and `/uploads` to `localhost:3000`.
4. Point `kadawalegalservices.com` DNS to the server; HTTPS with Let's Encrypt (certbot).
5. Paystack dashboard → Webhook URL: `https://kadawalegalservices.com/api/payments/webhook`; switch to live keys.
6. Back up the database **and** `server/uploads/` **and** `FILE_ENCRYPTION_KEY`.

## Compliance checklist (brief section 9)

- [ ] Register G|K Ventures as a Data Controller with the Data Protection Commission (Act 843) before launch; renew every 2 years
- [ ] Have the draft Privacy Policy and Terms of Use reviewed and finalised (`client/src/pages/Legal.tsx`)
- [ ] Confirm which documents may lawfully be signed electronically (Electronic Transactions Act, 2008 (Act 772)); affidavits and other sworn/attested documents stay in person
- [x] Cookie consent, CAPTCHA option, encrypted storage + audit trail, Schema.org markup
