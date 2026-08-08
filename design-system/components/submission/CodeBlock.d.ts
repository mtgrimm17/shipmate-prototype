import * as React from 'react';
/** A fix the developer can paste. Always copyable — Shipmate never asks anyone to retype XML. */
export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase caption, e.g. "ADD TO PRIVACYINFO.XCPRIVACY". */
  label?: string;
  code: string;
  /** @default 190 */
  maxHeight?: number;
}
export declare function CodeBlock(props: CodeBlockProps): JSX.Element;
