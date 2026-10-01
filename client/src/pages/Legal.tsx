import { PageBanner } from '../components/Blocks';
import { Seo } from '../components/Seo';
import { SITE } from '../lib/site';

const UPDATED = '1 October 2026';

/** DRAFT - to be finalised with the client and, if needed, legal review (brief 4.10 / section 9). */
export function Privacy() {
  return (
    <>
      <Seo title="Privacy Policy | G|K Ventures" description="How G|K Ventures collects and protects personal data under Ghana's Data Protection Act, 2012 (Act 843)." />
      <PageBanner title="Privacy Policy" crumbs={[{ label: 'Privacy Policy' }]} />
      <section className="section">
        <div className="container narrow prose">
          <p className="muted">Last updated: {UPDATED}</p>
          <h2>1. Who we are</h2>
          <p>
            G|K Ventures (&quot;we&quot;, &quot;us&quot;) - Commission for Oaths and Paralegal Service in ADR Centre, {SITE.address}{' '}
            - is the data controller for personal data collected through kadawalegalservices.com. We process personal data
            in accordance with the Data Protection Act, 2012 (Act 843) of Ghana.
          </p>
          <h2>2. What we collect</h2>
          <ul>
            <li>Inquiry details: name, phone number, email, the service needed, your message and any files you upload.</li>
            <li>Payment details: name, email, phone, service and amount. Card and mobile money details are entered directly with our payment partner (Paystack) and are not stored by us.</li>
            <li>Electronic signing records: your name, email, typed and drawn signature, IP address, browser information, timestamps and document fingerprints (SHA-256).</li>
            <li>Display preferences (text size, contrast, cookie choice) stored only in your browser.</li>
          </ul>
          <h2>3. Why we use it</h2>
          <p>
            We collect personal information solely to deliver the legal, paralegal, and translation services you request -
            to respond to inquiries, prepare documents, process payments, facilitate e-signatures, keep records required for
            the validity of signed documents, and comply with the law.
          </p>
          <h2>4. Sharing</h2>
          <p>
            Information is not shared with third parties except as required to process payments (Paystack), deliver email,
            facilitate e-signatures, or comply with law. We do not sell personal data.
          </p>
          <h2>5. Security and retention</h2>
          <p>
            Uploaded and signed documents are stored encrypted (AES-256) and access is logged in an audit trail. Data is
            transmitted over HTTPS. We keep records only as long as needed for the service and for legal record-keeping
            obligations.
          </p>
          <h2>6. Cookies and third-party content</h2>
          <p>
            We use only essential browser storage by default. Google Maps is loaded only if you choose &quot;Accept all&quot; or
            &quot;Load map&quot;; Google may then set its own cookies.
          </p>
          <h2>7. Your rights</h2>
          <p>
            Under Act 843 you may request access to, correction of, or deletion of your personal data, and object to
            processing. Contact us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. You may also contact the Data
            Protection Commission of Ghana.
          </p>
        </div>
      </section>
    </>
  );
}

export function Terms() {
  return (
    <>
      <Seo title="Terms of Use | G|K Ventures" description="Terms of use for the G|K Ventures website, online payments and electronic signing." />
      <PageBanner title="Terms of Use" crumbs={[{ label: 'Terms of Use' }]} />
      <section className="section">
        <div className="container narrow prose">
          <p className="muted">Last updated: {UPDATED}</p>
          <h2>1. No client relationship from browsing</h2>
          <p>
            Use of this website does not itself create a client relationship with G|K Ventures; engagement begins upon
            confirmed booking and payment for a specific service.
          </p>
          <h2>2. Not legal advice</h2>
          <p>
            Content on this site is for general informational purposes and is not a substitute for personalized legal
            advice.
          </p>
          <h2>3. Online payments</h2>
          <p>
            Payments are processed by our payment partner. Please pay only amounts quoted by our office. Contact us
            promptly about any payment made in error.
          </p>
          <h2>4. Electronic signing</h2>
          <p>
            Signing links are personal to the named signer and must not be forwarded. By signing electronically you agree
            that your electronic signature is intended to have the same effect as your handwritten signature. Documents that
            must be sworn or attested in person are not offered for electronic signing.
          </p>
          <h2>5. Contact</h2>
          <p>
            {SITE.address} &middot; {SITE.phones.join(' / ')} &middot; <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>
      </section>
    </>
  );
}
