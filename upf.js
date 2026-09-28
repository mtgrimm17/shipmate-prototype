/* ============================================================
   UPF — the local build agent (v7.39)
   ============================================================
   UPF turns an installed Steam Mac build into a Mac App Store build: it
   swaps the Steam runtime for a shim that talks to Game Center, signs and
   packages the app, and uploads it to App Store Connect. It runs on the
   developer's Mac as a small HTTP agent (`upf-mas serve`, 127.0.0.1:7343)
   and THIS PAGE talks to it straight from the browser — the browser is the
   bridge, so the hosted site needs no route to the Mac.

   Two touchpoints, both silent when the agent is not running:

     upfOnSteamGame(appId, name)  — called from selectPicklistItem when a
       Steam-linked title is picked. Asks the agent whether that game is in
       the local Steam library and, if so, inspects it. Nothing is rendered.

     upfBuildAndUpload(pid)       — the "Build from Steam" pill that
       buildBuildDropdown draws for the Mac App Store platform once a game is
       matched. Runs prepare then upload on the agent, mirrors the progress
       into the processing pill, and records the finished build in
       state.platformBuilds exactly as a dragged-in file would be.

   The confirmed achievement list goes to the agent with the build request:
   state.steamAchievementsBaseline (identifier, name, description, from
   Shipmate's own /game endpoint) plus the hidden flag off the Mac App Store
   Game Center list when one exists. The shim reports exactly those
   identifiers, so what App Store Connect is told and what the binary says
   cannot disagree.

   State lives on state.upf and is initialised here rather than in state.js
   because every field is transient (a job in flight, the last progress
   line) and nothing persists it.
   ============================================================ */

const UPF_AGENT = 'http://127.0.0.1:7343';

state.upf = state.upf || {
  agent:    null,   // /health payload, or false once a probe has failed
  game:     null,   // { name, slug, steamAppId, app } from the agent's library
  manifest: null,   // /inspect result: classification, transformations, disabled Steam features
  job:      null,   // { id, kind } while prepare/upload runs
  progress: '',     // latest agent line, shown in the processing pill
  error:    '',
};

const UPF = {
  async _get(path) {
    const r = await fetch(UPF_AGENT + path, { mode: 'cors' });
    if (!r.ok) throw new Error(`agent ${r.status} on ${path}`);
    return r.json();
  },
  async _post(path, body) {
    const r = await fetch(UPF_AGENT + path, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `agent ${r.status} on ${path}`);
    return data;
  },

  /* One probe per page load. A failed probe is remembered as `false` so a
     machine without the agent never pays for a second connection attempt. */
  async health() {
    if (state.upf.agent !== null) return state.upf.agent;
    try {
      const h = await this._get('/health');
      state.upf.agent = h && h.ok ? h : false;
    } catch (_) {
      state.upf.agent = false;
    }
    return state.upf.agent;
  },

  /* Is this Steam title installed locally? Match on the app id, never the
     name — the library reads Steam's own manifests and the id is exact. */
  async match(steamAppId, name) {
    const h = await this.health();
    if (!h) return null;
    const lib = await this._get('/library');
    const g = (lib.games || []).find(x => String(x.steamAppId) === String(steamAppId));
    if (!g) { state.upf.game = null; state.upf.manifest = null; return null; }
    state.upf.game = { name: g.name, slug: g.slug, steamAppId: g.steamAppId, app: g.app };
    const ins = await this._post('/inspect', { game: g.app });
    state.upf.manifest = ins.manifest || null;
    return state.upf.game;
  },

  /* Poll a job until it ends, handing each new line to `onLine`. */
  async waitJob(id, onLine) {
    let seen = 0;
    for (;;) {
      const j = await this._get('/jobs/' + id);
      for (const line of (j.lines || []).slice(seen)) onLine(line);
      seen = (j.lines || []).length;
      if (j.state === 'done') return j.result;
      if (j.state === 'failed') throw new Error(j.error || 'agent job failed');
      await new Promise(res => setTimeout(res, 1500));
    }
  },

  achievementsForBuild() {
    const base = (state.steamAchievementsBaseline && state.steamAchievementsBaseline.achievements) || [];
    const gc   = state.macFullGameCenterAchievements || [];
    return base
      .filter(a => a.identifier)
      .map(a => {
        const own = gc.find(x => x.refName === a.name) || null;
        return { identifier: a.identifier, name: a.name, description: a.description || '', hidden: !!(own && own.hidden) };
      });
  },

  /* What the pill's tooltip says: the inspect verdict in one line. */
  summary() {
    const m = state.upf.manifest;
    if (!m) return '';
    const planned  = (m.plannedTransformations || []).length;
    const disabled = (m.steamApis && m.steamApis.degraded || []).map(k => k.split('::')[0]).filter((v, i, a) => a.indexOf(v) === i);
    const parts = [m.classification, `${planned} transformations`];
    if (disabled.length) parts.push(`off on Mac: ${disabled.join(', ')}`);
    return parts.join(' · ');
  },

  ready(pid) {
    return pid === 'macos_full' && !!state.upf.game && !!state.upf.agent && !state.upf.job;
  },
};

