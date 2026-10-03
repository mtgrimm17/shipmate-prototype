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

     upfBuild(pid)                — the "Build from Steam" pill that
       buildBuildDropdown draws for the Mac App Store platform once a game is
       matched. Runs prepare ONLY (transform, sign, package) on the agent — no
       Apple account needed — and records the finished local .pkg in
       state.platformBuilds exactly as a dragged-in file would be, marked
       uploaded:false. Build is deliberately split from upload: a dev can build
       early, fill everything out, and connect their account only near the end.

     upfPublish(pid) / _upfMaybePublish(pid) — the account-connected half. The
       moment a local UPF build exists AND the platform's account is connected,
       the build uploads to App Store Connect and its Game Center achievements
       are created + released (op_publish). Upload is not submit: the build then
       sits in ASC until the user's Submit press distributes it to a track.

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
  built:    false,  // a local .pkg exists for this run (prepare finished)
  uploaded: false,  // that build has reached App Store Connect (publish finished)
  result:   null,   // { buildVersion, buildId } after upload; { built:true } after build
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

  /* Connect wizard: hand the entered App Store Connect key to the local helper,
     which stores it and verifies it with a live call. Returns {ok, verified,
     teamId} or {ok:false, error}. Never throws. */
  async saveAccount(payload) {
    try {
      return await this._post('/account', payload);
    } catch (e) {
      return { ok: false, error: (e && e.message) || 'Could not reach App Store Connect.' };
    }
  },

  /* One probe per page load. A failed probe is remembered as `false` so a
     machine without the agent never pays for a second connection attempt. */
  async health() {
    if (state.upf.agent) return state.upf.agent;   // cache only a SUCCESSFUL probe;
    // null or false both re-probe, so an agent that starts after the page loaded is noticed.
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
    /* Repaint here, not only from ensureMatch's caller: a match that lands any
       other way (a manual call, or upfOnSteamGame) must also swap the pill for
       the panel. Cheap, and the render is already finished by the time this
       async resolves. */
    if (typeof _upfRepaintAll === 'function') _upfRepaintAll();
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

  isMacPid(pid) { return UPF_MAC_PIDS.includes(pid); },

  /* Ask the Shipmate browser extension to run one of the two App Store Connect
     web tasks Apple gives no API for — 'createApp' (the apprecord build step) or
     'autoPrivacy' (when the App Privacy step closes). The extension opens a
     background ASC tab, fills it and closes it. A no-op if the extension isn't
     installed (the message just goes unheard). */
  requestAscTask(task, opts) {
    opts = opts || {};
    try { window.postMessage({ __shipmate: 'ascTask', task: task, submit: !!opts.submit, appId: opts.appId, bundleId: opts.bundleId }, '*'); } catch (_) {}
  },

  /* The "Create your app" build step: register the bundle ID in the Developer
     Portal FIRST (so it shows up in App Store Connect's New App dropdown), then
     run the createApp extension script. Without the register, the brand-new
     bundle wouldn't be selectable and createApp couldn't finish. */
  async _createAppStep(pid) {
    const toast = (m) => { if (typeof bcToast === 'function') bcToast(m); };
    try {
      toast('Registering your bundle ID…');
      const r = await this._post('/registerbundle', { game: state.upf.game && state.upf.game.app });
      if (!r || !r.ok) {
        const why = (r && r.problems && r.problems.length) ? r.problems.join('; ') : ((r && r.error) || 'could not register the bundle ID');
        toast('Create app: ' + why + ' — open App Store Connect to finish.');
        state.upf._creatingApp = false;
        return;
      }
      if (r.ascAppId) state.upf.ascAppId = r.ascAppId;   // remember for App Privacy
      // If an app already exists for this bundle, this is an UPDATE (new build to
      // the existing entry) — the record's already there, so skip createApp.
      if (r.appExists) {
        toast('App already exists in App Store Connect — using it.');
        state.upf._creatingApp = false;
        if (typeof upfMarkStep === 'function') upfMarkStep(pid, 'appRecord');
        return;
      }
      toast('Bundle ID ready — creating the app record…');
      // Pass the agent-registered bundle ID through (Shipmate's cached manifest
      // may not carry it), so the extension selects the right one.
      this.requestAscTask('createApp', { submit: true, bundleId: r.bundleId });
    } catch (e) {
      state.upf._creatingApp = false;
      toast('Create app: ' + ((e && e.message) || e) + ' — open App Store Connect to finish.');
    }
  },

  /* Fill the ASC App Privacy questionnaire via the extension. Resolve the app's
     ASC id first (needed to build the privacy deep link) — from what we already
     know, else a quick read-only /appstatus — then hand off. */
  async fillPrivacyInAsc(pid) {
    let appId = state.upf && state.upf.ascAppId;
    if (!appId) {
      try {
        const s = await this._post('/appstatus', { game: state.upf.game && state.upf.game.app });
        if (s && s.ascAppId) { appId = s.ascAppId; state.upf.ascAppId = appId; }
      } catch (_) {}
    }
    this.requestAscTask('autoPrivacy', { appId: appId });   // appId may be undefined → extension falls back
  },

  /* The extension reports back here (relayed by content-shipmate → window). For
     createApp, a real creation (result.created) marks the apprecord step done
     and lets the build continue; anything else is surfaced so the developer can
     finish it by hand. */
  _onAscTaskResult(task, result) {
    const u = state.upf || {};
    const toast = (m) => { if (typeof bcToast === 'function') bcToast(m); };
    if (task === 'createApp') {
      const pid = u._creatingAppPid || this.connectedMac();
      u._creatingApp = false;
      if (result && result.created) {
        toast('App record created in App Store Connect.');
        if (typeof upfMarkStep === 'function' && pid) upfMarkStep(pid, 'appRecord');
      } else {
        toast('Create app: ' + ((result && result.error) || 'couldn’t create it automatically') + ' — open App Store Connect to finish.');
      }
    } else if (task === 'autoPrivacy') {
      if (result && result.ok) toast('App Privacy filled in App Store Connect.');
      else toast('App Privacy: ' + ((result && result.error) || 'could not fill') + ' — check App Store Connect.');
    }
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

  /* Shipmate language code → App Store Connect locale. Shipmate stores short
     codes (en, fr, pt-BR, zh-TW, es-419…); ASC wants its own locale strings. A
     code with no mapping is skipped rather than sent as an invalid locale. */
  _ascLocale(lang) {
    const M = {
      en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', 'es-419': 'es-MX',
      pt: 'pt-PT', 'pt-BR': 'pt-BR', zh: 'zh-Hans', 'zh-TW': 'zh-Hant',
      ja: 'ja', ko: 'ko', ru: 'ru', it: 'it', nl: 'nl-NL', pl: 'pl',
      sv: 'sv', nb: 'no', da: 'da', fi: 'fi', cs: 'cs', hu: 'hu', ro: 'ro',
      uk: 'uk', vi: 'vi', ms: 'ms', he: 'he', el: 'el', ar: 'ar-SA',
      tr: 'tr', id: 'id', th: 'th',
    };
    return M[lang] || null;
  },

  /* The per-store listing object that owns the text for a Mac platform:
     macos_full keeps its own, macos/ios share title/subtitle through formData
     and keep the rest on macAppStoreListing. */
  _listingText(pid, lang, isPrimary) {
    const f = state.formData || {};
    const full = (pid === 'macos_full');
    const store = full ? state.macFullAppStoreListing : state.macAppStoreListing;
    if (!isPrimary) {
      const o = store && store.localizedStoreText && store.localizedStoreText[lang];
      if (!o) return null;
      const t = { title: o.title, subtitle: o.subtitle, description: o.description, releaseNotes: o.releaseNotes };
      return (t.title || t.subtitle || t.description || t.releaseNotes) ? t : null;
    }
    // Primary language — top-level fields (title/subtitle shared from formData for
    // macos; self-owned for macos_full).
    if (full) {
      const L = store || {};
      return { title: L.title || f.title, subtitle: L.subtitle || f.subtitle,
               description: L.description || f.description, releaseNotes: L.releaseNotes || f.releaseNotes };
    }
    const L = store || {};
    return { title: f.title, subtitle: f.subtitle,
             description: (state.appStoreListing && state.appStoreListing.description) || f.description,
             releaseNotes: L.releaseNotes || f.releaseNotes };
  },

  /* macos_full's own extra listing fields (keywords/promo/marketing/copyright).
     Only macos_full collects these; macos/ios return nothing for them. */
  _fullListing(pid) {
    if (pid === 'macos_full') return state.macFullAppStoreListing || {};
    if (pid === 'macos')      return state.macAppStoreListing || {};   // consolidated listing metadata
    return {};
  },

  /* Secondary category (macos_full only) → an ASC appCategory id. Shipmate stores
     a display label ("Entertainment", "Photo & Video"); ASC ids are the label
     upper-cased with " & " → "_AND_" and spaces → "_". The agent validates the id
     against Apple's live list and skips an unknown one, so this is safe. */
  _secondaryCategory(pid) {
    let sec = null;
    if (pid === 'macos_full') {
      sec = state.macFullSubmitAnswers && state.macFullSubmitAnswers.category
        && state.macFullSubmitAnswers.category.secondary;
    } else if (pid === 'macos') {
      sec = state.macAppStoreListing && state.macAppStoreListing.secondaryCategory;
    }
    if (!sec) return null;
    return String(sec).trim().toUpperCase().replace(/\s*&\s*/g, '_AND_').replace(/\s+/g, '_');
  },

  /* The platform's ordered, selected screenshots as the agent can consume them:
     data: URLs become base64 bytes, remote URLs are passed for the agent to
     fetch. Mac screenshots are one display type (APP_DESKTOP). Capped at 10. */
  _screenshots(pid) {
    if (typeof platformStoreShots !== 'function' || typeof _screenshotSrc !== 'function') return null;
    let entries;
    try { entries = platformStoreShots(pid) || []; } catch (_) { return null; }
    const out = [];
    entries.slice(0, 10).forEach((e, i) => {
      let src = '';
      try { src = _screenshotSrc(e) || ''; } catch (_) { src = ''; }
      if (!src) return;
      const fileName = (e && e.name) || ('screenshot-' + (i + 1) + '.png');
      if (src.slice(0, 5) === 'data:') {
        const comma = src.indexOf(',');
        const data = comma >= 0 ? src.slice(comma + 1) : '';
        if (data) out.push({ fileName, data, displayType: 'APP_DESKTOP' });
      } else if (/^https?:/i.test(src)) {
        out.push({ fileName, url: src, displayType: 'APP_DESKTOP' });
      }
    });
    return out.length ? out : null;
  },

  /* The /populate listing block for ONE locale. `appLevel` (true only for the
     primary locale) carries the app-wide fields — category, copyright, age
     rating, privacy, screenshots — that are not per-locale, plus the macos_full
     keywords/promo/marketing (Shipmate has no per-locale copies of those).
     Returns null for a locale it can't map or has no text for, so it is skipped. */
  buildListing(pid, lang, appLevel) {
    const f = state.formData || {};
    const primaryLang = f.primaryLanguage || 'en';
    if (lang == null) { lang = primaryLang; appLevel = true; }
    const isPrimary = (lang === primaryLang);
    const locale = this._ascLocale(lang);
    if (!locale) return null;
    const t = this._listingText(pid, lang, isPrimary);
    if (!t) return null;
    const full = this._fullListing(pid);

    const listing = {
      locale,
      name: t.title || undefined,
      subtitle: t.subtitle || undefined,
      description: t.description || undefined,
      whatsNew: t.releaseNotes || undefined,
      supportUrl: (full.supportUrl || f.supportUrl) || undefined,
      privacyPolicyUrl: f.privacyUrl || this._answer(pid, 'privacyPolicyUrl') || undefined,
    };
    // Keywords / promo / marketing are single-valued in Shipmate (no per-locale
    // copies), so only attach them to the primary locale.
    if (isPrimary) {
      if (full.keywords)        listing.keywords = full.keywords;
      if (full.promotionalText) listing.promotionalText = full.promotionalText;
      if (full.marketingUrl)    listing.marketingUrl = full.marketingUrl;
    }
    if (appLevel) {
      listing.primaryCategory = 'GAMES';   // Shipmate only submits games
      const sec = this._secondaryCategory(pid); if (sec) listing.secondaryCategory = sec;
      if (full.copyright) listing.copyright = full.copyright;
      const ar = this._ageRating(pid); if (ar) listing.ageRating = ar;
      const pr = this._privacy(pid); if (pr) listing.privacy = pr;
      const shots = this._screenshots(pid); if (shots) listing.screenshots = shots;
    }
    return listing;
  },

  /* Push to ASC for every connected Mac platform. Debounced, non-blocking, and
     a no-op unless the agent is up, the game is matched, and an account is
     connected. `reason` is for the toast/log only. */
  _syncTimer: null,
  _lastSaveCtx: null,
  sync(reason, ctxPid) {
    // ctxPid: the platform whose step/sub-step was just saved, so the
    // not-connected toast only fires for Mac saves (not when an unrelated Steam
    // or iOS step is saved while a Mac platform happens to be active).
    if (ctxPid !== undefined) this._lastSaveCtx = ctxPid;
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this._syncNow(reason), 800);
  },
  async _syncNow(reason) {
    try {
      /* A save on a Mac platform should always ATTEMPT to sync and, when it
         can't, say why — a matched game is NOT required to explain. This
         replaces the old persistent "Saved locally" note. onMac keys off the
         saved platform (passed to sync()); with no context it falls back to
         "any Mac platform active". */
      const ctx = this._lastSaveCtx;
      const onMac = ctx ? UPF_MAC_PIDS.includes(ctx)
                        : UPF_MAC_PIDS.some(p => state.activePlatforms && state.activePlatforms.has && state.activePlatforms.has(p));
      const toast = (m) => { if (onMac && typeof bcToast === 'function') bcToast(m); };

      const pid = this.connectedMac();
      if (!pid) {
        // No App Store account connected (the stubbed Settings sign-in is the
        // signal that the agent should push with the credentials it holds).
        toast('Connect your App Store account in Settings to sync to App Store Connect.');
        return;
      }
      if (!state.upf.game) {
        // Connected, but Shipmate hasn't matched this title to a local build yet
        // — nothing to attach the metadata to until it does.
        toast('No game detected yet — your entries will sync to App Store Connect once Shipmate matches your game.');
        return;
      }
      if (!(await this.health())) {
        toast('Shipmate couldn’t reach App Store Connect just now — your changes are saved and will sync when the connection is back.');
        return;
      }
      /* Push the primary locale (which carries the app-wide fields — category,
         copyright, age rating, privacy, screenshots) then each additional
         localization the developer added, text-only. The agent writes one locale
         per /populate call. */
      const f = state.formData || {};
      const primaryLang = f.primaryLanguage || 'en';
      const langs = [primaryLang].concat((f.localizations || []).filter(l => l && l !== primaryLang));
      this._shotHash = this._shotHash || {};
      let pushed = 0, shotHash = null, sentShots = false;
      for (const lang of langs) {
        const isPrimary = lang === primaryLang;
        const listing = this.buildListing(pid, lang, isPrimary);
        if (!listing) continue;                    // unmapped locale, or no text for it
        /* Screenshots are additive on the agent (it reserves up to 10 without
           content dedup), and sync() runs on every save — so only send them when
           they have actually changed since the last successful upload. */
        if (isPrimary && listing.screenshots) {
          shotHash = JSON.stringify(listing.screenshots.map(s => (s.fileName || '') + ':' + (s.data ? s.data.length : (s.url || ''))));
          if (this._shotHash[pid] === shotHash) delete listing.screenshots;
          else sentShots = true;
        }
        const r = await this._post('/populate', { game: state.upf.game.app, listing });
        if (r && r.job) await this.waitJob(r.job, () => {});
        pushed++;
      }
      if (sentShots && shotHash) this._shotHash[pid] = shotHash;
      if (pushed && typeof bcToast === 'function') bcToast(`Synced to App Store Connect${reason ? ' (' + reason + ')' : ''}.`);
      // In-app purchases → ASC (needs no build; rides with the metadata sync).
      // Change-guarded so an idle save doesn't re-walk every product.
      try {
        const iaps = this.iapForBuild(pid);
        const ih = JSON.stringify(iaps.map(p => [p.key, p.name, p.description, p.type]));
        this._iapHash = this._iapHash || {};
        if (iaps.length && this._iapHash[pid] !== ih) {
          this._iapHash[pid] = ih;
          const ir = await this._post('/iap', { game: state.upf.game.app, products: iaps });
          if (ir && ir.job) await this.waitJob(ir.job, () => {});
        }
      } catch (e) { console.warn('[UPF] IAP sync failed', e); }
      // Game Center leaderboards → ASC (needs no build). Change-guarded.
      try {
        const lbs = this.leaderboardsForBuild();
        const lh = JSON.stringify(lbs.map(l => [l.key, l.name, l.gcId, l.scoreFormat]));
        this._lbHash = this._lbHash || {};
        if (lbs.length && this._lbHash[pid] !== lh) {
          this._lbHash[pid] = lh;
          const lr = await this._post('/leaderboards', { game: state.upf.game.app, leaderboards: lbs });
          if (lr && lr.job) await this.waitJob(lr.job, () => {});
        }
      } catch (e) { console.warn('[UPF] leaderboard sync failed', e); }
      // Pricing + App Review info → ASC. Mandatory before a submission is
      // accepted; app/version-level, so once per sync (not per locale), and
      // change-guarded so an idle save doesn't re-POST the price schedule.
      try {
        const prep = this.submitPrepData(pid);
        const ph = JSON.stringify(prep);
        this._prepHash = this._prepHash || {};
        if (this._prepHash[pid] !== ph) {
          this._prepHash[pid] = ph;
          const pr = await this._post('/submitprep', { game: state.upf.game.app, data: prep });
          if (pr && pr.job) await this.waitJob(pr.job, () => {});
        }
      } catch (e) { console.warn('[UPF] submit-prep sync failed', e); }
      // A build may be waiting on this now-connected account.
      try { _upfMaybePublish(pid); } catch (_) {}
      // Achievement text edited after the build → push it to Game Center (no rebuild).
      // Only once the build is uploaded (the achievements exist in ASC) and only when
      // the text actually changed, so an idle save doesn't re-walk every achievement.
      try {
        const b = (state.platformBuilds || {})[pid];
        if (b && b.source === 'upf' && b.uploaded) {
          const achs = this.achievementsForBuild(pid);
          const h = JSON.stringify(achs.map(a => [a.identifier, a.name, a.description, a.hidden, a.image ? (a.image.data ? a.image.data.length : a.image.url) : 0]));
          this._gcHash = this._gcHash || {};
          if (achs.length && this._gcHash[pid] !== h) {
            this._gcHash[pid] = h;
            const gr = await this._post('/gcsync', { game: state.upf.game.app, achievements: achs });
            if (gr && gr.job) await this.waitJob(gr.job, () => {});
          }
        }
      } catch (e) { console.warn('[UPF] achievement sync failed', e); }
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
      if (j.state === 'failed') throw new Error(j.error || 'The build could not be completed.');
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

  /* Match lazily for a project whose game was chosen before this page loaded
     (selectPicklistItem never ran, so upfOnSteamGame never did). Self-healing
     with a THROTTLE, not a one-shot: an earlier attempt that set the game to
     null (agent not ready yet, a transient /library error) must not block every
     later try — that is exactly the stuck state seen in the field
     (_matchedAppId pinned to the id, game still null, nothing retrying). So a
     repeat of the same id is allowed again after _matchRetryMs; a game that is
     genuinely matched stops on its own (the first guard returns once game is
     set). `_matching` stops concurrent renders double-firing. */
  _matching: false,
  _matchedAppId: null,
  _lastMatchTry: 0,
  _matchRetryMs: 4000,
  ensureMatch() {
    if (state.upf.game || state.upf.job || this._matching) return;
    if (!state.upf.agent) return;                 // wait until the agent is confirmed up
    const appId = this.currentSteamAppId();
    if (!appId) return;
    if (String(appId) === String(this._matchedAppId) && (Date.now() - this._lastMatchTry) < this._matchRetryMs) return;
    this._matching = true;
    this._matchedAppId = String(appId);
    this._lastMatchTry = Date.now();
    this.match(appId, state.formData?.title || '')
      .then(g => { if (g) _upfRepaintAll(); })     // match() also repaints; harmless twice
      .catch(e => console.warn('[UPF] match failed', e))
      .finally(() => { this._matching = false; });
  },

  isMac(pid) { return UPF_MAC_PIDS.includes(pid); },

  /* Drive the lazy match from a render without building any HTML. Called by the
     compact step row so a Steam build is noticed (and the row flips to "Build
     from Steam") without anything being opened. Probes health when the agent
     isn't known-up yet, then asks ensureMatch — which is throttled, so this is
     cheap to call every render. */
  driveMatch(pid) {
    if (!this.isMac(pid)) return;
    const u = state.upf;
    if (u.agent === false || u.agent === null) {
      const wasUnknown = (u.agent === null);
      this.health().then(h => {
        if (h) this.ensureMatch();
        // Agent just confirmed DOWN (was unknown): repaint so a "checking" row
        // falls to the Upload pill instead of spinning forever.
        else if (wasUnknown && typeof _upfRepaintAll === 'function') _upfRepaintAll();
      });
      return;
    }
    if (!u.game) this.ensureMatch();
  },

  /* True when the Upload Build step should present as "Build from Steam": the
     agent is up, this game is matched to the local Steam library, and no
     ordinary (non-UPF, finished) build is already standing in. Mirrors
     upfBuildPanelHTML's own guards so the row and the panel never disagree — a
     UPF build that is running, built-and-waiting, or done keeps the row (the
     modal shows its status). */
  buildReady(pid) {
    if (!this.isMac(pid)) return false;
    const u = state.upf;
    if (!u.agent || !u.game) return false;
    const existing = (state.platformBuilds || {})[pid];
    const upfPending = !!(existing && existing.source === 'upf' && !existing.uploaded);
    if (existing && !upfPending && !u.job && !u.result) return false;
    return true;
  },

  /* Are we still deciding whether a Steam build exists for this game? True while
     the answer is genuinely unknown: a mac platform with a Steam app-id, the
     agent not confirmed down, no game matched yet, and the match either in
     flight or not yet attempted for this id. In that window the row shows a
     quiet spinner instead of the Upload pill, so an agent user never sees the
     pill flash to the clickable row once the match lands. Once the match has
     been attempted and produced no game (agent up, not in the library), this
     goes false and the Upload pill stands. */
  buildChecking(pid) {
    if (!this.isMac(pid)) return false;
    const u = state.upf;
    if (u.game) return false;                 // matched → buildReady owns it
    if (u.agent === false) return false;      // no agent → straight to the pill
    const appId = this.currentSteamAppId();
    if (!appId) return false;                 // no Steam id → nothing to match
    if (this._matching) return true;          // a match is running
    return String(this._matchedAppId) !== String(appId);  // not yet attempted for this id
  },

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
        const out = { identifier: a.identifier, name: a.name, description: a.description || '', hidden: !!(own && own.hidden) };
        // Achievement art is stored on the GC record as image.dataUrl — which is
        // EITHER an inline data: URL (user-uploaded) or a remote Steam CDN URL
        // (scraped: `image: {dataUrl: iconUrl}`). Send base64 for the former, a
        // URL for the latter (the agent downloads it, like screenshots).
        const src = own && own.image && own.image.dataUrl;
        const fileName = a.identifier + '.png';
        if (src && src.slice(0, 5) === 'data:') {
          const comma = src.indexOf(',');
          const data = comma >= 0 ? src.slice(comma + 1) : '';
          if (data) out.image = { fileName, data };
        } else if (src && /^https?:/i.test(src)) {
          out.image = { fileName, url: src };
        }
        return out;
      });
  },

  /* Shipmate's in-app products → the agent's /iap payload. Consumable /
     non-consumable / non-renewing only; auto-renewable is a subscription (its
     own ASC resource, handled in the subscriptions pass). The agent derives the
     ASC product id from the bundle id + a slug of the name. */
  iapForBuild(pid) {
    const ans = (typeof _appStoreAnswers === 'function') ? _appStoreAnswers(pid) : null;
    const products = (ans && ans.iapProducts) || [];
    const TYPE = { consumable: 'CONSUMABLE', 'non-consumable': 'NON_CONSUMABLE', 'non-renewing': 'NON_RENEWING_SUBSCRIPTION' };
    return products
      .filter(p => TYPE[p.type] && (p.name || '').trim())
      .map(p => ({ key: p.id, name: p.name, description: p.desc || '', type: TYPE[p.type], price: p.price || '' }));
  },

  /* Shipmate's Game Center leaderboards → the agent's /leaderboards payload.
     Collected only on the Mac App Store Full step (state.macFullSubmitAnswers.
     gameCenter.leaderboards); Game Center is per-app, so these apply to the one
     app the bundle id resolves to. */
  leaderboardsForBuild() {
    const gc = state.macFullSubmitAnswers && state.macFullSubmitAnswers.gameCenter;
    const lbs = (gc && gc.leaderboards) || [];
    return lbs
      .filter(l => (l.name || '').trim())
      .map(l => ({ key: l.id, name: l.name, gcId: l.gcId || '', scoreFormat: l.scoreFormat || 'Integer' }));
  },

  /* Shipmate's pricing + App Review info → the agent's /submitprep payload. Both
     are app/version-level (not per-locale) and mandatory before ASC will accept a
     submission. Price is game-wide (state.formData.price); the review contact and
     demo account come off whichever Mac platform is connected — read through
     _appStoreAnswers(pid) so this works for the regular Mac App Store card
     (macSubmitAnswers) now that Mac App Store Full is hidden, and still for
     macos_full if it is ever used. */
  submitPrepData(pid) {
    const f = state.formData || {};
    const a = ((typeof _appStoreAnswers === 'function') ? _appStoreAnswers(pid) : null)
              || state.macSubmitAnswers || {};
    const rc = a.reviewContact || {};
    const da = a.demoAccount || {};
    // The Mac price is stored per-platform (macSubmitAnswers.price via
    // setAppStorePrice) — NOT in formData.price, which stays empty for Mac. Read
    // it through _appStorePrice so an entered price (e.g. 6.99) isn't lost and
    // the app isn't silently set Free.
    const priceRaw = (typeof _appStorePrice === 'function') ? _appStorePrice(pid)
                     : (a.price != null && a.price !== '' ? a.price : f.price);
    const priceStr = (priceRaw === '' || priceRaw == null) ? '0' : String(priceRaw);
    const isFree = priceStr === '0' || parseFloat(priceStr) === 0;
    return {
      priceModel: a.priceModel || (isFree ? 'free' : 'paid'),
      price: priceStr,
      availability: a.availability || { mode: 'all', countries: [] },
      contentRights: a.contentRights || null,   // 'yes' / 'no' → ASC contentRightsDeclaration
      review: {
        contact: { firstName: rc.firstName || '', lastName: rc.lastName || '', phone: rc.phone || '', email: rc.email || '' },
        demo: { required: da.required === 'yes', username: da.username || '', password: da.password || '' },
        notes: a.reviewNotes || '',
      },
    };
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

  /* The account was just connected for a Mac platform: push the entered data to
     ASC and, if a local build is already waiting, upload it. Both are no-ops
     unless their conditions hold, so this is safe to call on every connect. */
  onConnected(pid) {
    this.sync('account connected');
    // The developer just cleared the Connect step — take over and continue:
    // build now if nothing is built, or upload if a build is waiting.
    try { upfAdvance(pid); } catch (_) {}
  },

  /* Open the account sign-in over the modal (the browser-framed connect flow).
     Used by the Connect step's alert; completing it lands in connectAdd →
     onConnected, which resumes the build. */
  startConnect(pid) {
    try {
      state.extensionInstalled = true;
      if (typeof _setConnectStage === 'function') _setConnectStage(pid, 'signin');
      if (typeof openAscLogin === 'function') { openAscLogin(pid); return; }
      if (typeof connectInstall === 'function') connectInstall(pid);
    } catch (_) {}
  },
};

