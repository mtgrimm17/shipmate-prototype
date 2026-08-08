import * as React from 'react';
/** 30×17 switch. Deliberately colourless — on-state is white at 30%, not green. */
export interface ToggleProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Toggle(props: ToggleProps): JSX.Element;
