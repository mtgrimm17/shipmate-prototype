import * as React from 'react';
/** Modal shell: 14px radius panel, deep shadow, 0.25s rise-and-settle entrance. */
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max width in px. 640 for step and onboarding modals, 460 for confirms. @default 640 */
  width?: number;
  children?: React.ReactNode;
}
export declare function Modal(props: ModalProps): JSX.Element;
/** Fixed 75%-black scrim with a 4px backdrop blur. */
export interface ModalScrimProps extends React.HTMLAttributes<HTMLDivElement> { children?: React.ReactNode }
export declare function ModalScrim(props: ModalScrimProps): JSX.Element;
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  /** Uppercase wordmark line above the title. */
  eyebrow?: string;
  children?: React.ReactNode;
}
export declare function ModalHeader(props: ModalHeaderProps): JSX.Element;
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> { children?: React.ReactNode }
export declare function ModalBody(props: ModalBodyProps): JSX.Element;
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> { children?: React.ReactNode }
export declare function ModalFooter(props: ModalFooterProps): JSX.Element;
