import React from 'react';

const check = <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const riskColor = { high: 'var(--magenta)', medium: 'var(--orange)', low: 'var(--green)', none: 'var(--text-faint)' };
export function StepRow({ index, name, done, state = 'default', risk, right, style, ...rest }) {
  const [h, setH] = React.useState(false);
  const numColor = done ? '#fff' : state === 'risk-high' ? 'var(--magenta)' : state === 'risk-warn' ? 'var(--orange)' : 'var(--text-faint)';
  const numBorder = done ? 'var(--green)' : state === 'risk-high' ? 'var(--magenta)' : state === 'risk-warn' ? 'var(--orange)' : 'var(--text-faint)';
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 'var(--pad-row)', cursor: 'pointer', transition: 'background var(--dur-fast)', borderBottom: 'var(--border-line)', background: h ? 'var(--panel-2)' : 'transparent', opacity: done ? (h ? 0.8 : 0.6) : 1, ...style }} {...rest}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid ' + numBorder, background: done ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'var(--fw-bold)', color: numColor, flexShrink: 0, transition: 'all var(--dur-base)' }}>{done ? check : index}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      {risk ? <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: riskColor[risk], opacity: risk === 'none' ? 0.5 : 1 }} /> : null}
      {right}
    </div>
  );
}