/* state.activePlatforms is a Set (see state.js / app.js — every assignment is
   `new Set(...)`), so it has .has, NOT .includes. This was THE bug behind the
   whole Build-from-Steam repaint saga: _upfRepaintAll guarded on
   `.includes && .includes(pid)`, which is undefined on a Set, so the guard was
   always false and _refreshBuildUI never ran — every match succeeded and
   silently failed to repaint. Tolerate an array too, in case it is ever
   serialized back to one. */
function _upfActive(pid) {
  const a = state.activePlatforms;
  if (!a) return false;
  if (typeof a.has === 'function') return a.has(pid);
  if (typeof a.includes === 'function') return a.includes(pid);
  return false;
}

function _upfRepaintAll() {
  let prefilled = false;
  for (const pid of UPF_MAC_PIDS) {
    if (_upfActive(pid)) {
      if (UPF.prefillEncryption(pid)) prefilled = true;
      if (typeof _refreshBuildUI === 'function') _refreshBuildUI(pid);
      _upfMaybePublish(pid);   // a build may be waiting on a now-connected account
    }
  }
  if (prefilled && typeof refreshGuideCompletion === 'function') refreshGuideCompletion();
}

/* WARM UP EARLY so the Game Build step is already in its clickable state the
   first time Submission is drawn — otherwise the row is seen to change from the
   Upload pill to the clickable row once the async match lands. Probe health and
   drive the match, retrying a few times while the agent (or the Steam app-id) is
   still settling; stop as soon as the game is matched or the agent is confirmed
   down. match() repaints on success, so a card already on screen also updates. */
