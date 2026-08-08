import React from 'react';

const tones = {
  neutral:    { border: '1.5px solid rgba(255,255,255,0.3)', color: 'var(--text-dim)', background: 'transparent' },
  ready:      { border: '1.5px solid rgba(47,220,128,0.5)', color: 'rgba(47,220,128,0.9)', background: 'rgba(47,220,128,0.08)' },
  processing: { border: '1.5px solid rgba(255,200,80,0.45)', color: 'var(--processing)', background: 'rgba(255,200,80,0.07)' },
};
export function Pill({ tone = 'neutral', icon, children, style, ...rest }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-tiny)', fontWeight: 'var(--fw-medium)', cursor: tone === 'processing' ? 'default' : 'pointer', transition: 'background var(--dur-base), border-color var(--dur-base)', userSelect: 'none', flexShrink: 0, maxWidth: 160, ...tones[tone], ...style }} {...rest}>
      {icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </span>
  );
}
