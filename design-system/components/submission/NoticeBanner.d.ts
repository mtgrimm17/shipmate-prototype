import * as React from 'react';
/** Full-width yellow notice above a section. Always dismissible — it is never urgent. */
export interface NoticeBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  onDismiss?: () => void;
  /** @default "Dismiss" */
  dismissLabel?: string;
  children?: React.ReactNode;
}
export declare function NoticeBanner(props: NoticeBannerProps): JSX.Element;
