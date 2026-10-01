import { useEffect, useRef, useState } from 'react';

interface Props {
  data: ArrayBuffer;
  title: string;
  /** Blob URL used when PDF.js can't render (very old browsers): falls back to the browser's own viewer. */
  fallbackUrl: string;
}

/**
 * Renders every page of a PDF to canvases sized to the container, so documents display
 * on phones whose browsers can't show PDFs inline. PDF.js is loaded on demand (legacy build
 * for older Android browsers) and only on pages that use this component.
 */
export function PdfViewer({ data, title, fallbackUrl }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pageCount, setPageCount] = useState(0);

  // Measure the outer box, which never scrolls: measuring the scroller itself would loop
  // (pages render -> scrollbar appears -> width shrinks -> re-render -> scrollbar disappears ...).
  // Re-render only when the width changes meaningfully (rotation, resize), not on every pixel.
  useEffect(() => {
    const el = wrap.current!;
    const measure = () => setWidth(Math.floor(el.clientWidth / 40) * 40);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const { default: workerSrc } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

        // PDF.js takes ownership of the buffer it's given, so pass a copy.
        const task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
        destroy = () => void task.destroy();
        const doc = await task.promise;
        if (cancelled) return;
        setPageCount(doc.numPages);

        const container = pagesRef.current!;
        container.replaceChildren();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const viewport = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * ratio });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = 'pdf-page';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${title} - page ${n} of ${doc.numPages}`);
          container.appendChild(canvas);
          await page.render({ canvas, viewport }).promise;
          if (n === 1) setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('PDF render failed', err);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [data, width, title]);

  return (
    <div ref={wrap} className="pdf-viewer">
      {status === 'error' ? (
        <iframe className="pdf-frame" src={fallbackUrl} title={title} />
      ) : (
        <>
          {pageCount > 1 && <p className="pdf-viewer__count">{pageCount} pages - scroll to read the whole document</p>}
          <div className="pdf-viewer__scroll">
            {status === 'loading' && <p className="muted pdf-viewer__loading">Loading document...</p>}
            <div ref={pagesRef} className="pdf-viewer__pages" />
          </div>
        </>
      )}
    </div>
  );
}
