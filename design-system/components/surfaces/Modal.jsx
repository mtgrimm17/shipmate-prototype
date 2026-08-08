import React from 'react';

export function Modal({ width = 640, children, style, ...rest }) {
  return (
    <>
      <style>{'@keyframes ds-modal-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}'}</style>
      <div style={{ background: 'var(--panel)', border: 'var(--border-line)', borderRadius: 'var(--r-3xl)', width: '100%', maxWidth: width, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-modal)', overflow: 'hidden', animation: 'ds-modal-in 0.25s var(--ease-modal)', ...style }} {...rest}>{children}</div>
    </>
  );
}
export function ModalScrim({ children, style, ...rest }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', backdropFilter: 'var(--scrim-blur)', WebkitBackdropFilter: 'var(--scrim-blur)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24, ...style }} {...rest}>{children}</div>;
}
export function ModalHeader({ title, subtitle, eyebrow, children, style, ...rest }) {
  return (
    <div style={{ padding: '24px 28px 18px', borderBottom: 'var(--border-line)', flexShrink: 0, ...style }} {...rest}>
      {eyebrow ? <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-wordmark)', color: 'var(--text)', marginBottom: 14, textTransform: 'uppercase' }}>{eyebrow}</div> : null}
      {title ? <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-headline)', fontWeight: 'var(--fw-bold)', color: 'var(--text)', marginBottom: 4, letterSpacing: 'var(--ls-title)' }}>{title}</div> : null}
      {subtitle ? <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-dim)', lineHeight: 'var(--lh-normal)' }}>{subtitle}</div> : null}
      {children}
    </div>
  );
}
export function ModalBody({ children, style, ...rest }) {
  return <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--pad-modal-body)', ...style }} {...rest}>{children}</div>;
}
export function ModalFooter({ children, style, ...rest }) {
  return <div style={{ borderTop: 'var(--border-line)', padding: 'var(--pad-modal-foot)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, ...style }} {...rest}>{children}</div>;
}
