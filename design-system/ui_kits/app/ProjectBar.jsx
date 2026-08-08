const { IconButton } = window.ShipmateDesignSystem_f314df;

function Selector({ title, bold, width, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, background: h ? 'var(--panel-2)' : 'var(--well)', border: '1px solid ' + (h ? 'var(--border)' : 'transparent'), borderRadius: 'var(--r-lg)', height: 40, padding: '0 16px', minWidth: width, cursor: 'pointer', transition: 'border-color var(--dur-base), background var(--dur-base)', fontFamily: 'inherit', color: 'var(--text)', textAlign: 'left' }}>
      <span style={{ flex: 1, fontWeight: bold ? 700 : 400, fontSize: 'var(--fs-base)' }}>{title}</span>
      <span style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-base)' }}>⌄</span>
    </button>
  );
}

function ProjectBar({ project, version, onEdit }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', margin: '0 24px 16px', gap: 8, background: 'var(--panel)', border: 'var(--border-line)', borderRadius: 'var(--r-2xl)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Selector title={project} bold width={200} />
        <IconButton label="Edit game details" onClick={onEdit}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></IconButton>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Selector title={version} width={180} />
        <IconButton label="Version options"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></IconButton>
      </div>
    </div>
  );
}
Object.assign(window, { ProjectBar });
