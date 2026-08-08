import * as React from 'react';
/**
 * Selectable pill used for presets, scenarios and tag strips in onboarding.
 */
export interface ChipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected chips take the blue selection treatment. */
  selected?: boolean;
  /** Stretch to fill an equal-width row (scenario chips). */
  block?: boolean;
  children?: React.ReactNode;
}
export declare function ChipButton(props: ChipButtonProps): JSX.Element;
