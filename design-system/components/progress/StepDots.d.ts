import * as React from 'react';
/** Onboarding pagination dots. The active dot stretches into an 18px capsule. */
export interface StepDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default 4 */
  count?: number;
  /** 0-based. @default 0 */
  active?: number;
}
export declare function StepDots(props: StepDotsProps): JSX.Element;
