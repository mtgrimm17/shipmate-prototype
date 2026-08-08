import * as React from 'react';
/**
 * The platform card — the unit the whole dashboard is built from. One card per
 * storefront, holding that platform's steps and its submit affordance.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Every required step is done: the hairline turns brand-green with a 1px ring. */
  ready?: boolean;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { children?: React.ReactNode }
export declare function CardHeader(props: CardHeaderProps): JSX.Element;
/** Hairline-topped region below the header — holds StepRow / TaskRow lists. */
export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> { children?: React.ReactNode }
export declare function CardSection(props: CardSectionProps): JSX.Element;
