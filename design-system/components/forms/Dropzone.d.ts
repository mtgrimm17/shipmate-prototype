import * as React from 'react';
/** Dashed upload target for screenshots, icons, key art and binaries. */
export interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  /** Small grey line under the label — size, format or count guidance. */
  hint?: string;
  /** Tighter vertical padding for secondary uploads. */
  compact?: boolean;
  /** Amber dashed border while the requirement is unmet. */
  required?: boolean;
}
export declare function Dropzone(props: DropzoneProps): JSX.Element;
