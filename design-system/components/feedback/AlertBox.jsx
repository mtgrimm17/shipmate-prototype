import React from 'react';

export function AlertBox({ title, children, style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: 'var(--alert-bg)', border: '1px solid var(--alert-border)', borderRadius: 'var(--r-lg)', padding: '10px 12px', fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)', color: 'var(--alert-color)', ...style }} {...rest}>
      <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: '50%', background: 'rgba(255,59,118,0.12)', border: '1px solid var(--alert-color)', color: 'var(--alert-color)', fontSize: 10, fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>!</span>
      <span style={{ flex: 1 }}>{title ? <strong style={{ fontWeight: 'var(--fw-bold)' }}>{title} </strong> : null}{children}</span>
    </div>
  );
}
