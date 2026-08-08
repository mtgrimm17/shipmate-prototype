import React from 'react';

export function Shimmer({ short, height, style, ...rest }) {
  return (
    <>
      <style>{'@keyframes ds-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
      <div style={{ height: height || (short ? 36 : 52), width: short ? '65%' : '100%', borderRadius: 'var(--r-lg)', background: 'linear-gradient(90deg,var(--panel-2) 25%,var(--panel-3) 50%,var(--panel-2) 75%)', backgroundSize: '200% 100%', animation: 'ds-shimmer 1.4s infinite', ...style }} {...rest} />
    </>
  );
}
