import * as React from 'react';
/**
 * Shippy, the purple octopus — Shipmate's mascot. A round head with a four-point
 * star on his crown, two oversized eyes with a blue glow rising in each pupil, and
 * five tentacles. Head is #9F68F0 with a violet inner shadow, tentacles are #873AFF
 * with rim light, and the collar runs #512399 → #873AFF. Vector — scales to any size.
 * Idle float is 4.2s ease-in-out, ±6px.
 */
export interface ShippyProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Rendered width in px. @default 160 */
  width?: number;
  /** Soft purple bloom behind him. */
  glow?: boolean;
  /** @default true */
  float?: boolean;
  /** Path to the assets folder, relative to the consuming page. @default "../../assets" */
  base?: string;
}
export declare function Shippy(props: ShippyProps): JSX.Element;
