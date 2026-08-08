const { ModalScrim, Modal, ModalHeader, ModalBody, ModalFooter, Button, StepDots, FormLabel, Input, Dropzone, ChipButton, TipBox, PlatformIcon, PLATFORMS } = window.ShipmateDesignSystem_f314df;

const TABS = ['About', 'Distribution', 'Assets', 'Compliance'];

function Tabs({ index, onPick, progress }) {
  return (
    <div style={{ display: 'flex', borderBottom: 'var(--border-line)', flexShrink: 0 }}>
      {TABS.map((t, i) => (
        <button key={t} onClick={() => onPick(i)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '16px 8px 13px', fontSize: 'var(--fs-micro)', fontWeight: 600, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: i === index ? 'var(--text)' : 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', position: 'relative', overflow: 'hidden' }}>
          <img src={'../../assets/icons/icon-' + ['about','distribution','assets','compliance'][i] + '.png'} alt="" width="18" height="18" style={{ opacity: i === index ? 1 : 0.35, transition: 'opacity var(--dur-base)' }} />
          {t}
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: i === index ? 'var(--blue-soft)' : 'rgba(255,255,255,0.05)' }} />
          <span style={{ position: 'absolute', left: 0, bottom: 0, height: 2, width: (i < index ? 100 : i === index ? progress : 0) + '%', background: 'var(--blue)', transition: 'width 0.5s var(--ease-overshoot)' }} />
        </button>
      ))}
    </div>
  );
}

function Onboarding({ onDone, onClose }) {
  const [tab, setTab] = React.useState(0);
  const [preset, setPreset] = React.useState('Everywhere');
  const [picked, setPicked] = React.useState(['ios', 'android', 'steam']);
  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  return (
    <ModalScrim style={{ paddingTop: 80, alignItems: 'flex-start' }}>
      <Modal style={{ height: 'min(760px, calc(100vh - 104px))' }}>
        <ModalHeader eyebrow="Shipmate" title="Let's get your game ready" subtitle="We'll collect the essentials once — then you focus on each platform." />
        <Tabs index={tab} onPick={setTab} progress={60} />
        <ModalBody style={{ overflowX: 'hidden' }}>
          {tab === 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <TipBox title="Shipmate tip">We found Go Ape Ship! on IGDB and pre-filled six fields. Review anything marked ✦ before you submit.</TipBox>
            <div><FormLabel required>Game Title</FormLabel><Input defaultValue="Go Ape Ship!" /></div>
            <div><FormLabel required>Description</FormLabel><Input as="textarea" defaultValue="A four-player couch brawler about primates, physics and very bad decisions." style={{ minHeight: 88 }} /></div>
            <div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--ls-section)', color: 'var(--text-faint)', marginBottom: 12 }}>Target Platforms</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.keys(PLATFORMS).map((id) => (
                  <ChipButton key={id} selected={picked.includes(id)} onClick={() => toggle(id)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><PlatformIcon platform={id} size={14} base="../../assets" />{PLATFORMS[id].label}</span>
                  </ChipButton>
                ))}
              </div>
            </div>
          </div>}
          {tab === 1 && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--ls-section)', color: 'var(--text-faint)', marginBottom: 12 }}>Distribution</div>
              <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-dim)', marginBottom: 10 }}>Where do you intend to make the game available?</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Everywhere', 'English only', 'Minimize regulation', 'Custom'].map((p) => <ChipButton key={p} selected={preset === p} onClick={() => setPreset(p)}>{p}</ChipButton>)}
              </div>
            </div>
            <TipBox icon="!" title="Heads up">Shipping to Brazil and South Korea adds two local rating boards on top of IARC.</TipBox>
            <div><FormLabel>Primary language</FormLabel><Input as="select" defaultValue="en"><option value="en">English</option><option>简体中文</option></Input></div>
          </div>}
          {tab === 2 && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FormLabel required>Screenshots</FormLabel><Dropzone label="Drop screenshots" hint="PNG or JPG · at least 3 per device size" required /></div>
            <div><FormLabel hint="Optional">Trailer</FormLabel><Input placeholder="https://youtube.com/watch?v=…" /></div>
            <div><FormLabel required>App icon</FormLabel><Dropzone compact label="Drop a 1024×1024 icon" hint="No alpha channel, no rounded corners" /></div>
          </div>}
          {tab === 3 && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FormLabel required>Privacy Policy URL</FormLabel><Input defaultValue="https://goapeship.com/privacy" /></div>
            <TipBox title="Shipmate tip">Every storefront you picked requires a reachable privacy policy. We check the URL resolves before you submit.</TipBox>
            <div><FormLabel>Publisher entity</FormLabel><Input as="select" defaultValue="1"><option value="1">Simian Softworks Ltd.</option></Input></div>
          </div>}
        </ModalBody>
        <ModalFooter>
          <StepDots count={4} active={tab} />
          <div style={{ display: 'flex', gap: 10 }}>
            {tab > 0 && <Button variant="ghost" size="sm" onClick={() => setTab(tab - 1)}>← Back</Button>}
            {tab < 3
              ? <Button size="sm" onClick={() => setTab(tab + 1)}>Next →</Button>
              : <Button size="sm" onClick={onDone}>Launch Dashboard →</Button>}
          </div>
        </ModalFooter>
      </Modal>
    </ModalScrim>
  );
}
Object.assign(window, { Onboarding });
