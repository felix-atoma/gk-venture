import { CheckCircle2, ClipboardList, CreditCard, FileSignature, MessageCircle, Wallet } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { CtaBand, PageBanner, ServiceIcon } from '../components/Blocks';
import { InquiryForm } from '../components/InquiryForm';
import { Seo } from '../components/Seo';
import { ContentKey, useText } from '../lib/content';
import { SERVICES, whatsappHref } from '../lib/site';
import NotFound from './NotFound';

/** Fees and "what to bring" lists, edited under Site Content; each box is hidden while empty. */
function ServiceInfoBoxes({ slug }: { slug: string }) {
  const t = useText();
  const boxes = [
    { title: 'Fees', icon: Wallet, text: t(`service.${slug}.fees` as ContentKey) },
    { title: 'What to bring', icon: ClipboardList, text: t(`service.${slug}.bring` as ContentKey) },
  ].filter((b) => b.text?.trim());
  if (boxes.length === 0) return null;
  return (
    <div className="info-boxes">
      {boxes.map(({ title, icon: Icon, text }) => (
        <div key={title} className="info-box">
          <h3>
            <Icon size={20} /> {title}
          </h3>
          <ul>
            {text
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => (
                <li key={line}>{line}</li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return <NotFound />;

  return (
    <>
      <Seo title={service.seo.title} description={service.seo.description} />
      <PageBanner title={service.title} crumbs={[{ label: 'Services', to: '/services' }, { label: service.title }]} />
      <section className="section">
        <div className="container with-sidebar">
          <article>
            <span className="service-card__icon">
              <ServiceIcon icon={service.icon} size={40} />
            </span>
            <h2 className="h-section">{service.title}</h2>
            <p className="lead">{service.intro}</p>
            <ul className="check-list">
              {service.items.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={20} /> {item}
                </li>
              ))}
            </ul>
            <p>{service.outro}</p>
            <ServiceInfoBoxes slug={service.slug} />
            <div className="btn-row">
              <Link to={service.cta.to} className="btn btn--gold">
                {service.cta.label}
              </Link>
              <a href={whatsappHref(`Hello G|K Ventures, I need help with ${service.title}.`)} target="_blank" rel="noopener noreferrer" className="btn btn--outline">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>

            <div className="panel">
              <h3>Send us your request</h3>
              <InquiryForm defaultService={service.type} />
            </div>
          </article>

          <aside className="sidebar">
            <div className="sidebar__box">
              <h4>Our Services</h4>
              <ul>
                {SERVICES.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/services/${s.slug}`} className={s.slug === service.slug ? 'active' : ''}>
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sidebar__box sidebar__box--navy">
              <h4>Online Services</h4>
              <Link to="/payment" className="btn btn--gold btn--block">
                <CreditCard size={16} /> Make a Payment
              </Link>
              <Link to="/sign-a-document" className="btn btn--outline-light btn--block">
                <FileSignature size={16} /> Sign a Document
              </Link>
            </div>
          </aside>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
