import React from 'react';

export function InsightPanel({ title = 'Insights', onBack, children, style, ...rest }) {
  return (
    <aside style={{ width: 258, background: 'var(--panel)', border: 'var(--border-line)', borderRadius: 'var(--r-2xl)', padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 16, ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={onBack} aria-label="Back" style={{ width: 26, height: 26, borderRadius: 'var(--r-md)', border: 'var(--border-line)', background: 'var(--panel-2)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, lineHeight: 1 }}>‹</button>
        <span style={{ fontSize: 'var(--fs-tiny)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: 'var(--ls-header)', color: 'var(--text)' }}>{title}</span>
      </div>
      {children}
    </aside>
  );
}

export function InsightSection({ label, shipmate, children, style, ...rest }) {
  return (
    <div style={{ ...style }} {...rest}>
      <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: shipmate ? 'var(--shipmate-glyph)' : 'var(--text)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)', color: shipmate ? 'var(--shipmate-glyph)' : 'var(--text-dim)' }}>{children}</div>
    </div>
  );
}

export function FixItButton({ children = 'Fix it ship mate!', style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--suggest-border)', background: h ? 'rgba(122,86,174,0.30)' : 'var(--suggest-bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-body)', cursor: 'pointer', transition: 'background var(--dur-base)', ...style }} {...rest}>{children}</button>
  );
}