(function _upfWarmup() {
  let tries = 0;
  const tick = () => {
    try {
      if (state.upf.game || state.upf.agent === false || tries >= 8) return;
      tries++;
      UPF.health().then(h => { if (h) UPF.ensureMatch(); }).finally(() => setTimeout(tick, 1000));
    } catch (_) {}
  };
  setTimeout(tick, 300);
})();

/* Touchpoint 1 — fire-and-forget from selectPicklistItem. Never renders: the
   matched game only changes what buildBuildDropdown draws NEXT time, and that
   surface repaints on its own when the developer reaches it. */
function upfOnSteamGame(steamAppId, name) {
  state.upf.game = null;
  state.upf.manifest = null;
  if (UPF._matching) return;                  // a match is already in flight
  UPF._matching = true;
  UPF._matchedAppId = String(steamAppId);
  UPF.match(steamAppId, name)
    .then(g => { if (g) _upfRepaintAll(); else UPF._matchedAppId = null; })  // agent may be down; let ensureMatch retry
    .catch(e => { console.warn('[UPF] match failed', e); UPF._matchedAppId = null; })
    .finally(() => { UPF._matching = false; });
}

/* Every agent line: append it, advance the stage clock, throttle repaints.
   Shared by the build and publish watchers so both fill the same stage list. */
