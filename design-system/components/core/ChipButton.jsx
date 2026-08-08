import React from 'react';

export function ChipButton({ selected, children, block, style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ flex: block ? 1 : undefined, fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', padding: block ? '7px 10px' : '7px 13px', borderRadius: 'var(--r-md)', border: '1px solid ' + (selected ? 'var(--sel-border)' : 'var(--border)'), background: selected ? 'var(--sel-bg)' : 'var(--panel-2)', color: selected ? 'var(--sel-color)' : (h ? 'var(--text)' : 'var(--text-dim)'), cursor: 'pointer', fontFamily: 'inherit', transition: 'color var(--dur-base), border-color var(--dur-base), background var(--dur-base)', whiteSpace: 'nowrap', textAlign: 'center', ...style }}
      {...rest}>{children}</button>
  );
}
