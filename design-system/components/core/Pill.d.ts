import * as React from 'react';
/** Inline build / track pill that sits beside a platform name on a Card. */
export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** neutral = nothing attached, ready = build attached, processing = analysis running. @default "neutral" */
  tone?: 'neutral' | 'ready' | 'processing';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}
export declare function Pill(props: PillProps): JSX.Element;
