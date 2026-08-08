import * as React from 'react';
/** Ring spinner. The only loading motion Shipmate uses besides the shimmer. */
export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default 13 */
  size?: number;
  /** processing = amber (build analysis); selection = blue (lookups). @default "selection" */
  tone?: 'selection' | 'processing';
}
export declare function Spinner(props: SpinnerProps): JSX.Element;
