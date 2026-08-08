const { CtaButton, Wordmark } = window.ShipmateDesignSystem_f314df;

const CARDS = [
  { title: 'Upload\nEssentials', icon: 'mk-upload-essentials.svg', body: 'Add your binary, description and screenshots a single time — no per-store re-entry.' },
  { title: 'Unleash\nShipmate',  icon: 'mk-answer-once.svg',       body: 'Shipmate fills routine fields and builds a clear checklist for each store you target.' },
  { title: 'Ship with\nConfidence', icon: 'mk-ship-everywhere.svg', body: 'Compliance is pre-checked in real time, so you catch issues before the platform does.' },
];

const TENTACLES = [
  { part: 'left',      left: 115.8, top: 153.7, w: 85, h: 66,  dur: '6.1s', delay: '-1.8s', origin: '50% 15%' },
  { part: 'centre',    left: 194.2, top: 145.9, w: 85, h: 114, dur: '5.2s', delay: '0s',    origin: '75% 8%' },
  { part: 'right',     left: 405.8, top: 150.4, w: 73, h: 74,  dur: '6.6s', delay: '-3.1s', origin: '35% 8%' },
  { part: 'rightmost', left: 493.8, top: 233.5, w: 70, h: 85,  dur: '5.8s', delay: '-4.2s', origin: '40% 8%' },
];

function Octo() {
  return (
    <div style={{ position: 'absolute', top: -180, right: 30, width: 500, height: 320, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 266.5, top: 49.1, width: 151, height: 176, zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, animation: 'octo-float 4.2s ease-in-out infinite' }}>
          <img src="../../assets/brand/shippy-body.png" alt="Shippy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </div>
      </div>
      {TENTACLES.map((t) => (
        <div key={t.part} style={{ position: 'absolute', left: t.left, top: t.top, width: t.w, height: t.h, zIndex: 2, transformOrigin: t.origin, animation: `octo-sway ${t.dur} ease-in-out ${t.delay} infinite` }}>
          <img src={'../../assets/brand/shippy-tentacle-' + t.part + '.png'} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </div>
      ))}
    </div>
  );
}

function Card({ title, body, icon, green }) {
  const [h, setH] = React.useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ boxSizing: 'border-box', width: 450, height: 300, background: '#000', borderRadius: 22, padding: '40px 34px', overflow: 'hidden', position: 'relative' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'rgba(255,255,255,0.1)', opacity: h ? 1 : 0, pointerEvents: 'none', transition: h ? 'opacity .3s ease' : 'opacity .12s ease-out' }} />
      <img src={'../../assets/icons/' + icon} alt="" style={{ position: 'absolute', top: 39.5, right: 34, width: 86, height: 86, color: green ? 'var(--green-brand)' : '#fff' }} />
      <h3 style={{ fontFamily: 'var(--font-display-mono)', fontWeight: 500, fontSize: 32, letterSpacing: '0.02em', lineHeight: '42.5px', height: 85, textTransform: 'uppercase', whiteSpace: 'pre-line', margin: 0 }}>{title}</h3>
      <p style={{ marginTop: 22.5, fontSize: 25, fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>{body}</p>
    </div>
  );
}

function Splash({ onStart }) {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>
      <section style={{ textAlign: 'center', marginTop: 40, padding: '0 24px' }}>
        <h1 style={{ fontSize: 118, fontWeight: 500, lineHeight: '132.75px', letterSpacing: '-0.02em', margin: 0 }}>Everything you<br />need to <span style={{ color: 'var(--green-brand)' }}>ship.</span></h1>
        <p style={{ marginTop: 35.25, fontSize: 48.2, lineHeight: '62.4px', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>Get your game on every storefront,<br />in three simple steps.</p>
      </section>

      <section style={{ position: 'relative', width: 'fit-content', margin: '100.6px auto 0' }}>
        <Octo />
        <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden', boxSizing: 'border-box', background: '#343434', border: '2px solid rgba(255,255,255,0.25)', borderRadius: 48, padding: 30, display: 'grid', gridTemplateColumns: 'repeat(3, 450px)', gap: 25 }}>
          <span style={{ content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', background: 'radial-gradient(340px 280px at 88% -4%, rgba(114,123,240,0.65), rgba(114,123,240,0.35) 55%, transparent 74%)' }} />
          {CARDS.map((c, i) => <div key={c.title} style={{ position: 'relative' }}><Card {...c} green={i === 2} /></div>)}
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><CtaButton onClick={onStart}>GET STARTED</CtaButton></div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, marginTop: 44 }}>
        <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)' }}>Available for</span>
        {['mk-appstore', 'mk-googleplay', 'mk-steam'].map((n) => <img key={n} src={'../../assets/icons/' + n + '.svg'} alt="" style={{ height: 32, width: 'auto', opacity: 0.95 }} />)}
        <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)' }}>More soon.</span>
      </div>

      <footer style={{ margin: 'auto 0 40px', paddingTop: 60, textAlign: 'center', fontSize: 18, fontWeight: 500, color: '#eef0f1' }}>
        <img src="../../assets/icons/mk-heart.svg" alt="" style={{ height: 20, verticalAlign: -4, marginRight: 8 }} />
        Built by indie devs and game industry veterans to empower the indie game community.
      </footer>
    </main>
  );
}
Object.assign(window, { Splash });
