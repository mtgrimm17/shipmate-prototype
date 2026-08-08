import React from 'react';

export function FormLabel({ required, children, hint, style, ...rest }) {
  return (
    <label style={{ display: 'block', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: 'var(--ls-label)', color: 'var(--text-dim)', marginBottom: 6, ...style }} {...rest}>
      {required ? <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', marginRight: 6, verticalAlign: 'middle', position: 'relative', top: -1 }} /> : null}
      {children}
      {hint ? <span style={{ marginLeft: 8, fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', background: 'var(--panel-3)', border: 'var(--border-line)', borderRadius: 'var(--r-xs)', padding: '2px 6px' }}>{hint}</span> : null}
    </label>
  );
}
