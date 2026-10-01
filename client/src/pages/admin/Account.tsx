import { ShieldCheck, ShieldOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, auth, errorMessage } from '../../lib/api';
import { AdminUser, useSession } from './AdminApp';

type Msg = { kind: 'success' | 'error'; text: string } | null;

export default function Account({ passwordOnly = false }: { passwordOnly?: boolean }) {
  return passwordOnly ? (
    <PasswordForm />
  ) : (
    <>
      <div className="admin-head">
        <h1>My Account</h1>
      </div>
      <div className="account-grid">
        <PasswordForm />
        <TwoFactor />
      </div>
    </>
  );
}

function PasswordForm() {
  const { setUser } = useSession();
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const data = Object.fromEntries(new FormData(formEl)) as Record<string, string>;
    if (data.newPassword !== data.confirm) return setMsg({ kind: 'error', text: 'New passwords do not match.' });
    setBusy(true);
    try {
      const res = await api<{ accessToken: string; user: AdminUser }>('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: data.currentPassword, newPassword: data.newPassword },
        admin: true,
      });
      auth.set(res.accessToken);
      formEl.reset();
      setMsg({ kind: 'success', text: 'Password changed. Any other signed-in devices have been signed out.' });
      setUser(res.user);
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form panel" onSubmit={submit}>
      <h3>Change password</h3>
      <label>
        Current (or temporary) password
        <input name="currentPassword" type="password" required autoComplete="current-password" />
      </label>
      <label>
        New password (min 10 characters, letters and numbers)
        <input name="newPassword" type="password" required minLength={10} autoComplete="new-password" />
      </label>
      <label>
        Confirm new password
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" />
      </label>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <button className="btn btn--gold" disabled={busy}>
        Update Password
      </button>
    </form>
  );
}

function TwoFactor() {
  const { user, setUser } = useSession();
  const [setup, setSetup] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  const run = async (fn: () => Promise<void>) => {
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    }
  };

  const start = () => run(async () => setSetup(await api('/auth/2fa/setup', { method: 'POST', admin: true })));

  const enable = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code'));
    return run(async () => {
      setUser(await api<AdminUser>('/auth/2fa/enable', { method: 'POST', body: { code }, admin: true }));
      setSetup(null);
      setMsg({ kind: 'success', text: 'Two-step verification is on. You will need your phone each time you sign in.' });
    });
  };

  const disable = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    return run(async () => {
      setUser(await api<AdminUser>('/auth/2fa/disable', { method: 'POST', body: data, admin: true }));
      setMsg({ kind: 'success', text: 'Two-step verification has been turned off.' });
    });
  };

  return (
    <div className="panel form">
      <h3>Two-step verification</h3>
      {user.twoFactorEnabled ? (
        <>
          <p className="status-line status-line--ok">
            <ShieldCheck size={18} /> On - a code from your authenticator app is required at sign in.
          </p>
          <form className="form" onSubmit={disable}>
            <p className="muted">To turn it off, confirm your password and a current code.</p>
            <label>
              Password
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <label>
              Code
              <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required className="code-input" />
            </label>
            <button className="btn btn--outline btn--sm">Turn off</button>
          </form>
        </>
      ) : setup ? (
        <form className="form" onSubmit={enable}>
          <ol className="steps-list">
            <li>Install Google Authenticator or Microsoft Authenticator on your phone.</li>
            <li>In the app, add an account and scan this QR code:</li>
          </ol>
          <img src={setup.qrDataUrl} alt="QR code for authenticator app" className="qr" />
          <p className="muted small">
            Can&apos;t scan? Enter this key manually: <code>{setup.secret.match(/.{1,4}/g)?.join(' ')}</code>
          </p>
          <label>
            3. Enter the 6-digit code shown in the app
            <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required className="code-input" />
          </label>
          <button className="btn btn--gold">Turn on</button>
        </form>
      ) : (
        <>
          <p className="status-line">
            <ShieldOff size={18} /> Off
          </p>
          <p>
            Protect client documents: even if someone learns your password, they can&apos;t sign in without the code from
            your phone.
          </p>
          <button className="btn btn--gold" onClick={start}>
            Set up two-step verification
          </button>
        </>
      )}
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
    </div>
  );
}
