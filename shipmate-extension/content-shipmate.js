// Runs on the Shipmate page. Injects the page-context reader (content scripts
// can't see window.state directly), relays whatever it captures into extension
// storage, and lets the popup request a fresh read.
(function () {
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('inject-read-state.js');
  (document.head || document.documentElement).appendChild(s);
  s.onload = function () { s.remove(); };

  // True only while this content script's extension context is still valid. After
  // the extension is reloaded, the old content script on an already-open page is
  // invalidated — guard every chrome.* call so it fails quietly (the page must be
  // reloaded to get a fresh content script).
  function alive() { try { return !!(chrome.runtime && chrome.runtime.id); } catch (e) { return false; } }

  /* ── SAY HELLO SO SHIPMATE CAN SKIP THE DOWNLOAD (v0.2.0) ───────────────
     Shipmate's Connect Account flow made every user download and install the
     extension even when they already had it, because the page had no way to
     tell. It does now: this posts one message onto the page, and Shipmate
     marks those two steps done.

     BOTH UNPROMPTED AND ON REQUEST, which is the part that matters. This
     content script runs at `document_idle`, so a page that asks once while
     loading can ask before this listener exists — and a page that only
     listens can miss the announcement if it registers late. Doing both
     removes the race in either direction.

     The version rides along because the extension does real work (the app
     record, the App Privacy questionnaire). "Is it current?" will matter more
     than "is it there?" once there are two versions in the wild. */
  function announce() {
    if (!alive()) return;
    var v = '';
    try { v = chrome.runtime.getManifest().version; } catch (e) {}
    try { window.postMessage({ __shipmate: 'present', version: v }, '*'); } catch (e) {}
  }
  announce();

  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data || !alive()) return;
    // Shipmate is asking whether we are here. Answer with the same message we
    // post on load, so the page has one shape to handle either way.
    if (ev.data.__shipmate === 'ping') { announce(); return; }
    if (ev.data.__shipmate === 'export') {
      try { chrome.storage.local.set({ shipmateExport: ev.data.data, shipmateExportAt: Date.now() }); } catch (e) {}
      return;
    }
    // Shipmate asks us to run an ASC task (e.g. createApp at the apprecord build
    // step, or autoPrivacy when the App Privacy step closes). Refresh the export
    // first so the background tab fills from current data, then hand it off.
    if (ev.data.__shipmate === 'ascTask') {
      window.postMessage({ __shipmate: 'request' }, '*');   // pull latest state
      var payload = { type: 'ascTask', task: ev.data.task, submit: ev.data.submit, appId: ev.data.appId, bundleId: ev.data.bundleId };
      setTimeout(function () { if (alive()) { try { chrome.runtime.sendMessage(payload); } catch (e) {} } }, 200);
      return;
    }
    // #37: a connect sign-in started — arm the extension to close the ASC tab and
    // refocus Shipmate once that tab reports signed-in.
    if (ev.data.__shipmate === 'connectSigninStarted') {
      if (alive()) { try { chrome.runtime.sendMessage({ type: 'connectSigninStarted' }); } catch (e) {} }
    }
    // Shipmate asks whether the App Store Connect session is still signed in
    // (no tab opened). Answer with ascSessionState { signedIn: true | false | null }.
    if (ev.data.__shipmate === 'checkAscSession') {
      if (!alive()) return;
      try {
        chrome.runtime.sendMessage({ type: 'checkAscSession' }, function (res) {
          var signedIn = (res && typeof res.signedIn !== 'undefined') ? res.signedIn : null;
          window.postMessage({ __shipmate: 'ascSessionState', signedIn: signedIn }, '*');
        });
      } catch (e) { window.postMessage({ __shipmate: 'ascSessionState', signedIn: null }, '*'); }
    }
  });

  chrome.runtime.onMessage.addListener(function (msg, _sender, reply) {
    if (msg && msg.type === 'refreshShipmate') {
      window.postMessage({ __shipmate: 'request' }, '*');
      reply({ ok: true });
    } else if (msg && msg.type === 'ascTaskResult') {
      // Relay the extension's result back into the Shipmate page so upf.js can
      // advance the build flow (e.g. mark the app record created).
      window.postMessage({ __shipmate: 'ascTaskResult', task: msg.task, result: msg.result }, '*');
      reply({ ok: true });
    } else if (msg && msg.type === 'ascSignedIn') {
      // #37: the ASC tab is signed in — let upf.js auto-finish Connect Account.
      window.postMessage({ __shipmate: 'ascSignedIn' }, '*');
      reply({ ok: true });
    }
    return true;
  });
})();
