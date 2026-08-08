import React from 'react';

export function Menu({ children, width = 180, style, ...rest }) {
  return (
    <>
      <style>{'@keyframes ds-fade-down{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}'}</style>
      <div style={{ minWidth: width, background: 'var(--panel)', border: 'var(--border-line)', borderRadius: 'var(--r-xl)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: 'var(--shadow-dropdown)', animation: 'ds-fade-down var(--dur-base) var(--ease)', ...style }} {...rest}>{children}</div>
    </>
  );
}
export function MenuItem({ danger, active, children, style, ...rest }) {
  const [h, setH] = React.useState(false);
  const on = h || active;
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 'var(--fs-body)', fontFamily: 'inherit', background: on ? (danger ? 'var(--magenta-soft)' : 'var(--panel-2)') : 'transparent', border: 'none', textAlign: 'left', color: danger ? 'var(--magenta)' : 'var(--text)', transition: 'background var(--dur-fast)', width: '100%', fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-regular)', ...style }}
      {...rest}>{children}</button>
  );
}