function _upfLineHandler(pid) {
  let lastPaint = 0;
  return (line) => {
    const s = String(line).trim();
    if (!s) return;
    state.upf.lines.push(s);
    const before = state.upf.stage;
    _upfTrackLine(s);
    state.upf.progress = s.replace(/^stage [A-F][^:]*:\s*/i, '').slice(0, 60);
    const now = Date.now();
    if (state.upf.stage !== before || now - lastPaint > 2000) { lastPaint = now; _upfRepaint(pid, true); }
  };
}

/* Touchpoint 2 — the pill's press. BUILD ONLY: the agent runs prepare (transform,
   sign, package) and stops at a local .pkg. No Apple account is required, so this
   can happen early. Upload to App Store Connect is a separate, later act that
   fires on its own once the account is connected (_upfMaybePublish). */
async function upfBuild(pid) {
  if (!UPF.ready(pid)) return;
  const game = state.upf.game;
  state.platformBuilds = state.platformBuilds || {};
  state.platformBuildProcessing = state.platformBuildProcessing || {};
  state.platformBuildProcessing[pid] = true;
  state.upf.error = '';
  state.upf.result = null;
  state.upf.built = false;
  state.upf.uploaded = false;
  state.upf.lines = [];
  state.upf.stage = 0;
  state.upf.stages = [{ start: Date.now() }];
  state.upf.uploadPct = 0;
  state.upf.progress = 'Starting build…';
  state.upf.job = { id: null, kind: 'prepare' };
  _upfRepaint(pid, true);
  _upfStartTicker();

  const onLine = _upfLineHandler(pid);
  try {
    /* The developer's encryption answer is the plist value; unanswered means the
       exempt default (false), which is what the pre-fill says. The build keeps the
       STEAM build's own version (what App Store Connect should carry). */
    const enc = UPF.encryptionAnswer(pid);
    const target = { usesNonExemptEncryption: enc === null ? false : enc };
    const b = await UPF._post('/prepare', { game: game.app, target, achievements: UPF.achievementsForBuild(pid) });
    state.upf.job = { id: b.job, kind: 'prepare' };
    try { localStorage.setItem('upf.job', JSON.stringify({ id: b.job, pid, kind: 'prepare', started: Date.now() })); } catch (_) {}
    const res = await UPF.waitJob(b.job, onLine);
    _upfFinishBuild(pid, res, game);
  } catch (e) {
    _upfFail(pid, e);
  }
}

