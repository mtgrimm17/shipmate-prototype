const { Wordmark, IconButton, Menu, MenuItem } = window.ShipmateDesignSystem_f314df;

function Globe() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }

function Topbar({ signedIn, onSignIn }) {
  const [menu, setMenu] = React.useState(null);
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--pad-app-gutter)', gap: 20, flexShrink: 0, position: 'relative', zIndex: 200, background: 'var(--bg)', borderBottom: 'var(--border-line)' }}>
      <Wordmark height={40} base="../../assets" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!signedIn && <button onClick={onSignIn} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 'var(--r-lg)', padding: '6px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 'var(--fs-body)', fontWeight: 600, letterSpacing: '0.04em', fontFamily: 'inherit', cursor: 'pointer' }}>Sign In</button>}
        <div style={{ position: 'relative' }}>
          <IconButton label="Change language" active={menu === 'lang'} onClick={() => setMenu(menu === 'lang' ? null : 'lang')}><Globe /></IconButton>
          {menu === 'lang' && <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60 }}><Menu width={190}><MenuItem active>English</MenuItem><MenuItem>简体中文</MenuItem></Menu></div>}
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(menu === 'profile' ? null : 'profile')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text)', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontSize: 'var(--fs-body)', fontWeight: 500, color: 'var(--text-dim)' }}>Developer</span>
          </button>
          {menu === 'profile' && <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60 }}><Menu><MenuItem>Profile settings</MenuItem><MenuItem danger>Sign out</MenuItem></Menu></div>}
        </div>
      </div>
    </header>
  );
}
Object.assign(window, { Topbar });
