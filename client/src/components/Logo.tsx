import { useState } from 'react';

/**
 * Uses the firm's real logo when /logo.png is present in client/public;
 * otherwise renders a typographic wordmark in the brand colours.
 */
export function Logo({ light = false }: { light?: boolean }) {
  const [missing, setMissing] = useState(false);
  if (!missing) {
    return (
      <img
        src={light ? '/logo-light.png' : '/logo.png'}
        alt="G|K Ventures"
        className="logo-img"
        onError={() => setMissing(true)}
      />
    );
  }
  return (
    <span className={`wordmark ${light ? 'wordmark--light' : ''}`} aria-label="G|K Ventures">
      <span className="wordmark__gk">
        G<ScalesMark />K
      </span>
      <span className="wordmark__sub">VENTURES</span>
    </span>
  );
}

export function ScalesMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="scales-mark">
      <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="32" y1="6" x2="32" y2="56" />
        <line x1="12" y1="16" x2="52" y2="16" />
        <line x1="22" y1="56" x2="42" y2="56" />
        <path d="M12 16 L5 34 H19 Z" />
        <path d="M52 16 L45 34 H59 Z" />
      </g>
    </svg>
  );
}
