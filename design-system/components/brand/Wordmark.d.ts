import * as React from 'react';
/**
 * The Shipmate lockup: "Ship" in white, "mate" in brand green, Shippy draped over
 * the top of a black lozenge. Use the image — never set the name in type when the
 * lockup will fit.
 */
export interface WordmarkProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Rendered height in px. 40 in the app topbar, 52 on the splash. @default 40 */
  height?: number;
  /** Path to the assets folder, relative to the consuming page. @default "../../assets" */
  base?: string;
}
export declare function Wordmark(props: WordmarkProps): JSX.Element;