/* The account-connected half: upload the prepared .pkg to App Store Connect and
   create + release its Game Center achievements. Fires from _upfMaybePublish (on
   build finish, on connect, on sync) and from the retry button. Not a submit —
   the build then sits in ASC until the user's Submit press picks a track. */
async function upfPublish(pid) {
  if (typeof UPF === 'undefined' || !UPF.isMac(pid) || state.upf.job) return;
  // Claim the job slot synchronously, before any await, so two near-simultaneous
  // triggers (connect + sync, say) can't both start an upload.
  state.upf.job = { id: null, kind: 'publish' };
  if (!(await UPF.health())) { state.upf.job = null; return; }
  if (!state.upf.game) { state.upf.job = null; UPF.ensureMatch(); return; }   // a later trigger retries
  const game = state.upf.game;
  state.platformBuildProcessing = state.platformBuildProcessing || {};
  state.platformBuildProcessing[pid] = true;
  state.upf.error = '';
  state.upf.progress = 'Uploading to App Store Connect…';
  // Continue the same 8-stage list at the upload stage; the build stages are done.
  state.upf.stages = state.upf.stages || [];
  const now = Date.now();
  for (let i = 0; i < 5; i++) if (!state.upf.stages[i] || !state.upf.stages[i].end) state.upf.stages[i] = { start: (state.upf.stages[i] && state.upf.stages[i].start) || now, end: now };
  state.upf.stage = 5;
  state.upf.stages[5] = { start: now };
  state.upf.uploadPct = 0;
  state.upf.job = { id: null, kind: 'publish' };
  _upfRepaint(pid, true);
  _upfStartTicker();

  const onLine = _upfLineHandler(pid);
  try {
    const b = await UPF._post('/publish', { game: game.app });
    state.upf.job = { id: b.job, kind: 'publish' };
    try { localStorage.setItem('upf.job', JSON.stringify({ id: b.job, pid, kind: 'publish', started: Date.now() })); } catch (_) {}
    const res = await UPF.waitJob(b.job, onLine);
    _upfFinishPublish(pid, res, game);
  } catch (e) {
    _upfFail(pid, e);
  }
}

/* Upload iff there is a local UPF build not yet uploaded AND the account is
   connected. Safe to call any number of times — a no-op unless all conditions
   hold, so it can be fired from the build finish, the connect hook and the sync. */
function _upfMaybePublish(pid) {
  if (typeof UPF === 'undefined' || !UPF.isMac(pid) || state.upf.job) return;
  const b = (state.platformBuilds || {})[pid];
  if (!b || b.source !== 'upf' || b.uploaded) return;
  if (!state.upf.agent) return;
  if (typeof isPlatformConnected !== 'function' || !isPlatformConnected(pid)) return;
  // Uploading needs the app record on App Store Connect, which only the developer
  // can create (Apple's API forbids it). Wait until they mark it done — the
  // "Create your app in App Store Connect" step in the build flow.
  if (!state.upf.appRecord) return;
  upfPublish(pid);
}

/* Prepare finished: record the local .pkg (uploaded:false) and, if the account
   is already connected, start the upload. Build stages 0–4 are marked done so the
   list reads "built, upload pending". */
