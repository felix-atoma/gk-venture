import { FileCheck2, Lock, Mail, PenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CtaBand, PageBanner, SectionTitle } from '../components/Blocks';
import { Seo } from '../components/Seo';

const STEPS = [
  { icon: FileCheck2, title: 'We prepare your document', text: 'Once your document is prepared and any notarization requirements are met, we set it up for signing.' },
  { icon: Mail, title: 'You receive a secure link', text: 'A personal signing link is sent to your email. It expires automatically and can only be used once.' },
  { icon: PenLine, title: 'Review and sign online', text: 'Read the document, confirm your consent and draw your signature - no office visit required for the signing step.' },
  { icon: Lock, title: 'Authenticated & logged', text: 'A signed copy with a signature certificate is emailed to you. Every step is logged with a tamper-evident fingerprint.' },
];

export default function SignDocument() {
  return (
    <>
      <Seo
        title="Sign Legal Documents Online Ghana | Secure E-Signature - G|K Ventures"
        description="Sign legal documents online in Ghana with G|K Ventures. Receive a secure link, review and sign eligible documents and agreements electronically."
      />
      <PageBanner title="Sign a Document" crumbs={[{ label: 'Sign a Document' }]} />
      <section className="section">
        <div className="container">
          <SectionTitle overline="Secure Electronic Signing" title="Sign eligible documents online">
            G|K Ventures offers secure electronic signing for eligible documents and agreements. Once a document is
            prepared, clients receive a secure link to review and sign online - no office visit required for the signing
            step itself. All signed documents are authenticated and logged for legal validity.
          </SectionTitle>
          <div className="grid grid--4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="process__step">
                <span className="process__num">0{i + 1}</span>
                <span className="process__icon">
                  <Icon size={28} strokeWidth={1.5} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="notice">
            <p>
              <strong>Already received a signing link?</strong> Open it directly from your email. Links are personal - please
              do not forward them.
            </p>
            <p>
              <strong>Need a document prepared for signing?</strong> Some documents, such as affidavits, must be sworn in
              person before a Commissioner for Oaths. We will advise whether your document is eligible for electronic
              signing.
            </p>
            <Link to="/contact?service=LEGAL_DOCUMENTS" className="btn btn--gold">
              Request a Document
            </Link>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
