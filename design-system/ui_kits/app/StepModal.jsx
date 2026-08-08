const { ModalScrim, Modal, ModalBody, ModalFooter, Button, YesNoButton, TipBox, AlertBox, Shimmer, Spinner, PlatformIcon, PLATFORMS } = window.ShipmateDesignSystem_f314df;

function StepModal({ platform, step, questions, onClose, onComplete }) {
  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState({});
  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 900); return () => clearTimeout(t); }, []);
  const seeded = React.useMemo(() => Object.fromEntries(questions.map((q, i) => [i, q.a])), [questions]);
  const all = { ...seeded, ...answers };
  const answered = questions.every((_, i) => all[i]);
  const risky = all[2] === 'YES';
  return (
    <ModalScrim style={{ paddingTop: 80, alignItems: 'flex-start' }}>
      <Modal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: 'var(--border-line)' }}>
          <PlatformIcon platform={platform} size={18} base="../../assets" />
          <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>{PLATFORMS[platform].label}</span>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-faint)' }}>/</span>
          <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600, flex: 1 }}>{step}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', border: 'none', background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>×</button>
        </div>
        <ModalBody style={{ maxHeight: 'min(420px, calc(100vh - 240px))', overflowX: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-small)', color: 'var(--text-dim)', marginBottom: 6 }}><Spinner /> Reading your build and description…</div>
              <Shimmer short /><Shimmer /><Shimmer /><Shimmer short />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TipBox title="Shipmate tip">We answered two of these from your description. Anything marked ✦ is our inference — you own the final answer.</TipBox>
              <div style={{ fontSize: 'var(--fs-micro)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--ls-header)', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--orange)' }} />Content descriptors
              </div>
              {questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: '10px 0', borderBottom: i < questions.length - 1 ? 'var(--border-line)' : 'none' }}>
                  <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text)', lineHeight: 'var(--lh-normal)', flex: 1 }}>{q.q}</span>
                  <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {['YES', 'NO'].map((v) => (
                      <YesNoButton key={v} selected={all[i] === v} inferred={q.inferred && all[i] === v && answers[i] === undefined}
                        onClick={() => setAnswers((a) => ({ ...a, [i]: v }))}>{v}</YesNoButton>
                    ))}
                  </span>
                </div>
              ))}
              {risky && <AlertBox title="Rejection risk">Loot boxes require a paid-random-item disclosure on every storefront you selected, and are restricted in Belgium and the Netherlands.</AlertBox>}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <span style={{ fontSize: 'var(--fs-tiny)', color: 'var(--text-faint)' }}>{answered ? 'All questions answered' : 'Answer every question to complete this step'}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!answered} onClick={onComplete}>Save & close</Button>
          </div>
        </ModalFooter>
      </Modal>
    </ModalScrim>
  );
}
Object.assign(window, { StepModal });
