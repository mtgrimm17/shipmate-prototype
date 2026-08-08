import * as React from 'react';
/**
 * 3px completion bar for a platform card. Green track at 15%, green fill.
 */
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. */
  value?: number;
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
