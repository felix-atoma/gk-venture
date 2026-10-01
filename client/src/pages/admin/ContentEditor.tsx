import { RotateCcw, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Alert } from '../../components/Blocks';
import { api, errorMessage } from '../../lib/api';
import { ContentKey, EDITABLE_CONTENT, useContentStore } from '../../lib/content';

const KEYS = Object.keys(EDITABLE_CONTENT) as ContentKey[];

export default function ContentEditor() {
  const { setValues } = useContentStore();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Always start from the saved values so a save can't overwrite edits with defaults.
  useEffect(() => {
    api<Record<string, string>>('/content')
      .then((values) => setDraft(Object.fromEntries(KEYS.map((k) => [k, values[k] ?? EDITABLE_CONTENT[k].default]))))
      .catch((e) => setMsg({ kind: 'error', text: errorMessage(e) }));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setMsg(null);
    // Values equal to the built-in default are stored as empty (= use default).
    const entries = Object.fromEntries(KEYS.map((k) => [k, draft[k] === EDITABLE_CONTENT[k].default ? '' : draft[k]]));
    try {
      setValues(await api<Record<string, string>>('/content', { method: 'PUT', body: { entries }, admin: true }));
      setMsg({ kind: 'success', text: 'Saved. Changes are live on the website.' });
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Site Content</h1>
      </div>
      <p className="muted">Edit key wording on the website. Plain text only. Use &quot;Reset&quot; to restore the original wording.</p>
      {!draft && (msg ? <Alert kind={msg.kind}>{msg.text}</Alert> : <p className="muted">Loading...</p>)}
      {draft && (
      <form className="form panel" onSubmit={save}>
        {KEYS.map((k) => {
          const def = EDITABLE_CONTENT[k];
          const long = def.default.length > 80 || k.startsWith('about') || k.endsWith('subheadline');
          return (
            <label key={k}>
              <span className="label-row">
                {def.label}
                {draft[k] !== def.default && (
                  <button type="button" className="btn btn--link" onClick={() => setDraft({ ...draft, [k]: def.default })}>
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </span>
              {long ? (
                <textarea rows={4} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
              ) : (
                <input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
              )}
            </label>
          );
        })}
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <button className="btn btn--gold" disabled={busy}>
          <Save size={16} /> {busy ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      )}
    </>
  );
}
