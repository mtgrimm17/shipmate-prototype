/* ============================================================
   UPF — the local build agent (v7.49)
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
/* Both Mac App Store platforms take the pill; the Steam build is the same. */
const UPF_MAC_PIDS = ['macos', 'macos_full'];

state.upf = state.upf || {
  agent:    null,   // /health payload, or false once a probe has failed
  game:     null,   // { name, slug, steamAppId, app } from the agent's library
  manifest: null,   // /inspect result: classification, transformations, disabled Steam features
  job:      null,   // { id, kind } while prepare/upload runs
  progress: '',     // latest agent line, shown in the processing pill
  lines:    [],     // every agent line of the current/last run
  stage:    -1,     // index into UPF_STAGES of the stage now running
  stages:   [],     // per stage: { start, end } timestamps
  uploadPct: 0,     // upload progress, from the agent's "NN%" lines
  result:   null,   // { buildVersion, buildId } after a successful run
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

  /* ── ASC SYNC, GATED ON A CONNECTED ACCOUNT ──────────────────────────────
     Nothing is written to App Store Connect until the user completes the
     account-connect flow in Settings (the stubbed portal sign-in), which sets
     state.platformAuth[pid].loggedIn — the same flag isPlatformConnected reads.
     After that, the collected fields are pushed to ASC through the agent's
     /populate, on connect and after each step is saved/closed. */

  connectedMac() {
    return UPF_MAC_PIDS.find(pid =>
      state.activePlatforms && state.activePlatforms.has && state.activePlatforms.has(pid)
      && typeof isPlatformConnected === 'function' && isPlatformConnected(pid)) || null;
  },

  /* Read a Content Rating / Data Privacy answer through the app's own router. */
  _answer(pid, field) {
    if (typeof _appStoreAnswers !== 'function') return undefined;
    const a = _appStoreAnswers(pid, field);
    return a ? a[field] : undefined;
  },

  /* Shipmate's content-rating answers → Apple's ageRatingDeclaration vocabulary.
     Intensity none/infrequent/frequent → NONE/INFREQUENT_OR_MILD/FREQUENT_OR_INTENSE;
     yes/no → true/false. Only the keys with an answer are sent; the agent fills
     the rest of the required declaration with safe defaults. */
  _ageRating(pid) {
    const I = { none: 'NONE', infrequent: 'INFREQUENT_OR_MILD', frequent: 'FREQUENT_OR_INTENSE' };
    const intensity = {
      profanity: 'profanityOrCrudeHumor', horrorFear: 'horrorOrFearThemes',
      substancesAlcohol: 'alcoholTobaccoOrDrugUseOrReferences', medicalTreatment: 'medicalOrTreatmentInformation',
      matureSuggestive: 'matureOrSuggestiveThemes', sexualContent: 'sexualContentOrNudity',
      graphicSexual: 'sexualContentGraphicAndNudity', cartoonViolence: 'violenceCartoonOrFantasy',
      realisticViolence: 'violenceRealistic', extendedViolence: 'violenceRealisticProlongedGraphicOrSadistic',
      gunsWeapons: 'gunsOrOtherWeapons', simulatedGambling: 'gamblingSimulated', contests: 'contests',
    };
    const bool = {
      parentalControls: 'parentalControls', ageAssurance: 'ageAssurance', unrestrictedInternet: 'unrestrictedWebAccess',
      userGenContent: 'userGeneratedContent', socialMedia: 'socialMedia', socialMediaU13Off: 'socialMediaAgeRestricted',
      messagingChat: 'messagingAndChat', advertising: 'advertising', healthWellness: 'healthOrWellnessTopics',
      realMoneyGambling: 'gambling', lootBoxes: 'lootBox',
    };
    const out = {};
    for (const [ship, asc] of Object.entries(intensity)) {
      const v = this._answer(pid, ship);
      if (v != null && I[v]) out[asc] = I[v];
    }
    for (const [ship, asc] of Object.entries(bool)) {
      const v = this._answer(pid, ship);
      if (v === 'yes' || v === 'no') out[asc] = (v === 'yes');
    }
    return Object.keys(out).length ? out : null;
  },

  /* Shipmate's Data Privacy answers → Apple's App Privacy (nutrition labels)
     vocabulary. Shipmate stores `collectsData` ('yes'|'no'|null) and, per
     collected type, `dataPerType[typeId] = { purposes:[], identity, tracking }`.
     Apple's appDataUsages take the enum-like ids below; the agent validates them
     against Apple's own reference lists and skips any it doesn't recognise, so
     hardcoding the map is safe. Returns null when unanswered — a null declaration
     leaves whatever is already in ASC untouched rather than wiping it. Never asks
     to publish: labels are staged for the user to review (publishing is public). */
  _privacy(pid) {
    const collects = this._answer(pid, 'collectsData');
    if (collects == null) return null;                       // unanswered → don't touch ASC
    if (collects === 'no') return { collected: false, publish: false, items: [] };

    const CAT = {
      name: 'NAME', email: 'EMAIL_ADDRESS', phone: 'PHONE_NUMBER', address: 'PHYSICAL_ADDRESS',
      other_contact: 'OTHER_CONTACT_INFO', health: 'HEALTH', fitness: 'FITNESS',
      payment_info: 'PAYMENT_INFO', credit_info: 'CREDIT_INFO', other_financial: 'OTHER_FINANCIAL_INFO',
      precise_loc: 'PRECISE_LOCATION', coarse_loc: 'COARSE_LOCATION', sensitive: 'SENSITIVE_INFO',
      contacts: 'CONTACTS', messages: 'EMAILS_OR_TEXT_MESSAGES', photos_videos: 'PHOTOS_OR_VIDEOS',
      audio: 'AUDIO_DATA', gameplay: 'GAMEPLAY_CONTENT', customer_support: 'CUSTOMER_SUPPORT',
      other_uc: 'OTHER_USER_CONTENT', browsing: 'BROWSING_HISTORY', search: 'SEARCH_HISTORY',
      user_id: 'USER_ID', device_id: 'DEVICE_ID', purchases: 'PURCHASE_HISTORY',
      product_use: 'PRODUCT_INTERACTION', ad_data: 'ADVERTISING_DATA', other_usage: 'OTHER_USAGE_DATA',
      crash: 'CRASH_DATA', performance: 'PERFORMANCE_DATA', other_diag: 'OTHER_DIAGNOSTIC_DATA',
      env_scan: 'ENVIRONMENT_SCANNING', hands: 'HANDS', head: 'HEAD', other: 'OTHER_DATA_TYPES',
    };
    const PUR = {
      first_party_ads: 'DEVELOPERS_ADVERTISING', third_party_ads: 'THIRD_PARTY_ADVERTISING',
      analytics: 'ANALYTICS', personalization: 'PRODUCT_PERSONALIZATION',
      app_function: 'APP_FUNCTIONALITY', other_purpose: 'OTHER_PURPOSES',
    };
    const perType = this._answer(pid, 'dataPerType') || {};
    const items = [];
    for (const [tid, sel] of Object.entries(perType)) {
      const category = CAT[tid];
      if (!category || !sel) continue;
      items.push({
        category,
        linked: sel.identity === 'yes',
        tracked: sel.tracking === 'yes',
        purposes: (sel.purposes || []).map(p => PUR[p]).filter(Boolean),
      });
    }
    // Said "yes" but nothing itemised yet → skip rather than stage a contradictory
    // empty (which the agent would read as "no data collected").
    if (!items.length) return null;
    return { collected: true, publish: false, items };
  },

  /* Everything Shipmate has collected, as the manifest-v2 listing block the
     agent's /populate consumes. Screenshots are omitted: the agent needs files
     on disk and Shipmate's live in the browser as data URLs / CDN links. */
  buildListing(pid) {
    const f = state.formData || {};
    const listing = {
      locale: 'en-US',
      name: f.title || undefined,
      subtitle: f.subtitle || undefined,
      description: f.description || undefined,
      supportUrl: f.supportUrl || undefined,
      marketingUrl: undefined,
      privacyPolicyUrl: f.privacyUrl || this._answer(pid, 'privacyPolicyUrl') || undefined,
      whatsNew: f.releaseNotes || undefined,
      primaryCategory: 'GAMES',   // Shipmate does not collect a category; a game is GAMES
    };
    const ar = this._ageRating(pid);
    if (ar) listing.ageRating = ar;
    const pr = this._privacy(pid);
    if (pr) listing.privacy = pr;
    return listing;
  },

  /* Push to ASC for every connected Mac platform. Debounced, non-blocking, and
     a no-op unless the agent is up, the game is matched, and an account is
     connected. `reason` is for the toast/log only. */
  _syncTimer: null,
  sync(reason) {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this._syncNow(reason), 800);
  },
  async _syncNow(reason) {
    try {
      if (!(await this.health())) return;
      const pid = this.connectedMac();
      if (!pid || !state.upf.game) return;
      const listing = this.buildListing(pid);
      const r = await this._post('/populate', { game: state.upf.game.app, listing });
      if (r && r.job) {
        await this.waitJob(r.job, () => {});
        if (typeof bcToast === 'function') bcToast(`Synced to App Store Connect${reason ? ' (' + reason + ')' : ''}.`);
      }
    } catch (e) {
      console.warn('[UPF] ASC sync failed', e);
    }
  },

  /* The user pressed Submit on a connected Mac platform → send the processed
     build to the destination they chose in the release block's track picker.
     The track drives it: testflight_internal is wired end to end; external
     TestFlight and the Mac App Store are real, different review paths and the
     agent reports them as staged rather than pretending to submit. Non-blocking;
     a toast reports the outcome. */
  async submitTestFlight(pid, track) {
    try {
      if (!(await this.health()) || !state.upf.game) return;
      const r = await this._post('/submit', { game: state.upf.game.app, track: track || 'testflight_internal' });
      if (r && r.job) {
        const res = await this.waitJob(r.job, () => {});
        if (typeof bcToast === 'function') {
          if (res && res.ok) {
            bcToast(res.group
              ? `Submitted build ${res.buildVersion} to internal TestFlight group '${res.group}'.`
              : `Build ${res.buildVersion} ${res.staged || 'ready to submit'}.`);
          } else {
            bcToast(`TestFlight submit: ${(res && res.error) || 'failed'}`);
          }
        }
      }
    } catch (e) {
      console.warn('[UPF] TestFlight submit failed', e);
    }
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

  /* The project's Steam app id, wherever the page currently holds it: the
     picked search result, or the achievements baseline that came off Steam. */
  currentSteamAppId() {
    return (state.liveSearch && state.liveSearch.steamAppId)
        || (state.steamAchievementsBaseline && state.steamAchievementsBaseline.appId)
        || null;
  },

  /* Match lazily, once, for a project whose game was chosen before this page
     loaded (selectPicklistItem never ran, so upfOnSteamGame never did). */
  _matchAttempted: false,
  ensureMatch() {
    if (this._matchAttempted || state.upf.game || state.upf.agent === false) return;
    const appId = this.currentSteamAppId();
    if (!appId) return;
    this._matchAttempted = true;
    this.match(appId, state.formData?.title || '')
      .then(g => { if (g) _upfRepaintAll(); })
      .catch(e => console.warn('[UPF] match failed', e));
  },

  isMac(pid) { return UPF_MAC_PIDS.includes(pid); },

  /* The project's active version number, the way buildReleaseBlock reads it,
     without a leading "v". Null when the project has none. */
  projectVersion() {
    const proj = (state.projects || []).find(p => p.id === state.activeProjectId);
    const ver = proj && proj.versions && (proj.versions.find(v => v.id === state.activeVersionId) || proj.versions[proj.versions.length - 1]);
    const n = ver && ver.versionNumber;
    return n ? String(n).replace(/^v/i, '') : null;
  },

  /* ── Export compliance, both directions ──────────────────────────────
     ITSAppUsesNonExemptEncryption in the built app's Info.plist and the
     Business step's encryption questions are ONE question. */

  /* What the developer has answered, as the plist value: true (non-exempt
     encryption), false (none, or exempt), or null (not answered). */
  encryptionAnswer(pid) {
    const a = (typeof _appStoreAnswers === 'function') ? _appStoreAnswers(pid, 'usesEncryption') : null;
    if (!a || a.usesEncryption === null || a.usesEncryption === undefined) return null;
    if (a.usesEncryption === 'no') return false;
    if (a.encryptionExempt === 'no') return true;
    if (a.encryptionExempt === 'yes') return false;
    return null;   // "uses encryption" answered, exemption not yet
  },

  /* Pre-answer "No" as an INFERRED answer — violet until the developer confirms
     — for a matched game that has not answered yet. It is the right default
     for a game whose only encryption is HTTPS (exempt), which is what inspect
     sees; it is a strong default and not a finding, because inspection cannot
     prove the absence of custom crypto inside a game's own code, so the
     developer still confirms it. Same meta shape smReadyToShip writes. */
  prefillEncryption(pid) {
    if (typeof _appStoreAnswers !== 'function' || typeof _appStoreAnswerMeta !== 'function') return false;
    const a = _appStoreAnswers(pid, 'usesEncryption');
    if (!a || a.usesEncryption !== null) return false;
    a.usesEncryption = 'no';
    const meta = _appStoreAnswerMeta(pid, 'usesEncryption');
    if (meta) meta.usesEncryption = { confidence: 0.85, humanConfirmed: false, source: 'upf' };
    return true;
  },

  /* Console helper: why is the pill (not) showing? */
  debug() {
    return { agent: state.upf.agent, game: state.upf.game, steamAppId: this.currentSteamAppId(),
             classification: state.upf.manifest && state.upf.manifest.classification, job: state.upf.job, error: state.upf.error };
  },

  achievementsForBuild(pid) {
    const base = (state.steamAchievementsBaseline && state.steamAchievementsBaseline.achievements) || [];
    const gc   = (pid === 'macos_full' ? state.macFullGameCenterAchievements : state.macGameCenterAchievements) || [];
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
    if (!this.isMac(pid)) return false;
    if (!state.upf.game) this.ensureMatch();   // async; a later repaint picks it up
    return !!state.upf.game && !!state.upf.agent && !state.upf.job;
  },
};

