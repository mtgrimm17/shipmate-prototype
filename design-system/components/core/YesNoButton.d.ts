import * as React from 'react';
/**
 * The YES / NO answer control in compliance questionnaires. Both answers use the
 * same neutral blue when selected — Shipmate never colours an answer as good or bad.
 */
export interface YesNoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** AI-inferred answer: dims to 50% and gets a ✦ sparkle badge. */
  inferred?: boolean;
  children?: React.ReactNode;
}
export declare function YesNoButton(props: YesNoButtonProps): JSX.Element;
