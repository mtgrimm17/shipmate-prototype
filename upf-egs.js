/* upf-egs.js — the Epic Games Store half of the local agent (v8.78).

   The Mac App Store card builds from the Steam MAC build on this Mac (upf.js).
   The Epic card builds from the Steam WINDOWS build: the agent fetches the
   Windows depot (DepotDownloader, the remembered Steam login), inspects it for
   Epic (engine, Steam surface, netcode transport, DRM wrapper), builds the EOS
   shim (steam_api64.dll over the EOS SDK, cross-compiled here) and packages two
   things — the full folder for Epic's BuildPatchTool, and a small patch zip
   that drops over a Steam install on a PC for testing.

   This file is deliberately separate from upf.js and from the Epic card's own
   render code: it plugs into ONE seam, upfBuildPanelHTML (upf.js hands the Epic
   pid here), and keeps its state under state.upfEgs. It borrows UPF's agent
   plumbing (_post/_get/waitJob/health) and the panel's CSS. */

const UPF_EGS_PIDS = ['egs', 'egs_full'];

const UPF_EGS_STEPS = [
  { id: 'fetch',   label: 'Fetch the Steam Windows build',          kind: 'agent' },
  { id: 'inspect', label: 'Inspect for Epic (engine, Steam, netcode)', kind: 'agent' },
  { id: 'shim',    label: 'Build the EOS shim (steam_api64.dll)',    kind: 'agent' },
  { id: 'package', label: 'Package for BuildPatchTool + test patch', kind: 'agent' },
  { id: 'defs',    label: 'Create the achievements in the Dev Portal', kind: 'user' },
  { id: 'upload',  label: 'Upload the build with BuildPatchTool',    kind: 'user' },
];

