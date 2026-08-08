import * as React from 'react';
/**
 * An Improve Your Submission action card. A saturated header bar states what the
 * issue is and how much it costs; the body explains it and offers Shipmate's
 * replacement beside the developer's current value.
 */
export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase headline, e.g. "PRIVACY MANIFEST MISSING ENTRIES". */
  title: string;
  /** high = rejection, medium = lost reach or revenue, notice = optional. @default "medium" */
  impact?: 'high' | 'medium' | 'notice';
  /** Override the right-hand label. Defaults to "Impact: <Impact>". */
  impactLabel?: string;
  /** Header turns green and gains a check. */
  resolved?: boolean;
  /** 1-based position, shown as "page / pages" in the footer. */
  page?: number;
  /** Total cards in this tab. Omit to hide the pager. */
  pages?: number;
  onPrev?: () => void;
  onNext?: () => void;
  children?: React.ReactNode;
}
export declare function ActionCard(props: ActionCardProps): JSX.Element;

/** Labelled block inside an ActionCard body. */
export interface ActionCardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  children?: React.ReactNode;
}
export declare function ActionCardSection(props: ActionCardSectionProps): JSX.Element;

/** Two-up "Current" vs "ShipMate Suggestion" comparison. The suggestion is purple. */
export interface SuggestionCompareProps extends React.HTMLAttributes<HTMLDivElement> {
  current: React.ReactNode;
  suggestion: React.ReactNode;
  /** Magenta consequence line under the suggestion, e.g. "This will require a new build". */
  caveat?: React.ReactNode;
}
export declare function SuggestionCompare(props: SuggestionCompareProps): JSX.Element;
