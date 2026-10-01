import { CtaBand, PageBanner, SectionTitle, ServiceCard } from '../components/Blocks';
import { Seo } from '../components/Seo';
import { SERVICES } from '../lib/site';

export default function Services() {
  return (
    <>
      <Seo
        title="Paralegal Services Accra | Legal Documents, Translation & Civil Matters - G|K Ventures"
        description="Paralegal services in Accra: all kinds of legal documents, legal translation and interpretation French-English, and matrimonial and civil issues."
      />
      <PageBanner title="Our Services" crumbs={[{ label: 'Services' }]} />
      <section className="section">
        <div className="container">
          <SectionTitle overline="As Listed on Our Letterhead" title="How we can help">
            Legal documentation, translation/interpretation, and matrimonial &amp; civil support - for individuals and
            businesses, handled with care and confidentiality.
          </SectionTitle>
          <div className="grid grid--3">
            {SERVICES.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
