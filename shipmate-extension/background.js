// Cross-tab coordinator for the AUTOMATED path (Shipmate-triggered).
//
// createApp runs through chrome.debugger (CDP): it drives App Store Connect with
// TRUSTED navigation and input, because (1) cold-loading a deep SPA route from a
// content script breaks ASC's router, and (2) the Bundle ID list only loads on a
// real (trusted) click. CDP clears both. autoPrivacy still uses the content-script
// path (pendingAscTask → content-asc runPending).

const ASC_ORIGIN = 'https://appstoreconnect.apple.com';

// ---- managed tabs (ones we opened) ----------------------------------------
async function markManaged(id) {
  const { managedAscTabs = [] } = await chrome.storage.local.get('managedAscTabs');
  if (!managedAscTabs.includes(id)) await chrome.storage.local.set({ managedAscTabs: managedAscTabs.concat(id) });
}
async function isManaged(id) {
  const { managedAscTabs = [] } = await chrome.storage.local.get('managedAscTabs');
  return managedAscTabs.includes(id);
}
async function unmarkManaged(id) {
  const { managedAscTabs = [] } = await chrome.storage.local.get('managedAscTabs');
  await chrome.storage.local.set({ managedAscTabs: managedAscTabs.filter((x) => x !== id) });
}
async function closeManaged(id) { await unmarkManaged(id); try { await chrome.tabs.remove(id); } catch (_) {} }

function relayResult(task, result) {
  chrome.storage.local.set({ ascTaskResult: { task, result, ts: Date.now() } });
  chrome.tabs.query({ url: 'https://mtgrimm17.github.io/shipmate-prototype/*' }, (tabs) => {
    (tabs || []).forEach((t) => chrome.tabs.sendMessage(t.id, { type: 'ascTaskResult', task, result }, () => void chrome.runtime.lastError));
  });
}

// ---- CDP primitives --------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function cdp(tabId, method, params) {
  return new Promise((res, rej) => {
    chrome.debugger.sendCommand({ tabId }, method, params || {}, (r) => {
      const e = chrome.runtime.lastError;
      if (e) rej(new Error(e.message)); else res(r);
    });
  });
}
function attach(tabId) {
  return new Promise((res, rej) => chrome.debugger.attach({ tabId }, '1.3', () => {
    const e = chrome.runtime.lastError; if (e) rej(new Error(e.message)); else res();
  }));
}
function detach(tabId) { return new Promise((res) => { try { chrome.debugger.detach({ tabId }, () => { void chrome.runtime.lastError; res(); }); } catch (_) { res(); } }); }

