import * as React from 'react';
/**
 * A Shipmate tip — advice, pre-filled inference, or a heads-up about a platform
 * quirk. Purple: this is the product speaking on the developer's behalf. Orange
 * is reserved for "you still need to answer this"; magenta for real risk.
 */
export interface TipBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default "✦" — use "!" for a heads-up. */
  icon?: string;
  /** Left-to-right purple wash behind the panel. Turn off inside dense forms. @default true */
  wash?: boolean;
  /** Bold orange lead-in, e.g. "Shipmate tip". */
  title?: string;
  children?: React.ReactNode;
}
export declare function TipBox(props: TipBoxProps): JSX.Element;
