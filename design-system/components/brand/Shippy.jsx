import React from 'react';

export function Shippy({ width = 160, glow = false, float = true, base = '../../assets', style, ...rest }) {
  return (
    <>
      <style>{'@keyframes ds-octo-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'}</style>
      <span style={{ position: 'relative', display: 'inline-block', width, lineHeight: 0, ...style }} {...rest}>
        {glow ? <span style={{ position: 'absolute', left: '-45%', top: '-30%', width: '190%', height: '160%', pointerEvents: 'none', background: 'radial-gradient(50% 50% at 50% 50%, rgba(159,104,240,0.45) 0%, rgba(159,104,240,0.26) 34%, rgba(159,104,240,0.10) 60%, rgba(159,104,240,0.03) 80%, transparent 100%)' }} /> : null}
        <img src={base + '/brand/shippy.svg'} alt="Shippy" style={{ position: 'relative', width: '100%', height: 'auto', display: 'block', animation: float ? 'ds-octo-float var(--octo-float) var(--ease-inout) infinite' : 'none' }} />
      </span>
    </>
  );
}