function _upfRepaintAll() {
  let prefilled = false;
  for (const pid of UPF_MAC_PIDS) {
    if (state.activePlatforms && state.activePlatforms.includes && state.activePlatforms.includes(pid)) {
      if (UPF.prefillEncryption(pid)) prefilled = true;
      if (typeof _refreshBuildUI === 'function') _refreshBuildUI(pid);
    }
  }
  if (prefilled && typeof refreshGuideCompletion === 'function') refreshGuideCompletion();
}

/* A project restored with its game already chosen: ask once the page has
   settled, so the pill is there the first time the card is looked at. */
setTimeout(() => { try { UPF.ensureMatch(); } catch (_) {} }, 1500);

/* Touchpoint 1 — fire-and-forget from selectPicklistItem. Never renders: the
   matched game only changes what buildBuildDropdown draws NEXT time, and that
   surface repaints on its own when the developer reaches it. */
function upfOnSteamGame(steamAppId, name) {
  state.upf.game = null;
  state.upf.manifest = null;
  UPF._matchAttempted = true;
  UPF.match(steamAppId, name)
    .then(g => { if (g) _upfRepaintAll(); })
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
  state.upf.result = null;
  state.upf.lines = [];
  state.upf.stage = 0;
  state.upf.stages = [{ start: Date.now() }];
  state.upf.uploadPct = 0;
  state.upf.progress = 'Starting build…';
  state.upf.job = { id: null, kind: 'prepare' };
  _upfRepaint(pid, true);
  _upfStartTicker();

  let lastPaint = 0;
  const onLine = (line) => {
    const s = String(line).trim();
    if (!s) return;
    state.upf.lines.push(s);
    const before = state.upf.stage;
    _upfTrackLine(s);
    state.upf.progress = s.replace(/^stage [A-F][^:]*:\s*/i, '').slice(0, 60);
    const now = Date.now();
    // repaint when a stage changes (the list must move), else at most every 2s
    if (state.upf.stage !== before || now - lastPaint > 2000) { lastPaint = now; _upfRepaint(pid, true); }
  };

  try {
    /* The developer's answer is what goes into the plist; unanswered means the
       exempt default (false), which is also what the pre-fill says. */
    const enc = UPF.encryptionAnswer(pid);
    /* The build keeps the STEAM build's own version (2.2.1, what App Store
       Connect should carry). Shipmate's project version is cosmetic and is not
       sent — v7.47 sent it, and it would have shipped every game as "1.0". */
    const target = { usesNonExemptEncryption: enc === null ? false : enc };
    /* ONE JOB ON THE AGENT for prepare AND upload. The chain used to live here,
       in the page — so closing or reloading it after prepare meant nothing ever
       started the upload. The agent owns the whole run now; the page only
       watches, and can re-attach after a reload (upfReattach). */
    const b = await UPF._post('/build', { game: game.app, target, achievements: UPF.achievementsForBuild(pid) });
    state.upf.job = { id: b.job, kind: 'build' };
    try { localStorage.setItem('upf.job', JSON.stringify({ id: b.job, pid, started: Date.now() })); } catch (_) {}
    const res = await UPF.waitJob(b.job, onLine);
    _upfFinish(pid, res, game);
  } catch (e) {
    _upfFail(pid, e);
  }
}

