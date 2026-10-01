import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

/**
 * Site copy that staff can edit from the admin dashboard (Content tab).
 * The values here are the defaults shown until an edit is saved.
 */
export const EDITABLE_CONTENT = {
  'site.announcement': {
    label: 'Announcement bar (leave empty to hide)',
    default: '',
  },
  'home.hero.headline': {
    label: 'Home - hero headline',
    default: 'Commission for Oaths and Paralegal Service in Alternative Dispute Resolution (ADR) Centre',
  },
  'home.hero.subheadline': {
    label: 'Home - hero subheadline',
    default:
      'Under the ADR Act, 2010 (Act 798). Legal documentation, translation/interpretation, and matrimonial & civil support - for individuals and businesses, handled with care and confidentiality.',
  },
  'home.closing.text': {
    label: 'Home - closing call to action',
    default: "Need legal support today? Reach out and we'll respond promptly.",
  },
  'about.intro': {
    label: 'About - introduction',
    default:
      'G|K Ventures provides Commission for Oaths and Paralegal Service through its Alternative Dispute Resolution (ADR) Centre, operating under the ADR Act, 2010 (Act 798). Led by Gilbert K. Kadawa, the firm supports individuals and businesses across Accra and beyond with legal documentation, translation/interpretation, and matrimonial and civil matters.',
  },
  'about.languages': {
    label: 'About - languages paragraph',
    default:
      'Our combination of hands-on legal process experience and language expertise - English, French, Twi, Ga, and Hausa - ensures clients are understood and properly represented at every step.',
  },
  'about.founder': {
    label: 'About - founder paragraph',
    default:
      "Gilbert K. Kadawa brings direct, first-hand experience of Ghana's court system from his work as a court interpreter. Having worked inside courtrooms - interpreting for parties, witnesses, and the bench - he understands how court processes run in practice, what the courts expect from filed documents, and how to guide clients through each stage with confidence.",
  },
  'gallery.intro': {
    label: 'Court Experience - introduction',
    default:
      "Experience that comes from inside the courtroom. Our founder has served as a court interpreter in Ghana's courts - the same system our clients rely on us to navigate.",
  },
  'contact.hours.weekdays': { label: 'Business hours - Monday to Friday', default: 'Please call to confirm' },
  'contact.hours.saturday': { label: 'Business hours - Saturday', default: 'Please call to confirm' },
  'contact.hours.sunday': { label: 'Business hours - Sunday', default: 'Closed' },
  'contact.map.query': {
    label: 'Google Maps location (address or place name of the office)',
    default: 'Accra North, Accra, Ghana',
  },
} as const;

export type ContentKey = keyof typeof EDITABLE_CONTENT;

interface ContentState {
  values: Record<string, string>;
  setValues: (v: Record<string, string>) => void;
}

const Ctx = createContext<ContentState>({ values: {}, setValues: () => undefined });

export function ContentProvider({ children, initial = {} }: { children: ReactNode; initial?: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  useEffect(() => {
    api<Record<string, string>>('/content')
      .then(setValues)
      .catch(() => undefined); // defaults are fine if the API is down
  }, []);
  return <Ctx.Provider value={{ values, setValues }}>{children}</Ctx.Provider>;
}

export function useText() {
  const { values } = useContext(Ctx);
  return useCallback((key: ContentKey) => values[key] ?? EDITABLE_CONTENT[key].default, [values]);
}

export const useContentStore = () => useContext(Ctx);
