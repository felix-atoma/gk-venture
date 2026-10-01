import { Award, Gavel, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CtaBand, PageBanner, SectionTitle } from '../components/Blocks';
import { ScalesMark } from '../components/Logo';
import { Seo } from '../components/Seo';
import { useText } from '../lib/content';

const CREDENTIALS = [
  { icon: Award, title: 'ADR Act, 2010 (Act 798)', text: 'Commission for Oaths and Paralegal Service operating through an Alternative Dispute Resolution (ADR) Centre under the ADR Act, 2010 (Act 798).' },
  { icon: Gavel, title: 'Commissioner for Oaths', text: 'Authorized to administer oaths and attest affidavits and other legal documents.' },
  { icon: Languages, title: 'Court Interpreter', text: "Direct experience interpreting for parties, witnesses and the bench in Ghana's courts." },
];

export default function About() {
  const t = useText();
  return (
    <>
      <Seo
        title="About G|K Ventures | ADR Centre Accra & Commissioner for Oaths"
        description="G|K Ventures, led by Gilbert K. Kadawa, provides Commission for Oaths and paralegal services through its ADR Centre in Accra under the ADR Act, 2010 (Act 798)."
      />
      <PageBanner title="About Us" crumbs={[{ label: 'About Us' }]} />

      <section className="section">
        <div className="container split">
          <div>
            <SectionTitle overline="Who We Are" title="Commission for Oaths & Paralegal Service in ADR Centre" />
            <p>{t('about.intro')}</p>
            <p>{t('about.languages')}</p>
            <h3 className="h-sub">Our Founder</h3>
            <p>{t('about.founder')}</p>
            <div className="btn-row">
              <Link to="/about/court-experience" className="btn btn--navy">
                View Court Experience
              </Link>
              <Link to="/team" className="btn btn--outline">
                Meet the Team
              </Link>
            </div>
          </div>
          <div className="split__media">
            <div className="media-frame media-frame--portrait">
              <img src="/images/founder.jpg" alt="Gilbert K. Kadawa" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <div className="media-frame__fallback" aria-hidden="true">
                <ScalesMark size={140} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionTitle overline="Credentials" title="An authorized, experienced provider" />
          <div className="grid grid--3">
            {CREDENTIALS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card card--center">
                <span className="feature__icon">
                  <Icon size={28} strokeWidth={1.5} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