/* The end of a run, from a live wait or a re-attach. */
function _upfFinish(pid, res, game) {
  try {
    const prep = res && res.prepare;
    const up = res && res.upload;
    if (!prep || prep.status !== 'ready') {
      const why = (prep && prep.blockers || []).map(b => b.message).join(' · ') || 'build did not reach ready';
      throw new Error(why);
    }
    if (!up || !up.ok) throw new Error((up && up.problems || []).join(' · ') || 'upload did not complete');
    const pkgPath = (prep.artifacts && prep.artifacts.pkg) || '';
    state.platformBuilds[pid] = {
      name: pkgPath.split('/').pop() || `${game.name}.pkg`,
      size: 0,
      buildNumber: String(up.buildVersion),   // Steam's build id, possibly dotted (17325648.1) — a label, not a number
      uploadedAt: Date.now(),
      source: 'upf',
      ascBuildId: up.buildId,
      ascAppId: up.appId,
    };
    state.upf.progress = '';
    const last = state.upf.stages[state.upf.stage];
    if (last && !last.end) last.end = Date.now();
    state.upf.result = { buildVersion: up.buildVersion, buildId: up.buildId, appId: up.appId };
    if (typeof bcToast === 'function') bcToast(`Mac App Store build ${up.buildVersion} is in App Store Connect (build ${up.buildId}).`);
    _upfDone(pid);
  } catch (e) {
    _upfFail(pid, e);
  }
}

