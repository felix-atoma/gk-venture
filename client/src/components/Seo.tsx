import { useLocation } from 'react-router-dom';
import { SITE } from '../lib/site';

interface Props {
  title: string;
  description: string;
  noindex?: boolean;
}

/** React 19 hoists these tags into <head>. */
export function Seo({ title, description, noindex }: Props) {
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
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </>
  );
}

/** Schema.org LegalService / LocalBusiness markup (brief section 9). */
export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': ['LegalService', 'LocalBusiness'],
    name: SITE.name,
    alternateName: SITE.legalName,
    description: `${SITE.tagline}. ${SITE.act}.`,
    url: SITE.url,
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
    areaServed: { '@type': 'Country', name: 'Ghana' },
    knowsLanguage: ['en', 'fr', 'tw', 'gaa', 'ha'],
    paymentAccepted: ['Mobile Money', 'Card'],
    currenciesAccepted: 'GHS',
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
