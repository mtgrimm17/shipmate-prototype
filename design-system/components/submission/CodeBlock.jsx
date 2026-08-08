import React from 'react';

export function CodeBlock({ label, code, maxHeight = 190, style, ...rest }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => { try { navigator.clipboard.writeText(code); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return (
    <div style={{ ...style }} {...rest}>
      {label ? <div style={{ fontSize: 'var(--fs-tiny)', textTransform: 'uppercase', letterSpacing: 'var(--ls-label)', color: 'var(--text-faint)', marginBottom: 6 }}>{label}</div> : null}
      <div style={{ position: 'relative', background: 'rgba(0,0,0,0.35)', border: 'var(--border-line)', borderRadius: 'var(--r-md)', padding: '10px 12px', maxHeight, overflow: 'auto' }}>
        <button type="button" onClick={copy}
          style={{ position: 'absolute', top: 8, right: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: copied ? 'var(--green)' : 'var(--text-dim)', fontFamily: 'inherit', fontSize: 'var(--fs-small)', cursor: 'pointer' }}>
          {copied ? 'Copied' : 'Copy Code'}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1"/></svg>
        </button>
        <pre style={{ margin: 0, fontFamily: 'var(--font-code)', fontSize: 'var(--fs-tiny)', lineHeight: 'var(--lh-normal)', color: 'var(--text)', whiteSpace: 'pre' }}>{code}</pre>
      </div>
    </div>
  );
}
