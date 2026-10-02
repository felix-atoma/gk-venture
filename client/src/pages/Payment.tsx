import { CreditCard, Lock, Smartphone } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, PageBanner, SectionTitle } from '../components/Blocks';
import { Seo } from '../components/Seo';
import { api, errorMessage } from '../lib/api';
import { SERVICE_OPTIONS, ServiceType, SITE, telHref } from '../lib/site';

/** A fixed-amount payment request sent by the office: /payment?link=<code>. */
interface PaymentLink {
  code: string;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  amount: number;
  service: ServiceType;
  serviceLabel: string;
  description: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export default function Payment() {
  const [params] = useSearchParams();
  const linkCode = params.get('link');
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [linkError, setLinkError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ enabled: boolean }>('/payments/config')
      .then((c) => setEnabled(c.enabled))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (!linkCode) return;
    api<PaymentLink>(`/payments/links/code/${encodeURIComponent(linkCode)}`)
      .then(setLink)
      .catch((e) => setLinkError(errorMessage(e)));
  }, [linkCode]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setSubmitting(true);
    setError('');
    try {
      const res = await api<{ authorizationUrl: string }>('/payments/initialize', {
        method: 'POST',
        body: link
          ? { ...data, service: link.service, amount: link.amount, linkCode: link.code }
          : { ...data, amount: Number(data.amount) },
      });
      window.location.assign(res.authorizationUrl);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  const linkUnusable = !!link && link.status !== 'OPEN';
  const waitingForLink = !!linkCode && !link && !linkError;

  return (
    <>
      <Seo
        title="Make a Payment | Pay Online with Mobile Money or Card - G|K Ventures"
        description="Pay G|K Ventures securely online for consultations, document preparation, translation or interpretation services using mobile money or card."
      />
      <PageBanner title="Make a Payment" crumbs={[{ label: 'Make a Payment' }]} />
      <section className="section">
        <div className="container with-sidebar">
          <div>
            <SectionTitle overline="Secure Online Payment" title="Pay for your service">
              Pay securely online for consultations, document preparation, translation, or interpretation services. We
              accept mobile money and card payments through our secure payment partner.
            </SectionTitle>

            {enabled === false && (
              <Alert kind="info">
                Online payment is being set up. In the meantime, please call{' '}
                <a href={telHref(SITE.phones[0])}>{SITE.phones[0]}</a> for payment details.
              </Alert>
            )}
            {linkError && (
              <Alert kind="error">
                {linkError} Call <a href={telHref(SITE.phones[0])}>{SITE.phones[0]}</a> if you need help.
              </Alert>
            )}
            {link?.status === 'PAID' && <Alert kind="success">This payment request has already been paid. Thank you!</Alert>}
            {link?.status === 'CANCELLED' && (
              <Alert kind="error">
                This payment request is no longer valid. Please call{' '}
                <a href={telHref(SITE.phones[0])}>{SITE.phones[0]}</a>.
              </Alert>
            )}
            {waitingForLink && <p className="muted">Loading your payment details...</p>}

            {!waitingForLink && !linkUnusable && !linkError && (
              <form className="form panel" onSubmit={submit} key={link?.code ?? 'open'}>
                {link && (
                  <div className="pay-summary">
                    <span className="overline">You are paying</span>
                    <strong>GHS {link.amount.toFixed(2)}</strong>
                    <span>
                      {link.serviceLabel}
                      {link.description && <> &middot; {link.description}</>}
                    </span>
                  </div>
                )}
                <div className="form__grid">
                  <label>
                    Full Name *
                    <input name="fullName" required minLength={2} maxLength={120} autoComplete="name" defaultValue={link?.fullName ?? ''} />
                  </label>
                  <label>
                    Email (for your receipt) *
                    <input name="email" type="email" required autoComplete="email" defaultValue={link?.email ?? ''} />
                  </label>
                  <label>
                    Phone Number *
                    <input
                      name="phone"
                      type="tel"
                      required
                      pattern="^\+?[\d\s()\-]{7,20}$"
                      autoComplete="tel"
                      defaultValue={link?.phone ?? ''}
                    />
                  </label>
                  {!link && (
                    <>
                      <label>
                        Service *
                        <select name="service" required defaultValue="">
                          <option value="" disabled>
                            Select a service
                          </option>
                          {SERVICE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Amount (GHS) *
                        <input name="amount" type="number" required min={1} max={100000} step="0.01" inputMode="decimal" />
                      </label>
                      <label>
                        Invoice no. / Description
                        <input name="description" maxLength={200} placeholder="e.g. Affidavit - name change" />
                      </label>
                    </>
                  )}
                </div>
                {error && <Alert kind="error">{error}</Alert>}
                <p className="form__note">
                  {link ? 'The amount was set by our office.' : 'Please pay the amount quoted by our office.'} You will be
                  redirected to Paystack to complete payment, and a receipt will be emailed to you. See our{' '}
                  <Link to="/terms-of-use">Terms of Use</Link>.
                </p>
                <button className="btn btn--gold" disabled={submitting || !enabled}>
                  <Lock size={16} />{' '}
                  {submitting ? 'Redirecting...' : link ? `Pay GHS ${link.amount.toFixed(2)}` : 'Proceed to Secure Payment'}
                </button>
              </form>
            )}
          </div>
          <aside className="sidebar">
            <div className="sidebar__box">
              <h4>Accepted Methods</h4>
              <p className="pay-method">
                <Smartphone /> Mobile Money (MTN, Telecel, AirtelTigo)
              </p>
              <p className="pay-method">
                <CreditCard /> Visa / Mastercard
              </p>
            </div>
            <div className="sidebar__box sidebar__box--navy">
              <h4>Need a quote first?</h4>
              <p>Tell us what you need and we&apos;ll confirm the fee before you pay.</p>
              <Link to="/contact" className="btn btn--gold btn--block">
                Request a Quote
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
