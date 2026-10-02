import { Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SectionTitle } from './Blocks';

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  detail: string | null;
  sortOrder: number;
  published: boolean;
}

/** Client quotes managed in the admin (Testimonials). Renders nothing until at least one is published. */
export function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    api<Testimonial[]>('/testimonials')
      .then(setItems)
      .catch(() => undefined);
  }, []);

  if (items.length === 0) return null;
  return (
    <section className="section">
      <div className="container">
        <SectionTitle overline="Testimonials" title="What our clients say" />
        <div className="grid grid--3">
          {items.map((t) => (
            <figure key={t.id} className="testimonial">
              <Quote size={28} className="testimonial__mark" aria-hidden="true" />
              <blockquote>{t.quote}</blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                {t.detail && <span>{t.detail}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
