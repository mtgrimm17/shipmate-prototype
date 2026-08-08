import * as React from 'react';
/**
 * Storefront mark. All seven marks ship as white-on-transparent PNGs and are
 * normalised with `brightness(0) invert(1)` so mixed-format logos read the same.
 */
export interface PlatformIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  platform: 'ios' | 'android' | 'steam' | 'psn' | 'xbox' | 'nintendo';
  /** Glyph size in px. @default 28 */
  size?: number;
  /** Wrap in the 40px panel-3 rounded well used on card headers. */
  well?: boolean;
  /** Path to the assets folder, relative to the consuming page. @default "../../assets" */
  base?: string;
}
export declare function PlatformIcon(props: PlatformIconProps): JSX.Element;
export declare const PLATFORMS: Record<string, { label: string; file: string }>;
