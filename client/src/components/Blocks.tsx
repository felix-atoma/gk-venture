import { FileText, Languages, MessageCircle, Phone, Scale } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useText } from '../lib/content';
import { ServiceInfo, SITE, telHref, whatsappHref } from '../lib/site';

export function SectionTitle({ overline, title, children, light }: { overline: string; title: string; children?: ReactNode; light?: boolean }) {
  return (
    <div className={`section-title ${light ? 'section-title--light' : ''}`}>
      <span className="overline">{overline}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Inner-page banner with breadcrumb, as on PrimeLaw sub-pages. */
export function PageBanner({ title, crumbs }: { title: string; crumbs: { label: string; to?: string }[] }) {
  return (
    <section className="page-banner">
      <div className="container">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link to="/">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label}>
              <span aria-hidden="true"> / </span>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </span>
          ))}
        </nav>
        <h1>{title}</h1>
      </div>
    </section>
  );
}

export function ServiceIcon({ icon, size = 36 }: { icon: ServiceInfo['icon']; size?: number }) {
  const Icon = { file: FileText, languages: Languages, scale: Scale }[icon];
  return <Icon size={size} strokeWidth={1.5} />;
}

export function ServiceCard({ service }: { service: ServiceInfo }) {
  return (
    <Link to={`/services/${service.slug}`} className="service-card">
      <span className="service-card__icon">
        <ServiceIcon icon={service.icon} />
      </span>
      <h3>{service.title}</h3>
      <p>{service.summary}</p>
      <span className="link-arrow">Learn more &rarr;</span>
    </Link>
  );
}

export function CtaBand() {
  const t = useText();
  return (
    <section className="cta-band">
      <div className="container cta-band__inner">
        <h2>{t('home.closing.text')}</h2>
        <div className="btn-row">
          <Link to="/contact" className="btn btn--navy">
            Book a Consultation
          </Link>
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn--outline-navy">
            <MessageCircle size={18} /> Chat with Us on WhatsApp
          </a>
          <a href={telHref(SITE.phones[0])} className="btn btn--outline-navy">
            <Phone size={18} /> Call
          </a>
        </div>
      </div>
    </section>
  );
}

export function Alert({ kind, children }: { kind: 'success' | 'error' | 'info'; children: ReactNode }) {
  return (
    <div className={`alert alert--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
