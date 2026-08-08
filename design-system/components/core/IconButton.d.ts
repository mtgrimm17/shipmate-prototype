import * as React from 'react';
/** 40×40 square icon well used in the topbar and project bar (pencil, ···, globe). */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — also the native tooltip. */
  label: string;
  /** Force the hover treatment (e.g. while its menu is open). */
  active?: boolean;
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
