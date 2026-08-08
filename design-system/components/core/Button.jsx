import React from 'react';

const base = { padding: '9px 24px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)', fontFamily: 'inherit', transition: 'all var(--dur-base)', display: 'inline-flex', alignItems: 'center', gap: '5px', lineHeight: 1 };
const variants = {
  primary: { background: 'var(--text)', color: 'var(--bg)', fontWeight: 'var(--fw-semibold)' },
  ghost:   { background: 'var(--panel-3)', color: 'var(--text-dim)' },
  danger:  { background: 'var(--magenta)', color: '#fff', fontWeight: 'var(--fw-bold)' },
};
export function Button({ variant = 'primary', size = 'md', disabled, children, style, ...rest }) {
  const sz = size === 'sm' ? { padding: '6px 14px', fontSize: 'var(--fs-small)' } : null;
  return (
    <button type="button" disabled={disabled}
      style={{ ...base, ...variants[variant], ...sz, ...(disabled ? { opacity: 0.4, cursor: 'not-allowed' } : null), ...style }}
      {...rest}>{children}</button>
  );
}
