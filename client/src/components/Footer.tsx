import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useText } from '../lib/content';
import { SERVICES, SITE, telHref, whatsappHref } from '../lib/site';
import { Logo } from './Logo';

export function Footer() {
  const t = useText();
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo light />
          <p className="footer__about">
            {SITE.tagline} - {SITE.act}.
          </p>
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn--outline-light btn--sm">
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
        </div>
        <div>
          <h4>Our Services</h4>
          <ul>
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`}>{s.title}</Link>
              </li>
            ))}
            <li>
              <Link to="/sign-a-document">Sign a Document</Link>
            </li>
            <li>
              <Link to="/payment">Make a Payment</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/about/court-experience">Court Experience</Link>
            </li>
            <li>
              <Link to="/team">Our Team</Link>
            </li>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms-of-use">Terms of Use</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Have a Question?</h4>
          <ul className="footer__contact">
            <li>
              <MapPin size={16} /> {SITE.address}
            </li>
            {SITE.phones.map((p) => (
              <li key={p}>
                <Phone size={16} /> <a href={telHref(p)}>{p}</a>
              </li>
            ))}
            <li>
              <Mail size={16} /> <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
            <li>
              <Clock size={16} /> Mon-Fri: {t('contact.hours.weekdays')}
            </li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          &copy; {new Date().getFullYear()} G|K Ventures. All rights reserved. Content on this site is general
          information, not legal advice.
        </div>
      </div>
    </footer>
  );
}
