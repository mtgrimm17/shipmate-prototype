import React from 'react';

export function IconButton({ children, label, active, style, ...rest }) {
  const [h, setH] = React.useState(false);
  const on = h || active;
  return (
    <button type="button" aria-label={label} title={label}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--panel-2)' : 'var(--well)', border: '1px solid ' + (on ? 'var(--border)' : 'transparent'), borderRadius: 'var(--r-lg)', cursor: 'pointer', color: on ? 'var(--text)' : 'var(--text-dim)', transition: 'all var(--dur-base)', padding: 0, ...style }}
      {...rest}>{children}</button>
  );
}
