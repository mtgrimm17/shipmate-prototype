const { Card, CardHeader, CardSection, StepRow, Toggle, Pill, StatusPill, ProgressBar, PlatformIcon, PLATFORMS } = window.ShipmateDesignSystem_f314df;

const Check = () => <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Plus = () => <svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;

function PlatformCard({ id, cfg, done, track, onStep, onTrack, onSubmit }) {
  const total = cfg.steps.length;
  const ready = done.length === total;
  const canSubmit = ready && !!track;
  return (
    <Card ready={ready}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PlatformIcon platform={id} well base="../../assets" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{PLATFORMS[id].label}</div>
              <Pill tone={ready ? 'ready' : 'neutral'} icon={ready ? <Check /> : <Plus />}>{ready ? 'GoApeShip-1.4' : 'Upload build'}</Pill>
            </div>
            <div style={{ fontSize: 'var(--fs-tiny)', color: 'var(--text-faint)', marginTop: 3 }}>{done.length} / {total} steps</div>
          </div>
        </div>
        <Toggle checked onChange={() => {}} />
      </CardHeader>
      {cfg.live && <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}><StatusPill tone="prod">Prod: {cfg.live}</StatusPill></div>}
      <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <ProgressBar value={(done.length / total) * 100} />
      </div>
      <CardSection>
        {cfg.steps.map((s, i) => (
          <StepRow key={s} index={i + 1} name={s} done={done.includes(s)}
            state={!done.includes(s) && i === done.length ? 'risk-warn' : 'default'}
            onClick={() => onStep(id, s)} />
        ))}
        <div onClick={canSubmit ? () => onSubmit(id) : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 'var(--pad-row)', opacity: ready ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'default', background: ready ? 'rgba(47,220,128,0.04)' : 'transparent', borderTop: ready ? '1px solid rgba(47,220,128,0.25)' : 'none' }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', flexShrink: 0 }}>{total + 1}</span>
          <span style={{ flex: 1, fontSize: 'var(--fs-body)', fontWeight: 600 }}>Submit</span>
          <span onClick={(e) => { e.stopPropagation(); onTrack(id); }}>
            <Pill tone={track ? 'ready' : 'neutral'} icon={track ? <Check /> : <Plus />}>{track || 'Choose Track'}</Pill>
          </span>
        </div>
      </CardSection>
    </Card>
  );
}

function Dashboard({ data, active, done, tracks, onStep, onTrack, onSubmit, onActivate }) {
  const inactive = Object.keys(data.platforms).filter((p) => !active.includes(p));
  return (
    <div style={{ padding: 'var(--pad-dashboard)', maxWidth: 'var(--w-dashboard)', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 32 }}>
        {active.map((id) => (
          <PlatformCard key={id} id={id} cfg={data.platforms[id]} done={done[id] || []} track={tracks[id]}
            onStep={onStep} onTrack={onTrack} onSubmit={onSubmit} />
        ))}
      </div>
      {inactive.length > 0 && (
        <div>
          <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--ls-section)', color: 'var(--text-faint)', marginBottom: 12, paddingBottom: 8, borderBottom: 'var(--border-line)' }}>Available platforms</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {inactive.map((id) => (
              <button key={id} onClick={() => onActivate(id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--r-lg)', border: 'var(--border-line)', background: 'var(--panel)', color: 'var(--text-dim)', fontFamily: 'inherit', fontSize: 'var(--fs-body)', cursor: 'pointer' }}>
                <PlatformIcon platform={id} size={18} base="../../assets" />
                {PLATFORMS[id].label}
                <span style={{ color: 'var(--text-faint)' }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
Object.assign(window, { Dashboard, PlatformCard });
