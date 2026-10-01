import { useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, errorMessage } from '../../lib/api';
import { SERVICE_OPTIONS } from '../../lib/site';
import { fmtDate, Pager } from './AdminApp';

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
        <select value={status} onChange={(e) => (setPage(1), setStatus(e.target.value))}>
          <option value="">All</option>
          {['SUCCESS', 'PENDING', 'FAILED', 'ABANDONED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
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
                  {SERVICE_OPTIONS.find((o) => o.value === p.service)?.label}
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
