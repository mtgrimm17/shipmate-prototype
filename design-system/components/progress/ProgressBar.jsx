import React from 'react';

export function ProgressBar({ value = 0, style, ...rest }) {
  return (
    <div style={{ flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', background: 'rgba(74,222,128,0.15)', ...style }} {...rest}>
      <div style={{ height: '100%', width: Math.max(0, Math.min(100, value)) + '%', borderRadius: 2, transition: 'width var(--dur-bar) var(--ease-standard)', background: 'var(--green)' }} />
    </div>
  );
}
