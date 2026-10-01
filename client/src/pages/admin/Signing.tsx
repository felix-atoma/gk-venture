import { Copy, Download, Send, Upload, XCircle } from 'lucide-react';
import { FormEvent, Fragment, useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, downloadFile, errorMessage } from '../../lib/api';
import { fmtDate } from './AdminApp';

interface SignatureRequest {
  id: string;
  title: string;
  signerName: string;
  signerEmail: string;
  status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'CANCELLED';
  expiresAt: string;
  viewedAt: string | null;
  signedAt: string | null;
  createdAt: string;
  originalSha256: string;
  signedSha256: string | null;
  createdBy: { name: string };
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  ipAddress: string | null;
  createdAt: string;
}

const isOpen = (r: SignatureRequest) => r.status === 'PENDING' || r.status === 'VIEWED';

export default function Signing() {
  const [items, setItems] = useState<SignatureRequest[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ text: string; link?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [audit, setAudit] = useState<{ id: string; entries: AuditEntry[] } | null>(null);

  const load = useCallback(() => {
    api<SignatureRequest[]>('/signing/requests', { admin: true })
      .then(setItems)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<void>) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    setBusy(true);
    await run(async () => {
      const res = await api<{ signingUrl: string }>('/signing/requests', { method: 'POST', form: new FormData(formEl), admin: true });
      setNotice({ text: 'Signing request created and emailed to the signer.', link: res.signingUrl });
      formEl.reset();
      load();
    });
    setBusy(false);
  };

  const resend = (id: string) =>
    run(async () => {
      const res = await api<{ signingUrl: string }>(`/signing/requests/${id}/resend`, { method: 'POST', admin: true });
      setNotice({ text: 'A new link was issued and emailed. The previous link no longer works.', link: res.signingUrl });
      load();
    });

  const cancel = (id: string) =>
    confirm('Cancel this signing request? The signer will no longer be able to sign.') &&
    run(async () => {
      await api(`/signing/requests/${id}/cancel`, { method: 'POST', admin: true });
      load();
    });

  const showAudit = (id: string) =>
    run(async () => {
      if (audit?.id === id) return setAudit(null);
      const res = await api<{ audit: AuditEntry[] }>(`/signing/requests/${id}`, { admin: true });
      setAudit({ id, entries: res.audit });
    });

  return (
    <>
      <div className="admin-head">
        <h1>E-Signing</h1>
      </div>

      <form className="form panel" onSubmit={create}>
        <h3>New signing request</h3>
        <div className="form__grid">
          <label>
            Document title *
            <input name="title" required minLength={3} maxLength={150} placeholder="e.g. Tenancy Agreement - 12 Ring Road" />
          </label>
          <label>
            PDF file *
            <input name="file" type="file" accept="application/pdf" required />
          </label>
          <label>
            Signer name *
            <input name="signerName" required minLength={2} maxLength={120} />
          </label>
          <label>
            Signer email *
            <input name="signerEmail" type="email" required />
          </label>
          <label>
            Link valid for (days)
            <input name="expiresInDays" type="number" min={1} max={60} defaultValue={14} />
          </label>
        </div>
        <label>
          Message to signer (optional)
          <textarea name="message" rows={2} maxLength={1000} />
        </label>
        <button className="btn btn--gold" disabled={busy}>
          <Upload size={16} /> {busy ? 'Uploading...' : 'Create & Send'}
        </button>
      </form>

      {notice && (
        <Alert kind="success">
          {notice.text}
          {notice.link && (
            <div className="copy-link">
              <code>{notice.link}</code>
              <button className="btn btn--link" onClick={() => navigator.clipboard.writeText(notice.link!)}>
                <Copy size={14} /> Copy
              </button>
            </div>
          )}
          <small>Copy the link now if you also want to send it by WhatsApp - it is not shown again.</small>
        </Alert>
      )}
      {error && <Alert kind="error">{error}</Alert>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Signer</th>
              <th>Status</th>
              <th>Dates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>
                    {r.title}
                    <br />
                    <small className="muted">by {r.createdBy.name}</small>
                  </td>
                  <td>
                    {r.signerName}
                    <br />
                    <small className="muted">{r.signerEmail}</small>
                  </td>
                  <td>
                    <span className={`badge badge--${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td>
                    <small>
                      Sent {fmtDate(r.createdAt)}
                      <br />
                      {r.signedAt ? `Signed ${fmtDate(r.signedAt)}` : `Expires ${fmtDate(r.expiresAt)}`}
                    </small>
                  </td>
                  <td className="actions">
                    <button className="btn btn--link" onClick={() => run(() => downloadFile(`/signing/requests/${r.id}/file/original`, `${r.title}.pdf`))}>
                      <Download size={14} /> Original
                    </button>
                    {r.status === 'SIGNED' && (
                      <button className="btn btn--link" onClick={() => run(() => downloadFile(`/signing/requests/${r.id}/file/signed`, `${r.title} - signed.pdf`))}>
                        <Download size={14} /> Signed
                      </button>
                    )}
                    {isOpen(r) && (
                      <>
                        <button className="btn btn--link" onClick={() => resend(r.id)}>
                          <Send size={14} /> New link
                        </button>
                        <button className="btn btn--link btn--danger" onClick={() => cancel(r.id)}>
                          <XCircle size={14} /> Cancel
                        </button>
                      </>
                    )}
                    <button className="btn btn--link" onClick={() => showAudit(r.id)}>
                      Audit trail
                    </button>
                  </td>
                </tr>
                {audit?.id === r.id && (
                  <tr>
                    <td colSpan={5}>
                      <ul className="audit">
                        {audit.entries.map((a) => (
                          <li key={a.id}>
                            <code>{fmtDate(a.createdAt)}</code> {a.action} - {a.actor}
                            {a.ipAddress && ` (${a.ipAddress})`}
                          </li>
                        ))}
                      </ul>
                      <small className="muted">
                        Original SHA-256: <code>{r.originalSha256}</code>
                        {r.signedSha256 && (
                          <>
                            <br />
                            Signed SHA-256: <code>{r.signedSha256}</code>
                          </>
                        )}
                      </small>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p className="muted">No signing requests yet.</p>}
    </>
  );
}
