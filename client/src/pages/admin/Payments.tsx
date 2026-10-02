import { Copy, Download, Link2, MessageCircle, XCircle } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, downloadFile, errorMessage } from '../../lib/api';
import { SERVICE_OPTIONS } from '../../lib/site';
import { fmtDate, Pager } from './AdminApp';

interface PaymentLink {
  id: string;
  code: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  service: string;
  description: string | null;
  amount: number;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt: string | null;
}

const serviceLabel = (v: string) => SERVICE_OPTIONS.find((o) => o.value === v)?.label ?? v;
const linkUrl = (code: string) => `${window.location.origin}/payment?link=${code}`;

/** wa.me link to the client's number (Ghana local numbers like 054... become 23354...), or a share-to-anyone link. */
function whatsappLink(l: PaymentLink) {
  const text =
    `Hello${l.fullName ? ` ${l.fullName}` : ''}, please use this secure link to pay GHS ${(l.amount / 100).toFixed(2)} ` +
    `for ${serviceLabel(l.service)}${l.description ? ` (${l.description})` : ''}: ${linkUrl(l.code)}\n- G|K Ventures`;
  let digits = (l.phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `233${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function PaymentLinks() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [created, setCreated] = useState<PaymentLink | null>(null);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<PaymentLink[]>('/payments/links', { admin: true })
      .then(setLinks)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const data = Object.fromEntries(new FormData(formEl)) as Record<string, string>;
    setBusy(true);
    setError('');
    try {
      const link = await api<PaymentLink>('/payments/links', {
        method: 'POST',
        body: { ...data, amount: Number(data.amount) },
        admin: true,
      });
      setCreated(link);
      formEl.reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = (l: PaymentLink) =>
    navigator.clipboard.writeText(linkUrl(l.code)).then(() => {
      setCopied(l.id);
      setTimeout(() => setCopied(''), 2000);
    });

  const cancel = (l: PaymentLink) =>
    confirm('Cancel this payment link? The client will no longer be able to pay with it.') &&
    api(`/payments/links/${l.id}/cancel`, { method: 'POST', admin: true })
      .then(load)
      .catch((e) => setError(errorMessage(e)));

  const actions = (l: PaymentLink) => (
    <>
      <button className="btn btn--link" onClick={() => copy(l)}>
        <Copy size={14} /> {copied === l.id ? 'Copied!' : 'Copy link'}
      </button>
      <a className="btn btn--link" href={whatsappLink(l)} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={14} /> WhatsApp
      </a>
    </>
  );

  return (
    <div className="panel">
      <h3>
        <Link2 size={18} /> Payment links
      </h3>
      <p className="muted">
        Create a link for an exact amount and send it to the client. They tap it, fill in nothing but their details, and
        pay. The link is marked paid automatically.
      </p>
      <form className="form" onSubmit={create}>
        <div className="form__grid">
          <label>
            Client name
            <input name="fullName" maxLength={120} />
          </label>
          <label>
            Client phone (for WhatsApp)
            <input name="phone" type="tel" pattern="^\+?[\d\s()\-]{7,20}$" placeholder="054 ..." />
          </label>
          <label>
            Client email
            <input name="email" type="email" />
          </label>
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
            Description
            <input name="description" maxLength={200} placeholder="e.g. Affidavit - name change" />
          </label>
        </div>
        {error && <Alert kind="error">{error}</Alert>}
        <button className="btn btn--gold" disabled={busy}>
          <Link2 size={16} /> {busy ? 'Creating...' : 'Create Payment Link'}
        </button>
      </form>

      {created && (
        <Alert kind="success">
          Link created for GHS {(created.amount / 100).toFixed(2)}. Send it to your client:
          <div className="copy-link">
            <code>{linkUrl(created.code)}</code>
            {actions(created)}
          </div>
        </Alert>
      )}

      {links.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Client</th>
                <th>For</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id}>
                  <td>{fmtDate(l.createdAt)}</td>
                  <td>
                    {l.fullName ?? '-'}
                    {l.phone && (
                      <>
                        <br />
                        <small className="muted">{l.phone}</small>
                      </>
                    )}
                  </td>
                  <td>
                    {serviceLabel(l.service)}
                    {l.description && (
                      <>
                        <br />
                        <small className="muted">{l.description}</small>
                      </>
                    )}
                  </td>
                  <td>GHS {(l.amount / 100).toFixed(2)}</td>
                  <td>
                    <span className={`badge badge--${l.status === 'OPEN' ? 'pending' : l.status === 'PAID' ? 'success' : 'cancelled'}`}>
                      {l.status === 'OPEN' ? 'UNPAID' : l.status}
                    </span>
                  </td>
                  <td className="actions">
                    {l.status === 'OPEN' && (
                      <>
                        {actions(l)}
                        <button className="btn btn--link btn--danger" onClick={() => cancel(l)}>
                          <XCircle size={14} /> Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface Payment {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface PaymentList {
  items: Payment[];
  total: number;
  pageSize: number;
  totalCollected: number;
}

export default function Payments() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaymentList | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = new URLSearchParams({ page: String(page) });
    if (status) q.set('status', status);
    api<PaymentList>(`/payments?${q}`, { admin: true })
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [status, page]);

  return (
    <>
      <div className="admin-head">
        <h1>Payments</h1>
      </div>
      <PaymentLinks />
      <div className="admin-head">
        <h2>Payments received</h2>
        <div className="btn-row">
          <select value={status} onChange={(e) => (setPage(1), setStatus(e.target.value))}>
            <option value="">All</option>
            {['SUCCESS', 'PENDING', 'FAILED', 'ABANDONED'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            className="btn btn--outline btn--sm"
            onClick={() =>
              downloadFile(`/payments/export${status ? `?status=${status}` : ''}`, 'payments.csv').catch((e) => setError(errorMessage(e)))
            }
          >
            <Download size={14} /> Download (Excel/CSV)
          </button>
        </div>
      </div>
      {data && (
        <p className="admin-kpi">
          Total collected: <strong>GHS {data.totalCollected.toFixed(2)}</strong>
        </p>
      )}
      {error && <Alert kind="error">{error}</Alert>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Payer</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id}>
                <td>{fmtDate(p.paidAt ?? p.createdAt)}</td>
                <td>
                  {p.fullName}
                  <br />
                  <small className="muted">
                    {p.email} &middot; {p.phone}
                  </small>
                </td>
                <td>
                  {serviceLabel(p.service)}
                  {p.description && (
                    <>
                      <br />
                      <small className="muted">{p.description}</small>
                    </>
                  )}
                </td>
                <td>
                  {p.currency} {(p.amount / 100).toFixed(2)}
                  {p.channel && (
                    <>
                      <br />
                      <small className="muted">{p.channel}</small>
                    </>
                  )}
                </td>
                <td>
                  <span className={`badge badge--${p.status.toLowerCase()}`}>{p.status}</span>
                </td>
                <td>
                  <code>{p.reference}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data?.items.length === 0 && <p className="muted">No payments yet.</p>}
      {data && <Pager page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
    </>
  );
}
