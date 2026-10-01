import { Paperclip, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../lib/api';
import { SERVICE_OPTIONS, ServiceType } from '../lib/site';
import { Alert } from './Blocks';
import { Turnstile } from './Turnstile';

const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const MAX_FILES = 3;
const MAX_MB = 10;

export function InquiryForm({ defaultService }: { defaultService?: ServiceType }) {
  const [files, setFiles] = useState<File[]>([]);
  const [captcha, setCaptcha] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const onFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length > MAX_FILES) return setError(`You can attach up to ${MAX_FILES} files.`);
    const tooBig = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) return setError(`"${tooBig.name}" is larger than ${MAX_MB} MB.`);
    setError('');
    setFiles(picked);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    form.delete('files');
    files.forEach((f) => form.append('files', f));
    if (captcha) form.set('captchaToken', captcha);
    setStatus('sending');
    setError('');
    try {
      const res = await api<{ reference: string }>('/inquiries', { method: 'POST', form });
      setReference(res.reference);
      setStatus('sent');
      formEl.reset();
      setFiles([]);
    } catch (err) {
      setError(errorMessage(err));
      setStatus('idle');
      setCaptchaReset((n) => n + 1);
    }
  };

  if (status === 'sent') {
    return (
      <Alert kind="success">
        <strong>Thank you - your inquiry has been received.</strong>
        <br />
        Your reference is <b>{reference}</b>. A confirmation has been sent to your email and we will respond promptly.
      </Alert>
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate={false}>
      <div className="form__grid">
        <label>
          Full Name *
          <input name="fullName" required minLength={2} maxLength={120} autoComplete="name" />
        </label>
        <label>
          Phone Number *
          <input name="phone" type="tel" required pattern="^\+?[\d\s()\-]{7,20}$" autoComplete="tel" placeholder="+233 ..." />
        </label>
        <label>
          Email *
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Service Needed *
          <select name="service" required defaultValue={defaultService ?? ''}>
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
      </div>
      <label>
        Message *
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder="Briefly describe your matter or the document you need." />
      </label>
      {/* Honeypot: hidden from people, tempting to bots */}
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="file-input">
        <Paperclip size={16} /> Attach documents (optional - PDF, Word, JPG, PNG; up to {MAX_FILES} files, {MAX_MB} MB each)
        <input name="files" type="file" multiple accept={ACCEPT} onChange={(e) => onFiles(e.target.files)} />
      </label>
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f) => (
            <li key={f.name}>
              {f.name} ({(f.size / 1024 / 1024).toFixed(1)} MB)
            </li>
          ))}
        </ul>
      )}
      <Turnstile onToken={setCaptcha} resetKey={captchaReset} />
      {error && <Alert kind="error">{error}</Alert>}
      <p className="form__note">
        By submitting, you agree to our <Link to="/privacy-policy">Privacy Policy</Link>. Uploaded files are stored
        encrypted and used only to handle your request.
      </p>
      <button className="btn btn--gold" disabled={status === 'sending'}>
        <Send size={16} /> {status === 'sending' ? 'Sending...' : 'Submit Inquiry'}
      </button>
    </form>
  );
}
