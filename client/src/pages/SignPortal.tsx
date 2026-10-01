import { CheckCircle2, Download, ExternalLink, Eraser, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, PageBanner } from '../components/Blocks';
import { Seo } from '../components/Seo';
import { PdfViewer } from '../components/PdfViewer';
import { SignaturePad, SignaturePadHandle } from '../components/SignaturePad';
import { api, apiBlob, errorMessage } from '../lib/api';

interface SignInfo {
  id: string;
  title: string;
  message: string | null;
  signerName: string;
  status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'CANCELLED';
  expiresAt: string;
  signedAt: string | null;
  originalSha256: string;
}

export default function SignPortal() {
  const { token = '' } = useParams();
  const [info, setInfo] = useState<SignInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [typedName, setTypedName] = useState('');
  const [consent, setConsent] = useState(false);
  const [padEmpty, setPadEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const pad = useRef<SignaturePadHandle>(null);

  const loadDocument = async () => {
    const blob = await apiBlob(`/sign/${token}/document`);
    setPdfData(await blob.arrayBuffer());
    setPdfUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });
  };

  useEffect(() => {
    api<SignInfo>(`/sign/${token}`)
      .then((data) => {
        setInfo(data);
        setTypedName(data.signerName);
        return loadDocument();
      })
      .catch((e) => setLoadError(errorMessage(e)));
  }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pad.current || pad.current.isEmpty()) return setError('Please draw your signature in the box.');
    setSubmitting(true);
    setError('');
    try {
      const res = await api<{ signedAt: string }>(`/sign/${token}`, {
        method: 'POST',
        body: { signatureImage: pad.current.toDataUrl(), typedName, consent },
      });
      setInfo((i) => i && { ...i, status: 'SIGNED', signedAt: res.signedAt });
      await loadDocument();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const signed = info?.status === 'SIGNED';

  return (
    <>
      <Seo title="Review & Sign | G|K Ventures" description="Secure document signing" noindex />
      <PageBanner title="Review & Sign" crumbs={[{ label: 'Sign a Document', to: '/sign-a-document' }, { label: 'Review & Sign' }]} />
      <section className="section">
        <div className="container sign">
          {loadError && <Alert kind="error">{loadError}</Alert>}
          {!info && !loadError && <p className="muted">Loading your document...</p>}
          {info && (
            <>
              <div className="sign__head">
                <div>
                  <span className="overline">Document</span>
                  <h2>{info.title}</h2>
                  <p className="muted">
                    For: {info.signerName}
                    {!signed && <> &middot; Link expires {new Date(info.expiresAt).toLocaleDateString()}</>}
                  </p>
                </div>
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--sm">
                    <ExternalLink size={16} /> Open in new tab
                  </a>
                )}
              </div>
              {info.message && <p className="notice">{info.message}</p>}

              {pdfUrl && pdfData ? (
                <PdfViewer data={pdfData} title={info.title} fallbackUrl={pdfUrl} />
              ) : (
                <p className="muted">Loading document...</p>
              )}

              {signed ? (
                <Alert kind="success">
                  <CheckCircle2 size={18} /> <strong>Signed</strong> on {new Date(info.signedAt!).toLocaleString()}. A copy
                  with the signature certificate has been emailed to you.
                  {pdfUrl && (
                    <p>
                      <a href={pdfUrl} download={`${info.title} - signed.pdf`} className="btn btn--gold btn--sm">
                        <Download size={16} /> Download signed copy
                      </a>
                    </p>
                  )}
                </Alert>
              ) : (
                <form className="form panel" onSubmit={submit}>
                  <h3>Sign this document</h3>
                  <label>
                    Your full name (typed) *
                    <input value={typedName} onChange={(e) => setTypedName(e.target.value)} required minLength={2} maxLength={120} />
                  </label>
                  <div>
                    <div className="sign__pad-head">
                      <span>Draw your signature *</span>
                      <button type="button" className="btn btn--link" onClick={() => pad.current?.clear()}>
                        <Eraser size={14} /> Clear
                      </button>
                    </div>
                    <SignaturePad ref={pad} onChange={setPadEmpty} />
                  </div>
                  <label className="checkbox">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                    <span>
                      I have reviewed the document above and agree to sign it electronically. I understand my electronic
                      signature is intended to have the same effect as my handwritten signature.
                    </span>
                  </label>
                  {error && <Alert kind="error">{error}</Alert>}
                  <button className="btn btn--gold" disabled={submitting || !consent || padEmpty}>
                    <ShieldCheck size={16} /> {submitting ? 'Signing...' : 'Sign Document'}
                  </button>
                  <p className="form__note">
                    Your IP address, browser, time of signing and a SHA-256 fingerprint of the document are recorded for
                    authentication. Document fingerprint: <code>{info.originalSha256.slice(0, 16)}...</code>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
