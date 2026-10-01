import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CtaBand, PageBanner, SectionTitle } from '../components/Blocks';
import { Seo } from '../components/Seo';
import { api } from '../lib/api';
import { useText } from '../lib/content';

export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string;
  court: string | null;
  role: string | null;
  year: number | null;
  sortOrder: number;
  published: boolean;
}

export const photoMeta = (p: GalleryPhoto) => [p.court, p.role, p.year].filter(Boolean).join(' · ');

export default function CourtExperience() {
  const t = useText();
  const [photos, setPhotos] = useState<GalleryPhoto[] | null>(null);
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    api<GalleryPhoto[]>('/gallery')
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Seo
        title="Court Experience | Court Interpreter Twi, Ga, Hausa - G|K Ventures"
        description="Photographs of Gilbert K. Kadawa's work as a court interpreter in Ghana's courts - experience that comes from inside the courtroom."
      />
      <PageBanner title="Court Experience" crumbs={[{ label: 'About Us', to: '/about' }, { label: 'Court Experience' }]} />
      <section className="section">
        <div className="container">
          <SectionTitle overline="Inside the Courtroom" title="Court Experience">
            {t('gallery.intro')}
          </SectionTitle>
          {photos === null && <p className="center muted">Loading gallery...</p>}
          {photos?.length === 0 && <p className="center muted">Photographs will be published here soon.</p>}
          <div className="gallery">
            {photos?.map((p) => (
              <figure key={p.id} className="gallery__item">
                <button onClick={() => setActive(p)} aria-label={`Enlarge: ${p.caption}`}>
                  <img src={p.imageUrl} alt={p.caption} loading="lazy" />
                </button>
                <figcaption>
                  <strong>{p.caption}</strong>
                  {photoMeta(p) && <span>{photoMeta(p)}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={active.caption} onClick={() => setActive(null)}>
          <button className="lightbox__close" aria-label="Close">
            <X />
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={active.imageUrl} alt={active.caption} />
            <figcaption>
              {active.caption}
              {photoMeta(active) && ` - ${photoMeta(active)}`}
            </figcaption>
          </figure>
        </div>
      )}
      <CtaBand />
    </>
  );
}
