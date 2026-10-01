import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageBanner, SectionTitle } from '../components/Blocks';
import { InquiryForm } from '../components/InquiryForm';
import { MapEmbed } from '../components/MapEmbed';
import { Seo } from '../components/Seo';
import { useText } from '../lib/content';
import { SERVICE_OPTIONS, ServiceType, SITE, telHref, whatsappHref } from '../lib/site';

export default function Contact() {
  const t = useText();
  const [params] = useSearchParams();
  const requested = params.get('service') as ServiceType | null;
  const defaultService = SERVICE_OPTIONS.some((o) => o.value === requested) ? requested! : undefined;

  return (
    <>
      <Seo
        title="Contact G|K Ventures | Commissioner for Oaths & Paralegal Services Accra North"
        description="Contact G|K Ventures, P. O. Box AN 5765, Accra-North. Call +233 545 032 058, chat on WhatsApp, or submit an online inquiry."
      />
      <PageBanner title="Contact / Inquiry" crumbs={[{ label: 'Contact' }]} />
      <section className="section">
        <div className="container contact">
          <div>
            <SectionTitle overline="Get in Touch" title="We'd love to hear from you">
              Reach out using the details below, or submit the inquiry form and we&apos;ll respond promptly.
            </SectionTitle>
            <ul className="contact__list">
              <li>
                <MapPin /> <div><strong>Address</strong>{SITE.address}</div>
              </li>
              <li>
                <Phone />
                <div>
                  <strong>Mobile</strong>
                  {SITE.phones.map((p) => (
                    <a key={p} href={telHref(p)}>
                      {p}
                    </a>
                  ))}
                </div>
              </li>
              <li>
                <Mail /> <div><strong>Email</strong><a href={`mailto:${SITE.email}`}>{SITE.email}</a></div>
              </li>
              <li>
                <MessageCircle />
                <div>
                  <strong>WhatsApp</strong>
                  <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                    Chat with us on {SITE.phones[0]}
                  </a>
                </div>
              </li>
              <li>
                <Clock />
                <div>
                  <strong>Business Hours</strong>
                  <span>Monday-Friday: {t('contact.hours.weekdays')}</span>
                  <span>Saturday: {t('contact.hours.saturday')}</span>
                  <span>Sunday: {t('contact.hours.sunday')}</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="panel panel--flush">
            <h3>Inquiry Form</h3>
            <InquiryForm defaultService={defaultService} />
          </div>
        </div>
      </section>
      <MapEmbed />
    </>
  );
}