async function evaluate(tabId, expression) {
  const r = await cdp(tabId, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r && r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.text || JSON.stringify(r.exceptionDetails)));
  return r && r.result ? r.result.value : undefined;
}
async function waitFor(tabId, boolExpr, timeout = 20000, every = 300) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { if (await evaluate(tabId, '!!(' + boolExpr + ')')) return true; await sleep(every); }
  return false;
}
// Center of the element an expression returns (after scrolling it into view).
async function rectOf(tabId, elExpr) {
  return evaluate(tabId, `(() => { const el = ${elExpr}; if (!el) return null; el.scrollIntoView({block:'center',inline:'center'}); const r = el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2, w:r.width, h:r.height}; })()`);
}
async function clickAt(tabId, x, y) {
  await cdp(tabId, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp(tabId, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await cdp(tabId, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
}
async function clickEl(tabId, elExpr) {
  const b = await rectOf(tabId, elExpr);
  if (!b || b.w === 0 || b.h === 0) return false;
  await clickAt(tabId, b.x, b.y);
  return true;
}
async function typeText(tabId, text) { await cdp(tabId, 'Input.insertText', { text }); }

// ---- createApp over CDP ----------------------------------------------------
const J = JSON.stringify;  // safe string embedding in evaluated expressions

async function cdpCreateApp(tabId, data) {
  const log = (...a) => console.log('[Shipmate CDP]', ...a);
  const bundleId = data.bundleId || '';
  if (bundleId && !bundleId.endsWith('.test')) return { ok: false, error: `Refusing to create an app for "${bundleId}": only .test bundle IDs may be used.` };
  const name = data.name || 'App - Mark Demo';
  const sku = data.sku || 'mark_demo_app';

  await attach(tabId);
  try {
    // 1) Real navigation to root, then IN-APP nav to Apps so routing initializes.
    await cdp(tabId, 'Page.enable');
    // Pretend the (background) tab is focused so Chrome doesn't throttle its timers
    // /rAF — that lets a heavy SPA render and run normally while hidden.
    try { await cdp(tabId, 'Emulation.setFocusEmulationEnabled', { enabled: true }); } catch (_) {}
    await cdp(tabId, 'Page.navigate', { url: ASC_ORIGIN + '/' });
    await waitFor(tabId, `document.getElementById('new-app-btn-icon') || [...document.querySelectorAll('a,button')].some(e => e.textContent.trim()==='Apps')`, 30000);
    if (!await evaluate(tabId, `!!document.getElementById('new-app-btn-icon')`)) {
      log('clicking Apps nav');
      await clickEl(tabId, `[...document.querySelectorAll('a,button,[role="link"]')].find(e => e.textContent.trim()==='Apps')`);
      if (!await waitFor(tabId, `!!document.getElementById('new-app-btn-icon')`, 25000)) return { ok: false, error: 'could not reach the Apps page' };
    }

    // 2) Open the New App dialog: "+" then the "New App" menu item.
    await clickEl(tabId, `document.getElementById('new-app-btn-icon')`);
    await waitFor(tabId, `document.getElementById('new-app-btn') || [...document.querySelectorAll('button,a,[role="menuitem"]')].some(e => /^new app$/i.test(e.textContent.trim()))`, 8000);
    await clickEl(tabId, `document.getElementById('new-app-btn') || [...document.querySelectorAll('button,a,[role="menuitem"]')].find(e => /^new app$/i.test(e.textContent.trim()))`);
    if (!await waitFor(tabId, `!!document.getElementById('name')`, 12000)) return { ok: false, error: 'New App dialog did not open' };

    // 3) macOS platform (trusted click so React registers it).
    await clickEl(tabId, `document.getElementById('platformsById.MAC_OS')`);

    // 4) Name — focus the field and type.
    await clickEl(tabId, `document.getElementById('name')`);
    await typeText(tabId, name);

    // 5) Primary Language — set by value (static list, present immediately).
    await evaluate(tabId, `(() => { const s=document.getElementById('primaryLocale'); if(!s) return; const o=[...s.options].find(o=>/english \\(u\\.s\\.\\)/i.test(o.textContent)); if(o){ const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; set.call(s,o.value); s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); } })()`);

    // 6) Bundle ID — trusted-click to trigger ASC's lazy fetch, wait for options,
    // then SELECT in a way React registers. Try three methods, checking whether
    // Create enables after each, and log the dropdown structure for diagnosis.
    const createExpr0 = `[...document.querySelectorAll('button')].find(b => b.textContent.trim()==='Create')`;
    const createEnabled = () => evaluate(tabId, `(() => { const b=${createExpr0}; return !!(b && !b.disabled); })()`);
    // Judge bundle selection by the VALUE being set — NOT by Create-enabled, which
    // also needs SKU (filled later). Checking Create here wrongly looked like a
    // failure and returned early before SKU was typed.
    const bundleSet = () => evaluate(tabId, `(() => { const s=document.getElementById('bundleId'); return !!(s && s.value===${J(bundleId)}); })()`);
    await clickEl(tabId, `document.getElementById('bundleId')`);
    const loaded = await waitFor(tabId, `(() => { const s=document.getElementById('bundleId'); return s && s.options && s.options.length>1 && ![...s.options].some(o=>/loading/i.test(o.textContent)); })()`, 25000);
    log('bundle options loaded =', loaded);
    if (!loaded) return { ok: false, error: 'Bundle ID list never loaded (still "Loading…") even with a trusted click.' };

    const diag = await evaluate(tabId, `(() => { const s=document.getElementById('bundleId'); const r=s.getBoundingClientRect(); return { roleOptions: document.querySelectorAll('[role="option"]').length, listboxes: document.querySelectorAll('[role="listbox"]').length, bidW: Math.round(r.width), bidH: Math.round(r.height), bidHidden: r.width===0||r.height===0 }; })()`);
    log('bundle diag =', diag);

    // It's a NATIVE <select> (no DOM listbox). Close the OS popup our load-click
    // opened, then select via TRUSTED keyboard type-ahead on the FOCUSED-but-CLOSED
    // select — that changes the value inline and fires a trusted change (committing
    // in the open OS popup doesn't work over CDP). The prefix to type is the game
    // name (option text is "<game> - <bundle id>").
    const typeAhead = (data.name || 'Monster Train 2').split(' - ')[0].split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    // Close the OS select popup our load-click opened WITHOUT pressing Escape —
    // Escape closes the whole New App dialog. Clicking a neutral field dismisses
    // the popup and leaves the dialog open.
    await clickEl(tabId, `document.getElementById('name')`);
    await sleep(250);
    if (!await evaluate(tabId, `!!document.getElementById('bundleId')`)) return { ok: false, error: 'New App dialog closed unexpectedly before selecting the bundle' };

    let done = false;
    for (let b = 0; b < 2 && !done; b++) {
      await evaluate(tabId, `(() => { const b=document.getElementById('bundleId'); if(b) b.focus(); })()`);
      await sleep(150);
      for (const ch of typeAhead) {
        await cdp(tabId, 'Input.dispatchKeyEvent', { type: 'keyDown', text: ch, key: ch });
        await cdp(tabId, 'Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
        await sleep(80);
      }
      await sleep(400);
      let val = await evaluate(tabId, `document.getElementById('bundleId').value`);
      done = await bundleSet();
      log('type-ahead attempt', b, '| typed "' + typeAhead + '" | value =', val, '| Create enabled =', done);
      if (!done) {   // blur can commit a pending selection and fire change
        await evaluate(tabId, `document.getElementById('bundleId').blur()`);
        await sleep(300);
        done = await bundleSet();
        log('after blur → value =', await evaluate(tabId, `document.getElementById('bundleId').value`), '| Create enabled =', done);
      }
    }
    // Fallback — set the value + fire change (works only if ASC reads native value).
    if (!done) {
      await evaluate(tabId, `(() => { const s=document.getElementById('bundleId'); const o=[...s.options].find(o=>o.value===${J(bundleId)}||(o.textContent||'').includes(${J(bundleId)})); if(o){ const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; set.call(s,o.value); s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); } })()`);
      await sleep(500);
      done = await bundleSet();
      log('value-set fallback → Create enabled =', done);
    }
    if (!done) return { ok: false, error: 'could not set the Bundle ID value (' + bundleId + ') — see [Shipmate CDP] logs' };

    // 7) SKU — focus and type.
    await clickEl(tabId, `document.getElementById('sku')`);
    await typeText(tabId, sku);

    // 8) Full Access.
    await clickEl(tabId, `document.getElementById('userAccessFull')`);
    await sleep(300);

    // 9) Create — wait for it to enable, then click.
    const createExpr = `[...document.querySelectorAll('button')].find(b => b.textContent.trim()==='Create')`;
    const enabled = await waitFor(tabId, `(() => { const b=${createExpr}; return b && !b.disabled; })()`, 8000);
    log('Create enabled =', enabled);
    if (!enabled) return { ok: false, error: 'Create button did not enable — a required field is missing (bundle likely not registered in React state).' };
    await clickEl(tabId, createExpr);

    // 10) Confirm creation — POSITIVELY. The old check also treated the Create
    //     button vanishing (`!b`) as success, so a dialog that merely closed or
    //     reset on Apple's validation error (duplicate NAME or SKU) reported a
    //     create that never happened — the step went green and the upload failed
    //     three steps later with "No app record". Now success means ONE thing:
    //     ASC navigated to the new app's page (/apps/<id>). A lingering dialog
    //     with an inline error is a failure we surface verbatim.
    //     Three outcomes after Create:
    //       (a) ASC navigates straight to /apps/<id> — created.
    //       (b) ASC parks on a post-create dialog that says the app "has been
    //           created" (e.g. "user access settings could not be saved" — benign;
    //           all users have access by default). The app record exists; we click
    //           "Go to App Information" to land on /apps/<id> and read its id.
    //       (c) The create dialog lingers with a validation error (duplicate name
    //           or SKU). A real failure — surfaced verbatim.
    //     "has been created" is checked BEFORE the error scan so the benign
    //     interstitial is never misread as a rejection.
    const statusExpr = `(() => {
      const path = location.pathname.match(/\\/apps\\/(\\d+)/);
      if (path) return { state: 'created', appId: path[1] };
      if (/has been created/i.test(document.body.innerText || '')) return { state: 'created-interstitial' };
      const texts = [];
      document.querySelectorAll('[role="alert"], [aria-live="assertive"], [aria-live="polite"], [class*="error" i], [class*="invalid" i], [class*="validation" i]').forEach(el => {
        const t = (el.innerText || el.textContent || '').trim();
        if (t && t.length < 400) texts.push(t);
      });
      if (!texts.length) {
        const dlg = (document.querySelector('[role="dialog"]') || document.body);
        const line = (dlg.innerText || '').split('\\n').map(s => s.trim())
          .find(s => /already (being used|in use|exists|taken)|not available|must be unique|another app|choose a different|unavailable/i.test(s));
        if (line) texts.push(line);
      }
      const err = texts.find(t => /already|not available|unique|in use|taken|unavailable|different|SKU|name/i.test(t));
      if (err) return { state: 'error', msg: err };
      const dlgOpen = !!document.getElementById('name') || !!document.getElementById('bundleId');
      return { state: dlgOpen ? 'pending' : 'unknown' };
    })()`;
    let result = null;
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      const s = await evaluate(tabId, statusExpr);
      if (s && s.state === 'created') { result = { ok: true, created: true, appId: s.appId, note: 'Created the app record (ASC id ' + s.appId + ').' }; break; }
      if (s && s.state === 'created-interstitial') {
        // App exists; dismiss the interstitial by going to App Information so the
        // tab lands on /apps/<id> (and isn't left stuck on the dialog).
        await clickEl(tabId, `[...document.querySelectorAll('a,button')].find(e => /go to app information/i.test(e.textContent||''))`);
        const nav = await waitFor(tabId, `/\\/apps\\/\\d+/.test(location.pathname)`, 8000);
        const appId = nav ? await evaluate(tabId, `(location.pathname.match(/\\/apps\\/(\\d+)/)||[])[1] || null`) : null;
        result = { ok: true, created: true, appId, note: 'Created the app record' + (appId ? ' (ASC id ' + appId + ')' : '') + '. (App Store Connect could not auto-set user access — harmless; all users have access by default.)' };
        break;
      }
      if (s && s.state === 'error') { result = { ok: false, error: 'App Store Connect rejected the app: ' + s.msg }; break; }
      await sleep(500);
    }
    if (!result) {
      const last = await evaluate(tabId, statusExpr);
      result = { ok: false, error: 'Clicked Create but the app was not created' + (last && last.msg ? ': ' + last.msg : ' — the dialog never opened the new app page, so it was likely rejected (e.g. duplicate name or SKU).') };
    }
    log('create result =', JSON.stringify(result));
    return result;
  } finally {
    await detach(tabId);
  }
}

// Click a key row's one-time Download, then confirm the "downloaded only once"
// dialog (its own Download button sits next to a Cancel). Shared by generate and
// download-existing. Leaves ~3s for the .p8 to finish before the caller detaches.
// Returns the .p8 PEM TEXT (captured over CDP from the download response), or
// null. We capture the body rather than let it hit ~/Downloads, because the
// agent (a background launchd process) can't read Downloads on macOS (TCC).
// Capture a key's one-time .p8 TEXT without ever writing a file. The finished
// key never crosses the wire as a plain response (CDP capture saw nothing) and
// we can't redirect the download to a readable path (chrome.debugger blocks
// Page/Browser.setDownloadBehavior). The key is revealed to the page's own JS at
// generation/download and turned into a Blob (or an XHR/fetch JSON payload), so
// we hook URL.createObjectURL + fetch + XHR IN THE PAGE and read the text there.
// Installed BEFORE Generate (the reveal), since ASC may build the Blob then.
const KEY_HOOK_SRC = `(() => {
  if (window.__shipmateKeyHook) return 'already';
  window.__shipmateKeyHook = true;
  window.__shipmateCapturedKey = null;
  window.__shipmateDiag = { blobs: 0, blobInfo: [], net: [] };
  const cap = (src, t) => {
    try {
      if (!t || window.__shipmateCapturedKey) return;
      const hasPem = t.indexOf('BEGIN PRIVATE KEY') !== -1;
      const hasField = t.indexOf('privateKey') !== -1 || t.indexOf('keyContent') !== -1;
      if (hasPem || hasField) window.__shipmateDiag.net.push(src + (hasPem ? '[pem]' : '[field]') + ':' + t.length);
      if (hasPem) { window.__shipmateCapturedKey = t; return; }
      if (hasField) {
        // ASC's generate response carries the PKCS#8 key as base64 (no PEM armor)
        // in a JSON field named privateKey/keyContent. Pull the first substantial
        // string value for either key, anywhere in the payload (list responses
        // carry privateKey:null, so require a real value).
        let j; try { j = JSON.parse(t); } catch (e) { return; }
        const dig = (o) => {
          if (!o || typeof o !== 'object') return null;
          for (const k in o) {
            const v = o[k];
            if ((k === 'privateKey' || k === 'keyContent') && typeof v === 'string' && v.length > 100) return v;
            if (v && typeof v === 'object') { const r = dig(v); if (r) return r; }
          }
          return null;
        };
        const found = dig(j);
        if (found) { window.__shipmateCapturedKey = found; window.__shipmateDiag.net.push(src + '[got:' + found.length + ']'); }
      }
    } catch (e) {}
  };
  const oc = URL.createObjectURL;
  URL.createObjectURL = function (obj) {
    try { if (obj instanceof Blob) { window.__shipmateDiag.blobs++; window.__shipmateDiag.blobInfo.push((obj.type || '?') + ':' + obj.size); obj.text().then(t => cap('blob', t)).catch(function () {}); } } catch (e) {}
    return oc.apply(this, arguments);
  };
  const of = window.fetch;
  if (of) window.fetch = function () { const args = arguments; return of.apply(this, args).then(function (res) { try { res.clone().text().then(function (t) { cap('fetch', t); }).catch(function () {}); } catch (e) {} return res; }); };
  const XP = XMLHttpRequest.prototype, osend = XP.send;
  XP.send = function () { try { this.addEventListener('load', function () { try { cap('xhr', this.responseText); } catch (e) {} }); } catch (e) {} return osend.apply(this, arguments); };
  return 'installed';
})()`;

// Install the page hook (idempotent). Call BEFORE Generate/Download.
async function _installKeyHook(tabId, log) {
  try { log && log('key hook ' + (await evaluate(tabId, KEY_HOOK_SRC))); } catch (e) { log && log('key hook install failed: ' + (e && e.message)); }
}

// Pull a clean PKCS#8 PEM out of whatever was captured — a Blob's text is
// already clean; a JSON payload has the PEM with escaped newlines. Returns a
// canonical 64-char-wrapped PEM, or null.
function _wrapPem(b64body) {
  const b64 = b64body.replace(/\\r/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
  const lines = b64.match(/.{1,64}/g) || [];
  return '-----BEGIN PRIVATE KEY-----\n' + lines.join('\n') + '\n-----END PRIVATE KEY-----\n';
}

function _toPem(raw) {
  if (!raw) return null;
  // 1) Already a PEM (a Blob's text, or a JSON-escaped PEM).
  const m = raw.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
  if (m) return _wrapPem(m[1]);
  // Candidate base64 (ASC's privateKey field), stripped of escapes/whitespace.
  const stripped = raw.replace(/\\r/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(stripped) || stripped.length < 100) return null;
  // 2) ASC base64-encodes the whole .p8 TEXT (double-encoded), so decoding the
  //    field yields the real PEM — the case this key pipeline actually hits.
  try {
    const decoded = atob(stripped);
    const dm = decoded.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
    if (dm) return _wrapPem(dm[1]);
  } catch (e) {}
  // 3) Otherwise treat it as base64 of the raw PKCS#8 DER.
  return _wrapPem(stripped);
}

// Click a key row's one-time Download (confirming the "only once" dialog), then
// poll the page hook for the captured key text and return a clean PEM, or null.
async function _cdpDownloadKeyRow(tabId, keyId, log) {
  const dlForKey = `(() => {
    const kid = ${JSON.stringify(keyId)};
    const leaf = [...document.querySelectorAll('*')].find(e => e.children.length===0 && (e.textContent||'').trim()===kid);
    if (!leaf) return null;
    let row = leaf.parentElement;
    for (let i=0;i<6 && row;i++){ const dl=[...row.querySelectorAll('a,button')].find(e => /^\\s*download\\s*$/i.test((e.textContent||'').trim())); if (dl) return dl; row=row.parentElement; }
    return null;
  })()`;
  if (!await clickEl(tabId, dlForKey)) return null;
  const confirmDlExpr = `(() => {
    const dls = [...document.querySelectorAll('button')].filter(b => /^\\s*download\\s*$/i.test((b.textContent||'').trim()));
    for (const b of dls) { let p=b.parentElement; for (let i=0;i<5&&p;i++){ if ([...p.querySelectorAll('button')].some(x => /^\\s*cancel\\s*$/i.test((x.textContent||'').trim()))) return b; p=p.parentElement; } }
    return null;
  })()`;
  if (await waitFor(tabId, `!!(${confirmDlExpr})`, 6000)) { await clickEl(tabId, confirmDlExpr); log && log('confirmed download dialog'); }
  else { log && log('no download confirm dialog appeared (direct download?)'); }

  // Poll the hook. Fallback: a lingering data:-URL download anchor.
  const pollExpr = `(() => {
    if (window.__shipmateCapturedKey) return window.__shipmateCapturedKey;
    const a = [...document.querySelectorAll('a[download]')].find(x => /^data:/.test(x.href||''));
    if (a) { try { const parts=a.href.split(','); const dec = /;base64,/.test(a.href) ? atob(parts[1]) : decodeURIComponent(parts[1]); if (dec.indexOf('BEGIN PRIVATE KEY')!==-1) return dec; } catch(e){} }
    return null;
  })()`;
  let raw = null;
  for (let i = 0; i < 30 && !raw; i++) { raw = await evaluate(tabId, pollExpr); if (!raw) await sleep(250); }
  const pem = _toPem(raw);
  if (pem) { log && log('captured .p8 (' + pem.length + ' bytes)'); return pem; }
  // Nothing captured — dump diagnostics so we can see what ASC actually did.
  try { const diag = await evaluate(tabId, `window.__shipmateDiag`); log && log('capture MISS; diag = ' + JSON.stringify(diag)); } catch (_) {}
  return null;
}

// ---- set up the ASC API key over CDP (reuse-or-generate) -------------------
// On Users & Access → Integrations → App Store Connect API (Team Keys): if an
// existing "Shipmate" key still has a one-time Download link (never downloaded),
// download THAT — no new key. Otherwise open "Generate API Key", fill Name (for
// the signed-in developer) + Access=Admin, Generate, and download the new key.
// Either way the .p8 TEXT is captured from the page's own JS (the hook on
// createObjectURL/fetch/XHR) — never ~/Downloads, which the agent can't read on
// macOS (TCC) — and returned to Shipmate, which stores it via /account.
async function cdpGenerateApiKey(tabId, data) {
  const log = (...a) => console.log('[Shipmate CDP key]', ...a);
  let keyName = 'Shipmate';   // refined with the signed-in developer below
  const API_URL = ASC_ORIGIN + '/access/integrations/api';

  await attach(tabId);
  try {
    await cdp(tabId, 'Page.enable');
    try { await cdp(tabId, 'Emulation.setFocusEmulationEnabled', { enabled: true }); } catch (_) {}
    await cdp(tabId, 'Page.navigate', { url: API_URL });
    await sleep(2500);
    // If we were bounced to a sign-in page, the user isn't signed in. A BACKGROUND
    // tab can't do Apple's 2FA, so fail fast with a clear message rather than
    // hanging on the 25s wait below. (The sign-in step should have established the
    // session; this is the safety net if it didn't.)
    const onLogin = await evaluate(tabId, `(() => {
      const p = (location.pathname||'').toLowerCase();
      if (/login|sign.?in|welcome|auth/.test(p)) return true;
      return !!document.querySelector('iframe[src*="idmsa.apple.com"], input[type="password"], #account_name_text_field');
    })()`);
    if (onLogin) {
      return { ok: false, needSignIn: true, error: 'You’re not signed in to App Store Connect. Finish the “Sign in to App Store Connect” step first, then set up the key.' };
    }
    if (!await waitFor(tabId, `/access\\/integrations\\/api/.test(location.pathname) && /Issuer ID/i.test(document.body.innerText)`, 25000)) {
      return { ok: false, error: 'Could not load the App Store Connect API keys page (need Admin access on this team).' };
    }
    await sleep(800);
    // Hook the page NOW — before Generate reveals the key — so we catch the Blob
    // or JSON the key is handed to the page in, whichever ASC uses.
    await _installKeyHook(tabId, log);

    // 1) Issuer ID — the UUID under "Issuer ID".
    const issuerId = await evaluate(tabId, `(() => {
      const re = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const leaf = [...document.querySelectorAll('*')].find(e => e.children.length===0 && re.test((e.textContent||'').trim()));
      const m = leaf && (leaf.textContent||'').match(re); return m ? m[0] : null;
    })()`);
    log('issuerId =', issuerId);
    if (!issuerId) return { ok: false, error: 'Could not read the Issuer ID.' };

    // REUSE: an existing "Shipmate" key that still has a one-time Download link
    // (never downloaded). If found, skip generation and download that one.
    let keyId = await evaluate(tabId, `(() => {
      const dls = [...document.querySelectorAll('a,button')].filter(e => /^\\s*download\\s*$/i.test((e.textContent||'').trim()));
      for (const dl of dls) {
        let row = dl.closest('tr,[role="row"],li') || dl.parentElement;
        for (let i=0;i<6 && row && !/^shipmate\\b/i.test((row.innerText||'').trim()); i++) row = row.parentElement;
        if (row && /^shipmate\\b/i.test((row.innerText||'').trim())) { const m=(row.innerText||'').match(/\\b([A-Z0-9]{10})\\b/); if (m) return m[1]; }
      }
      return null;
    })()`);
    const reused = !!keyId;
    if (reused) {
      log('reusing undownloaded Shipmate key =', keyId);
    } else {
    // Name the key plainly "Shipmate". The Team Keys table already has a
    // "Generated By" column showing the signed-in person (e.g. "Mark Grimm"),
    // and keys are one per person, so the person's name adds nothing — and
    // scraping it was unreliable (it kept falling back to the issuer prefix).
    // "Shipmate" also keeps the reuse lookup above (/^shipmate\b/i) working.
    keyName = 'Shipmate';
    log('key name =', keyName);

    // 2) Open the Generate API Key dialog (the small "+" next to "Active (N)").
    const plusExpr = `(() => {
      const all = [...document.querySelectorAll('*')];
      const h = all.find(e => e.children.length===0 && /^Active\\s*\\(\\d+\\)$/.test((e.textContent||'').trim()));
      if (!h) return null;
      let p = h.parentElement;
      for (let i=0;i<4 && p;i++){ const b=[...p.querySelectorAll('button')].find(x => { const r=x.getBoundingClientRect(); return r.width>0 && r.width<60 && r.height<60; }); if (b) return b; p=p.parentElement; }
      return null;
    })()`;
    if (!await clickEl(tabId, plusExpr)) return { ok: false, error: 'Could not find the "+" Generate API Key button.' };
    if (!await waitFor(tabId, `!!document.getElementById('name')`, 8000)) return { ok: false, error: 'The Generate API Key dialog did not open.' };
    await sleep(400);

    // 3) Name.
    await clickEl(tabId, `document.getElementById('name')`);
    await sleep(150);
    await typeText(tabId, keyName);
    await sleep(200);

    // 4) Access role = Admin. Open the "Select Roles" control, then pick Admin.
    const rolesExpr = `(() => {
      const inp = document.querySelector('input[name="roles"]');
      if (inp) { const r = inp.getBoundingClientRect(); if (r.width>0 && r.height>0) return inp; }
      return [...document.querySelectorAll('*')].find(e => {
        const ph = (e.getAttribute && e.getAttribute('placeholder')) || '';
        return /select roles/i.test(ph) || (e.children.length===0 && /^select roles$/i.test((e.textContent||'').trim()));
      }) || null;
    })()`;
    // "Developer"/"Finance"/"Marketing" appear ONLY in the open dropdown — never
    // in the key table behind the dialog (which only shows Admin/App Manager). So
    // they're the reliable "dropdown is open" signal, and the Admin OPTION is the
    // one that sits in the same popup as "Developer" (not a table cell).
    const dropdownOpen = `[...document.querySelectorAll('*')].some(e => e.children.length===0 && /^(Developer|Finance|Marketing|Sales and Reports|Customer Support)$/.test((e.textContent||'').trim()) && e.getBoundingClientRect().width>0)`;
    let opened = false;
    for (let attempt = 0; attempt < 3 && !opened; attempt++) {
      const rc = await clickEl(tabId, rolesExpr);
      log('clicked roles control (attempt ' + attempt + ') =', rc);
      opened = await waitFor(tabId, dropdownOpen, 3500);
    }
    if (!opened) {
      const diag = await evaluate(tabId, `(() => ({ listboxes: document.querySelectorAll('[role="listbox"],[role="menu"]').length, roleInput: !!document.querySelector('input[name="roles"]') }))()`);
      log('dropdown never opened; diag =', JSON.stringify(diag));
      return { ok: false, error: 'The Access role dropdown did not open.' };
    }
    const adminOptExpr = `(() => {
      const dev = [...document.querySelectorAll('*')].find(e => e.children.length===0 && (e.textContent||'').trim()==='Developer' && e.getBoundingClientRect().width>0);
      if (!dev) return null;
      let box = dev.parentElement;
      for (let i=0;i<6 && box;i++){ const a=[...box.querySelectorAll('*')].find(e => e.children.length===0 && (e.textContent||'').trim()==='Admin' && e.getBoundingClientRect().width>0); if (a) return a; box=box.parentElement; }
      return null;
    })()`;
    const ac = await clickEl(tabId, adminOptExpr);
    log('clicked Admin option =', ac);
    await sleep(600);

    // 5) Snapshot the existing Key IDs, THEN Generate. The new key is the Key ID
    //    that wasn't present before — not just any row with a Download link, since
    //    older undownloaded keys keep theirs (that's how it grabbed 9FFR396636).
    const idsExpr = `[...new Set((document.body.innerText.match(/\\b[A-Z0-9]{10}\\b/g)||[]))]`;
    const beforeIds = (await evaluate(tabId, idsExpr)) || [];
    log('existing key ids =', beforeIds.length);
    const genExpr = `[...document.querySelectorAll('button')].find(b => (b.textContent||'').trim()==='Generate')`;
    if (!await waitFor(tabId, `(() => { const b=${genExpr}; return !!(b && !b.disabled); })()`, 8000)) {
      return { ok: false, error: 'Generate did not enable — the Admin role was not applied.' };
    }
    await clickEl(tabId, genExpr);

    // 6) Wait for the NEW Key ID (one not in beforeIds) to appear.
    const newIdExpr = `(() => {
      const before = ${JSON.stringify(beforeIds)};
      const now = [...new Set((document.body.innerText.match(/\\b[A-Z0-9]{10}\\b/g)||[]))];
      const neu = now.filter(id => !before.includes(id));
      return neu.length ? neu[0] : null;
    })()`;
    if (!await waitFor(tabId, `!!(${newIdExpr})`, 20000)) return { ok: false, error: 'Clicked Generate but no new key appeared.' };
    await sleep(600);
    keyId = await evaluate(tabId, newIdExpr);
    log('new keyId =', keyId);
    if (!keyId) return { ok: false, error: 'Generated the key but could not read its new Key ID.' };
    }  // end of generate branch

    // Capture the key's one-time .p8 TEXT (same path whether we reused an existing
    // undownloaded key or generated a new one) by hooking the client-side Blob —
    // no file, no ~/Downloads, no TCC. Shipmate stores it via /account.
    const pem = await _cdpDownloadKeyRow(tabId, keyId, log);
    if (!pem) return { ok: false, error: (reused ? 'Found' : 'Generated') + ' key ' + keyId + ' but couldn’t capture its .p8.' };

    log(reused ? 'reused' : 'generated', JSON.stringify({ issuerId, keyId, reused }));
    return { ok: true, created: true, reused, issuerId, keyId, key: pem };
  } finally {
    await detach(tabId);
  }
}

// ---- task entry ------------------------------------------------------------
async function handleAscTask(msg) {
  if (msg.task === 'generateApiKey' || msg.task === 'downloadApiKey') {
    // One reuse-or-generate path. Background tab (no focus stealing); the
    // service-worker [Shipmate CDP key] logs are still readable while hidden.
    const tab = await chrome.tabs.create({ url: ASC_ORIGIN + '/access/integrations/api', active: false });
    await markManaged(tab.id);
    cdpGenerateApiKey(tab.id, {})
      .then((result) => { relayResult('generateApiKey', result); if (result && result.ok) setTimeout(() => closeManaged(tab.id), 1500); })
      .catch((e) => relayResult('generateApiKey', { ok: false, error: String(e) }));
    return { ok: true, tabId: tab.id };
  }
  if (msg.task === 'createApp') {
    const { shipmateExport } = await chrome.storage.local.get('shipmateExport');
    const appName = (shipmateExport && shipmateExport.appName) || 'App';
    const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const q = ' - Mark Demo';
    let base = appName.trim(); if (base.length > 30 - q.length) base = base.slice(0, 30 - q.length).trim();
    const name = (base + q).slice(0, 30);
    const sku = 'mark_demo_' + (slug(appName) || 'app');
    const tab = await chrome.tabs.create({ url: ASC_ORIGIN + '/', active: false });  // BACKGROUND: the debugger banner lives on this hidden tab
    await markManaged(tab.id);
    cdpCreateApp(tab.id, { bundleId: msg.bundleId || null, name, sku })
      .then((result) => { relayResult('createApp', result); if (result && result.created) setTimeout(() => closeManaged(tab.id), 800); })
      .catch((e) => relayResult('createApp', { ok: false, error: String(e) }));
    return { ok: true, tabId: tab.id };
  }

  // autoPrivacy: content-script path (unchanged).
  const { ascAppId } = await chrome.storage.local.get('ascAppId');
  let appId = msg.appId || ascAppId || null;
  if (!appId) {
    const tabs = await chrome.tabs.query({ url: ASC_ORIGIN + '/apps/*' });
    for (const t of tabs) { const m = (t.url || '').match(/\/apps\/(\d+)/); if (m) { appId = m[1]; break; } }
  }
  await chrome.storage.local.set({ pendingAscTask: { task: msg.task, submit: !!msg.submit, bundleId: msg.bundleId || null, ts: Date.now(), managed: true } });
  const url = appId ? `${ASC_ORIGIN}/apps/${appId}/distribution/privacy` : ASC_ORIGIN + '/';
  const tab = await chrome.tabs.create({ url, active: true });
  await markManaged(tab.id);
  setTimeout(() => { isManaged(tab.id).then((m) => { if (m) closeManaged(tab.id); }); }, 120000);
  return { ok: true, tabId: tab.id };
}

// #37: armed by Shipmate when a connect sign-in starts; the next ASC tab that
// reports signed-in is the one Shipmate opened, so we close it and refocus
// Shipmate. Times out so it never closes an unrelated ASC tab later.
let _awaitingConnectSignin = false;
let _awaitTimer = null;

function _focusShipmate() {
  chrome.tabs.query({ url: 'https://mtgrimm17.github.io/shipmate-prototype/*' }, (tabs) => {
    const t = (tabs || [])[0];
    if (!t) return;
    try { chrome.tabs.update(t.id, { active: true }, () => void chrome.runtime.lastError); } catch (_) {}
    if (t.windowId != null) { try { chrome.windows.update(t.windowId, { focused: true }, () => void chrome.runtime.lastError); } catch (_) {} }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  // Silent session check: is the browser's App Store Connect session still alive?
  // Fetched from the service worker with the site's cookies (host permission), so
  // Shipmate can skip the sign-in tab entirely when the user signed in earlier.
  if (msg && msg.type === 'checkAscSession') {
    fetch('https://appstoreconnect.apple.com/olympus/v1/session', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(async (r) => {
        if (r.ok) { const j = await r.json().catch(() => null); return !!(j && (j.user || j.provider || j.providerId || j.availableProviders)); }
        if (r.status === 401 || r.status === 403) return false;
        return null;
      }, () => null)
      .then((signedIn) => reply({ signedIn }));
    return true;
  }
  if (msg && msg.type === 'ascTask') { handleAscTask(msg).then(reply, (e) => reply({ ok: false, error: String(e) })); return true; }
  if (msg && msg.type === 'connectSigninStarted') {   // #37: arm tab-close
    _awaitingConnectSignin = true;
    if (_awaitTimer) clearTimeout(_awaitTimer);
    _awaitTimer = setTimeout(() => { _awaitingConnectSignin = false; }, 5 * 60 * 1000);
    return false;
  }
  if (msg && msg.type === 'ascSignedIn') {   // #37: ASC tab reports signed-in → tell Shipmate
    chrome.tabs.query({ url: 'https://mtgrimm17.github.io/shipmate-prototype/*' }, (tabs) => {
      (tabs || []).forEach((t) => chrome.tabs.sendMessage(t.id, { type: 'ascSignedIn' }, () => void chrome.runtime.lastError));
    });
    // If a connect sign-in was in progress, this is the tab Shipmate opened:
    // close it and bring Shipmate back to the front.
    if (_awaitingConnectSignin && sender && sender.tab && sender.tab.id != null) {
      _awaitingConnectSignin = false;
      if (_awaitTimer) { clearTimeout(_awaitTimer); _awaitTimer = null; }
      const tabId = sender.tab.id;
      setTimeout(() => { try { chrome.tabs.remove(tabId, () => void chrome.runtime.lastError); } catch (_) {} _focusShipmate(); }, 500);
    }
    return false;
  }
  if (msg && msg.type === 'ascTaskDone') {   // from content-asc (autoPrivacy path)
    relayResult(msg.task, msg.result);
    const id = sender.tab && sender.tab.id;
    const r = msg.result || {};
    if (id != null && (r.created || r.done)) isManaged(id).then((m) => { if (m) setTimeout(() => closeManaged(id), 600); });
    return false;
  }
  return false;
});

// If the user closes a tab we're debugging, Chrome detaches automatically; clean
// our managed list so we don't try to close it again.
chrome.tabs.onRemoved.addListener((id) => { unmarkManaged(id); });

chrome.runtime.onInstalled.addListener(function () {});
