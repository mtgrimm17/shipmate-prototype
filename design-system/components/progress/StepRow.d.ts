import * as React from 'react';
/** A numbered submission step inside a platform card. */
export interface StepRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 1-based step number shown in the ring. */
  index?: number;
  name: string;
  /** Ring fills green and the row drops to 60% opacity. */
  done?: boolean;
  /** Recolours the ring when the step needs a human. @default "default" */
  state?: 'default' | 'risk-warn' | 'risk-high';
  /** 7px dot on the right summarising rejection risk. */
  risk?: 'high' | 'medium' | 'low' | 'none';
  /** Trailing control — a Pill, chevron or Button. */
  right?: React.ReactNode;
}
export declare function StepRow(props: StepRowProps): JSX.Element;
