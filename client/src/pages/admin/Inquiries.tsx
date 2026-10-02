import { CalendarClock, Paperclip, Search, StickyNote } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, downloadFile, errorMessage } from '../../lib/api';
import { SERVICE_OPTIONS } from '../../lib/site';
import { fmtDate, Pager } from './AdminApp';

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'] as const;
type Status = (typeof STATUSES)[number];

interface Note {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface Inquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: Status;
  preferredAt: string | null;
  createdAt: string;
  attachments: { id: string; originalName: string; size: number }[];
  notes: Note[];
}

const serviceLabel = (v: string) => SERVICE_OPTIONS.find((o) => o.value === v)?.label ?? v;

export default function Inquiries() {
  const [filter, setFilter] = useState<Status | ''>('NEW');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Inquiry[]; total: number; pageSize: number } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Search as you type, without a request per keystroke. A search looks across all statuses.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = search.trim();
      setPage(1);
      setTerm(next);
      if (next) setFilter('');
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    const q = new URLSearchParams({ page: String(page) });
    if (filter) q.set('status', filter);
    if (term) q.set('q', term);
    api<typeof data>(`/inquiries?${q}`, { admin: true })
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [filter, page, term]);

  useEffect(load, [load]);

  const setStatus = async (id: string, status: Status) => {
    try {
      await api(`/inquiries/${id}`, { method: 'PATCH', body: { status }, admin: true });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const addNote = async (e: FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const text = String(new FormData(formEl).get('text') ?? '').trim();
    if (!text) return;
    try {
      await api(`/inquiries/${id}/notes`, { method: 'POST', body: { text }, admin: true });
      formEl.reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Inquiries</h1>
        <div className="btn-row">
          <label className="search-box">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email or ref"
              aria-label="Search inquiries"
            />
          </label>
          <select value={filter} onChange={(e) => (setPage(1), setFilter(e.target.value as Status | ''))}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      {data?.items.length === 0 && <p className="muted">{term ? 'No inquiries match your search.' : 'No inquiries.'}</p>}
      <div className="admin-list">
        {data?.items.map((i) => (
          <article key={i.id} className={`admin-item ${open === i.id ? 'admin-item--open' : ''}`}>
            <button className="admin-item__head" onClick={() => setOpen(open === i.id ? null : i.id)}>
              <span className={`badge badge--${i.status.toLowerCase()}`}>{i.status.replace('_', ' ')}</span>
              <strong>{i.fullName}</strong>
              <span>{serviceLabel(i.service)}</span>
              <span className="admin-item__icons">
                {i.preferredAt && <CalendarClock size={14} aria-label="Appointment requested" />}
                {i.notes.length > 0 && <StickyNote size={14} aria-label="Has notes" />}
                {i.attachments.length > 0 && <Paperclip size={14} aria-label="Has attachments" />}
              </span>
              <span className="muted">{fmtDate(i.createdAt)}</span>
            </button>
            {open === i.id && (
              <div className="admin-item__body">
                <p>
                  <a href={`tel:${i.phone.replace(/\s/g, '')}`}>{i.phone}</a> &middot; <a href={`mailto:${i.email}`}>{i.email}</a>{' '}
                  &middot; Ref {i.id.slice(-8).toUpperCase()}
                </p>
                {i.preferredAt && (
                  <p className="appointment">
                    <CalendarClock size={16} /> Requested appointment: <strong>{fmtDate(i.preferredAt)}</strong>
                  </p>
                )}
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
                <div className="notes">
                  <h4>
                    <StickyNote size={16} /> Private notes
                  </h4>
                  {i.notes.length === 0 && <p className="muted">No notes yet. Only staff can see notes.</p>}
                  {i.notes.map((n) => (
                    <div key={n.id} className="note">
                      <p className="pre">{n.text}</p>
                      <small className="muted">
                        {n.author} &middot; {fmtDate(n.createdAt)}
                      </small>
                    </div>
                  ))}
                  <form className="note-form" onSubmit={(e) => addNote(e, i.id)}>
                    <textarea name="text" rows={2} maxLength={2000} required placeholder="e.g. Called her - coming in on Tuesday at 10am" />
                    <button className="btn btn--navy btn--sm">Add note</button>
                  </form>
                </div>
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
