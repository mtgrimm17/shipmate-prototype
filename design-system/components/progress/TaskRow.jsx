import React from 'react';

export function TaskRow({ label, done, style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 'var(--pad-row)', cursor: 'pointer', transition: 'background var(--dur-fast)', background: h ? 'var(--panel-2)' : 'transparent', opacity: done ? 0.55 : 1, ...style }} {...rest}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid ' + (done ? 'var(--green)' : 'var(--text-faint)'), background: done ? 'var(--green)' : 'transparent', flexShrink: 0, position: 'relative' }}>
        {done ? <svg width="8" height="8" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', top: 1, left: 1 }}><path d="M2 6l3 3 5-5" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}
      </span>
      <span style={{ fontSize: 'var(--fs-body)', color: 'inherit', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-faint)', transition: 'color var(--dur-fast)' }}>›</span>
    </div>
  );
}