function _upfFail(pid, e) {
  console.warn('[UPF] build failed', e);
  state.upf.error = String((e && e.message) || e);
  state.upf.progress = '';
  if (typeof bcToast === 'function') bcToast('Build from Steam failed: ' + state.upf.error.slice(0, 160));
  _upfDone(pid);
}

function _upfDone(pid) {
  state.upf.job = null;
  state.platformBuildProcessing = state.platformBuildProcessing || {};
  state.platformBuildProcessing[pid] = false;
  try { localStorage.removeItem('upf.job'); } catch (_) {}
  _upfRepaint(pid, true);
}

/* RE-ATTACH AFTER A RELOAD. The agent owns the run, so a page that comes back
   asks whether the job it started is still going (or has ended since) and
   picks up watching it — stages, timers and the result — where it left off.
   The job id is remembered in localStorage by upfBuildAndUpload; the agent's
   /jobs list is the fallback when that is gone. */
async function upfReattach() {
  let remembered = null;
  try { remembered = JSON.parse(localStorage.getItem('upf.job') || 'null'); } catch (_) {}
  const h = await UPF.health();
  if (!h) return;
  let id = remembered && remembered.id, pid = remembered && remembered.pid;
  if (!id) {
    const list = await UPF._get('/jobs').catch(() => ({ jobs: [] }));
    const j = (list.jobs || []).find(x => x.kind === 'build' && x.state === 'running');
    if (!j) return;
    id = j.id;
    pid = UPF_MAC_PIDS.find(p => state.activePlatforms && state.activePlatforms.includes && state.activePlatforms.includes(p)) || 'macos';
  }
  let job;
  try { job = await UPF._get('/jobs/' + id); } catch (_) { try { localStorage.removeItem('upf.job'); } catch (__) {} return; }
  if (!job || !job.id) return;
  // rebuild the watched state from the lines the agent kept
  state.upf.lines = [];
  state.upf.stage = 0;
  state.upf.stages = [{ start: (remembered && remembered.started) || (Date.now() - (job.elapsed || 0) * 1000) }];
  state.upf.uploadPct = 0;
  state.upf.error = '';
  state.upf.result = null;
  state.upf.job = { id: job.id, kind: job.kind };
  state.platformBuildProcessing = state.platformBuildProcessing || {};
  state.platformBuildProcessing[pid] = true;
  for (const l of job.lines || []) { state.upf.lines.push(l); _upfTrackLine(l); }
  if (!state.upf.game) UPF.ensureMatch();
  _upfRepaint(pid, true);
  if (job.state === 'done') return _upfFinish(pid, job.result, state.upf.game || { name: 'Game' });
  if (job.state === 'failed') return _upfFail(pid, new Error(job.error || 'agent job failed'));
  _upfStartTicker();
  let seen = (job.lines || []).length, lastPaint = 0;
  try {
    for (;;) {
      const j = await UPF._get('/jobs/' + id);
      for (const line of (j.lines || []).slice(seen)) {
        const before = state.upf.stage;
        state.upf.lines.push(line); _upfTrackLine(line);
        if (state.upf.stage !== before || Date.now() - lastPaint > 2000) { lastPaint = Date.now(); _upfRepaint(pid, true); }
      }
      seen = (j.lines || []).length;
      if (j.state === 'done') return _upfFinish(pid, j.result, state.upf.game || { name: 'Game' });
      if (j.state === 'failed') return _upfFail(pid, new Error(j.error || 'agent job failed'));
      await new Promise(res => setTimeout(res, 1500));
    }
  } catch (e) { _upfFail(pid, e); }
}

