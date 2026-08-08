import * as React from 'react';
/**
 * The right-hand Insights rail beside a questionnaire. Explains what a category
 * expects, links the platform's own documentation, then gives Shipmate's
 * recommendation in purple with a one-click fix.
 */
export interface InsightPanelProps extends React.HTMLAttributes<HTMLElement> {
  /** @default "Insights" */
  title?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}
export declare function InsightPanel(props: InsightPanelProps): JSX.Element;

/** One labelled block in the rail. `shipmate` turns the whole block purple. */
export interface InsightSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  /** Mark this as Shipmate's own recommendation rather than platform fact. */
  shipmate?: boolean;
  children?: React.ReactNode;
}
export declare function InsightSection(props: InsightSectionProps): JSX.Element;

/** The purple one-click remediation button at the foot of an insight. */
export interface FixItButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}
export declare function FixItButton(props: FixItButtonProps): JSX.Element;
