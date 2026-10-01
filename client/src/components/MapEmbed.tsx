import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useText } from '../lib/content';
import { CONSENT_EVENT, CONSENT_KEY, readPref, writePref } from '../lib/prefs';

export function MapEmbed() {
  const t = useText();
  const [allowed, setAllowed] = useState(() => readPref<string>(CONSENT_KEY, '') === 'all');

  useEffect(() => {
    const sync = () => setAllowed(readPref<string>(CONSENT_KEY, '') === 'all');
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  const query = encodeURIComponent(t('contact.map.query'));
  if (!allowed) {
    return (
      <div className="map map--placeholder">
        <MapPin size={32} />
        <p>The map is provided by Google and sets third-party cookies.</p>
        <button
          className="btn btn--outline btn--sm"
          onClick={() => {
            writePref(CONSENT_KEY, 'all');
            window.dispatchEvent(new Event(CONSENT_EVENT));
          }}
        >
          Load map
        </button>
      </div>
    );
  }
  return (
    <iframe
      className="map"
      title="G|K Ventures office location"
      src={`https://maps.google.com/maps?q=${query}&z=14&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
