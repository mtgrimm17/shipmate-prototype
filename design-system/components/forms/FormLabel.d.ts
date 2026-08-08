import * as React from 'react';
/** 10px uppercase field label. A 6px orange dot marks a required field. */
export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Prefix with the orange required dot. */
  required?: boolean;
  /** Trailing tag, e.g. "Optional". */
  hint?: string;
  children?: React.ReactNode;
}
export declare function FormLabel(props: FormLabelProps): JSX.Element;
