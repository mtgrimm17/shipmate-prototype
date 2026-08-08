import React from 'react';

export function YesNoButton({ selected, inferred, children, style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: 'relative', padding: '5px 14px', borderRadius: 'var(--r-md)', border: '1px solid ' + (selected ? 'var(--sel-color)' : (h ? 'var(--border-hover)' : 'var(--border)')), background: selected ? (h ? 'var(--sel-bg-strong)' : 'var(--sel-bg)') : 'var(--panel-3)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.8px', cursor: 'pointer', transition: 'all var(--dur-base)', fontFamily: 'inherit', color: selected ? 'var(--sel-color)' : (h ? 'var(--text-dim)' : 'var(--text-faint)'), textAlign: 'center', minWidth: 52, opacity: selected && inferred ? 0.5 : 1, ...style }}
      {...rest}>
      {children}
      {inferred ? <span style={{ position: 'absolute', top: -6, right: -5, fontSize: 9, lineHeight: 1, color: 'var(--shipmate-glyph)', pointerEvents: 'none', textShadow: '0 0 3px rgba(0,0,0,0.45)' }}>✦</span> : null}
    </button>
  );
}
