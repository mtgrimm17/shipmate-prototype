/* ============================================================
   APP — events, modal system, init
   ============================================================ */

/* ── Init ────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  // Load locale before first render so t() is ready
  if (typeof loadLocale === 'function') {
    await loadLocale();
  }
  // Shippy's bubbles: a burst of three every few seconds, with jitter so no
  // two are alike. They only show while the guide is collapsed, since that is
  // when the lane above the fab exists — the loop no-ops otherwise.
  if (typeof bubbleLoop === 'function') bubbleLoop();
  initSubnavDebugToggle();
  // Boot straight into the app (title bar persists) with the splash view showing.
  bootApp();
});

/* DEBUG — Ctrl+D swaps the band above the content between the row of sub-tab
   pills and a single line naming the section you're in.

   Session-only: it always boots OFF (pills visible) and is NOT persisted, so an
   accidental Ctrl+D can't hide the sub-tabs across reloads — a refresh always
   restores them. (Previously persisted to localStorage, which stuck the band in
   title-only mode and hid the Marketing/Details sub-tabs until pressed again.)

   Temporary: when the experiment is settled, delete this function, its call
   above, and state.subnavTitleOnly. */
function initSubnavDebugToggle() {
  state.subnavTitleOnly = false;
  // Clear any value a previous (persisting) build left behind.
  try { localStorage.removeItem('sm.subnavTitleOnly'); } catch (_) {}
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key || '').toLowerCase() !== 'd') return;
    // Never steal the key from a field the user is typing in.
    const el = document.activeElement;
    const tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
    e.preventDefault();
    state.subnavTitleOnly = !state.subnavTitleOnly;
    if (typeof renderAppSubnav === 'function') renderAppSubnav();
  });
}

/* The content scroller (.main) reserves a scrollbar gutter on its right; the
   fixed top bar doesn't. Measure that width and pad the top bar to match, so the
   header columns line up exactly with the content columns below. */
function measureScrollbar() {
  const m = document.querySelector('.main');
  const sbw = m ? Math.max(0, m.offsetWidth - m.clientWidth) : 0;
  document.documentElement.style.setProperty('--sbw', sbw + 'px');
}

/* Boot into main-app with the persistent title bar and the splash view active. */
function bootApp() {
  document.getElementById('splash-section')?.classList.add('hidden');
  document.getElementById('onboarding-overlay')?.classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  document.body.classList.add('signed-in');
  document.body.classList.remove('is-splash');
  if (!state.onboardingComplete && (!state.projects || state.projects.length === 0)) {
    try { completeOnboarding(); } catch (e) { /* keep going */ }
  }
  try { seedOnboardingToIOS(); seedOnboardingToAndroid(); } catch (e) {}
  // (Top-bar hover sub-menus removed — sub-tabs now live under the title bar.)
  showSplashView();
  measureScrollbar();
  requestAnimationFrame(measureScrollbar);   // again after first layout settles
  // (No token to warm anymore — the picklist search goes through our own
  // backend now, not direct IGDB/Twitch. See IGDB_SEARCH_ENDPOINT, claude.js.)
}
window.addEventListener('resize', () => { try { measureScrollbar(); } catch (e) {} });

/* Show the splash as an in-app view (no active tab, guide hidden, full width). */
function showSplashView() {
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('splash-section')?.classList.add('hidden');
  document.body.classList.remove('is-splash');
  document.body.classList.add('signed-in', 'viewing-splash');
  state.activeView = 'splash';
  for (const id of Object.values(VIEW_IDS)) document.getElementById(id)?.classList.add('hidden');
  for (const id of Object.values(VIEW_NAV)) {
    const b = document.getElementById(id);
    if (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); }
  }
  state.navExpanded = false;
  document.getElementById('splashview')?.classList.remove('hidden');
  renderProjectBar();
  if (typeof renderSubnav === 'function') renderSubnav();
  renderSplashView();
  window.scrollTo(0, 0);
}

/* ── Splash screen ───────────────────────────────────── */

function showSplash() {
  document.getElementById('splash-section').classList.remove('hidden');
  document.getElementById('onboarding-overlay').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  document.body.classList.add('is-splash');
  document.body.classList.remove('signed-in');
  if (window.__splashFitZoom) window.__splashFitZoom();
  renderLangMenu();
}

function hideSplash() {
  document.getElementById('splash-section').classList.add('hidden');
  document.body.classList.remove('is-splash');
}

/** "Get Started" button — always goes to onboarding for new users */
function startFromSplash() {
  hideSplash();
  showOnboarding();
}

/** "Sign In" button — returning users jump straight to their dashboard */
function signInFromSplash() {
  hideSplash();
  if (state.onboardingComplete) {
    showMainApp();
  } else {
    showOnboarding();
  }
}

function showMainApp(view = 'dashboard') {
  document.getElementById('onboarding-overlay').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  document.body.classList.add('signed-in');
  seedOnboardingToIOS();
  seedOnboardingToAndroid();
  // No "Continue" button anymore — make sure the first project exists up front.
  if (!state.onboardingComplete && (!state.projects || state.projects.length === 0)) {
    try { completeOnboarding(); } catch (e) { /* keep going */ }
  }
  setView(view);
}

/* ── Top-level tab switch: Add Game Details · Submit to Platforms · Spread the Word ── */
const VIEW_IDS = { details: 'details', dashboard: 'dashboard', broadcast: 'broadcast', performance: 'performance' };
const VIEW_NAV = { details: 'nav-details', dashboard: 'nav-dashboard', broadcast: 'nav-broadcast', performance: 'nav-performance' };
function setView(view) {
  if (!VIEW_IDS[view]) view = 'dashboard';
  state.activeView = view;
  document.getElementById('splashview')?.classList.add('hidden');   // leave the splash
  document.body.classList.remove('viewing-splash');
  for (const [v, id] of Object.entries(VIEW_IDS)) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', v !== view);
  }
  for (const [v, id] of Object.entries(VIEW_NAV)) {
    const btn = document.getElementById(id);
    if (btn) { const on = v === view; btn.classList.toggle('is-active', on); btn.setAttribute('aria-selected', String(on)); }
  }
  // With a tab selected, the other chips' icon squares drop to 5%.
  document.getElementById('bar-nav')?.classList.add('has-sel');
  paintBarGlow();
  if (view === 'details') renderDetails();
  else if (view === 'broadcast') renderBroadcast();
  else if (view === 'performance') renderPerformance();
  else renderDashboard();
  renderGuide();       // right pane = this tab's banner + task checklist
  if (typeof renderSubnav === 'function') renderSubnav();   // top-nav sub-tab drawer
  window.scrollTo(0, 0);
}

/* Netflix-style main-tab click: switch tabs (and open the sub-tab drawer), or
   toggle the drawer if you click the tab you're already on. */
function navTabClick(view) {
  setView(view);   // hover handles the dropdown; a click just navigates
}

/* Hover opens the sub-menu for that tab (tabs without sub-tabs close it). */
function navHoverTab(view) {
  const has = (typeof _navSubtabs === 'function') && !!_navSubtabs(view);
  if (has) {
    if (state.navOpenView === view && state.navExpanded) return;   // already open
    state.navOpenView = view;
    state.navExpanded = true;
    renderSubnav();
  } else if (state.navExpanded) {
    state.navExpanded = false;
    renderSubnav();
  }
}

/* Leaving the whole nav (incl. the dropdown, which is a child) closes it. */
function navLeaveNav() {
  if (!state.navExpanded) return;
  state.navExpanded = false;
  renderSubnav();
}

/* Wire hover once — delegated on the nav so the static buttons don't each need a handler. */
function wireNavHover() {
  const bn = document.getElementById('bar-nav');
  if (!bn || bn._hoverWired) return;
  bn._hoverWired = true;
  const ID2VIEW = { 'nav-details': 'details', 'nav-dashboard': 'dashboard', 'nav-broadcast': 'broadcast', 'nav-performance': 'performance' };
  bn.addEventListener('mouseover', (e) => {
    const btn = e.target.closest && e.target.closest('.bar-nav-btn');
    if (btn && ID2VIEW[btn.id]) navHoverTab(ID2VIEW[btn.id]);
  });
  bn.addEventListener('mouseleave', navLeaveNav);
}

/* Close the sub-tab drawer (used by the dim overlay). */
function closeNav() { state.navExpanded = false; renderSubnav(); }

/* Pick a sub-tab from the dropdown. Since menus open on hover, the open menu may
   belong to a tab you're NOT on — so switch to that tab first, then open the
   chosen section, then close the dropdown. */
function navSubClick(fn, id) {
  state.navExpanded = false;
  const view = state.navOpenView;
  if (view && state.activeView !== view) setView(view);   // jump to that tab first
  if (typeof window[fn] === 'function') window[fn](id);    // then open the section
  else renderSubnav();
}

/* Removed in the v3.92 guide rebuild (handoff §4): the guide is a fixed inset
   card with margin-top:0 now — no JS banner alignment. No-op for safety. */
function alignSidePanes() {}

/* Diffuse light behind the chip that carries news — the prototype's
   paintGlow(). "Spread the Word" is the only flagged chip, and the glow goes
   out once you're actually on it, matching the prototype's rule that a news
   flag only shows while the tab is unvisited. */
/* Removed in the v3.88 top-bar rebuild (handoff §1): the news glow is gone.
   Kept as a no-op so existing callers stay harmless. If "this tab has news"
   needs a signal again, use a 6px purple dot on the tab, not a glow. */
function paintBarGlow() {}

// The pill is fluid below 1200px, so the glow has to follow it.
window.addEventListener('resize', paintBarGlow);

/* Size the nav type so "MY LITTLE GAME" measures exactly 134px, whatever
   metrics the font that actually loads turns out to have. This is the
   prototype's calibrate(), ported verbatim.

   It matters more than it looks: the 14.08px in the prototype's :root is a
   pre-calibration placeholder that this function immediately overwrites, so
   copying that literal into CSS and stopping there left the nav noticeably
   smaller than the prototype renders. The measurement has to happen at
   runtime, after the webfont lands. */
/* Removed in the v3.88 top-bar rebuild (handoff §1): tab type is a fixed 10px
   literal now, so the webfont-measuring pass is dead. No-op for safety. */
function calibrateNavFs() {}

// Calibrate, then again once the webfont has actually loaded — and re-place the
// glow after, since the chips change width when the type is resized.
calibrateNavFs();
if (document.fonts?.ready) {
  document.fonts.ready.then(() => { calibrateNavFs(); paintBarGlow(); });
}

/* ── Performance dashboard handlers ───────────────────── */
function perfSetPeriod(id) { state.performance.period = id; renderPerformance(); }
/* §6 — Analysis section folders + Submission platform folders */
function perfSetSection(id) { state.performance.section = id; renderPerformance(); renderSubnav(); }
/* Submission: toggle the "+ Add platform" picker at the bottom of the column. */
function toggleAddPlatform() { state.submission.addOpen = !state.submission.addOpen; renderDashboard(); }
function perfOpen(portal) { bcToast(`${portal} — connect the account to pull live figures. (Mock data shown for now.)`); }
function perfJump(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

/* ── Marketing subsections ────────────────────────────── */
function mktSetSection(id) { state.marketing.section = id; renderBroadcast(); renderSubnav(); }

/* ── Game Details sub-tabs (Game Details / Distribution / Localization / Content / Assets) ── */
function gdSetSection(id) {
  state.details.section = id;
  if (id === 'localization') state.localizationSeen = true;   // visiting completes it
  renderDetails(); renderSubnav();
  if (typeof renderGuide === 'function') renderGuide();
}

/* Content Questions: switch the platform whose content-rating questionnaire is shown. */
function gdSetContentPlatform(pid) { state.details.contentPlatform = pid; renderDetails(); }

/* Shippy Guide horizontal collapse toggle (full card ↔ mini progress rail). */
function toggleGuide() { state.guideCollapsed = !state.guideCollapsed; renderGuide(); }

/* Drive the inline "analyzing → questionnaire" flow for the selected platform.
   First view of a platform shows a loading screen; after a short beat we snapshot
   which answers inference filled (enabling the Unanswered/All filter) and reveal
   the questionnaire, defaulting to the unanswered questions. */
async function _kickContentQ() {
  const pid = state.details.contentPlatform;
  if (!pid) return;
  if (!state.contentQ.status) state.contentQ.status = {};
  if ((state.contentQ.status[pid] || 'idle') !== 'idle') return;  // already loading/ready
  state.contentQ.status[pid] = 'loading';
  // Run the REAL AI inference (unified across active platforms). Cached by
  // 'unified:questionnaire', so switching platforms reuses the same result.
  try {
    if (typeof runInference === 'function') await runInference(pid, 'questionnaire');
  } catch (err) {
    console.warn('[ContentQ] inference failed:', err && err.message);
  }
  // Snapshot which answers inference filled, then default to "Unanswered".
  try { takeFilterSnapshot(pid); } catch (e) {}
  if (pid === 'ios')          state.iosContentRatingExpanded     = false;
  else if (pid === 'android') state.androidContentRatingExpanded = false;
  else if (pid === 'steam')   state.steamContentRatingExpanded   = false;
  state.contentQ.status[pid] = 'ready';
  if (state.activeView === 'details' && state.details.section === 'content') renderDetails();
}
function mktToast(what) { bcToast(`${what} — coming soon in the Marketing hub.`); }
function mktReachOut(name) { bcToast(`Drafted a tailored outreach message to ${name} — connect email to send.`); }

/* ── Launch calendar (checklist pane) ─────────────────── */
function setLaunchDate(v) {
  state.formData.releaseDate = v;
  state.formData.releaseTiming = 'specific_date';
  renderChecklist();
  if (state.activeView === 'dashboard') renderDashboard();   // refresh the Platforms timeline
}

// Checklist item → jump to its tab (and Marketing sub-tab), then scroll to the field.
function chkGo(view, anchor, section) {
  if (section && view === 'broadcast') state.marketing.section = section;
  if (section && view === 'details') state.details.section = section;
  setView(view);
  if (anchor) requestAnimationFrame(() => {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* ── Broadcast composer handlers ──────────────────────── */
// Live-refresh only the adapted-preview pane so the textarea keeps focus.
function bcRefreshAdapt() {
  const a = document.querySelector('.bc-adapt');
  if (a) a.outerHTML = buildBroadcastAdapt();
}
function bcSetMessage(v) { state.broadcast.message = v; bcRefreshAdapt(); }
function bcPreview(id)   { state.broadcast.previewDest = id; bcRefreshAdapt(); }
// Toggle a channel on/off. Auto storefronts toggle their power (storeOff);
// opt-in channels toggle membership in the active list.
function bcToggleChannel(id) {
  const b = state.broadcast;
  if (bcAutoStores().includes(id)) {
    const i = b.storeOff.indexOf(id);
    if (i >= 0) b.storeOff.splice(i, 1); else b.storeOff.push(id);
  } else {
    const i = b.active.indexOf(id);
    if (i >= 0) b.active.splice(i, 1); else b.active.push(id);
  }
  renderBroadcast();
}
function bcConnect(id) {
  const d = bcDest(id);
  bcToast(`Connect ${d ? d.name : 'this channel'} later — account linking is coming soon.`);
}
function bcToggleGroup(gid) {
  state.broadcast.expandedGroups[gid] = !state.broadcast.expandedGroups[gid];
  renderBroadcast();
}
function bcDraftWithAI() {
  const title = state.formData.title || 'Our game';
  state.broadcast.message =
    `${title} just got a major update! New content, fixes, and quality-of-life improvements are live today. ` +
    `Thanks to everyone in the community for the feedback that shaped this release — jump back in and let us know what you think.`;
  renderBroadcast();
}
function bcBroadcastNow() {
  const n = bcActiveChannels().length;
  if (!n) return;
  bcToast(`✓ Queued to ${n} channel${n === 1 ? '' : 's'} — connect accounts to post for real.`);
}
function bcSchedule() { bcToast('Scheduling comes with connected accounts — coming soon.'); }

// Lightweight self-contained toast (no dependency on other UI).
function bcToast(msg) {
  let el = document.getElementById('bc-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bc-toast';
    el.className = 'bc-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('is-shown');
  clearTimeout(bcToast._t);
  bcToast._t = setTimeout(() => el.classList.remove('is-shown'), 3200);
}

function showOnboarding() {
  // Onboarding is now the "Add Game Details" tab inside the main app (no modal).
  showMainApp('details');
  // Re-apply highlight state after every render (ob-modal markup is re-used)
  _setObValidating(false); // triggers the latch logic inside _setObValidating
  updateObSectionStates();
}


/* ── Onboarding modal ────────────────────────────────── */

function openOnboarding(tab = 0) {
  state.onboardingTab = tab;
  // Trigger B: user is returning to the modal after completing onboarding →
  // enable highlights so unanswered fields are visually flagged.
  if (state.onboardingComplete) state.showHighlights = true;
  showOnboarding();
}

function closeOnboarding() {
  if (!state.onboardingComplete) return; // can't close if not yet done
  setView('dashboard');
}

function setOnboardingTab(idx) {
  _setObValidating(false);
  state.onboardingTab = idx;
  renderOnboarding();
  // No paintShippyPanel() needed here: renderOnboarding -> renderOnboardingBody
  // -> updateObSectionStates() already repaints the guide, with the new tab
  // index in place.
}

/* Required fields per tab — maps tab index to OB_Q_ANSWERED keys */
const OB_TAB_REQUIRED = [
  ['title', 'platforms'],              // Tab 0: About
  ['distribution'],                    // Tab 1: Distribution
  ['screenshots'],                     // Tab 2: Assets
  ['compliance'],                        // Tab 3: Compliance
];

function _setObValidating(on) {
  // Once highlights are enabled by a trigger (returning visit or AI pre-pop),
  // callers can't turn them off — state.showHighlights latches it permanently.
  const active = on || state.showHighlights;
  document.getElementById('ob-modal')?.classList.toggle('is-validating', active);
  document.getElementById('submit-modal')?.classList.toggle('is-validating', active);
  document.getElementById('cq-modal')?.classList.toggle('is-validating', active);
}

function nextOnboardingTab() {
  // Prototype mode: advance freely — validation only triggers on Launch Dashboard
  _setObValidating(false);
  if (state.onboardingTab < 2) {
    state.onboardingTab++;
    renderOnboarding();
    const body = document.getElementById('ob-body');
    if (body) body.scrollTop = 0;
  }
}

function toggleOnboardingPlatform(pid) {
  if (state.activePlatforms.has(pid)) {
    state.activePlatforms.delete(pid);
  } else {
    state.activePlatforms.add(pid);
    if (!state.platformStepStatus[pid]) {
      state.platformStepStatus[pid] = makeEmptyPlatformSteps()[pid] || {};
    }
  }
  // Re-render just the platform tiles section in-place (platform is now in Game Details tab)
  const gridWrap = document.getElementById('ob-plat-grid-wrap');
  if (gridWrap) {
    gridWrap.innerHTML = buildObPlatTilesHTML();
    gridWrap.classList.toggle('is-req-empty', state.activePlatforms.size === 0);
  }
  renderOnboardingFooter();
  updateObSectionStates();
  if (typeof renderGuide === 'function') renderGuide();   // "Choose platforms" reacts live
}

function prevOnboardingTab() {
  if (state.onboardingTab > 0) {
    _setObValidating(false);
    state.onboardingTab--;
    renderOnboarding();
    const body = document.getElementById('ob-body');
    if (body) body.scrollTop = 0;
  }
}

function completeOnboarding() {
  // Prototype mode: no mandatory fields — launch dashboard freely.
  // Validation infrastructure (OB_TAB_REQUIRED, _setObValidating) retained for future use.

  // Re-entering onboarding on an already-created project (e.g. via the
  // dashboard's "Edit game details" button, which calls openOnboarding(0)
  // directly) must update that project in place instead of spawning a
  // duplicate. The only case that should create a brand-new project is
  // createNewProject()'s explicit _newProjectMode flag, or there being no
  // active project yet at all (first-ever onboarding).
  const existingProj = !state._newProjectMode
    ? state.projects.find(p => p.id === state.activeProjectId)
    : null;

  if (existingProj) {
    // Editing an existing project's details — save the live-edited flat
    // state (formData/uploads/answers/platforms) back onto it rather than
    // creating a new project record.
    saveCurrentToProject();
  } else if (state._newProjectMode) {
    // Creating a 2nd+ project — preserve activePlatforms selected during onboarding
    const ver  = makeEmptyVersion('1.0');
    const proj = {
      id:               generateId('proj'),
      name:             state.formData.title,
      formData:         JSON.parse(JSON.stringify(state.formData)),
      uploads:          JSON.parse(JSON.stringify(state.uploads)),
      questionAnswers:  JSON.parse(JSON.stringify(state.questionAnswers)),
      questionInferred: JSON.parse(JSON.stringify(state.questionInferred)),
      versions:         [ver],
      buildCounters:    makeBuildCounters(),
    };
    state.projects.push(proj);
    state.activeProjectId = proj.id;
    state.activeVersionId = ver.id;
    // Keep state.activePlatforms — already populated by platform tiles in onboarding
    state.platformStepStatus = makeEmptyPlatformSteps();
    state._newProjectMode    = false;
  } else {
    // First project ever
    const ver  = makeEmptyVersion('1.0');
    const proj = {
      id:               generateId('proj'),
      name:             state.formData.title,
      formData:         JSON.parse(JSON.stringify(state.formData)),
      uploads:          JSON.parse(JSON.stringify(state.uploads)),
      questionAnswers:  JSON.parse(JSON.stringify(state.questionAnswers)),
      questionInferred: JSON.parse(JSON.stringify(state.questionInferred)),
      versions:         [ver],
      buildCounters:    makeBuildCounters(),
    };
    state.projects.push(proj);
    state.activeProjectId = proj.id;
    state.activeVersionId = ver.id;
    // Keep state.activePlatforms — already populated by platform-select tab in onboarding
    state.platformStepStatus = makeEmptyPlatformSteps();
  }

  state.onboardingComplete = true;
  setView('dashboard');   // main app is already visible; just switch to the Submit tab
}


/* ── Task modal ──────────────────────────────────────── */

function openTaskModal(platformId, stepId) {
  const step = PLATFORMS[platformId].steps.find(s => s.id === stepId);
  if (step && (step.isSubmit || step.isReview)) {
    openSubmitModal(platformId);
    return;
  }
  state.activeModal = { type: 'task', platformId, stepId };
  renderTaskModal();
  document.getElementById('task-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeTaskModal() {
  state.activeModal = null;
  document.getElementById('task-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  // No renderDashboard() here — targeted updates handle any state changes
}

function taskOverlayClick(e) {
  if (e.target === document.getElementById('task-overlay')) {
    closeTaskModal();
  }
}

function markTaskDone(platformId, stepId) {
  state.platformStepStatus[platformId][stepId] = 'complete';

  // Targeted DOM update — animate only this dot, not all completed dots
  const dot = document.getElementById(`dot-${platformId}-${stepId}`);
  if (dot) {
    dot.classList.add('is-complete', 'just-completed');
    dot.addEventListener('animationend', () => dot.classList.remove('just-completed'), { once: true });
    const taskRow = dot.closest('.card-task');
    if (taskRow) taskRow.classList.add('is-done');
  }

  // Recalculate progress and update bar + step count
  const counts = platformStepCount(platformId);
  const pct = counts.total ? Math.round((counts.complete / counts.total) * 100) : 0;
  const barFill = document.getElementById(`bar-fill-${platformId}`);
  if (barFill) barFill.style.width = pct + '%';
  const stepCountEl = document.getElementById(`step-count-${platformId}`);
  if (stepCountEl) stepCountEl.textContent = `${counts.complete} / ${counts.total} steps`;

  // Unlock submit button if all required steps now done
  if (counts.allRequired && !counts.submitDone) {
    const submitBtn = document.getElementById(`submit-btn-${platformId}`);
    if (submitBtn) {
      submitBtn.classList.remove('is-locked');
      submitBtn.removeAttribute('disabled');
      submitBtn.setAttribute('title', 'Submit for review');
      submitBtn.setAttribute('onclick', `finalSubmit('${platformId}')`);
    }
  }

  closeTaskModal();
}

function markTaskUndone(platformId, stepId) {
  state.platformStepStatus[platformId][stepId] = 'not_started';

  // Targeted DOM update — remove complete state from this dot only
  const dot = document.getElementById(`dot-${platformId}-${stepId}`);
  if (dot) {
    dot.classList.remove('is-complete', 'just-completed');
    const taskRow = dot.closest('.card-task');
    if (taskRow) taskRow.classList.remove('is-done');
  }

  // Recalculate progress
  const counts = platformStepCount(platformId);
  const pct = counts.total ? Math.round((counts.complete / counts.total) * 100) : 0;
  const barFill = document.getElementById(`bar-fill-${platformId}`);
  if (barFill) barFill.style.width = pct + '%';
  const stepCountEl = document.getElementById(`step-count-${platformId}`);
  if (stepCountEl) stepCountEl.textContent = `${counts.complete} / ${counts.total} steps`;

  // Re-lock submit button if requirements no longer met
  if (!counts.allRequired && !counts.submitDone) {
    const submitBtn = document.getElementById(`submit-btn-${platformId}`);
    if (submitBtn) {
      submitBtn.classList.add('is-locked');
      submitBtn.setAttribute('disabled', '');
      submitBtn.setAttribute('title', 'Complete all steps first');
      submitBtn.removeAttribute('onclick');
    }
  }

  closeTaskModal();
}


/* ── iOS Step Modal ───────────────────────────────────── */

// Seed onboarding answers into iOS submission state (idempotent — only fills nulls)
function seedOnboardingToIOS() {
  if (!state.iosSubmitAnswers.privacyPolicyUrl && state.formData.privacyUrl) {
    state.iosSubmitAnswers.privacyPolicyUrl = state.formData.privacyUrl;
  }
  if (state.iosSubmitAnswers.hasIAP === null && state.questionAnswers.inAppPurchases !== null) {
    state.iosSubmitAnswers.hasIAP = state.questionAnswers.inAppPurchases;
    state.iosAnswerMeta.hasIAP = { humanConfirmed: true };
  }
  if (state.iosSubmitAnswers.collectsData === null && state.questionAnswers.dataCollection !== null) {
    state.iosSubmitAnswers.collectsData = state.questionAnswers.dataCollection;
    state.iosAnswerMeta.collectsData = { humanConfirmed: true };
  }
  if (state.iosSubmitAnswers.selectedCountries.length === 0) {
    const langs = new Set([state.formData.primaryLanguage, ...state.formData.localizations]);
    state.iosSubmitAnswers.selectedCountries = IOS_COUNTRIES
      .filter(c => langs.has(c.lang))
      .map(c => c.code);
    state.iosSubmitAnswers.distPreset = 'custom';
  }
}

async function openStepModal(pid, stepId) {
  // Always reset storePreview sub-section — never restore last flip position
  if (stepId === 'storePreview') {
    if (!state.storePreviewFlipTarget) state.storePreviewFlipTarget = {};
    state.storePreviewFlipTarget[pid] = null;
  }

  if (pid === 'web') {
    state.stepModal = { platformId: pid, stepId, inferenceStatus: null };
    document.getElementById('submit-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Visiting the Preview Website step marks it complete (unlocks Deploy)
    if (stepId === 'storePreview' && state.platformStepStatus?.web) {
      state.platformStepStatus.web.storePreview = 'complete';
    }
    renderStepModal();
    return;
  }

  if (pid === 'android') {
    seedOnboardingToAndroid();
    state.stepModal = { platformId: pid, stepId, inferenceStatus: null };
    document.getElementById('submit-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const andStep = PLATFORMS[pid].steps.find(s => s.id === stepId);
    if (andStep?.hasInference && CLAUDE_API_KEY) {
      state.stepModal.inferenceStatus = 'loading';
      renderStepModal();
      try {
        // Unified call: delete shared cache key so all platforms re-run together
        delete state.platformInferenceCache['unified:questionnaire'];
        await runInference(pid, stepId);
        state.stepModal.inferenceStatus = 'done';
        _postInferenceSetup(stepId);
      } catch(err) {
        state.stepModal.inferenceStatus = 'error';
        state.stepModal.inferenceError  = err.message === 'NO_KEY' ? 'No API key set.' : err.message;
      }
      reRenderAndroidStepModal();
      updateAndroidCard();
    } else if (stepId === 'improveSubmission') {
      _autoRunImproveSubmission(pid);
    } else {
      renderStepModal();
    }
    return;
  }
  if (pid === 'steam') {
    state.stepModal = { platformId: pid, stepId, inferenceStatus: null };
    document.getElementById('submit-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const stmStep = PLATFORMS[pid].steps.find(s => s.id === stepId);
    if (stmStep?.hasInference && CLAUDE_API_KEY) {
      state.stepModal.inferenceStatus = 'loading';
      renderStepModal();
      try {
        // Unified call: delete shared cache key so all platforms re-run together
        delete state.platformInferenceCache['unified:questionnaire'];
        await runInference(pid, stepId);
        state.stepModal.inferenceStatus = 'done';
        _postInferenceSetup(stepId);
      } catch(err) {
        state.stepModal.inferenceStatus = 'error';
        state.stepModal.inferenceError  = err.message === 'NO_KEY' ? 'No API key set.' : err.message;
      }
      reRenderSteamStepModal();
      updateSteamCard();
    } else if (stepId === 'improveSubmission') {
      _autoRunImproveSubmission(pid);
    } else {
      renderStepModal();
    }
    return;
  }

  seedOnboardingToIOS();

  state.stepModal = { platformId: pid, stepId, inferenceStatus: null };

  // Open overlay immediately so user sees something
  renderStepModal();
  // Mark Store Page Preview as visited before rendering
  if (stepId === 'storePreview') state.iosStorePreviewSeen = true;

  document.getElementById('submit-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // For inference steps: re-run every open to use latest accumulated knowledge
  const step = PLATFORMS[pid].steps.find(s => s.id === stepId);
  if (step?.hasInference) {
    state.stepModal.inferenceStatus = 'loading';
    renderStepModal();
    try {
      // Unified call: delete shared cache key so all platforms re-run together
      delete state.platformInferenceCache['unified:questionnaire'];
      await runInference(pid, stepId);
      state.stepModal.inferenceStatus = 'done';
      _postInferenceSetup(stepId);
    } catch(err) {
      state.stepModal.inferenceStatus = 'error';
      state.stepModal.inferenceError  = err.message === 'NO_KEY' ? 'No API key set.' : err.message;
    }
    reRenderStepModal();
    updateIOSCard();
  } else if (stepId === 'improveSubmission') {
    _autoRunImproveSubmission(pid);
  }
}

function closeStepModal() {
  // Clear the "came from Web's Key Art modal" detour flag whenever the step
  // modal closes by any means, so a stray future visit to Steam's Key Art
  // section (not via openSteamKeyArtFromWebEdit) doesn't inherit it.
  state.steamKeyArtFromWebEdit = false;

  // Record that this step has been saved/attempted at least once
  // (drives red-dot visibility and required-field alert visibility)
  const sm = state.stepModal;
  if (sm?.platformId && sm?.stepId) {
    if (!state.stepSaveAttempted) state.stepSaveAttempted = new Set();
    state.stepSaveAttempted.add(`${sm.platformId}-${sm.stepId}`);
  }

  // Tear down doc pane group wrapper if present
  const overlay = document.getElementById('submit-overlay');
  const group   = document.getElementById('step-modal-group');
  const modal   = document.getElementById('submit-modal');
  if (group && modal) {
    overlay.insertBefore(modal, group);
    group.remove();
  }
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
  updateIOSCard();
  updateAndroidCard();
  updateSteamCard();
  if (sm?.platformId === 'web') renderDashboard();
}

function toggleDocPane() {
  const pane  = document.getElementById('doc-pane');
  const tab   = document.getElementById('doc-pane-tab');
  const group = document.getElementById('step-modal-group');
  if (!pane) return;
  const willOpen = !pane.classList.contains('is-open');
  pane.classList.toggle('is-open', willOpen);
  if (tab)   tab.classList.toggle('is-open', willOpen);
  if (group) group.classList.toggle('pane-open', willOpen);
}

// Called by click-activated (?) icons — toggles the pane for the same section,
// or opens/navigates when a different section is clicked.
function openDocPaneSection(section, event) {
  event.stopPropagation();

  const pane  = document.getElementById('doc-pane');
  const tab   = document.getElementById('doc-pane-tab');
  const group = document.getElementById('step-modal-group');
  if (!pane) return;

  const isOpen        = pane.classList.contains('is-open');
  const activeSection = pane.dataset.activeSection;

  // Toggle: collapse if clicking the same section's (?) while pane is open
  if (isOpen && activeSection === section) {
    pane.classList.remove('is-open');
    if (tab)   tab.classList.remove('is-open');
    if (group) group.classList.remove('pane-open');
    delete pane.dataset.activeSection;
    const tip = document.getElementById('g-tip');
    if (tip) tip.classList.remove('is-visible');
    return;
  }

  // Open / switch section
  pane.dataset.activeSection = section;
  if (!isOpen) {
    pane.classList.add('is-open');
    if (tab)   tab.classList.add('is-open');
    if (group) group.classList.add('pane-open');
  }

  // Show the global tooltip next to the clicked (?) anchor
  const anchor = event.currentTarget;
  const tip    = document.getElementById('g-tip');
  if (tip && anchor) {
    const text = anchor.dataset.tip
      || (anchor.querySelector('.tooltip-body')?.textContent?.trim() || '');
    if (text) {
      const TIP_W  = 230;
      const MARGIN = 10;
      tip.textContent = text;
      tip.classList.add('is-visible');
      const r  = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const th = tip.offsetHeight;
      let left = r.left + r.width / 2 - TIP_W / 2;
      left = Math.max(MARGIN, Math.min(left, vw - TIP_W - MARGIN));
      let top = r.top - th - 8;
      if (top < MARGIN) top = r.bottom + 8;
      tip.style.left = left + 'px';
      tip.style.top  = top  + 'px';
      // Dismiss on the next click anywhere
      setTimeout(() => {
        document.addEventListener('click', () => tip.classList.remove('is-visible'), { once: true });
      }, 0);
    }
  }

  // Scroll to and flash-highlight the relevant doc section
  requestAnimationFrame(() => {
    const sectionEl = document.getElementById('doc-section-' + section);
    if (!sectionEl) return;
    const paneBody = document.querySelector('.doc-pane-body');
    if (paneBody) {
      const bodyRect    = paneBody.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();
      const scrollDelta = sectionRect.top - bodyRect.top - 12;
      paneBody.scrollBy({ top: scrollDelta, behavior: 'smooth' });
    }
    // Remove any existing highlight, then re-add
    document.querySelectorAll('.doc-section-highlight').forEach(el => {
      el.classList.remove('doc-section-highlight');
      void el.offsetWidth; // force reflow so animation restarts
    });
    sectionEl.classList.add('doc-section-highlight');
    setTimeout(() => sectionEl.classList.remove('doc-section-highlight'), 2200);
  });
}

// Row hover → softly highlight the corresponding doc section while pane is open
;(function initDocPaneRowHover() {
  let _lastHovered = null;
  document.addEventListener('mouseover', e => {
    const row = e.target.closest('.ios-q-row[data-doc-section]');
    if (!row) return;
    const pane = document.getElementById('doc-pane');
    if (!pane?.classList.contains('is-open')) return;
    const section = row.dataset.docSection;
    if (section === _lastHovered) return;
    // Remove old hover
    if (_lastHovered) {
      const prev = document.getElementById('doc-section-' + _lastHovered);
      if (prev) prev.classList.remove('doc-section-hover');
    }
    _lastHovered = section;
    const sectionEl = document.getElementById('doc-section-' + section);
    if (sectionEl) sectionEl.classList.add('doc-section-hover');
  });
  document.addEventListener('mouseout', e => {
    const row = e.target.closest('.ios-q-row[data-doc-section]');
    if (!row || row.contains(e.relatedTarget)) return;
    if (_lastHovered) {
      const el = document.getElementById('doc-section-' + _lastHovered);
      if (el) el.classList.remove('doc-section-hover');
      _lastHovered = null;
    }
  });
})();

function submitOverlayClick(e) {
  if (e.target === document.getElementById('submit-overlay')) closeStepModal();
}

// Update the iOS active card step completion states without full re-render
function updateIOSCard() {
  if (!state.activePlatforms.has('ios')) return;
  const checkSVG = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  PLATFORMS.ios.steps.forEach((step, i) => {
    const card = document.getElementById(`ios-step-card-${step.id}`);
    if (!card) return;
    const done = isIOSSectionComplete(step.id);
    card.classList.toggle('is-complete', done);
    const numEl = card.querySelector('.ios-step-num');
    if (numEl) {
      numEl.classList.toggle('is-done', done);
      numEl.classList.remove('is-risk-warn', 'is-risk-high');
      numEl.innerHTML = done ? checkSVG : String(i + 1);
    }
  });

  // Update submit step card lock state
  const counts = platformStepCount('ios');
  const submitCard = document.getElementById('ios-step-card-submit');
  if (submitCard) submitCard.classList.toggle('submit-step-locked', !counts.allRequired);
}

/* ── Legacy submit modal (non-iOS platforms) ─────────── */

function openSubmitModal(platformId) {
  state.submitModal.platformId = platformId;
  state.submitModal.expanded   = [];
  renderSubmitModal();
  document.getElementById('submit-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSubmitModal() {
  document.getElementById('submit-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function toggleRiskCategory(catId) {
  const idx = state.submitModal.expanded.indexOf(catId);
  if (idx === -1) state.submitModal.expanded.push(catId);
  else            state.submitModal.expanded.splice(idx, 1);
  // Toggle directly in DOM — no full re-render needed
  const el = document.getElementById('risk-cat-' + catId);
  if (el) el.classList.toggle('is-expanded', state.submitModal.expanded.includes(catId));
}

/* ── iOS Submit Modal — section toggle ───────────────── */

function toggleIOSSection(sectionId) {
  const idx = state.submitModal.expanded.indexOf(sectionId);
  if (idx === -1) state.submitModal.expanded.push(sectionId);
  else            state.submitModal.expanded.splice(idx, 1);
  const isOpen = state.submitModal.expanded.includes(sectionId);
  const el = document.getElementById('ios-sec-' + sectionId);
  if (el) el.classList.toggle('is-expanded', isOpen);
  if (sectionId === 'ios-distribution' && isOpen) {
    requestAnimationFrame(() => initDistributionMap());
  }
}

/* ── iOS Submit Modal — answer handlers ──────────────── */

// Re-render the step modal body while preserving scroll position
function reRenderStepModal() {
  // The Content rating questionnaire also lives inline in the Game Details pane
  // (not just the legacy step modal). When it's showing there, re-render just
  // that pane in place so every questionnaire interaction updates.
  if (state.activeView === 'details' && state.details && state.details.section === 'content') {
    const pane = document.querySelector('.gd-pane--content');
    if (pane && typeof buildContentQuestionsPane === 'function') {
      pane.innerHTML = buildContentQuestionsPane();
      return;
    }
  }
  const bodyEl   = document.getElementById('step-modal-body');
  const scrollTop = bodyEl ? bodyEl.scrollTop : 0;
  renderStepModal();
  const newBodyEl = document.getElementById('step-modal-body');
  if (newBodyEl) newBodyEl.scrollTop = scrollTop;
}

/* ── Global fixed-position tooltip ───────────────────── */
// Single delegated handler on document — avoids overflow/z-index clipping
// from scrolling containers. Tooltip text lives in data-tip on the anchor.
(function initGlobalTooltip() {
  const TIP_W = 230;
  const MARGIN = 10;

  function showTip(anchor) {
    const tip = document.getElementById('g-tip');
    if (!tip) return;
    // Prefer data-tip attribute; fall back to hidden .tooltip-body text
    let text = anchor.dataset.tip || '';
    if (!text) {
      const body = anchor.querySelector('.tooltip-body');
      if (body) text = body.textContent.trim();
    }
    if (!text) return;
    tip.textContent = text;
    tip.classList.add('is-visible');

    const r = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const th = tip.offsetHeight;

    // Horizontal: center on anchor, clamp to viewport
    let left = r.left + r.width / 2 - TIP_W / 2;
    left = Math.max(MARGIN, Math.min(left, vw - TIP_W - MARGIN));

    // Vertical: prefer above; fall back to below
    let top = r.top - th - 8;
    if (top < MARGIN) top = r.bottom + 8;

    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }

  function hideTip() {
    const tip = document.getElementById('g-tip');
    if (tip) tip.classList.remove('is-visible');
  }

  document.addEventListener('mouseover', e => {
    const anchor = e.target.closest('.tooltip-anchor');
    if (anchor) showTip(anchor);
  });
  document.addEventListener('mouseout', e => {
    const anchor = e.target.closest('.tooltip-anchor');
    if (anchor && !anchor.contains(e.relatedTarget)) hideTip();
  });
  document.addEventListener('scroll', hideTip, true);
})();

// Called by YES/NO and intensity/chip clicks — re-renders immediately
// Clicking the already-selected value toggles it back to null (deselect)
function answerIOSField(field, value) {
  const current      = state.iosSubmitAnswers[field];
  const meta         = state.iosAnswerMeta[field];
  const humanAlready = meta?.humanConfirmed === true;

  if (current === value && humanAlready) {
    // Human-confirmed answer clicked again → unselect
    state.iosSubmitAnswers[field] = null;
    delete state.iosAnswerMeta[field];
  } else if (current === value && !humanAlready) {
    // AI-inferred answer clicked → promote to human-confirmed, keep value
    state.iosAnswerMeta[field] = { ...(meta || {}), humanConfirmed: true };
  } else {
    // Different value selected → set and mark human
    state.iosSubmitAnswers[field] = value;
    state.iosAnswerMeta[field] = { ...(meta || {}), humanConfirmed: true };
  }
  reRenderStepModal();
}

// Called by text oninput — updates state only, no re-render (prevents cursor jumping)
function updateIOSTextField(field, value) {
  state.iosSubmitAnswers[field] = value;
}

/**
 * Set privacy policy URL across ALL platforms and the global formData at once.
 * Called from any platform's privacy URL input so they stay in sync.
 */
function setPrivacyUrl(url) {
  state.formData.privacyUrl                    = url;
  state.iosSubmitAnswers.privacyPolicyUrl      = url;
  state.androidSubmitAnswers.privacyPolicyUrl  = url;
  state.steamSubmitAnswers.privacyPolicyUrl    = url;
  // Sync sibling platform inputs that are currently in the DOM
  // (but don't change the one that's actively focused — it's the source)
  const active = document.activeElement;
  ['ios-privacy-url', 'android-privacy-url', 'steam-privacy-url'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== active && el.value !== url) el.value = url;
  });
  // Update card progress bars and section states — NO full re-render here
  // because that would destroy the focused input. Re-render happens on blur (see inputs).
  updateObSectionStates();
  updateAndroidCard();
  updateIOSCard();
  updateSteamCard?.();
}

/* ── Privacy matrix handlers ─────────────────────────── */

function togglePrivacyMatrix() {
  state.privacyMatrixExpanded = !state.privacyMatrixExpanded;
  reRenderStepModal();
}

function toggleContentRatingExpanded(value) {
  // Re-snapshot on "Unanswered" click so newly-answered questions get hidden
  if (!value) takeFilterSnapshot('ios');
  state.iosContentRatingExpanded = value;
  reRenderStepModal();   // routes to the inline pane when it's the active surface
}

function toggleAndroidContentRatingExpanded(value) {
  if (!value) takeFilterSnapshot('android');
  state.androidContentRatingExpanded = value;
  reRenderStepModal();
}

function toggleSteamContentRatingExpanded(value) {
  if (!value) takeFilterSnapshot('steam');
  state.steamContentRatingExpanded = value;
  reRenderStepModal();
}

/* ── Privacy preset chips ────────────────────────────── */
function togglePrivacyPreset(id) {
  const preset = PRIVACY_PRESETS.find(p => p.id === id);
  if (!preset) return;

  let curr = [...(state.privacyPresets || [])];

  if (id === 'guest') {
    // Guest is exclusive — toggle off all others
    state.privacyPresets = curr.includes('guest') ? [] : ['guest'];
  } else {
    // Any non-guest preset: deselect guest, toggle this one
    curr = curr.filter(p => p !== 'guest');
    state.privacyPresets = curr.includes(id)
      ? curr.filter(p => p !== id)
      : [...curr, id];
  }

  const selected  = state.privacyPresets;
  const hasGuest  = selected.includes('guest');
  const pid       = state.stepModal?.platformId;

  if (selected.length === 0) {
    // Nothing selected — clear descriptions AND any AI-inferred data types, then re-render
    if (state.iosSubmitAnswers) {
      state.iosSubmitAnswers.privacyDescription = '';
      state.iosSubmitAnswers.dataPerType        = {};
      state.iosSubmitAnswers.collectsData       = null;
    }
    if (state.androidSubmitAnswers) {
      state.androidSubmitAnswers.androidDataDescription = '';
    }
    state.privacyAIStatus = null;
    reRenderStepModal();
    return;
  }

  if (hasGuest) {
    state.iosSubmitAnswers.collectsData            = 'no';
    state.androidSubmitAnswers.collectsOrSharesData = 'no';
    state.iosSubmitAnswers.privacyDescription       = '';
    state.androidSubmitAnswers.androidDataDescription = '';
    reRenderStepModal();
    return;
  }

  // Non-guest presets selected
  state.iosSubmitAnswers.collectsData            = 'yes';
  state.androidSubmitAnswers.collectsOrSharesData = 'yes';
  const combined = selected
    .map(pid2 => PRIVACY_PRESETS.find(p => p.id === pid2)?.description || '')
    .filter(Boolean)
    .join(' ');
  state.iosSubmitAnswers.privacyDescription       = combined;
  state.androidSubmitAnswers.androidDataDescription = combined;

  // Trigger AI translation for the active platform only
  if (combined.length >= 20) {
    if (pid === 'ios')     _triggerPrivacyAI();
    if (pid === 'android') _triggerAndroidDataAI();
  }
  reRenderStepModal();
}

/* ── Privacy NLP → privacy label AI translation ───────── */

// Fires on blur (focus-out) — not on every keystroke
function updatePrivacyDescription(val) {
  state.iosSubmitAnswers.privacyDescription = val;
  _setInputComplete('ob-prv-nlp-textarea', !!(val?.trim()));
  if (!val || val.trim().length < 20) return;
  _triggerPrivacyAI();
}

async function _triggerPrivacyAI() {
  if (!CLAUDE_API_KEY) return;
  const desc = (state.iosSubmitAnswers.privacyDescription || '').trim();
  if (desc.length < 20) return;

  // If this exact description succeeded before, restore cached result instantly
  if (desc === state.privacyLastSuccessDesc && state.privacyLastSuccessResult) {
    state.iosSubmitAnswers.dataPerType = state.privacyLastSuccessResult;
    state.privacyAIStatus = 'complete';
    reRenderStepModal();
    return;
  }

  state.privacyAIStatus = 'loading';
  reRenderStepModal();

  const typeList    = IOS_DATA_TYPES.flatMap(g => g.types)
    .map(t => `${t.id}: ${t.label} — ${t.desc}`).join('\n');
  const purposeList = IOS_PURPOSES
    .map(p => `${p.id}: ${p.label} — ${p.desc}`).join('\n');

  const prompt = `You are helping a mobile game developer fill in Apple App Store Data Privacy labels.

Developer's description of their data collection:
"${desc}"

Available data type IDs:
${typeList}

Available purpose IDs:
${purposeList}

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "selections": [
    { "typeId": "<exact data type id>", "purposes": ["<purpose id>", ...], "tracking": "yes|no" }
  ]
}

Rules:
- Only include types clearly mentioned or strongly implied by the description.
- Only include purposes that genuinely apply to each type.
- Set tracking "yes" only if data crosses into third-party apps/websites for advertising.
- Be conservative — omit rather than guess.`;

  try {
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key':                                 CLAUDE_API_KEY,
        'anthropic-version':                         '2023-06-01',
        'content-type':                              'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 800,
        messages:   [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    });

    if (!res.ok) throw new Error('API ' + res.status);
    const data    = await res.json();
    const text    = (data.content?.[0]?.text || '').trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed  = JSON.parse(cleaned);

    const validTypeIds    = new Set(IOS_DATA_TYPES.flatMap(g => g.types).map(t => t.id));
    const validPurposeIds = new Set(IOS_PURPOSES.map(p => p.id));
    const newPerType      = {};

    for (const sel of (parsed.selections || [])) {
      if (!validTypeIds.has(sel.typeId)) continue;
      const purposes = (sel.purposes || []).filter(p => validPurposeIds.has(p));
      newPerType[sel.typeId] = {
        purposes,
        identity: 'no',
        tracking: sel.tracking === 'yes' ? 'yes' : 'no',
      };
    }

    state.iosSubmitAnswers.dataPerType = newPerType;
    state.privacyAIStatus = 'complete';
    state.privacyLastSuccessDesc   = desc;
    state.privacyLastSuccessResult = newPerType;
  } catch (e) {
    console.warn('[Privacy AI]', e.message);
    state.privacyAIStatus = 'error';
  }

  reRenderStepModal();
}

function togglePrivacyDataType(typeId) {
  // Clicking a row (but not a checkbox inside it) toggles selection
  const perType = state.iosSubmitAnswers.dataPerType;
  if (perType[typeId]) {
    delete perType[typeId];
  } else {
    // identity/tracking default to 'no' (unchecked = no, not unknown)
    perType[typeId] = { purposes: [], identity: 'no', tracking: 'no' };
  }
  reRenderStepModal();
}

function setPrivacyMeta(typeId, field, checked) {
  const perType = state.iosSubmitAnswers.dataPerType;
  if (!perType[typeId]) return;
  perType[typeId][field] = checked ? 'yes' : 'no';
  reRenderStepModal();
}

function togglePrivacyPurpose(typeId, purposeId, checked) {
  const perType = state.iosSubmitAnswers.dataPerType;
  if (!perType[typeId]) return;
  const arr = perType[typeId].purposes;
  if (checked && !arr.includes(purposeId)) arr.push(purposeId);
  if (!checked) perType[typeId].purposes = arr.filter(p => p !== purposeId);
  // Checkboxes manage themselves — no full re-render needed
}

function setPrivacyMeta(typeId, field, checked) {
  const perType = state.iosSubmitAnswers.dataPerType;
  if (!perType[typeId]) return;
  perType[typeId][field] = checked ? 'yes' : 'no';
  // Tracking warning updates lazily on next section re-open
}

/* ── Business — IAP Products list ─────────────────────
   state.iosSubmitAnswers.iapProducts, each a { id, name, desc, price, type,
   trial, collapsed } — see buildIapProductRow (render.js) for the row this
   backs. Same add/remove/field-mutate split as addWebLink/removeWebLink/
   setWebLinkField (Web Factsheet Links, further down this file): structural
   changes (add, remove, Type — which can reveal/hide the Free Trial row —
   Save, and expand) go through reRenderStepModal(); plain text fields
   mutate directly on oninput with no re-render, so typing doesn't lose
   focus mid-word. */
function addIapProduct() {
  state.iosSubmitAnswers.iapProducts.push({
    // locs holds this product's Name/Description localizations for every
    // supporting language — { [lang]: { name, desc, nameSourceText,
    // descSourceText } }, keyed by language exactly like
    // state.formData.localizedStoreText is keyed by language for the app's
    // own fields. Populated by IAP Localizations (buildIapLocalizationsSection,
    // render.js; _iapLocPropagateName/_iapLocTriggerAutoTranslate below) —
    // empty until the product is actually saved once (see saveIapProduct).
    id: generateId('iap'), name: '', desc: '', price: '', type: 'consumable', trial: 'no', collapsed: false, locs: {},
  });
  reRenderStepModal();
}
function removeIapProduct(id) {
  state.iosSubmitAnswers.iapProducts = state.iosSubmitAnswers.iapProducts.filter(p => p.id !== id);
  reRenderStepModal();
}
function setIapProductField(id, key, value) {
  const p = state.iosSubmitAnswers.iapProducts.find(p => p.id === id);
  if (p) p[key] = value;
}
// Live character-limit feedback for a product's Name/Description field
// (IAP_PRODUCT_FIELD_LIMITS, render.js) — the same soft-limit pattern as the
// App Store Product Page Preview's own startIasInlineEdit: a live remaining-
// count that goes negative and red, the field itself tinted red, and an
// inline "Must be less than N characters." message once over, but typing is
// never hard-blocked. Runs on every keystroke without a full
// reRenderStepModal() (same reason setIapProductField's own text fields
// skip it — re-rendering mid-word would lose focus/cursor position);
// instead it reaches directly into the DOM for the input's own counter row
// (its real next sibling, same technique as startLocReviewInlineEdit) and
// this card's Save button, disabling Save for as long as ANY field in the
// card is over its limit (saveIapProduct below also re-checks this itself,
// so the button staying enabled by some other means can never bypass it).
function updateIapCharCounter(inputEl, limit) {
  const remaining = limit - inputEl.value.length;
  const isOver = remaining < 0;
  inputEl.classList.toggle('is-over-limit', isOver);
  const counterRow = inputEl.nextElementSibling;
  if (counterRow && counterRow.classList.contains('ias-char-counter-row')) {
    const errorEl = counterRow.querySelector('.ias-char-error');
    const countEl = counterRow.querySelector('.ias-char-count');
    if (errorEl) errorEl.textContent = isOver ? `Must be less than ${limit} characters.` : '';
    if (countEl) { countEl.textContent = String(remaining); countEl.classList.toggle('is-over', isOver); }
  }
  const row = inputEl.closest('.iap-product-row');
  const saveBtn = row?.querySelector('.iap-product-actions .btn-primary');
  if (saveBtn) saveBtn.disabled = !!row.querySelector('.form-input.is-over-limit');
}
function setIapProductType(id, type) {
  const p = state.iosSubmitAnswers.iapProducts.find(p => p.id === id);
  if (!p) return;
  p.type = type;
  // Type governs whether the Free Trial row even applies (see
  // buildIapProductRow's isSub check) — re-render so switching to/from a
  // subscription type shows/hides it immediately.
  reRenderStepModal();
}
function setIapProductTrial(id, trial) {
  const p = state.iosSubmitAnswers.iapProducts.find(p => p.id === id);
  if (p) p.trial = trial;
  reRenderStepModal();
}
// Save collapses the card to just its name; clicking that name (expandIapProduct)
// reopens the full editable form. Both are structural (re-render) changes.
// The Save button is already disabled in the DOM whenever Name/Description
// is over its limit (buildIapProductRow's initial render + updateIapCharCounter's
// live updates above), but this guard is the actual source of truth — it's
// what makes going over the limit truly block saving, rather than merely
// looking disabled.
//
// Saving is also this product's "commit point" for IAP Localizations
// (buildIapLocalizationsSection, render.js) — the same role blur plays for
// the App Store Product Page Preview's own Title/Description fields
// (_iasSetFieldValue). Every save (not just the first) re-propagates Name
// and re-triggers Description's auto-translation into every supporting
// language, so a product's localizations stay in sync with whatever its
// Name/Description were most recently saved as — see
// _iapLocPropagateName/_iapLocTriggerAutoTranslate below. Both are no-ops
// with no supporting languages configured, and neither blocks the collapse
// above (fired-and-forgotten, same "kick off in the background" pattern
// _iasSetFieldValue itself uses).
function saveIapProduct(id) {
  const p = state.iosSubmitAnswers.iapProducts.find(p => p.id === id);
  if (!p) return;
  if (p.name.length > IAP_PRODUCT_FIELD_LIMITS.name || p.desc.length > IAP_PRODUCT_FIELD_LIMITS.desc) return;
  p.collapsed = true;
  _iapLocPropagateName(id, p.name);
  _iapLocTriggerAutoTranslate(id, 'desc', p.desc);
  reRenderStepModal();
}
function expandIapProduct(id) {
  const p = state.iosSubmitAnswers.iapProducts.find(p => p.id === id);
  if (p) p.collapsed = false;
  reRenderStepModal();
}
// Same "round to a .99 price" polish as the base game price (roundPrice
// above) — kept as its own function rather than reusing roundPrice
// directly, since that one hardcodes state.formData.price and would
// overwrite the base game price instead of this product's own.
function roundIapPrice(id, inputEl) {
  let val = parseFloat(inputEl.value);
  if (isNaN(val) || val <= 0) return; // free / blank — leave as-is
  if (Math.abs(val - Math.floor(val) - 0.99) < 0.001) return;
  const rounded = Math.round(val);
  const result = rounded > 0 ? (rounded - 0.01).toFixed(2) : val.toFixed(2);
  inputEl.value = result;
  setIapProductField(id, 'price', result);
}

/* ── Distribution map ────────────────────────────────── */

async function initDistributionMap() {
  const container = document.getElementById('distribution-map-container');
  if (!container) return;

  if (!_worldTopology) {
    container.innerHTML = '<div class="world-map-loading">Loading map…</div>';
    try {
      const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      _worldTopology = await res.json();
    } catch (e) {
      container.innerHTML = '<div class="world-map-loading">Map unavailable offline</div>';
      return;
    }
  }
  renderDistributionMap();
}

function renderDistributionMap() {
  const container = document.getElementById('distribution-map-container');
  if (!container || !_worldTopology) return;

  const W = container.offsetWidth || 480;

  const selected = new Set(
    (state.iosSubmitAnswers.selectedCountries || [])
      .map(code => (IOS_COUNTRIES.find(c => c.code === code) || {}).num)
      .filter(Boolean)
  );

  _drawMap(container, W, selected, new Set());
}

function toggleDistExpand() {
  const list = document.getElementById('dist-country-list');
  const btn  = document.getElementById('dist-expand-btn');
  if (!list || !btn) return;

  const isExpanded = list.classList.toggle('is-expanded');
  const extraCount = IOS_COUNTRIES.length - 10;

  if (isExpanded) {
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      Show fewer markets`;
  } else {
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      Show ${extraCount} more markets`;
    // Scroll the button back into view when collapsing
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function toggleIOSCountry(code) {
  // Manual edit → switch to Custom preset
  state.iosSubmitAnswers.distPreset = 'custom';

  const arr = state.iosSubmitAnswers.selectedCountries;
  const idx = arr.indexOf(code);
  if (idx === -1) arr.push(code); else arr.splice(idx, 1);

  // Update chip visual directly (avoid full re-render)
  const chip = document.getElementById('dist-chip-' + code);
  if (chip) chip.classList.toggle('is-on', idx === -1);

  // Update bar color directly
  const row = chip && chip.closest('.dist-country-row');
  const fill = row && row.querySelector('.dist-bar-fill');
  if (fill) fill.style.background = (idx === -1) ? 'rgba(74,222,128,0.5)' : 'var(--border-hover)';

  // Update preset button highlights without full re-render
  document.querySelectorAll('.dist-preset-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.textContent.trim() === 'Custom');
  });

  renderDistributionMap();
}

/* ── Claude AI handlers ───────────────────────────────── */

// Called by the Retry button on analysis error — delegates to unified retry
async function _runClaudeAnalysis() {
  await _retryInference('ios', state.stepModal?.stepId || 'questionnaire');
  updateIOSCard();
}

function clearClaudeResults() {
  state.iosSubmitAnswers        = makeBlankIOSAnswers();
  state.iosAnswerMeta           = {};
  state.claudeCache             = null;
  state.iosStorePreviewSeen     = false;
  state.stepModal.inferenceStatus = null;
  state.stepModal.inferenceError  = null;
  reRenderStepModal();
  updateIOSCard();
}


// English-speaking iOS markets
const DIST_PRESET_ENGLISH = IOS_COUNTRIES.filter(c => c.lang === 'en').map(c => c.code);

function setDistPreset(preset) {
  const ans = state.iosSubmitAnswers;
  ans.distPreset = preset;

  if (preset === 'everywhere') {
    ans.selectedCountries = IOS_COUNTRIES.map(c => c.code);
  } else if (preset === 'everywhere_except_cn') {
    ans.selectedCountries = IOS_COUNTRIES.filter(c => c.code !== 'CN').map(c => c.code);
  } else if (preset === 'english_only') {
    ans.selectedCountries = [...DIST_PRESET_ENGLISH];
  }
  // 'custom' → keep current selection as-is

  reRenderStepModal();
  requestAnimationFrame(() => initDistributionMap());
}

function confirmAndSubmit(platformId) {
  state.platformStepStatus[platformId]['reviewSubmission'] = 'complete';
  closeSubmitModal();
  renderDashboard();
}

// Opens the track-selection submit modal for platforms that have defined tracks
// (ios / android / steam). For platforms without tracks, submits directly.
/* Persist selected track from the inline card dropdown (no modal needed) */
function selectTrack(pid, trackId) {
  if (!state.selectedTracks) state.selectedTracks = {};
  state.selectedTracks[pid] = trackId;
  // Re-render just the submit step card so the "Submit →" button appears now that a track is chosen
  const cardEl = document.getElementById(pid + '-step-card-submit');
  if (cardEl && typeof buildSubmitStepCard === 'function') {
    const p        = PLATFORMS[pid];
    const counts   = platformStepCount(pid);
    const locked   = !counts.allRequired;
    const done     = state.platformStepStatus?.[pid]?.['submit'] === 'complete';
    const newHtml  = buildSubmitStepCard(pid, p ? p.steps.length : 0, locked, done);
    cardEl.outerHTML = newHtml;
  }
}

/* Confirm and execute the submit from the inline step card */
function confirmSubmit(pid) {
  // Web has no release track — deploy directly.
  if (pid === 'web') { _doFinalSubmit('web', 'production'); return; }
  if (!state.selectedTracks) state.selectedTracks = {};
  const trackId = state.selectedTracks[pid] || null;
  if (!trackId) {
    // Pulse the dropdown AND show a brief inline message
    const sel = document.getElementById('track-sel-' + pid);
    if (sel) {
      sel.classList.add('pulse-error');
      setTimeout(() => sel.classList.remove('pulse-error'), 700);
    }
    // Show a temporary "Choose Track first" chip near the submit card
    const card = document.getElementById(`${pid}-step-card-submit`);
    if (card && !card.querySelector('.submit-track-err')) {
      const err = document.createElement('div');
      err.className = 'submit-track-err';
      err.textContent = 'Select a track before submitting';
      card.appendChild(err);
      setTimeout(() => err.remove(), 2500);
    }
    return;
  }
  _doFinalSubmit(pid, trackId);
}

function openTrackSubmitModal(platformId) {
  const tracks = PLATFORM_TRACKS[platformId];
  if (!tracks || !tracks.length) {
    // No tracks defined — submit straight to production
    _doFinalSubmit(platformId, 'production');
    return;
  }
  renderTrackSubmitModal(platformId);
  document.getElementById('submit-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Called by the "Submit →" button inside the track-selection modal.
function _confirmTrackSubmit(platformId) {
  const radios = document.querySelectorAll(`input[name="track-sel-${platformId}"]`);
  let trackId = 'production';
  radios.forEach(r => { if (r.checked) trackId = r.value; });
  closeSubmitModal();
  _doFinalSubmit(platformId, trackId);
}

// Mints a ReleaseRecord and marks the submit step complete.
// Build numbers / version strings are always derived automatically — never typed.
function _doFinalSubmit(platformId, trackId) {
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  const ver  = proj?.versions.find(v => v.id === state.activeVersionId);
  if (proj && ver) {
    if (!ver.platformReleases) ver.platformReleases = {};
    if (!ver.platformReleases[platformId]) ver.platformReleases[platformId] = [];
    const rel = makeReleaseRecord(proj, platformId, trackId, ver.versionNumber);
    ver.platformReleases[platformId].push(rel);
  }
  state.platformStepStatus[platformId]['submit'] = 'complete';

  // Card-flip animation: rotate out → swap content → rotate in
  if (!state.platformFlipped) state.platformFlipped = {};
  if (!state.platformFlippedCardHeight) state.platformFlippedCardHeight = {};
  const card = document.getElementById('active-card-' + platformId);
  const flipData = { track: trackId, time: Date.now() };

  function _applyFlip() {
    // Lock the entire active-cards-grid height BEFORE re-rendering so the row
    // doesn't shift as the submitted card (shorter) replaces the active card.
    const grid = document.querySelector('.active-cards-grid');
    const gridHeight = grid ? grid.offsetHeight : 0;
    if (grid && gridHeight > 0) grid.style.minHeight = gridHeight + 'px';

    state.platformFlipped[platformId] = flipData;
    renderDashboard();
    // Flip-in: start from -90deg, ease to 0deg
    const newCard = document.getElementById('active-card-' + platformId);
    if (newCard) {
      // Pin card height too, as a secondary guard
      if (cardHeight > 0) newCard.style.minHeight = cardHeight + 'px';
      newCard.style.transform = 'perspective(700px) rotateY(-90deg)';
      newCard.style.transition = 'none';
      // Double rAF ensures the starting state is painted before the transition begins
      requestAnimationFrame(() => requestAnimationFrame(() => {
        newCard.style.transition = 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        newCard.style.transform  = 'perspective(700px) rotateY(0deg)';
        setTimeout(() => {
          newCard.style.transition = '';
          newCard.style.transform  = '';
          // Don't clear newCard.style.minHeight — card must stay at pre-flip height.
          // buildSubmittedCard already set the correct min-height via state;
          // clearing here would cause the post-animation snap the user sees.
          if (grid) grid.style.minHeight = '';
        }, 340);
      }));
    } else {
      // No card to animate — release grid pin immediately
      setTimeout(() => { if (grid) grid.style.minHeight = ''; }, 340);
    }
  }

  // Capture height before flip — saved to state so buildSubmittedCard can persist it across re-renders
  const cardHeight = card ? card.offsetHeight : 0;
  if (cardHeight > 0) state.platformFlippedCardHeight[platformId] = cardHeight;

  if (card) {
    // Flip-out: rotate to 90deg, then swap
    card.style.transition = 'transform 0.28s cubic-bezier(0.55, 0, 1, 0.45)';
    card.style.transform  = 'perspective(700px) rotateY(90deg)';
    setTimeout(_applyFlip, 290);
  } else {
    _applyFlip();
  }
}

// Legacy alias kept for any paths that still call finalSubmit directly.
function finalSubmit(platformId) {
  openTrackSubmitModal(platformId);
}

// Cancels a submission — removes the flip state and release record, returns card to pre-submission.
function cancelSubmission(pid) {
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  const ver  = proj?.versions.find(v => v.id === state.activeVersionId);

  // Remove the release record that was minted on submit
  if (ver?.platformReleases?.[pid]) {
    ver.platformReleases[pid].pop();
    if (ver.platformReleases[pid].length === 0) delete ver.platformReleases[pid];
  }

  // Reset submit step status
  if (state.platformStepStatus?.[pid]) {
    state.platformStepStatus[pid]['submit'] = 'not_started';
  }

  // Reverse-flip animation: rotate out → swap content → rotate in
  const card = document.getElementById('active-card-' + pid);
  const cardHeight = card ? card.offsetHeight : 0;

  function _applyUnflip() {
    if (state.platformFlipped) delete state.platformFlipped[pid];
    if (state.platformFlippedCardHeight) delete state.platformFlippedCardHeight[pid];
    renderDashboard();
    const newCard = document.getElementById('active-card-' + pid);
    if (newCard) {
      if (cardHeight > 0) newCard.style.minHeight = cardHeight + 'px';
      newCard.style.transform = 'perspective(700px) rotateY(90deg)';
      newCard.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        newCard.style.transition = 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        newCard.style.transform  = 'perspective(700px) rotateY(0deg)';
        setTimeout(() => {
          newCard.style.transition = '';
          newCard.style.transform  = '';
          newCard.style.minHeight  = '';
        }, 340);
      }));
    }
  }

  if (card) {
    card.style.transition = 'transform 0.28s cubic-bezier(0.55, 0, 1, 0.45)';
    card.style.transform  = 'perspective(700px) rotateY(-90deg)';
    setTimeout(_applyUnflip, 290);
  } else {
    _applyUnflip();
  }
}


/* ── Platform activate / deactivate ──────────────────── */

function blinkComingSoon(pid) {
  const badge = document.getElementById(`cs-badge-${pid}`);
  if (!badge || badge.classList.contains('is-blinking')) return;
  badge.classList.add('is-blinking');
  setTimeout(() => badge.classList.remove('is-blinking'), 700);
}

function activatePlatform(platformId) {
  state.activePlatforms.add(platformId);
  renderDashboard();
  // Shippy's platform item lives in the Details view, which renderDashboard()
  // never touches. Without this the checklist stays stale until something
  // else on the Details tab happens to fire a recalculation.
  updateObSectionStates();
  // Measure the steps face now so the credentials face can match its height on
  // the very first flip (before any steps face has actually been shown).
  _cacheStepsFaceHeight(platformId);
}

function deactivatePlatform(platformId) {
  state.activePlatforms.delete(platformId);
  // Reset the transient face (keep platformAuth so sign-in persists).
  if (state.platformFace) delete state.platformFace[platformId];
  renderDashboard();
  updateObSectionStates();   // same reason as activatePlatform
}


/* ── Platform developer-portal auth (prototype/faked) ─────────────────────────
   Each active card has two faces on one shell: STEPS and ACCOUNT (credentials).
   • Not signed in → ACCOUNT face shows the login form. Submitting flips to STEPS.
   • Signed in     → card rests on STEPS. The steps gear flips to the ACCOUNT face,
                     which shows a compact "signed in" summary; the account gear
                     reveals the login boxes again to change credentials.
   Credentials are faked — any non-empty pair is accepted, nothing is stored/sent.
   Sign-in persists for the session. Flip mirrors the submit flip in _doFinalSubmit.
   The ACCOUNT face is pinned to the cached STEPS height so flips stay size-stable. */

function _setPlatformFace(pid, face) {
  if (!state.platformFace) state.platformFace = {};
  state.platformFace[pid] = face;
}

// Measure the STEPS face height off-screen and cache it (px) for height parity.
function _cacheStepsFaceHeight(pid) {
  const live = document.getElementById('active-card-' + pid);
  if (!live) return;
  const width = live.offsetWidth;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;'
    + (width ? ('width:' + width + 'px;') : '');
  probe.innerHTML = buildActiveCard(pid, true); // force STEPS face
  document.body.appendChild(probe);
  const inner = probe.querySelector('.active-card');
  const h = inner ? inner.offsetHeight : 0;
  probe.remove();
  if (h > 0) {
    if (!state.platformCardHeight) state.platformCardHeight = {};
    state.platformCardHeight[pid] = h;
    // If the credentials face is currently on screen, apply the new height now.
    if (live.classList.contains('platform-account-card')) live.style.minHeight = h + 'px';
  }
}

// STATE 1 → STATE 3: sign in. Prototype accepts anything, including blank fields.
function submitPlatformLogin(pid) {
  const userEl = document.getElementById('login-user-' + pid);
  const username = userEl ? userEl.value.trim() : '';
  if (!state.platformAuth) state.platformAuth = {};
  state.platformAuth[pid] = { loggedIn: true, username };
  _flipPlatformCard(pid, 'steps', 1); // signed out → platform linked (steps)
}

// Linked (steps) gear → flip to the signed-in settings face (STATE 3 → STATE 2).
function platformGearFromSteps(pid) {
  _flipPlatformCard(pid, 'account', -1);
}

// Signed-in settings gear → flip back to the linked (steps) face (STATE 2 → STATE 3).
function platformGearFromAccount(pid) {
  _flipPlatformCard(pid, 'steps', 1);
}

// Signed-out gear → just highlight the login fields (no flip).
function highlightLoginFields(pid) {
  const els = ['login-user-' + pid, 'login-pass-' + pid]
    .map(id => document.getElementById(id)).filter(Boolean);
  els.forEach(el => {
    el.classList.remove('platform-login-input--highlight');
    void el.offsetWidth; // restart the animation
    el.classList.add('platform-login-input--highlight');
    setTimeout(() => el.classList.remove('platform-login-input--highlight'), 1200);
  });
  if (els[0]) els[0].focus();
}

// Sign out → return to the signed-out form (STATE 2 → STATE 1), in place.
function platformSignOut(pid) {
  if (state.platformAuth?.[pid]) state.platformAuth[pid].loggedIn = false;
  _setPlatformFace(pid, 'account');
  _rerenderPlatformCard(pid);
  const u = document.getElementById('login-user-' + pid); if (u) u.focus();
}

// Faked "Linked App" selection on the signed-in settings face.
function selectLinkedApp(pid, val) {
  if (!state.platformLinkedApp) state.platformLinkedApp = {};
  state.platformLinkedApp[pid] = val;
}


/* ── Connect flow (prototype, on-card + realistic sign-in modal) ──────────────
   Connecting is optional up front — cards start on the steps face with an
   alert-red cog. The cog flips to the connect face, which walks three short
   stages: install → sign in (opens the browser-framed sign-in modal) → add.
   Completing "Add" links the bot and flips back to steps. All faked. */

function _setConnectStage(pid, stage) {
  if (!state.connectStage) state.connectStage = {};
  state.connectStage[pid] = stage;
}

// Stage 1 → 2: "Install extension" (sticky global; re-render the connect face).
function connectInstall(pid) {
  state.extensionInstalled = true;
  _setConnectStage(pid, 'signin');
  _rerenderPlatformCard(pid);
}

// Open the browser-framed sign-in modal (simulates the real portal via extension).
function openAscLogin(pid) {
  state.ascLogin = pid;
  if (pid === 'android') { state.googleView = 'choose'; state.googleAccount = null; } // reset OAuth chooser
  renderAscLogin();
  const overlay = document.getElementById('connect-overlay');
  if (overlay) { overlay.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  requestAnimationFrame(() => { const u = document.getElementById('asc-user'); if (u) u.focus(); });
}

/* Google OAuth sub-flow: account chooser → consent. */
function googleSelectAccount(email) {
  state.googleAccount = email;
  state.googleView = 'consent';
  renderAscLogin();
}
function googleUseAnother() {
  state.googleView = 'add';
  renderAscLogin();
  requestAnimationFrame(() => { const e = document.getElementById('gp-email'); if (e) e.focus(); });
}
function googleAddNext() {
  const e = document.getElementById('gp-email');
  state.googleAccount = (e && e.value.trim()) || 'you@studio.com';
  state.googleView = 'consent';
  renderAscLogin();
}
// "Allow" on the consent screen → grant, close modal, advance to the add step.
function googleAllow(pid) {
  state.connectAccountEmail = state.connectAccountEmail || {};
  state.connectAccountEmail[pid] = state.googleAccount || shipmateBotEmail();
  closeAscLogin();
  _setConnectStage(pid, 'confirm');
  _rerenderPlatformCard(pid);
}

function closeAscLogin() {
  state.ascLogin = null;
  const overlay = document.getElementById('connect-overlay');
  if (overlay) { overlay.classList.add('hidden'); document.body.style.overflow = ''; }
}

function connectOverlayClick(e) {
  if (e.target === document.getElementById('connect-overlay')) closeAscLogin();
}

function renderAscLogin() {
  const m = document.getElementById('connect-modal');
  if (m) m.innerHTML = buildAscLoginModal();
}

// Sign-in submitted → close modal, advance the connect face to the "add" stage.
function ascLoginSubmit(pid) {
  const u = document.getElementById('asc-user');
  state.connectAccountEmail = state.connectAccountEmail || {};
  state.connectAccountEmail[pid] = (u && u.value.trim()) || '';
  closeAscLogin();
  _setConnectStage(pid, 'confirm');
  _rerenderPlatformCard(pid);
}

// Stage 3: "Add & connect" — link the bot and flip the card back to steps.
function connectAdd(pid) {
  if (!state.platformAuth) state.platformAuth = {};
  const email = state.connectAccountEmail?.[pid] || shipmateBotEmail();
  state.platformAuth[pid] = { loggedIn: true, username: email };
  if (state.connectStage) delete state.connectStage[pid];
  _flipPlatformCard(pid, 'steps', 1); // connect face → steps (now connected)
}

// Re-render a single active card in place (no flip animation).
function _rerenderPlatformCard(pid) {
  const card = document.getElementById('active-card-' + pid);
  if (card) card.outerHTML = buildActiveCard(pid);
  else renderDashboard();
}

// Flip a card to the target face. dir = 1 / -1 sets the rotation direction.
function _flipPlatformCard(pid, toFace, dir) {
  const outDeg = 90 * dir;
  const inDeg  = -90 * dir;
  const card   = document.getElementById('active-card-' + pid);

  // Leaving the STEPS face → cache its live height so the account face matches.
  if (toFace === 'account' && card && !card.classList.contains('platform-account-card')) {
    if (!state.platformCardHeight) state.platformCardHeight = {};
    const h = card.offsetHeight;
    if (h > 0) state.platformCardHeight[pid] = h;
  }
  _setPlatformFace(pid, toFace);

  function _apply() {
    const grid = document.querySelector('.active-cards-grid');
    const gridHeight = grid ? grid.offsetHeight : 0;
    if (grid && gridHeight > 0) grid.style.minHeight = gridHeight + 'px';

    renderDashboard();

    const newCard = document.getElementById('active-card-' + pid);
    if (newCard) {
      newCard.style.transform  = `perspective(700px) rotateY(${inDeg}deg)`;
      newCard.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        newCard.style.transition = 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        newCard.style.transform  = 'perspective(700px) rotateY(0deg)';
        if (toFace === 'account') {
          const u = document.getElementById('login-user-' + pid); if (u) u.focus();
        }
        setTimeout(() => {
          newCard.style.transition = '';
          newCard.style.transform  = '';
          if (grid) grid.style.minHeight = '';
        }, 340);
      }));
    } else if (grid) {
      setTimeout(() => { grid.style.minHeight = ''; }, 340);
    }
  }

  if (card) {
    card.style.transition = 'transform 0.28s cubic-bezier(0.55, 0, 1, 0.45)';
    card.style.transform  = `perspective(700px) rotateY(${outDeg}deg)`;
    setTimeout(_apply, 290);
  } else {
    _apply();
  }
}


/* ── Form helpers ────────────────────────────────────── */

// Auto-round prices to .99 convention (e.g. 5 → 4.99, 10 → 9.99)
function roundPrice(inputEl) {
  let val = parseFloat(inputEl.value);
  if (isNaN(val) || val <= 0) return; // free / blank — leave as-is
  // If the cents portion is already .99 don't touch it
  if (Math.abs(val - Math.floor(val) - 0.99) < 0.001) return;
  // Round to nearest whole dollar then subtract 0.01
  const rounded = Math.round(val);
  const result = rounded > 0 ? (rounded - 0.01).toFixed(2) : val.toFixed(2);
  inputEl.value = result;
  state.formData['price'] = result;
}

/* ── Onboarding section rail predicates ──────────────── */

// Returns true when all required fields for a given section are filled.
// Called by updateObSectionStates() to drive the amber rail + header tint.
const OB_SECTION_ANSWERED = {
  about:        () => !!(state.formData.title?.trim()) &&
                      !!(state.formData.description?.trim()),
  platforms:    () => state.activePlatforms.size > 0,
  distribution: () => !!state.formData.distributionPreset,
  localization: () => !!state.formData.primaryLanguage,  // defaults to 'en' — always answered
  screenshots:  () => state.uploads.screenshots.length > 0,
  compliance:   () => QUESTIONS.every(q => state.questionAnswers[q.id] !== null),
  // Optional sections — never shown as unanswered
  trailer:      () => true,
};

// Per-question answered predicates (drives ob-q data-answered for individual field rails)
const OB_Q_ANSWERED = {
  title:        () => !!(state.formData.title?.trim()),
  desc:         () => !!(state.formData.description?.trim()),
  platforms:    () => state.activePlatforms.size > 0,
  distribution: () => !!state.formData.distributionPreset,
  screenshots:  () => state.uploads.screenshots.length > 0,
  compliance:   () => QUESTIONS.every(q => state.questionAnswers[q.id] !== null),
};

// Toggle is-complete on a specific input element (used for text inputs/textareas)
function _setInputComplete(id, isComplete) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('is-complete', isComplete);
}

function updateObSectionStates() {
  // Per-question rails — each individual field gets its own amber indicator
  for (const [id, pred] of Object.entries(OB_Q_ANSWERED)) {
    const el = document.getElementById('ob-q-' + id);
    if (el) el.setAttribute('data-answered', pred() ? '1' : '0');
  }
  // Section-level state kept for header tinting only (no visual rail)
  for (const [id, pred] of Object.entries(OB_SECTION_ANSWERED)) {
    const el = document.getElementById('ob-sec-' + id);
    if (el) el.classList.toggle('is-unanswered', !pred());
  }
  // If in validation mode and all required fields for this tab are now filled, clear validation
  const required = OB_TAB_REQUIRED[state.onboardingTab] || [];
  if (required.every(id => OB_Q_ANSWERED[id]?.())) {
    _setObValidating(false);
  }
  // Sync is-complete on text inputs — correct after any tab render
  _setInputComplete('ob-title',            !!(state.formData.title?.trim()));
  _setInputComplete('ob-desc',             !!(state.formData.description?.trim()));
  _setInputComplete('ob-prv-nlp-textarea', !!(state.iosSubmitAnswers?.privacyDescription?.trim()));
  // Shippy's checklist reads the same predicates, so it repaints here. This is
  // the one hook every field change already funnels through — a dozen call
  // sites, from keystrokes to platform toggles to screenshot drops — which is
  // why the panel goes here rather than being wired up at each of them.
  paintShippyPanel();
}

// Keeps the top-right project bar's game title in sync the moment
// state.formData.title changes, without waiting for the next full
// renderProjectBar() (which also rebuilds the nav labels, the release
// dropdown, and re-measures the nav glow — unnecessary work on every
// keystroke). Called from syncField('title', ...) (typing the title field)
// and selectPicklistItem (picking a game from the IGDB search picklist) —
// the two places the title can change during onboarding.
//
// Patches two things: the closed chip (#projectSelectorTitle) and, if the
// project dropdown is currently open, the active project's own row inside
// it (.project-item.active, #projectDropdown) — that row previously only
// ever showed the PROJECT RECORD's saved name (proj.name, written back only
// by saveCurrentToProject() at save points like switching project/version
// or completing onboarding), so a title just typed or picked here wouldn't
// show up in the dropdown until some unrelated action happened to trigger
// one of those saves — it would keep reading "Untitled Game" even after a
// game was clearly already selected. An earlier version of this function
// tried to patch a #projectItemCurrent element that was never actually
// given that id anywhere in the dropdown's own markup (renderProjectBar,
// render.js) — a dead, always-null lookup — which is how this went
// unnoticed. renderProjectBar's own dropdown-row template (render.js) now
// separately falls back to this same live title for its permanent fix on
// every full re-render; this function is just the fast path in between.
function _syncProjectBarTitle(value) {
  const selEl = document.getElementById('projectSelectorTitle');
  if (selEl) selEl.textContent = value || 'My Game';
  const activeDropdownItem = document.querySelector('#projectDropdown .project-item.active');
  if (activeDropdownItem) activeDropdownItem.textContent = value || t('bar.untitled_game');
}

function syncField(field, value) {
  state.formData[field] = value;
  // Keep platform privacy URLs in sync when the global field is updated
  if (field === 'privacyUrl') {
    state.iosSubmitAnswers.privacyPolicyUrl     = value;
    state.androidSubmitAnswers.privacyPolicyUrl = value;
  }
  if (field === 'title') _syncProjectBarTitle(value);
  if (field === 'description') _wsPropagateAboutGame(value);
  // Force-sync into the Web platform's own independent trailer slot — same
  // whole-value overwrite treatment as the trailer FILE gets in
  // handleTrailerFiles/removeTrailer (see the state.js comment above
  // webSite.trailerFile).
  if (field === 'trailerUrl') { if (!state.webSite) state.webSite = {}; state.webSite.trailerUrl = value; }
  // Live is-complete on the typed input — immediate feedback as user types/clears
  const FIELD_INPUT_MAP = { title: 'ob-title', description: 'ob-desc' };
  if (FIELD_INPUT_MAP[field]) _setInputComplete(FIELD_INPUT_MAP[field], !!(value?.trim()));
  // Update section rails reactively
  updateObSectionStates();
  // Reactively refresh the Shippy Guide checklist (a field gaining/losing a
  // value flips its checkbox) — event-driven, not polling.
  if (typeof renderGuide === 'function') renderGuide();
}

function charCount(countId, value, max) {
  const el = document.getElementById(countId);
  if (!el) return;
  const len = (value || '').length;
  const note = el.querySelector('.char-note');
  // "12/30", not "12 / 30" — the prototype's spacing.
  el.textContent = `${len}/${max}`;
  if (note) el.appendChild(note);
  el.className = 'char-count';
  if (len > max * 0.9) el.classList.add('is-warn');
  if (len > max)       el.classList.add('is-over');
}


function toggleLang(el, code) {
  const idx = state.formData.localizations.indexOf(code);
  if (idx === -1) { state.formData.localizations.push(code); el.classList.add('is-on'); }
  else            { state.formData.localizations.splice(idx, 1); el.classList.remove('is-on'); }
  updateWorldMap();
}

/* ── Onboarding Distribution Map & Localization ──────── */

const OB_REGULATORY_EXCLUSIONS = ['CN', 'KR', 'JP', 'DE', 'BE', 'VN', 'ZA'];

function _obCountriesForPreset(preset) {
  switch (preset) {
    case 'everywhere':
    case 'global':              return IOS_COUNTRIES.map(c => c.code);
    case 'english_only':        return IOS_COUNTRIES.filter(c => c.lang === 'en').map(c => c.code);
    case 'minimize_regulation': return IOS_COUNTRIES.filter(c => !OB_REG_TIPS[c.code]).map(c => c.code);
    default:                    return state.formData.selectedCountries || IOS_COUNTRIES.map(c => c.code);
  }
}

function setObDistPreset(preset) {
  if (state.formData.distributionPreset === preset) {
    // Toggle off — deselect the preset
    state.formData.distributionPreset = null;
  } else {
    state.formData.distributionPreset = preset;
    if (preset !== 'custom') {
      // Apply the preset's country list
      state.formData.selectedCountries = _obCountriesForPreset(preset);
    }
    // 'custom' keeps whatever countries are currently selected
  }
  _refreshObDistSection();
  if (typeof renderGuide === 'function') renderGuide();   // "Select target countries" reacts live
}

function _selectionMatchesPreset(preset) {
  const expected = new Set(_obCountriesForPreset(preset));
  const actual   = new Set(state.formData.selectedCountries || []);
  if (expected.size !== actual.size) return false;
  for (const c of expected) { if (!actual.has(c)) return false; }
  return true;
}

function toggleObCountry(code) {
  const arr = state.formData.selectedCountries;
  const idx = arr.indexOf(code);
  if (idx === -1) arr.push(code); else arr.splice(idx, 1);

  // Snap preset label to whichever named preset matches the new selection, else 'custom'
  const namedPresets = ['everywhere', 'english_only', 'minimize_regulation'];
  const matched = namedPresets.find(p => _selectionMatchesPreset(p));
  state.formData.distributionPreset = matched || 'custom';

  // Update map + lang list; update chips in-place to preserve expand state
  renderObDistMap();
  updateObLangListWrap();
  _refreshCountryListInPlace();
  // Refresh preset pills
  document.querySelectorAll('.ob-preset-pill[data-preset]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.preset === state.formData.distributionPreset);
  });
  // Picking countries can flip the preset, and the preset is what the
  // checklist reads for Distribution.
  updateObSectionStates();
  if (typeof renderGuide === 'function') renderGuide();
}

function _refreshCountryListInPlace() {
  // Update row states in-place without collapsing the extra list
  const selected = new Set(state.formData.selectedCountries || []);
  document.querySelectorAll('.ob-dist-row[data-code]').forEach(row => {
    const code = row.dataset.code;
    const isOn = selected.has(code);
    row.classList.toggle('is-on', isOn);
    const chip = row.querySelector('.ob-dist-row-chip');
    if (chip) chip.classList.toggle('is-on', isOn);
    const tipIcon = row.querySelector('.tooltip-icon');
    if (tipIcon) tipIcon.classList.toggle('is-warned', isOn);
  });
}

function _refreshObDistSection() {
  renderObDistMap();
  updateObCountryList();
  updateObLangListWrap();
  // Refresh dist preset pill active states
  document.querySelectorAll('.ob-preset-pill[data-preset]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.preset === state.formData.distributionPreset);
  });
  // Update required-empty indicator on preset group
  const presetGroup = document.getElementById('ob-dist-preset-group');
  if (presetGroup) {
    presetGroup.classList.toggle('is-req-empty', !state.formData.distributionPreset);
  }
  updateObSectionStates();
}

function _refreshCountrySummary() {
  const el = document.querySelector('.ob-country-count');
  if (!el) return;
  const count = (state.formData.selectedCountries || []).length;
  el.textContent = `${count} ${count === 1 ? 'country' : 'countries'} selected`;
}

function updateObCountryList() {
  const el = document.getElementById('ob-country-list-wrap');
  if (el) el.innerHTML = buildObCountryChips();
}

function toggleObCountryList() {
  const table   = document.getElementById('ob-country-table');
  const chevron = document.getElementById('ob-country-chevron');
  if (!table) return;
  const nowExpanded = table.classList.toggle('is-expanded');
  if (chevron) chevron.innerHTML = nowExpanded ? _chevUp : _chevDown;
}

/* ── Localization handlers ───────────────────────────── */

function _computeLangPresetSelections(preset) {
  const fd      = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const countries = fd.selectedCountries || [];

  // Aggregate gamers per non-primary language
  const langTotals = {};
  IOS_COUNTRIES.forEach(c => {
    if (!countries.includes(c.code) || c.lang === primary) return;
    langTotals[c.lang] = (langTotals[c.lang] || 0) + (c.gamers || 0);
  });
  const ranked = Object.entries(langTotals).sort(([,a],[,b]) => b - a).map(([l]) => l);

  if (preset === 'recommended')  return ranked.slice(0, 2);
  if (preset === 'primary_only') return [];
  if (preset === 'all_regions')  return ranked;
  return fd.localizations || [];
}

/* ── Localization picker handlers ────────────────────── */

function toggleLocPrimaryDropdown(event) {
  event.stopPropagation();
  const wrap = document.getElementById('loc-primary-wrap');
  if (!wrap) return;
  const isOpen = wrap.classList.contains('is-open');
  closeAllDropdowns();
  if (!isOpen) wrap.classList.add('is-open');
}

function selectLocPrimary(lang) {
  const fd = state.formData;
  const oldPrimary = fd.primaryLanguage || 'en';
  // Demote old primary into supported (if it's in the featured set and not already there)
  if (lang !== oldPrimary) {
    const locs = new Set(fd.localizations || []);
    const oldPrimaryKept = OB_LANG_FEATURED.includes(oldPrimary);
    if (oldPrimaryKept) locs.add(oldPrimary);
    locs.delete(lang); // new primary leaves supported
    fd.localizations  = [...locs];

    // Keep each language's App Store Product Page Preview Title/Subtitle/
    // Description/What's New attached to its own language code rather than
    // to whichever language happens to be "primary" right now — otherwise
    // switching Primary Language would make the new primary's preview
    // suddenly show the OLD primary's text (since the preview always reads
    // the flat fields for whichever language is primary), silently hiding
    // any translation already written for the incoming primary language.
    if (!fd.localizedStoreText) fd.localizedStoreText = {};
    if (oldPrimaryKept) {
      // Stash the outgoing primary's copy under its own language code —
      // only if it's staying around as a supported language; if not (a
      // non-featured language demoted from primary isn't kept as a
      // supported language at all, per the logic above), its text has
      // nowhere left to live in this preview and is dropped, matching the
      // existing loss of that language's *selection* in the same case.
      fd.localizedStoreText[oldPrimary] = {
        title:        fd.title        || '',
        subtitle:     fd.subtitle     || '',
        description:  fd.description  || '',
        releaseNotes: fd.releaseNotes || '',
      };
    }
    // Promote the incoming primary's own stored translation (if any) into
    // the flat fields Game Details and every other platform's preview read.
    const incoming = fd.localizedStoreText[lang] || _iasBlankLocalizedText();
    fd.title        = incoming.title;
    fd.subtitle     = incoming.subtitle;
    fd.description  = incoming.description;
    fd.releaseNotes = incoming.releaseNotes;
    delete fd.localizedStoreText[lang];

    fd.primaryLanguage = lang;
    // Every supporting language's Title/Subtitle/Description/What's New is
    // now stale against the newly-promoted primary's text (including the
    // language just stashed above, which is a regular supported language
    // again) — refresh everything from the new primary, since nothing
    // protects any supporting language's copy from this update.
    _iasPropagateAllFields();
  }
  closeAllDropdowns();
  updateObLangListWrap();
}

// Legacy alias — kept for any older callers
function setObPrimaryLang(lang) { selectLocPrimary(lang); }

function setObLangPreset(preset) {
  const beforeLangs = state.formData.localizations || [];
  state.formData.localizationPreset = preset;
  state.formData.localizations      = _computeLangPresetSelections(preset);
  updateObLangListWrap();
  // Bulk selection bypasses toggleObLang entirely, so any newly-added
  // language needs its own initial translation pass triggered here.
  _iasPropagateAllFields();
  // Same reasoning as toggleObLang — bulk selection also bypasses the
  // per-language Steam localization check, so run it for every language
  // this preset newly added.
  _checkSteamLocalizedDescriptionForNewLangs(beforeLangs, state.formData.localizations);
  // Update pill states
  document.querySelectorAll('.ob-preset-pill').forEach(btn => {
    const presetMap = {
      'Recommended':'recommended',
      'Primary Language only':'primary_only',
      'Localize for all selected regions':'all_regions',
    };
    const pid = presetMap[btn.textContent.trim()];
    if (pid) btn.classList.toggle('is-active', pid === preset);
  });
}

function applyObLangPreset() {
  // Re-apply current lang preset when primary language changes
  const beforeLangs = state.formData.localizations || [];
  const preset = state.formData.localizationPreset || 'recommended';
  state.formData.localizations = _computeLangPresetSelections(preset);
  updateObLangListWrap();
  _iasPropagateAllFields();
  _checkSteamLocalizedDescriptionForNewLangs(beforeLangs, state.formData.localizations);
}

function toggleObLang(lang) {
  const primary = state.formData.primaryLanguage || 'en';
  if (lang === primary) return;
  const arr = state.formData.localizations || [];
  const idx = arr.indexOf(lang);
  if (idx === -1) {
    arr.push(lang);
    state.formData.localizations = arr;
    // Newly-added language — give it an initial translation of the primary
    // language's current Subtitle/Description/What's New right away rather
    // than waiting for those fields to change again.
    _iasPropagateAllFields();
    // If this game is Steam-linked and its store page has been localized
    // into this language, prefer Steam's own "About This Game" copy for the
    // Description field over the Claude translation just triggered above
    // (see _checkSteamLocalizedDescription — it's async and, if it finds a
    // genuine localization, overwrites the field after the fact).
    _checkSteamLocalizedDescription(lang);
  } else {
    arr.splice(idx, 1);
    state.formData.localizations = arr;
  }
  // Full re-render so the Shipmate tip ! badge moves to the next best candidate
  updateObLangListWrap();
}

function _refreshLangListInPlace() {
  const selected = new Set(state.formData.localizations || []);
  // Update chip states in-place
  document.querySelectorAll('#loc-chips .loc-chip:not(.loc-chip-add)').forEach(chip => {
    const onclick = chip.getAttribute('onclick') || '';
    const m = onclick.match(/toggleObLang\('([^']+)'\)/);
    if (!m) return;
    const lang = m[1];
    const isOn = selected.has(lang);
    chip.classList.toggle('is-on', isOn);
  });
}

function updateObLangListWrap() {
  const el = document.getElementById('ob-lang-list-wrap');
  if (el) el.innerHTML = buildObLangList();
}

function updateObLangRecs() { updateObLangListWrap(); } // alias for old callers

function toggleObLangList(btn) {
  const list = document.getElementById('ob-lang-list');
  if (!list) return;
  const expanded = list.classList.toggle('is-expanded');
  btn.innerHTML = expanded
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg> Show fewer languages`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> Show more languages`;
}

async function initObDistMap() {
  // Populate selectedCountries from preset only if a preset is already chosen
  const preset = state.formData.distributionPreset;
  if (!state.formData.selectedCountries?.length && preset && preset !== 'custom') {
    state.formData.selectedCountries = _obCountriesForPreset(preset);
    updateObLangRecs();
  }

  const container = document.getElementById('ob-dist-map-container');
  if (!container) return;

  if (!_worldTopology) {
    container.innerHTML = '<div class="world-map-loading">Loading map…</div>';
    try {
      const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      _worldTopology = await res.json();
    } catch (e) {
      container.innerHTML = '<div class="world-map-loading">Map unavailable offline</div>';
      return;
    }
  }
  renderObDistMap();
}

function renderObDistMap() {
  const container = document.getElementById('ob-dist-map-container');
  if (!container || !_worldTopology) return;

  const W = container.offsetWidth || 480;
  const selected = new Set(
    (state.formData.selectedCountries || [])
      .map(code => (IOS_COUNTRIES.find(c => c.code === code) || {}).num)
      .filter(Boolean)
  );
  _drawMap(container, W, selected, new Set());
}

function updateObLangRecs() {
  const el = document.getElementById('ob-lang-recs');
  if (el) el.innerHTML = buildObLangRecs();
}

/* ── World Map ───────────────────────────────────────── */

let _worldTopology = null;  // cached fetch

async function initWorldMap() {
  const container = document.getElementById('world-map-container');
  if (!container) return;

  if (!_worldTopology) {
    container.innerHTML = '<div class="world-map-loading">Loading map…</div>';
    try {
      const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      _worldTopology = await res.json();
    } catch (e) {
      container.innerHTML = '<div class="world-map-loading">Map unavailable offline</div>';
      return;
    }
  }
  renderWorldMap();
}

function updateWorldMap() {
  if (_worldTopology) renderWorldMap();
}

function renderWorldMap() {
  const container = document.getElementById('world-map-container');
  if (!container || !_worldTopology || typeof d3 === 'undefined' || typeof topojson === 'undefined') return;

  const W = container.offsetWidth || 480;

  // Build set of active numeric ISO codes
  const activeCodes = new Set();
  const primary = state.formData.primaryLanguage || 'en';
  const extras  = state.formData.localizations   || [];
  [primary, ...extras].forEach(lang => {
    (LANG_COUNTRY_CODES[lang] || []).forEach(c => activeCodes.add(c));
  });

  // Build primary-language-only set for a slightly different shade
  const primaryCodes = new Set((LANG_COUNTRY_CODES[primary] || []).map(Number));

  _drawMap(container, W, activeCodes, primaryCodes);
}

/* ── Shared map renderer ─────────────────────────────── */
// activeCodes  : Set of numeric ISO codes to highlight (active blue)
// primaryCodes : Set of numeric ISO codes for primary shade (brighter blue)
function _drawMap(container, W, activeCodes, primaryCodes) {
  if (!_worldTopology || typeof d3 === 'undefined' || typeof topojson === 'undefined') return;

  // Natural Earth projection fits ~2:1 width-to-height; use 0.50 for full uncropped world
  const H = Math.round(W * 0.50);

  // Colors (dark-theme palette)
  const C_OCEAN    = '#0d1117';
  const C_INACTIVE = '#1e2230';
  const C_ACTIVE   = '#2563d4';
  const C_BORDER   = '#0d1117';
  const C_PRIMARY  = '#3b82f6';

  const projection = d3.geoNaturalEarth1()
    .scale(W / 5.5)
    .translate([W / 2, H / 2]);

  const path      = d3.geoPath().projection(projection);
  const countries = topojson.feature(_worldTopology, _worldTopology.objects.countries);
  const borders   = topojson.mesh(_worldTopology, _worldTopology.objects.countries, (a, b) => a !== b);

  const svg = d3.create('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width',  W)
    .attr('height', H)
    .style('display', 'block');

  // Ocean background
  svg.append('path')
    .datum({ type: 'Sphere' })
    .attr('d', path)
    .attr('fill', C_OCEAN);

  // Country fills
  svg.append('g')
    .selectAll('path')
    .data(countries.features)
    .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const code = +d.id;
        if (!activeCodes.has(code))  return C_INACTIVE;
        if (primaryCodes.has(code))  return C_PRIMARY;
        return C_ACTIVE;
      })
      .attr('stroke', 'none');

  // Country borders (thin, dark)
  svg.append('path')
    .datum(borders)
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', C_BORDER)
    .attr('stroke-width', 0.4);

  container.innerHTML = '';
  container.appendChild(svg.node());
}

function pickTiming(value) {
  state.formData.releaseTiming = value;
  // Pre-fill launch date to 14 days from today when first selecting specific_date
  if (value === 'specific_date' && !state.formData.releaseDate) {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    state.formData.releaseDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  // Update chip active state
  document.querySelectorAll('.ob-timing-chip').forEach(chip => {
    chip.classList.toggle('is-on', chip.dataset.timing === value);
  });
  // Re-render the content area
  _refreshTimingContent();
}

function _refreshTimingContent() {
  const content = document.getElementById('ob-timing-content');
  if (!content) return;
  content.innerHTML = buildReleaseTimingContent();
  // Restore date value in newly created input (state already has it)
  const dateInput = document.getElementById('ob-date');
  if (dateInput && state.formData.releaseDate) dateInput.value = state.formData.releaseDate;
}

/* ── Scenario widget — game search ───────────────────────── */

function _renderScenarioSection() {
  const wrap = document.getElementById('ob-scenario-wrap');
  if (!wrap) return;
  wrap.innerHTML = buildScenarioWidget();
}

function _triggerScenarioSearch() {
  const title = (state.formData.title || '').trim();
  if (!title) {
    state.liveSearch = { status: 'error', found: false, error: 'NO_TITLE' };
    _renderScenarioSection();
    const wrap = document.getElementById('ob-scenario-wrap');
    const msg  = wrap ? wrap.querySelector('.ob-live-not-found') : null;
    if (msg) msg.textContent = "Enter your game title above first — then we'll search for it.";
    return;
  }
  state.liveSearch = { status: 'loading', found: false };
  _renderScenarioSection();
  searchGameByTitle(title)
    .then(result => {
      state.liveSearch = {
        status:      'done',
        found:       !!result.found,
        title:       result.title       || null,
        description: result.description || null,
        source:      result.source      || null,
        allStores:   result.allStores   || [],
        confidence:  result.confidence  || 0,
        confirmed:   false,
      };
      _renderScenarioSection();
    })
    .catch(err => {
      console.warn('[Scenario Search] failed:', err.message);
      state.liveSearch = { status: 'error', found: false, error: err.message };
      _renderScenarioSection();
    });
}

function setGameScenario(scenario) {
  // Toggle off if same chip clicked again
  if (state.formData.gameScenario === scenario) {
    state.formData.gameScenario = null;
    state.liveSearch = null;
    _renderScenarioSection();
    return;
  }

  state.formData.gameScenario = scenario;
  state.liveSearch = null;
  _renderScenarioSection();
  updateObSectionStates();

  // Scenarios that need a store search
  if (scenario === 'new_platform' || scenario === 'update') {
    _triggerScenarioSearch();
  }
}

function confirmGameImport() {
  const ls = state.liveSearch;
  if (!ls || !ls.found || !ls.description) return;

  // Pre-populate the description field
  state.formData.description = ls.description;
  _wsPropagateAboutGame(ls.description);
  const descEl = document.getElementById('ob-desc');
  if (descEl) {
    descEl.value = ls.description;
    charCount('ob-desc-count', ls.description, 4000);
  }
  _iasTriggerAutoTranslate('description', ls.description);

  // Auto-activate platforms where the game was found — replace any prior auto-selection
  // STORE_NAME_TO_PID is defined in claude.js (loaded first)
  const foundPids = [...new Set(
    (ls.allStores || []).map(s => STORE_NAME_TO_PID[(s || '').toLowerCase().trim()] || s)
      .filter(pid => !!PLATFORMS[pid] && !COMING_SOON_PLATFORMS.has(pid))
  )];
  if (foundPids.length) {
    state.activePlatforms.clear();
    foundPids.forEach(pid => {
      state.activePlatforms.add(pid);
      if (!state.platformStepStatus[pid]) {
        state.platformStepStatus[pid] = makeEmptyPlatformSteps()[pid] || {};
      }
    });
    const gridWrap = document.getElementById('ob-plat-grid-wrap');
    if (gridWrap) {
      gridWrap.innerHTML = buildObPlatTilesHTML();
      gridWrap.classList.remove('is-req-empty');
    }
    renderOnboardingFooter();
    updateObSectionStates();
  }

  ls.confirmed = true;
  _renderScenarioSection();
}

function rejectGameImport() {
  state.liveSearch = { status: 'done', found: false };
  _renderScenarioSection();
  const wrap = document.getElementById('ob-scenario-wrap');
  const msg  = wrap ? wrap.querySelector('.ob-live-not-found') : null;
  if (msg) msg.textContent = "Got it — fill in the description below and we'll work from that.";
}

/* ── Dashboard timeline handlers ─────────────────────────── */

function _refreshDashTimeline() {
  const wrap = document.getElementById('dash-timeline-wrap');
  if (!wrap) return;
  wrap.innerHTML = buildDashboardTimeline();
}

function dashPickTiming(value) {
  state.formData.releaseTiming = value;
  if (value === 'specific_date' && !state.formData.releaseDate) {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    state.formData.releaseDate = d.toISOString().split('T')[0];
  }
  _refreshDashTimeline();
}

function dashSetDate(value) {
  state.formData.releaseDate = value;
  _refreshDashTimeline();
}

/* ── IGDB title picklist ─────────────────────────────────── */

let _titleSearchTimer  = null;
let _closePicklistTimer = null;

function _renderTitlePicklist() {
  const el = document.getElementById('ob-title-picklist');
  if (el) el.innerHTML = buildTitlePicklist();
}

// Called from picklist row onmousedown — prevents blur from closing
// the list before the click registers
function _cancelPicklistClose() {
  clearTimeout(_closePicklistTimer);
}

// Called from title input onblur — close picklist shortly after
function _onTitleBlur() {
  _closePicklistTimer = setTimeout(() => {
    state.titlePicklist = [];
    state.titlePicklistError = null;
    _renderTitlePicklist();
  }, 200);
}

// Debounce-search on every title keystroke
function _onTitleFocus(value) {
  // If there's already text when the field is focused, show the picklist immediately
  const trimmed = (value || '').trim();
  if (trimmed.length >= 3 && !state.titlePicklist?.length) {
    _runTitlePicklist(trimmed);
  } else if (state.titlePicklist?.length) {
    _renderTitlePicklist(); // re-show if results are cached
  }
}

function _onTitleInputScenario(value) {
  // If user edits after confirming, clear confirmation so search can re-run
  if (state.liveSearch && state.liveSearch.confirmed) {
    state.liveSearch = null;
    _renderScenarioSection();
  }
  clearTimeout(_titleSearchTimer);
  const trimmed = (value || '').trim();
  if (trimmed.length < 3) {
    state.titlePicklist = [];
    state.titlePicklistError = null;
    _renderTitlePicklist();
    return;
  }
  _titleSearchTimer = setTimeout(() => _runTitlePicklist(trimmed), 150);
}

async function _runTitlePicklist(title) {
  // (No IGDB_CLIENT_ID gate anymore — search goes through our own backend,
  // IGDB_SEARCH_ENDPOINT in claude.js, which needs no client-side key.)
  try {
    const results = await igdbSearch(title);
    // Only apply if the title hasn't changed since the search started
    if ((state.formData.title || '').trim() === title) {
      state.titlePicklist = results;
      state.titlePicklistError = null;
      _renderTitlePicklist();
    }
  } catch (err) {
    console.warn('[Picklist] IGDB search failed:', err.message);
    state.titlePicklist = [];
    // Distinct from "no games matched" — buildTitlePicklist (render.js)
    // shows this so a proxy/network/auth failure doesn't look identical to
    // a genuine no-results title (see titlePicklistError, state.js).
    state.titlePicklistError = err.message || 'Search failed';
    _renderTitlePicklist();
  }
}

function selectPicklistItem(igdbId) {
  const item = (state.titlePicklist || []).find(x => x.id === igdbId);
  if (!item) return;

  // Close picklist immediately
  clearTimeout(_closePicklistTimer);
  state.titlePicklist = [];
  _renderTitlePicklist();

  // Any language previously flagged as "Steam-authoritative" for the
  // Description field (see _checkSteamLocalizedDescription) only means
  // something for the PREVIOUSLY-selected game's own Steam store page.
  // Normally this expires on its own the moment the new game's Description
  // loads (_iasTriggerAutoTranslate compares against the cached source
  // text, which won't match), but that comparison would wrongly treat the
  // flag as still valid in the unlikely case where the new game's initial
  // Description happens to be textually identical to the old game's — so
  // clear it explicitly here too, as a defense-in-depth backstop, whether
  // or not this new title turns out to be Steam-linked itself.
  _clearSteamDescriptionAuthority();

  // Set game title
  state.formData.title = item.name;
  // Picking a game here is exactly the kind of title change syncField's own
  // oninput handler would normally catch (see _syncProjectBarTitle, further
  // above) — but this path sets state.formData.title directly rather than
  // going through syncField, so without this call the top-right project bar
  // (both the closed chip and, if open, the dropdown's active row) would
  // keep showing whatever it showed before this pick — "Untitled Game" on a
  // fresh project — until some unrelated action happened to re-render it.
  _syncProjectBarTitle(item.name);
  const titleEl = document.getElementById('ob-title');
  if (titleEl) {
    titleEl.value = item.name;
    charCount('ob-title-count', item.name, 30);
  }
  _iasPropagateTitle(item.name);

  // Clear whatever's already in Steam's "Select Key Art" section — Capsule
  // Image, Header Image, IGDB Cover Art, Library Hero — before this new
  // selection's own auto-fill (below) has a chance to run. Only clears
  // auto-filled art (a { name, url } shape); a manual upload (a
  // { name, dataUrl } shape) is preserved, same convention the screenshot
  // grid uses (_fillScreenshotGridFromIgdb/FromSteam filter on `s.dataUrl`)
  // — a developer who's deliberately uploaded their own art for this slot
  // shouldn't have it silently wiped just because they picked a different
  // title in the picklist. Doing this eagerly (not inside the async
  // appliers below) also means a fast re-pick can't race a slow-resolving
  // previous fetch into clobbering the new selection: by the time any of
  // those promises settle, the stale-title guard already in each of them
  // (comparing against state.formData.title) rejects a late write for the
  // old game anyway, but clearing here means the user never sees the old
  // game's auto-filled art flash on screen in the meantime either.
  state.uploads = state.uploads || {};
  if (!state.uploads.steamCapsuleImage?.dataUrl)   state.uploads.steamCapsuleImage   = null;
  if (!state.uploads.steamHeaderImage?.dataUrl)    state.uploads.steamHeaderImage    = null;
  if (!state.uploads.steamKeyArtCapsule?.dataUrl)  state.uploads.steamKeyArtCapsule  = null;
  if (!state.uploads.steamKeyArtHero?.dataUrl)     state.uploads.steamKeyArtHero     = null;
  // Trailer preview has no manual-upload variant at all (unlike the four Key
  // Art slots above, which keep a manual dataUrl upload if the developer set
  // one) — it's purely derived from whichever title is currently selected,
  // so it's always safe to clear unconditionally here.
  state.uploads.steamTrailer = null;

  // Where the rest of this game's data comes from depends on whether IGDB
  // links to a Steam store page for it. If it does, Steam is treated as the
  // source of truth for Description / Web Factsheet Developer / Web
  // Factsheet Publisher / Web Factsheet Links "Official Website" / Web
  // "About This Game" / screenshots — Steam's own store-page copy and full
  // screenshot set is generally more complete and current than IGDB's
  // community-submitted summary/screenshots for a title
  // that's actually live on Steam. That fetch (fetchSteamAppDetails in claude.js, via
  // corsproxy.io — verified live and already working for IGDB itself, see
  // this project's appdetails reliability testing) is async, so
  // _applySteamAboutData fills these fields in shortly after this function
  // returns, not immediately; if the fetch fails, it falls back to filling
  // from IGDB's own summary/screenshots (via the same helpers used in the
  // no-Steam-link branch below) rather than leaving the About section and
  // screenshot grid empty.
  // IGDB_SEARCH_ENDPOINT's results never carry a Steam app ID (see
  // claude.js) — fill the baseline from IGDB immediately so the fields
  // aren't left blank, then resolve the real Steam link asynchronously
  // below and let it upgrade these once it resolves.
  if (item.summary) _fillDescriptionField(item.summary);
  _fillScreenshotGridFromIgdb(item.screenshots || []);
  // Clear any Steam localization cache left over from a previously-selected
  // game so a later language-add on THIS title can't be checked against the
  // wrong game's Steam data before (or if) a real Steam link resolves below.
  state.steamLocInfo = null;

  // Resolve this title's Steam app ID with a small, targeted follow-up
  // query (_igdbFetchSteamAppId, claude.js) — only attempted when IGDB
  // itself already told us (via platforms, from the search results) that
  // this title has a Steam listing, so titles with none skip the extra
  // request entirely. Fire-and-forget: the synchronous IGDB-sourced fill
  // above already leaves the app fully usable while this resolves.
  if ((item.platforms || []).includes('steam') && typeof _igdbFetchSteamAppId === 'function') {
    _igdbFetchSteamAppId(item.id).then(steamAppId => {
      if (!steamAppId) return;
      // Stale-title guard — the user may have picked a different title
      // (or edited it away) before this resolves.
      if ((state.formData.title || '').trim() !== (item.name || '').trim()) return;
      // Steam is now treated as the source of truth for Description / Web
      // Factsheet Developer / Publisher / Links "Official Website" / Web
      // "About This Game" / screenshots / Capsule Image / Header Image /
      // Library Hero / social links — each of these calls only overwrites
      // a field once it actually has Steam content for it (see
      // _applySteamAboutData), so this safely upgrades the IGDB-sourced
      // baseline filled in above rather than fighting with it.
      _applySteamAboutData(steamAppId, item.name, item);
      _applySteamHeroBanner(steamAppId, item.name);
      _applySteamSocialLinks(steamAppId, item.name);
    }).catch(err => console.warn('[Picklist] Steam app ID lookup failed:', err.message));
  }

  // Auto-activate platforms — use strict activationPlatforms (no unconfirmed console ports)
  const validPids = (item.activationPlatforms || item.platforms || []).filter(pid => !!PLATFORMS[pid] && !COMING_SOON_PLATFORMS.has(pid));
  if (validPids.length) {
    state.activePlatforms.clear();
    validPids.forEach(pid => {
      state.activePlatforms.add(pid);
      if (!state.platformStepStatus[pid]) {
        state.platformStepStatus[pid] = makeEmptyPlatformSteps()[pid] || {};
      }
    });
    const gridWrap = document.getElementById('ob-plat-grid-wrap');
    if (gridWrap) {
      gridWrap.innerHTML = buildObPlatTilesHTML();
      gridWrap.classList.remove('is-req-empty');
    }
    renderOnboardingFooter();
  }

  // Show confirmed state in the scenario widget
  state.liveSearch = {
    status:    'done',
    found:     true,
    confirmed: true,
    title:     item.name,
    allStores: item.platforms,
    source:    'IGDB',
  };
  _renderScenarioSection();
  updateObSectionStates();

  // Mark title question as answered
  const qTitle = document.getElementById('ob-q-title');
  if (qTitle) qTitle.dataset.answered = '1';

  // (Library Hero and social links are fired together with the About Data
  // call above, once the async Steam app ID lookup resolves — see the
  // _igdbFetchSteamAppId block earlier in this function.)

  // Populate "IGDB Cover Art" from IGDB's own cover art. Runs independent
  // of item.steamAppId — it only depends on IGDB's own cover field, which
  // every platform's picklist item can have, not just ones with a linked
  // Steam page.
  if (item.coverBigUrl) {
    _applySteamCapsuleFromCover(item.coverBigUrl, item.name);
  }
}

/* Runs after selectPicklistItem when the picked title has a linked Steam
   page (item.steamAppId). Preloads Steam's library_hero image directly
   from its stable, hash-free CDN URL (steamLibraryHeroUrl, claude.js) —
   using an off-DOM Image() so a missing asset (some games just don't have
   one) shows up as a load failure to handle gracefully, rather than a
   broken <img> the user sees in the app. Only on a successful load, and
   only if the title hasn't changed since (same guard used elsewhere for
   this kind of fire-and-forget enrichment), sets:
     - state.uploads.steamKeyArtHero ← { name: 'library_hero.jpg', url }
   No network request our own code has to reason about failing/blocking —
   the browser's own image loading handles the request, and there's no
   proxy in the loop to get rate-limited or IP-blocked. */
function _applySteamHeroBanner(appId, expectedTitle) {
  const url = steamLibraryHeroUrl(appId);
  const img = new Image();
  img.onload = () => {
    if ((state.formData.title || '').trim() !== (expectedTitle || '').trim()) return;
    state.uploads = state.uploads || {};
    state.uploads.steamKeyArtHero = { name: 'library_hero.jpg', url };
    reRenderStepModal();
  };
  img.onerror = () => {
    console.warn('[Steam Hero Banner] no library_hero.jpg found for app', appId);
  };
  img.src = url;
}

/* Runs after selectPicklistItem whenever the picked title has IGDB cover
   art (item.coverBigUrl). Same off-DOM Image() preload pattern as
   _applySteamHeroBanner above, so a missing/broken cover URL just logs a
   warning instead of showing a broken <img>. Only on a successful load,
   and only if the title hasn't changed since (same stale-response guard),
   sets:
     - state.uploads.steamKeyArtCapsule ← { name: 'cover.jpg', url }
   This backs the Key Art "IGDB Cover Art" field — IGDB's own cover
   crop/resolution (t_cover_big, nominally 264×374, though real delivered
   images don't always land on that exact ratio — see
   _pkSyncCapsuleAspect below for how the preview website's capsule box
   handles that). */
function _applySteamCapsuleFromCover(url, expectedTitle) {
  const img = new Image();
  img.onload = () => {
    if ((state.formData.title || '').trim() !== (expectedTitle || '').trim()) return;
    state.uploads = state.uploads || {};
    state.uploads.steamKeyArtCapsule = { name: 'cover.jpg', url };
    reRenderStepModal();
  };
  img.onerror = () => {
    console.warn('[Steam IGDB Cover Art] failed to load IGDB cover art', url);
  };
  img.src = url;
}

/* ── About-section data source helpers (IGDB vs. Steam) ──────────────────
   Shared by selectPicklistItem's two branches (no linked Steam page /
   Steam fetch failed → IGDB; Steam fetch succeeded → Steam), so both
   sources fill the Description field and screenshot grid the same way. */

function _fillDescriptionField(text) {
  state.formData.description = text || '';
  _wsPropagateAboutGame(text || '');
  const descEl = document.getElementById('ob-desc');
  if (descEl) {
    descEl.value = text || '';
    charCount('ob-desc-count', text || '', 4000);
  }
  _iasTriggerAutoTranslate('description', text || '');
}

function _refreshScreenshotGrid() {
  const grid = document.getElementById('ob-screenshot-grid');
  if (grid) renderScreenshotGridInto(grid);
  updateObSectionStates();
}

// Mirrors an auto-import batch (IGDB or Steam — see
// _fillScreenshotGridFromIgdb/_fillScreenshotGridFromSteam below) into the
// Web platform's own independent screenshots copy: same "drop the
// previous auto-populated batch, keep anything with a dataUrl" rule as
// Game Details' own array uses, applied to state.webSite.screenshots
// instead. `entries` is the SAME array (same ids) just pushed onto
// state.uploads.screenshots, so a later per-id removal (removeScreenshot)
// still matches correctly on both sides. See the state.js comment above
// webSite.screenshots.
function _wsSyncAutoScreenshots(entries) {
  if (!state.webSite) state.webSite = {};
  if (!state.webSite.screenshots) state.webSite.screenshots = [];
  state.webSite.screenshots = state.webSite.screenshots.filter(s => s.dataUrl);
  state.webSite.screenshots.push(...entries);
  const wsGrid = document.getElementById('ws-screenshot-grid');
  if (wsGrid) renderWebScreenshotGridInto(wsGrid);
}

// Always clears previously auto-populated screenshots (id starts with
// 'igdb-' or 'steam-') when a new game is selected, then loads the new
// game's screenshots. User-uploaded screenshots (those with a dataUrl) are
// left untouched. IGDB CDN images route through wsrv.nl (via _screenshotSrc
// at render time) to avoid 403s from direct hotlinking.
function _fillScreenshotGridFromIgdb(urls) {
  const entries = (urls || []).map((url, i) => ({
    id:   'igdb-' + i + '-' + Date.now(),
    name: `screenshot-${i + 1}.jpg`,
    url,  // stored as URL; rendering proxies through wsrv.nl
  }));
  state.uploads.screenshots = state.uploads.screenshots.filter(s => s.dataUrl);
  state.uploads.screenshots.push(...entries);
  _wsSyncAutoScreenshots(entries);
  _refreshScreenshotGrid();
}

// Same clearing behavior as _fillScreenshotGridFromIgdb, sourced from a
// Steam appdetails 'screenshots' array ({ id, path_thumbnail, path_full }
// objects) instead — up to the first 10. Steam's own CDN images load
// directly with no proxy needed (same reasoning as steamLibraryHeroUrl
// above: plain <img> loading doesn't require CORS headers).
function _fillScreenshotGridFromSteam(steamScreenshots) {
  const ts = Date.now();
  const entries = (steamScreenshots || []).slice(0, 10).filter(s => s && s.path_full).map((s, i) => ({
    id:   'steam-' + i + '-' + ts,
    name: `screenshot-${i + 1}.jpg`,
    url:  s.path_full,
  }));
  state.uploads.screenshots = state.uploads.screenshots.filter(s => s.dataUrl);
  state.uploads.screenshots.push(...entries);
  _wsSyncAutoScreenshots(entries);
  _refreshScreenshotGrid();
}

/* Runs after selectPicklistItem when the picked title has a linked Steam
   page (item.steamAppId). Fetches Steam's own appdetails (via
   fetchSteamAppDetails in claude.js, over corsproxy.io — verified live and
   already working for IGDB itself) and, on success, replaces IGDB as the
   source of truth for this game's:
     - About section Description ← Steam's about_the_game (HTML flattened to
       blank-line-separated paragraphs, same conversion as the Web platform
       Description below — NOT Steam's short_description, which is only a
       one-or-two-sentence marketing blurb far shorter than what belongs in
       a store listing's actual Description field)
     - Web platform Factsheet Developer ← Steam's developers list, joined
     - Web platform Factsheet Publisher ← Steam's publishers list, joined
     - Web platform Factsheet Links "Official Website" ← Steam's website field
     - Web platform Description "About This Game" ← Steam's about_the_game
       (HTML flattened to blank-line-separated paragraphs — see
       _steamHtmlToParagraphLines in claude.js and _pkParagraphs in
       render.js — preserving Steam's own paragraph spacing instead of
       flattening every line break to identical spacing)
     - Assets screenshot grid ← Steam's first 10 screenshots
     - Web platform Factsheet Genres ← Steam's genres list, joined
     - Steam Key Art "Capsule Image" ← Steam's own capsule_image
     - Steam Key Art "Header Image" ← Steam's own header_image
     - Assets "Trailer" section thumbnail ← Steam's own appdetails movies[0]
       (see _steamTrailerFromMovies below) — a clickable preview thumbnail
       that swaps in an inline hls.js player (playSteamTrailer below) on
       click, streaming the trailer directly from Steam's own CDN
   Same stale-title guard as _applySteamHeroBanner/_applySteamCapsuleFromCover:
   if the user has since picked a different title, this silently no-ops.
   If the fetch itself fails (network error, no Steam data for this app id,
   etc.), falls back to filling from IGDB's own summary/screenshots — via
   fallbackItem, the same picklist item passed to selectPicklistItem — so a
   flaky Steam fetch doesn't leave the About section and screenshot grid
   empty; it just quietly degrades to the same result as a title with no
   linked Steam page. (Genres, Capsule Image/Header Image, and the Trailer
   thumbnail have no IGDB-sourced fallback/equivalent today, so they're
   simply left as-is when the Steam fetch fails.) */
/* Steam's appdetails `movies` array holds the store page's trailer/video
   entries — in the same order the store page itself lists them (its first
   entry is the store page's own primary/featured trailer, in practice also
   the one with highlight: true).
   An earlier version of this function assumed a { webm: { 480, max },
   mp4: { 480, max } } shape based on long-standing community documentation
   of this undocumented/unofficial API — but that turned out to be stale.
   Confirmed live against two real store pages (Go Ape Ship!/4037180 and
   Spilled!/2240080, both fetched directly during this project's own bug
   investigation) that today's actual shape is
   { id, name, thumbnail, highlight, dash_av1, dash_h264, hls_h264 } — Steam
   has moved entirely to adaptive streaming, with NO plain progressive
   mp4/webm file at all anymore. That's why the old mp4/webm-only version of
   this function silently matched nothing for every real game — this is the
   fix for that bug.
   hls_h264 (an .m3u8 HLS manifest) is the one used here, since it's what
   the inline player this feeds (playSteamTrailer/hls.js in this file) is
   built to consume; the dash_av1/dash_h264 (.mpd DASH manifests) variants
   are left unused for now. Valve can of course change this shape again with
   no notice, so this still degrades to null (no trailer shown) rather than
   throwing if hls_h264 or thumbnail is ever missing.
   Returns { name, thumbnail, hlsUrl } for the first entry with both a
   thumbnail and an hls_h264 URL, or null otherwise. */
function _steamTrailerFromMovies(movies) {
  if (!movies || !movies.length) return null;
  const movie = movies[0];
  if (!movie || !movie.thumbnail || !movie.hls_h264) return null;
  return { name: movie.name || 'Trailer', thumbnail: movie.thumbnail, hlsUrl: movie.hls_h264 };
}

/* ── App Store Product Page Preview — Steam-sourced Description
   localization ───────────────────────────────────────────────────────
   When a selected title is linked to a Steam store page, Steam's own
   store-page copy is already the source of truth for the PRIMARY
   language's Description (_applySteamAboutData above). If the developer's
   Steam store page has ALSO been localized into one of Shipmate's
   supported languages, that real, developer-written translation is a
   better source for that language's Description than an AI (Claude)
   translation of the primary text — so it's used instead, whenever it's
   available.

   Steam's appdetails endpoint accepts an `l=<language>` query param
   (fetchSteamAppDetails, claude.js) using Steam's OWN language codes,
   which don't match Shipmate's ISO-ish codes (OB_LANG_NAMES, render.js) —
   STEAM_LOCALIZATION_LANG_MAP bridges the two. Steam has no store-page
   localization support at all for Malay or Hebrew as of this writing, so
   those two are deliberately left out of the map (not just unmapped by
   accident) — a lookup miss is treated as "Steam can't possibly have
   this", short-circuiting before any network call. */
const STEAM_LOCALIZATION_LANG_MAP = {
  en: 'english', fr: 'french', de: 'german', es: 'spanish', 'es-419': 'latam',
  it: 'italian', pt: 'portuguese', 'pt-BR': 'brazilian', ru: 'russian',
  ja: 'japanese', ko: 'koreana', zh: 'schinese', 'zh-TW': 'tchinese',
  pl: 'polish', nl: 'dutch', tr: 'turkish', sv: 'swedish', nb: 'norwegian',
  da: 'danish', fi: 'finnish', cs: 'czech', hu: 'hungarian', ro: 'romanian',
  uk: 'ukrainian', el: 'greek', th: 'thai', vi: 'vietnamese', id: 'indonesian',
  ar: 'arabic',
};

// Display names Steam's own `supported_languages` field (appdetails) is
// known to use for each of its language codes — used only as a soft,
// best-effort pre-filter (see _steamSupportsLanguageCandidate below), never
// as the actual proof of localization (that always comes from comparing
// real fetched content, in _checkSteamLocalizedDescription).
const STEAM_LANG_DISPLAY_NAMES = {
  english: ['English'], french: ['French'], german: ['German'],
  spanish: ['Spanish - Spain', 'Spanish'], latam: ['Spanish - Latin America', 'Latin American Spanish'],
  italian: ['Italian'], portuguese: ['Portuguese'], brazilian: ['Portuguese - Brazil', 'Brazilian Portuguese'],
  russian: ['Russian'], japanese: ['Japanese'], koreana: ['Korean'],
  schinese: ['Simplified Chinese'], tchinese: ['Traditional Chinese'],
  polish: ['Polish'], dutch: ['Dutch'], turkish: ['Turkish'], swedish: ['Swedish'],
  norwegian: ['Norwegian'], danish: ['Danish'], finnish: ['Finnish'], czech: ['Czech'],
  hungarian: ['Hungarian'], romanian: ['Romanian'], ukrainian: ['Ukrainian'],
  greek: ['Greek'], thai: ['Thai'], vietnamese: ['Vietnamese'], indonesian: ['Indonesian'],
  arabic: ['Arabic'],
};

// Steam's supported_languages string is a comma-separated list of display
// names with occasional inline HTML (an asterisk wrapped in <strong> tags
// flags "full audio support"), followed by a "*languages with full audio
// support" footnote sentence appended after the list itself — e.g.
// "English<strong>*</strong>, French, German<br><strong>*</strong>languages
// with full audio support". Strips the tags and footnote, returning the
// plain list of names.
function _steamSupportedLanguageNames(raw) {
  if (!raw) return [];
  const noTags = raw.replace(/<[^>]*>/g, '');
  const beforeFootnote = noTags.split(/\*\s*languages with/i)[0];
  return beforeFootnote.split(',').map(s => s.replace(/\*/g, '').trim()).filter(Boolean);
}

// Best-effort check of whether Steam's own supported_languages listing
// mentions a given Steam language code at all — purely an optimization to
// skip an unnecessary network fetch for a language the game clearly
// doesn't support. Deliberately fails OPEN (returns true, "go ahead and
// check") whenever parsing is inconclusive, since the real answer always
// comes from _checkSteamLocalizedDescription's own content comparison —
// this must never be the thing that wrongly rules out a real localization.
function _steamSupportsLanguageCandidate(steamLang, supportedLanguagesRaw) {
  const names = _steamSupportedLanguageNames(supportedLanguagesRaw);
  if (!names.length) return true;
  const expected = STEAM_LANG_DISPLAY_NAMES[steamLang];
  if (!expected) return true;
  return names.some(n => expected.some(e => n.toLowerCase() === e.toLowerCase()));
}

// Checks whether the currently-selected Steam-linked game's store page has
// a genuine localized "About This Game" for `lang` (a Shipmate language
// code), and if so, populates that language's Description with Steam's own
// text (same about_the_game field and HTML-to-plain-text conversion as the
// initial Description population — NOT short_description) — taking
// priority over an AI-translated guess. Called whenever a supporting
// language is added (toggleObLang/setObLangPreset/applyObLangPreset) and
// once up front for every already-selected supporting language as soon as
// a Steam-linked title is picked (_applySteamAboutData). A complete no-op
// if the current title isn't Steam-linked, or Steam has no localization
// support for `lang` at all (STEAM_LOCALIZATION_LANG_MAP has no entry for it).
//
// Deliberately NOT called from selectLocPrimary for the demoted outgoing
// primary language: that language's Description there is genuine
// developer-authored content (it was just the primary field's live value),
// not an AI-translated placeholder — overwriting it with Steam's own
// "About This Game" copy would replace real authored text rather than
// backfilling an empty/translated one, unlike every other call site here.
async function _checkSteamLocalizedDescription(lang) {
  const info = state.steamLocInfo;
  if (!info || !info.appId) return;
  const steamLang = STEAM_LOCALIZATION_LANG_MAP[lang];
  if (!steamLang) return;
  if (!_steamSupportsLanguageCandidate(steamLang, info.supportedLanguagesRaw)) return;

  let data = null;
  try {
    data = await fetchSteamAppDetails(info.appId, steamLang);
  } catch (e) {
    console.warn('[Steam Localized Description]', lang, e.message);
    return;
  }

  // Stale guards — bail if the user switched to a different title, or
  // deselected this language again, while the fetch was in flight.
  if (!state.steamLocInfo || state.steamLocInfo.appId !== info.appId) return;
  if (!(state.formData.localizations || []).includes(lang)) return;

  // Same field and HTML-to-plain-text conversion as the initial Description
  // population in _applySteamAboutData (about_the_game, NOT the much
  // shorter short_description) — kept consistent so this comparison is
  // apples-to-apples against info.baselineDescription, which was cached
  // from that same conversion.
  const localizedDesc = _steamHtmlToParagraphLines(data && data.about_the_game || '').trim();
  const baseline      = (info.baselineDescription || '').trim();
  // Steam silently falls back to the store page's default listing language
  // instead of erroring when it has no real translation for the requested
  // language — comparing against the baseline is the only way to tell
  // "genuinely localized" from "silently fell back to English (or
  // whatever the default is)".
  if (!localizedDesc || localizedDesc === baseline) return;

  _iasSetFieldValue('description', lang, localizedDesc);
  if (state.formData.localizedStoreText && state.formData.localizedStoreText[lang]) {
    const entry = state.formData.localizedStoreText[lang];
    // A genuine Steam store-page localization is authoritative over an
    // AI-translated guess of the SAME primary text — descriptionFromSteam
    // flags that so _iasTriggerAutoTranslate's write-time guard won't let
    // an already-in-flight translation clobber it (see that guard for the
    // exact race this closes). This authority is intentionally temporary,
    // not permanent: it only holds for as long as descriptionSourceText
    // (set right below) still matches the CURRENT primary Description. The
    // moment the developer edits the primary Description again,
    // _iasTriggerAutoTranslate sees this language as stale like any other
    // and its translation overrides this Steam-sourced text — Steam only
    // gets to supply a language's *initial* Description.
    entry.descriptionFromSteam  = true;
    // Also refresh the staleness cache to the CURRENT primary Description,
    // so a translate pass already in flight when this write lands (or one
    // that runs before the flag above exists, e.g. this exact call racing
    // the auto-translate kicked off by the same language-add) still sees
    // nothing stale here even before the flag check is consulted.
    entry.descriptionSourceText = state.formData.description || '';
  }
  reRenderStepModal();
}

// Defense-in-depth backstop for the descriptionFromSteam flag (see
// _checkSteamLocalizedDescription) — called whenever a different title is
// selected from the picklist. Normally the flag's authority already
// expires on its own the instant the new game's primary Description loads
// (_iasTriggerAutoTranslate's staleness check no longer matches the old
// game's cached source text), but that natural expiry relies on the new
// primary text actually differing from the old one — in the unlikely case
// where two different games' initial Descriptions are textually identical,
// the stale flag would otherwise be wrongly treated as still authoritative
// for the new game's (unrelated) Steam page. Clearing it unconditionally
// here removes that edge case entirely.
function _clearSteamDescriptionAuthority() {
  const lst = state.formData.localizedStoreText;
  if (!lst) return;
  Object.keys(lst).forEach(lang => { delete lst[lang].descriptionFromSteam; });
}

// Runs _checkSteamLocalizedDescription for every language present in
// `afterLangs` but not in `beforeLangs` — used by the bulk language-preset
// paths (setObLangPreset/applyObLangPreset), which set the whole
// localizations array in one shot rather than adding languages one at a
// time like toggleObLang.
function _checkSteamLocalizedDescriptionForNewLangs(beforeLangs, afterLangs) {
  const before = new Set(beforeLangs || []);
  (afterLangs || []).forEach(lang => { if (!before.has(lang)) _checkSteamLocalizedDescription(lang); });
}

async function _applySteamAboutData(appId, expectedTitle, fallbackItem) {
  let data = null;
  let fetchFailed = false;
  try {
    data = await fetchSteamAppDetails(appId);
  } catch (e) {
    console.warn('[Steam About Data] failed to fetch appdetails for app', appId, e);
    fetchFailed = true;
  }

  // Stale guard — bail if the user has since picked a different title.
  // Note: on fallback we still want to fill in IGDB data for the CURRENT
  // title, so this guard applies to both branches below, not just success.
  if ((state.formData.title || '').trim() !== (expectedTitle || '').trim()) return;

  // The IGDB-fallback branch below still fills in what it can (Description,
  // screenshots), so this isn't a hard failure from the developer's seat —
  // but Developer/Publisher/Genres/Release Date/Key Art/Trailer/localization
  // baseline all come ONLY from Steam and are silently skipped when this
  // fetch fails (proxy/network/rate-limit — see FETCH_TIMEOUT_MS,
  // claude.js). A toast beats leaving those fields quietly blank with
  // nothing to explain why, indistinguishable from "Steam just has nothing
  // for this game".
  if (fetchFailed) {
    bcToast(`Couldn't load Steam store data for "${expectedTitle}" — filled in what IGDB had. Try reselecting the title, or fill in Developer/Publisher/Key Art manually.`);
  }

  if (data) {
    // "About This Game" (data.about_the_game) is Steam's own full-length
    // store-page copy, flattened from HTML to blank-line-separated
    // paragraphs by _steamHtmlToParagraphLines (claude.js) — feeds the About
    // section's own Description field below. It does NOT also get written
    // directly into the Web platform's "About This Game" field (state.
    // webSite.aboutGame) anymore — that field now syncs with (falls back to)
    // Game Details' Description field at render time instead (see
    // buildWebSitePreviewSection, render.js), the same "default + override"
    // treatment "Hook" used to have. Since Game Details' Description is
    // filled from this exact text two lines below, About This Game still
    // ends up showing Steam's about_the_game by default for a Steam-linked
    // title — just through that one indirect path rather than two separate
    // direct writes that could drift out of sync with each other.
    const aboutGameText = data.about_the_game ? _steamHtmlToParagraphLines(data.about_the_game) : '';

    // Guarded like item.summary in the no-Steam-link branch below — only
    // overwrite a field if Steam actually has content for it, rather than
    // blanking something the developer may have already typed in on the
    // rare page missing one of these fields.
    if (aboutGameText) _fillDescriptionField(aboutGameText);
    if (data.developers && data.developers.length) state.webSite.developer = data.developers.join(', ');
    // Publisher — same "join Steam's list" treatment as Developer above,
    // just a different appdetails field (a game can, and often does, have
    // different developer(s) and publisher(s)).
    if (data.publishers && data.publishers.length) state.webSite.publisher = data.publishers.join(', ');
    // Official Website — Steam's appdetails 'website' field (the game's own
    // landing page, when the developer has set one on the store page —
    // Steam leaves this blank more often than not, so this often stays
    // whatever the developer already typed). Backs Factsheet > Developer >
    // Links > "Official Website".
    if (data.website) state.webSite.officialWebsite = data.website;
    // Steam's genres are { id, description } objects (e.g. { id: "1",
    // description: "Action" }) — not the community-voted "tags" chips
    // shown on the store page (appdetails has no field for those at all,
    // see this project's Steam-tags research), just the short, fixed,
    // developer-assigned genre list. webSite.genres is free text (see
    // state.js), so this joins the descriptions the same way developers
    // above joins Steam's developers list.
    if (data.genres && data.genres.length) state.webSite.genres = data.genres.map(g => g.description).filter(Boolean).join(', ');
    // Purchase price — Steam's appdetails 'price_overview' (shaped like
    // { currency, initial, final, discount_percent, initial_formatted,
    // final_formatted }, e.g. final_formatted: "$19.99"), already
    // currency-formatted so it's used as-is; 'is_free' is a separate top-
    // level boolean Steam sets instead of price_overview for free-to-play
    // titles. Same "auto-fill once, then freely editable" treatment as
    // developer/publisher/genres above — only sets it here, at Steam-link
    // time, never re-synced afterward, so the developer's own later edit
    // (or a game that later goes on sale) is never silently overwritten.
    if (data.price_overview && data.price_overview.final_formatted) {
      state.webSite.price = data.price_overview.final_formatted;
    } else if (data.is_free) {
      state.webSite.price = 'Free';
    }
    // Release Date — Steam's own appdetails 'release_date' field, shaped
    // { coming_soon: bool, date: string } (e.g. { coming_soon: false, date:
    // "Feb 18, 2026" }, confirmed live against this project's own captured
    // Go Ape Ship! appdetails response). Unlike Developer/Publisher/Genres
    // above, this ALWAYS sets something whenever Steam returns the field at
    // all, rather than only overwriting on non-empty content — an
    // unannounced/TBD title still gets a release_date object back with an
    // empty `date` string (rather than omitting the field entirely), and by
    // request that case fills in the literal text "Coming soon" instead of
    // being left blank, matching webSite.releaseDate's own render-time
    // fallback for "nothing entered here at all" (see releaseDateValue,
    // render.js). Only skipped when Steam omits release_date entirely,
    // which the "only overwrite with real content" guard elsewhere in this
    // function would also apply to.
    if (data.release_date) {
      const rd = (data.release_date.date || '').trim();
      state.webSite.releaseDate = rd || 'Coming soon';
    }
    _fillScreenshotGridFromSteam(data.screenshots || []);
    // Steam Key Art "Capsule Image"/"Header Image" — appdetails' own
    // capsule_image (231×87)/header_image (460×215), no CDN URL guessing
    // needed since appdetails hands back the exact, already-hash-resolved
    // path directly (see this project's appdetails field enumeration).
    if (data.capsule_image) state.uploads.steamCapsuleImage = { name: 'capsule.jpg', url: data.capsule_image };
    if (data.header_image)  state.uploads.steamHeaderImage  = { name: 'header.jpg',  url: data.header_image };
    // Assets "Trailer" section thumbnail — Steam's own first listed trailer
    // (appdetails' movies[0]), rather than anything IGDB provides.
    const trailer = _steamTrailerFromMovies(data.movies);
    if (trailer) state.uploads.steamTrailer = trailer;

    // Cache this game's default-language ("baseline") About This Game text
    // — the SAME field/conversion just used to populate the Description
    // field above, so a later localized comparison in
    // _checkSteamLocalizedDescription is apples-to-apples — plus the raw
    // supported_languages string, so that function can later (a) tell a
    // genuinely-localized appdetails response apart from Steam silently
    // falling back to this same baseline text, and (b) cheaply pre-filter
    // obviously-unsupported languages without an extra fetch. Reuses this
    // call's own appdetails response rather than issuing a second one —
    // this function already fetches exactly what's needed.
    //
    // shortDescription is Steam's own one-or-two-sentence marketing blurb
    // (data.short_description) — deliberately NOT used for About This Game
    // or Game Details' Description above (both far longer fields; see
    // aboutGameText's own comment) but exactly the right length for the Web
    // platform's "Hook" field, which reads this at render time
    // (buildWebSitePreviewSection, render.js) the same way it used to read
    // Game Details' Description before that role moved to About This Game.
    state.steamLocInfo = {
      appId,
      baselineDescription:   aboutGameText,
      shortDescription:      data.short_description || '',
      supportedLanguagesRaw: data.supported_languages || '',
    };
    // Any supported languages already selected before this game finished
    // loading (e.g. left over from a prior title, or set via a language
    // preset that ran before this async fetch resolved) haven't had a
    // chance to be checked against this game's Steam localization yet —
    // check them now rather than only checking languages added afterward.
    (state.formData.localizations || []).forEach(lang => _checkSteamLocalizedDescription(lang));
  } else {
    if (fallbackItem && fallbackItem.summary) _fillDescriptionField(fallbackItem.summary);
    _fillScreenshotGridFromIgdb((fallbackItem && fallbackItem.screenshots) || []);
    // No usable Steam data for this title (fetch failed) — clear any stale
    // cache from a previous game so a later language-add doesn't wrongly
    // check this new (non-Steam-backed) title against the OLD game's Steam
    // localization info.
    state.steamLocInfo = null;
  }
  reRenderStepModal();
}

/* Runs after selectPicklistItem when the picked title has a linked Steam
   page (item.steamAppId). Pre-populates Factsheet > Developer > Links'
   social-links list (state.webSite.links) from the Steam store page's own
   "Find Community" section — a COMPLETELY SEPARATE fetch from
   _applySteamAboutData's appdetails JSON call above (fetchSteamStorePage
   fetches the store page's raw HTML instead; see the long comment on it
   and on _parseSteamSocialLinks, both in claude.js, for why: appdetails
   has no field for social links at all, confirmed by inspecting a real
   response directly, nor does any documented Steamworks Web API interface
   expose them — this data only exists rendered into the store page's own
   HTML). Fire-and-forget, same convention as
   _applySteamHeroBanner/_applySteamCapsuleFromCover: any failure (no store
   page, section missing, Steam changed their markup — this parse is NOT
   against a documented/stable API, unlike appdetails) just leaves Links
   untouched rather than blocking or clearing anything. Same stale-title
   guard as those two. Only overwrites the existing links list once the
   fetch+parse actually succeeds AND finds at least one link — matching the
   "only overwrite a field if Steam actually has content for it" guard
   _applySteamAboutData uses for Developer/Publisher/Genres above, so a
   flaky fetch or a page with no social links configured never wipes out
   links the developer already added by hand. When it does apply, it
   REPLACES the whole list (not merges/appends) — same "Steam is the
   source of truth once a title links to a Steam page" convention as
   Developer/Publisher/Genres. */
async function _applySteamSocialLinks(appId, expectedTitle) {
  let links = null;
  try {
    const html = await fetchSteamStorePage(appId);
    links = _parseSteamSocialLinks(html);
  } catch (e) {
    console.warn('[Steam Social Links] failed to fetch/parse store page for app', appId, e);
    // Still worth a (low-key) heads-up rather than pure silence — this is
    // fire-and-forget by design (see comment above) since a failure here is
    // routinely just "no social links on this store page", but a genuine
    // proxy/network failure looks identical to that from the developer's
    // seat with nothing shown at all. Only surfaced if the title is still
    // the one this fetch was for, same guard as the success path below.
    if ((state.formData.title || '').trim() === (expectedTitle || '').trim()) {
      bcToast(`Couldn't load Steam's social links for "${expectedTitle}" — add them manually under Factsheet if needed.`);
    }
    return;
  }

  // Stale guard — bail if the user has since picked a different title.
  if ((state.formData.title || '').trim() !== (expectedTitle || '').trim()) return;
  if (!links || !links.length) return;

  if (!state.webSite) state.webSite = {};
  state.webSite.links = links.map(l => ({ id: generateId('link'), name: l.name, url: l.url }));
  reRenderStepModal();
}

/* ── Prompt drawer (debug) ───────────────────────────────── */

function togglePromptDrawer(btn) {
  const drawer = btn.nextElementSibling;
  if (!drawer) return;
  const isOpen = drawer.classList.toggle('is-open');
  btn.textContent = isOpen ? 'Hide prompt' : 'See prompt';
}

/* ── Alert helpers ───────────────────────────────────────── */

// Show/hide the privacy policy alert based on whether the field has a value
function updatePrivacyAlert(value) {
  const el = document.getElementById('ob-privacy-alert');
  if (!el) return;
  // Show the alert only when the field has been touched (blurred or has some input) AND is empty
  el.style.display = (!value || !value.trim()) ? 'flex' : 'none';
}

function togglePrivacyGen(checkbox) {
  state.formData.privacyGenerated = checkbox.checked;
  const note = document.getElementById('ob-privacy-gen-note');
  if (note) note.style.display = checkbox.checked ? 'block' : 'none';
}


/* ── Upload Assets ───────────────────────────────────── */

function handleIconDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleIconFiles(e.dataTransfer.files);
}

function handleIconFiles(files) {
  const file = files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.uploads.appIcon = { name: file.name, dataUrl: ev.target.result };
    const preview = document.getElementById('ob-icon-preview');
    if (preview) {
      preview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" alt="App Icon">`;
    }
    // Two things read this icon and neither knew it had changed: Shippy's
    // checklist, and the cover art on the nav pill's project chip.
    updateObSectionStates();
    renderProjectBar();
  };
  reader.readAsDataURL(file);
}

function removeIcon() {
  state.uploads.appIcon = null;
  const preview = document.getElementById('ob-icon-preview');
  if (preview) {
    preview.innerHTML = `
      <div class="asset-dropzone-icon">↑</div>
      <div class="asset-dropzone-label">Drop icon here, or click to browse</div>
      <div class="asset-dropzone-hint">PNG · 1024×1024</div>`;
  }
  updateObSectionStates();
  renderProjectBar();
}

function handleScreenshotDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleScreenshotFiles(e.dataTransfer.files);
}

function handleScreenshotFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const id = 'ss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const reader = new FileReader();
    reader.onload = ev => {
      const entry = { id, name: file.name, dataUrl: ev.target.result };
      state.uploads.screenshots.push(entry);
      const grid = document.getElementById('ob-screenshot-grid');
      if (grid) renderScreenshotGridInto(grid);
      updateObSectionStates();   // clear amber as soon as first screenshot lands
      // Mirror into the Web platform's own independent copy (same id, so a
      // later removal here — by id — finds and removes it there too). See
      // the state.js comment above webSite.screenshots.
      if (!state.webSite) state.webSite = {};
      if (!state.webSite.screenshots) state.webSite.screenshots = [];
      state.webSite.screenshots.push({ ...entry });
      const wsGrid = document.getElementById('ws-screenshot-grid');
      if (wsGrid) renderWebScreenshotGridInto(wsGrid);
    };
    reader.readAsDataURL(file);
  });
}

/* ── Improve Your Submission — AI visual analysis ───────────── */

/* Tolerant parse for the analysis JSON. Tries a straight JSON.parse first;
   if that throws (e.g. the model response was cut off mid-string despite the
   raised token ceiling), it salvages a partial result: keep the "scores"
   object if present, and recover every COMPLETE object already closed inside
   the "items" array, discarding the truncated tail. Better a shorter report
   than a hard "Analysis failed". */
function _parseAnalysisJSON(text) {
  try { return JSON.parse(text); } catch (_) {}

  const out = {};
  // scores { ... } — grab the first complete brace-balanced object after "scores":
  const sIdx = text.indexOf('"scores"');
  if (sIdx !== -1) {
    const open = text.indexOf('{', sIdx);
    if (open !== -1) {
      let depth = 0;
      for (let i = open; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (depth === 0) {
          try { out.scores = JSON.parse(text.slice(open, i + 1)); } catch (_) {}
          break;
        } }
      }
    }
  }
  // items [ ... ] — collect each complete {...} element; stop at the first broken one.
  out.items = [];
  const iIdx = text.indexOf('"items"');
  const arrOpen = iIdx !== -1 ? text.indexOf('[', iIdx) : -1;
  if (arrOpen !== -1) {
    let i = arrOpen + 1;
    while (i < text.length) {
      const objStart = text.indexOf('{', i);
      if (objStart === -1) break;
      let depth = 0, end = -1, inStr = false, esc = false;
      for (let j = objStart; j < text.length; j++) {
        const ch = text[j];
        if (inStr) {
          if (esc) esc = false;
          else if (ch === '\\') esc = true;
          else if (ch === '"') inStr = false;
        } else if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { end = j; break; } }
      }
      if (end === -1) break;                    // truncated element — stop here
      try { out.items.push(JSON.parse(text.slice(objStart, end + 1))); } catch (_) { break; }
      i = end + 1;
    }
  }
  if (!out.scores && !out.items.length) {
    throw new Error('could not parse analysis response');
  }
  return out;
}

async function runImproveSubmissionAnalysis(platformId) {
  if (!CLAUDE_API_KEY) {
    state.improveSubmissionAnalysis = { error: 'No API key configured.' };
    renderStepModal(); return;
  }

  const ups  = state.uploads;
  const icon = ups.appIcon;
  const shots = (ups.screenshots || []).filter(s => s.dataUrl);
  // Note: don't gate on images — the analysis also scores store page text + metadata.
  // If no images are available, Claude evaluates text only and notes missing assets.

  state.improveSubmissionAnalysis = { loading: true };
  renderStepModal();

  // Helper: strip data-URL prefix → bare base64 + media type
  function parseDataUrl(dataUrl) {
    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    return { mediaType: m[1], data: m[2] };
  }

  // Build vision message content
  const content = [];

  // System context
  content.push({ type: 'text', text:
    `You are an expert mobile game App Store consultant evaluating submission assets for "${state.formData.title || 'this game'}".
You will receive the app icon and up to 5 screenshots. Analyze them for quality, effectiveness, and compliance risk.

Evaluation criteria:

ICON:
- Readability at small sizes (29×29 notification, 60×60 home screen) — is the focal point clear?
- Absence of text or wordmarks (Apple/Google reject icons with text)
- Color contrast and visibility on both light and dark backgrounds
- Genre communication — does it signal the type of game?
- Differentiation — would it stand out in a crowded category listing?
- Avoid generic or over-designed icons that blur at small sizes

SCREENSHOTS:
- Gameplay visibility — do they show actual gameplay, not just menus, loading screens, or cutscenes?
- Feature diversity — do they collectively showcase different game mechanics/moments, or are they repetitive?
- Marketing text overlays — text burned into screenshots (taglines, "BEST GAME EVER", promotional copy) can trigger App Store rejection; pure UI/HUD text is fine
- First screenshot impact — it's the most important; does it immediately communicate the core appeal?
- Visual clarity — is each screenshot readable and visually compelling at thumbnail scale?

STORE PAGE:
You also have access to the game's title and description (provided separately in the message). Evaluate the store page copy quality:
- Is the title distinctive and searchable?
- Does the description open with a compelling hook in the first two sentences?
- Is gameplay clearly described, not just vague adjectives?
- Are there keyword opportunities being missed?

METADATA / TAGS:
- Does the title/description suggest good keyword targeting?
- Are genre signals clear?

BINARY (not available — mark as pending):
- You have no binary to analyze. Score this N/A.

Return ONLY a valid JSON object. No markdown. No explanation. Only the JSON:
{
  "scores": {
    "storePage": "A" | "B" | "C" | "D",
    "assets":    "A" | "B" | "C" | "D",
    "metadata":  "A" | "B" | "C" | "D"
  },
  "items": [
    {
      "area": "Store Page" | "Assets" | "Icon" | "Screenshots" | "Screenshot 1" | "Metadata" | "Binary",
      "severity": "warning" | "tip" | "info",
      "title": "Short title (max 10 words)",
      "body": "2–3 sentence explanation with specific, actionable guidance"
    }
  ]
}

Grade rubric: A = strong, minimal changes needed. B = solid but room to improve. C = notable gaps affecting conversion or compliance. D = significant issues requiring attention.
Only include findings that are genuinely meaningful. Omit filler. If something is strong, say so briefly as "info". If something needs attention, be specific about what and why.`
  });

  // Add store page copy for text analysis
  const fd = state.formData;
  if (fd.title || fd.description) {
    content.push({ type: 'text', text:
      `STORE PAGE COPY:\nTitle: ${fd.title || '(no title)'}\nDescription: ${(fd.description || '(no description)').slice(0, 800)}${(fd.description || '').length > 800 ? '…' : ''}` });
  }

  // Attach icon if present
  if (icon) {
    const parsed = parseDataUrl(icon.dataUrl);
    if (parsed) {
      content.push({ type: 'text', text: 'APP ICON:' });
      content.push({ type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.data } });
    }
  }

  // Attach up to 5 screenshots
  const toAnalyze = shots.slice(0, 5);
  toAnalyze.forEach((s, i) => {
    const parsed = parseDataUrl(s.dataUrl);
    if (parsed) {
      content.push({ type: 'text', text: `SCREENSHOT ${i + 1}:` });
      content.push({ type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.data } });
    }
  });

  try {
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        // Was 1600 — too low for scores + a full items list, so the JSON came
        // back truncated mid-string ("Unterminated string in JSON"). Give it
        // real headroom; the tolerant parse below is a second safety net.
        max_tokens: 4096,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!res.ok) throw new Error('API ' + res.status);
    const data    = await res.json();
    const raw     = (data.content?.[0]?.text || '').trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed  = _parseAnalysisJSON(cleaned);
    // Support both new { scores, items } format and legacy flat array
    if (Array.isArray(parsed)) {
      state.improveSubmissionAnalysis = { scores: null, items: parsed };
    } else {
      state.improveSubmissionAnalysis = {
        scores: parsed.scores || null,
        items:  Array.isArray(parsed.items) ? parsed.items : [],
      };
    }
  } catch (err) {
    state.improveSubmissionAnalysis = { error: 'Analysis failed: ' + err.message };
  }
  renderStepModal();
}

/* ── Store Page AI Insights ("Fix it" button) ──────────────── */

async function runStorePageInsights() {
  if (!CLAUDE_API_KEY) {
    state.storePageInsights = { error: 'No API key configured.' };
    renderStepModal(); return;
  }
  state.storePageInsights = { loading: true };
  renderStepModal();

  const fd    = state.formData;
  const title = fd.title || '(no title)';
  const desc  = fd.description || '(no description)';

  const subtitle = state.formData.subtitle || '';
  const prompt = `You are a senior App Store listing consultant. Review this mobile game listing and identify up to 5 HIGH-IMPACT improvements that would meaningfully increase downloads.

GAME: "${title}"
SUBTITLE (current, max 30 chars): "${subtitle}"
DESCRIPTION (current): "${desc.slice(0, 1200)}${desc.length > 1200 ? '…' : ''}"

STRICT RULES — violations result in the suggestion being discarded:
1. Every suggestion MUST include a concrete "fixedValue" — the exact replacement text ready to copy-paste. No "fixedValue" = omit the suggestion.
2. Each suggestion must target a DISTINCT weakness. No overlapping or redundant issues.
3. Changes must be SUBSTANTIAL, not cosmetic. Minor rephrasing ("one to eight" → "1–8") does not qualify.
4. "fixedValue" for subtitle: max 30 characters. "fixedValue" for description: preserve the overall length, making targeted insertions or replacements that add the missing information.
5. Do NOT suggest removing content — only adding or replacing.
6. Prioritize: missing gameplay specifics > weak hook > absent genre signal > unclear audience > missing key feature.

Respond ONLY with valid JSON — a JSON array, no markdown, no preamble:
[
  {
    "field": "subtitle",
    "issue": "One sentence naming the specific gap (e.g., 'Subtitle doesn't mention the core mechanic')",
    "suggestion": "One sentence explaining what the fix achieves",
    "fixedValue": "Exact replacement text"
  }
]

Return an EMPTY ARRAY [] if no high-impact improvements exist. Return FEWER than 5 if you cannot find 5 distinct, substantial improvements.`;

  try {
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error('API ' + res.status);
    const data    = await res.json();
    const raw     = (data.content?.[0]?.text || '').trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed  = JSON.parse(cleaned);
    const issues  = (Array.isArray(parsed) ? parsed : [parsed]).slice(0, 5);
    state.storePageInsights = { issues, index: 0 };
  } catch (err) {
    state.storePageInsights = { error: 'Analysis failed: ' + err.message };
  }
  renderStepModal();
}

/* Build the merged store-page suggestion list (max 5) from current analysis state.
   Used by both the render function and applyStorePageFix so they share one source. */
function _getCurrentMergedStoreItems() {
  const spi = state.storePageInsights;
  const ana = state.improveSubmissionAnalysis;
  const accepted   = state.acceptedFixes   || {};  // field → accepted value
  const dismissed  = state.dismissedFixes  || new Set(); // indices into the ORIGINAL array

  const spItems = (!spi?.loading && !spi?.error && spi?.issues)
    ? spi.issues
        .filter(iss => !!iss.fixedValue)                        // must have a concrete fix
        .filter(iss => !iss.field || !(iss.field in accepted))  // skip already-accepted
        .map(iss => ({
          tag: { subtitle:'Subtitle', description:'Description', title:'Title' }[iss.field] || 'Store Page',
          title: iss.issue || iss.title || '',
          body:  iss.suggestion || iss.body || '',
          fixedValue: iss.fixedValue,
          field: iss.field || null,
          type:  'sp',
        }))
    : [];

  // anaItems are informational only (no fixedValue) — omitted per policy
  const all = spItems.slice(0, 5);
  // Remove dismissed items by identity (title + field) — robust against index shifts
  return all.filter(item => !dismissed.has(item.title + '||' + (item.field || '')));
}

/* Auto-trigger both analyses when the Improve Your Submission step opens */
function _autoRunImproveSubmission(pid) {
  const needsSP = !state.storePageInsights || !!state.storePageInsights.error;
  const needsAI = !state.improveSubmissionAnalysis || !!state.improveSubmissionAnalysis.error;

  // Reset cycling index and dismissed/accepted on fresh analysis run
  state.improveSubmissionIdx = { storePage: 0 };
  state.dismissedFixes = new Set();

  if (needsSP) state.storePageInsights        = { loading: true };
  if (needsAI) state.improveSubmissionAnalysis = { loading: true };

  renderStepModal(); // show loading screen immediately

  if (needsSP) runStorePageInsights();
  if (needsAI) runImproveSubmissionAnalysis(pid);
}

/* Apply a value to a store-page field and record it as accepted so it won't resurface */
function _applyFieldValue(field, value) {
  if (!value) return;
  if (!state.acceptedFixes) state.acceptedFixes = {};
  state.acceptedFixes[field] = value;

  if (field === 'description') {
    state.formData.description = value;
    _wsPropagateAboutGame(value);
    const el = document.getElementById('ob-desc');
    if (el) { el.value = value; charCount('ob-desc-count', value, 4000); }
    _iasTriggerAutoTranslate('description', value);
  } else if (field === 'subtitle') {
    state.formData.subtitle = value;
    const el = document.getElementById('ob-subtitle');
    if (el) { el.value = value; charCount('ob-subtitle-count', value, 30); }
    _iasTriggerAutoTranslate('subtitle', value);
  } else if (field === 'title') {
    state.formData.title = value;
    const el = document.getElementById('ob-title');
    if (el) { el.value = value; charCount('ob-title-count', value, 30); }
    _iasPropagateTitle(value);
  }
}

/* ── App Store Product Page Preview — per-language store text ───────────
   Title/Subtitle/Description/What's New are each associated with a specific
   language, driven by the preview's own language dropdown (swSelect,
   render.js) and the Distribution section's Primary Language + selected
   supported languages (state.formData.primaryLanguage / .localizations).
   The Primary Language's copy IS the flat state.formData.{title,subtitle,
   description,releaseNotes} fields — unchanged, still what Game Details and
   every other platform's own preview (Android/Steam/Web) read and write.
   Every additional supported language gets its own copy in
   state.formData.localizedStoreText[langCode], created lazily the first
   time something is actually typed for it (not eagerly when the language
   is added in Distribution — an unedited language just reads as empty/
   placeholder everywhere, which looks identical to an eagerly-created blank
   entry, so there's nothing to gain from allocating it early, and this way
   it works no matter how a language got into `localizations` — one at a
   time via toggleObLang, or in bulk via a Distribution preset).

   Every localized field always follows the Primary Language's current
   text — there is no per-language "override" that sticks around. Editing a
   supporting language's Title/Subtitle/Description/What's New directly in
   this preview still writes into its own entry (so it can look different
   from the primary in the meantime, e.g. while a translation is still
   loading), but the next time the Primary Language's copy of that field
   changes, every supporting language's copy is unconditionally refreshed
   from it — a prior manual edit for that language does not protect it from
   being overwritten. */
function _iasEffectivePreviewLang() {
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const valid = new Set([primary, ...(fd.localizations || [])]);
  return valid.has(state.iasPreviewLang) ? state.iasPreviewLang : primary;
}

function _iasBlankLocalizedText() {
  return { title: '', subtitle: '', description: '', releaseNotes: '' };
}

function _iasFieldValue(field, lang) {
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  if (lang === primary) return fd[field] || '';
  const entry = fd.localizedStoreText && fd.localizedStoreText[lang];
  return (entry && entry[field]) || '';
}

// Whether ANY of a language's four store-listing fields (Title, Subtitle,
// Description, What's New) currently exceeds its character limit
// (IAS_FIELD_CHAR_LIMITS above) — drives the warning icon shown next to
// that language in the App Store Product Page Preview's language dropdown
// (swSelect's ddItems, render.js's buildStorePreviewSection), so an
// over-limit field on a language you aren't currently previewing doesn't
// go unnoticed.
function _iasLangHasOverLimitField(lang) {
  return Object.keys(IAS_FIELD_CHAR_LIMITS).some(field =>
    _iasFieldValue(field, lang).length > IAS_FIELD_CHAR_LIMITS[field]);
}

// The transpose of _iasLangHasOverLimitField above: whether ANY language
// (across every language the Localization Review section covers,
// _iasAllPreviewLangCodes, render.js) has THIS ONE field over its character
// limit. Drives the warning icon next to a field in Localization Review's
// top-right field dropdown (buildLocalizationReviewSection, render.js) —
// e.g. Subtitle gets flagged the moment any single language's Subtitle card
// is over limit, even while a different field is the one currently shown.
function _iasFieldHasOverLimitLang(field, langCodes) {
  const limit = IAS_FIELD_CHAR_LIMITS[field];
  return langCodes.some(lang => _iasFieldValue(field, lang).length > limit);
}

// Localization Review — which small "source" badge (if any) a language's
// card should show for the currently-displayed field (buildLocalizationReviewSection,
// render.js). Two possible sources, matching the two automatic ways a
// supporting language's text gets filled in without the developer typing it
// themselves:
//   'steam' — a genuine Steam store-page localization is still in effect
//             for this language's Description (_checkSteamLocalizedDescription
//             set descriptionFromSteam, and the primary Description hasn't
//             changed since — see _iasTriggerAutoTranslate's write-time
//             guard above for how that authority expires).
//   'ai'    — the field is a live AI translation of the CURRENT primary-
//             language text: its cached `${field}SourceText` (set by
//             _iasTriggerAutoTranslate) still matches what's actually in
//             the primary language's own field right now.
// Returns null for the Primary Language's own card (nothing to attribute —
// it's the source, not a copy), for a blank/placeholder field, and for
// Title (never translated — just mirrored verbatim by _iasPropagateTitle,
// which is neither a Steam localization nor a translation) and any other
// text that's stale or was typed directly into that language's card.
function _locReviewSourceBadge(field, lang) {
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  if (lang === primary) return null;
  if (!_iasFieldValue(field, lang)) return null;
  const entry = fd.localizedStoreText && fd.localizedStoreText[lang];
  if (!entry) return null;
  if (field === 'description' && entry.descriptionFromSteam) return 'steam';
  if (_iasFieldAutoTranslateEnabled(field) && entry[field + 'SourceText'] === (fd[field] || '')) return 'ai';
  return null;
}

function _iasSetFieldValue(field, lang, value) {
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  if (lang === primary) {
    fd[field] = value;
    if (field === 'title') _iasPropagateTitle(value);
    else if (_iasFieldAutoTranslateEnabled(field)) _iasTriggerAutoTranslate(field, value);
    return;
  }
  if (!fd.localizedStoreText) fd.localizedStoreText = {};
  if (!fd.localizedStoreText[lang]) fd.localizedStoreText[lang] = _iasBlankLocalizedText();
  fd.localizedStoreText[lang][field] = value;
}

// Copies the Primary Language's Title verbatim into every supporting
// language, UNLESS Title has been turned on as an auto-translated field via
// the "Automatically translated fields" settings (gear icon beside
// "Localization Review" — see _iasFieldAutoTranslateEnabled/
// _iasToggleAutoTranslateField below), in which case Title is redirected to
// the same real AI-translation path as Subtitle/Description/What's New
// instead. By default Title is NOT one of the auto-translated fields, so
// this mirror is the normal path: game titles are typically kept consistent
// across locales, so mirroring is synchronous and needs no API call — a
// newly-added language's Title is correct immediately, with no loading gap.
// Always overwrites, including any earlier manual edit for that language —
// nothing protects a supporting language's Title from the next Primary
// Language Title change.
function _iasPropagateTitle(primaryValue) {
  if (_iasFieldAutoTranslateEnabled('title')) { _iasTriggerAutoTranslate('title', primaryValue); return; }
  const fd = state.formData;
  const supportedLangs = fd.localizations || [];
  if (!supportedLangs.length) return;
  if (!fd.localizedStoreText) fd.localizedStoreText = {};
  supportedLangs.forEach(lang => {
    if (!fd.localizedStoreText[lang]) fd.localizedStoreText[lang] = _iasBlankLocalizedText();
    fd.localizedStoreText[lang].title = primaryValue || '';
  });
}

/* ── App Store Product Page Preview — auto-translation ──────────────────
   Subtitle, Description, and What's New require an actual round trip to
   Claude to translate, so each supporting language's copy is eagerly
   translated and cached into its localizedStoreText entry as soon as the
   primary language's text changes, and re-translated whenever it goes
   stale — i.e. its cached translation was generated from different
   primary-language text than what's current right now (tracked via
   `${field}SourceText`, the exact primary text a stored translation came
   from). This also naturally covers a newly-added supporting language,
   which has no entry/source-text yet and is therefore always stale. A
   manual edit for a language is simply overwritten the next time the
   primary text changes and this fires again.

   Description has one additional wrinkle: a language whose entry is
   flagged descriptionFromSteam (see _checkSteamLocalizedDescription) holds
   a genuine Steam store-page localization, which is authoritative over an
   AI-translated guess of the SAME primary text — the write-time guard
   below skips overwriting it in that case. But that authority is only
   "authoritative for the primary text Steam actually saw" — the very next
   primary Description edit makes the language stale like any other
   (its cached descriptionSourceText no longer matches), and the resulting
   translation DOES override the Steam-sourced text, same as everywhere
   else in this function. Steam only gets to supply the *initial* Description
   for a newly-added language or newly-selected Steam-linked game; every
   edit after that is translated and wins normally. */
// The 3 fields that have never had a verbatim-mirror fallback — Title's
// fallback (mirroring instead of translating) is handled separately inside
// _iasPropagateTitle above. This list is intentionally NOT the source of
// truth for whether a field auto-translates right now — that's
// state.iasAutoTranslateFields, read via _iasFieldAutoTranslateEnabled below
// — it's only used by _iasPropagateAllFields to know which fields always go
// through the translate path (vs. Title, routed through _iasPropagateTitle
// so it can pick mirror-or-translate based on the current setting).
const IAS_TRANSLATABLE_FIELDS = ['subtitle', 'description', 'releaseNotes'];
const IAS_FIELD_LABELS = {
  title:        'title',
  subtitle:     'subtitle',
  description:  'description',
  releaseNotes: "what's new (release notes)",
};

// Whether `field` is currently configured to auto-translate (or, for Title,
// mirror) from the Primary Language into supporting languages — see the
// "Automatically translated fields" settings, state.iasAutoTranslateFields.
// Falls back to the original hardcoded IAS_TRANSLATABLE_FIELDS behavior if
// the setting is ever missing (e.g. a hand-built `state` in older tests),
// so callers can't crash or silently disable translation just because this
// field hasn't been initialized.
function _iasFieldAutoTranslateEnabled(field) {
  const cfg = state.iasAutoTranslateFields;
  if (!cfg) return IAS_TRANSLATABLE_FIELDS.includes(field);
  return !!cfg[field];
}

async function _iasTriggerAutoTranslate(field, primaryValue) {
  if (!_iasFieldAutoTranslateEnabled(field)) return;
  const fd = state.formData;
  const supportedLangs = fd.localizations || [];
  if (!supportedLangs.length) return;

  const text      = (primaryValue || '').trim();
  const sourceKey = field + 'SourceText';

  const eligible = supportedLangs.filter(lang => {
    const entry = fd.localizedStoreText && fd.localizedStoreText[lang];
    const cachedSource = entry ? entry[sourceKey] : undefined;
    return cachedSource !== text;
  });
  if (!eligible.length) return;

  // Nothing to translate — just clear any stale cached translations
  // instead of calling out to the API for blanks. An emptied primary
  // Description also clears a Steam-authoritative language's text (and its
  // now-meaningless descriptionFromSteam flag) — same as everywhere else,
  // nothing here is protected from the primary field going blank.
  if (!text) {
    if (!fd.localizedStoreText) fd.localizedStoreText = {};
    eligible.forEach(lang => {
      if (!fd.localizedStoreText[lang]) fd.localizedStoreText[lang] = _iasBlankLocalizedText();
      fd.localizedStoreText[lang][field]     = '';
      fd.localizedStoreText[lang][sourceKey] = '';
      if (field === 'description') delete fd.localizedStoreText[lang].descriptionFromSteam;
      // Top text just changed (cleared) for this language — refresh its
      // Review-side bottom-half draft to match, same dedup check used
      // everywhere else so this is a no-op if it's already in sync.
      const backEntry = _locReviewBackTranslationEntry(field, lang);
      if (backEntry.syncedTopText !== '') _locReviewRefreshBackTranslation(field, lang, '');
    });
    reRenderStepModal();
    return;
  }

  if (!CLAUDE_API_KEY) return;

  state.iasTranslateStatus = state.iasTranslateStatus || {};
  state.iasTranslateStatus[field] = 'loading';
  // Which languages this batch will actually update — read by
  // _iasFieldTranslatePending (below) so Localization Review can show the
  // loading spinner only on the card(s) really about to change, not every
  // supporting language indiscriminately (a language already in sync with
  // this exact primary text, if any, was already filtered out of
  // `eligible` above).
  state.iasTranslatePendingLangs = state.iasTranslatePendingLangs || {};
  state.iasTranslatePendingLangs[field] = eligible.slice();
  reRenderStepModal();

  const langList      = eligible.map(l => `${l}: ${OB_LANG_NAMES[l] || l}`).join('\n');
  const fieldLabel     = IAS_FIELD_LABELS[field] || field;
  const perLangBudget  = (field === 'subtitle' || field === 'title') ? 120 : (field === 'releaseNotes' ? 600 : 1200);
  const maxTokens      = Math.min(8192, 300 + eligible.length * perLangBudget);

  const prompt = `Translate the following app store ${fieldLabel} text for a mobile/video game into each of the listed languages.

Source text:
"""
${text}
"""

Target languages (ISO code: language name):
${langList}

Return ONLY valid JSON — no markdown fences, no extra text:
  {
    "translations": { "<language code>": "<translated text>", ... }
  }

Rules:
- Preserve the tone, meaning, and any line breaks in the source text.
- Write natural, idiomatic translations for a native speaker of each target language — not literal word-for-word.
- Include every requested language code as a key.`;

  try {
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key':                                 CLAUDE_API_KEY,
        'anthropic-version':                         '2023-06-01',
        'content-type':                              'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages:   [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    });

    if (!res.ok) throw new Error('API ' + res.status);
    const data    = await res.json();
    const resText = (data.content?.[0]?.text || '').trim();
    const cleaned = resText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed  = JSON.parse(cleaned);
    const results = parsed.translations || {};

    if (!fd.localizedStoreText) fd.localizedStoreText = {};
    eligible.forEach(lang => {
      const translated = results[lang];
      if (typeof translated !== 'string' || !translated.trim()) return;
      if (!fd.localizedStoreText[lang]) fd.localizedStoreText[lang] = _iasBlankLocalizedText();
      const entry = fd.localizedStoreText[lang];
      // Re-check authority at write time, not just when this batch was
      // kicked off, and re-check it against the CURRENT entry (which may
      // have changed during this API round trip), not a value captured
      // before the fetch. _checkSteamLocalizedDescription's Steam fetch is
      // typically far faster than a Claude round trip, so it can complete
      // and populate this language WHILE this exact translation call was
      // still in flight — without this guard, the slower-but-already-in-
      // flight translation would land afterward and silently clobber the
      // just-arrived Steam text.
      //
      // The guard only fires when Steam's cached source text still equals
      // what THIS call is translating (`text`) — i.e. nothing has changed
      // since Steam wrote it, so its answer for this exact primary text is
      // still the most current one. If a genuine primary-Description edit
      // landed in between (entry.descriptionSourceText no longer matches
      // `text`), Steam's answer is for stale text and this translation is
      // allowed to override it, same as any other language — Steam only
      // gets to supply a language's *initial* Description; every edit
      // after that translates and wins normally.
      if (field === 'description' && entry.descriptionFromSteam && entry.descriptionSourceText === text) return;
      entry[field]     = translated;
      entry[sourceKey] = text;
      // This write just replaced whatever Steam may have supplied with a
      // fresh AI translation — the current text is no longer Steam's own,
      // so the flag no longer applies (if it was even set; harmless no-op
      // otherwise).
      if (field === 'description') delete entry.descriptionFromSteam;
      // This language's top-half text just changed as a result of the
      // primary-language edit that kicked off this whole batch — refresh
      // its Review-side bottom-half draft once this top text has actually
      // finished updating, same mechanism/dedup used for a direct top-half
      // edit (startLocReviewInlineEdit's commit hook). Languages skipped by
      // the Steam-authority guard above never reach here, so their top text
      // didn't change and their back-translation cache is correctly left
      // untouched.
      const backEntry = _locReviewBackTranslationEntry(field, lang);
      if (backEntry.syncedTopText !== translated) _locReviewRefreshBackTranslation(field, lang, translated);
    });

    state.iasTranslateStatus[field] = 'complete';
  } catch (e) {
    console.warn('[Store Preview Translate]', field, e.message);
    state.iasTranslateStatus[field] = 'error';
  }
  // This batch is done (either way) — nothing left pending for it. Any
  // per-language back-translation refresh the success branch just kicked
  // off above (_locReviewRefreshBackTranslation) tracks its OWN loading
  // state separately (locReviewBackTranslation[field][lang].status), so
  // clearing this doesn't affect that.
  state.iasTranslatePendingLangs[field] = [];

  reRenderStepModal();
}

// Read-only lookup for render.js (never mutates state) — whether `lang` is
// currently awaiting a translation from the Primary Language's batch
// translate above (state.iasTranslatePendingLangs[field]), gated on the
// batch actually still being in flight (state.iasTranslateStatus[field]
// === 'loading') so a stale/leftover pending-langs list from a previous
// batch can never cause a false positive. Drives the loading spinner shown
// on a non-flipped Localization Review card, or a flipped card's TOP half
// (buildLocalizationReviewSection, render.js).
function _iasFieldTranslatePending(field, lang) {
  if (!state.iasTranslateStatus || state.iasTranslateStatus[field] !== 'loading') return false;
  const pending = state.iasTranslatePendingLangs && state.iasTranslatePendingLangs[field];
  return !!(pending && pending.includes(lang));
}

function _iasRetryTranslate(field) {
  _iasTriggerAutoTranslate(field, state.formData[field] || '');
}

// Re-propagates Title and re-triggers translation of the other three
// fields from the current primary-language values — used whenever the set
// of supporting languages or the primary language itself changes (adding/
// removing a language one at a time, applying a Distribution preset in
// bulk, or promoting a different language to primary), since none of those
// paths edit the fields themselves and so wouldn't otherwise fire
// _iasPropagateTitle/_iasTriggerAutoTranslate.
function _iasPropagateAllFields() {
  const fd = state.formData;
  _iasPropagateTitle(fd.title);
  IAS_TRANSLATABLE_FIELDS.forEach(field => _iasTriggerAutoTranslate(field, fd[field]));
}

// Flips one field's entry in the "Automatically translated fields" setting
// (gear icon beside "Localization Review") and immediately brings supporting
// languages up to date if it was just turned ON — mirroring how a newly-
// added language gets retroactively populated by _iasPropagateAllFields
// above, rather than waiting for the next primary-language edit. Turning a
// field OFF does not clear or revert any text already sitting in supporting
// languages — per the feature's spec, disabling a field only stops FUTURE
// automatic propagation; existing translations/mirrors are left alone.
// Never touches the Review section's own back-translation state
// (locReviewBackTranslation) — that mechanism is completely independent of
// this setting.
function _iasToggleAutoTranslateField(field) {
  state.iasAutoTranslateFields = state.iasAutoTranslateFields || {};
  state.iasAutoTranslateFields[field] = !state.iasAutoTranslateFields[field];
  if (state.iasAutoTranslateFields[field]) {
    const fd = state.formData;
    if (field === 'title') _iasPropagateTitle(fd.title || '');
    else _iasTriggerAutoTranslate(field, fd[field] || '');
  }
  reRenderStepModal();
}

/* ── App Store Product Page Preview — inline click-to-edit ──────────────
   Title/Subtitle/Description/Release Notes can all be edited directly in
   the live preview (buildStorePreviewSection, render.js), not just in
   Game Details elsewhere (Release Notes has no "elsewhere" at all — this
   is its only editable surface in Shipmate, for the Primary Language;
   translations have no Game Details equivalent at all, so this preview is
   their ONLY editable surface, period). Clicking any of the four swaps
   that element for a plain input/textarea in its own place — pre-filled
   with the REAL underlying value for whichever language the dropdown above
   is currently showing (_iasFieldValue), never whatever placeholder text
   ("Your Game Title", "Short subtitle", the description fallback sentence,
   "Add release notes...") happened to be showing, so clicking a still-empty
   field never accidentally saves the placeholder copy as real data. For
   Release Notes specifically, that also means the raw newline-separated
   text with no "- " prefixes — the bullet formatting shown in the preview
   (notesHtml, render.js) is purely a display transform, not what's stored
   or re-edited. Reuses the clicked element's own classes on the input/
   textarea (minus the hover/placeholder-only ones, which don't apply while
   actively editing) so it inherits that field's exact font size/weight/
   color from style.css, layering in only the editing-specific look (border,
   background) via ias-inline-input — see style.css for both. The language
   being edited is captured once, when the field is clicked (not re-read at
   commit time) — if the preview's language dropdown itself is clicked while
   mid-edit, the input's blur fires first (normal DOM focus-loss ordering),
   committing to the language that was open when editing started, before
   the dropdown's own click handler ever runs. Committing (blur, or Enter
   for the single-line Title/Subtitle — Description and Release Notes are
   multi-line, so Enter there just adds a line break like any textarea, and
   only blur commits) writes straight to that language's own storage
   (_iasSetFieldValue) and re-renders the whole step modal, which naturally
   swaps the input back out for the styled preview text. Character limits
   (IAS_FIELD_CHAR_LIMITS below) are Apple's real App Store Connect limits —
   30 for Title and Subtitle, 4,000 for Description and Release Notes — and
   are enforced the same way Apple's own submission form enforces them:
   as a SOFT limit with live visual feedback (a remaining-characters count
   that goes negative and red, the field itself highlighted red, and a
   "Must be less than N characters." message once over), never a hard
   native maxLength that blocks typing outright. This deliberately
   diverges from ob-title/ob-desc's own separate hard/soft caps in Game
   Details (unrelated fields, unrelated UI, not touched here) — this
   preview is its own surface with its own limits and its own always-live
   (not hover- or hidden-counter) feedback, per Apple's real form. */
const IAS_FIELD_CHAR_LIMITS = { title: 30, subtitle: 30, description: 4000, releaseNotes: 4000 };

function startIasInlineEdit(field, el, ev) {
  if (ev) ev.stopPropagation();
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return; // already editing

  const lang = _iasEffectivePreviewLang();
  const isMultiline = field === 'description' || field === 'releaseNotes';
  const limit = IAS_FIELD_CHAR_LIMITS[field];
  const input = document.createElement(isMultiline ? 'textarea' : 'input');
  input.className = el.className.split(/\s+/).filter(c => c && c !== 'ias-placeholder' && c !== 'ias-editable').join(' ');
  input.classList.add('ias-inline-input');
  if (isMultiline) {
    input.rows = 4;
  } else {
    input.type = 'text';
  }
  input.value = _iasFieldValue(field, lang);

  // Character counter — sits beneath the bottom-right of the field
  // (ias-char-counter-row, style.css), live-updated on every keystroke.
  // Typing is never hard-blocked (no native maxLength — see the comment
  // above): the count is free to go negative, at which point the field
  // and count turn red and an error line appears to its left.
  const counterRow = document.createElement('div');
  counterRow.className = 'ias-char-counter-row';
  const errorEl = document.createElement('span');
  errorEl.className = 'ias-char-error';
  const countEl = document.createElement('span');
  countEl.className = 'ias-char-count';
  counterRow.append(errorEl, countEl);

  const updateCounter = () => {
    const remaining = limit - input.value.length;
    const isOver = remaining < 0;
    countEl.textContent = String(remaining);
    countEl.classList.toggle('is-over', isOver);
    errorEl.textContent = isOver ? `Must be less than ${limit} characters.` : '';
    input.classList.toggle('is-over-limit', isOver);
  };

  const commit = () => {
    _iasSetFieldValue(field, lang, input.value);
    reRenderStepModal();
  };
  input.addEventListener('blur', commit);
  input.addEventListener('input', updateCounter);
  if (!isMultiline) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    });
  }

  el.replaceWith(input);
  input.insertAdjacentElement('afterend', counterRow);
  updateCounter();
  input.focus();
  input.select();
}

/* Localization Review's per-card click-to-edit (buildLocalizationReviewSection,
   render.js) — the same swap-to-input mechanics as startIasInlineEdit above,
   for the same field types and the same soft IAS_FIELD_CHAR_LIMITS
   enforcement, but for an explicit `lang` param rather than resolving
   _iasEffectivePreviewLang(): each card here is a DIFFERENT language shown
   side by side, not "whichever language the dropdown is currently showing".
   The one real structural difference: Localization Review's counter row is
   always visible (buildLocalizationReviewSection renders it directly into
   every card, editing or not, so the whole point of the review — seeing
   every language's length at a glance — still works before you've clicked
   anything) rather than being created fresh on click like
   startIasInlineEdit's is. So this reuses the counter row already sitting
   in the DOM as the field's next sibling instead of creating a new one.

   Multiline fields get 8 rows here, not the main preview's 4 — matched by
   the taller max-height override on textarea.loc-review-field.ias-inline-
   input in style.css (the collapsed DISPLAY state's own 160px cap, on
   .loc-review-field alone, is untouched). A review card has no fixed
   height of its own (.loc-review-card just grows to fit its content in the
   flex-wrap row), so a taller editor simply grows that one card — nothing
   else in it is pushed outside its bounds.

   This same function also handles the TOP half of the flipped Review side
   (buildLocalizationReviewSection renders it with the identical onclick —
   the top half IS the language's own real field, exactly like the
   unflipped side, just laid out above the back-translation half instead of
   alone in the card) — detected via el.closest('.loc-review-half') so it
   can size down to 4 rows there, since a half only has half the card's
   vertical room. */
function startLocReviewInlineEdit(field, lang, el, ev) {
  if (ev) ev.stopPropagation();
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return; // already editing

  const isMultiline = field === 'description' || field === 'releaseNotes';
  const inHalf = !!(el.closest && el.closest('.loc-review-half'));
  const limit = IAS_FIELD_CHAR_LIMITS[field];
  const input = document.createElement(isMultiline ? 'textarea' : 'input');
  input.className = el.className.split(/\s+/).filter(c => c && c !== 'ias-placeholder' && c !== 'ias-editable').join(' ');
  input.classList.add('ias-inline-input');
  if (isMultiline) {
    input.rows = inHalf ? 4 : 8;
  } else {
    input.type = 'text';
  }
  input.value = _iasFieldValue(field, lang);

  const counterRow = el.nextElementSibling;
  const errorEl = counterRow?.classList.contains('ias-char-counter-row') ? counterRow.querySelector('.ias-char-error') : null;
  const countEl = counterRow?.classList.contains('ias-char-counter-row') ? counterRow.querySelector('.ias-char-count') : null;

  const updateCounter = () => {
    const remaining = limit - input.value.length;
    const isOver = remaining < 0;
    if (countEl) {
      countEl.textContent = String(remaining);
      countEl.classList.toggle('is-over', isOver);
    }
    if (errorEl) errorEl.textContent = isOver ? `Must be less than ${limit} characters.` : '';
    input.classList.toggle('is-over-limit', isOver);
  };

  const commit = () => {
    // Record this field's undo/redo history (locReviewUndo/locReviewRedo
    // below) — capture the value being REPLACED, before writing the new
    // one, and only when it actually changed (clicking into a field and
    // blurring without typing anything shouldn't burn an undo step).
    const previousValue = _iasFieldValue(field, lang);
    if (input.value !== previousValue) _locReviewPushUndo('real', field, lang, previousValue);
    _iasSetFieldValue(field, lang, input.value);
    // Editing the TOP half of a flipped Review-side card changes the
    // language's own real text, which makes the bottom half's cached
    // back-translation draft stale (it was generated from whatever the top
    // text used to be) — refresh it here rather than waiting for the next
    // toggleLocReviewMode/setLocReviewField sync, so the bottom half
    // immediately reflects the edit instead of showing a now-wrong draft
    // until something else happens to trigger a resync. Only applies in
    // the flipped half (inHalf) — the non-flipped card's own edits have no
    // visible bottom half to keep in sync, and are still picked up lazily
    // by _locReviewSyncBackTranslations the next time Review mode opens.
    if (inHalf) {
      const backEntry = _locReviewBackTranslationEntry(field, lang);
      if (backEntry.syncedTopText !== input.value) _locReviewRefreshBackTranslation(field, lang, input.value);
    }
    reRenderStepModal();
  };
  input.addEventListener('blur', commit);
  input.addEventListener('input', updateCounter);
  if (!isMultiline) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    });
  }

  el.replaceWith(input);
  updateCounter();
  input.focus();
  input.select();
}

/* ── Localization Review — single-string translation helper ─────────────
   Used by the flipped Review side's back-translation flow below: translate
   ONE piece of text from `sourceLang` into `targetLang`, in either
   direction. Unlike _iasTriggerAutoTranslate above (always Primary
   Language -> every supporting language at once, batched into one prompt),
   the Review side genuinely translates both ways on a single language
   pair at a time, so this always makes its own one-off call. Returns the
   translated string, or null if translation couldn't run at all (no API
   key) or the call failed — callers treat null as an error state, not as
   "translated to nothing" (that's what an empty source string returns:
   '', synchronously, no API call needed). */
async function _iasTranslateSingle(text, sourceLang, targetLang) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  if (!CLAUDE_API_KEY) return null;

  const sourceName = OB_LANG_NAMES[sourceLang] || sourceLang;
  const targetName = OB_LANG_NAMES[targetLang] || targetLang;

  const prompt = `Translate the following app store text for a mobile/video game from ${sourceName} into ${targetName}.

Source text:
"""
${trimmed}
"""

Return ONLY valid JSON — no markdown fences, no extra text:
  { "translation": "<translated text>" }

Rules:
- Preserve the tone, meaning, and any line breaks in the source text.
- Write a natural, idiomatic translation for a native speaker of ${targetName} — not literal word-for-word.`;

  try {
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key':                                 CLAUDE_API_KEY,
        'anthropic-version':                         '2023-06-01',
        'content-type':                              'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1200,
        messages:   [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    });
    if (!res.ok) throw new Error('API ' + res.status);
    const data    = await res.json();
    const resText = (data.content?.[0]?.text || '').trim();
    const cleaned = resText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed  = JSON.parse(cleaned);
    return typeof parsed.translation === 'string' ? parsed.translation : null;
  } catch (e) {
    console.warn('[Localization Review Translate]', sourceLang, '->', targetLang, e.message);
    return null;
  }
}

/* ── Localization Review's flipped "Review" side — per-card, two-way
   back-translation (toggleLocReviewMode below flips into it; buildLocalization
   ReviewSection, render.js renders it). Each SUPPORTING language's card (the
   Primary Language's own card never flips — nothing to review it against)
   splits into a top half (the language's own real text, exactly the same
   data and the same startLocReviewInlineEdit editing as the unflipped side)
   and a bottom half (a back-translation of that text INTO the Primary
   Language — a rough round-trip check, not itself real submission data).
   Editing the bottom half translates FORWARD again into the card's own
   language and writes the result into the real field via _iasSetFieldValue
   — the exact same storage the top half itself writes into — so either
   half can drive the other.

   state.locReviewBackTranslation[field][lang] = { text, syncedTopText, status, forwardStatus }
   - text:          the Primary-Language string currently shown/edited in
                     the bottom half.
   - syncedTopText: the top half's real field value (_iasFieldValue) that
                     `text` is already known to correspond to — set after
                     EITHER a fresh top -> primary back-translation, or a
                     bottom edit's forward translation lands back in the
                     real field. As long as they still match, nothing needs
                     regenerating; this is what lets toggling the Review
                     side or switching the field dropdown back and forth
                     skip redundant API calls for languages already in sync.
   - status:        null | 'loading' | 'error' — the TOP -> Primary
                     Language direction (_locReviewRefreshBackTranslation
                     below), shown at the top of the BOTTOM half. Set by a
                     direct top-half edit, or by the cascade after the
                     Primary Language's own batch translate
                     (_iasTriggerAutoTranslate) lands this language's new
                     top text.
   - forwardStatus: null | 'loading' | 'error' — the reverse direction, the
                     Primary Language draft -> this language
                     (_locReviewCommitPrimaryEdit below, fired by editing
                     the BOTTOM half), shown at the top of the TOP half.
                     Deliberately a SEPARATE flag from status — the two
                     directions can each be independently in flight and
                     must show their spinner on the correct half, never
                     the other's. */

// Read-only lookup for render.js — never creates an entry (render functions
// must not mutate state). A language/field with nothing cached yet reads as
// a blank, non-loading draft.
function _locReviewBackTranslationValue(field, lang) {
  const entry = state.locReviewBackTranslation
    && state.locReviewBackTranslation[field]
    && state.locReviewBackTranslation[field][lang];
  return entry || { text: '', syncedTopText: undefined, status: null, forwardStatus: null };
}

// Mutating accessor for app.js's own bookkeeping below — lazily creates the
// (field, lang) slot the first time it's touched.
function _locReviewBackTranslationEntry(field, lang) {
  if (!state.locReviewBackTranslation) state.locReviewBackTranslation = {};
  const forField = state.locReviewBackTranslation[field] || (state.locReviewBackTranslation[field] = {});
  return forField[lang] || (forField[lang] = { text: '', syncedTopText: undefined, status: null, forwardStatus: null });
}

// Regenerates the bottom half's back-translation for every supporting
// language, for whichever field is currently selected — called when the
// Review side is entered and whenever the field dropdown changes while
// already showing it. A language whose cached draft is already in sync
// with its current top text (syncedTopText matches) is left alone, so
// toggling back and forth doesn't re-fire translations that are still good.
// (A single language's top half being edited directly, mid-Review, is
// handled separately — startLocReviewInlineEdit's commit calls
// _locReviewRefreshBackTranslation for just that one (field, lang) itself,
// rather than re-running this whole-section sync for one changed card.)
// Returns a Promise (resolving once every triggered refresh has settled) so
// callers that care can await it — none of the real UI call sites do
// (toggleLocReviewMode/setLocReviewField below fire it and move on, same
// "kick off in the background" pattern as _iasTriggerAutoTranslate
// elsewhere), but it makes this deterministically testable.
function _locReviewSyncBackTranslations() {
  const fd = state.formData;
  const field = state.locReviewField || 'title';
  const supportedLangs = fd.localizations || [];

  const jobs = [];
  supportedLangs.forEach(lang => {
    const topText = _iasFieldValue(field, lang);
    const entry = _locReviewBackTranslationEntry(field, lang);
    if (entry.syncedTopText === topText) return; // already in sync, including both blank
    jobs.push(_locReviewRefreshBackTranslation(field, lang, topText));
  });
  return Promise.all(jobs);
}

async function _locReviewRefreshBackTranslation(field, lang, topText) {
  const entry = _locReviewBackTranslationEntry(field, lang);

  if (!topText.trim()) {
    entry.text = '';
    entry.syncedTopText = topText;
    entry.status = null;
    reRenderStepModal();
    return;
  }

  entry.status = 'loading';
  reRenderStepModal();

  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const translated = await _iasTranslateSingle(topText, lang, primary);

  // The language's real field may have changed again while this call was
  // in flight (a direct edit, or a fresh Primary Language auto-translate
  // landing) — re-check against the CURRENT top text, not the one this
  // call started with, and restart against it rather than overwrite with a
  // now-stale result.
  const currentTop = _iasFieldValue(field, lang);
  if (currentTop !== topText) { _locReviewRefreshBackTranslation(field, lang, currentTop); return; }

  const freshEntry = _locReviewBackTranslationEntry(field, lang);
  if (translated === null) {
    freshEntry.status = 'error';
  } else {
    freshEntry.text = translated;
    freshEntry.syncedTopText = topText;
    freshEntry.status = null;
  }
  reRenderStepModal();
}

// Commits an edit made directly in the Review side's BOTTOM half (the
// Primary Language draft) — translates it forward into the card's own
// language and writes the result into the REAL field (_iasSetFieldValue),
// the same storage the top half's own editing writes into. Like any other
// manual edit elsewhere in the App Store Product Page Preview, this has no
// lasting protection: the next time the actual Primary Language field
// changes, _iasTriggerAutoTranslate overwrites this language's field again
// like any other.
//
// Uses forwardStatus, NOT status, for its own loading/error state — status
// is reserved for the OTHER direction (_locReviewRefreshBackTranslation,
// top -> Primary Language), shown at the top of the BOTTOM half; this
// function's own translate call goes the opposite way (Primary Language ->
// this language) and must show its spinner at the top of the TOP half
// instead (buildLocalizationReviewSection, render.js) — sharing one flag
// between both directions would show the spinner on the wrong half
// whenever this path ran.
async function _locReviewCommitPrimaryEdit(field, lang, value) {
  const entry = _locReviewBackTranslationEntry(field, lang);
  entry.text = value;
  entry.syncedTopText = undefined; // not yet known to correspond to any top value
  entry.forwardStatus = value.trim() ? 'loading' : null;
  reRenderStepModal();

  if (!value.trim()) {
    _iasSetFieldValue(field, lang, '');
    entry.syncedTopText = '';
    reRenderStepModal();
    return;
  }

  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const translated = await _iasTranslateSingle(value, primary, lang);

  // If the bottom field was edited again while this call was in flight,
  // this (now-stale) result must not clobber the newer one.
  const currentEntry = _locReviewBackTranslationEntry(field, lang);
  if (currentEntry.text !== value) return;

  if (translated === null) {
    currentEntry.forwardStatus = 'error';
  } else {
    _iasSetFieldValue(field, lang, translated);
    currentEntry.syncedTopText = translated;
    currentEntry.forwardStatus = null;
  }
  reRenderStepModal();
}

/* Review side's BOTTOM-half click-to-edit — same swap-to-input mechanics as
   startLocReviewInlineEdit above, but editing the Primary Language
   back-translation DRAFT (state.locReviewBackTranslation) rather than a
   language's real field, and committing via _locReviewCommitPrimaryEdit's
   forward-translate-and-write flow instead of a plain _iasSetFieldValue.
   Always 4 rows for multiline fields — a bottom half only ever has half a
   card's vertical room.

   Deliberately has NO character-limit enforcement at all — no counter row
   (buildLocalizationReviewSection, render.js, never renders one for this
   half in the first place), no is-over-limit styling, no "Must be less
   than N characters." message. IAS_FIELD_CHAR_LIMITS is the App Store
   Connect limit for the language's own real field (the TOP half); this
   draft is just a Primary-Language scratch pad used to re-derive that real
   field via translation, not itself submitted anywhere, so a length limit
   on it wouldn't mean anything — the translated text that actually lands
   in the real field is whatever length the API returns, independent of
   how long this draft happens to be. */
function startLocReviewBackTranslationEdit(field, lang, el, ev) {
  if (ev) ev.stopPropagation();
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return; // already editing

  const isMultiline = field === 'description' || field === 'releaseNotes';
  const input = document.createElement(isMultiline ? 'textarea' : 'input');
  input.className = el.className.split(/\s+/).filter(c => c && c !== 'ias-placeholder' && c !== 'ias-editable').join(' ');
  input.classList.add('ias-inline-input');
  if (isMultiline) {
    input.rows = 4;
  } else {
    input.type = 'text';
  }
  input.value = _locReviewBackTranslationValue(field, lang).text;

  const commit = () => {
    // Same undo/redo bookkeeping as startLocReviewInlineEdit's commit
    // above, but against the DRAFT's own separate history — this is the
    // back-translation scratch pad, not the language's real field.
    const previousValue = _locReviewBackTranslationValue(field, lang).text;
    if (input.value !== previousValue) _locReviewPushUndo('draft', field, lang, previousValue);
    _locReviewCommitPrimaryEdit(field, lang, input.value);
  };
  input.addEventListener('blur', commit);
  if (!isMultiline) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    });
  }

  el.replaceWith(input);
  input.focus();
  input.select();
}

/* ── Localization Review — per-field undo/redo ───────────────────────────
   Two independent "kinds" of text field exist per card:
     'real'  — a language's own actual field value: state.formData[field]
               for the Primary Language, state.formData.localizedStoreText
               [lang][field] for a supporting language. This is what the
               non-flipped card shows/edits (startLocReviewInlineEdit
               above), and also what a flipped Review-side card's TOP half
               shows/edits — same underlying value either way.
     'draft' — a flipped Review-side card's BOTTOM half: the Primary-
               Language back-translation scratch pad
               (state.locReviewBackTranslation[field][lang].text, edited
               via startLocReviewBackTranslationEdit above) — a
               completely separate piece of text from 'real'.
   Each (kind, field, lang) triple gets its own independent stack, keyed
   under state.locReviewUndoHistory. History is pushed exactly once per
   completed edit (on blur, by startLocReviewInlineEdit/
   startLocReviewBackTranslationEdit's own commit closures above) — never
   by a cascading change from elsewhere (a Primary Language edit auto-
   translating into a supporting language, for instance) — so one "undo"
   here always corresponds to one direct edit made to that exact field,
   the same granularity any ordinary text editor's undo gives a field you
   just finished typing into and clicked away from. */

// Lazily creates and returns the { past, future } stack for one
// (kind, field, lang) triple.
function _locReviewUndoEntry(kind, field, lang) {
  if (!state.locReviewUndoHistory) state.locReviewUndoHistory = { real: {}, draft: {} };
  const forKind  = state.locReviewUndoHistory[kind] || (state.locReviewUndoHistory[kind] = {});
  const forField = forKind[field] || (forKind[field] = {});
  return forField[lang] || (forField[lang] = { past: [], future: [] });
}

// Read-only lookup for render.js (never creates an entry, never mutates
// state) — whether this exact field's undo/redo buttons should render
// enabled right now.
function _locReviewUndoState(kind, field, lang) {
  const entry = state.locReviewUndoHistory
    && state.locReviewUndoHistory[kind]
    && state.locReviewUndoHistory[kind][field]
    && state.locReviewUndoHistory[kind][field][lang];
  return { canUndo: !!(entry && entry.past.length), canRedo: !!(entry && entry.future.length) };
}

// Caps how many steps back a single field's undo stack keeps, so a very
// long editing session on one field can't grow this unboundedly.
const LOC_REVIEW_UNDO_LIMIT = 50;

// Called by startLocReviewInlineEdit/startLocReviewBackTranslationEdit's
// own commit closures, right before writing a genuinely NEW value —
// pushes the value being REPLACED onto that field's undo stack, and
// clears its redo stack: a fresh edit starts a new branch of history,
// same as any ordinary text editor (undo, then type something new, and
// the old "redo" branch is gone). Deliberately NOT called from anywhere
// else — see the comment above this section for why cascading changes
// from other fields must never push here.
function _locReviewPushUndo(kind, field, lang, previousValue) {
  const entry = _locReviewUndoEntry(kind, field, lang);
  entry.past.push(previousValue);
  if (entry.past.length > LOC_REVIEW_UNDO_LIMIT) entry.past.shift();
  entry.future = [];
}

// Writes a restored value back through the exact same commit path its
// field's normal editor uses — _iasSetFieldValue for 'real' (so Title
// mirroring/translation, Subtitle/Description/What's New auto-
// translation, and — when currently in Review mode, editing a supporting
// language — the back-translation refresh all fire exactly as they would
// for a matching manual edit) or _locReviewCommitPrimaryEdit for 'draft'.
// Neither path pushes a NEW undo entry of its own — only
// startLocReviewInlineEdit/startLocReviewBackTranslationEdit's commit
// closures do that (above) — so calling this from locReviewUndo/
// locReviewRedo below never contaminates the very history it's reading.
function _locReviewRestoreFieldValue(kind, field, lang, value) {
  if (kind === 'draft') {
    _locReviewCommitPrimaryEdit(field, lang, value);
    return;
  }
  _iasSetFieldValue(field, lang, value);
  const primary = state.formData.primaryLanguage || 'en';
  if (state.locReviewMode === 'review' && lang !== primary) {
    const backEntry = _locReviewBackTranslationEntry(field, lang);
    if (backEntry.syncedTopText !== value) _locReviewRefreshBackTranslation(field, lang, value);
  }
  reRenderStepModal();
}

// The undo button's onclick (buildLocalizationReviewSection, render.js).
function locReviewUndo(kind, field, lang, ev) {
  if (ev) ev.stopPropagation();
  const entry = _locReviewUndoEntry(kind, field, lang);
  if (!entry.past.length) return;
  const current  = kind === 'draft' ? _locReviewBackTranslationValue(field, lang).text : _iasFieldValue(field, lang);
  const previous = entry.past.pop();
  entry.future.push(current);
  _locReviewRestoreFieldValue(kind, field, lang, previous);
}

// The redo button's onclick (buildLocalizationReviewSection, render.js).
function locReviewRedo(kind, field, lang, ev) {
  if (ev) ev.stopPropagation();
  const entry = _locReviewUndoEntry(kind, field, lang);
  if (!entry.future.length) return;
  const current = kind === 'draft' ? _locReviewBackTranslationValue(field, lang).text : _iasFieldValue(field, lang);
  const next     = entry.future.pop();
  entry.past.push(current);
  _locReviewRestoreFieldValue(kind, field, lang, next);
}

/* Localization Review's "Review" / "All locs" toggle button
   (buildLocalizationReviewSection, render.js) — flips every SUPPORTING
   language's card (never the Primary Language's own card, identified by
   .loc-review-card--primary) to reveal the two-way review layout above,
   and relabels itself "All locs" so pressing it again flips back. Uses the
   same rotateY flip-exit/flip-enter timing (style.css) as the rest of the
   App Store Product Page Preview's own section-level flips
   (openStorePreviewSection above), just scoped to the individual cards
   rather than the whole modal — .loc-review-card's own is-flip-exit/
   is-flip-enter keyframes, not .submit-modal's. */
async function toggleLocReviewMode() {
  const exitingCards = Array.from(document.querySelectorAll('.loc-review-card:not(.loc-review-card--primary)'));
  exitingCards.forEach(c => c.classList.add('is-flip-exit'));
  await new Promise(r => setTimeout(r, 160));
  exitingCards.forEach(c => c.classList.remove('is-flip-exit'));

  state.locReviewMode = state.locReviewMode === 'review' ? 'locs' : 'review';
  reRenderStepModal();
  if (state.locReviewMode === 'review') _locReviewSyncBackTranslations();

  const enteringCards = Array.from(document.querySelectorAll('.loc-review-card:not(.loc-review-card--primary)'));
  enteringCards.forEach(c => c.classList.add('is-flip-enter'));
  await new Promise(r => setTimeout(r, 280));
  enteringCards.forEach(c => c.classList.remove('is-flip-enter'));
}

/* App Store Product Page Preview — Description "more"/"less" toggle.
   The full/short text is read from data-full/data-short attributes on the
   button (set from already-HTML-escaped strings, so the browser decodes
   them back to plain text — safe to assign via textContent, never
   innerHTML, since a Description can contain arbitrary user- or
   Steam-sourced text). The text lives in its own inner span
   (.ias-desc-text-inner), a sibling of the button rather than a shared
   parent, so swapping its content never removes the button itself from
   the DOM. Do NOT build this button's behavior via inline onclick JS that
   embeds the description text directly (e.g. JSON.stringify(...) inside a
   double-quoted onclick="..." attribute) — the description can itself
   contain double-quote characters, which prematurely terminates the
   attribute and corrupts the button's markup. */
function toggleIasDescMore(btn) {
  const inner = btn.previousElementSibling;
  if (!inner || !inner.classList.contains('ias-desc-text-inner')) return;
  const expand = btn.textContent.trim() === 'more';
  inner.textContent = expand ? btn.dataset.full : btn.dataset.short;
  btn.textContent = expand ? 'less' : 'more';
}

/* App Store Product Page Preview — top-right language dropdown (swSelect).
   Options are the Distribution section's Primary Language (always first)
   followed by its selected supported languages in alphabetical order,
   rebuilt fresh in buildStorePreviewSection() every render — this setter
   only needs to persist which one is currently chosen. */
function setIasPreviewLang(lang) {
  state.iasPreviewLang = lang;
  reRenderStepModal();
}

/* Localization Review's top-right field dropdown (swSelect) — options are
   the four store-listing fields in the same order they appear in the App
   Store Product Page Preview (Title, Subtitle, Description, What's New),
   rebuilt fresh in buildLocalizationReviewSection() every render; this
   setter only needs to persist which one is currently chosen across every
   language's card. */
function setLocReviewField(field) {
  state.locReviewField = field;
  reRenderStepModal();
  // Switching fields while the Review side is showing needs fresh
  // back-translations for the newly-selected field — each field has its
  // own independent cache (state.locReviewBackTranslation[field]).
  if (state.locReviewMode === 'review') _locReviewSyncBackTranslations();
}

/* ── Business — "IAP Localizations" ──────────────────────────────────────
   A full parallel of the App Store Product Page Preview's own Localization
   Review machinery directly above (_iasFieldValue/_iasSetFieldValue,
   _iasTriggerAutoTranslate, startLocReviewInlineEdit, the back-translation
   Review side, per-field undo/redo, toggleLocReviewMode/setLocReviewField),
   just scoped to ONE saved IAP product's Name/Description at a time instead
   of the app's own Title/Subtitle/Description/What's New — see
   buildIapLocalizationsSection, render.js, for the section this drives.

   Kept as its OWN function set (prefixed _iapLoc/iapLoc/toggleIapLoc)
   rather than generalizing the existing Localization Review functions to
   take an optional product id — same reasoning as roundIapPrice being its
   own function instead of parameterizing roundPrice (above): the App-level
   functions are hardcoded to state.formData/fd.localizedStoreText, and
   threading an "which scope" parameter through all of them (and every one
   of their own internal helper calls) would risk a state-selection bug
   silently mixing an IAP product's localizations into the app's own, or
   vice versa — a risk worth avoiding on an already-shipped, well-tested
   feature by keeping the two completely separate instead.

   Data model — mirrors state.formData.localizedStoreText exactly, just one
   level per product instead of a single global object: each IAP product
   (state.iosSubmitAnswers.iapProducts entries, see addIapProduct above) has
   its own p.locs = { [lang]: { name, desc, nameSourceText, descSourceText } }.
   The Primary Language's own value is never stored in p.locs at all — same
   as fd.localizedStoreText never storing the Primary Language — it's simply
   p.name/p.desc themselves (_iapLocFieldValue below). */

// Only SAVED (collapsed) IAP products are eligible for localization — see
// buildIapLocalizationsSection, render.js, for why (an in-progress card has
// no finished Name yet worth localizing).
function _iapLocSavedProducts() {
  return (state.iosSubmitAnswers.iapProducts || []).filter(p => p.collapsed);
}

// Which IAP product IAP Localizations' picker dropdown effectively shows —
// the same "fall back if the current choice is no longer valid" pattern as
// _iasEffectivePreviewLang above (state.iapLocIapId may point at a product
// that's since been removed, or simply hasn't been set yet). Returns null
// only when there are no saved products at all (buildIapLocalizationsSection
// hides the whole section in that case).
function _iapLocEffectiveIapId() {
  const saved = _iapLocSavedProducts();
  if (!saved.length) return null;
  if (saved.some(p => p.id === state.iapLocIapId)) return state.iapLocIapId;
  return saved[0].id;
}

function _iapLocBlankLocalizedText() {
  return { name: '', desc: '' };
}

// Read-only value lookup — mirrors _iasFieldValue exactly, substituting one
// IAP product's own p/p.locs for state.formData/fd.localizedStoreText.
function _iapLocFieldValue(iapId, field, lang) {
  const p = state.iosSubmitAnswers.iapProducts.find(pp => pp.id === iapId);
  if (!p) return '';
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  if (lang === primary) return p[field] || '';
  const entry = p.locs && p.locs[lang];
  return (entry && entry[field]) || '';
}

// Whether ANY of a product's two localizable fields (Name, Description)
// currently exceeds its character limit for a given language — the IAP
// analog of _iasLangHasOverLimitField. Not currently surfaced anywhere in
// the UI (IAP Localizations has no per-language dropdown to warn on the way
// the main preview's language dropdown does), kept for parity/future use
// alongside _iapLocFieldHasOverLimitLang below, which IS used (the field
// dropdown's own warning icon).
function _iapLocLangHasOverLimitField(iapId, lang) {
  return ['name', 'desc'].some(field =>
    _iapLocFieldValue(iapId, field, lang).length > IAP_PRODUCT_FIELD_LIMITS[field]);
}

// The transpose of the above: whether ANY language (across every language
// IAP Localizations covers) has THIS ONE field over its character limit for
// the given product — mirrors _iasFieldHasOverLimitLang, drives the warning
// icon next to Name/Description in IAP Localizations' field dropdown.
function _iapLocFieldHasOverLimitLang(iapId, field, langCodes) {
  const limit = IAP_PRODUCT_FIELD_LIMITS[field];
  return langCodes.some(lang => _iapLocFieldValue(iapId, field, lang).length > limit);
}

// Mirrors _locReviewSourceBadge, minus the 'steam' case entirely (an IAP
// product has no Steam-sourced text — only ever manually typed or
// AI-translated).
function _iapLocSourceBadge(iapId, field, lang) {
  const p = state.iosSubmitAnswers.iapProducts.find(pp => pp.id === iapId);
  if (!p) return null;
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  if (lang === primary) return null;
  if (!_iapLocFieldValue(iapId, field, lang)) return null;
  const entry = p.locs && p.locs[lang];
  if (!entry) return null;
  if (_iapLocFieldAutoTranslateEnabled(field) && entry[field + 'SourceText'] === (p[field] || '')) return 'ai';
  return null;
}

// Mutating setter — mirrors _iasSetFieldValue exactly. Editing the Primary
// Language's own card writes straight into p.name/p.desc (the SAME value
// the IAP Products list's own card shows/edits, render.js) and re-propagates
// to supporting languages; editing a supporting language's card writes only
// into that language's own p.locs entry.
function _iapLocSetFieldValue(iapId, field, lang, value) {
  const p = state.iosSubmitAnswers.iapProducts.find(pp => pp.id === iapId);
  if (!p) return;
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  if (lang === primary) {
    p[field] = value;
    if (field === 'name') _iapLocPropagateName(iapId, value);
    else if (_iapLocFieldAutoTranslateEnabled(field)) _iapLocTriggerAutoTranslate(iapId, field, value);
    return;
  }
  if (!p.locs) p.locs = {};
  if (!p.locs[lang]) p.locs[lang] = _iapLocBlankLocalizedText();
  p.locs[lang][field] = value;
}

// Copies a product's Primary Language Name verbatim into every supporting
// language, UNLESS Name is turned on as an auto-translated field (gear icon
// beside "IAP Localizations") — mirrors _iasPropagateTitle exactly (Name
// plays the same role here that Title plays for the app's own fields: a
// short identifying field that's mirrored by default, translatable if
// turned on). Always overwrites, including any earlier manual edit for that
// language — same as Title.
function _iapLocPropagateName(iapId, primaryValue) {
  if (_iapLocFieldAutoTranslateEnabled('name')) { _iapLocTriggerAutoTranslate(iapId, 'name', primaryValue); return; }
  const p = state.iosSubmitAnswers.iapProducts.find(pp => pp.id === iapId);
  if (!p) return;
  const fd = state.formData;
  const supportedLangs = fd.localizations || [];
  if (!supportedLangs.length) return;
  if (!p.locs) p.locs = {};
  supportedLangs.forEach(lang => {
    if (!p.locs[lang]) p.locs[lang] = _iapLocBlankLocalizedText();
    p.locs[lang].name = primaryValue || '';
  });
}

// Which of Name/Description currently auto-translates from the Primary
// Language into supporting languages — mirrors _iasFieldAutoTranslateEnabled.
// Both default on (see state.iapLocAutoTranslateFields, state.js, for why
// this diverges from Title/Description's own defaults). This fallback only
// matters for state saved before iapLocAutoTranslateFields existed —
// otherwise state.js's own default already wins below.
const IAP_LOC_TRANSLATABLE_FIELDS = ['name', 'desc'];
function _iapLocFieldAutoTranslateEnabled(field) {
  const cfg = state.iapLocAutoTranslateFields;
  if (!cfg) return IAP_LOC_TRANSLATABLE_FIELDS.includes(field);
  return !!cfg[field];
}

const IAP_LOC_FIELD_LABELS = { name: 'display name', desc: 'description' };

// Batch auto-translate one product's field from its Primary Language value
// into every supporting language — mirrors _iasTriggerAutoTranslate exactly,
// substituting p/p.locs for fd/fd.localizedStoreText and caching each
// language's source text the same way (`${field}SourceText`).
async function _iapLocTriggerAutoTranslate(iapId, field, primaryValue) {
  if (!_iapLocFieldAutoTranslateEnabled(field)) return;
  const p = state.iosSubmitAnswers.iapProducts.find(pp => pp.id === iapId);
  if (!p) return;
  const fd = state.formData;
  const supportedLangs = fd.localizations || [];
  if (!supportedLangs.length) return;

  const text      = (primaryValue || '').trim();
  const sourceKey = field + 'SourceText';

  if (!p.locs) p.locs = {};
  const eligible = supportedLangs.filter(lang => {
    const entry = p.locs[lang];
    const cachedSource = entry ? entry[sourceKey] : undefined;
    return cachedSource !== text;
  });
  if (!eligible.length) return;

  // Nothing to translate — clear any stale cached translations instead of
  // calling out to the API for blanks, same as _iasTriggerAutoTranslate.
  if (!text) {
    eligible.forEach(lang => {
      if (!p.locs[lang]) p.locs[lang] = _iapLocBlankLocalizedText();
      p.locs[lang][field]     = '';
      p.locs[lang][sourceKey] = '';
      const backEntry = _iapLocBackTranslationEntry(iapId, field, lang);
      if (backEntry.syncedTopText !== '') _iapLocRefreshBackTranslation(iapId, field, lang, '');
    });
    reRenderStepModal();
    return;
  }

  if (!CLAUDE_API_KEY) return;

  state.iapLocTranslateStatus = state.iapLocTranslateStatus || {};
  state.iapLocTranslateStatus[iapId] = state.iapLocTranslateStatus[iapId] || {};
  state.iapLocTranslateStatus[iapId][field] = 'loading';
  state.iapLocTranslatePendingLangs = state.iapLocTranslatePendingLangs || {};
  state.iapLocTranslatePendingLangs[iapId] = state.iapLocTranslatePendingLangs[iapId] || {};
  state.iapLocTranslatePendingLangs[iapId][field] = eligible.slice();
  reRenderStepModal();

  const langList      = eligible.map(l => `${l}: ${OB_LANG_NAMES[l] || l}`).join('\n');
  const fieldLabel    = IAP_LOC_FIELD_LABELS[field] || field;
  // Name/Description are short fields (35/55-char App Store Connect limits)
  // — far smaller per-language token budgets than the App-level fields'
  // (up to 1200 for Description there).
  const perLangBudget = field === 'name' ? 80 : 200;
  const maxTokens      = Math.min(8192, 300 + eligible.length * perLangBudget);

  const prompt = `Translate the following in-app purchase ${fieldLabel} text for a mobile/video game into each of the listed languages.

Source text:
"""
${text}
"""

Target languages (ISO code: language name):
${langList}

Return ONLY valid JSON — no markdown fences, no extra text:
  {
    "translations": { "<language code>": "<translated text>", ... }
  }

Rules:
- Preserve the tone and meaning of the source text.
- Write natural, idiomatic translations for a native speaker of each target language — not literal word-for-word.
- Include every requested language code as a key.`;

  try {
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key':                                 CLAUDE_API_KEY,
        'anthropic-version':                         '2023-06-01',
        'content-type':                              'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages:   [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    });

    if (!res.ok) throw new Error('API ' + res.status);
    const data    = await res.json();
    const resText = (data.content?.[0]?.text || '').trim();
    const cleaned = resText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed  = JSON.parse(cleaned);
    const results = parsed.translations || {};

    eligible.forEach(lang => {
      const translated = results[lang];
      if (typeof translated !== 'string' || !translated.trim()) return;
      if (!p.locs[lang]) p.locs[lang] = _iapLocBlankLocalizedText();
      const entry = p.locs[lang];
      entry[field]     = translated;
      entry[sourceKey] = text;
      const backEntry = _iapLocBackTranslationEntry(iapId, field, lang);
      if (backEntry.syncedTopText !== translated) _iapLocRefreshBackTranslation(iapId, field, lang, translated);
    });

    state.iapLocTranslateStatus[iapId][field] = 'complete';
  } catch (e) {
    console.warn('[IAP Localizations Translate]', iapId, field, e.message);
    state.iapLocTranslateStatus[iapId][field] = 'error';
  }
  state.iapLocTranslatePendingLangs[iapId][field] = [];
  reRenderStepModal();
}

// Read-only lookup for render.js — mirrors _iasFieldTranslatePending.
function _iapLocFieldTranslatePending(iapId, field, lang) {
  if (!state.iapLocTranslateStatus || !state.iapLocTranslateStatus[iapId] || state.iapLocTranslateStatus[iapId][field] !== 'loading') return false;
  const pending = state.iapLocTranslatePendingLangs && state.iapLocTranslatePendingLangs[iapId] && state.iapLocTranslatePendingLangs[iapId][field];
  return !!(pending && pending.includes(lang));
}

// Flips Name or Description's entry in "Automatically translated fields"
// (gear icon beside "IAP Localizations") — mirrors _iasToggleAutoTranslateField,
// but since this setting is global (one gear menu covers every IAP product,
// not just whichever one the picker dropdown currently shows), turning a
// field ON retroactively brings EVERY saved product's supporting languages
// up to date for that field, not just the currently-viewed product.
function _iapLocToggleAutoTranslateField(field) {
  state.iapLocAutoTranslateFields = state.iapLocAutoTranslateFields || {};
  state.iapLocAutoTranslateFields[field] = !state.iapLocAutoTranslateFields[field];
  if (state.iapLocAutoTranslateFields[field]) {
    _iapLocSavedProducts().forEach(p => {
      if (field === 'name') _iapLocPropagateName(p.id, p.name || '');
      else _iapLocTriggerAutoTranslate(p.id, field, p.desc || '');
    });
  }
  reRenderStepModal();
}

/* IAP Localizations' per-card click-to-edit — mirrors startLocReviewInlineEdit,
   minus the multiline branching entirely: Name (35 chars) and Description
   (55 chars) are both short enough to stay plain <input> fields, exactly
   like the IAP Products list's own Name/Description fields
   (_iapCounterField, render.js) — never a <textarea>, unlike the App-level
   Description/What's New (up to 4,000 characters). */
function startIapLocInlineEdit(iapId, field, lang, el, ev) {
  if (ev) ev.stopPropagation();
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return; // already editing

  const inHalf = !!(el.closest && el.closest('.iap-loc-half'));
  const limit = IAP_PRODUCT_FIELD_LIMITS[field];
  const input = document.createElement('input');
  input.type = 'text';
  input.className = el.className.split(/\s+/).filter(c => c && c !== 'ias-placeholder' && c !== 'ias-editable').join(' ');
  input.classList.add('ias-inline-input');
  input.value = _iapLocFieldValue(iapId, field, lang);

  const counterRow = el.nextElementSibling;
  const errorEl = counterRow?.classList.contains('ias-char-counter-row') ? counterRow.querySelector('.ias-char-error') : null;
  const countEl = counterRow?.classList.contains('ias-char-counter-row') ? counterRow.querySelector('.ias-char-count') : null;

  const updateCounter = () => {
    const remaining = limit - input.value.length;
    const isOver = remaining < 0;
    if (countEl) {
      countEl.textContent = String(remaining);
      countEl.classList.toggle('is-over', isOver);
    }
    if (errorEl) errorEl.textContent = isOver ? `Must be less than ${limit} characters.` : '';
    input.classList.toggle('is-over-limit', isOver);
  };

  const commit = () => {
    const previousValue = _iapLocFieldValue(iapId, field, lang);
    if (input.value !== previousValue) _iapLocPushUndo('real', iapId, field, lang, previousValue);
    _iapLocSetFieldValue(iapId, field, lang, input.value);
    if (inHalf) {
      const backEntry = _iapLocBackTranslationEntry(iapId, field, lang);
      if (backEntry.syncedTopText !== input.value) _iapLocRefreshBackTranslation(iapId, field, lang, input.value);
    }
    reRenderStepModal();
  };
  input.addEventListener('blur', commit);
  input.addEventListener('input', updateCounter);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
  });

  el.replaceWith(input);
  updateCounter();
  input.focus();
  input.select();
}

/* IAP Localizations' flipped Review side, back-translation bookkeeping —
   mirrors _locReviewBackTranslationValue/_locReviewBackTranslationEntry/
   _locReviewSyncBackTranslations/_locReviewRefreshBackTranslation/
   _locReviewCommitPrimaryEdit exactly, keyed one level deeper by iapId:
   state.iapLocBackTranslation[iapId][field][lang] = { text, syncedTopText,
   status, forwardStatus }. Reuses _iasTranslateSingle as-is (already a
   generic one-string, one-language-pair-at-a-time translator with no
   App-specific coupling). */

function _iapLocBackTranslationValue(iapId, field, lang) {
  const entry = state.iapLocBackTranslation
    && state.iapLocBackTranslation[iapId]
    && state.iapLocBackTranslation[iapId][field]
    && state.iapLocBackTranslation[iapId][field][lang];
  return entry || { text: '', syncedTopText: undefined, status: null, forwardStatus: null };
}

function _iapLocBackTranslationEntry(iapId, field, lang) {
  if (!state.iapLocBackTranslation) state.iapLocBackTranslation = {};
  const forIap   = state.iapLocBackTranslation[iapId] || (state.iapLocBackTranslation[iapId] = {});
  const forField = forIap[field] || (forIap[field] = {});
  return forField[lang] || (forField[lang] = { text: '', syncedTopText: undefined, status: null, forwardStatus: null });
}

function _iapLocSyncBackTranslations(iapId) {
  if (!iapId) return Promise.resolve();
  const fd = state.formData;
  const field = state.iapLocField || 'name';
  const supportedLangs = fd.localizations || [];

  const jobs = [];
  supportedLangs.forEach(lang => {
    const topText = _iapLocFieldValue(iapId, field, lang);
    const entry = _iapLocBackTranslationEntry(iapId, field, lang);
    if (entry.syncedTopText === topText) return;
    jobs.push(_iapLocRefreshBackTranslation(iapId, field, lang, topText));
  });
  return Promise.all(jobs);
}

async function _iapLocRefreshBackTranslation(iapId, field, lang, topText) {
  const entry = _iapLocBackTranslationEntry(iapId, field, lang);

  if (!topText.trim()) {
    entry.text = '';
    entry.syncedTopText = topText;
    entry.status = null;
    reRenderStepModal();
    return;
  }

  entry.status = 'loading';
  reRenderStepModal();

  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const translated = await _iasTranslateSingle(topText, lang, primary);

  const currentTop = _iapLocFieldValue(iapId, field, lang);
  if (currentTop !== topText) { _iapLocRefreshBackTranslation(iapId, field, lang, currentTop); return; }

  const freshEntry = _iapLocBackTranslationEntry(iapId, field, lang);
  if (translated === null) {
    freshEntry.status = 'error';
  } else {
    freshEntry.text = translated;
    freshEntry.syncedTopText = topText;
    freshEntry.status = null;
  }
  reRenderStepModal();
}

async function _iapLocCommitPrimaryEdit(iapId, field, lang, value) {
  const entry = _iapLocBackTranslationEntry(iapId, field, lang);
  entry.text = value;
  entry.syncedTopText = undefined;
  entry.forwardStatus = value.trim() ? 'loading' : null;
  reRenderStepModal();

  if (!value.trim()) {
    _iapLocSetFieldValue(iapId, field, lang, '');
    entry.syncedTopText = '';
    reRenderStepModal();
    return;
  }

  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const translated = await _iasTranslateSingle(value, primary, lang);

  const currentEntry = _iapLocBackTranslationEntry(iapId, field, lang);
  if (currentEntry.text !== value) return;

  if (translated === null) {
    currentEntry.forwardStatus = 'error';
  } else {
    _iapLocSetFieldValue(iapId, field, lang, translated);
    currentEntry.syncedTopText = translated;
    currentEntry.forwardStatus = null;
  }
  reRenderStepModal();
}

/* Review side's BOTTOM-half click-to-edit — mirrors startLocReviewBackTranslationEdit,
   always a plain <input> (same reasoning as startIapLocInlineEdit above: an
   IAP product's fields are always short). Deliberately no character-limit
   enforcement at all, same as the App-level version's own bottom half — a
   scratch pad, not real submission data. */
function startIapLocBackTranslationEdit(iapId, field, lang, el, ev) {
  if (ev) ev.stopPropagation();
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return; // already editing

  const input = document.createElement('input');
  input.type = 'text';
  input.className = el.className.split(/\s+/).filter(c => c && c !== 'ias-placeholder' && c !== 'ias-editable').join(' ');
  input.classList.add('ias-inline-input');
  input.value = _iapLocBackTranslationValue(iapId, field, lang).text;

  const commit = () => {
    const previousValue = _iapLocBackTranslationValue(iapId, field, lang).text;
    if (input.value !== previousValue) _iapLocPushUndo('draft', iapId, field, lang, previousValue);
    _iapLocCommitPrimaryEdit(iapId, field, lang, input.value);
  };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
  });

  el.replaceWith(input);
  input.focus();
  input.select();
}

/* IAP Localizations — per-field undo/redo. Mirrors _locReviewUndoEntry/
   _locReviewUndoState/_locReviewPushUndo/_locReviewRestoreFieldValue/
   locReviewUndo/locReviewRedo exactly, keyed one level deeper by iapId:
   state.iapLocUndoHistory[kind][iapId][field][lang] = { past, future }. */

function _iapLocUndoEntry(kind, iapId, field, lang) {
  if (!state.iapLocUndoHistory) state.iapLocUndoHistory = { real: {}, draft: {} };
  const forKind  = state.iapLocUndoHistory[kind] || (state.iapLocUndoHistory[kind] = {});
  const forIap   = forKind[iapId] || (forKind[iapId] = {});
  const forField = forIap[field] || (forIap[field] = {});
  return forField[lang] || (forField[lang] = { past: [], future: [] });
}

function _iapLocUndoState(kind, iapId, field, lang) {
  const entry = state.iapLocUndoHistory
    && state.iapLocUndoHistory[kind]
    && state.iapLocUndoHistory[kind][iapId]
    && state.iapLocUndoHistory[kind][iapId][field]
    && state.iapLocUndoHistory[kind][iapId][field][lang];
  return { canUndo: !!(entry && entry.past.length), canRedo: !!(entry && entry.future.length) };
}

const IAP_LOC_UNDO_LIMIT = 50;

function _iapLocPushUndo(kind, iapId, field, lang, previousValue) {
  const entry = _iapLocUndoEntry(kind, iapId, field, lang);
  entry.past.push(previousValue);
  if (entry.past.length > IAP_LOC_UNDO_LIMIT) entry.past.shift();
  entry.future = [];
}

function _iapLocRestoreFieldValue(kind, iapId, field, lang, value) {
  if (kind === 'draft') {
    _iapLocCommitPrimaryEdit(iapId, field, lang, value);
    return;
  }
  _iapLocSetFieldValue(iapId, field, lang, value);
  const primary = state.formData.primaryLanguage || 'en';
  if (state.iapLocMode === 'review' && lang !== primary) {
    const backEntry = _iapLocBackTranslationEntry(iapId, field, lang);
    if (backEntry.syncedTopText !== value) _iapLocRefreshBackTranslation(iapId, field, lang, value);
  }
  reRenderStepModal();
}

function iapLocUndo(kind, iapId, field, lang, ev) {
  if (ev) ev.stopPropagation();
  const entry = _iapLocUndoEntry(kind, iapId, field, lang);
  if (!entry.past.length) return;
  const current  = kind === 'draft' ? _iapLocBackTranslationValue(iapId, field, lang).text : _iapLocFieldValue(iapId, field, lang);
  const previous = entry.past.pop();
  entry.future.push(current);
  _iapLocRestoreFieldValue(kind, iapId, field, lang, previous);
}

function iapLocRedo(kind, iapId, field, lang, ev) {
  if (ev) ev.stopPropagation();
  const entry = _iapLocUndoEntry(kind, iapId, field, lang);
  if (!entry.future.length) return;
  const current = kind === 'draft' ? _iapLocBackTranslationValue(iapId, field, lang).text : _iapLocFieldValue(iapId, field, lang);
  const next     = entry.future.pop();
  entry.past.push(current);
  _iapLocRestoreFieldValue(kind, iapId, field, lang, next);
}

/* IAP Localizations' "Review" / "All locs" toggle button — mirrors
   toggleLocReviewMode exactly, scoped to .iap-loc-card (style.css) instead
   of .loc-review-card so the two sections' flip animations can never
   accidentally target each other's cards (they can, in principle, both
   exist in the DOM at once — Business Questions and the Store Preview are
   different steps of the same submit flow, but nothing prevents a future
   layout change from showing both at once, so this is real belt-and-
   suspenders, not just tidiness). */
async function toggleIapLocReviewMode() {
  const exitingCards = Array.from(document.querySelectorAll('.iap-loc-card:not(.iap-loc-card--primary)'));
  exitingCards.forEach(c => c.classList.add('is-flip-exit'));
  await new Promise(r => setTimeout(r, 160));
  exitingCards.forEach(c => c.classList.remove('is-flip-exit'));

  state.iapLocMode = state.iapLocMode === 'review' ? 'locs' : 'review';
  reRenderStepModal();
  if (state.iapLocMode === 'review') _iapLocSyncBackTranslations(_iapLocEffectiveIapId());

  const enteringCards = Array.from(document.querySelectorAll('.iap-loc-card:not(.iap-loc-card--primary)'));
  enteringCards.forEach(c => c.classList.add('is-flip-enter'));
  await new Promise(r => setTimeout(r, 280));
  enteringCards.forEach(c => c.classList.remove('is-flip-enter'));
}

/* IAP Localizations' IAP picker dropdown (swSelect) — between the Review
   button and the field dropdown. Options are every currently SAVED IAP
   product (_iapLocSavedProducts, rebuilt fresh in
   buildIapLocalizationsSection() every render); this setter only needs to
   persist which one is currently chosen. */
function setIapLocReviewIapId(iapId) {
  state.iapLocIapId = iapId;
  reRenderStepModal();
  if (state.iapLocMode === 'review') _iapLocSyncBackTranslations(iapId);
}

/* IAP Localizations' field dropdown (swSelect) — mirrors setLocReviewField,
   options are Name/Description (IAP_LOC_FIELDS, render.js). */
function setIapLocField(field) {
  state.iapLocField = field;
  reRenderStepModal();
  if (state.iapLocMode === 'review') _iapLocSyncBackTranslations(_iapLocEffectiveIapId());
}

/* Accept the Shipmate-suggested fix for the current item */
function applyStorePageFix() {
  if (!state.improveSubmissionIdx) state.improveSubmissionIdx = { storePage: 0 };
  const items = _getCurrentMergedStoreItems();
  const i   = state.improveSubmissionIdx.storePage || 0;
  const cur = items[i];
  if (!cur?.fixedValue || cur.type !== 'sp') return;
  _applyFieldValue(cur.field, cur.fixedValue);
  // After accepting, filter removes this item so index doesn't need to advance
  state.improveSubmissionIdx.storePage = 0;
  renderStepModal();
}

/* Accept a user-edited value for the current item */
function acceptEditedFix() {
  const textarea = document.getElementById('iys-edit-textarea');
  if (!textarea) return;
  const items = _getCurrentMergedStoreItems();
  const i   = (state.improveSubmissionIdx?.storePage) || 0;
  const cur = items[i];
  if (!cur?.field) return;
  _applyFieldValue(cur.field, textarea.value.trim());
  if (!state.improveSubmissionIdx) state.improveSubmissionIdx = { storePage: 0 };
  state.improveSubmissionIdx.storePage = 0;
  renderStepModal();
}

/* Dismiss the current item WITHOUT applying or improving the grade.
   Uses the item's title+field identity as the key so index shifts don't break it. */
function keepExistingFix() {
  if (!state.dismissedFixes) state.dismissedFixes = new Set();
  const items = _getCurrentMergedStoreItems();
  if (items.length > 0) {
    const cur = items[0];
    state.dismissedFixes.add(cur.title + '||' + (cur.field || ''));
  }
  if (!state.improveSubmissionIdx) state.improveSubmissionIdx = { storePage: 0 };
  state.improveSubmissionIdx.storePage = 0;
  renderStepModal();
}

/* Called when user edits the suggestion textarea — changes button label */
function _onFixEdit(textarea) {
  const btn = document.getElementById('iys-accept-btn');
  if (!btn) return;
  const items = _getCurrentMergedStoreItems();
  const i   = (state.improveSubmissionIdx?.storePage) || 0;
  const cur = items[i];
  const original = cur?.fixedValue || '';
  if (textarea.value.trim() !== original.trim()) {
    btn.textContent = 'Accept New';
    btn.setAttribute('onclick', 'acceptEditedFix()');
  } else {
    btn.textContent = 'Accept Shipmate Fix';
    btn.setAttribute('onclick', 'applyStorePageFix()');
  }
}

/* Advance to next item without applying a fix (legacy — kept for compatibility) */
function _nextImprovementItem(section) {
  if (!state.improveSubmissionIdx) state.improveSubmissionIdx = { storePage: 0 };
  if (section === 'storePage') {
    state.improveSubmissionIdx.storePage = (state.improveSubmissionIdx.storePage || 0) + 1;
  }
  renderStepModal();
}

function _screenshotSrc(s) {
  if (s.dataUrl) return s.dataUrl;
  if (!s.url) return '';
  // IGDB CDN images: route through wsrv.nl (images.weserv.nl) which is a dedicated
  // image proxy/CDN that handles hotlink-protected sources reliably.
  // Strip protocol so wsrv.nl can handle both http and https origins.
  if (s.url.includes('images.igdb.com')) {
    const clean = s.url.replace(/^https?:\/\//, '');
    return 'https://wsrv.nl/?url=' + encodeURIComponent(clean) + '&output=jpg';
  }
  return s.url;
}

/* ══════════════════════════════════════════════════════
   SCREENSHOT CROP PREVIEW — inline drag-and-drop editor
   ══════════════════════════════════════════════════════ */

// Persists across renderStepModal() calls (not in state — UI-only ephemeral)
var _shotCropState = {}; // { [pid]: { shotId, src, name, aspect } }

function shotDragStart(event, pid, shotId) {
  event.dataTransfer.setData('text/plain', JSON.stringify({ pid, shotId }));
  event.dataTransfer.effectAllowed = 'copy';
}

function shotDragOver(event, pid) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  const zone = document.getElementById('shot-edit-zone-' + pid);
  if (zone) zone.classList.add('dragover');
}

function shotDragLeave(event, pid) {
  // Only remove class if leaving the zone itself (not a child element)
  if (!event.currentTarget.contains(event.relatedTarget)) {
    const zone = document.getElementById('shot-edit-zone-' + pid);
    if (zone) zone.classList.remove('dragover');
  }
}

function shotDrop(event, pid) {
  event.preventDefault();
  const zone = document.getElementById('shot-edit-zone-' + pid);
  if (zone) zone.classList.remove('dragover');

  let data;
  try { data = JSON.parse(event.dataTransfer.getData('text/plain')); } catch (e) { return; }
  if (!data || data.pid !== pid) return;

  const shots = state.uploads?.screenshots || [];
  const shot  = shots.find(s => s.id === data.shotId);
  if (!shot) return;

  const prevShotId = _shotCropState[pid]?.shotId;
  if (!_shotCropState[pid]) _shotCropState[pid] = {};
  _shotCropState[pid].shotId = data.shotId;
  _shotCropState[pid].src    = _screenshotSrc(shot);
  _shotCropState[pid].name   = shot.name;
  // Reset aspect and pan position whenever a different shot is dropped
  if (prevShotId !== data.shotId) {
    _shotCropState[pid].aspect = 'auto';
    _shotCropState[pid].panX   = 0;
    _shotCropState[pid].panY   = 0;
  }
  _renderShotEditZone(pid);
}

function shotEditClose(pid) {
  if (_shotCropState[pid]) _shotCropState[pid].shotId = null;
  _renderShotEditZone(pid);
}

function setShotAspect(pid, aspect) {
  if (!_shotCropState[pid]) _shotCropState[pid] = {};
  _shotCropState[pid].aspect = aspect;
  _renderShotEditZone(pid);
}

/* ── Screenshot image pan/drag ── */
var _shotPanActive = null; // { pid, startX, startY, origPanX, origPanY }

function shotPanStart(event, pid) {
  if (event.button !== 0) return; // left-click only
  const cs = _shotCropState[pid];
  if (!cs?.shotId) return;
  event.preventDefault();
  _shotPanActive = {
    pid,
    startX: event.clientX, startY: event.clientY,
    origPanX: cs.panX || 0, origPanY: cs.panY || 0,
  };
  const wrap = document.getElementById('shot-edit-wrap-' + pid);
  if (wrap) wrap.style.cursor = 'grabbing';
  document.addEventListener('mousemove', _onShotPanMove, { passive: false });
  document.addEventListener('mouseup',   _onShotPanEnd);
}

function _onShotPanMove(event) {
  if (!_shotPanActive) return;
  const { pid, startX, startY, origPanX, origPanY } = _shotPanActive;
  const cs = _shotCropState[pid];
  if (!cs) return;
  cs.panX = origPanX + (event.clientX - startX);
  cs.panY = origPanY + (event.clientY - startY);
  // Update transform directly — no full re-render needed for smooth dragging
  const img = document.getElementById('shot-edit-img-' + pid);
  if (img) img.style.transform = `translate(${cs.panX}px,${cs.panY}px)`;
}

function _onShotPanEnd() {
  if (!_shotPanActive) return;
  const { pid } = _shotPanActive;
  _shotPanActive = null;
  document.removeEventListener('mousemove', _onShotPanMove);
  document.removeEventListener('mouseup',   _onShotPanEnd);
  const wrap = document.getElementById('shot-edit-wrap-' + pid);
  if (wrap) wrap.style.cursor = 'grab';
}

function _renderShotEditZone(pid) {
  const zone = document.getElementById('shot-edit-zone-' + pid);
  if (!zone) return;
  zone.innerHTML = _buildShotEditZoneHtml(pid);
  // rAF ensures the crop frame updates even when the image is cached and onload doesn't re-fire
  requestAnimationFrame(() => _updateShotCropFrame(pid));
}

// Portrait width/height ratios for iOS App Store devices
const IOS_DEVICE_PORTRAIT_RATIOS = {
  '6.7" iPhone': 1290 / 2796,   // ≈ 0.4613
  '5.5" iPhone': 9 / 16,         // = 0.5625
  'iPad 13"':    2064 / 2752,    // ≈ 0.75
};

// Called by img onload to position the crop frame overlay
function _updateShotCropFrame(pid) {
  const cs = _shotCropState[pid];
  if (!cs || !cs.aspect) return;

  const img   = document.getElementById('shot-edit-img-' + pid);
  const frame = document.getElementById('shot-crop-frame-' + pid);
  if (!img || !frame) return;

  // Auto-detect: default to 6.7" iPhone (handled in render for button UI)
  if (cs.aspect === 'auto') {
    cs.aspect = '6.7" iPhone';
    _renderShotEditZone(pid);
    return;
  }

  if (cs.aspect === 'original') { frame.style.display = 'none'; return; }

  // Device-specific portrait ratio — auto-flip for landscape images
  const portraitRatio = IOS_DEVICE_PORTRAIT_RATIOS[cs.aspect];
  const arMap = { '9:16': 9/16, '16:9': 16/9, '1:1': 1 };
  if (portraitRatio) {
    const isLandscape = img.naturalWidth > img.naturalHeight;
    ar = isLandscape ? (1 / portraitRatio) : portraitRatio;
  } else {
    ar = arMap[cs.aspect];
  }
  if (!ar) { frame.style.display = 'none'; return; }

  const dw = img.offsetWidth;
  const dh = img.offsetHeight;
  if (!dw || !dh) return;

  let fw, fh;
  if (ar < dw / dh) {
    // Frame is portrait-ish relative to displayed image — constrain by height
    fh = dh;
    fw = fh * ar;
  } else {
    fw = dw;
    fh = fw / ar;
  }

  frame.style.display = 'block';
  frame.style.width   = Math.round(fw) + 'px';
  frame.style.height  = Math.round(fh) + 'px';
  frame.style.left    = Math.round((dw - fw) / 2) + 'px';
  frame.style.top     = Math.round((dh - fh) / 2) + 'px';
}

// Re-render target for the Assets tab's screenshot grid after an add/remove
// (see removeScreenshot below) — kept markup-identical to
// renderOnboardingScreenshotGrid in render.js (same openScreenshotLightbox
// click-to-enlarge, same stopPropagation on Remove) since both draw the same
// #ob-screenshot-grid element at different points in its lifecycle.
function renderScreenshotGridInto(grid) {
  if (!state.uploads.screenshots.length) {
    grid.innerHTML = '';
    return;
  }
  grid.innerHTML = state.uploads.screenshots.map(s => `
    <div class="asset-thumb" onclick="openScreenshotLightbox(this)">
      <img src="${_screenshotSrc(s)}" alt="${escHtml(s.name)}">
      <button class="asset-remove" onclick="event.stopPropagation(); removeScreenshot('${s.id}')" title="Remove">×</button>
      <div class="asset-name">${escHtml(s.name)}</div>
    </div>
  `).join('');
}

function removeScreenshot(id) {
  state.uploads.screenshots = state.uploads.screenshots.filter(s => s.id !== id);
  const grid = document.getElementById('ob-screenshot-grid');
  if (grid) renderScreenshotGridInto(grid);
  // Mirror the removal into the Web platform's own independent copy, by
  // the same id — a screenshot added independently there (a different id)
  // is untouched. See the state.js comment above webSite.screenshots.
  if (state.webSite && state.webSite.screenshots) {
    state.webSite.screenshots = state.webSite.screenshots.filter(s => s.id !== id);
    const wsGrid = document.getElementById('ws-screenshot-grid');
    if (wsGrid) renderWebScreenshotGridInto(wsGrid);
  }
}

/* ── Web platform's own Media section — screenshots/trailer dropzones ────
   Mirror of handleScreenshotDrop/handleScreenshotFiles/removeScreenshot
   above, but reading/writing state.webSite.screenshots instead of
   state.uploads.screenshots — this is the Web platform's OWN independent
   copy (see the state.js comment above webSite.screenshots), so these
   never touch Game Details' own Assets step. Game Details' own add/remove
   functions above mirror INTO this array; these never mirror back out. */
function renderWebScreenshotGridInto(grid) {
  grid.innerHTML = _wsScreenshotGridHTML(state.webSite?.screenshots);
}

function handleWebScreenshotDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleWebScreenshotFiles(e.dataTransfer.files);
}

function handleWebScreenshotFiles(files) {
  if (!state.webSite) state.webSite = {};
  if (!state.webSite.screenshots) state.webSite.screenshots = [];
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const id = 'wsss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const reader = new FileReader();
    reader.onload = ev => {
      state.webSite.screenshots.push({ id, name: file.name, dataUrl: ev.target.result });
      const grid = document.getElementById('ws-screenshot-grid');
      if (grid) renderWebScreenshotGridInto(grid);
    };
    reader.readAsDataURL(file);
  });
}

function removeWebScreenshot(id) {
  if (!state.webSite || !state.webSite.screenshots) return;
  state.webSite.screenshots = state.webSite.screenshots.filter(s => s.id !== id);
  const grid = document.getElementById('ws-screenshot-grid');
  if (grid) renderWebScreenshotGridInto(grid);
}

function handleWebTrailerDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleWebTrailerFiles(e.dataTransfer.files);
}

function handleWebTrailerFiles(files) {
  const file = files[0];
  if (!file) return;
  if (!state.webSite) state.webSite = {};
  state.webSite.trailerFile = { name: file.name, size: file.size };
  const info = document.getElementById('ws-trailer-file-info');
  if (info) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    info.style.display = 'block';
    info.innerHTML = trailerFileRowHTML(file.name, mb, 'ws-');
  }
}

function handleFeatureDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleFeatureFiles(e.dataTransfer.files);
}

function handleFeatureFiles(files) {
  const file = files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.uploads.featureGraphic = { name: file.name, dataUrl: ev.target.result };
    const wrap = document.getElementById('ob-feature-preview');
    if (wrap) {
      wrap.style.display = 'block';
      wrap.innerHTML = `
        <img class="feature-img" src="${ev.target.result}" alt="${file.name}">
        <div class="feature-preview-meta">
          <span class="feature-preview-name">${file.name}</span>
          <button class="btn btn-ghost btn-sm" onclick="removeFeatureGraphic()">Remove</button>
        </div>`;
    }
  };
  reader.readAsDataURL(file);
}

function removeFeatureGraphic() {
  state.uploads.featureGraphic = null;
  const wrap = document.getElementById('ob-feature-preview');
  if (wrap) { wrap.style.display = 'none'; wrap.innerHTML = ''; }
}

function handleTrailerDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleTrailerFiles(e.dataTransfer.files);
}

function handleTrailerFiles(files) {
  const file = files[0];
  if (!file) return;
  state.uploads.trailer = { name: file.name, size: file.size };
  const info = document.getElementById('ob-trailer-file-info');
  if (info) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    info.style.display = 'block';
    info.innerHTML = `
      <div class="trailer-file-row">
        <span class="trailer-file-name">🎬 ${file.name}</span>
        <span class="trailer-file-size">${mb} MB</span>
        <button class="btn btn-ghost btn-sm" onclick="removeTrailer('ob-')">Remove</button>
      </div>`;
  }
  // Force-sync into the Web platform's own independent trailer slot — see
  // the state.js comment above webSite.trailerFile for why this is a whole-
  // value overwrite rather than the coexisting per-id merge screenshots use.
  if (!state.webSite) state.webSite = {};
  state.webSite.trailerFile = { name: file.name, size: file.size };
  const wsInfo = document.getElementById('ws-trailer-file-info');
  if (wsInfo) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    wsInfo.style.display = 'block';
    wsInfo.innerHTML = trailerFileRowHTML(file.name, mb, 'ws-');
  }
}

/* `prefix` distinguishes which trailer-file slot to clear: 'ob-' (or
   omitted, the default) for Game Details' own state.uploads.trailer, 'ws-'
   for the Web platform's independent state.webSite.trailerFile (see
   _wsMediaFieldsHTML, render.js). Clearing Game Details' own trailer file
   also force-clears the Web platform's copy to match (same one-way sync as
   handleTrailerFiles above) — clearing the Web platform's own copy only
   ever touches state.webSite, never state.uploads. */
function removeTrailer(prefix) {
  prefix = prefix || 'ob-';
  if (prefix === 'ws-') {
    if (state.webSite) state.webSite.trailerFile = null;
  } else {
    state.uploads.trailer = null;
    if (state.webSite) state.webSite.trailerFile = null;
  }
  const info = document.getElementById(`${prefix}trailer-file-info`);
  if (info) { info.style.display = 'none'; info.innerHTML = ''; }
}

/* Click handler for the auto-filled Steam trailer thumbnail (see
   buildAssetsTab in render.js, state.uploads.steamTrailer/
   _steamTrailerFromMovies above). `el` is the clicked
   .steam-trailer-thumb-link element itself; its hlsUrl lives in
   data-hls-url (set by render.js, escaped like any other attribute value).
   Steam's own appdetails only hands back adaptive-streaming manifests for
   trailers now (an .m3u8 HLS manifest — see _steamTrailerFromMovies), not a
   plain video file a browser can just navigate to, so this plays it inline
   instead of linking out: swaps the thumbnail for a real <video> element
   and streams the manifest into it via hls.js (loaded from cdnjs in
   index.html), or Safari's own native HLS support when that's available
   (avoids pulling in hls.js at all on browsers that don't need it). If
   neither playback path is available, falls back to a plain link-out so the
   trailer is still reachable somehow rather than becoming a dead click.
   Verified live end-to-end during this project's own trailer-thumbnail bug
   investigation: hls.js successfully loads and parses a real Steam trailer
   manifest cross-origin (i.e. from a page on a different domain than
   steampowered.com, matching how Shipmate itself is hosted). */
function playSteamTrailer(el) {
  const wrap = el.closest('.steam-trailer-preview');
  const hlsUrl = wrap && wrap.dataset.hlsUrl;
  if (!hlsUrl) return;

  // Snapshot of the thumbnail link's markup, restored verbatim (via
  // outerHTML, same pattern as e.g. buildActiveCard's card.outerHTML swaps)
  // once the user clicks away from the player — see closeOnClickAway below.
  const thumbHTML = el.outerHTML;

  const video = document.createElement('video');
  video.className = 'steam-trailer-video';
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  // This player can sit inside a clickable preview section elsewhere on the
  // page (see #pk-media in buildWebSitePreviewSection, render.js) — without
  // this, clicking the video's own native controls would bubble up and flip
  // that section into edit mode instead of just operating the player.
  video.addEventListener('click', e => e.stopPropagation());
  el.replaceWith(video);

  let hls = null;
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari (and some WebKit-based browsers) can play an HLS manifest
    // natively via a plain <video src>, no player library needed.
    video.src = hlsUrl;
  } else if (window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls();
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
  } else {
    // Neither native HLS nor hls.js is available in this browser — fall
    // back to a plain link-out rather than leaving a broken/silent player.
    const link = document.createElement('a');
    link.href = hlsUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'steam-trailer-fallback-link';
    link.addEventListener('click', e => e.stopPropagation());
    link.textContent = 'This browser can’t play the trailer inline — open it on Steam’s CDN instead';
    video.replaceWith(link);
    return; // a plain link-out isn't a player, so there's nothing to close-on-click-away
  }

  // Clicking anywhere outside the player restores the thumbnail and tears
  // down playback, so a trailer doesn't keep streaming silently in the
  // background once the user has moved on elsewhere on the page. Registered
  // on the capture phase so it still runs even though the player's own click
  // handler (above) calls stopPropagation() during the bubble phase — by
  // the time bubbling would be stopped, this capture-phase listener has
  // already fired and already decided (via video.contains) whether the
  // click landed on the player itself or somewhere else.
  //
  // Deliberately checks video.contains(e.target), NOT wrap.contains — wrap
  // (.steam-trailer-preview) also contains the caption underneath the player
  // (.feature-preview-meta, the trailer name/"from Steam" text — see
  // _steamTrailerPreviewHTML in render.js), which sits below the video as a
  // sibling, not inside it. Checking the whole wrap would treat a click on
  // that caption as "on the player" and skip closing entirely, silently
  // letting the click keep bubbling — straight into #pk-media's flip-to-edit
  // handler on the preview website. video.contains(e.target) is true only
  // for the video itself (including its native controls, which retarget
  // click events to the video element for outside listeners) — a click on
  // the caption below it correctly counts as "away".
  //
  // That first click-away must ONLY close the player, not also activate
  // whatever it landed on underneath (e.g. flip #pk-media into edit mode, or
  // enlarge a screenshot via openScreenshotLightbox) — so once we've decided
  // to close, we stopPropagation()+preventDefault() the SAME event that
  // triggered the close. Because this listener runs during the capture
  // phase (the very first stop on the event's path, before it even reaches
  // the clicked element), stopping it here prevents the event from ever
  // reaching that element's own handlers at all — the click is fully
  // consumed by closing the player, and a second, separate click is needed
  // to actually act on whatever's underneath.
  function closeOnClickAway(e) {
    if (video.contains(e.target)) return; // click was on the player itself — keep playing
    e.stopPropagation();
    e.preventDefault();
    document.removeEventListener('click', closeOnClickAway, true);
    if (hls) hls.destroy();
    video.pause();
    video.outerHTML = thumbHTML;
  }
  document.addEventListener('click', closeOnClickAway, true);
}

/* onload handler for the preview website's capsule image (.pk-capsule-img,
   see capsuleHTML in buildWebSitePreviewSection, render.js) — corrects the
   box's aspect-ratio to the REAL loaded image's own naturalWidth/
   naturalHeight, overriding the inline aspect-ratio style that
   _webCapsuleAspectRatio (render.js) set as an initial best guess before
   the image had actually loaded.
   That guess exists for two reasons: the placeholder box (no image at all)
   needs SOME shape to show, and it avoids a layout jump on first paint for
   the common case. But it's still only a guess — Steam's Capsule Image/
   Header Image are delivered at exact, Steam-enforced pixel dimensions, so
   the guess is normally exact for those; IGDB Cover Art's t_cover_big
   transform is only nominally 264×374 and doesn't reliably land exactly
   there for every game's actual cover art (confirmed live: some covers
   render with thick, uneven letterbox bars under a fixed-ratio box — either
   left/right or top/bottom depending on whether that particular cover
   happens to be wider or narrower than the guess). Measuring the real,
   already-loaded image is the only way to guarantee an exact match
   regardless of what any individual game's actual proportions turn out to
   be, rather than chasing an ever-more-specific hardcoded number that will
   eventually be wrong for some other game too.
   Also recomputes the Factsheet's margin-top (#pk-factsheet) to match,
   since that value is derived from the same box-height assumption (see
   _webCapsuleFactsheetMarginTop in render.js for the formula this mirrors:
   margin-top = (box height / 2) + 10 (buffer) - 22 (.pk-main's own
   padding-top, backed out since margin-top is measured inside it)) — box
   height = 220 (the capsule's fixed width) × (real height / real width),
   using the image's own dimensions instead of the guess. Guards on
   #pk-factsheet existing in case that ever changes — this capsule markup
   only renders inside buildWebSitePreviewSection today, which always
   includes a Factsheet section alongside it, but there's no reason for
   this handler to assume that stays true forever. */
function _pkSyncCapsuleAspect(img) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  const box = img.closest('.pk-capsule');
  if (!box) return;
  box.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;

  const realHeight = 220 * (img.naturalHeight / img.naturalWidth);
  const marginTop = (realHeight / 2) + 10 - 22;
  const factsheet = document.getElementById('pk-factsheet');
  if (factsheet) factsheet.style.marginTop = marginTop + 'px';
}

// Tracks the currently-registered document keydown listener for whichever
// screenshot lightbox is open (openScreenshotLightbox below), so it can be
// torn down on close/reopen without ever leaking or stacking duplicates.
let _pkLightboxKeyHandler = null;

/* Click handler for a preview-website screenshot thumbnail (see
   screenshotsValue in buildWebSitePreviewSection, render.js) — opens it in a
   fullscreen lightbox so the user can see it at full size. Mirrors the
   existing "See Prompt" debug overlay's own overlay pattern (same file,
   showInferencePrompt) for consistency: an overlay appended to <body>,
   closed either by its own close button or by clicking the backdrop.
   `cell` is the clicked .pk-image-cell div; its <img> is read directly
   rather than passing the src/alt through as string arguments, since a
   screenshot's src is often a large data: URL that's awkward and fragile to
   inline into an onclick attribute value.
   Left/Right arrow keys step through the rest of the gallery while the
   lightbox is open — the navigable set is every <img> among the clicked
   cell's own siblings (cell.parentElement.children), which works for both
   grids this lightbox is shared with: the preview website's
   .pk-image-grid and the Assets tab's #ob-screenshot-grid are each a flat
   list of one-<img>-per-cell thumbnails, so no special-casing is needed for
   either. Navigation wraps around at both ends. The keydown listener is
   registered on open and torn down on every close path (close button,
   backdrop click, or opening a second lightbox before closing the first)
   so it never leaks or stacks. */
function openScreenshotLightbox(cell) {
  const img = cell.querySelector('img');
  if (!img) return;

  const existing = document.getElementById('pk-lightbox-overlay');
  if (existing) existing.remove();
  if (_pkLightboxKeyHandler) {
    document.removeEventListener('keydown', _pkLightboxKeyHandler);
    _pkLightboxKeyHandler = null;
  }

  // Cap the enlarged image to the width of the main modal it's opened
  // inside, rather than letting it grow to the full screen width via
  // .pk-lightbox-img's own CSS max-width: 90vw. This lightbox is shared by
  // two different screenshot grids that each live in a DIFFERENT modal
  // shell: the preview website's (buildWebSitePreviewSection) renders
  // inside a .submit-modal (see buildStepModal in render.js — 100% wide up
  // to 920px for the Web platform's storePreview step), while the Assets
  // tab's (renderOnboardingScreenshotGrid/renderScreenshotGridInto) renders
  // inside .ob-modal instead (the onboarding flow's own separate modal
  // shell, 100% wide up to 640px, in index.html) — .closest() checks for
  // either, whichever ancestor is actually present. Both modals are
  // responsive (100% up to their own cap), so a hardcoded pixel value here
  // would be wrong on a narrower viewport — reading the modal's own actual
  // current rendered width keeps this correct at any window size. Falls
  // back to the CSS default (90vw, via leaving maxWidth unset) if neither
  // ancestor is found, rather than throwing.
  const modal = cell.closest('.submit-modal, .ob-modal');
  const lightboxImgStyle = modal ? ` style="max-width:${Math.round(modal.getBoundingClientRect().width)}px;"` : '';

  const gallery = cell.parentElement
    ? Array.from(cell.parentElement.children).map(c => c.querySelector && c.querySelector('img')).filter(Boolean)
    : [img];
  let index = gallery.indexOf(img);
  if (index < 0) index = 0;

  const overlay = document.createElement('div');
  overlay.id = 'pk-lightbox-overlay';
  overlay.className = 'pk-lightbox-overlay';
  overlay.innerHTML = `
    <img class="pk-lightbox-img" id="pk-lightbox-img" src="${escHtml(img.src)}" alt="${escHtml(img.alt)}"${lightboxImgStyle}>
    <button class="pk-lightbox-close">✕</button>`;

  function closeLightbox() {
    document.removeEventListener('keydown', _pkLightboxKeyHandler);
    _pkLightboxKeyHandler = null;
    overlay.remove();
  }

  function showAt(newIndex) {
    if (gallery.length < 2) return; // nothing else to navigate to
    index = ((newIndex % gallery.length) + gallery.length) % gallery.length; // wrap both directions
    const target = gallery[index];
    const lbImg = document.getElementById('pk-lightbox-img');
    if (lbImg) { lbImg.src = target.src; lbImg.alt = target.alt; }
  }

  _pkLightboxKeyHandler = function (e) {
    if (e.key === 'ArrowLeft')       { e.preventDefault(); showAt(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); showAt(index + 1); }
  };

  overlay.querySelector('.pk-lightbox-close').addEventListener('click', closeLightbox);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });
  document.body.appendChild(overlay);
  document.addEventListener('keydown', _pkLightboxKeyHandler);
}


/* ── Key Questions / Compliance ──────────────────────── */

function computeInferences() {
  const text = (state.formData.description + ' ' + state.formData.title).toLowerCase();
  for (const q of QUESTIONS) {
    if (state.questionAnswers[q.id] !== null) continue;
    const matched = q.keywords.some(kw => text.includes(kw));
    if (matched) {
      state.questionAnswers[q.id]  = 'yes';
      state.questionInferred[q.id] = true;
    }
  }
}

function answerQuestion(key, value) {
  // Toggle: clicking the already-selected answer deselects it
  if (state.questionAnswers[key] === value) {
    state.questionAnswers[key]  = null;
    state.questionInferred[key] = false;
  } else {
    state.questionAnswers[key]  = value;
    state.questionInferred[key] = false;
  }
  renderComplianceQuestions();
  updateObSectionStates();
}

/* ── Project bar dropdowns ───────────────────────────── */

function closeAllDropdowns() {
  document.getElementById('projectSelectorWrap')?.classList.remove('open');
  document.getElementById('versionSelectorWrap')?.classList.remove('open');
  document.getElementById('versionMenu')?.classList.remove('open');
  document.getElementById('profileMenu')?.classList.remove('open');
  document.getElementById('loc-primary-wrap')?.classList.remove('is-open');
  // Close all swSelect dropdowns
  document.querySelectorAll('.sw-select-wrap').forEach(el => el.classList.remove('is-open'));
  // Close language type-ahead search if open
  document.getElementById('lang-search-wrap')?.classList.add('hidden');
  // Close language picker
  document.getElementById('langMenu')?.classList.add('hidden');
  // Close the "Automatically translated fields" settings menu. Unlike the
  // swSelect dropdowns above (purely transient DOM classes, never read back
  // by render), this one's open/closed state is also tracked in `state`
  // (see iasReviewSettingsOpen, state.js) so it can survive a
  // reRenderStepModal() triggered by its own checkboxes — so closing it here
  // has to reset that flag too, or the next unrelated re-render would read
  // stale state and pop it back open.
  state.iasReviewSettingsOpen = false;
  // Same treatment for IAP Localizations' own independent settings menu
  // (_iapLocToggleSettingsMenu below) — a completely separate flag/dropdown
  // from iasReviewSettingsOpen above, so the two sections' gear menus can
  // never affect each other.
  state.iapLocSettingsOpen = false;
}

/* ── Language picker ─────────────────────────────────── */

function toggleLangMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('langMenu');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  closeAllDropdowns();
  if (isHidden) {
    if (typeof renderLangMenu === 'function') renderLangMenu();
    menu.classList.remove('hidden');
  }
}

/* ── swSelect — reusable styled dropdown ─────────────── */

function toggleSwSelect(event, id) {
  event.stopPropagation();
  const wrap = document.getElementById('swsel-' + id);
  if (!wrap) return;
  const isOpen = wrap.classList.contains('is-open');
  closeAllDropdowns();
  if (!isOpen) wrap.classList.add('is-open');
}

function swSelectChoose(id, value, callbackFn) {
  closeAllDropdowns();
  if (typeof window[callbackFn] === 'function') window[callbackFn](value);
}

/* ── Localization Review — "Automatically translated fields" settings ──
   Opened via the gear icon beside "Localization Review". Built like a
   swSelect dropdown (same .sw-select-wrap/.loc-dropdown shell, same
   closeAllDropdowns/outside-click wiring), but state-driven rather than a
   pure transient DOM class: its checkboxes call reRenderStepModal() to
   apply a setting change immediately, which fully rebuilds the modal
   markup, so open/closed has to be read back from state.iasReviewSettingsOpen
   at render time (buildLocalizationReviewSection, render.js) or it would
   snap shut after every single checkbox click. */
function _iasToggleReviewSettingsMenu(event) {
  event.stopPropagation();
  const wasOpen = !!state.iasReviewSettingsOpen;
  closeAllDropdowns();
  if (!wasOpen) {
    state.iasReviewSettingsOpen = true;
    document.getElementById('loc-review-settings-wrap')?.classList.add('is-open');
  }
}

/* IAP Localizations' own "Automatically translated fields" settings —
   mirrors _iasToggleReviewSettingsMenu exactly, with its own independent
   state flag (iapLocSettingsOpen, closeAllDropdowns above) and DOM id
   ('iap-loc-settings-wrap', buildIapLocalizationsSection, render.js) so the
   two sections' gear menus never share or clobber each other's open state. */
function _iapLocToggleSettingsMenu(event) {
  event.stopPropagation();
  const wasOpen = !!state.iapLocSettingsOpen;
  closeAllDropdowns();
  if (!wasOpen) {
    state.iapLocSettingsOpen = true;
    document.getElementById('iap-loc-settings-wrap')?.classList.add('is-open');
  }
}

/* ── Profile menu ────────────────────────────────────── */

function toggleProfileMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('profileMenu');
  const isOpen = menu.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) menu.classList.add('open');
}

/* ── Multi-project / version management ──────────────── */

function createNewProject() {
  saveCurrentToProject();
  // Reset flat state for fresh onboarding
  state.formData         = makeBlankFormData();
  state.uploads          = makeBlankUploads();
  state.questionAnswers  = makeBlankAnswers();
  state.questionInferred = makeBlankInferred();
  state.activePlatforms  = new Set();
  state.platformStepStatus = makeEmptyPlatformSteps();
  state.privacyPresets   = [];
  state._newProjectMode  = true;
  closeAllDropdowns();
  openOnboarding(0);
}

// Opens the New Release modal, pre-filling the suggested version number.
function openNewReleaseModal() {
  closeAllDropdowns();
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  const currentVer = proj?.versions.find(v => v.id === state.activeVersionId);
  const suggested  = bumpMinorVersion(currentVer?.versionNumber || '1.0');

  const overlay = document.getElementById('release-modal-overlay');
  const modal   = document.getElementById('release-modal');
  if (!modal || !overlay) return;

  modal.innerHTML = `
    <div class="release-modal-header">
      <div class="release-modal-title">${t('release.modal.title')}</div>
      <div class="release-modal-subtitle">${t('release.modal.subtitle')}</div>
    </div>
    <div class="release-modal-body">
      <div class="release-modal-field">
        <label class="release-modal-label" for="rm-version">${t('release.modal.version_lbl')}</label>
        <input class="form-input" id="rm-version" type="text" value="${escHtml(suggested)}"
               placeholder="${t('release.modal.version_ph')}" autocomplete="off">
      </div>
      <div class="release-modal-field">
        <label class="release-modal-label" for="rm-name">${t('release.modal.name_lbl')} <span class="release-modal-optional">${t('release.modal.optional')}</span></label>
        <input class="form-input" id="rm-name" type="text" placeholder="${t('release.modal.name_ph')}"
               autocomplete="off">
      </div>
      <div class="release-modal-field">
        <label class="release-modal-label" for="rm-changelog">${t('release.modal.changelog_lbl')} <span class="release-modal-optional">${t('release.modal.optional')}</span></label>
        <textarea class="form-input release-modal-textarea" id="rm-changelog"
                  placeholder="${t('release.modal.changelog_ph')}" rows="4"></textarea>
      </div>
    </div>
    <div class="release-modal-footer">
      <button class="btn btn-ghost" onclick="closeNewReleaseModal()">${t('btn.cancel')}</button>
      <button class="btn btn-primary" onclick="confirmCreateRelease()">${t('release.modal.create_btn')}</button>
    </div>`;

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Focus version field and select all so user can type immediately
  requestAnimationFrame(() => {
    const inp = document.getElementById('rm-version');
    if (inp) { inp.focus(); inp.select(); }
  });
}

function closeNewReleaseModal() {
  document.getElementById('release-modal-overlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

function releaseModalOverlayClick(e) {
  if (e.target === document.getElementById('release-modal-overlay')) closeNewReleaseModal();
}

function confirmCreateRelease() {
  const versionInput = document.getElementById('rm-version');
  const nameInput    = document.getElementById('rm-name');
  const clInput      = document.getElementById('rm-changelog');

  const versionNumber = (versionInput?.value || '').trim() || '1.0';
  const name          = (nameInput?.value  || '').trim();
  const changelog     = (clInput?.value    || '').trim();

  saveCurrentToProject();
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj) { closeNewReleaseModal(); return; }

  const currentVer = proj.versions.find(v => v.id === state.activeVersionId);
  const carryPlats = currentVer ? currentVer.activePlatforms : [];

  // Carry forward completed steps from the previous release, resetting only the
  // per-release mandatory ones (storePreview, reviewSubmission, submit).
  const ver = makeEmptyVersion(versionNumber, carryPlats, currentVer?.platformStepStatus);
  ver.name      = name;
  ver.changelog = changelog;

  proj.versions.push(ver);
  state.activeVersionId    = ver.id;
  state.activePlatforms    = new Set(ver.activePlatforms);
  state.platformStepStatus = JSON.parse(JSON.stringify(ver.platformStepStatus));

  // iOS / Android / Steam use computed completion (not platformStepStatus).
  // Their storePreview step is driven by a "seen" flag — reset it so the
  // Store Page Preview step correctly shows as incomplete on the new release.
  state.iosStorePreviewSeen                        = false;
  state.androidSubmitAnswers.storePreviewSeen      = false;
  state.steamSubmitAnswers.storePreviewSeen        = false;

  closeNewReleaseModal();
  renderDashboard();
}

function switchProject(projectId) {
  if (projectId === state.activeProjectId) { closeAllDropdowns(); return; }
  loadProjectAndVersion(projectId, null);
  closeAllDropdowns();
  renderDashboard();
}

function switchVersion(versionId) {
  if (versionId === state.activeVersionId) { closeAllDropdowns(); return; }
  saveCurrentToProject();
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  const ver  = proj?.versions.find(v => v.id === versionId);
  if (!ver) return;
  state.activeVersionId      = ver.id;
  state.activePlatforms      = new Set(ver.activePlatforms);
  state.platformStepStatus   = JSON.parse(JSON.stringify(ver.platformStepStatus));
  closeAllDropdowns();
  renderDashboard();
}

function toggleProjectDropdown(e) {
  e.stopPropagation();
  const wrap = document.getElementById('projectSelectorWrap');
  const isOpen = wrap.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) wrap.classList.add('open');
}

function toggleVersionDropdown(e) {
  e.stopPropagation();
  const wrap = document.getElementById('versionSelectorWrap');
  const isOpen = wrap.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) wrap.classList.add('open');
}

function toggleVersionMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('versionMenu');
  const isOpen = menu.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) menu.classList.add('open');
}

// Close dropdowns when clicking anywhere outside
document.addEventListener('click', closeAllDropdowns);


/* ── Confirm / Info Modal ────────────────────────────── */

let _confirmCallback = null;

function openConfirmModal(title, message, confirmLabel, onConfirm, isDanger = false) {
  _confirmCallback = onConfirm;
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;
  const confirmBtn = document.getElementById('confirm-modal-confirm');
  confirmBtn.textContent = confirmLabel;
  confirmBtn.className = `btn ${isDanger ? 'btn-danger' : 'btn-primary'}`;
  confirmBtn.onclick = () => { if (_confirmCallback) _confirmCallback(); };
  const cancelBtn = document.getElementById('confirm-modal-cancel');
  cancelBtn.style.display = '';
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function openInfoModal(title, message) {
  _confirmCallback = null;
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;
  const confirmBtn = document.getElementById('confirm-modal-confirm');
  confirmBtn.textContent = 'OK';
  confirmBtn.className = 'btn btn-primary';
  confirmBtn.onclick = closeConfirmModal;
  document.getElementById('confirm-modal-cancel').style.display = 'none';
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
  document.getElementById('confirm-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  _confirmCallback = null;
}


/* ── Delete Version ───────────────────────────────────── */

function _versionHasReleases(ver) {
  return Object.values(ver.platformReleases || {}).some(list => list && list.length > 0);
}

function deleteCurrentVersion() {
  closeAllDropdowns();
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj) return;

  // Case 1: Only one release — can't delete
  if (proj.versions.length === 1) {
    openInfoModal(
      t('delete.release.cant_title'),
      t('delete.release.cant_body')
    );
    return;
  }

  const ver = proj.versions.find(v => v.id === state.activeVersionId);
  if (!ver) return;

  const hasSubmitted       = _versionHasReleases(ver);
  const hasActivePlatforms = ver.activePlatforms && ver.activePlatforms.length > 0;
  const label = 'v' + ver.versionNumber;

  if (hasSubmitted) {
    // Case 2: Release has release records (submitted to at least one track)
    openConfirmModal(
      t('delete.release.submitted_title'),
      t('delete.release.submitted_body', { label }),
      t('btn.delete_anyway'),
      () => _deleteVersion(proj, ver.id),
      true
    );
  } else if (hasActivePlatforms) {
    // Case 3: Active platforms but nothing submitted yet
    openConfirmModal(
      t('delete.release.active_title'),
      t('delete.release.active_body', { label }),
      t('btn.delete'),
      () => _deleteVersion(proj, ver.id),
      true
    );
  } else {
    // Empty version — delete without ceremony
    _deleteVersion(proj, ver.id);
  }
}

function _deleteVersion(proj, verId) {
  proj.versions = proj.versions.filter(v => v.id !== verId);
  // Switch to the last remaining version
  const newVer = proj.versions[proj.versions.length - 1];
  state.activeVersionId    = newVer.id;
  state.activePlatforms    = new Set(newVer.activePlatforms);
  state.platformStepStatus = JSON.parse(JSON.stringify(newVer.platformStepStatus));
  closeConfirmModal();
  renderDashboard();
}


/* ── Delete Project ──────────────────────────────────── */

function deleteCurrentProject() {
  closeAllDropdowns();

  // Can't delete the only project
  if (state.projects.length === 1) {
    openInfoModal(
      'Can\'t delete this project',
      'This is your only project. Create another project first, then delete this one.'
    );
    return;
  }

  const proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj) return;

  // Check if any version has release records
  const hasSubmitted = proj.versions.some(_versionHasReleases);

  if (hasSubmitted) {
    openConfirmModal(
      'Delete project with live submissions?',
      `"${proj.name}" has active store submissions. All project data and release records will be permanently deleted. This won't unpublish anything already live.`,
      'Delete project',
      () => _deleteProject(proj.id),
      true
    );
  } else {
    openConfirmModal(
      'Delete project?',
      `Delete "${proj.name}" and all its versions? This cannot be undone.`,
      'Delete project',
      () => _deleteProject(proj.id),
      true
    );
  }
}

function _deleteProject(projectId) {
  state.projects = state.projects.filter(p => p.id !== projectId);
  // Load the first remaining project
  const newProj = state.projects[0];
  loadProjectAndVersion(newProj.id, null);
  closeConfirmModal();
  renderDashboard();
}

function changeInferredAnswer(key) {
  state.questionInferred[key] = false;
  state.questionAnswers[key]  = null;
  const body = document.getElementById('ob-body');
  if (body) {
    const html = buildComplianceTab();
    body.innerHTML = html;
    hydrateComplianceTab();
  }
}

/* ── Consolidated Questionnaire Modal ────────────────── */

async function openCQModal() {
  if (state.activePlatforms.size === 0) return;
  state.cqSeen = true;

  // First-ever open with a key available → run inference before showing modal
  const hasAnswers = Object.keys(state.cqAnswers).length > 0;
  const hasKey = typeof CLAUDE_API_KEY !== 'undefined' && CLAUDE_API_KEY;
  if (!hasAnswers && hasKey && state.cqInferenceStatus === null) {
    await runCQInference();
  }

  renderCQModal();
  document.getElementById('cq-overlay').classList.remove('hidden');
}

async function runCQInference() {
  state.cqInferenceStatus = 'loading';
  state.cqInferenceError  = null;
  renderDashboard(); // show loading state in banner
  try {
    const result = await analyzeCQWithClaude();
    const { applied, skipped } = applyCQResults(result);
    state.cqInferenceStatus = 'done';
    // Trigger A: AI filled ≥80% of questions → enable highlights so users
    // can immediately see what still needs attention.
    const total = applied + skipped;
    if (total > 0 && applied / total >= 0.8) {
      state.showHighlights = true;
      _setObValidating(true);
    }
  } catch (err) {
    state.cqInferenceStatus = 'error';
    state.cqInferenceError  = err.message === 'NO_KEY' ? 'No API key set.' : err.message;
    console.warn('[CQ] Inference failed:', err.message);
  }
  renderDashboard();
}

function closeCQModal() {
  document.getElementById('cq-overlay').classList.add('hidden');
  renderDashboard(); // refresh banner progress
}

function cqOverlayClick(e) {
  if (e.target === document.getElementById('cq-overlay')) closeCQModal();
}

// Mark a CQ answer as human-confirmed (clears AI badge)
function _confirmCQHuman(qid) {
  state.cqAnswerMeta[qid] = { ...(state.cqAnswerMeta[qid] || {}), humanConfirmed: true };
}

// Yes/No and text answers
function setCQAnswer(qid, value) {
  state.cqAnswers[qid] = value;
  _confirmCQHuman(qid);
  const scroll = document.getElementById('cq-modal-body')?.scrollTop || 0;
  renderCQModal();
  requestAnimationFrame(() => {
    const body = document.getElementById('cq-modal-body');
    if (body) body.scrollTop = scroll;
  });
}

// Single-select (option by index to avoid escaping issues)
function setCQSingle(qid, optIdx) {
  const q = CQ_QUESTIONS.find(x => x.id === qid);
  if (!q) return;
  const opt = q.options[optIdx];
  state.cqAnswers[qid] = opt;
  _confirmCQHuman(qid);
  const scroll = document.getElementById('cq-modal-body')?.scrollTop || 0;
  renderCQModal();
  requestAnimationFrame(() => {
    const body = document.getElementById('cq-modal-body');
    if (body) body.scrollTop = scroll;
  });
}

// Multi-select checkbox toggle
/* ── Country chip expand/collapse ────────────────────── */

function toggleObDistExpand(btn) {
  const extraList = document.getElementById('ob-dist-country-list-extra');
  if (!extraList) return;
  const extraCount = IOS_COUNTRIES.length - 10;
  const chevD = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const chevU = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
  const nowHidden = extraList.classList.toggle('hidden');
  if (nowHidden) {
    // Collapsed — show the expand prompt and scroll button into view
    btn.innerHTML = `${chevD} Show ${extraCount} more markets`;
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    // Expanded
    btn.innerHTML = `${chevU} Show fewer markets`;
  }
}

/* ── Language type-ahead search ──────────────────────── */

function toggleLangSearch(event) {
  event.stopPropagation();
  const wrap = document.getElementById('lang-search-wrap');
  if (!wrap) return;
  const isOpen = !wrap.classList.contains('hidden');
  if (isOpen) {
    wrap.classList.add('hidden');
  } else {
    wrap.classList.remove('hidden');
    filterLangSearch('');
    const input = document.getElementById('lang-search-input');
    if (input) { input.value = ''; input.focus(); }
  }
}

function filterLangSearch(query) {
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const selected = new Set(fd.localizations || []);
  const featured = new Set(OB_LANG_FEATURED);

  const list = document.getElementById('lang-search-list');
  if (!list) return;

  const q = (query || '').toLowerCase();
  const results = Object.entries(OB_LANG_NAMES)
    .filter(([code, name]) =>
      code !== primary &&
      !featured.has(code) &&
      (q === '' || name.toLowerCase().includes(q) || code.toLowerCase().includes(q))
    )
    .sort(([, a], [, b]) => a.localeCompare(b))   // always alphabetical
    .slice(0, 20);

  if (results.length === 0) {
    list.innerHTML = '<div class="lang-search-empty">No languages found</div>';
    return;
  }

  list.innerHTML = results.map(([code, name]) => {
    const isOn = selected.has(code);
    return `<button class="lang-search-item${isOn ? ' is-on' : ''}" onclick="addLangFromSearch('${code}')">
      <span>${name}</span>
      ${isOn ? '<span class="lang-search-check">✓</span>' : ''}
    </button>`;
  }).join('');
}

function addLangFromSearch(code) {
  const arr = state.formData.localizations || [];
  const idx = arr.indexOf(code);
  if (idx === -1) {
    arr.push(code);
  } else {
    arr.splice(idx, 1);
  }
  state.formData.localizations = arr;
  updateObLangListWrap();
}

function handleCQMulti(el) {
  const qid  = el.dataset.qid;
  const idx  = parseInt(el.dataset.oidx);
  const q    = CQ_QUESTIONS.find(x => x.id === qid);
  if (!q) return;
  const opt     = q.options[idx];
  const NONE_RE = /^none/i;
  const current = Array.isArray(state.cqAnswers[qid]) ? [...state.cqAnswers[qid]] : [];

  if (el.checked) {
    if (NONE_RE.test(opt)) {
      state.cqAnswers[qid] = [opt]; // selecting "None" clears everything else
    } else {
      const filtered = current.filter(v => !NONE_RE.test(v));
      if (!filtered.includes(opt)) filtered.push(opt);
      state.cqAnswers[qid] = filtered;
    }
  } else {
    state.cqAnswers[qid] = current.filter(v => v !== opt);
  }

  _confirmCQHuman(qid);
  const scroll = document.getElementById('cq-modal-body')?.scrollTop || 0;
  renderCQModal();
  requestAnimationFrame(() => {
    const body = document.getElementById('cq-modal-body');
    if (body) body.scrollTop = scroll;
  });
}

/* ═══════════════════════════════════════════════════
   ANDROID HANDLERS
   ═══════════════════════════════════════════════════ */

/* Seed Android answers from onboarding data where possible */
/* ── Android Content Rating — inline CQ answer handlers ─────
   These update cqAnswers (shared with the CQ modal) but re-render
   the step modal instead of the CQ modal.                      */

/* Handle YES/NO on individual options within a multi-select CQ question */
function answerAndroidCRMultiOpt(qid, optIdx, yesOrNo) {
  const q = CQ_QUESTIONS.find(x => x.id === qid);
  if (!q) return;
  const opt = q.options[optIdx];
  if (!opt) return;
  const current = Array.isArray(state.cqAnswers[qid]) ? state.cqAnswers[qid] : [];
  const inArray  = current.includes(opt);

  if (yesOrNo === 'yes') {
    const NONE_RE = /^none$/i;
    if (!inArray) {
      const filtered = current.filter(v => !NONE_RE.test(v));
      filtered.push(opt);
      state.cqAnswers[qid] = filtered;
    } else {
      // Already YES — toggle off (same as clicking selected button again)
      state.cqAnswers[qid] = current.filter(v => v !== opt);
    }
  } else {
    // NO — remove from array
    state.cqAnswers[qid] = current.filter(v => v !== opt);
  }
  _confirmCQHuman(qid);
  reRenderAndroidStepModal();
  updateAndroidCard();
}

function answerAndroidCR(qid, value) {
  const current = state.cqAnswers[qid];
  state.cqAnswers[qid] = (current === value) ? undefined : value;
  // Mark human-confirmed — removes AI badge
  state.cqAnswerMeta[qid] = { ...(state.cqAnswerMeta[qid] || {}), humanConfirmed: true };
  reRenderAndroidStepModal();
  updateAndroidCard();
}

function answerAndroidCRSingle(qid, optIdx) {
  const q = CQ_QUESTIONS.find(x => x.id === qid);
  if (!q) return;
  const opt     = q.options[optIdx];
  const current = state.cqAnswers[qid];
  state.cqAnswers[qid] = (current === opt) ? undefined : opt;
  _confirmCQHuman(qid);
  reRenderAndroidStepModal();
  updateAndroidCard();
}

function toggleAndroidCRMulti(qid, opt, checked) {
  const NONE_RE = /\bnone\b/i;
  const current = Array.isArray(state.cqAnswers[qid]) ? state.cqAnswers[qid] : [];
  if (checked) {
    if (NONE_RE.test(opt)) {
      state.cqAnswers[qid] = [opt];
    } else {
      const filtered = current.filter(v => !NONE_RE.test(v));
      if (!filtered.includes(opt)) filtered.push(opt);
      state.cqAnswers[qid] = filtered;
    }
  } else {
    state.cqAnswers[qid] = current.filter(v => v !== opt);
  }
  _confirmCQHuman(qid);
  reRenderAndroidStepModal();
  updateAndroidCard();
}

/* ── Google Play Content Questions (IARC) — answer handlers ──
   Mutate state.cqAnswers using the google.content.* keys (namespaced,
   so no collision with the cq_* ids used by CQ_QUESTIONS above). Answers
   are stored as 1-based option indices (radio) or arrays of indices
   (picklist_multi) — see giarcOptionEntries/giarcIsAnswered in state.js. */

function giarcClearAnswersRecursively(key) {
  // Clear this key's answer and every descendant's answer (used when a
  // branch is hidden again so re-revealing it starts fresh).
  const kids = giarcActiveChildKeys(key);
  delete state.cqAnswers[key];
  state.giarcManuallyExpanded.delete(key);
  state.giarcManuallyCollapsed.delete(key);
  kids.forEach(giarcClearAnswersRecursively);
}

function answerGIARCSingle(key, optIndex) {
  const q = GOOGLE_IARC_BY_KEY[key];
  if (!q) return;
  const current = state.cqAnswers[key];
  if (current === optIndex) {
    // Clicking the already-selected option again clears it (and whatever
    // it revealed) rather than leaving it stuck selected.
    giarcClearAnswersRecursively(key);
  } else {
    // Switching a radio answer should clear whatever the previous
    // selection had revealed, so stale sub-answers don't linger.
    if (current !== undefined && current !== null) {
      const prevOpt = giarcOptionEntries(q).find(o => o.index === current);
      if (prevOpt) giarcChildKeysForOption(prevOpt.child).forEach(giarcClearAnswersRecursively);
    }
    state.cqAnswers[key] = optIndex;
  }
  reRenderAndroidStepModal();
  updateAndroidCard();
}

function answerGIARCMultiOpt(key, optIndex) {
  const q = GOOGLE_IARC_BY_KEY[key];
  if (!q) return;
  const opt     = giarcOptionEntries(q).find(o => o.index === optIndex);
  const current = Array.isArray(state.cqAnswers[key]) ? state.cqAnswers[key].slice() : [];
  if (current.includes(optIndex)) {
    state.cqAnswers[key] = current.filter(x => x !== optIndex);
    // Deselecting an option should also clear whatever it revealed.
    if (opt) giarcChildKeysForOption(opt.child).forEach(giarcClearAnswersRecursively);
  } else {
    current.push(optIndex);
    state.cqAnswers[key] = current;
  }
  reRenderAndroidStepModal();
  updateAndroidCard();
}

/* expand=true reopens a collapsed branch for review; expand=false manually
   collapses it without touching the answer. radio questions auto-collapse
   once answered, so expand=true there means "reopen it" (tracked in
   giarcManuallyExpanded). picklist_multi questions never auto-collapse —
   they only collapse once the user asks to (tracked in the opposite sense,
   giarcManuallyCollapsed), so expand=true there means "undo that". */
function toggleGIARCExpand(key, expand) {
  const q = GOOGLE_IARC_BY_KEY[key];
  if (q && q.data_type === 'picklist_multi') {
    if (expand) state.giarcManuallyCollapsed.delete(key);
    else state.giarcManuallyCollapsed.add(key);
  } else {
    if (expand) state.giarcManuallyExpanded.add(key);
    else state.giarcManuallyExpanded.delete(key);
  }
  reRenderAndroidStepModal();
}

function seedOnboardingToAndroid() {
  const a  = state.androidSubmitAnswers;
  const fd = state.formData;
  const qa = state.questionAnswers;
  // Pre-populate collectsOrSharesData from onboarding question
  if (a.collectsOrSharesData === null && qa.dataCollection !== null) {
    a.collectsOrSharesData = qa.dataCollection;
  }
}

/* Update the Android card in the dashboard after changes */
function updateAndroidCard() {
  if (!state.activePlatforms.has('android')) return;
  const checkSVG = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  PLATFORMS.android.steps.forEach((step, i) => {
    const card = document.getElementById(`android-step-card-${step.id}`);
    if (!card) return;
    const done = isAndroidSectionComplete(step.id);
    card.classList.toggle('is-complete', done);
    const numEl = card.querySelector('.ios-step-num');
    if (numEl) {
      numEl.classList.toggle('is-done', done);
      numEl.innerHTML = done ? checkSVG : String(i + 1);
    }
  });

  const counts = platformStepCount('android');
  const submitCard = document.getElementById('android-step-card-submit');
  if (submitCard) submitCard.classList.toggle('submit-step-locked', !counts.allRequired);
}

/* Re-render Data Safety modal body preserving scroll */
function reRenderAndroidStepModal() {
  // Google Play questionnaire also lives inline in the Game Details content pane;
  // re-render that pane in place when it's the active surface (mirrors reRenderStepModal).
  if (state.activeView === 'details' && state.details && state.details.section === 'content') {
    const pane = document.querySelector('.gd-pane--content');
    if (pane && typeof buildContentQuestionsPane === 'function') {
      pane.innerHTML = buildContentQuestionsPane();
      return;
    }
  }
  const bodyEl = document.getElementById('step-modal-body');
  const scrollTop = bodyEl ? bodyEl.scrollTop : 0;
  renderStepModal();
  const newBodyEl = document.getElementById('step-modal-body');
  if (newBodyEl) newBodyEl.scrollTop = scrollTop;
}

/* Answer a yes/no android field */
/* Toggle a yes/no or single-choice field — clicking same value again deselects to null */
function answerAndroidField(fieldId, value) {
  const current = state.androidSubmitAnswers[fieldId];
  state.androidSubmitAnswers[fieldId] = (current === value) ? null : value;
  reRenderAndroidStepModal();
  updateAndroidCard();
}

/* Answer a text field */
function answerAndroidTextField(fieldId, value) {
  state.androidSubmitAnswers[fieldId] = value;
  updateAndroidCard();
}

/* Toggle account creation method */
/* Single-select account creation method */
function setAndroidAccountMethod(methodId) {
  state.androidSubmitAnswers.accountMethod = methodId || null;
  reRenderAndroidStepModal();
  updateAndroidCard();
}

/* Toggle a data type row on/off (row click) */
function toggleAndroidDataType(typeId) {
  const a = state.androidSubmitAnswers;
  if (a.dataPerType[typeId]) {
    delete a.dataPerType[typeId];
  } else {
    a.dataPerType[typeId] = { collected: true, shared: false, ephemeral: false, required: true, purposes: [] };
  }
  reRenderAndroidStepModal();
  updateAndroidCard();
}

/* Set a boolean flag (collected/shared/ephemeral/required) on a data type */
function setAndroidTypeFlag(typeId, flag, value) {
  const a = state.androidSubmitAnswers;
  if (!a.dataPerType[typeId]) {
    a.dataPerType[typeId] = { collected: false, shared: false, ephemeral: false, required: true, purposes: [] };
  }
  a.dataPerType[typeId][flag] = value;
  reRenderAndroidStepModal();
  updateAndroidCard();
}

/* Toggle a purpose for a data type */
function toggleAndroidPurpose(typeId, purposeId, checked) {
  const a = state.androidSubmitAnswers;
  if (!a.dataPerType[typeId]) return;
  const purposes = a.dataPerType[typeId].purposes;
  if (checked) {
    if (!purposes.includes(purposeId)) purposes.push(purposeId);
  } else {
    a.dataPerType[typeId].purposes = purposes.filter(p => p !== purposeId);
  }
  updateAndroidCard();
}

/* Toggle the data matrix expanded/collapsed */
function toggleAndroidMatrix() {
  state.androidMatrixExpanded = !state.androidMatrixExpanded;
  reRenderAndroidStepModal();
}

/* Plain-language data description → AI translation */
function updateAndroidDataDescription(val) {
  state.androidSubmitAnswers.androidDataDescription = val;
  if (!val || val.trim().length < 20) return;
  _triggerAndroidDataAI();
}

async function _triggerAndroidDataAI() {
  if (!CLAUDE_API_KEY) return;
  const desc = (state.androidSubmitAnswers.androidDataDescription || '').trim();
  if (desc.length < 20) return;

  state.androidDataAIStatus = 'loading';
  reRenderAndroidStepModal();

  const typeList    = ANDROID_DATA_TYPES.flatMap(g => g.types)
    .map(t => `${t.id}: ${t.label} (${t.group})${t.desc ? ' — ' + t.desc : ''}`).join('\n');
  const purposeList = ANDROID_PURPOSES.map(p => `${p.id}: ${p.label}`).join('\n');

  const prompt = `You are helping a mobile game developer complete the Google Play Data Safety form.

Developer's description of their data collection and sharing:
"${desc}"

Available data type IDs (id: label — description):
${typeList}

Available purpose IDs:
${purposeList}

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "selections": [
    {
      "typeId": "<exact data type id>",
      "collected": true,
      "shared": false,
      "ephemeral": false,
      "required": true,
      "purposes": ["<purpose id>", ...]
    }
  ]
}

Rules:
- Only include types clearly mentioned or strongly implied by the description.
- Set collected:true if the app collects this type, shared:true if shared with third parties.
- ephemeral:true only if data is never stored (only processed in memory).
- required:true if collection is mandatory for the app to function.
- Only include purposes that genuinely apply.
- Be conservative — omit rather than guess.`;

  try {
    const res = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key':                                 CLAUDE_API_KEY,
        'anthropic-version':                         '2023-06-01',
        'content-type':                              'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1000,
        messages:   [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    });

    if (!res.ok) throw new Error('API ' + res.status);
    const data    = await res.json();
    const text    = (data.content?.[0]?.text || '').trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed  = JSON.parse(cleaned);

    const validTypeIds    = new Set(ANDROID_DATA_TYPES.flatMap(g => g.types).map(t => t.id));
    const validPurposeIds = new Set(ANDROID_PURPOSES.map(p => p.id));
    const newPerType      = {};

    for (const sel of (parsed.selections || [])) {
      if (!validTypeIds.has(sel.typeId)) continue;
      const purposes = (sel.purposes || []).filter(p => validPurposeIds.has(p));
      newPerType[sel.typeId] = {
        collected: !!sel.collected,
        shared:    !!sel.shared,
        ephemeral: !!sel.ephemeral,
        required:  sel.required !== false,
        purposes,
      };
    }

    state.androidSubmitAnswers.dataPerType = newPerType;
    state.androidDataAIStatus = 'complete';
    state.androidMatrixExpanded = true;
  } catch (e) {
    console.warn('[Android Data AI]', e.message);
    state.androidDataAIStatus = 'error';
  }

  reRenderAndroidStepModal();
  updateAndroidCard();
}

/* ═══════════════════════════════════════════════════
   STEAM HANDLERS
   ═══════════════════════════════════════════════════ */

function reRenderSteamStepModal() {
  // Steam questionnaire also lives inline in the Game Details content pane;
  // re-render that pane in place when it's the active surface (mirrors reRenderStepModal).
  if (state.activeView === 'details' && state.details && state.details.section === 'content') {
    const pane = document.querySelector('.gd-pane--content');
    if (pane && typeof buildContentQuestionsPane === 'function') {
      pane.innerHTML = buildContentQuestionsPane();
      return;
    }
  }
  const bodyEl = document.getElementById('step-modal-body');
  const scrollTop = bodyEl ? bodyEl.scrollTop : 0;
  renderStepModal();
  const newBodyEl = document.getElementById('step-modal-body');
  if (newBodyEl) newBodyEl.scrollTop = scrollTop;
}

function updateSteamCard() {
  if (!state.activePlatforms.has('steam')) return;
  const checkSVG = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  PLATFORMS.steam.steps.forEach((step, i) => {
    const card = document.getElementById(`steam-step-card-${step.id}`);
    if (!card) return;
    const done = isSteamSectionComplete(step.id);
    card.classList.toggle('is-complete', done);
    const numEl = card.querySelector('.ios-step-num');
    if (numEl) {
      numEl.classList.toggle('is-done', done);
      numEl.classList.remove('is-risk-warn','is-risk-high');
      numEl.innerHTML = done ? checkSVG : String(i + 1);
    }
  });

  const counts = platformStepCount('steam');
  const submitCard = document.getElementById('steam-step-card-submit');
  if (submitCard) submitCard.classList.toggle('submit-step-locked', !counts.allRequired);
}

/* Toggle/answer helpers */
function answerSteamField(fieldId, value) {
  const current = state.steamSubmitAnswers[fieldId];
  state.steamSubmitAnswers[fieldId] = (current === value) ? null : value;
  reRenderSteamStepModal();
  updateSteamCard();
}

function answerSteamTextField(fieldId, value) {
  state.steamSubmitAnswers[fieldId] = value;
  updateSteamCard();
}

/* Unified handler for all Steam content survey yes/no items */
function answerSteamContentItem(itemId, value) {
  if (!state.steamSubmitAnswers.steamContentAnswers) {
    state.steamSubmitAnswers.steamContentAnswers = {};
  }
  const sca = state.steamSubmitAnswers.steamContentAnswers;
  const current = sca[itemId];
  const newVal  = (current === value) ? null : value;
  sca[itemId] = newVal;
  // Mark human-confirmed — removes AI badge
  state.steamAnswerMeta[itemId] = { ...(state.steamAnswerMeta[itemId] || {}), humanConfirmed: true };

  // Auto-cascade for mature declarations chain
  const CHAIN = ['gen_mature', 'some_nudity', 'freq_nudity', 'adult_sexual'];
  const idx = CHAIN.indexOf(itemId);
  if (idx !== -1) {
    if (newVal === 'yes') {
      // Set all preceding chain members to 'yes' if not already answered
      for (let i = 0; i < idx; i++) {
        if (!sca[CHAIN[i]]) sca[CHAIN[i]] = 'yes';
      }
    } else {
      // Set all following chain members to 'no'
      for (let i = idx + 1; i < CHAIN.length; i++) {
        sca[CHAIN[i]] = 'no';
      }
    }
  }
  // freq_violence also requires gen_mature
  if (itemId === 'freq_violence' && newVal === 'yes' && !sca['gen_mature']) {
    sca['gen_mature'] = 'yes';
  }

  reRenderSteamStepModal();
  updateSteamCard();
}

function toggleSteamAIType(typeId, checked) {
  const types = state.steamSubmitAnswers.aiLiveTypes;
  if (checked) { if (!types.includes(typeId)) types.push(typeId); }
  else { state.steamSubmitAnswers.aiLiveTypes = types.filter(t => t !== typeId); }
  reRenderSteamStepModal();
  updateSteamCard();
}

function toggleSteamTag(field, value, checked, maxCount) {
  const arr = state.steamSubmitAnswers[field];
  if (checked) {
    // Add only if under the cap
    if (arr.length < maxCount && !arr.includes(value)) arr.push(value);
    // If at cap, silently ignore (chip stays un-on; re-render shows correct state)
  } else {
    state.steamSubmitAnswers[field] = arr.filter(v => v !== value);
  }
  reRenderStepModal();
  updateSteamCard();
}

function toggleSteamPS(controllerId, checked) {
  const ps = state.steamSubmitAnswers.psControllers;
  if (checked) {
    if (controllerId === 'ps_none') {
      state.steamSubmitAnswers.psControllers = ['ps_none'];
    } else {
      state.steamSubmitAnswers.psControllers = ps
        .filter(c => c !== 'ps_none')
        .concat(ps.includes(controllerId) ? [] : [controllerId]);
      // Auto-select USB if BT+USB selected
      if (controllerId === 'ps_dualshock_bt' && !ps.includes('ps_dualshock_usb')) {
        state.steamSubmitAnswers.psControllers.push('ps_dualshock_usb');
      }
      if (controllerId === 'ps_dualsense_bt' && !ps.includes('ps_dualsense_usb')) {
        state.steamSubmitAnswers.psControllers.push('ps_dualsense_usb');
      }
    }
  } else {
    state.steamSubmitAnswers.psControllers = ps.filter(c => c !== controllerId);
  }
  reRenderSteamStepModal();
}

function toggleSteamAccessibility(featureId, checked) {
  const feats = state.steamSubmitAnswers.accessibilityFeatures;
  if (checked) { if (!feats.includes(featureId)) feats.push(featureId); }
  else { state.steamSubmitAnswers.accessibilityFeatures = feats.filter(f => f !== featureId); }
  updateSteamCard();
}

/* Retry inference for any platform+step */
async function _retryInference(pid, stepId) {
  // Questionnaire steps use the shared unified cache key
  if (stepId === 'questionnaire') {
    delete state.platformInferenceCache['unified:questionnaire'];
  } else {
    delete state.platformInferenceCache[pid + ':' + stepId];
  }
  state.stepModal.inferenceStatus = 'loading';
  state.stepModal.inferenceError  = null;
  const rerender = pid === 'android' ? reRenderAndroidStepModal
                 : pid === 'steam'   ? reRenderSteamStepModal
                 : reRenderStepModal;
  rerender();
  try {
    await runInference(pid, stepId);
    state.stepModal.inferenceStatus = 'done';
    _postInferenceSetup(stepId);
  } catch(err) {
    state.stepModal.inferenceStatus  = 'error';
    state.stepModal.inferenceError   = err.message;
  }
  rerender();
}

/* Post-inference setup: take filter snapshots + collapse to Unanswered for all active platforms */
function _postInferenceSetup(stepId) {
  if (stepId !== 'questionnaire') return;
  for (const p of ['ios', 'android', 'steam']) {
    if (!state.activePlatforms.has(p)) continue;
    takeFilterSnapshot(p);
    if (p === 'ios')     state.iosContentRatingExpanded     = false;
    if (p === 'android') state.androidContentRatingExpanded = false;
    if (p === 'steam')   state.steamContentRatingExpanded   = false;
  }
}

/* Show/hide the "See Prompt" debug overlay */
function showInferencePrompt() {
  const existing = document.getElementById('prompt-debug-overlay');
  if (existing) { existing.remove(); return; }

  const text = (state.lastInferencePrompt || '(no prompt stored yet)')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const overlay = document.createElement('div');
  overlay.id = 'prompt-debug-overlay';
  overlay.className = 'prompt-debug-overlay';
  overlay.innerHTML = `
    <div class="prompt-debug-modal">
      <div class="prompt-debug-header">
        <span class="prompt-debug-title">AI Inference Prompt</span>
        <button class="prompt-debug-close" onclick="document.getElementById('prompt-debug-overlay').remove()">✕</button>
      </div>
      <textarea class="prompt-debug-body" readonly spellcheck="false">${text}</textarea>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

/* ══════════════════════════════════════════════════════
   BUILD UPLOAD  (per-platform binary)
   ══════════════════════════════════════════════════════ */
function handleBuildUpload(pid, files) {
  const file = files?.[0];
  if (!file) return;
  state.platformBuilds = state.platformBuilds || { ios: null, android: null, steam: null };
  state.platformBuilds[pid] = { name: file.name, size: file.size };

  // Start 10-second fake binary analysis
  if (!state.platformBuildProcessing) state.platformBuildProcessing = { ios: false, android: false, steam: false };
  state.platformBuildProcessing[pid] = true;

  // Re-render immediately to show processing state
  _refreshBuildUI(pid);

  // Also re-render the open step modal (if Improve Your Submission is open)
  if (typeof reRenderStepModal === 'function') reRenderStepModal();

  setTimeout(() => {
    // Analysis complete — clear processing flag
    state.platformBuildProcessing[pid] = false;
    _refreshBuildUI(pid);
    if (typeof reRenderStepModal === 'function') reRenderStepModal();
  }, 10000);
}

// Re-render just the active platform card to reflect build/processing state changes
function _refreshBuildUI(pid) {
  const card = document.getElementById('active-card-' + pid);
  if (card) {
    if (pid === 'ios')          card.outerHTML = buildIOSActiveCard(pid);
    else if (pid === 'android') card.outerHTML = buildAndroidActiveCard(pid);
    else if (pid === 'steam')   card.outerHTML = buildSteamActiveCard(pid);
  } else {
    renderDashboard();
  }
}

/* ── Binary findings navigation ─────────────────────────────────────────────── */

// Advance to the next binary finding (called by "Got it" button)
function acknowledgeBinFinding(pid) {
  if (!state.binFindingIdx) state.binFindingIdx = { ios: 0, android: 0, steam: 0 };
  state.binFindingIdx[pid] = (state.binFindingIdx[pid] || 0) + 1;
  if (!state.binFindingFixExpanded) state.binFindingFixExpanded = {};
  state.binFindingFixExpanded[pid] = false;
  reRenderStepModal();
}

// Toggle the inline "View Fix" panel for the current binary finding
function toggleBinFindingFix(pid) {
  if (!state.binFindingFixExpanded) state.binFindingFixExpanded = {};
  state.binFindingFixExpanded[pid] = !state.binFindingFixExpanded[pid];
  reRenderStepModal();
}

/* ══════════════════════════════════════════════════════
   STORE PREVIEW FLIP NAVIGATION
   ══════════════════════════════════════════════════════ */

async function openStorePreviewSection(pid, target) {
  if (!state.storePreviewFlipTarget) state.storePreviewFlipTarget = { ios: null, android: null, steam: null };
  state.storePreviewFlipTarget[pid] = target;

  const modal = document.getElementById('submit-modal');
  // Business Questions never actually shows AI-inferred answers today (no
  // ai-badge/ai-confident treatment on any hasIAP/export-compliance field),
  // so re-running the shared "unified questionnaire" inference and taking
  // over the whole modal with the "Shipmate is working…" screen every time
  // someone opens it bought nothing but a multi-second wait — worse, it
  // also called _postInferenceSetup('questionnaire') on every open, which
  // resets iosContentRatingExpanded to false (Unanswered) and re-snapshots
  // hasIAP as "answered" the moment it has a value, permanently hiding the
  // question AND (before the buildIapSection fix below) the IAP Products
  // list behind the "All" toggle. Content Questions still needs this (it
  // has real AI answers to show), so it keeps re-inferring on every open.
  const needsInference = (target === 'content')
    && CLAUDE_API_KEY
    && !state.platformInferenceCache?.['unified:questionnaire'];

  // PHASE 1: flip-exit (card rotates away)
  if (modal) {
    modal.classList.add('is-flip-exit');
    await new Promise(r => setTimeout(r, 160));
    modal.classList.remove('is-flip-exit');
  }

  // PHASE 2: render content (loading screen or final), then flip-enter (card rotates in)
  if (needsInference) {
    state.stepModal = state.stepModal || {};
    state.stepModal.inferenceStatus = 'loading';
  }
  reRenderStepModal();

  if (modal) {
    modal.classList.add('is-flip-enter');
    await new Promise(r => setTimeout(r, 300)); // wait for enter animation to finish
    modal.classList.remove('is-flip-enter');
  }

  // PHASE 3: run inference with minimum 2s loading display
  if (needsInference) {
    const startTime = Date.now();
    try {
      delete state.platformInferenceCache['unified:questionnaire'];
      await runInference(pid, 'questionnaire');
      state.stepModal.inferenceStatus = 'done';
      _postInferenceSetup('questionnaire');
    } catch (err) {
      state.stepModal.inferenceStatus = 'error';
      state.stepModal.inferenceError = err.message === 'NO_KEY' ? 'No API key set.' : err.message;
    }
    // Enforce minimum 2s loading screen display
    const elapsed = Date.now() - startTime;
    if (elapsed < 2000) await new Promise(r => setTimeout(r, 2000 - elapsed));
    reRenderStepModal();
  }
}

function closeStorePreviewSection(pid) {
  if (!state.storePreviewFlipTarget) state.storePreviewFlipTarget = { ios: null, android: null, steam: null };

  const modal = document.getElementById('submit-modal');
  if (modal) {
    modal.classList.add('is-flip-exit');
    setTimeout(() => {
      state.storePreviewFlipTarget[pid] = null;
      reRenderStepModal();
      modal.classList.remove('is-flip-exit');
      modal.classList.add('is-flip-enter');
      setTimeout(() => modal.classList.remove('is-flip-enter'), 300);
    }, 160);
  } else {
    state.storePreviewFlipTarget[pid] = null;
    reRenderStepModal();
  }
}

/* ── Web self-distribution site field setters ─────────────
   Text fields update state silently (no re-render → no focus loss);
   the preview reflects changes when the user flips back. Accent
   swatch clicks re-render so the selection ring updates immediately. */
function setWebSiteField(key, value) {
  if (!state.webSite) state.webSite = {};
  state.webSite[key] = value;
}
/* The Web platform's "About This Game" field (state.webSite.aboutGame)
   defaults to Game Details' Description field (formData.description) and
   stays editable afterward like any other field — but unlike Hook (which
   only ever falls back to Steam's short_description when left blank),
   About This Game must keep tracking Description going forward: editing
   About This Game itself must never write back to Description, but any
   edit to Description — including after About This Game has already been
   customized — overwrites About This Game to match. Called from every
   place Description itself gets written (syncField, confirmGameImport,
   _fillDescriptionField, _applyFieldValue), not from render.js, per this
   codebase's "render.js never mutates state" rule. */
function _wsPropagateAboutGame(value) {
  if (!state.webSite) state.webSite = {};
  state.webSite.aboutGame = value || '';
}
function setWebAccent(color) {
  if (!state.webSite) state.webSite = {};
  state.webSite.accent = color;
  reRenderStepModal();
}

/* Factsheet > Developer > Links sub-section — the social-links list
   (state.webSite.links, each a { id, name, url } — see _wsLinkRowHTML in
   render.js and the state.js comment above webSite.links). Structural
   changes (add/remove a row) re-render the modal, same convention as
   setWebAccent above; typing into an existing row's name/url field mutates
   silently like setWebSiteField above, so it doesn't steal focus mid-type. */
function addWebLink() {
  if (!state.webSite) state.webSite = {};
  if (!state.webSite.links) state.webSite.links = [];
  state.webSite.links.push({ id: generateId('link'), name: '', url: '' });
  reRenderStepModal();
}
function removeWebLink(id) {
  if (!state.webSite || !state.webSite.links) return;
  state.webSite.links = state.webSite.links.filter(l => l.id !== id);
  reRenderStepModal();
}
function setWebLinkField(id, key, value) {
  if (!state.webSite || !state.webSite.links) return;
  const link = state.webSite.links.find(l => l.id === id);
  if (link) link[key] = value;
}

/* Selector in Web's "Key Art" section (buildWebKeyArtEditSection) choosing
   which Steam Key Art asset backs the preview website's capsule box —
   'capsuleImage' (state.uploads.steamCapsuleImage), 'headerImage'
   (state.uploads.steamHeaderImage), or 'igdbCoverArt'
   (state.uploads.steamKeyArtCapsule, the default). See
   _webCapsuleSourceField/buildWebSitePreviewSection in render.js for where
   this is read. reRenderStepModal() refreshes whichever step-modal content
   is currently open — the effect on the actual capsule box is only
   visible once the user flips back to the main preview (this selector
   lives inside the "Key Art" flip section, not the preview itself), same
   as setWebAccent above. */
function setWebCapsuleSource(source) {
  if (!state.webSite) state.webSite = {};
  state.webSite.capsuleSource = source;
  reRenderStepModal();
}

/* Steam: "Select Key Art" uploads (Capsule Image / Header Image / IGDB
   Cover Art / Library Hero) — single-image uploads with a live dataURL
   preview, same pattern as handleFeatureFiles/removeFeatureGraphic above.
   This is the canonical source for state.uploads.steamCapsuleImage/
   steamHeaderImage/steamKeyArtCapsule/steamKeyArtHero — the Web platform's
   read-only "Key Art" flip modal (buildWebKeyArtEditSection) links here
   via openSteamKeyArtFromWebEdit for all four fields, same relationship
   the Web platform's Trailers/Screenshots sub-sections have with
   Shipmate's Assets step. Each reRenderStepModal() call refreshes this
   modal (buildSteamKeyArtEditSection) and, once the user flips back, the
   Web preview's hero/capsule (buildWebSitePreviewSection) if that's
   currently open instead (only IGDB Cover Art/Library Hero feed that
   preview; Capsule Image/Header Image have no preview-website
   counterpart). */
function handleSteamKeyArtCapsuleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleSteamKeyArtCapsuleFiles(e.dataTransfer.files);
}
function handleSteamKeyArtCapsuleFiles(files) {
  const file = files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.uploads.steamKeyArtCapsule = { name: file.name, dataUrl: ev.target.result };
    reRenderStepModal();
  };
  reader.readAsDataURL(file);
}
function removeSteamKeyArtCapsule() {
  state.uploads.steamKeyArtCapsule = null;
  reRenderStepModal();
}

function handleSteamKeyArtHeroDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleSteamKeyArtHeroFiles(e.dataTransfer.files);
}
function handleSteamKeyArtHeroFiles(files) {
  const file = files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.uploads.steamKeyArtHero = { name: file.name, dataUrl: ev.target.result };
    reRenderStepModal();
  };
  reader.readAsDataURL(file);
}
function removeSteamKeyArtHero() {
  state.uploads.steamKeyArtHero = null;
  reRenderStepModal();
}

function handleSteamKeyArtCapsuleImageDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleSteamKeyArtCapsuleImageFiles(e.dataTransfer.files);
}
function handleSteamKeyArtCapsuleImageFiles(files) {
  const file = files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.uploads.steamCapsuleImage = { name: file.name, dataUrl: ev.target.result };
    reRenderStepModal();
  };
  reader.readAsDataURL(file);
}
function removeSteamKeyArtCapsuleImage() {
  state.uploads.steamCapsuleImage = null;
  reRenderStepModal();
}

function handleSteamKeyArtHeaderImageDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('is-over');
  handleSteamKeyArtHeaderImageFiles(e.dataTransfer.files);
}
function handleSteamKeyArtHeaderImageFiles(files) {
  const file = files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.uploads.steamHeaderImage = { name: file.name, dataUrl: ev.target.result };
    reRenderStepModal();
  };
  reader.readAsDataURL(file);
}
function removeSteamKeyArtHeaderImage() {
  state.uploads.steamHeaderImage = null;
  reRenderStepModal();
}

/* Jumps from the Web platform's read-only "Key Art" flip modal to Steam's
   "Select Key Art" section (Store Page Preview step) — a cross-platform
   detour. Caller closes Web's step modal first (see _wsKeyArtFieldsHTML's
   onclick). */
async function openSteamKeyArtFromWebEdit() {
  state.steamKeyArtFromWebEdit = true;
  await openStepModal('steam', 'storePreview');
  await openStorePreviewSection('steam', 'keyArt');
}

/* "Save & Return to Web" button on Steam's Key Art flip modal when it was
   opened via openSteamKeyArtFromWebEdit — returns to Web's Key Art modal
   instead of Steam's own Store Page Preview. See the submit-modal-footer
   logic in renderStepModal (render.js). */
async function backFromSteamKeyArtToWebEdit() {
  state.steamKeyArtFromWebEdit = false;
  closeStepModal();
  await openStepModal('web', 'storePreview');
  await openStorePreviewSection('web', 'webKeyArt');
}

/* ══════════════════════════════════════════════════════
   SCREENSHOT STEP  (per-platform selection + uploads)
   ══════════════════════════════════════════════════════ */

// Toggle selection of an onboarding screenshot for a platform
function togglePlatformScreenshot(pid, shotId) {
  if (!state.platformScreenshots) state.platformScreenshots = { ios:{selected:[],custom:[]}, android:{selected:[],custom:[]}, steam:{selected:[],custom:[]} };
  const ps = state.platformScreenshots[pid];
  const idx = ps.selected.indexOf(shotId);
  if (idx >= 0) {
    ps.selected.splice(idx, 1);
  } else {
    ps.selected.push(shotId);
  }
  // Re-render just the screenshot step body in the open modal
  const body = document.getElementById('step-modal-body');
  if (body) {
    const inner = body.querySelector('.ios-step-body-content');
    if (inner) inner.innerHTML = buildScreenshotsSection(pid);
  }
  // Also update the step card complete state
  const cardEl = document.getElementById((pid === 'ios' ? 'ios' : pid) + '-step-card-screenshots');
  if (cardEl) renderDash();
}

// Handle new platform-specific screenshot file uploads
function handlePlatformScreenshotFiles(pid, files) {
  if (!files || !files.length) return;
  if (!state.platformScreenshots) state.platformScreenshots = { ios:{selected:[],custom:[]}, android:{selected:[],custom:[]}, steam:{selected:[],custom:[]} };
  const ps = state.platformScreenshots[pid];
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const id = 'pshot-' + pid + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
      ps.custom = ps.custom || [];
      ps.custom.push({ id, name: file.name, dataUrl: ev.target.result });
      // Re-render modal body
      const body = document.getElementById('step-modal-body');
      if (body) {
        const inner = body.querySelector('.ios-step-body-content');
        if (inner) inner.innerHTML = buildScreenshotsSection(pid);
      }
    };
    reader.readAsDataURL(file);
  });
}

// Remove a platform-specific custom screenshot
function removePlatformScreenshot(pid, shotId) {
  if (!state.platformScreenshots?.[pid]) return;
  state.platformScreenshots[pid].custom = (state.platformScreenshots[pid].custom || []).filter(s => s.id !== shotId);
  const body = document.getElementById('step-modal-body');
  if (body) {
    const inner = body.querySelector('.ios-step-body-content');
    if (inner) inner.innerHTML = buildScreenshotsSection(pid);
  }
}
