export const SITE = {
  name: 'G|K Ventures',
  legalName: 'G|K Ventures - Commission for Oaths and Paralegal Service in ADR Centre',
  tagline: 'Commission for Oaths and Paralegal Service in Alternative Dispute Resolution (ADR) Centre',
  act: 'Under the ADR Act, 2010 (Act 798)',
  /**
   * The site's public address: canonical links, sitemap, robots.txt and share previews all use it.
   * Switch to https://kadawalegalservices.com (here, or via VITE_SITE_URL on Vercel) once that domain is live.
   */
  url: ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://gk-ventures.vercel.app').replace(/\/$/, ''),
  address: 'P. O. Box AN 5765, Accra-North, Ghana',
  phones: ['+233 545 032 058', '+233 544 997 355'],
  email: 'gilbertadawa@gmail.com',
  whatsapp: '233545032058',
  founder: 'Gilbert K. Kadawa',
};

export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, '')}`;
export const whatsappHref = (text = 'Hello G|K Ventures, I would like to make an inquiry.') =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

export type ServiceType =
  | 'LEGAL_DOCUMENTS'
  | 'TRANSLATION_INTERPRETATION'
  | 'MATRIMONIAL_CIVIL'
  | 'CONSULTATION'
  | 'OTHER';

export const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'LEGAL_DOCUMENTS', label: 'All Kinds of Legal Documents' },
  { value: 'TRANSLATION_INTERPRETATION', label: 'Legal Translation / Interpretation' },
  { value: 'MATRIMONIAL_CIVIL', label: 'Matrimonial and Civil Issues' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'OTHER', label: 'Other' },
];

export interface ServiceInfo {
  slug: string;
  type: ServiceType;
  title: string;
  short: string;
  summary: string;
  intro: string;
  items: string[];
  outro: string;
  cta: { label: string; to: string };
  seo: { title: string; description: string };
  icon: 'file' | 'languages' | 'scale';
}

export const SERVICES: ServiceInfo[] = [
  {
    slug: 'legal-documents',
    type: 'LEGAL_DOCUMENTS',
    title: 'All Kinds of Legal Documents',
    short: 'Legal Documents',
    summary: 'Affidavits, Attestation, Gazette, Agreements, etc.',
    intro: 'We are authorized to administer oaths and handle all kinds of legal documents, including:',
    items: [
      'Affidavits',
      'Attestation',
      'Gazette notifications',
      'Agreements',
      'Letters of Administration (L.A.)',
      'Wills, etc.',
    ],
    outro:
      'Book a session online or visit our office. Payment can be made securely online, and select documents can be signed electronically once notarization requirements are met.',
    cta: { label: 'Book a Session', to: '/contact?service=LEGAL_DOCUMENTS' },
    seo: {
      title: 'Affidavit & Attestation Services Accra | Commissioner for Oaths - G|K Ventures',
      description:
        'Affidavit and attestation services in Accra. Commissioner for Oaths for gazette notifications, agreements, letters of administration and wills in Accra North, Ghana.',
    },
    icon: 'file',
  },
  {
    slug: 'translation-interpretation',
    type: 'TRANSLATION_INTERPRETATION',
    title: 'Legal Translation / Interpretation',
    short: 'Translation / Interpretation',
    summary: 'French-English (Vice-Versa)',
    intro: 'We provide certified legal translation and interpretation, French-English (Vice-Versa), including:',
    items: [
      'Translation of legal documents between English and French',
      'Court hearing interpretation in English, French, Twi, Ga, and Hausa - delivered by an interpreter with direct courtroom experience',
    ],
    outro: 'Upload your document for a quote, or book an interpreter for an upcoming hearing.',
    cta: { label: 'Upload a Document for a Quote', to: '/contact?service=TRANSLATION_INTERPRETATION' },
    seo: {
      title: 'Legal Translation Ghana | French to English Legal Translator Accra - G|K Ventures',
      description:
        'Certified French to English legal translation in Ghana and court interpreter services in Twi, Ga and Hausa, from an interpreter with direct courtroom experience in Accra.',
    },
    icon: 'languages',
  },
  {
    slug: 'matrimonial-civil',
    type: 'MATRIMONIAL_CIVIL',
    title: 'Matrimonial and Civil Issues',
    short: 'Matrimonial & Civil',
    summary: 'Divorce Petition, Child Custody Application, Landlord & Tenant Issues, etc.',
    intro: 'We provide practical paralegal support for matrimonial and civil matters, including:',
    items: [
      'Divorce Petition',
      'Child Custody Application',
      'Landlord & Tenant Issues',
      'District Court Writ of Summons',
      'Maintenance',
      'Court motions and applications',
      'Mediation and arbitration between parties, etc.',
    ],
    outro: 'Submit an inquiry describing your matter, and our team will advise on next steps.',
    cta: { label: 'Submit an Inquiry', to: '/contact?service=MATRIMONIAL_CIVIL' },
    seo: {
      title: 'Divorce Petition & Child Custody Application Ghana | Paralegal Accra - G|K Ventures',
      description:
        'Paralegal support in Accra for divorce petitions, child custody applications, landlord and tenant disputes in Ghana, maintenance, writs of summons, mediation and arbitration.',
    },
    icon: 'scale',
  },
];

export const NAV = [
  { label: 'Home', to: '/' },
  {
    label: 'About Us',
    to: '/about',
    children: [
      { label: 'About G|K Ventures', to: '/about' },
      { label: 'Court Experience', to: '/about/court-experience' },
      { label: 'Our Team', to: '/team' },
    ],
  },
  {
    label: 'Services',
    to: '/services',
    children: SERVICES.map((s) => ({ label: s.title, to: `/services/${s.slug}` })),
  },
  { label: 'Sign a Document', to: '/sign-a-document' },
  { label: 'Make a Payment', to: '/payment' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
];
