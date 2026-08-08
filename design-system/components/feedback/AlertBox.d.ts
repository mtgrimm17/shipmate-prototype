import * as React from 'react';
/** Rejection-risk warning. Same anatomy as TipBox, magenta instead of orange. */
export interface AlertBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bold lead-in, e.g. "Rejection risk". */
  title?: string;
  children?: React.ReactNode;
}
export declare function AlertBox(props: AlertBoxProps): JSX.Element;