setTimeout(() => { try { upfReattach(); } catch (_) {} }, 1800);

/* The same two repaints handleBuildUpload does, so the card and an open step
   modal both follow. Progress ticks repaint the modal too (throttled by the
   caller), because that is where the log is read. */
function _upfRepaint(pid, full) {
  if (typeof _refreshBuildUI === 'function') _refreshBuildUI(pid);
  if (full && typeof reRenderStepModal === 'function') reRenderStepModal();
}

/* ── THE UPLOAD BUILD PANEL ──────────────────────────────────────────────────
   Rendered by _subStepBodyInner (render.js) under the release block of the
   Upload Build step, Mac platforms only, and only while the agent is running.
   It is the confirmation screen: what will change in the build, which Steam
   features go dark on Mac, and — once pressed — the agent's own log, then the
   App Store Connect result. Reads state, never writes it. */
/* The run, as the developer sees it: seven stages, matched against the agent's
   own progress lines. `test` is what the agent prints when that stage begins;
   `usual` is the expected duration in seconds, from the Monster Train 2 runs
   (a 2 GB game — smaller games are quicker; Apple's side varies most). */
const UPF_STAGES = [
  { label: 'Copy and inspect the Steam build',   test: /inspecting|preflight|copying|provisioning/i, usual: 60 },
  { label: 'Replace Steam with the shim',        test: /stage a\/b|compiling shim/i,                usual: 30 },
  { label: 'Sandbox and entitlements',           test: /stage c/i,                                  usual: 5 },
  { label: 'Sign every binary',                  test: /stage d/i,                                  usual: 40 },
  { label: 'Package for the Mac App Store',      test: /stage e|stage f/i,                          usual: 60 },
  { label: 'Upload to App Store Connect',        test: /uploading|chunk|^\d+%$/i,                   usual: 300 },
  { label: 'Process the build (Apple’s side)', test: /waiting for apple|build \d+:/i,           usual: 600 },
  { label: 'Set up Game Center achievements',    test: /\[build\] game center|game center|achievements released/i, usual: 30 },
];

