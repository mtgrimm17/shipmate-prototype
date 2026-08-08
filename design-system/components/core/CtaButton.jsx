import React from 'react';

export function CtaButton({ children = 'GET STARTED', arrow = '→', style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ boxSizing: 'border-box', width: 320, height: 68, fontFamily: 'var(--font-display-mono)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-mk-cta)', letterSpacing: 'var(--ls-cta)', color: 'var(--text-on-green)', background: 'var(--green-brand)', border: 'none', borderRadius: 'var(--r-xl)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 16, transition: 'transform var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease)', transform: hover ? 'translateY(-2px)' : 'none', boxShadow: hover ? 'var(--glow-cta)' : 'none', ...style }}
      {...rest}>{children}{arrow ? <span style={{ fontSize: 22 }}>{arrow}</span> : null}</button>
  );
}
