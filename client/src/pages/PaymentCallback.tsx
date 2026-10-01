import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageBanner } from '../components/Blocks';
import { Seo } from '../components/Seo';
import { api, errorMessage } from '../lib/api';

interface Verification {
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED';
  amount: number;
  currency: string;
  service: string;
  fullName: string;
  paidAt: string | null;
}

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref') ?? '';
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) return setError('No payment reference was provided.');
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const check = () =>
      api<Verification>(`/payments/verify/${encodeURIComponent(reference)}`)
        .then((r) => {
          setResult(r);
          // Mobile money can take a moment to confirm.
          if (r.status === 'PENDING' && ++tries < 10) timer = setTimeout(check, 4000);
        })
        .catch((e) => setError(errorMessage(e)));
    check();
    return () => clearTimeout(timer);
  }, [reference]);

  return (
    <>
      <Seo title="Payment Status | G|K Ventures" description="Payment confirmation" noindex />
      <PageBanner title="Payment Status" crumbs={[{ label: 'Make a Payment', to: '/payment' }, { label: 'Status' }]} />
      <section className="section">
        <div className="container narrow center">
          {error && (
            <div className="status-card status-card--error">
              <XCircle size={56} />
              <h2>We could not confirm this payment</h2>
              <p>{error}</p>
            </div>
          )}
          {!error && !result && <p className="muted">Confirming your payment...</p>}
          {result?.status === 'SUCCESS' && (
            <div className="status-card status-card--ok">
              <CheckCircle2 size={56} />
              <h2>Payment successful</h2>
              <p>
                Thank you, {result.fullName}. We received{' '}
                <strong>
                  {result.currency} {result.amount.toFixed(2)}
                </strong>{' '}
                for {result.service}.
              </p>
              <p className="muted">Reference: {result.reference} &middot; A receipt has been emailed to you.</p>
            </div>
          )}
          {result?.status === 'PENDING' && (
            <div className="status-card">
              <Clock size={56} />
              <h2>Payment pending</h2>
              <p>Your payment is still being confirmed. If you approved a mobile money prompt, this page will update shortly.</p>
              <p className="muted">Reference: {result.reference}</p>
            </div>
          )}
          {(result?.status === 'FAILED' || result?.status === 'ABANDONED') && (
            <div className="status-card status-card--error">
              <XCircle size={56} />
              <h2>Payment not completed</h2>
              <p>The payment was {result.status.toLowerCase()}. No money was taken. You can try again.</p>
              <Link to="/payment" className="btn btn--gold">
                Try Again
              </Link>
            </div>
          )}
          <p>
            <Link to="/">Return to home</Link>
          </p>
        </div>
      </section>
    </>
  );
}
