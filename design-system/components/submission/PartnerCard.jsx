import React from 'react';

export function PartnerCard({ name, description, href = '#', logo, style, ...rest }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ border: '1px solid ' + (h ? 'var(--border-hover)' : 'var(--border)'), borderRadius: 'var(--r-xl)', background: 'var(--panel)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color var(--dur-base)', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', background: logo ? 'transparent' : 'var(--link)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', flexShrink: 0, overflow: 'hidden' }}>{logo || (name || '?').charAt(0)}</span>
        <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--text)' }}>{name}</span>
      </div>
      <p style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-dim)', margin: 0 }}>{description}</p>
      <a href={href} style={{ alignSelf: 'flex-end', fontSize: 'var(--fs-body)', color: 'var(--link)', textDecoration: 'none' }}>Partner Website ↗</a>
    </div>
  );
}
