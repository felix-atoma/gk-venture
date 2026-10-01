import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Consent, CONSENT_EVENT, CONSENT_KEY, readPref, writePref } from '../lib/prefs';

/** Consent banner tied to the Act 843 privacy policy. Third-party embeds (Google Maps) wait for "Accept all". */
export function CookieBanner() {
  const [choice, setChoice] = useState<Consent>(() => readPref<Consent>(CONSENT_KEY, ''));
  if (choice) return null;

  const decide = (c: Consent) => {
    writePref(CONSENT_KEY, c);
    setChoice(c);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  return (
    <div className="cookie" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>
        We use essential storage to run this site (e.g. your display settings). With your permission we also load
        Google Maps, which sets its own cookies. See our <Link to="/privacy-policy">Privacy Policy</Link>, prepared in
        line with Ghana&apos;s Data Protection Act, 2012 (Act 843).
      </p>
      <div className="cookie__actions">
        <button className="btn btn--outline btn--sm" onClick={() => decide('essential')}>
          Essential only
        </button>
        <button className="btn btn--gold btn--sm" onClick={() => decide('all')}>
          Accept all
        </button>
      </div>
    </div>
  );
}
