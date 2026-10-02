import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { Testimonial } from '../../components/Testimonials';
import { api, errorMessage } from '../../lib/api';

export default function TestimonialsAdmin() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<Testimonial[]>('/testimonials/all', { admin: true })
      .then(setItems)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    setError('');
    try {
      await api('/testimonials', {
        method: 'POST',
        body: {
          quote: form.get('quote'),
          name: form.get('name'),
          detail: form.get('detail'),
          sortOrder: Number(form.get('sortOrder') || 0),
          published: form.has('published'),
        },
        admin: true,
      });
      formEl.reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const update = (id: string, body: Partial<Testimonial>) =>
    api(`/testimonials/${id}`, { method: 'PATCH', body, admin: true })
      .then(load)
      .catch((e) => setError(errorMessage(e)));

  const remove = (id: string) =>
    confirm('Delete this testimonial permanently?') &&
    api(`/testimonials/${id}`, { method: 'DELETE', admin: true })
      .then(load)
      .catch((e) => setError(errorMessage(e)));

  return (
    <>
      <div className="admin-head">
        <h1>Testimonials</h1>
      </div>
      <Alert kind="info">
        Only publish words a client has agreed to share. Use first names or initials (e.g. &quot;Ama K.&quot;) unless the
        client is happy to be named in full. The section appears on the home page once one testimonial is published.
      </Alert>
      <form className="form panel" onSubmit={add}>
        <h3>Add a testimonial</h3>
        <label>
          What the client said *
          <textarea name="quote" required minLength={10} maxLength={600} rows={3} />
        </label>
        <div className="form__grid">
          <label>
            Client name *
            <input name="name" required minLength={2} maxLength={120} placeholder="e.g. Ama K." />
          </label>
          <label>
            Detail
            <input name="detail" maxLength={120} placeholder="e.g. Affidavit client, Accra" />
          </label>
          <label>
            Display order
            <input name="sortOrder" type="number" defaultValue={0} />
          </label>
        </div>
        <label className="checkbox">
          <input type="checkbox" name="published" defaultChecked />
          <span>Show on the website (the client agreed to share this)</span>
        </label>
        {error && <Alert kind="error">{error}</Alert>}
        <button className="btn btn--gold" disabled={busy}>
          <Plus size={16} /> {busy ? 'Saving...' : 'Add Testimonial'}
        </button>
      </form>

      {items.length === 0 && <p className="muted">No testimonials yet.</p>}
      <div className="admin-list">
        {items.map((t) => (
          <article key={t.id} className={`admin-item testimonial-admin ${t.published ? '' : 'testimonial-admin--hidden'}`}>
            <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
            <p>
              <strong>{t.name}</strong>
              {t.detail && <span className="muted"> &middot; {t.detail}</span>}
              {!t.published && <span className="badge"> HIDDEN</span>}
            </p>
            <div className="btn-row">
              <button className="btn btn--link" onClick={() => update(t.id, { published: !t.published })}>
                {t.published ? <EyeOff size={14} /> : <Eye size={14} />} {t.published ? 'Hide' : 'Publish'}
              </button>
              <button className="btn btn--link btn--danger" onClick={() => remove(t.id)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
