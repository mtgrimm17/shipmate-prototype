import React from 'react';

export function Card({ ready, children, style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'var(--panel)', border: '1px solid ' + (ready ? (h ? 'rgba(47,220,128,0.75)' : 'rgba(47,220,128,0.55)') : (h ? 'var(--border-hover)' : 'var(--border)')), borderRadius: 'var(--r-2xl)', overflow: 'hidden', transition: 'border-color var(--dur-base)', boxShadow: ready ? 'var(--ring-ready)' : 'none', ...style }} {...rest}>{children}</div>
  );
}
export function CardHeader({ children, style, ...rest }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 12px', gap: 12, borderRadius: 'var(--r-3xl) var(--r-3xl) 0 0', transition: 'background var(--dur-base)', ...style }} {...rest}>{children}</div>;
}
export function CardSection({ children, style, ...rest }) {
  return <div style={{ borderTop: 'var(--border-line)', ...style }} {...rest}>{children}</div>;
}
