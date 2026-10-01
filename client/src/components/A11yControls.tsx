import { Contrast } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readPref, writePref } from '../lib/prefs';

const SIZES = ['100', '112', '125'] as const;
type Size = (typeof SIZES)[number];

/** Adjustable text size and high-contrast mode (brief section 8.4). */
export function A11yControls() {
  const [size, setSize] = useState<Size>(() => readPref<Size>('gk_text_size', '100'));
  const [contrast, setContrast] = useState(() => readPref<string>('gk_contrast', 'off') === 'on');

  useEffect(() => {
    document.documentElement.style.fontSize = `${size}%`;
    writePref('gk_text_size', size);
  }, [size]);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-high-contrast', contrast);
    writePref('gk_contrast', contrast ? 'on' : 'off');
  }, [contrast]);

  return (
    <div className="a11y" role="group" aria-label="Display options">
      {SIZES.map((s, i) => (
        <button
          key={s}
          className={size === s ? 'active' : ''}
          onClick={() => setSize(s)}
          aria-pressed={size === s}
          aria-label={['Normal text size', 'Larger text', 'Largest text'][i]}
          style={{ fontSize: `${0.75 + i * 0.12}rem` }}
        >
          A
        </button>
      ))}
      <button
        className={contrast ? 'active' : ''}
        onClick={() => setContrast(!contrast)}
        aria-pressed={contrast}
        aria-label="High contrast"
        title="High contrast"
      >
        <Contrast size={14} />
      </button>
    </div>
  );
}
