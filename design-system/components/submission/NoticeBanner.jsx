import React from 'react';

export function NoticeBanner({ children, onDismiss, dismissLabel = 'Dismiss', style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'var(--impact-notice)', color: 'var(--impact-notice-ink)', borderRadius: 'var(--r-lg)', padding: '12px 14px', fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-normal)', ...style }} {...rest}>
      <span style={{ flex: 1 }}>{children}</span>
      {onDismiss ? <button type="button" onClick={onDismiss} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--r-md)', border: 'none', background: 'rgba(0,0,0,0.14)', color: 'rgba(36,27,6,0.65)', fontFamily: 'inherit', fontSize: 'var(--fs-body)', cursor: 'pointer' }}>{dismissLabel}</button> : null}
    </div>
  );
}
