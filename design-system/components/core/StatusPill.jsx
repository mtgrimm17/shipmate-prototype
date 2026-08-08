import React from 'react';

const tones = {
  prod: { color: 'var(--green)', background: 'var(--green-soft)' },
  pre:  { color: 'var(--blue)',  background: 'var(--blue-soft)' },
};
export function StatusPill({ tone = 'prod', children, style, ...rest }) {
  return (
    <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semibold)', letterSpacing: '0.2px', padding: '3px 8px', borderRadius: 'var(--r-full)', whiteSpace: 'nowrap', ...tones[tone], ...style }} {...rest}>{children}</span>
  );
}
