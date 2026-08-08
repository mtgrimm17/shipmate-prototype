import React from 'react';

export function TooltipIcon({ warned, glyph = '?', title, style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <span title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--panel-3)', border: '1px solid ' + (warned ? 'var(--orange)' : (h ? 'var(--text-faint)' : 'var(--border-hover)')), color: warned ? 'var(--orange)' : (h ? 'var(--text-dim)' : 'var(--text-faint)'), fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', marginLeft: 6, fontWeight: 'var(--fw-bold)', transition: 'border-color var(--dur-base), color var(--dur-base)', verticalAlign: 'middle', ...style }} {...rest}>{glyph}</span>
  );
}
