/* ==========================================================================
   THE MARKETING PAGE — [gamename].shipmate.games
   ==========================================================================

   The page a developer gets for free when they fill in a submission. Designed
   standalone in web-templates-mockup.html against real Steam data, and moved
   here once it was worth wiring to the real thing.

   TWO ENTRY POINTS, and the split between them is not cosmetic:

     webPageHTML(state)  builds the markup and returns it as a string, the way
                         everything else in render.js works.
     webPageMount()      runs AFTER that markup is in the document, and does
                         the one thing a string cannot: measure.

   The hero has to measure. The title is scaled to fit on one line beside the
   buy button, and the button is centred on the title's cap band — neither
   number can be known without asking the browser how wide the words actually
   came out in the font that actually loaded. So the page is drawn, then
   measured, then adjusted, and webPageMount is the second half of that.

   ── WHERE THE PAGE'S DATA COMES FROM ──────────────────────────────────────

   Two sources, and keeping them apart is the whole architecture:

     CONTENT      webPageData(state) — words and files about the game, read
                  out of the submission. Edited through Adam's flip panels,
                  auto-filled from Steam. This file never writes it.

     PRESENTATION state.webSite.page — where the art sits, which sections are
                  drawn, whether the hero shows a button or the store marks.
                  Decisions made by LOOKING at the page.

   `M` below is those two merged into the shape the renderer wants. It is a
   CACHE, not a source: rebuilt from scratch on every render, never persisted.
   Anything a developer decides belongs in one of the two sources above, or it
   will quietly vanish on the next redraw.

   ── WHAT DID NOT COME ACROSS FROM THE MOCKUP ──────────────────────────────

   Roughly half of it, all of it scaffolding: the game picker and its four
   hand-written fixtures, the Boutique and Arcade skins, the frame-width
   selector, the floating toolbar and dock, drag, in-place text editing, and
   the Preview/Edit switch. Selection and direct manipulation are phase two;
   today the page draws and Adam's panels edit.
   ========================================================================== */

/* The page's root element. Looked up per mount rather than held from load,
   because the modal that contains it is rebuilt wholesale on every render —
   a reference captured once goes stale the first time anything redraws. */
let site = null;

/* The adapter's output for the current submission. Named WPG because the
   mockup called it G() and a hundred lines below still read it that way. */
let WPG = null;

/* The render cache described above. Rebuilt by webPageBuild on every pass. */
let M = null;

/* Defaults for a submission whose webSite.page has never been written — every
   project saved before that field existed, which is all of them today. Kept
   here as well as in state.js because this file must be readable on its own:
   a renderer that silently draws nothing when a field is missing is worse
   than one that draws the default and says so. */
const WP_PAGE_DEFAULTS = {
  sections: { strip: true, video: true, about: true, shots: true, footer: true },
  art: { ox: 0, oy: 0, zoom: 100, fit: 'fill' },
  logo: null, logoTint: 'original', artOverride: null,
  buyMode: 'button', headerShow: false, hiddenRows: [],
};

function webPageBuild(state) {
  const g    = webPageData(state);
  const page = Object.assign({}, WP_PAGE_DEFAULTS, (state.webSite && state.webSite.page) || {});
  page.art      = Object.assign({}, WP_PAGE_DEFAULTS.art, page.art || {});
  page.sections = Object.assign({}, WP_PAGE_DEFAULTS.sections, page.sections || {});
  WPG = g;

  const hidden = new Set(page.hiddenRows || []);
  const logo   = page.logo ? _wpSrc(page.logo) : g.logo;

  M = {
    accent: g.accent,
    // One arrangement, and it is not a choice — it is what the page does.
    // Cleared to null only by a hand placement, which phase two will bring.
    layout: 'textsplit',
    stack: { y: 50 },

    /* THE TITLE is the game's name, set in type, and it is NOT editable here:
       it comes from the submission, and a marketing page that disagrees with
       the store listing about what the game is called is a bug. */
    title: { x: 50, align: 'center', top: null, size: 100, fg: '#fff', shadow: 60,
             weight: TITLE_WEIGHT, show: true, text: g.name,
             maxw: null, bottom: null, fit: null },

    /* THE LOGOTYPE is separate from the title rather than a mode of it: a
       delivered logotype can be an awkward shape or read badly at hero size,
       and then you still want the name set in type. Shown only when there is
       one — no placeholder, because a page with the name in type is finished,
       and a page with an empty logo box is not. */
    logo: { x: 50, align: 'center', top: null, size: 100, shadow: 50,
            show: !!logo, tint: page.logoTint },

    // The hero tagline: no field in the submission holds one distinct from the
    // Hook, so it is off and empty rather than filled with a repeat.
    hook: { x: 50, align: 'center', top: null, size: 100, text: g.line,
            fg: '#fff', shadow: 60, show: false },

    buy: { x: 50, align: 'center', top: null, label: g.ctaLabel, color: g.cta,
           size: 100, shadow: 45, fg: '#fff', mode: page.buyMode, href: g.ctaHref,
           price: g.price },

    header: { show: page.headerShow, size: 34 },
    art:    { ox: page.art.ox, oy: page.art.oy, zoom: page.art.zoom, fit: page.art.fit },

    /* WHAT THE DEVELOPER SUPPLIED THEMSELVES, which always wins over what the
       store gave us. Held apart from the store's own art rather than written
       over it, so "use the store art" stays a revert and not a re-download. */
    up: { art: page.artOverride ? _wpSrc(page.artOverride) : null,
          logo: page.logo ? _wpSrc(page.logo) : null, artRatio: null },

    stores: [...g.stores],
    // Rows the developer has hidden drop out here rather than in the adapter,
    // because hiding is a presentation decision and the adapter only reads
    // content. Matched by LABEL: the band already drops rows whose field is
    // empty, so a row's index moves the moment somebody fills in a publisher.
    strip: g.strip.filter(r => !hidden.has(r[0])).map(r => [r[0], r[1], true]),
    mini:  g.minis[0] || '',
    about: g.about.map(p => ({ ...p })),
    contact: g.contact.map(r => [...r]),
    show: page.sections,
  };
  return M;
}

/* The markup. `#site` is the page's namespace — the name appears nowhere else
   in style.css, which is what makes web-page.css unable to reach the rest of
   Shipmate and the rest of Shipmate unable to reach the page. */
function webPageHTML(state) {
  webPageBuild(state);
  return `<div id="site" data-tpl="classic" style="` +
         `--a:${M.accent};--cta:${M.buy.color};--sc:${(SCRIM / 100).toFixed(3)}">` +
         pageHTML() + `</div>`;
}

/* The measuring half. Called once the markup is in the document.

   Two frames, not one, and the reason is the webfont: the first pass measures
   whatever face is available right now, which on a cold load is the fallback,
   and a fallback's letters are narrower than Inter's. fonts.ready fires when
   the real face has landed and the second pass corrects the scale. Without it
   the title is measured against letters nobody will ever see. */
function webPageMount() {
  site = document.getElementById('site');
  if (!site || !M) return;
  const pass = () => {
    if (!document.getElementById('site')) return;   // the modal moved on
    site = document.getElementById('site');
    const hero = site.querySelector('[data-edit="art"]');
    if (hero) applyArtPan(hero);
    ensureInk();
    layoutHero();
    replaceLayout();
  };
  requestAnimationFrame(pass);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pass);
}
