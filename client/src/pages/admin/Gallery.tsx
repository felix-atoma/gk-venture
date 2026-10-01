import { Eye, EyeOff, Trash2, Upload } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, errorMessage } from '../../lib/api';
import { GalleryPhoto, photoMeta } from '../CourtExperience';

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<GalleryPhoto[]>('/gallery/all', { admin: true })
      .then(setPhotos)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    setBusy(true);
    setError('');
    try {
      const form = new FormData(formEl);
      form.set('published', String(form.has('published')));
      await api('/gallery', { method: 'POST', form, admin: true });
      formEl.reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const update = (id: string, body: Partial<GalleryPhoto>) =>
    api(`/gallery/${id}`, { method: 'PATCH', body, admin: true })
      .then(load)
      .catch((e) => setError(errorMessage(e)));

  const remove = (id: string) =>
    confirm('Delete this photo permanently?') &&
    api(`/gallery/${id}`, { method: 'DELETE', admin: true })
      .then(load)
      .catch((e) => setError(errorMessage(e)));

  return (
    <>
      <div className="admin-head">
        <h1>Court Experience Gallery</h1>
      </div>
      <Alert kind="info">
        Before publishing, confirm each image is cleared for public use. Court photography can be restricted, and images
        must not identify parties, witnesses, or minors - crop or blur where needed.
      </Alert>
      <form className="form panel" onSubmit={add}>
        <h3>Add a photo</h3>
        <div className="form__grid">
          <label>
            Image (JPG, PNG, WEBP; max 5 MB) *
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
          </label>
          <label>
            Caption *
            <input name="caption" required minLength={2} maxLength={300} />
          </label>
          <label>
            Court
            <input name="court" maxLength={120} placeholder="e.g. Circuit Court, Accra" />
          </label>
          <label>
            Role
            <input name="role" maxLength={120} placeholder="e.g. Court Interpreter (French-English)" />
          </label>
          <label>
            Year
            <input name="year" type="number" min={1950} max={2100} />
          </label>
          <label>
            Display order
            <input name="sortOrder" type="number" defaultValue={0} />
          </label>
        </div>
        <label className="checkbox">
          <input type="checkbox" name="published" value="true" defaultChecked />
          <span>Publish now (I confirm this image is cleared for public use)</span>
        </label>
        {error && <Alert kind="error">{error}</Alert>}
        <button className="btn btn--gold" disabled={busy}>
          <Upload size={16} /> {busy ? 'Uploading...' : 'Add Photo'}
        </button>
      </form>

      <div className="gallery gallery--admin">
        {photos.map((p) => (
          <figure key={p.id} className={`gallery__item ${p.published ? '' : 'gallery__item--hidden'}`}>
            <img src={p.imageUrl} alt={p.caption} />
            <figcaption>
              <strong>{p.caption}</strong>
              <span>{photoMeta(p)}</span>
              <div className="btn-row">
                <button className="btn btn--link" onClick={() => update(p.id, { published: !p.published })}>
                  {p.published ? <EyeOff size={14} /> : <Eye size={14} />} {p.published ? 'Hide' : 'Publish'}
                </button>
                <button className="btn btn--link btn--danger" onClick={() => remove(p.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
