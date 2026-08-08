import * as React from 'react';
/** Placeholder block shown while Shipmate infers answers for a step. */
export interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 36px tall at 65% width — stands in for a label or short row. */
  short?: boolean;
  height?: number;
}
export declare function Shimmer(props: ShimmerProps): JSX.Element;
