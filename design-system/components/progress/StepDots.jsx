import React from 'react';

export function StepDots({ count = 4, active = 0, style, ...rest }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center', ...style }} {...rest}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ width: i === active ? 18 : 6, height: 6, borderRadius: i === active ? 3 : '50%', background: i === active ? 'var(--green)' : i < active ? 'rgba(74,222,128,0.4)' : 'var(--panel-3)', transition: 'all var(--dur-medium)' }} />
      ))}
    </div>
  );
}
