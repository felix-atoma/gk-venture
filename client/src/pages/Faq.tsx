import { CtaBand, PageBanner, SectionTitle } from '../components/Blocks';
import { Seo } from '../components/Seo';

const FAQS = [
  {
    q: 'What is an affidavit?',
    a: 'An affidavit is a written statement of facts that you confirm as true by swearing an oath (or making an affirmation) before a Commissioner for Oaths. Common examples include affidavits for change of name, date of birth, loss of documents, and marital status.',
  },
  {
    q: 'Can I swear an affidavit online?',
    a: 'Affidavits must be sworn in person before a Commissioner for Oaths. We can prepare the document in advance from your inquiry so the visit is quick, and you can pay online beforehand.',
  },
  {
    q: 'What do I need to bring?',
    a: 'Please bring a valid ID (Ghana Card or passport) and any documents that support your matter - for example birth certificates, previous names, tenancy agreements, or court papers. If you are unsure, send an inquiry and we will tell you exactly what to bring.',
  },
  {
    q: 'How long does a gazette notification take?',
    a: 'Timelines depend on the publication schedule of the Ghana Publishing Company and on having complete documents. Contact us for a current estimate for your notification.',
  },
  {
    q: 'Which languages do you interpret?',
    a: 'We translate legal documents between English and French (vice-versa) and provide court hearing interpretation in English, French, Twi, Ga, and Hausa.',
  },
  {
    q: 'How do I get a quote for a translation?',
    a: 'Upload your document through the inquiry form and choose "Legal Translation / Interpretation". We will reply with a quote and turnaround time.',
  },
  {
    q: 'Which documents can be signed electronically?',
    a: 'Many agreements and letters can be signed electronically. Documents that must be sworn, attested or notarised in person cannot. We will confirm whether your document is eligible.',
  },
  {
    q: 'How do I pay?',
    a: 'Use the "Make a Payment" page to pay with mobile money (MTN, Telecel, AirtelTigo) or card. A receipt is emailed to you once payment is confirmed.',
  },
  {
    q: 'Are you a law firm?',
    a: 'G|K Ventures is a Commission for Oaths and Paralegal Service operating through an ADR Centre under the ADR Act, 2010 (Act 798). Information on this site is general and not a substitute for personalised legal advice. Where a matter requires a lawyer, we will tell you.',
  },
];

export default function Faq() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <>
      <Seo
        title="FAQ | Affidavits, Gazette, Translation & E-Signing - G|K Ventures"
        description="Answers to common questions: what is an affidavit, what to bring, gazette notification timelines, legal translation quotes, online signing and payment."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageBanner title="Frequently Asked Questions" crumbs={[{ label: 'FAQ' }]} />
      <section className="section">
        <div className="container narrow">
          <SectionTitle overline="Help" title="Common questions" />
          <div className="faq">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