function _upfFinishBuild(pid, res, game) {
  try {
    if (!res || res.status !== 'ready') {
      const why = (res && res.blockers || []).map(b => b.message || b).join(' · ') || 'build did not reach ready';
      throw new Error(why);
    }
    const pkgPath = (res.artifacts && res.artifacts.pkg) || '';
    const tgt = (res.manifest && res.manifest.target) || {};
    const label = String(tgt.build || tgt.version || '');
    state.platformBuilds = state.platformBuilds || {};
    state.platformBuilds[pid] = {
      name: pkgPath.split('/').pop() || `${game.name}.pkg`,
      size: 0,
      buildNumber: label,          // Steam's build id / version — a label, not a number
      uploadedAt: Date.now(),
      source: 'upf',
      uploaded: false,             // built locally; not in App Store Connect yet
      ascBuildId: null,
      pkgPath,
    };
    state.upf.built = true;
    state.upf.uploaded = false;
    state.upf.progress = '';
    // mark the five build stages done and park the cursor at Upload (pending)
    const now = Date.now();
    for (let i = 0; i <= 4; i++) { state.upf.stages[i] = state.upf.stages[i] || { start: now }; if (!state.upf.stages[i].end) state.upf.stages[i].end = now; }
    state.upf.stage = 5;
    state.upf.result = { built: true, buildVersion: label };
    const connected = (typeof isPlatformConnected === 'function' && isPlatformConnected(pid));
    if (typeof bcToast === 'function') {
      bcToast(connected
        ? 'Mac App Store build ready — uploading to App Store Connect…'
        : 'Mac App Store build ready. Connect your Apple account in Settings to upload it.');
    }
    _upfDone(pid);
    _upfMaybePublish(pid);
  } catch (e) {
    _upfFail(pid, e);
  }
}

/* Publish finished: the build is in App Store Connect (processed) and its Game
   Center achievements are live. Marks the recorded build uploaded. */
function _upfFinishPublish(pid, res, game) {
  try {
    const up = res && res.upload;
    if (!up || !up.ok) throw new Error((up && up.problems || []).join(' · ') || 'upload did not complete');
    const b = (state.platformBuilds && state.platformBuilds[pid]) || {};
    b.uploaded = true;
    b.ascBuildId = up.buildId;
    b.ascAppId = up.appId;
    b.buildNumber = String(up.buildVersion);
    b.uploadedAt = Date.now();
    b.source = 'upf';
    state.platformBuilds = state.platformBuilds || {};
    state.platformBuilds[pid] = b;
    state.upf.uploaded = true;
    state.upf.progress = '';
    const last = state.upf.stages[state.upf.stage];
    if (last && !last.end) last.end = Date.now();
    state.upf.result = { buildVersion: up.buildVersion, buildId: up.buildId, appId: up.appId, uploaded: true };
    if (typeof bcToast === 'function') bcToast(`Mac App Store build ${up.buildVersion} is in App Store Connect (build ${up.buildId}).`);
    _upfDone(pid);
  } catch (e) {
    _upfFail(pid, e);
  }
}

/* Reattach and live-wait both end here: route the result to the right finisher. */
function _upfDispatchFinish(pid, kind, res, game) {
  return kind === 'publish' ? _upfFinishPublish(pid, res, game) : _upfFinishBuild(pid, res, game);
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
   The job id (and kind: prepare or publish) is remembered in localStorage by
   upfBuild / upfPublish; the agent's /jobs list is the fallback when that is
   gone. On reattach the kind routes to the right finisher. */
async function upfReattach() {
  let remembered = null;
  try { remembered = JSON.parse(localStorage.getItem('upf.job') || 'null'); } catch (_) {}
  const h = await UPF.health();
  if (!h) return;
  let id = remembered && remembered.id, pid = remembered && remembered.pid;
  if (!id) {
    const list = await UPF._get('/jobs').catch(() => ({ jobs: [] }));
    const j = (list.jobs || []).find(x => (x.kind === 'prepare' || x.kind === 'publish') && x.state === 'running');
    if (!j) return;
    id = j.id;
    pid = UPF_MAC_PIDS.find(p => _upfActive(p)) || 'macos';   // .has, not .includes — activePlatforms is a Set
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
  if (job.kind === 'publish') { state.upf.built = true; }
  _upfRepaint(pid, true);
  if (job.state === 'done') return _upfDispatchFinish(pid, job.kind, job.result, state.upf.game || { name: 'Game' });
  if (job.state === 'failed') return _upfFail(pid, new Error(job.error || 'The build could not be completed.'));
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
      if (j.state === 'done') return _upfDispatchFinish(pid, job.kind, j.result, state.upf.game || { name: 'Game' });
      if (j.state === 'failed') return _upfFail(pid, new Error(j.error || 'The build could not be completed.'));
      await new Promise(res => setTimeout(res, 1500));
    }
  } catch (e) { _upfFail(pid, e); }
}

setTimeout(() => { try { upfReattach(); } catch (_) {} }, 1800);

/* After the page has settled, a local build recorded earlier may be waiting on a
   now-connected account — upload it. No-op unless a build is present, unuploaded,
   and the account is connected. */
setTimeout(() => {
  for (const pid of UPF_MAC_PIDS) { try { _upfMaybePublish(pid); } catch (_) {} }
}, 2600);

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
  { label: 'Code-sign for the Mac App Store',    test: /stage d/i,                                  usual: 40 },
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

/* Steam API interfaces the manifest reports usage of → the player-facing game
   feature they belong to, and whether that feature carries over to the Mac App
   Store build. This is a curated map, not the raw interface list: the agent
   detects interfaces like ISteamApps / ISteamClient / ISteamUtils / ISteamUser,
   which are plumbing, not features a player sees — those are deliberately absent
   here so they never show as chips. Only achievements/stats genuinely carry
   (Shipmate wires them to Game Center); the rest have no Mac App Store
   equivalent. Keyed by the interface with the leading I/Steam and any "Data."
   stripped. (A backend that emitted feature names directly would be more exact;
   until then this table is the single place to adjust what shows and how.) */
const UPF_FEATURES = {
  UserStats:         { name: 'Achievements & stats', carries: true,  tip: 'Carries over — Shipmate wires achievements and stats to Apple’s Game Center.' },
  Achievement:       { name: 'Achievements & stats', carries: true,  tip: 'Carries over — Shipmate wires achievements to Apple’s Game Center.' },
  Friends:           { name: 'Friends & presence',   carries: false, tip: 'Doesn’t carry over — there’s no Mac App Store equivalent, so the game runs without a Steam friends list or rich presence.' },
  RemoteStorage:     { name: 'Steam Cloud saves',    carries: false, tip: 'Doesn’t carry over — Steam Cloud isn’t available; the game uses its local saves instead.' },
  Matchmaking:       { name: 'Multiplayer',          carries: false, tip: 'Doesn’t carry over — Steam matchmaking and networking aren’t available in the Mac App Store build.' },
  Networking:        { name: 'Multiplayer',          carries: false, tip: 'Doesn’t carry over — Steam matchmaking and networking aren’t available in the Mac App Store build.' },
  NetworkingSockets: { name: 'Multiplayer',          carries: false, tip: 'Doesn’t carry over — Steam matchmaking and networking aren’t available in the Mac App Store build.' },
  GameServer:        { name: 'Multiplayer',          carries: false, tip: 'Doesn’t carry over — Steam game servers aren’t available in the Mac App Store build.' },
  UGC:               { name: 'Workshop & mods',      carries: false, tip: 'Doesn’t carry over — Steam Workshop isn’t available on the Mac App Store.' },
  Input:             { name: 'Steam Input',          carries: false, tip: 'Doesn’t carry over — the Steam Input layer is gone; the game falls back to the OS’s native controller support.' },
  Controller:        { name: 'Steam Input',          carries: false, tip: 'Doesn’t carry over — the Steam Input layer is gone; the game falls back to the OS’s native controller support.' },
  Music:             { name: 'Steam Music',          carries: false, tip: 'Doesn’t carry over — the Steam Music remote isn’t available.' },
  Screenshots:       { name: 'Steam screenshots',    carries: false, tip: 'Doesn’t carry over — Steam’s screenshot capture isn’t available; macOS screenshots still work.' },
};

