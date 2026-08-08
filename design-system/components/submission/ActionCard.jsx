import React from 'react';

const BARS = {
  high:   { bg: 'var(--impact-high)',   ink: 'var(--impact-high-ink)' },
  medium: { bg: 'var(--impact-medium)', ink: 'var(--impact-medium-ink)' },
  notice: { bg: 'var(--impact-notice)', ink: 'var(--impact-notice-ink)' },
  done:   { bg: 'var(--impact-done)',   ink: 'var(--impact-done-ink)' },
};
const CHECK = <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#10380c"/><path d="M5.5 10.2l3 3 6-6.4" stroke="#92FE85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

export function ActionCard({ title, impact = 'medium', impactLabel, resolved, page, pages, onPrev, onNext, children, style, ...rest }) {
  const bar = BARS[resolved ? 'done' : impact];
  return (
    <div style={{ border: '1px solid ' + bar.bg, borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--panel)', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 16px', background: bar.bg, color: bar.ink }}>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)' }}>
          {impactLabel || ('Impact: ' + impact.charAt(0).toUpperCase() + impact.slice(1))}
          {resolved ? CHECK : null}
        </span>
      </div>
      <div style={{ padding: '16px 18px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
      {pages ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderTop: 'var(--border-line)' }}>
          <PagerButton onClick={onPrev}>Previous</PagerButton>
          <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-dim)' }}>{page} / {pages}</span>
          <PagerButton onClick={onNext}>Next</PagerButton>
        </div>
      ) : null}
    </div>
  );
}

function PagerButton({ children, ...rest }) {
  const [h, setH] = React.useState(false);
  return <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ minWidth: 128, padding: '7px 16px', borderRadius: 'var(--r-md)', border: '1px solid ' + (h ? 'var(--border-hover)' : 'var(--border)'), background: h ? 'var(--panel-2)' : 'transparent', color: h ? 'var(--text)' : 'var(--text-dim)', fontFamily: 'inherit', fontSize: 'var(--fs-body)', cursor: 'pointer', transition: 'all var(--dur-base)' }} {...rest}>{children}</button>;
}

export function ActionCardSection({ label, children, style, ...rest }) {
  return (
    <div style={{ ...style }} {...rest}>
      {label ? <div style={{ fontSize: 'var(--fs-tiny)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--ls-label)', color: 'var(--text-dim)', marginBottom: 8 }}>{label}</div> : null}
      <div style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text)' }}>{children}</div>
    </div>
  );
}

export function SuggestionCompare({ current, suggestion, caveat, style, ...rest }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, ...style }} {...rest}>
      <div style={{ border: 'var(--border-line)', borderRadius: 'var(--r-lg)', padding: '12px 14px', background: 'var(--panel-2)' }}>
        <div style={{ fontSize: 'var(--fs-tiny)', textTransform: 'uppercase', letterSpacing: 'var(--ls-label)', color: 'var(--text-faint)', marginBottom: 8 }}>Current</div>
        <div style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-dim)' }}>{current}</div>
      </div>
      <div style={{ border: '1px solid var(--suggest-border)', borderRadius: 'var(--r-lg)', padding: '12px 14px', background: 'var(--suggest-bg)' }}>
        <div style={{ fontSize: 'var(--fs-tiny)', color: 'var(--suggest-label)', marginBottom: 8 }}>ShipMate Suggestion</div>
        <div style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text)' }}>{suggestion}</div>
        {caveat ? <div style={{ fontSize: 'var(--fs-body)', color: 'var(--magenta)', marginTop: 10 }}>{caveat}</div> : null}
      </div>
    </div>
  );
}
