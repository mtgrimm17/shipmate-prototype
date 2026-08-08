import * as React from 'react';
/** Lightweight checklist row used by generic platforms that have no numbered flow. */
export interface TaskRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  done?: boolean;
}
export declare function TaskRow(props: TaskRowProps): JSX.Element;