const UPFEGS = {
  handles(pid) { return UPF_EGS_PIDS.includes(pid); },

  st() {
    state.upfEgs = state.upfEgs || { stage: -1, lines: [], job: null, error: '', inspected: null, built: null, started: false, defsDone: false, uploaded: false };
    return state.upfEgs;
  },

  _gameName() {
    return ((state.formData && state.formData.title) || '').trim();
  },

  /* Where the agent is with this title: the project's status record. */
  async restore() {
    const u = this.st();
    const name = this._gameName();
    if (!name || typeof UPF === 'undefined') return;
    if (u.started) return;   // a run this page started owns the state; restore is for reloads only
    try {
      const r = await UPF._get('/status?game=' + encodeURIComponent(name));
      const st = (r && r.status) || {};
      if (u.started) return;   // the run started while we were asking
      if (st.egsBuild) { u.built = st.egsBuild; u.achievements = st.egsBuild.achievements || u.achievements; u.stage = 4; u.started = true; }
      if (r && r.job && r.job.state === 'running' && (r.job.kind === 'egs-build' || r.job.kind === 'egs-inspect')) {
        u.job = { id: r.job.id, kind: r.job.kind }; u.started = true; u.built = null;
        this._watch(r.job.id, r.job.kind);
      }
      this._repaint();
    } catch (_) {}
  },

  _stageOf(line) {
    const l = (line || '').toLowerCase();
    if (/depotdownloader|downloading depot|\bfetch\b/.test(l)) return 0;
    if (/inspect \(epic|reading build|detecting engine|analysing steam|epic mapping/.test(l)) return 1;
    if (/eos shim for|exports to cover|clang|built .*steam_api64/.test(l)) return 2;
    if (/prepare \(epic|patch:|build:/.test(l)) return 3;
    return -1;
  },

  _line(line) {
    const u = this.st();
    u.lines.push(line);
    const s = this._stageOf(line);
    if (s > u.stage) u.stage = s;
    if (u.lines.length % 3 === 0 || s >= 0) this._repaint();
  },

  async _watch(id, kind) {
    const u = this.st();
    try {
      const res = await UPF.waitJob(id, (l) => this._line(l));
      if (kind === 'egs-inspect') { u.inspected = res; u.stage = Math.max(u.stage, 1); }
      if (kind === 'egs-build') { u.built = (res && res.egsBuild) || u.built; u.achievements = res && res.achievements; u.stage = 4; }
      u.job = null; u.error = '';
    } catch (e) {
      u.job = null; u.error = String(e && e.message || e);
    }
    this._repaint();
  },

  /* Press Build from Steam: inspect (fetching the depot if needed), then build. */
  async build(pid) {
    const u = this.st();
    const name = this._gameName();
    if (!name) { if (typeof bcToast === 'function') bcToast('Enter the game title first.'); return; }
    if (u.job) return;
    u.started = true; u.error = ''; u.lines = []; u.stage = 0; u.built = null;
    this._repaint();
    try {
      let r = await UPF._post('/egs/inspect', { game: name });
      u.job = { id: r.job, kind: 'egs-inspect' };
      u.inspected = await UPF.waitJob(r.job, (l) => this._line(l));
      u.stage = Math.max(u.stage, 1);
      const findings = ((u.inspected.manifest || {}).findings) || [];
      if (findings.some(f => f.severity === 'blocker')) { u.job = null; u.error = findings.filter(f => f.severity === 'blocker').map(f => f.message).join(' · '); this._repaint(); return; }
      r = await UPF._post('/egs/build', { game: name });
      u.job = { id: r.job, kind: 'egs-build' };
      await this._watch(r.job, 'egs-build');
    } catch (e) {
      u.job = null; u.error = String(e && e.message || e); this._repaint();
    }
  },

  markDefs(pid) { this.st().defsDone = true; this._repaint(); },
  markUploaded(pid) { this.st().uploaded = true; this._repaint(); },

  _repaint() {
    if (typeof reRenderStepModal === 'function' && state.stepModal && state.stepModal.stepId === 'uploadBuild') reRenderStepModal();
  },

  _rows() {
    const u = this.st();
    const running = !!u.job;
    return UPF_EGS_STEPS.map((s, i) => {
      let status = 'todo';
      if (i <= 3) {
        if (u.built || u.stage > i) status = 'done';
        else if (running && u.stage === i) status = 'active';
        else if (!running && u.error && u.stage === i) status = 'failed';
        else if (u.started && u.stage === i) status = 'active';
      } else if (s.id === 'defs') {
        status = u.defsDone ? 'done' : (u.built ? 'blocker' : 'todo');
      } else if (s.id === 'upload') {
        status = u.uploaded ? 'done' : (u.built && u.defsDone ? 'blocker' : 'todo');
      }
      return Object.assign({ status }, s);
    });
  },

  panelHTML(pid) {
    if (typeof UPF === 'undefined') return '';
    const u = this.st();
    const esc = (s) => (typeof escHtml === 'function') ? escHtml(String(s)) : String(s);
    if (state.upf && (state.upf.agent === false || state.upf.agent === null)) {
      UPF.health().then(() => this._repaint());
      return `<div class="upf-panel"><div class="upf-intro">Shipmate builds an Epic Games Store version from your Steam Windows build on this Mac once the local agent is running.</div></div>`;
    }
    if (!u._restored) { u._restored = true; if (!u.started) this.restore(); }
    const name = esc(this._gameName() || 'your game');
    const running = !!u.job;
    const failed = !running && !!u.error;
    const man = (u.inspected && u.inspected.manifest) || {};
    const egs = man.egs || {};
    const CHECK = (typeof smCheckSVG === 'function') ? smCheckSVG(18) : '✓';

    let intro;
    if (u.built) {
      intro = `<strong>Epic build ready.</strong> ${name}’s Windows build now runs on Epic Online Services instead of Steam. A full folder for Epic’s BuildPatchTool and a small test patch are on this Mac.`;
    } else if (failed) {
      intro = `The build stopped. ${name}’s Steam build is untouched — you can try again.`;
    } else if (running) {
      intro = `Shipmate is building ${name} for the Epic Games Store on this Mac — the Steam Windows build is fetched, inspected, and its Steam layer replaced by Epic Online Services. <strong>You can leave this step and it keeps running.</strong>`;
    } else {
      intro = `Shipmate builds an Epic Games Store version of ${name} from its Steam <em>Windows</em> build: Steam achievements, cloud saves, lobbies and P2P are carried over to Epic Online Services. Nothing on Steam changes.`;
    }

    let facts = '';
    if (u.inspected) {
      const eng = man.engine || {};
      const bits = [];
      if (eng.name) bits.push(`${esc(eng.name)} ${esc(eng.version || '')} ${esc(eng.backend || '')}`.trim());
      if (egs.transportKind) bits.push(`multiplayer: ${esc(egs.transportKind)}${egs.transports && egs.transports.length ? ' (' + esc(egs.transports.join('; ')) + ')' : ''}`);
      if (egs.store && egs.store.achievements) bits.push(`${esc(egs.store.achievements)} achievements`);
      if (egs.drmWrapped) bits.push('Steam DRM wrapper on the exe');
      facts = bits.length ? `<div class="upf-label">What inspect found</div><div class="upf-chips">${bits.map(b => `<span class="upf-chip is-on">${b}</span>`).join('')}</div>` : '';
      const warns = (man.findings || []).filter(f => f.severity === 'warn');
      if (warns.length) facts += `<ul class="upf-list">${warns.map(w => `<li>${esc(w.message)}</li>`).join('')}</ul>`;
    }

    let actions = '';
    if (failed) actions = `<div class="upf-actions"><button class="imp-cta" onclick="event.stopPropagation();UPFEGS.build('${pid}')">Try again</button></div>`;
    else if (!u.started && !u.built) actions = `<div class="upf-actions"><button class="imp-cta" onclick="event.stopPropagation();UPFEGS.build('${pid}')">Build from Steam</button></div>`;
    const err = failed ? `<div class="upf-error">${esc(u.error)}</div>` : '';

    const built = u.built ? `
      <div class="upf-label">Outputs on this Mac</div>
      <ul class="upf-list">
        <li>BuildPatchTool folder: <code>${esc(u.built.path || '')}</code></li>
        <li>Test patch (drop over a Steam install on a PC): <code>${esc(u.built.patch || '')}</code></li>
      </ul>` : '';
    const defs = (u.built && u.achievements && u.achievements.length) ? `
      <div class="upf-label">Achievement ids for the Dev Portal (Game Services → Achievements)</div>
      <div class="upf-chips">${u.achievements.map(a => `<span class="upf-chip">${esc(a)}</span>`).join('')}</div>` : '';

    const rows = this._rows().map(r => {
      const disc = r.status === 'done' ? `<span class="upf-step-disc is-done">${CHECK}</span>`
                 : r.status === 'active' ? `<span class="upf-step-disc is-active"><span class="build-proc-spin"></span></span>`
                 : r.status === 'blocker' ? `<span class="upf-step-disc is-alert">!</span>`
                 : r.status === 'failed' ? `<span class="upf-step-disc is-fail">!</span>`
                 : `<span class="upf-step-disc"></span>`;
      let main = `<span class="upf-step-label">${esc(r.label)}</span>`;
      if (r.status === 'blocker' && r.id === 'defs') {
        main += `<div class="upf-step-alert"><span class="upf-step-help">Epic has no API for achievement definitions yet; create them with the ids below, then confirm.</span><div class="upf-step-cta"><a class="imp-cta imp-cta--sm" href="https://dev.epicgames.com/portal" target="_blank" rel="noopener" onclick="event.stopPropagation()">Open Dev Portal</a><button class="upf-alt" onclick="event.stopPropagation();UPFEGS.markDefs('${pid}')">Done</button></div></div>`;
      }
      if (r.status === 'blocker' && r.id === 'upload') {
        main += `<div class="upf-step-alert"><span class="upf-step-help">BuildPatchTool uploads the folder above to the product’s artifact (Dev Portal → Artifacts & Binaries → Instructions).</span><div class="upf-step-cta"><button class="upf-alt" onclick="event.stopPropagation();UPFEGS.markUploaded('${pid}')">Uploaded</button></div></div>`;
      }
      return `<li class="upf-step is-${r.status} kind-${r.kind}">${disc}<div class="upf-step-main">${main}</div></li>`;
    }).join('');
    const log = (running || failed) && u.lines.length ? `<div class="upf-log">${u.lines.slice(-6).map(l => `<div>${esc(l)}</div>`).join('')}</div>` : '';

    return `<div class="upf-panel"><div class="upf-intro">${intro}</div>${facts}${err}${actions}${built}${defs}<div class="upf-label">Build steps</div><ul class="upf-steps">${rows}</ul>${log}</div>`;
  },
};

try { window.UPFEGS = UPFEGS; } catch (_) {}