/* ── THE ONE BUILD FLOW: agent steps and the developer's steps, interleaved ──
   A single ordered list the modal shows as "Build steps". Pressing Build from
   Steam runs the agent as far down as it can; when the next thing is a mandatory
   USER step it stops there and that step alerts (amber, the app's "this needs
   you" colour). The developer does it, and the agent takes over again.

   Real dependency order: signing needs certificates the account provisions, so
   Connect comes first; the local build (copy → package) then runs; the app
   record must exist on the ASC website before the upload can land; upload,
   processing and the internal-TestFlight submit are automatic; then the human
   installs and tests it. `stage` maps an agent row to the agent's own stage
   clock (UPF_STAGES / state.upf.stage). */
/* Order: both human steps up front (connect, then create the app record), then
   the whole uninterrupted agent build+upload+process run, then the one human
   step that can only happen at the end (test). This keeps the ~10-minute build
   free of any "needs you" stop — the developer does their two things first and
   walks away. apprecord only has to be done before `upload`, so moving it ahead
   of the agent rows is safe. */
const UPF_FLOW = [
  { id: 'connect',    kind: 'user'  },
  { id: 'apprecord',  kind: 'user'  },
  { id: 'copy',       kind: 'agent', stage: 0 },
  { id: 'shim',       kind: 'agent', stage: 1 },
  { id: 'sandbox',    kind: 'agent', stage: 2 },
  { id: 'sign',       kind: 'agent', stage: 3 },
  { id: 'package',    kind: 'agent', stage: 4 },
  { id: 'upload',     kind: 'agent', stage: 5 },
  { id: 'process',    kind: 'agent', stage: 6 },
  // 'testflight' (submit to internal TestFlight) and 'test' (install + check it)
  // were removed from this list: submitting is what the main platform Submit
  // button does, and choosing the internal-TF destination there needs only a
  // processed build (submitStepClick). The build flow now ends once the build is
  // uploaded and processed in App Store Connect.
];
const UPF_FLOW_LABEL = {
  connect:    'Connect your Apple Developer account',
  copy:       'Copy and inspect the Steam build',
  shim:       'Replace Steam with the shim',
  sandbox:    'Sandbox and entitlements',
  sign:       'Code-sign for the Mac App Store',
  package:    'Package for the Mac App Store',
  apprecord:  'Create your app in App Store Connect',
  upload:     'Upload to App Store Connect',
  process:    'Wait for Apple to process the build',
  testflight: 'Submit to internal TestFlight',
  test:       'Test the internal TestFlight build',
};
/* The developer steps' alert content: what to do, and how to clear it. `href`
   opens the place to do it; `confirm` is the state.upf flag the "mark done"
   button sets (connect clears itself when the account state flips). */
const UPF_USER_STEP = {
  connect:   { cta: 'Connect account', onclick: "UPF.startConnect('%PID%')",
               help: 'Sign in with your Apple Developer account so Shipmate can sign and upload the build.' },
  apprecord: { cta: 'Open App Store Connect', href: 'https://appstoreconnect.apple.com/apps',
               confirm: 'appRecord', confirmCta: 'I’ve created it',
               help: 'Create the app on the App Store Connect website — Apple doesn’t allow this over the API — then mark it done.' },
  test:      { cta: 'Open TestFlight', href: 'https://appstoreconnect.apple.com/apps',
               confirm: 'tested', confirmCta: 'It runs',
               help: 'Install the build from TestFlight on this Mac and check that it launches and plays.' },
};

function _upfFlowDone(pid, id) {
  const u = state.upf || {};
  const connected = (typeof isPlatformConnected === 'function') && isPlatformConnected(pid);
  const built = !!(u.built || u.uploaded);
  const uploaded = !!u.uploaded;
  const prep = u.job && u.job.kind === 'prepare';
  const pub  = u.job && u.job.kind === 'publish';
  switch (id) {
    case 'connect':   return connected;
    case 'copy': case 'shim': case 'sandbox': case 'sign': case 'package': {
      const s = UPF_FLOW.find(f => f.id === id).stage;
      return built || uploaded || (prep && s < u.stage);
    }
    case 'apprecord': return !!u.appRecord || uploaded;
    case 'upload':    return uploaded || (pub && u.stage > 5);
    case 'process':   return uploaded;
    case 'testflight':return uploaded;
    case 'test':      return !!u.tested;
  }
  return false;
}

/* Each row with its status: done | active (agent working it now) | current
   (the agent's next, idle until Build is pressed) | blocker (a user step that is
   next and unmet — the amber alert) | todo. */
function _upfFlowRows(pid) {
  const u = state.upf || {};
  const prep = u.job && u.job.kind === 'prepare';
  const pub  = u.job && u.job.kind === 'publish';
  const rows = UPF_FLOW.map(f => ({ id: f.id, kind: f.kind, stage: f.stage,
                                    label: UPF_FLOW_LABEL[f.id], done: _upfFlowDone(pid, f.id) }));
  const curIdx = rows.findIndex(r => !r.done);
  rows.forEach((r, i) => {
    if (r.done)        { r.status = 'done'; return; }
    if (i !== curIdx)  { r.status = 'todo'; return; }
    if (r.kind === 'user') { r.status = 'blocker'; return; }
    const running = (prep || pub) && r.stage === u.stage;
    r.status = running ? 'active' : 'current';
  });
  return rows;
}

/* Press Build from Steam / take over after a user step: run the agent as far as
   it can, or surface the next user step. Safe to call repeatedly. */
function upfAdvance(pid) {
  if (typeof UPF === 'undefined' || !UPF.isMac(pid)) return;
  const u = state.upf || {};
  u.started = true;                 // the flow is engaged — the panel now shows Build steps
  const connected = (typeof isPlatformConnected === 'function') && isPlatformConnected(pid);
  if (u.job) { _upfRepaint(pid, true); return; }        // already working
  if (!connected) { UPF.startConnect(pid); return; }     // blocked at Connect
  // Create the app record UP FRONT — before the build — so the ~10-min build
  // run has no human stop in the middle. It only has to exist before upload.
  // Automated via the browser extension (background ASC tab); fires once per
  // flow, and _onAscTaskResult marks appRecord + re-advances on success.
  if (!u.appRecord && !u.uploaded) {
    if (!u._creatingApp) {
      u._creatingApp = true;
      u._creatingAppPid = pid;
      UPF._createAppStep(pid);   // register bundle ID, then run createApp
    }
    _upfRepaint(pid, true);
    return;
  } // blocked at Create app
  if (!u.built && !u.uploaded) { upfBuild(pid); return; }// run the local build, uninterrupted
  if (u.built && !u.uploaded) { _upfMaybePublish(pid); return; } // upload (gated inside)
  _upfRepaint(pid, true);                                 // uploaded → Test is the blocker
}

/* A developer step's "mark done" — sets the flag and lets the agent continue. */
function upfMarkStep(pid, flag) {
  state.upf[flag] = true;
  _upfRepaint(pid, true);
  upfAdvance(pid);
}

