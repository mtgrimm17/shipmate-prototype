import React from 'react';

export function Input({ as = 'input', required, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const s = { width: '100%', padding: '9px 12px', border: '1px solid ' + (focus ? 'var(--text-faint)' : (required ? 'rgba(251,146,60,0.4)' : 'var(--border)')), borderRadius: 'var(--r-md)', fontSize: 'var(--fs-body)', fontFamily: 'inherit', color: 'var(--text)', background: required && !focus ? 'rgba(251,146,60,0.03)' : 'var(--bg)', transition: 'border-color var(--dur-slow), background var(--dur-slow), box-shadow var(--dur-slow)', outline: 'none', boxShadow: focus && required ? 'var(--ring-required)' : 'none', ...style };
  const handlers = { onFocus: () => setFocus(true), onBlur: () => setFocus(false) };
  if (as === 'textarea') return <textarea {...handlers} style={{ ...s, resize: 'vertical', lineHeight: 'var(--lh-normal)', minHeight: 72 }} {...rest} />;
  if (as === 'select') return <select {...handlers} style={{ ...s, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center', paddingRight: 30, cursor: 'pointer' }} {...rest} />;
  return <input {...handlers} style={s} {...rest} />;
}
