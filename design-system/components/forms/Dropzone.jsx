import React from 'react';

export function Dropzone({ label = 'Drop files here', hint, compact, required, style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ border: '1.5px dashed ' + (required ? 'rgba(251,146,60,0.5)' : 'var(--border-hover)'), borderRadius: 'var(--r-xl)', padding: compact ? '16px 20px' : '24px 20px', textAlign: 'center', background: 'var(--panel-2)', cursor: 'pointer', transition: 'all var(--dur-medium)', ...style }} {...rest}>
      <div style={{ fontSize: 20, color: h ? 'var(--text)' : 'var(--text-faint)', marginBottom: 6, fontWeight: 'var(--fw-light)' }}>+</div>
      <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: h ? 'var(--text)' : 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
      {hint ? <div style={{ fontSize: 'var(--fs-tiny)', color: 'var(--text-faint)' }}>{hint}</div> : null}
    </div>
  );
}