function upfBuildPanelHTML(pid) {
  if (typeof UPF === 'undefined' || !UPF.isMac(pid)) return '';
  const u = state.upf;
  if (u.agent === false || u.agent === null) { UPF.health().then(h => { if (h) UPF.ensureMatch(); }); return ''; }
  /* Agent is up but this game isn't matched to the local Steam library yet.
     Kick the (self-healing) match now — the one-shot load-time ensureMatch may
     have fired before the agent was detected as up, and nothing else drives it
     once the agent is up. ensureMatch's own guards make this cheap to call on
     every render, and _upfRepaintAll re-renders this panel on success. */
  if (!u.game) { UPF.ensureMatch(); return ''; }
  const existing = (state.platformBuilds || {})[pid];
  const upfPending = !!(existing && existing.source === 'upf' && !existing.uploaded);
  if (existing && !upfPending && !u.job && !u.result) return '';
  const esc = (s) => (typeof escHtml === 'function') ? escHtml(String(s)) : String(s);

  const m = u.manifest || {};
  const blockers = m.blockers || [];
  const running = !!u.job;
  const done = !!u.uploaded;                       // truly finished = in App Store Connect
  const built = u.built || upfPending;             // local .pkg exists, upload pending
  const failed = !running && !!u.error && (u.lines || []).length > 0;
  const connected = (typeof isPlatformConnected === 'function') && isPlatformConnected(pid);
  const name = esc(u.game.name);

  /* The flow is "engaged" once the developer presses Build from Steam (upfAdvance
     sets u.started), or any time a build already exists or is running. BEFORE
     that, the panel is just the pitch: the paragraph, what carries over, and the
     Build from Steam button as the one obvious move — no step list, no alerts. */
  const started = !!(u.started || running || built || done || failed);

  /* ── The intro paragraph. The step list (once started) carries the detail. */
  let intro;
  if (done && u.result && u.result.buildId) {
    intro = `<strong>Done.</strong> ${name} — build ${esc(u.result.buildVersion)} is in App Store Connect (build id ${esc(u.result.buildId)}). It is uploaded and processed; choose a destination and press Submit to distribute it.`;
  } else if (failed) {
    intro = `The build stopped. ${name}’s Steam build is untouched — you can try again.`;
  } else {
    intro = `Shipmate generates a new Mac App Store build from ${name}’s Steam build on this Mac — signed with your Mac App Store certificate and packaged, in a few minutes. Your Steam build is left untouched.`;
  }
  const introPara = `<div class="upf-intro">${intro}</div>`;

  /* ── The primary action. At rest, Build from Steam is THE move (plus an Upload
     alternative). Once the flow is engaged the list's own rows drive it, so the
     only button left is Try again on a failure. */
  let actions = '';
  if (failed) {
    actions = `<div class="upf-actions"><button class="imp-cta" onclick="event.stopPropagation();upfAdvance('${pid}')">Try again</button></div>`;
  } else if (!started) {
    actions = blockers.length
      ? `<div class="upf-actions"><button class="imp-cta is-blocked" aria-disabled="true">Fix the blockers first</button></div>`
      : `<div class="upf-actions">
           <button class="imp-cta" onclick="event.stopPropagation();upfAdvance('${pid}')">Build from Steam</button>
         </div>`;
  }
  const err = (u.error && !running && !failed) ? `<div class="upf-error">${esc(u.error)}</div>` : '';
  const blocks = blockers.length ? `
    <div class="upf-label">Blocked</div>
    <ul class="upf-list is-bad">${blockers.map(b => `<li>${esc(b.message || b)}</li>`).join('')}</ul>` : '';

  /* ── What carries over from Steam. Player-facing game features (mapped from
     the interfaces the manifest reports — see UPF_FEATURES), lit when they carry
     over to the Mac build and grey when they don't; infrastructure interfaces
     are dropped so only real features show. A "?" tooltip explains each. */
  const sa = m.steamApis || {};
  const seen = {};
  [].concat(sa.routed || [], sa.shim || [], sa.degraded || []).forEach(k => {
    const iface = k.split('::')[0].replace(/^I?Steam/, '').replace(/^Data\./, '');
    const f = UPF_FEATURES[iface];
    if (!f) return;                                   // plumbing, not a feature — drop it
    if (!seen[f.name] || f.carries) seen[f.name] = f; // if any variant carries, the feature carries
  });
  const featNames = Object.keys(seen).sort((a, b) => (seen[b].carries - seen[a].carries) || a.localeCompare(b));
  const chips = featNames.length ? `
    <div class="upf-label">What carries over from Steam</div>
    <div class="upf-chips">${featNames.map(nm => {
      const f = seen[nm];
      return `<span class="upf-chip ${f.carries ? 'is-on' : ''} tooltip-anchor" data-tip="${esc(f.tip)}">${esc(nm)}<span class="tooltip-icon">?</span></span>`;
    }).join('')}</div>` : '';

  /* ── Build steps: ONE list of the agent's work and the developer's, in order.
     Each row is done (green tick) / active (the agent working it, spinner) /
     blocker (a user step that is next and unmet — amber, "this needs you", with
     its own action) / current (the agent's next, idle) / todo. The agent runs to
     the next blocker; the developer clears it and the agent takes over again. */
  const CHECK = (typeof smCheckSVG === 'function') ? smCheckSVG(18) : '✓';
  const flowRows = _upfFlowRows(pid).map(r => {
    const disc =
        r.status === 'done'    ? `<span class="upf-step-disc is-done">${CHECK}</span>`
      : r.status === 'active'  ? `<span class="upf-step-disc is-active"><span class="build-proc-spin"></span></span>`
      : r.status === 'blocker' ? `<span class="upf-step-disc is-alert">!</span>`
      :                          `<span class="upf-step-disc"></span>`;
    let main = `<span class="upf-step-label">${esc(r.label)}</span>`;
    if (r.status === 'blocker') {
      const meta = UPF_USER_STEP[r.id] || {};
      const cta = meta.href
        ? `<a class="imp-cta imp-cta--sm" href="${meta.href}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(meta.cta || 'Open')}</a>`
        : (meta.onclick ? `<button class="imp-cta imp-cta--sm" onclick="event.stopPropagation();${meta.onclick.replace('%PID%', pid)}">${esc(meta.cta || 'Do it')}</button>` : '');
      const confirm = meta.confirm
        ? `<button class="upf-alt" onclick="event.stopPropagation();upfMarkStep('${pid}','${meta.confirm}')">${esc(meta.confirmCta || 'Done')}</button>`
        : '';
      main += `<div class="upf-step-alert">${meta.help ? `<span class="upf-step-help">${esc(meta.help)}</span>` : ''}<div class="upf-step-cta">${cta}${confirm}</div></div>`;
    }
    return `<li class="upf-step is-${r.status} kind-${r.kind}">${disc}<div class="upf-step-main">${main}</div></li>`;
  }).join('');
  /* The step list is always shown under the button now — so the developer can
     see the whole path, and where they'll need to step in (the amber human-step
     rows), before they press Build from Steam. */
  const stepsBlock = `<div class="upf-label">Build steps</div><ul class="upf-steps">${flowRows}</ul>`;

  /* Order: the paragraph; then what carries over from Steam; then — at rest —
     the Build from Steam button, or — once engaged — the build steps. */
  return `<div class="upf-panel">${introPara}${chips}${err}${blocks}${actions}${stepsBlock}</div>`;
}

/* The browser extension reports ASC task results back through content-shipmate,
   which posts them onto the Shipmate window. Route them into UPF so the build
   flow can react (e.g. mark the app record created and continue). */
window.addEventListener('message', function (ev) {
  if (ev.source !== window || !ev.data || ev.data.__shipmate !== 'ascTaskResult') return;
  if (typeof UPF !== 'undefined' && typeof UPF._onAscTaskResult === 'function') {
    UPF._onAscTaskResult(ev.data.task, ev.data.result);
  }
});
