import { useLocation } from 'react-router-dom';
import { SERVICES, ServiceInfo, SITE } from '../lib/site';

interface Props {
  title: string;
  description: string;
  noindex?: boolean;
  /** Share-preview image, path under public/ (defaults to the courtroom certificate photo). */
  image?: string;
}

const DEFAULT_IMAGE = '/images/certificate-presentation.jpg';

const absolute = (path: string) => `${SITE.url}${path}`;

/** React 19 hoists these tags into <head>. */
export function Seo({ title, description, noindex, image = DEFAULT_IMAGE }: Props) {
  const { pathname } = useLocation();
  const url = `${SITE.url}${pathname === '/' ? '' : pathname}`;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absolute(image)} />
      <meta property="og:locale" content="en_GH" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absolute(image)} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </>
  );
}

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** Schema.org LegalService / LocalBusiness markup (brief section 9). */
export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': ['LegalService', 'LocalBusiness'],
        '@id': `${SITE.url}/#business`,
        name: SITE.name,
        alternateName: SITE.legalName,
        description: `${SITE.tagline}. ${SITE.act}.`,
        url: SITE.url,
        logo: absolute('/favicon.svg'),
        image: [absolute('/images/about.jpg'), absolute(DEFAULT_IMAGE)],
        email: SITE.email,
        telephone: SITE.phones,
        founder: { '@type': 'Person', name: SITE.founder, jobTitle: 'Commissioner for Oaths, Legal Translator/Interpreter' },
        address: {
          '@type': 'PostalAddress',
          postOfficeBoxNumber: 'AN 5765',
          addressLocality: 'Accra-North',
          addressRegion: 'Greater Accra',
          addressCountry: 'GH',
        },
        areaServed: [
          { '@type': 'City', name: 'Accra' },
          { '@type': 'Country', name: 'Ghana' },
        ],
        knowsLanguage: ['en', 'fr', 'tw', 'gaa', 'ha'],
        paymentAccepted: ['Mobile Money', 'Card'],
        currenciesAccepted: 'GHS',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Legal services',
          itemListElement: SERVICES.map((s) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: s.title, url: `${SITE.url}/services/${s.slug}` },
          })),
        },
      }}
    />
  );
}

/** Breadcrumb trail for search results ("Home > Services > ..."). */
export function BreadcrumbSchema({ crumbs }: { crumbs: { label: string; to?: string }[] }) {
  const { pathname } = useLocation();
  const items = [{ label: 'Home', to: '/' }, ...crumbs.map((c) => ({ label: c.label, to: c.to ?? pathname }))];
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.label,
          item: `${SITE.url}${c.to === '/' ? '' : c.to}`,
        })),
      }}
    />
  );
}

/** One service, linked to the business, on its service page. */
export function ServiceSchema({ service }: { service: ServiceInfo }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.title,
        serviceType: service.short,
        description: service.seo.description,
        url: `${SITE.url}/services/${service.slug}`,
        provider: { '@id': `${SITE.url}/#business` },
        areaServed: { '@type': 'Country', name: 'Ghana' },
      }}
    />
  );
}
