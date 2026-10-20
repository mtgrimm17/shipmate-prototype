// Runs on App Store Connect pages. Automates the two steps Apple gives no API
// for — creating the app record and the App Privacy questionnaire — filling the
// live web forms from the data captured on the Shipmate page.
//
// ASC is a React SPA, so setting .value / .checked directly doesn't register.
// We use the native value setter + input/change events for text/selects, and a
// real .click() to toggle checkboxes/radios (which fires React's handler).
(function () {
  // ---- React-safe field setters -------------------------------------------
  function setNativeValue(el, value) {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype
                : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function setCheck(el, want) {
    if (el && !!el.checked !== !!want) el.click();   // click fires React onChange
  }
  function selectByText(sel, text) {
    const t = String(text).toLowerCase();
    const opt = [...sel.options].find(o =>
      o.value === text || o.textContent.trim().toLowerCase() === t || o.textContent.toLowerCase().includes(t));
    if (opt) setNativeValue(sel, opt.value);
    return !!opt;
  }
  const byLabel = (label) => [...document.querySelectorAll('button')]
    .find(b => (b.textContent || '').trim().toLowerCase() === label.toLowerCase());

  // ---- Shipmate internal id → the real ASC web checkbox id ----------------
  const CAT = {
    name: 'NAME', email: 'EMAIL_ADDRESS', phone: 'PHONE_NUMBER', address: 'PHYSICAL_ADDRESS',
    other_contact: 'OTHER_CONTACT_INFO', health: 'HEALTH', fitness: 'FITNESS',
    payment_info: 'PAYMENT_INFORMATION', credit_info: 'CREDIT_AND_FRAUD', other_financial: 'OTHER_FINANCIAL_INFO',
    precise_loc: 'PRECISE_LOCATION', coarse_loc: 'COARSE_LOCATION', sensitive: 'SENSITIVE_INFO',
    contacts: 'CONTACTS', messages: 'EMAILS_OR_TEXT_MESSAGES', photos_videos: 'PHOTOS_OR_VIDEOS',
    audio: 'AUDIO', gameplay: 'GAMEPLAY_CONTENT', customer_support: 'CUSTOMER_SUPPORT',
    other_uc: 'OTHER_USER_CONTENT', browsing: 'BROWSING_HISTORY', search: 'SEARCH_HISTORY',
    user_id: 'USER_ID', device_id: 'DEVICE_ID', purchases: 'PURCHASE_HISTORY',
    product_use: 'PRODUCT_INTERACTION', ad_data: 'ADVERTISING_DATA', other_usage: 'OTHER_USAGE_DATA',
    crash: 'CRASH_DATA', performance: 'PERFORMANCE_DATA', other_diag: 'OTHER_DIAGNOSTIC_DATA',
    env_scan: 'ENVIRONMENTAL_SCANNING', hands: 'HANDS', head: 'HEAD_MOVEMENT', other: 'OTHER_DATA',
  };
  const PUR = {
    first_party_ads: 'DEVELOPERS_ADVERTISING', third_party_ads: 'THIRD_PARTY_ADVERTISING',
    analytics: 'ANALYTICS', personalization: 'PRODUCT_PERSONALIZATION',
    app_function: 'APP_FUNCTIONALITY', other_purpose: 'OTHER_PURPOSES',
  };
  // ASC purpose id → the label shown in the configured-type summary line.
  const PUR_LABEL = {
    THIRD_PARTY_ADVERTISING: 'Third-Party Advertising',
    DEVELOPERS_ADVERTISING: "Developer's Advertising or Marketing",
    ANALYTICS: 'Analytics', PRODUCT_PERSONALIZATION: 'Product Personalization',
    APP_FUNCTIONALITY: 'App Functionality', OTHER_PURPOSES: 'Other Purposes',
  };
  // ASC category id → display name, for telling which type a per-type screen is for.
  const CAT_LABEL = {
    NAME: 'Name', EMAIL_ADDRESS: 'Email Address', PHONE_NUMBER: 'Phone Number',
    PHYSICAL_ADDRESS: 'Physical Address', OTHER_CONTACT_INFO: 'Other User Contact Info',
    HEALTH: 'Health', FITNESS: 'Fitness', PAYMENT_INFORMATION: 'Payment Info',
    CREDIT_AND_FRAUD: 'Credit Info', OTHER_FINANCIAL_INFO: 'Other Financial Info',
    PRECISE_LOCATION: 'Precise Location', COARSE_LOCATION: 'Coarse Location', SENSITIVE_INFO: 'Sensitive Info',
    CONTACTS: 'Contacts', EMAILS_OR_TEXT_MESSAGES: 'Emails or Text Messages', PHOTOS_OR_VIDEOS: 'Photos or Videos',
    AUDIO: 'Audio Data', GAMEPLAY_CONTENT: 'Gameplay Content', CUSTOMER_SUPPORT: 'Customer Support',
    OTHER_USER_CONTENT: 'Other User Content', BROWSING_HISTORY: 'Browsing History', SEARCH_HISTORY: 'Search History',
    USER_ID: 'User ID', DEVICE_ID: 'Device ID', PURCHASE_HISTORY: 'Purchases',
    PRODUCT_INTERACTION: 'Product Interaction', ADVERTISING_DATA: 'Advertising Data', OTHER_USAGE_DATA: 'Other Usage Data',
    CRASH_DATA: 'Crash Data', PERFORMANCE_DATA: 'Performance Data', OTHER_DIAGNOSTIC_DATA: 'Other Diagnostic Data',
    ENVIRONMENTAL_SCANNING: 'Environment Scanning', HANDS: 'Hands', HEAD_MOVEMENT: 'Head', OTHER_DATA: 'Other Data',
  };

  // Shipmate's lowercase perType → { ASC_CATEGORY_ID: {purposes:[ASC_PURPOSE_ID], identity, tracking} }
  function ascPerType(data) {
    const out = {};
    const per = (data.privacy && data.privacy.perType) || {};
    Object.keys(per).forEach(k => {
      const cat = CAT[k]; if (!cat) return;
      const v = per[k] || {};
      out[cat] = {
        purposes: (v.purposes || []).map(p => PUR[p]).filter(Boolean),
        identity: v.identity, tracking: v.tracking,
      };
    });
    return out;
  }

  function headingText() {
    const hs = [...document.querySelectorAll('h1,h2,h3,[role="heading"]')].map(h => (h.textContent || '').trim()).filter(Boolean);
    return hs.join(' | ');
  }
  // The per-type screens show the data type as the MODAL's own title. Read just
  // that, not the whole page (the sidebar nav pollutes a page-wide scan).
  function modalHeading() {
    const dlg = document.querySelector('[role="dialog"],[aria-modal="true"]');
    const scope = dlg || document;
    const h = scope.querySelector('h1,h2,[role="heading"]');
    return h ? (h.textContent || '').trim() : '';
  }
  // Which collected category does this per-type screen belong to? Exact-match
  // the modal title to a label, with a loose fallback.
  function typeForScreen(per) {
    const title = modalHeading().toLowerCase();
    if (!title) return null;
    const keys = Object.keys(per);
    return keys.find(cat => (CAT_LABEL[cat] || '').toLowerCase() === title)
        || keys.find(cat => title.includes((CAT_LABEL[cat] || '\u0000').toLowerCase()))
        || null;
  }

  // ---- introspect (now also dumps headings, for mapping per-type screens) --
  function introspect() {
    const labelFor = (el) => {
      let t = '';
      if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l) t = l.textContent.trim(); }
      return (t || el.getAttribute('aria-label') || el.getAttribute('placeholder') || (el.textContent || '').trim()).slice(0, 70);
    };
    const els = [...document.querySelectorAll('input,select,textarea,button,[role="checkbox"],[role="radio"],[role="button"],[role="switch"]')].slice(0, 400);
    return {
      url: location.href, title: document.title, headings: headingText(), count: els.length,
      fields: els.map((el, i) => ({ i, tag: el.tagName.toLowerCase(), type: el.getAttribute('type') || el.getAttribute('role') || '',
        name: el.getAttribute('name') || '', id: el.id || '', label: labelFor(el) })),
    };
  }

  // ---- Create app record ---------------------------------------------------
  // The extension opens ASC's ROOT (cold-loading a deep route breaks ASC's SPA
  // router — "No route found" + a 404'd chunk — leaving Bundle ID stuck
  // "Loading…"). We then navigate to the Apps list IN-APP so routing initializes
  // and dynamic fields load normally.
  function appsNavLink() {
    return [...document.querySelectorAll('a,button,[role="link"],[role="menuitem"]')]
      .find(e => (e.textContent || '').trim() === 'Apps');
  }
  async function ensureAppsPage() {
    if (document.getElementById('new-app-btn-icon')) return true;
    // Wait for ASC to boot (its top nav appears), then click "Apps" (SPA nav).
    for (let i = 0; i < 80 && !document.getElementById('new-app-btn-icon') && !appsNavLink(); i++) await sleep(300);
    if (document.getElementById('new-app-btn-icon')) return true;
    const link = appsNavLink();
    if (link) { LOG('ensureAppsPage: clicking Apps nav (in-app)'); link.click(); }
    else LOG('ensureAppsPage: Apps nav not found');
    for (let i = 0; i < 80 && !document.getElementById('new-app-btn-icon'); i++) await sleep(300);
    return !!document.getElementById('new-app-btn-icon');
  }
  async function openNewAppDialog() {
    if (document.getElementById('name') && document.getElementById('bundleId')) return true; // already open
    // Step 1: open the "+" dropdown (the menu item only exists once it's open).
    const plus = document.getElementById('new-app-btn-icon');
    if (plus && !document.getElementById('new-app-btn')) {
      plus.click();
      for (let i = 0; i < 40 && !document.getElementById('new-app-btn'); i++) await sleep(150);  // up to ~6s
    }
    // Step 2: click the "New App" menu item.
    const item = document.getElementById('new-app-btn')
      || [...document.querySelectorAll('button,a,[role="menuitem"]')].find(b => /^new app$/i.test((b.textContent || '').trim()));
    if (!item) return false;
    item.click();
    for (let i = 0; i < 50 && !document.getElementById('name'); i++) await sleep(150);  // up to ~7.5s for the dialog
    return !!document.getElementById('name');
  }
  // Always differentiate demo apps from real ones. Apple caps app names at 30
  // chars, so append " - Mark Demo" and trim the base to fit if needed — the
  // qualifier is never dropped.
  function demoName(base) {
    const q = ' - Mark Demo';
    base = String(base || 'App').trim();
    if (base.toLowerCase().endsWith(q.toLowerCase())) return base.slice(0, 30);
    const room = 30 - q.length;                 // 18
    if (base.length > room) base = base.slice(0, room).trim();
    return (base + q).slice(0, 30);
  }

  async function createApp(data, opts) {
    opts = opts || {};
    const name = demoName(data.appName || '');
    if (!await ensureAppsPage()) {
      return { ok: false, error: 'Could not reach the Apps page in App Store Connect (SPA routing).' };
    }
    if (!await openNewAppDialog()) {
      return { ok: false, error: 'Couldn\'t open the New App dialog.' };
    }

    const mac = document.getElementById('platformsById.MAC_OS');
    if (mac) setCheck(mac, true);                               // this flow targets the Mac App Store

    const nameEl = document.getElementById('name');
    if (nameEl && name) setNativeValue(nameEl, name);

    // Select an option by value/text, waiting for the list to populate. NO
    // synthetic "open" events — firing those knocks ASC's Bundle ID list into a
    // stuck "Loading…" state; left alone it loads fast, just like Language.
    const selectWhenReady = async (sel, text, label, tries) => {
      for (let i = 0; i < (tries || 120); i++) {   // up to ~30s
        const n = sel.options ? sel.options.length : 0;
        if (i % 4 === 0) LOG(label, 'poll#' + i, '| options:', n, '| sample:', n ? [...sel.options].slice(0, 5).map(o => (o.value || '') + '::' + (o.textContent || '').trim()) : '-', '| value:', JSON.stringify(sel.value));
        if (n > 1 && selectByText(sel, text)) {
          await sleep(150);
          if (sel.value && sel.value !== '') { LOG(label, 'selected ✓ value =', sel.value); return true; }
          selectByText(sel, text); await sleep(150);   // retry once if React reset it
          if (sel.value && sel.value !== '') { LOG(label, 'selected ✓ (2nd try) value =', sel.value); return true; }
          LOG(label, 'matched an option but value did not stick (React reset?)');
        }
        await sleep(250);
      }
      LOG(label, 'NOT selected ✗ | final value:', JSON.stringify(sel.value), '| options:', sel.options ? sel.options.length : 0);
      return false;
    };

    const locale = document.getElementById('primaryLocale');
    if (locale) await selectWhenReady(locale, data.primaryLocale || 'English (U.S.)', 'language');

    // Bundle ID: the agent registers games.sound.<dev>.<game>.test and passes it
    // in (opts.bundleId); fall back to Shipmate's manifest value if present. ASC
    // only lists bundle IDs not already attached to an app, and can take a few
    // seconds to list one just registered — so wait for it to appear.
    const bundleId = opts.bundleId || data.bundleId || '';
    // Safety: only ever create an app for a .test bundle. Non-.test identifiers
    // are real/production ones — never touch them.
    if (bundleId && !bundleId.endsWith('.test')) {
      return { ok: false, error: `Refusing to create an app for "${bundleId}": only bundle IDs ending in .test may be used (non-.test are real/production).` };
    }
    const bid = document.getElementById('bundleId');
    const bidOk = bid && bundleId ? await selectWhenReady(bid, bundleId, 'bundle') : false;

    // SKU mirrors the real-game convention (sg_demo_<game>) but marked as ours:
    // mark_demo_<game>, so these demo SKUs never collide with real ones.
    const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const skuVal = 'mark_demo_' + (slug(data.appName) || 'app');
    const sku = document.getElementById('sku');
    if (sku && !sku.value) setNativeValue(sku, skuVal);

    const full = document.getElementById('userAccessFull');
    if (full) setCheck(full, true);

    if (opts.submit) {
      if (!name) return { ok: false, error: 'no app name from Shipmate' };
      if (!bidOk) return { ok: false, error: 'could not select bundle id "' + bundleId + '" (see console [Shipmate ext] logs for options/value)' };
      await sleep(300);
      const create = byLabel('Create');
      if (create && !create.disabled) { create.click(); return { ok: true, created: true, note: 'Created the app record.' }; }
      return { ok: false, error: 'Create is not enabled — a required field is still missing.' };
    }

    const notes = [];
    if (!name) notes.push('no app name from Shipmate');
    if (!bidOk) notes.push('bundle "' + bundleId + '" not selected');
    return { ok: true, filled: true, sku: skuVal, note: 'Filled the New App dialog.' + (notes.length ? ' ⚠ ' + notes.join('; ') : '') };
  }

  // ---- Autopilot plumbing --------------------------------------------------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function activeScope() {
    return document.querySelector('[role="dialog"],[aria-modal="true"]')
        || document.querySelector('main') || document.body;
  }
  // A fingerprint that changes when ASC navigates to a different screen, so the
  // driver can wait for each transition. Includes text so the two look-alike
  // "definition" interstitials (same title, same buttons, no inputs) differ.
  function screenSignature() {
    const sc = activeScope();
    const ids = [...sc.querySelectorAll('input[id]')].map(e => e.id).join(',');
    const txt = (sc.innerText || '').replace(/\s+/g, ' ').slice(0, 500);
    return location.pathname + '|' + ids + '|' + txt;
  }
  async function waitForChange(sig, timeout = 9000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      await sleep(150);
      if (screenSignature() !== sig) { await sleep(250); return true; } // settle
    }
    return false;
  }
  // Click Apple's own forward button (never Cancel/Back).
  function clickPrimary() {
    for (const lbl of ['Next', 'Save', 'OK', 'Continue', 'Done']) {
      const b = byLabel(lbl);
      if (b && !b.disabled) { b.click(); return lbl; }
    }
    return null;
  }
  // Find a pending "Set Up <type>" control. ASC doesn't render it as a plain
  // <button>/<a>, so match by text and climb to the clickable ancestor.
  function setUpLink() {
    const clickable = [...document.querySelectorAll('a,button,[role="button"]')]
      .find(b => /^set up\b/i.test((b.textContent || '').trim()));
    if (clickable) return clickable;
    const leaf = [...document.querySelectorAll('*')]
      .find(e => e.children.length === 0 && /^set up\b/i.test((e.textContent || '').trim()));
    if (leaf) {
      let el = leaf;
      for (let i = 0; i < 5 && el; i++) {
        if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return el;
        el = el.parentElement;
      }
      return leaf;
    }
    return null;
  }
  // The "Edit" next to the Data Types heading — the entry point into the
  // questionnaire from a summary that has no "Get Started" button.
  function dataTypesEdit() {
    const head = [...document.querySelectorAll('h1,h2,h3,h4')].find(h => /data types/i.test(h.textContent || ''));
    if (!head) return null;
    let el = head;
    for (let i = 0; i < 5 && el; i++) {
      const b = [...el.querySelectorAll('button,a')].find(x => /^edit$/i.test((x.textContent || '').trim()));
      if (b) return b;
      el = el.parentElement;
    }
    return null;
  }

  // Read a configured type's displayed settings from its summary row text.
  function parseConfigured(text) {
    const t = (text || '');
    const purposes = new Set();
    Object.keys(PUR_LABEL).forEach(id => { if (t.includes(PUR_LABEL[id])) purposes.add(id); });
    const identity = /not linked to the user.s identity/i.test(t) ? 'no'
      : /linked to the user.s identity/i.test(t) ? 'yes' : null;
    const tracking = /not used for tracking/i.test(t) ? 'no'
      : /used for tracking purposes/i.test(t) ? 'yes' : 'no';
    return { purposes, identity, tracking };
  }
  function sameSet(a, b) { return a.size === b.size && [...a].every(x => b.has(x)); }
  const yn = (v) => (v === 'yes' ? 'yes' : 'no');   // anything not "yes" fills as "No"
  function typeMatches(cat, parsed, per) {
    const want = per[cat]; if (!want) return true;
    const idOK = parsed.identity === null || parsed.identity === yn(want.identity);   // null = unreadable, don't force a redo
    const trOK = parsed.tracking === null || parsed.tracking === yn(want.tracking);
    return sameSet(parsed.purposes, new Set(want.purposes || [])) && idOK && trOK;
  }
  // Already-configured type rows on the summary, each with its own "Edit" button.
  // Anchored on the exact type-name label, then the SMALLEST ancestor that has
  // both an Edit button and the per-type detail text — so it can only be that
  // type's own card, never the Privacy Policy / Data Types section editors.
  function configuredRows(per) {
    const rows = [];
    Object.keys(per).forEach(cat => {
      const label = CAT_LABEL[cat];
      const node = [...document.querySelectorAll('span,div,p,strong,b,h1,h2,h3,h4,h5,dt,td,label')]
        .find(e => e.children.length <= 1 && (e.textContent || '').trim() === label);
      if (!node) return;
      let scope = node;
      for (let i = 0; i < 6 && scope.parentElement; i++) {
        scope = scope.parentElement;
        const txt = scope.innerText || '';
        if (!/(used for|linked|tracking)/i.test(txt)) continue;
        if (/\b(privacy policy|data types)\b/i.test(txt)) break;     // climbed too far
        const edit = [...scope.querySelectorAll('button')].find(b => /^edit$/i.test((b.textContent || '').trim()));
        if (edit) { rows.push({ cat, editBtn: edit, text: txt }); return; }
      }
    });
    return rows;
  }

  // ---- Classify the current screen and FILL it (no advancing) --------------
  // Returns { screen, advance:'primary'|'open'|'done'|'unknown', opener?, error? }
  function screenInfo(data) {
    const per = ascPerType(data);
    const pv = (data && data.privacy) || {};
    const collects = pv.collectsData === 'yes' || Object.keys(per).length > 0;

    // collect data?
    const yes = document.getElementById('CONFIRM_COLLECT_DATA_radio_true');
    const no = document.getElementById('CONFIRM_COLLECT_DATA_radio_false');
    if (yes || no) { setCheck(collects ? yes : no, true); return { screen: 'collect-data', set: collects ? 'collects' : 'none', advance: 'primary' }; }

    // select categories
    const cats = [...document.querySelectorAll('[id^="SELECT_CATEGORIES_checkbox_"]')];
    if (cats.length) {
      cats.forEach(el => { const id = el.id.replace('SELECT_CATEGORIES_checkbox_', ''); const want = !!per[id]; if (!!el.checked !== want) el.click(); });
      return { screen: 'select-categories', advance: 'primary' };
    }

    // purposes (for the type named in the modal title)
    const purps = [...document.querySelectorAll('[id^="SELECT_PURPOSES_checkbox_"]')];
    if (purps.length) {
      const match = typeForScreen(per);
      if (!match) return { screen: 'purposes', advance: 'unknown', error: 'unknown data type: "' + modalHeading() + '"' };
      const want = new Set(per[match].purposes || []);
      purps.forEach(el => { const id = el.id.replace('SELECT_PURPOSES_checkbox_', ''); const on = want.has(id); if (!!el.checked !== on) el.click(); });
      return { screen: 'purposes', type: CAT_LABEL[match], advance: 'primary' };
    }

    // linked to identity? (category embedded in the id)
    const linked = document.querySelector('[id^="CONFIRM_LINKING_"][id$="_radioButton_true"]');
    if (linked) {
      const cat = linked.id.replace('CONFIRM_LINKING_', '').replace(/_radioButton_true$/, '');
      if (!per[cat]) return { screen: 'linked', advance: 'unknown', error: 'unmapped type ' + cat };
      setCheck(document.getElementById('CONFIRM_LINKING_' + cat + '_radioButton_' + (per[cat].identity === 'yes' ? 'true' : 'false')), true);
      return { screen: 'linked', type: CAT_LABEL[cat] || cat, advance: 'primary' };
    }

    // used for tracking?
    const tracked = document.querySelector('[id^="CONFIRM_TRACKING_"][id$="_radioButton_true"]');
    if (tracked) {
      const cat = tracked.id.replace('CONFIRM_TRACKING_', '').replace(/_radioButton_true$/, '');
      if (!per[cat]) return { screen: 'tracking', advance: 'unknown', error: 'unmapped type ' + cat };
      setCheck(document.getElementById('CONFIRM_TRACKING_' + cat + '_radioButton_' + (per[cat].tracking === 'yes' ? 'true' : 'false')), true);
      return { screen: 'tracking', type: CAT_LABEL[cat] || cat, advance: 'primary' };
    }

    // "Additional Setup Required" acknowledgement
    if (byLabel('OK') && /additional setup required/i.test(document.body.innerText || '')) return { screen: 'ack', advance: 'primary' };

    // informational interstitial (definitions / examples): Back + Next, nothing to fill
    if (byLabel('Next') && byLabel('Back')) return { screen: 'info', advance: 'primary' };

    // An unrecognized modal is open (e.g. Privacy Policy) — don't mistake it for
    // the summary and call it "done". Back out if we can, else report stuck.
    const dlg = document.querySelector('[role="dialog"],[aria-modal="true"]');
    if (dlg) {
      const cancel = byLabel('Cancel');
      if (cancel) return { screen: 'stray-modal', advance: 'primary' };  // clickPrimary falls through; handled below
      return { screen: 'stray-modal', advance: 'unknown', error: 'an unrecognized dialog is open: "' + modalHeading() + '"' };
    }

    // summary page — decide based on what Shipmate wants vs what's shown
    const setup = setUpLink();
    if (setup) return { screen: 'summary:set-up', advance: 'open', opener: setup };

    const notCollected = /data (?:is )?not collected/i.test(document.body.innerText || '');
    if (collects) {
      // We want data collected. If nothing's collected yet, start the flow.
      if (notCollected) {
        const op = byLabel('Get Started') || dataTypesEdit();
        if (op) return { screen: 'summary:start', advance: 'open', opener: op };
        return { screen: 'summary', advance: 'unknown', error: 'on "Data Not Collected" but found no Get Started / Data Types Edit to start' };
      }
      // Data is collected and no "Set Up" remains → every type is configured.
      return { screen: 'done', advance: 'done' };
    }
    // We want NO data collected.
    if (notCollected) return { screen: 'done', advance: 'done' };
    const op2 = byLabel('Get Started') || dataTypesEdit();
    if (op2) return { screen: 'summary:switch-to-no', advance: 'open', opener: op2 };
    return { screen: 'done', advance: 'done' };
  }

  // Drive consecutive in-wizard screens (collect/categories/purposes/linked/
  // info/tracking/ack) until ASC lands back on a summary (advance open|done).
  async function runWizardUntilSummary(data, steps, max = 60) {
    for (let i = 0; i < max; i++) {
      let info = screenInfo(data);                   // fills the current screen
      // A closing modal can leave a leaf element (e.g. a purposes checkbox) in
      // the DOM for a moment with no heading — an "unknown" flicker. Re-check
      // once after it settles; a genuine unknown screen persists.
      if (info.advance === 'unknown') { await sleep(500); info = screenInfo(data); }
      if (info.advance === 'open' || info.advance === 'done' || info.advance === 'unknown') return info;
      steps.push(info.type ? info.screen + '(' + info.type + ')' : info.screen);
      await sleep(180);                              // let React register the fill + enable the button
      const sig = screenSignature();                 // captured AFTER the fill, so only navigation trips it
      let clicked = clickPrimary();
      if (!clicked) {                                // nothing to save (no changes) → back out cleanly
        const cancel = byLabel('Cancel');
        if (cancel) { cancel.click(); clicked = 'Cancel'; }
        else return { screen: info.screen, advance: 'unknown', error: 'no forward/cancel button on ' + info.screen };
      }
      if (!await waitForChange(sig)) return { screen: info.screen, advance: 'unknown', error: 'screen did not advance past ' + info.screen + ' (timeout)' };
    }
    return { advance: 'unknown', error: 'too many wizard screens — stopped to avoid a loop' };
  }

  // ---- Autopilot: fill the whole App Privacy flow in one go ----------------
  // Phase 1 reconciles the collect flag + the whole data-type set (add/remove/
  // overwrite). Phase 2 sets up every data type still pending.
  async function autoPrivacy(data) {
    const per = ascPerType(data);
    const pv = (data && data.privacy) || {};
    const hasData = pv.collectsData === 'yes' || pv.collectsData === 'no' || Object.keys(per).length > 0;
    if (!hasData) return { ok: false, error: 'No App Privacy data loaded from Shipmate. On the Shipmate tab, fill the privacy questions and click "Refresh from Shipmate", then run this on the ASC App Privacy page.' };

    const steps = [];

    // PHASE 1 — enter the Data Types editor (Get Started first time, else Edit)
    // and let the category/collect screens reconcile to Shipmate. If we're
    // already inside the wizard, there's no entry control and we just proceed.
    const entry = byLabel('Get Started') || dataTypesEdit();
    if (entry) {
      steps.push('enter:data-types');
      const sig = screenSignature();
      entry.click();
      if (!await waitForChange(sig)) return { ok: false, error: 'could not open the Data Types editor', steps };
    }
    let r = await runWizardUntilSummary(data, steps);
    if (r.advance === 'unknown') return { ok: false, error: r.error, steps };

    // PHASE 2 — set up every pending data type ("Set Up <type>")
    for (let t = 0; t < 40; t++) {
      let setup = setUpLink();
      if (!setup) { await sleep(800); setup = setUpLink(); }   // let links render
      if (!setup) break;
      steps.push('enter:set-up');
      const sig = screenSignature();
      setup.click();
      if (!await waitForChange(sig)) return { ok: false, error: 'could not open a "Set Up" link', steps };
      r = await runWizardUntilSummary(data, steps);
      if (r.advance === 'unknown') return { ok: false, error: r.error, steps };
    }

    // PHASE 2b — overwrite already-configured types whose shown settings differ
    // from Shipmate. Only drift is touched, and each type is attempted at most
    // once per run, so a stubborn comparison can never loop.
    const overwritten = new Set();
    for (let pass = 0; pass < 40; pass++) {
      const rows = configuredRows(per);
      const drift = rows.find(row => !overwritten.has(row.cat) && !typeMatches(row.cat, parseConfigured(row.text), per));
      if (!drift) break;
      overwritten.add(drift.cat);
      steps.push('overwrite:' + (CAT_LABEL[drift.cat] || drift.cat));
      const sig = screenSignature();
      drift.editBtn.click();
      if (!await waitForChange(sig)) return { ok: false, error: 'could not open Edit for ' + (CAT_LABEL[drift.cat] || drift.cat), steps };
      r = await runWizardUntilSummary(data, steps);
      if (r.advance === 'unknown') return { ok: false, error: r.error, steps };
    }

    steps.push('done');
    return { ok: true, done: true, steps };
  }

  // Single step, for debugging a specific screen.
  function fillPrivacyOnce(data) {
    const per = ascPerType(data);
    const pv = (data && data.privacy) || {};
    if (!(pv.collectsData === 'yes' || pv.collectsData === 'no' || Object.keys(per).length > 0))
      return { ok: false, error: 'No App Privacy data loaded from Shipmate.' };
    const info = screenInfo(data);
    return { ok: info.advance !== 'unknown', ...info };
  }

  chrome.runtime.onMessage.addListener(function (msg, _sender, reply) {
    if (!msg) return;
    if (msg.type === 'inspect') { reply(introspect()); return true; }
    if (msg.type === 'runPending') { runPending().then(() => reply({ ok: true })); return true; }
    chrome.storage.local.get('shipmateExport', function (st) {
      const data = st.shipmateExport || {};
      if (msg.type === 'autoPrivacy') autoPrivacy(data).then(reply);
      else if (msg.type === 'fillPrivacy') reply(fillPrivacyOnce(data));
      else if (msg.type === 'createApp') createApp(data, { submit: !!msg.submit }).then(reply);
      else reply({ ok: false, error: 'unknown message' });
    });
    return true;  // async reply
  });

  // ---- Automated path: claim and run a task queued by the background worker --
  // Capture the app's ASC id whenever we're on one of its pages, so the privacy
  // deep link can be built later without anyone passing it in.
  try {
    const m = location.pathname.match(/\/apps\/(\d+)/);
    if (m) chrome.storage.local.set({ ascAppId: m[1] });
  } catch (_) {}

  function get(keys) { return new Promise((r) => chrome.storage.local.get(keys, r)); }
  function set(obj) { return new Promise((r) => chrome.storage.local.set(obj, r)); }
  function del(keys) { return new Promise((r) => chrome.storage.local.remove(keys, r)); }

  const LOG = (...a) => { try { console.log('[Shipmate ext]', ...a); } catch (_) {} };
  let _ranPending = false;
  async function runPending() {
    if (_ranPending) { LOG('runPending: already ran on this page'); return; }
    const { pendingAscTask } = await get('pendingAscTask');
    LOG('runPending: pendingAscTask =', pendingAscTask, 'url =', location.pathname);
    if (!pendingAscTask) return;
    if (Date.now() - pendingAscTask.ts > 180000) { LOG('runPending: task stale, dropping'); await del('pendingAscTask'); return; }  // stale
    // Wait for the right ASC page to actually be ready — the SPA can take several
    // seconds to render after navigation.
    const wantPrivacy = pendingAscTask.task === 'autoPrivacy';
    // Require the actual interactive element (not just the URL) — ASC's SPA can
    // take several seconds to render the New App "+" button / the privacy page
    // after navigation, and running before it exists is why it "did nothing".
    const ready = () => wantPrivacy
      ? (/distribution\/privacy/.test(location.pathname) && !!document.querySelector('h1,h2,[role="dialog"]'))
      : (!!document.getElementById('new-app-btn-icon') || !!appsNavLink());   // booted on root, or already on Apps
    let ok = false;
    for (let i = 0; i < 100; i++) { if (ready()) { ok = true; break; } await sleep(300); }  // up to ~30s
    LOG('runPending: page ready =', ok, '| task =', pendingAscTask.task, '| bundleId =', pendingAscTask.bundleId);
    const report = async (result) => {
      _ranPending = true;
      await del('pendingAscTask');
      await set({ ascTaskResult: { task: pendingAscTask.task, result, ts: Date.now() } });
      try { chrome.runtime.sendMessage({ type: 'ascTaskDone', task: pendingAscTask.task, result }); } catch (_) {}
    };
    if (!ok) {
      if (pendingAscTask.managed) await report({ ok: false, error: 'App Store Connect page did not finish loading in time (' + location.pathname + ').' });
      return;
    }
    _ranPending = true;
    await del('pendingAscTask');   // claim it so a second tab can't also run it
    const { shipmateExport } = await get('shipmateExport');
    const data = shipmateExport || {};
    let result;
    try {
      result = wantPrivacy
        ? await autoPrivacy(data)
        : await createApp(data, { submit: pendingAscTask.submit, bundleId: pendingAscTask.bundleId });
    } catch (e) { result = { ok: false, error: String(e) }; }
    LOG('runPending: result =', result);
    await set({ ascTaskResult: { task: pendingAscTask.task, result, ts: Date.now() } });
    // Tell the background worker to close this tab (only closes ones it opened).
    try { chrome.runtime.sendMessage({ type: 'ascTaskDone', task: pendingAscTask.task, result }); } catch (_) {}
  }

  // Claim on load (the foreground tab the background worker opened lands here).
  setTimeout(() => { runPending(); }, 800);
})();

