import * as React from 'react';
/** 15px circled glyph that carries a regulatory or platform-rule explanation. */
export interface TooltipIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Turn the ring orange when the tooltip carries a warning. */
  warned?: boolean;
  /** @default "?" */
  glyph?: string;
  title?: string;
}
export declare function TooltipIcon(props: TooltipIconProps): JSX.Element;
