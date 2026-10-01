import { Copy, KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, errorMessage } from '../../lib/api';
import { fmtDate, useSession } from './AdminApp';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  active: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
}

export default function Users() {
  const { user: me } = useSession();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [error, setError] = useState('');
  const [credential, setCredential] = useState<{ email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<StaffUser[]>('/users', { admin: true })
      .then(setUsers)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<void>) => {
    setError('');
    try {
      await fn();
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const body = Object.fromEntries(new FormData(formEl));
    setBusy(true);
    await run(async () => {
      const res = await api<{ user: StaffUser; temporaryPassword: string }>('/users', { method: 'POST', body, admin: true });
      setCredential({ email: res.user.email, password: res.temporaryPassword });
      formEl.reset();
    });
    setBusy(false);
  };

  const update = (id: string, body: Partial<Pick<StaffUser, 'role' | 'active'>>) =>
    run(async () => {
      await api(`/users/${id}`, { method: 'PATCH', body, admin: true });
    });

  const reset = (u: StaffUser) =>
    confirm(`Reset the password for ${u.name}? They will be signed out, and two-step verification will be switched off so they can set it up again.`) &&
    run(async () => {
      const res = await api<{ temporaryPassword: string }>(`/users/${u.id}/reset-password`, { method: 'POST', admin: true });
      setCredential({ email: u.email, password: res.temporaryPassword });
    });

  return (
    <>
      <div className="admin-head">
        <h1>Staff Accounts</h1>
      </div>
      <p className="muted">
        Give each person their own account so the audit trail shows who did what. <b>Staff</b> can handle inquiries,
        payments, signing, site content and the gallery. <b>Admins</b> can also manage staff accounts.
      </p>

      <form className="form panel" onSubmit={create}>
        <h3>Add a staff member</h3>
        <div className="form__grid form__grid--3">
          <label>
            Full name
            <input name="name" required minLength={2} maxLength={120} />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Role
            <select name="role" defaultValue="STAFF">
              <option value="STAFF">Staff (e.g. Secretary / Clerk)</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>
        <button className="btn btn--gold" disabled={busy}>
          <UserPlus size={16} /> {busy ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      {credential && (
        <Alert kind="success">
          A temporary password has been emailed to <b>{credential.email}</b>. You can also share it directly - it is shown
          only once:
          <div className="copy-link">
            <code>{credential.password}</code>
            <button className="btn btn--link" onClick={() => navigator.clipboard.writeText(credential.password)}>
              <Copy size={14} /> Copy
            </button>
          </div>
          <small>They must choose their own password the first time they sign in.</small>
        </Alert>
      )}
      {error && <Alert kind="error">{error}</Alert>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last sign in</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === me.sub;
              return (
                <tr key={u.id} className={u.active ? '' : 'row--muted'}>
                  <td>
                    {u.name} {self && <small className="muted">(you)</small>}
                    <br />
                    <small className="muted">{u.email}</small>
                  </td>
                  <td>
                    <select
                      value={u.role}
                      disabled={self}
                      onChange={(e) => update(u.id, { role: e.target.value as StaffUser['role'] })}
                      aria-label={`Role for ${u.name}`}
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge badge--${u.active ? 'success' : 'cancelled'}`}>{u.active ? 'Active' : 'Deactivated'}</span>
                    {u.totpEnabled && (
                      <span className="badge badge--viewed" title="Two-step verification on">
                        <ShieldCheck size={11} /> 2-step
                      </span>
                    )}
                    {u.mustChangePassword && <span className="badge badge--pending">Temp password</span>}
                  </td>
                  <td>
                    <small>{fmtDate(u.lastLoginAt)}</small>
                  </td>
                  <td className="actions">
                    {!self && (
                      <>
                        <button className="btn btn--link" onClick={() => reset(u)}>
                          <KeyRound size={14} /> Reset password
                        </button>
                        <button
                          className={`btn btn--link ${u.active ? 'btn--danger' : ''}`}
                          onClick={() =>
                            (u.active ? confirm(`Deactivate ${u.name}? They will be signed out immediately.`) : true) &&
                            update(u.id, { active: !u.active })
                          }
                        >
                          {u.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
