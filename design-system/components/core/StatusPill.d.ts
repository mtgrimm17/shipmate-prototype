import * as React from 'react';
/** Release-status pill: what is live on production vs. a pre-release track. */
export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default "prod" */
  tone?: 'prod' | 'pre';
  children?: React.ReactNode;
}
export declare function StatusPill(props: StatusPillProps): JSX.Element;
