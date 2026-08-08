import * as React from 'react';
/** Floating dropdown panel — profile menu, language picker, project and version selectors. */
export interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default 180 */
  width?: number;
  children?: React.ReactNode;
}
export declare function Menu(props: MenuProps): JSX.Element;
export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Magenta text; hover fill goes magenta-soft. */
  danger?: boolean;
  active?: boolean;
  children?: React.ReactNode;
}
export declare function MenuItem(props: MenuItemProps): JSX.Element;
