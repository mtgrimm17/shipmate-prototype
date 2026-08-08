import React from 'react';

export function Toggle({ checked = false, onChange, disabled, style, ...rest }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      style={{ width: 30, height: 17, borderRadius: 'var(--r-full)', border: 'none', background: checked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'background var(--dur-medium)', outline: 'none', opacity: disabled ? 0.4 : 1, padding: 0, ...style }}
      {...rest}>
      <span style={{ position: 'absolute', width: 13, height: 13, background: checked ? 'var(--text)' : 'rgba(255,255,255,0.6)', borderRadius: '50%', top: 2, left: checked ? 15 : 2, transition: 'left var(--dur-medium) var(--ease-standard), background var(--dur-medium)' }} />
    </button>
  );
}
