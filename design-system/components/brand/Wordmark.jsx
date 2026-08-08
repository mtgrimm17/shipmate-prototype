import React from 'react';

export function Wordmark({ height = 40, base = '../../assets', style, ...rest }) {
  return <img src={base + '/logos/shipmate-logo.png'} alt="Shipmate" style={{ height, width: 'auto', display: 'block', objectFit: 'contain', ...style }} {...rest} />;
}
