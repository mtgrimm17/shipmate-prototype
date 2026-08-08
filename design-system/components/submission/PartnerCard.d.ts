import * as React from 'react';
/** A localization, marketing, press or QA partner Shipmate can hand the developer off to. */
export interface PartnerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  /** Three lines maximum. */
  description: string;
  href?: string;
  /** Partner mark. Falls back to the first letter on a blue tile. */
  logo?: React.ReactNode;
}
export declare function PartnerCard(props: PartnerCardProps): JSX.Element;
