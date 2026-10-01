import { Paperclip } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, downloadFile, errorMessage } from '../../lib/api';
import { SERVICE_OPTIONS } from '../../lib/site';
import { fmtDate, Pager } from './AdminApp';

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'] as const;
type Status = (typeof STATUSES)[number];

interface Inquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: Status;
  createdAt: string;
  attachments: { id: string; originalName: string; size: number }[];
}

const serviceLabel = (v: string) => SERVICE_OPTIONS.find((o) => o.value === v)?.label ?? v;

export default function Inquiries() {
  const [filter, setFilter] = useState<Status | ''>('NEW');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Inquiry[]; total: number; pageSize: number } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const q = new URLSearchParams({ page: String(page) });
    if (filter) q.set('status', filter);
    api<typeof data>(`/inquiries?${q}`, { admin: true })
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [filter, page]);

  useEffect(load, [load]);

  const setStatus = async (id: string, status: Status) => {
    try {
      await api(`/inquiries/${id}`, { method: 'PATCH', body: { status }, admin: true });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Inquiries</h1>
        <select value={filter} onChange={(e) => (setPage(1), setFilter(e.target.value as Status | ''))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      {data?.items.length === 0 && <p className="muted">No inquiries.</p>}
      <div className="admin-list">
        {data?.items.map((i) => (
          <article key={i.id} className={`admin-item ${open === i.id ? 'admin-item--open' : ''}`}>
            <button className="admin-item__head" onClick={() => setOpen(open === i.id ? null : i.id)}>
              <span className={`badge badge--${i.status.toLowerCase()}`}>{i.status.replace('_', ' ')}</span>
              <strong>{i.fullName}</strong>
              <span>{serviceLabel(i.service)}</span>
              {i.attachments.length > 0 && <Paperclip size={14} />}
              <span className="muted">{fmtDate(i.createdAt)}</span>
            </button>
            {open === i.id && (
              <div className="admin-item__body">
                <p>
                  <a href={`tel:${i.phone.replace(/\s/g, '')}`}>{i.phone}</a> &middot; <a href={`mailto:${i.email}`}>{i.email}</a>{' '}
                  &middot; Ref {i.id.slice(-8).toUpperCase()}
                </p>
                <p className="pre">{i.message}</p>
                {i.attachments.length > 0 && (
                  <ul className="file-list">
                    {i.attachments.map((f) => (
                      <li key={f.id}>
                        <button className="btn btn--link" onClick={() => downloadFile(`/inquiries/${i.id}/files/${f.id}`, f.originalName).catch((e) => setError(errorMessage(e)))}>
                          <Paperclip size={14} /> {f.originalName} ({(f.size / 1024).toFixed(0)} KB)
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="btn-row">
                  {STATUSES.filter((s) => s !== i.status).map((s) => (
                    <button key={s} className="btn btn--outline btn--sm" onClick={() => setStatus(i.id, s)}>
                      Mark {s.replace('_', ' ').toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
      {data && <Pager page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
    </>
  );
}
