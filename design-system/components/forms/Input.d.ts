import * as React from 'react';
/**
 * Text field, textarea or native select — one component, three renderings.
 * When `required` is set and the field is empty the border and fill go amber:
 * Shipmate flags what is missing rather than what is wrong.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** @default "input" */
  as?: 'input' | 'textarea' | 'select';
  /** Show the amber unanswered treatment. */
  required?: boolean;
  children?: React.ReactNode;
}
export declare function Input(props: InputProps): JSX.Element;
