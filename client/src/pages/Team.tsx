import { Briefcase, FileText, Truck } from 'lucide-react';
import { CtaBand, PageBanner, SectionTitle } from '../components/Blocks';
import { Seo } from '../components/Seo';

const TEAM = [
  {
    role: 'Chief Executive Officer (C.E.O)',
    name: 'Gilbert K. Kadawa',
    text: "Commissioner for Oaths, Legal Translator/Interpreter, Paralegal Service Provider; experienced court interpreter within Ghana's court system.",
    photo: '/images/team-ceo.jpg',
    icon: Briefcase,
  },
  {
    role: 'Secretary / Clerk',
    name: '',
    text: 'Handles scheduling, document intake, and client correspondence.',
    photo: '/images/team-secretary.jpg',
    icon: FileText,
  },
  {
    role: 'Messenger',
    name: '',
    text: 'Handles document delivery and collection.',
    photo: '/images/team-messenger.jpg',
    icon: Truck,
  },
];

export default function Team() {
  return (
    <>
      <Seo
        title="Our Team | G|K Ventures - Commissioner for Oaths Accra"
        description="Meet the G|K Ventures team, led by Gilbert K. Kadawa - Commissioner for Oaths, legal translator/interpreter and paralegal service provider in Accra."
      />
      <PageBanner title="Our Team" crumbs={[{ label: 'About Us', to: '/about' }, { label: 'Our Team' }]} />
      <section className="section">
        <div className="container">
          <SectionTitle overline="Our People" title="The team behind G|K Ventures" />
          <div className="grid grid--3">
            {TEAM.map(({ role, name, text, photo, icon: Icon }) => (
              <div key={role} className="team-card">
                <div className="team-card__photo">
                  <img src={photo} alt={name || role} onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <Icon size={56} strokeWidth={1.2} aria-hidden="true" />
                </div>
                <div className="team-card__body">
                  <span className="overline">{role}</span>
                  {name && <h3>{name}</h3>}
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
