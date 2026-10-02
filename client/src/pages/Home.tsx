import { BadgeCheck, CreditCard, FileSignature, Gavel, Languages, MessageCircle, MessagesSquare, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CtaBand, SectionTitle, ServiceCard } from '../components/Blocks';
import { ScalesMark } from '../components/Logo';
import { Seo } from '../components/Seo';
import { Testimonials } from '../components/Testimonials';
import { useText } from '../lib/content';
import { SERVICES, SITE, whatsappHref } from '../lib/site';

const WHY = [
  { icon: BadgeCheck, title: 'Registered under Act 798', text: 'Registered Commission for Oaths and Paralegal Service operating under the ADR Act, 2010 (Act 798).' },
  { icon: Gavel, title: 'Courtroom Experience', text: "Hands-on experience with Ghana's court system, gained from working as a court interpreter." },
  { icon: Languages, title: 'Bilingual Legal Support', text: 'English and French, with interpretation support in Twi, Ga, and Hausa.' },
  { icon: FileSignature, title: 'Secure Online Signing', text: 'Review and sign eligible documents online through a secure, logged link.' },
  { icon: CreditCard, title: 'Convenient Online Payment', text: 'Pay for services securely with mobile money or card.' },
  { icon: MessagesSquare, title: 'Fast Response', text: 'Reach us quickly via WhatsApp and online inquiry.' },
];

const HIGHLIGHTS = [
  { value: 'Act 798', label: 'ADR Act, 2010' },
  { value: '5', label: 'Languages served' },
  { value: '3', label: 'Core practice areas' },
  { value: '24/7', label: 'Online inquiry & payment' },
];

const PROCESS = [
  { icon: Search, title: 'Tell Us About Your Matter', text: 'Submit an inquiry, chat on WhatsApp, or visit our office. Attach any documents you already have.' },
  { icon: ShieldCheck, title: 'We Review & Advise', text: 'We review your matter in confidence, explain what is required, and prepare or translate your documents.' },
  { icon: FileSignature, title: 'Sign, Pay & Complete', text: 'Oaths are administered, documents finalised, and eligible documents signed online. Pay securely online.' },
];

const HIGHLIGHT_PHOTOS = [
  {
    src: '/images/certificate-presentation.jpg',
    alt: 'Gilbert K. Kadawa receiving a certificate in a courtroom',
    caption: 'Certificate presentation in court',
    position: 'center 30%',
    wide: true,
  },
  {
    src: '/images/memorial.jpg',
    alt: 'Martyrs of the Rule of Law monument at the Supreme Court of Ghana, Accra',
    caption: 'Martyrs of the Rule of Law monument, Supreme Court of Ghana',
    position: 'center',
  },
  {
    src: '/images/adr-graduation.jpg',
    alt: 'Graduates and guests at the ADR and Paralegal Studies graduation ceremony',
    caption: 'ADR & Paralegal Studies graduation, ISSER, University of Ghana - July 2026',
    position: 'center 35%',
    wide: true,
  },
];

export default function Home() {
  const t = useText();
  return (
    <>
      <Seo
        title="Commissioner for Oaths Accra | ADR Centre & Paralegal Services - G|K Ventures"
        description="G|K Ventures - Commissioner for Oaths and paralegal services in Accra under the ADR Act, 2010 (Act 798). Affidavits, legal translation French-English, divorce, custody and ADR centre services."
      />

      <section className="hero">
        <div className="hero__watermark" aria-hidden="true">
          <ScalesMark size={520} />
        </div>
        <div className="container hero__inner">
          <span className="overline overline--light">G|K Ventures &middot; {SITE.act}</span>
          <h1>{t('home.hero.headline')}</h1>
          <p className="hero__sub">{t('home.hero.subheadline')}</p>
          <div className="btn-row">
            <Link to="/contact" className="btn btn--gold btn--lg">
              Book a Consultation
            </Link>
            <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn--outline-light btn--lg">
              <MessageCircle size={18} /> Chat with Us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="section section--overlap">
        <div className="container">
          <div className="grid grid--3">
            {SERVICES.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="split__media">
            <div className="media-frame media-frame--portrait">
              <img src="/images/about.jpg" alt="Gilbert K. Kadawa, C.E.O of G|K Ventures" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <div className="media-frame__fallback" aria-hidden="true">
                <ScalesMark size={140} />
              </div>
              <div className="media-frame__caption">
                <strong>{SITE.founder}</strong>
                <span>C.E.O &middot; Commissioner for Oaths &middot; Court Interpreter</span>
              </div>
            </div>
          </div>
          <div>
            <SectionTitle overline="About G|K Ventures" title="Experience from inside Ghana's courtrooms" />
            <p>{t('about.intro')}</p>
            <p>{t('about.languages')}</p>
            <div className="btn-row">
              <Link to="/about" className="btn btn--navy">
                Learn More
              </Link>
              <Link to="/about/court-experience" className="btn btn--outline">
                Court Experience
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container grid grid--4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="stat">
              <strong>{h.value}</strong>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionTitle overline="Why Choose Us" title="Authorized, experienced and easy to reach" />
          <div className="grid grid--3">
            {WHY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="feature">
                <span className="feature__icon">
                  <Icon size={26} strokeWidth={1.6} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionTitle overline="Court Experience" title="Experience that comes from inside the courtroom">
            {t('gallery.intro')}
          </SectionTitle>
          <div className="photo-strip">
            {HIGHLIGHT_PHOTOS.map((p) => (
              <figure key={p.src} className={`photo-strip__item ${p.wide ? 'photo-strip__item--wide' : ''}`}>
                <img src={p.src} alt={p.alt} loading="lazy" style={{ objectPosition: p.position }} />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="center">
            <Link to="/about/court-experience" className="btn btn--outline">
              View Court Experience Gallery
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionTitle overline="How It Works" title="Our working process" />
          <div className="grid grid--3 process">
            {PROCESS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="process__step">
                <span className="process__num">0{i + 1}</span>
                <span className="process__icon">
                  <Icon size={30} strokeWidth={1.5} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="section section--navy section--photo">
        <div className="container split split--center">
          <div>
            <SectionTitle overline="Online Services" title="Sign documents and pay without an office visit" light />
            <p>
              Once your document is prepared, you receive a secure link to review and sign online. Payments for
              consultations, document preparation, translation, or interpretation can be made with mobile money or card.
            </p>
          </div>
          <div className="btn-col">
            <Link to="/sign-a-document" className="btn btn--gold btn--lg">
              <FileSignature size={18} /> Sign a Document
            </Link>
            <Link to="/payment" className="btn btn--outline-light btn--lg">
              <CreditCard size={18} /> Make a Payment
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
