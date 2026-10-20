// Runs in the PAGE context (not the content-script isolated world) so it can
// read Shipmate's global `state` / `UPF`. Serializes only the two web-only
// things App Store Connect gives no API for — app identity + the App Privacy
// matrix — and posts them back to the content script. No agent required.
(function () {
  function grab() {
    try {
      // Shipmate declares `state` and `UPF` as top-level consts in classic
      // scripts — they live in the shared global lexical scope, NOT on window.
      // This file is injected as a page <script>, so the bare names resolve.
      var s = (typeof state !== 'undefined' && state) ? state : (window.state || {});
      var u = (typeof UPF !== 'undefined' && UPF) ? UPF : (window.UPF || null);
      var ios = s.iosSubmitAnswers || {};   // Content Rating + App Privacy live here (shared with Mac)
      var mac = s.macSubmitAnswers || {};
      var f = s.formData || {};
      var game = (u && u.game) ? u.game : null;
      return {
        ok: true,
        appName: (game && game.name) || f.title || '',
        bundleId: ((s.upf && s.upf.manifest && s.upf.manifest.bundleId) || ''),
        developer: (s.webSite && s.webSite.developer) || '',
        publisher: (s.webSite && s.webSite.publisher) || '',
        primaryCategory: f.primaryCategory || (mac.category && mac.category.primary) || 'Games',
        privacy: {
          collectsData: ios.collectsData,        // 'yes' | 'no' | null
          perType: ios.dataPerType || {}          // { typeId: { purposes:[], identity, tracking } }
        },
        capturedFrom: location.href
      };
    } catch (e) { return { ok: false, error: String(e) }; }
  }
  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data || ev.data.__shipmate !== 'request') return;
    window.postMessage({ __shipmate: 'export', data: grab() }, '*');
  });
  window.postMessage({ __shipmate: 'export', data: grab() }, '*'); // announce on load
})();