function _upfStageOf(line) {
  let idx = -1;
  UPF_STAGES.forEach((s, i) => { if (s.test.test(line) && i > idx) idx = i; });
  return idx;
}

/* Called for every agent line: advances the stage clock and reads the upload
   percentage. Stages are { start, end } timestamps on state.upf.stages. */
function _upfTrackLine(line) {
  const u = state.upf;
  const now = Date.now();
  const idx = _upfStageOf(line);
  if (idx > u.stage) {
    for (let i = Math.max(u.stage, 0); i < idx; i++) {
      if (!u.stages[i]) u.stages[i] = { start: now };
      if (!u.stages[i].end) u.stages[i].end = now;
    }
    u.stage = idx;
    u.stages[idx] = u.stages[idx] || { start: now };
  }
  const pct = /^(\d{1,3})%$/.exec(line);
  if (pct && u.stage === 5) u.uploadPct = Math.min(100, Number(pct[1]));
}

function _upfFmt(sec) {
  sec = Math.max(0, Math.round(sec));
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
}

/* One-second ticker while a run is up: writes the current stage's elapsed time
   and the upload bar straight into the DOM. It touches the DOM, it does not
   render — the modal is rebuilt only when a new agent line arrives. */
let _upfTicker = null;
function _upfStartTicker() {
  if (_upfTicker) return;
  _upfTicker = setInterval(() => {
    const u = state.upf;
    if (!u.job) { clearInterval(_upfTicker); _upfTicker = null; return; }
    const cur = u.stages[u.stage];
    const el = document.querySelector(`[data-upf-elapsed="${u.stage}"]`);
    if (el && cur) el.textContent = _upfFmt((Date.now() - cur.start) / 1000) + ' · usually ~' + _upfFmt(UPF_STAGES[u.stage].usual);
    const bar = document.querySelector('[data-upf-bar]');
    if (bar) bar.style.width = (u.uploadPct || 0) + '%';
    const pctEl = document.querySelector('[data-upf-pct]');
    if (pctEl) pctEl.textContent = (u.uploadPct || 0) + '%';
  }, 1000);
}

