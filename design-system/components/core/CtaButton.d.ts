import * as React from 'react';
/**
 * The marketing-page call to action: brand-green slab, dark ink, IBM Plex Mono.
 * Lifts 2px and gains a concentric green halo on hover.
 */
export interface CtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /** Trailing glyph. Pass null to omit. @default "→" */
  arrow?: React.ReactNode;
}
export declare function CtaButton(props: CtaButtonProps): JSX.Element;