/* #37 — SIGN-IN WATCHER. Tells Shipmate when this App Store Connect tab is
   signed in, so the Connect Account step finishes without a manual click. ASC is
   a React SPA, so a post-login transition is often an in-page navigation rather
   than a reload — hence the poll rather than a one-shot check. Heuristic (the
   manual "I'm signed in" button stays as a fallback, so a miss never blocks):
   the unauthenticated site redirects to idmsa.apple.com (where this script does
   not run), so running here on an authenticated path with app chrome means
   signed in. Reports once. */
(function watchAscSignIn() {
  if (location.hostname !== 'appstoreconnect.apple.com') return;
  let reported = false;

  /* AUTHORITATIVE: App Store Connect's own session endpoint returns the signed-in
     user when authenticated, and 401/403 when not. This replaces the old DOM
     heuristic ("the script runs here, so we must be signed in"), which FALSE-
     POSITIVED on Apple's own login page — which ASC serves on this same host, not
     always via an idmsa redirect — and closed the sign-in tab before the user
     could sign in, stranding the key step on a login page in a background tab. */
  async function sessionSignedIn() {
    try {
      const r = await fetch('/olympus/v1/session', { credentials: 'include', headers: { Accept: 'application/json' } });
      if (r.ok) { const j = await r.json().catch(() => null); return !!(j && (j.user || j.provider || j.providerId || j.availableProviders)); }
      if (r.status === 401 || r.status === 403) return false;  // definitely not signed in
      return null;                                             // endpoint changed? inconclusive
    } catch (_) { return null; }
  }

  // A clear sign-in page is definitely NOT signed in (belt-and-suspenders for the
  // inconclusive case, and it keeps us from ever reporting on the login screen).
  function looksLikeLogin() {
    const p = (location.pathname || '').toLowerCase();
    if (/login|sign.?in|welcome|auth/.test(p)) return true;
    return !!document.querySelector('iframe[src*="idmsa.apple.com"], input[type="password"], #account_name_text_field');
  }

  async function check() {
    if (reported) return;
    const auth = await sessionSignedIn();
    let ok;
    if (auth === true) ok = true;
    else if (auth === false) ok = false;
    // Inconclusive: only trust an authenticated app path, and never a login page.
    else ok = !looksLikeLogin() && /^\/(apps|teams|access|agreements|users|analytics|trends)/.test(location.pathname || '');
    if (ok) {
      reported = true;
      try { chrome.runtime.sendMessage({ type: 'ascSignedIn', url: location.href }); } catch (_) {}
    }
  }
  check();
  const iv = setInterval(() => { if (reported) { clearInterval(iv); return; } check(); }, 1500);
})();