/* Touchpoint 1 — fire-and-forget from selectPicklistItem. Never renders: the
   matched game only changes what buildBuildDropdown draws NEXT time, and that
   surface repaints on its own when the developer reaches it. */
function upfOnSteamGame(steamAppId, name) {
  state.upf.game = null;
  state.upf.manifest = null;
  UPF.match(steamAppId, name)
    .then(g => { if (g && typeof _refreshBuildUI === 'function' && state.activePlatforms?.includes?.('macos_full')) _refreshBuildUI('macos_full'); })
    .catch(e => console.warn('[UPF] match failed', e));
}

/* Touchpoint 2 — the pill's press. The agent does prepare (transform, sign,
   package) and then upload (App Store Connect, wait for processing); this
   mirrors its progress into the processing pill and records the result the
   way handleBuildUpload does, so every reader of platformBuilds is unchanged. */
async function upfBuildAndUpload(pid) {
  if (!UPF.ready(pid)) return;
  const game = state.upf.game;
  state.platformBuilds = state.platformBuilds || {};
  state.platformBuildProcessing = state.platformBuildProcessing || {};
  state.platformBuildProcessing[pid] = true;
  state.upf.error = '';
  state.upf.progress = 'Starting build…';
  state.upf.job = { id: null, kind: 'prepare' };
  _upfRepaint(pid, true);

  let lastPaint = 0;
  const onLine = (line) => {
    const s = String(line).trim();
    if (!s) return;
    state.upf.progress = s.replace(/^stage [A-F][^:]*:\s*/i, '').slice(0, 60);
    const now = Date.now();
    if (now - lastPaint > 2000) { lastPaint = now; _upfRepaint(pid, false); }
  };

  try {
    const target = { version: state.formData?.version || undefined };
    const p = await UPF._post('/prepare', { game: game.app, target, achievements: UPF.achievementsForBuild() });
    state.upf.job = { id: p.job, kind: 'prepare' };
    const prep = await UPF.waitJob(p.job, onLine);
    if (!prep || prep.status !== 'ready') {
      const why = (prep && prep.blockers || []).map(b => b.message).join(' · ') || 'build did not reach ready';
      throw new Error(why);
    }
    state.upf.progress = 'Uploading to App Store Connect…';
    _upfRepaint(pid, false);
    const u = await UPF._post('/upload', { game: game.app });
    state.upf.job = { id: u.job, kind: 'upload' };
    const up = await UPF.waitJob(u.job, onLine);
    if (!up || !up.ok) throw new Error((up && up.problems || []).join(' · ') || 'upload did not complete');

    const pkgPath = (prep.artifacts && prep.artifacts.pkg) || '';
    state.platformBuilds[pid] = {
      name: pkgPath.split('/').pop() || `${game.name}.pkg`,
      size: 0,
      buildNumber: Number(up.buildVersion) || up.buildVersion,
      uploadedAt: Date.now(),
      source: 'upf',
      ascBuildId: up.buildId,
      ascAppId: up.appId,
    };
    state.upf.progress = '';
    if (typeof bcToast === 'function') bcToast(`Mac App Store build ${up.buildVersion} is in App Store Connect (build ${up.buildId}).`);
  } catch (e) {
    console.warn('[UPF] build failed', e);
    state.upf.error = String(e.message || e);
    state.upf.progress = '';
    if (typeof bcToast === 'function') bcToast('Build from Steam failed: ' + state.upf.error.slice(0, 160));
  } finally {
    state.upf.job = null;
    state.platformBuildProcessing[pid] = false;
    _upfRepaint(pid, true);
  }
}

/* The same two repaints handleBuildUpload does, so the card and an open step
   modal both follow. `full` is for the start and the end; progress ticks only
   need the pill, but _refreshBuildUI is the one door and it is cheap enough. */
function _upfRepaint(pid, full) {
  if (typeof _refreshBuildUI === 'function') _refreshBuildUI(pid);
  if (full && typeof reRenderStepModal === 'function') reRenderStepModal();
}