function upfBuildPanelHTML(pid) {
  if (typeof UPF === 'undefined' || !UPF.isMac(pid)) return '';
  const u = state.upf;
  if (u.agent === false || u.agent === null) { UPF.health().then(h => { if (h) UPF.ensureMatch(); }); return ''; }
  if (!u.game) return '';   // not installed here: the ordinary file row stays
  if (state.platformBuilds && state.platformBuilds[pid] && !u.job && !u.result) return '';  // a build is in already
  const esc = (s) => (typeof escHtml === 'function') ? escHtml(String(s)) : String(s);

  const m = u.manifest || {};
  const planned = m.plannedTransformations || [];
  const degraded = ((m.steamApis && m.steamApis.degraded) || []).map(k => k.split('::')[0]).filter((v, i, a) => a.indexOf(v) === i);
  const blockers = m.blockers || [];
  const running = !!u.job;
  const done = !!u.result;
  const head = `<div class="upf-head">Build from Steam <span class="upf-muted">— ${esc(u.game.name)}, from the Steam build on this Mac</span></div>`;

  /* ── Phase 3: done ─────────────────────────────────────────────────── */
  if (done) {
    return `<div class="upf-panel">${head}
      <div class="upf-result">Build ${esc(u.result.buildVersion)} is in App Store Connect · build id ${esc(u.result.buildId)}</div>
      <div class="upf-muted" style="margin-top:6px">Add it to a TestFlight group in App Store Connect to install it.</div>
    </div>`;
  }

  /* ── Phase 2: running status ───────────────────────────────────────── */
  if (running || (u.error && u.lines.length)) {
    const cur = u.stage;
    const failed = !running && !!u.error;
    const total = UPF_STAGES.reduce((n, s) => n + s.usual, 0);
    const rows = UPF_STAGES.map((s, i) => {
      const st = failed && i === cur ? 'is-bad' : (i < cur ? 'is-done' : (i === cur && running ? 'is-current' : ''));
      const mark = st === 'is-done' ? (typeof smCheckSVG === 'function' ? smCheckSVG() : '✓')
                 : (st === 'is-bad' ? '✕' : (st === 'is-current' ? '<span class="build-proc-spin"></span>' : ''));
      const t = u.stages[i];
      let time;
      if (st === 'is-done' && t && t.end)      time = _upfFmt((t.end - t.start) / 1000);
      else if (st === 'is-current' && t)       time = `<span data-upf-elapsed="${i}">${_upfFmt((Date.now() - t.start) / 1000)} · usually ~${_upfFmt(s.usual)}</span>`;
      else if (st === 'is-bad' && t)           time = _upfFmt(((t.end || Date.now()) - t.start) / 1000);
      else                                      time = `~${_upfFmt(s.usual)}`;
      const bar = (i === 5 && (st === 'is-current' || st === 'is-done')) ? `
        <div class="upf-bar"><div class="upf-bar-fill" data-upf-bar style="width:${st === 'is-done' ? 100 : (u.uploadPct || 0)}%"></div></div>
        <span class="upf-bar-pct" data-upf-pct>${st === 'is-done' ? 100 : (u.uploadPct || 0)}%</span>` : '';
      return `<li class="upf-stage ${st}">
        <span class="upf-stage-mark">${mark}</span>
        <span class="upf-stage-label">${esc(s.label)}${bar}</span>
        <span class="upf-stage-time">${time}</span>
      </li>`;
    }).join('');
    const started = u.stages[0] ? u.stages[0].start : Date.now();
    const foot = running
      ? `<div class="upf-muted">Started ${_upfFmt((Date.now() - started) / 1000)} ago · the whole run usually takes ~${_upfFmt(total)}. You can close this — the run continues on the agent, and the Upload Build row opens it again.</div>`
      : '';
    const err = failed ? `<div class="upf-error">${esc(u.error)}</div>` : '';
    const retry = failed ? `<div class="upf-actions"><button class="imp-cta" onclick="event.stopPropagation();upfBuildAndUpload('${pid}')">Try again</button></div>` : '';
    return `<div class="upf-panel">${head}<ul class="upf-stages">${rows}</ul>${foot}${err}${retry}</div>`;
  }

  /* ── Phase 1: the steps, and the confirmation ──────────────────────── */
  const verdict = `<div class="upf-verdict ${blockers.length ? 'is-blocked' : ''}">
      <span class="upf-verdict-word">${esc(m.classification || 'Inspected')}</span>
      <span class="upf-muted">· ${planned.length} changes · ${(m.warnings || []).length} warnings · ${blockers.length} blockers</span>
    </div>`;
  const changes = planned.length ? `
    <div class="upf-label">What changes in the build</div>
    <ul class="upf-list">${planned.map(t => `<li><span class="upf-id">${esc(t.id)}</span>${esc(t.name)}</li>`).join('')}</ul>` : '';
  const dark = degraded.length ? `
    <div class="upf-label">Steam features that go dark on Mac</div>
    <div class="upf-chips">${degraded.map(d => `<span class="upf-chip">${esc(d.replace(/^Steam/, ''))}</span>`).join('')}</div>` : '';
  const blocks = blockers.length ? `
    <div class="upf-label">Blocked</div>
    <ul class="upf-list is-bad">${blockers.map(b => `<li>${esc(b.message || b)}</li>`).join('')}</ul>` : '';
  /* The plist values the build will carry, and where each comes from. */
  const enc = UPF.encryptionAnswer(pid);
  const tgt = m.target || {};
  const settings = `
    <div class="upf-label">Set in the app</div>
    <ul class="upf-list">
      <li><span class="upf-id">plist</span>Version ${esc(tgt.version || '—')} <span class="upf-muted">(the Steam build's)</span> · build ${esc(tgt.build || '—')} · minimum macOS ${esc(tgt.minMacOS || '—')} · category ${esc((tgt.category || '').replace('public.app-category.', '') || '—')}</li>
      <li><span class="upf-id">plist</span>Export compliance: ${enc === true ? 'uses non-exempt encryption' : 'no non-exempt encryption'} <span class="upf-muted">${enc === null ? '(default — confirm it under Business)' : '(from your Business answer)'}</span></li>
    </ul>`;
  const confirm = blockers.length
    ? `<button class="imp-cta is-blocked" aria-disabled="true">Fix the blockers first</button>`
    : `<div class="upf-confirm">
         <div class="upf-confirm-text">The Steam build is left untouched. A copy is transformed as listed, signed with your Mac App Store certificate, packaged and uploaded to App Store Connect. About ten minutes, plus Apple's processing.</div>
         <button class="imp-cta" onclick="event.stopPropagation();upfBuildAndUpload('${pid}')">Build &amp; upload to App Store Connect</button>
       </div>`;
  const err = u.error ? `<div class="upf-error">${esc(u.error)}</div>` : '';
  return `<div class="upf-panel">${head}${verdict}${changes}${dark}${settings}${blocks}<div class="upf-actions">${confirm}</div>${err}</div>`;
}
