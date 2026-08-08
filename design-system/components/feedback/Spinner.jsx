import React from 'react';

export function Spinner({ size = 13, tone = 'selection', style, ...rest }) {
  const color = tone === 'processing' ? 'rgba(255,200,80,0.85)' : 'var(--sel-color)';
  const track = tone === 'processing' ? 'rgba(255,200,80,0.25)' : 'var(--border)';
  return (
    <>
      <style>{'@keyframes ds-spin{to{transform:rotate(360deg)}}'}</style>
      <span style={{ display: 'inline-block', width: size, height: size, border: '2px solid ' + track, borderTopColor: color, borderRadius: '50%', animation: 'ds-spin 0.7s linear infinite', flexShrink: 0, ...style }} {...rest} />
    </>
  );
}
