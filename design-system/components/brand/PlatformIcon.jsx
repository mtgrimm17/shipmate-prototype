import React from 'react';

// Mirrors platformIcon() in the prototype's render.js: iOS, Google Play and Steam
// are inline paths; PlayStation, Xbox and Nintendo are transparent PNGs that the
// brightness/invert filter whitens. Do not filter the first three — their source
// PNGs are opaque and would render as solid white squares.
const ICON_PATHS = {
  ios: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11',
  android: 'M3.18 23.76c.35.2.8.19 1.22-.05l13.32-7.73-3.37-3.47zM.3 1.05C.1 1.39 0 1.8 0 2.24v19.53c0 .44.1.85.3 1.19l.07.07 10.94-10.94v-.26L.37.98zm22.44 9.47l-3.01-1.75-3.71 3.71 3.72 3.72 3.02-1.76c.86-.5.86-1.32-.02-1.92zM4.4.29L17.72 8.02l-3.37 3.47L4.4.29z',
  steam: 'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.663 0-3.015 1.353-3.015 3.015 0 1.663 1.352 3.015 3.015 3.015 1.663 0 3.015-1.352 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z',
};
const EVENODD = new Set(['android', 'steam']);
const ICON_FILES = { psn: 'playstation-white.png', xbox: 'xbox.png', nintendo: 'nintendo.png' };
const SCALE = { ios: 1.15, psn: 1.15 };

export const PLATFORMS = {
  ios:      { label: 'App Store' },
  android:  { label: 'Google Play' },
  steam:    { label: 'Steam Store' },
  psn:      { label: 'PlayStation Store' },
  xbox:     { label: 'Xbox Store' },
  nintendo: { label: 'Nintendo eShop' },
};

export function PlatformIcon({ platform, size = 28, well = false, base = '../../assets', style, ...rest }) {
  const p = PLATFORMS[platform];
  const s = Math.round(size * (SCALE[platform] || 1));
  let glyph = null;
  if (ICON_FILES[platform]) {
    glyph = <img src={base + '/platforms/' + ICON_FILES[platform]} alt={p ? p.label : ''} width={s} height={s}
      style={{ objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }} />;
  } else if (ICON_PATHS[platform]) {
    glyph = <svg width={s} height={s} viewBox="0 0 24 24" overflow="visible" fill="currentColor" aria-label={p.label}
      fillRule={EVENODD.has(platform) ? 'evenodd' : undefined} clipRule={EVENODD.has(platform) ? 'evenodd' : undefined}
      style={{ display: 'block' }}><path d={ICON_PATHS[platform]} /></svg>;
  }
  if (!well) return <span style={{ display: 'inline-flex', color: 'var(--text)', ...style }} {...rest}>{glyph}</span>;
  return (
    <span style={{ width: 40, height: 40, borderRadius: 'var(--r-xl)', background: 'var(--panel-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text)', overflow: 'hidden', ...style }} {...rest}>{glyph}</span>
  );
}
