import React from 'react';

export function TipBox({ icon = '✦', title, wash = true, children, style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: wash ? 'var(--shipmate-wash), var(--panel)' : 'var(--shipmate-bg)', border: '1px solid var(--shipmate-border)', borderRadius: 'var(--r-lg)', padding: '10px 12px', fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-dim)', ...style }} {...rest}>
      <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: '50%', background: 'rgba(159,104,240,0.14)', border: '1px solid var(--shipmate-glyph)', color: 'var(--shipmate-glyph)', fontSize: 10, fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{icon}</span>
      <span style={{ flex: 1 }}>{title ? <strong style={{ color: 'var(--shipmate-glyph)', fontWeight: 'var(--fw-bold)' }}>{title} </strong> : null}{children}</span>
    </div>
  );
}
