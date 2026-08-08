import * as React from 'react';
/**
 * Pill-shaped action button. Primary is a white fill on dark — Shipmate never
 * uses green for a generic confirm; green is reserved for ship/submit affordances.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. @default "primary" */
  variant?: 'primary' | 'ghost' | 'danger';
  /** @default "md" */
  size?: 'md' | 'sm';
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
