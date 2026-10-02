import { CreditCard, FileSignature, Image, Inbox, KeyRound, LogOut, PenSquare, Quote, Users as UsersIcon } from 'lucide-react';
import { createContext, FormEvent, useContext, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/Blocks';
import { Logo } from '../../components/Logo';
import { api, auth, errorMessage } from '../../lib/api';
import Account from './Account';
import ContentEditor from './ContentEditor';
import Gallery from './Gallery';
import Inquiries from './Inquiries';
import Payments from './Payments';
import Signing from './Signing';
import TestimonialsAdmin from './TestimonialsAdmin';
import Users from './Users';

export interface AdminUser {
  sub: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
}

interface Session {
  user: AdminUser;
  setUser: (u: AdminUser) => void;
}

const SessionContext = createContext<Session | null>(null);
export const useSession = () => useContext(SessionContext)!;

export default function AdminApp() {
  return (
    <div className="admin">
      <title>Admin | G|K Ventures</title>
      <meta name="robots" content="noindex,nofollow" />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="*" element={<Protected />} />
      </Routes>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const body = needsCode ? { ...credentials, code: data.code } : { email: data.email, password: data.password };
    setBusy(true);
    setError('');
    try {
      const res = await api<{ accessToken?: string; twoFactorRequired?: boolean }>('/auth/login', { method: 'POST', body });
      if (res.twoFactorRequired) {
        setCredentials({ email: data.email, password: data.password });
        setNeedsCode(true);
      } else if (res.accessToken) {
        auth.set(res.accessToken);
        navigate('/admin');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="form panel" onSubmit={submit} key={needsCode ? 'code' : 'password'}>
        <Link to="/">
          <Logo />
        </Link>
        <h2>Staff Sign In</h2>
        {needsCode ? (
          <>
            <p className="muted">Enter the 6-digit code from your authenticator app.</p>
            <label>
              Authentication code
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                className="code-input"
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Email
              <input name="email" type="email" required autoComplete="username" />
            </label>
            <label>
              Password
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
          </>
        )}
        {error && <Alert kind="error">{error}</Alert>}
        <button className="btn btn--gold btn--block" disabled={busy}>
          {busy ? 'Signing in...' : needsCode ? 'Verify' : 'Sign In'}
        </button>
        {needsCode && (
          <button type="button" className="btn btn--link" onClick={() => (setNeedsCode(false), setError(''))}>
            Back
          </button>
        )}
      </form>
    </div>
  );
}

const TABS = [
  { to: '', label: 'Inquiries', icon: Inbox },
  { to: 'payments', label: 'Payments', icon: CreditCard },
  { to: 'signing', label: 'E-Signing', icon: FileSignature },
  { to: 'content', label: 'Site Content', icon: PenSquare },
  { to: 'gallery', label: 'Court Gallery', icon: Image },
  { to: 'testimonials', label: 'Testimonials', icon: Quote },
  { to: 'users', label: 'Staff Accounts', icon: UsersIcon, adminOnly: true },
  { to: 'account', label: 'My Account', icon: KeyRound },
];

function Protected() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.token) return;
    api<AdminUser>('/auth/me', { admin: true }).then(setUser).catch(() => undefined);
  }, []);

  if (!auth.token) return <Navigate to="/admin/login" replace />;
  if (!user) return <p className="admin-loading">Loading...</p>;

  const logout = () => {
    auth.set(null);
    navigate('/admin/login');
  };

  // A temporary password must be replaced before anything else is reachable.
  if (user.mustChangePassword) {
    return (
      <SessionContext.Provider value={{ user, setUser }}>
        <div className="admin-login">
          <div className="panel admin-first-run">
            <Logo />
            <h2>Welcome, {user.name}</h2>
            <p>You signed in with a temporary password. Please choose your own password to continue.</p>
            <Account passwordOnly />
            <button className="btn btn--link" onClick={logout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </SessionContext.Provider>
    );
  }

  return (
    <SessionContext.Provider value={{ user, setUser }}>
      <div className="admin-shell">
        <aside className="admin-nav">
          <Link to="/" className="admin-nav__brand">
            <Logo light />
          </Link>
          <nav>
            {TABS.filter((t) => !t.adminOnly || user.role === 'ADMIN').map(({ to, label, icon: Icon }) => (
              <NavLink key={label} to={`/admin/${to}`} end>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-nav__user">
            <span>{user.name}</span>
            <small>{user.role === 'ADMIN' ? 'Administrator' : 'Staff'}</small>
            {!user.twoFactorEnabled && (
              <Link to="/admin/account" className="admin-nav__warn">
                Turn on two-step verification
              </Link>
            )}
            <button className="btn btn--link" onClick={logout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>
        <section className="admin-main">
          <Routes>
            <Route index element={<Inquiries />} />
            <Route path="payments" element={<Payments />} />
            <Route path="signing" element={<Signing />} />
            <Route path="content" element={<ContentEditor />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="testimonials" element={<TestimonialsAdmin />} />
            {user.role === 'ADMIN' && <Route path="users" element={<Users />} />}
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </section>
      </div>
    </SessionContext.Provider>
  );
}

export const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString() : '-');

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pager">
      <button className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages} ({total} total)
      </span>
      <button className="btn btn--outline btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
