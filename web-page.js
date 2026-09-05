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
  sections: { strip: true, lead: true, video: true, about: true, shots: true, footer: true },
  /* THE ORDER OF THE MIDDLE OF THE PAGE.

     Only the middle: the hero is first and the footer is last, and neither is
     a preference. A key-art header that is not at the top is not a header,
     and a footer in the middle is not a footer — offering to move them would
     be offering to break the page.

     Everything between them is genuinely arguable. The default puts the
     metadata band first because a visitor who has just read the name wants to
     know what it IS and where it runs; a developer whose hook is the best
     sentence they have will want it first instead. Both are right, for
     different games. */
  sectionOrder: ['strip', 'lead', 'video', 'about', 'shots'],
  art: { ox: 0, oy: 0, zoom: 100, fit: 'fill' },
  logo: null, logoTint: 'original', logoShow: true, artOverride: null,
  buyMode: 'button', buyModePrev: 'button',
  headerShow: false, linksShow: false, hookShow: false, titleShow: true, hiddenRows: [],
  /* THE CORNER MARK IS ITS OWN THING NOW.

     It used to be a view of the hero's logotype: no logotype, no way to put
     anything in the corner but the game's name in fallback type. That was
     backwards twice over. The corner and the hero mark are used for different
     jobs — a wordmark reads at hero size, a square emblem reads at 34px, and
     plenty of studios have both — and the corner is the one a developer
     reaches for FIRST, because it is the small commitment.

     'auto' keeps the old behaviour and stays the default: borrow the hero's
     logotype, fall back to the name. The other two are decisions. */
  headerSrc: 'auto',      // 'auto' | 'image' | 'text'
  headerImage: null,      // its own file, independent of the hero logotype
  headerText: '',         // its own words; blank means the game's name
  headerSize: 34,         // the height its ink is drawn at, in px
  /* The two things about the name that are genuinely the developer's to
     decide. Not the words — those are the game's name and come from the
     submission, and a page that disagrees with the store about what the game
     is called is a bug. Size and weight are about how it sits on THEIR
     artwork, which nobody else can know. null weight means "whatever the
     design's default is", so changing that default later moves every page
     that never expressed an opinion. */
  titleSize: 100, titleWeight: null, logoSize: 100,
  logoPos: null, hookPos: null,
};

// A stored pan, made safe: a fraction survives, anything else is a pixel
// value from before the format changed and is centred instead.
const _wpPan = v => (typeof v === 'number' && v >= -1 && v <= 1 ? v : 0);

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
    title: { x: 50, align: 'center', top: null, size: page.titleSize || 100, fg: '#fff', shadow: 60,
             weight: page.titleWeight || TITLE_WEIGHT, show: page.titleShow !== false, text: g.name,
             maxw: null, bottom: null, fit: null },

    /* THE LOGOTYPE is separate from the title rather than a mode of it: a
       delivered logotype can be an awkward shape or read badly at hero size,
       and then you still want the name set in type. Shown only when there is
       one — no placeholder, because a page with the name in type is finished,
       and a page with an empty logo box is not. */
    /* A HAND PLACEMENT SURVIVES EVERYTHING. Without logoPos the first layout
       pass centres the piece as part of the opening stack, which is right
       once and wrong every time after — a developer who dragged the logotype
       somewhere would find it back in the middle on the next redraw. */
    logo: Object.assign(
      { x: 50, align: 'center', top: null,
        size: page.logoSize || 100,
        /* The size the ink box was actually BUILT at. `size` is mutated live
           while the slider moves; this is not, so the paint always knows what
           it is scaling FROM. Without it, dragging the slider a second time
           would scale from a number that had already moved. */
        baseSize: page.logoSize || 100,
        shadow: 50,
        show: !!logo && page.logoShow !== false, tint: page.logoTint, src: logo },
      page.logoPos || {}),

    /* THE HERO TAGLINE reads the Hook, and does not get a field of its own.
       No field in the submission holds a hero line distinct from the Hook, and
       inventing one would mean either a new text editor on the page — the
       caret problem we deliberately avoided — or a second line for the
       developer to write and keep in step with the first. The Hook is already
       the sentence they wrote to sell the game, which is exactly what a hero
       tagline is for. Off by default: the hero already carries the name and a
       button, and the same line then leads the page just below. */
    hook: Object.assign(
      { x: 50, align: 'center', top: null, size: 100,
        text: (g.minis[0] || g.line || ''),
        // Parked: see the note in wpHeroAddHTML. Nothing can turn this on
        // today, and it draws the same sentence the lead already carries.
        fg: '#fff', shadow: 60, show: false },
      page.hookPos || {}),

    buy: { x: 50, align: 'center', top: null, label: g.ctaLabel, color: g.cta,
           size: 100, shadow: 45, fg: '#fff', mode: page.buyMode, href: g.ctaHref,
           price: g.price },

    header: { show: page.headerShow, links: !!page.linksShow,
              size: page.headerSize || 34,
              // The size the ink box was BUILT at, so a live scale knows what
              // it is scaling from. See the logotype's baseSize.
              baseSize: page.headerSize || 34,
              src: page.headerSrc || 'auto',
              img: page.headerImage ? _wpSrc(page.headerImage) : null,
              text: page.headerText || '' },
    /* ox/oy are FRACTIONS of the travel now (see applyArtPan). They used to be
       pixels, and a stored pixel value read as a fraction would clamp to the
       far edge — a crop saved yesterday would open showing the corner of the
       picture, which looks like corruption rather than like an old format.
       Anything outside the range cannot be a fraction, so it is a value from
       before the change: centre it. The crop is lost either way; centred is
       the honest version of losing it. */
    art:    { ox: _wpPan(page.art.ox), oy: _wpPan(page.art.oy),
              zoom: page.art.zoom, fit: page.art.fit },

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
    order: wpOrder(page),
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
  const sel = state.webPageSel && WP_VISUAL[state.webPageSel] ? state.webPageSel : null;
  return `<div id="site" data-tpl="classic"${sel ? ` data-sel="${sel}"` : ''} style="` +
         `--a:${M.accent};--cta:${M.buy.color};--sc:${(SCRIM / 100).toFixed(3)}">` +
         pageHTML() + `</div>` + wpDockHTML();
}

/* The measuring half. Called once the markup is in the document.

   Two frames, not one, and the reason is the webfont: the first pass measures
   whatever face is available right now, which on a cold load is the fallback,
   and a fallback's letters are narrower than Inter's. fonts.ready fires when
   the real face has landed and the second pass corrects the scale. Without it
   the title is measured against letters nobody will ever see. */
/* ── WHICH PANEL EACH PART OF THE PAGE OPENS ──────────────────────────────
   The whole promise of this change in one table: the page is ours, the
   editing is Adam's. Every zone routes to one of his existing flip panels,
   which are forms over state.webSite.* and never depended on what the preview
   looked like. No new editor, no new field, no second source of truth.

   Delegated from #site rather than written as onclick attributes on each
   partial, for three reasons: the mapping is legible in one place instead of
   scattered through nine builders; the builders stay exactly as they were
   prototyped, so the mockup and this file do not drift; and when phase two
   brings direct manipulation, this is the single thing that changes.

   `title` and `buy` go to different panels than you might guess. The title is
   the game's name and comes from Game Details, so clicking it opens the hero's
   own panel rather than pretending to be editable; the buy button's only
   editable value is the price, which lives in the Factsheet. */
/* art, title and logo are NOT here any more: all three are edited on the page
   now, in panels anchored to them, and WP_VISUAL catches them before this map
   is consulted. Left as a comment rather than as dead entries, because an
   entry that can never be reached reads as a route somebody forgot to
   delete. */
const WP_PANEL = {
  buy: 'webFactsheet', strip: 'webFactsheet',
  mini: 'webDescription', about: 'webDescription',
  contact: 'siteInfo',
};
const WP_PANEL_SECTION = {
  strip: 'webFactsheet', video: 'webMedia', shots: 'webMedia',
  // The band AROUND the hook, which became a section of its own when sections
  // became reorderable. It goes where the hook inside it goes: a click that
  // lands two pixels outside the sentence must not do something different
  // from one that lands on it.
  lead: 'webDescription',
  about: 'webDescription', footer: 'siteInfo',
};
/* The corner row goes where the footer's row goes: Site Details holds the
   links, and there is one list, not two. */
WP_PANEL.links = 'siteInfo';

/* ── WHICH ZONES ARE EDITED ON THE PAGE ITSELF ────────────────────────────
   The hybrid, decided before any of this was written: direct manipulation for
   what is VISUAL, a form for what is TYPED.

   The split is not a compromise, it is what removes the only hard problem.
   Editing text in place means a contentEditable node that the modal's own
   innerHTML rebuild can replace mid-sentence, taking the caret with it. Every
   zone listed here changes a number or a file — a crop, a zoom, an upload —
   and none of them has a caret to lose.

   Everything NOT listed keeps opening Adam's panel, which is why this table
   can grow one entry at a time without anything else changing. */
const WP_VISUAL = { art: 1, buy: 1, title: 1, logo: 1, header: 1 };

/* WHERE EACH PANEL GOES, and the split is not cosmetic.

   `top` is the header's, and only the header's. Its zone IS the whole hero —
   there is no "beside it" to put a panel, and a popup anchored to a
   thousand-pixel rectangle would just be a panel somewhere arbitrary inside
   it. It keeps the fixed place under the chrome, which is also the place your
   eye has already learned.

   `el` is for the pieces that float on the header. These are small, they are
   somewhere specific, and half of what you do to them — resize the name,
   tint the logotype — is judged by watching the thing itself change. A panel
   at the top of the frame makes you look at two places at once for that.
   Anchored, the control and its effect are in one glance.

   The cost is that a popup can cover its neighbours, which is why it is
   placed ABOVE by preference and never on top of the element it belongs to. */
const WP_DOCK_AT = { art: 'top', buy: 'el', title: 'el', logo: 'el', header: 'el' };

function webPageBindPanels() {
  if (!site) return;
  site.addEventListener('click', e => {
    /* THE SECTION HANDLES GO FIRST. They live inside the sections they move,
       so every click on one also lands on a zone that would open a panel —
       and the panel would open behind the reorder that just happened. Caught
       here, before anything else is consulted. */
    const grip = e.target.closest('[data-wp]');
    if (grip && grip.closest('.wp-grip, [data-wp-hidden]')) {
      e.preventDefault(); e.stopPropagation();
      return wpSectionAction(grip.dataset.wp, grip.dataset.k);
    }
    /* A LINK ON THIS PAGE IS NOT A LINK YET, and treating it as one was a
       real bug rather than a nicety.

       This used to return early on any real href, on the reasoning that a
       link is a link. But the page it is drawn on is a PREVIEW inside a modal
       inside Shipmate. Clicking the Discord mark in the corner row therefore
       did one of two things, both wrong: nothing at all, or it navigated the
       whole app away to discord.gg — losing an unsaved submission on the way
       out. Neither is "edit the thing I just clicked", which is the only
       thing a click in an editor can sensibly mean.

       So every link here is neutralised and falls through to the routing
       below, which opens the panel that owns it — the social row and the
       footer both land on Site Details, where the URLs are typed. The href
       stays in the markup because it is correct for the real page; it is only
       inert while the page is being edited. */
    if (e.target.closest('a[href]')) e.preventDefault();
    const zone = e.target.closest('[data-edit]');
    const sect = e.target.closest('[data-sect]');
    const key  = zone && zone.dataset.edit;

    /* A PIECE YOU DRAG IS NOT A PIECE YOU CLICK. The logotype and the tagline
       are placed by hand; a click on one is the end of a drag, or a drag that
       moved nothing. Either way, flipping the card to a form is not what was
       asked for — and being thrown to the other side of the card every time
       you nudge a logo makes the gesture unusable. */
    if (key && WP_MOVABLE[key]) { e.preventDefault(); e.stopPropagation(); return; }

    /* AN EMPTY HEADER HAS NOTHING TO FRAME. Opening the dock here would offer
       a zoom slider, a crop thumbnail and a Reset for a picture that does not
       exist — four controls, none of which can do anything, in front of the
       one thing that can. So the empty header is a single button: it asks for
       a file, and from the moment there is one it behaves as it always did. */
    if (key === 'art' && !wpHasArt()) {
      e.preventDefault(); e.stopPropagation();
      wpPickImage();
      return;
    }

    if (key && WP_VISUAL[key]) {          // edited here, on the page
      e.preventDefault(); e.stopPropagation();
      webPageSelect(state.webPageSel === key ? null : key);
      return;
    }
    const target = WP_PANEL[key] || (sect && WP_PANEL_SECTION[sect.dataset.sect]);
    if (!target || typeof openStorePreviewSection !== 'function') return;
    e.preventDefault();
    e.stopPropagation();
    openStorePreviewSection('web', target);
  });
}

/* MOVING, HIDING AND RESTORING A SECTION.

   Order and visibility are both presentation, so both land in webSite.page
   beside the rest of it. Neither touches a word the developer wrote.

   Moving steps over what is HIDDEN rather than through it. Swapping with the
   neighbour in the stored array would mean a press that appears to do nothing
   whenever the section above happens to be switched off — the arrangement
   would change, invisibly, and the second press would jump two places. What
   the eye sees is the list of visible sections, so that is the list the
   arrows walk. */
/* The toolbar lives OUTSIDE #site — it is a control panel for the page, not
   part of it — so the delegated listener on #site never sees its clicks. Its
   own binding, on the wrapper the toolbar and the frame share. */
function webPageBindToolbar() {
  const wrap = document.querySelector('[data-wp-toolbar]');
  if (!wrap) return;
  wrap.addEventListener('click', e => {
    const b = e.target.closest('[data-wp]');
    if (!b || b.tagName !== 'BUTTON') return;
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.wp;
    if (a === 'device') return setWebPageDevice(b.dataset.k);
    if (a === 'expand') return setWebPageFull(!state.webPageFull);
    wpSectionAction(a, b.dataset.k);
  });
}

/* ── THE PAGE AT ITS REAL SIZE ────────────────────────────────────────────
   The modal is about 900px wide and the page is designed for 1440. Every
   preview inside it is therefore a scaled-down argument about a layout nobody
   has actually seen — fine for editing, useless for judging.

   Expanding MOVES THE FRAME rather than rebuilding it somewhere else. Two
   live copies of the page would both answer to the same `site` global and
   fight over every measurement; one node in a different parent keeps the
   selection, the crop, the bound handlers and the scroll position, and costs
   only a re-measure. Moving it back is the same operation in reverse.

   position:fixed would have been the obvious alternative and is a trap here:
   a fixed element inside a transformed ancestor is positioned against that
   ancestor, and this page lives inside a card that rotates in 3D. */
function setWebPageFull(on) {
  const frame = document.querySelector('[data-wp-frame]');
  if (!frame) return;
  state.webPageFull = !!on;

  let host = document.getElementById('wp-full');
  if (state.webPageFull) {
    if (!host) {
      host = document.createElement('div');
      host.id = 'wp-full';
      host.innerHTML = `<div class="wp-full-bar">
          <span class="wp-full-note">Press <b>Esc</b> to go back to editing</span>
          <button class="wp-btn" data-wp-collapse>Done</button>
        </div><div class="wp-full-stage"></div>`;
      document.body.appendChild(host);
      host.querySelector('[data-wp-collapse]').addEventListener('click', () => setWebPageFull(false));
    }
    // Remember where it came from, so it goes back exactly there rather than
    // to the end of whatever wrapper happens to exist next.
    if (!frame._wpHome) frame._wpHome = { parent: frame.parentNode, next: frame.nextSibling };
    host.querySelector('.wp-full-stage').appendChild(frame);
    document.body.classList.add('wp-full-open');
  } else if (host) {
    const home = frame._wpHome;
    if (home && home.parent) home.parent.insertBefore(frame, home.next);
    frame._wpHome = null;
    host.remove();
    document.body.classList.remove('wp-full-open');
  }
  const btn = document.querySelector('[data-wp=expand]');
  if (btn) btn.setAttribute('aria-pressed', String(state.webPageFull));
  // The stage is a completely different size now, so everything measured
  // against it is stale. Same pass the device switcher relies on.
  if (typeof webPageMount === 'function') requestAnimationFrame(() => webPageMount());
}
if (typeof document !== 'undefined' && !setWebPageFull._esc) {
  setWebPageFull._esc = true;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && typeof state !== 'undefined' && state.webPageFull) {
      e.preventDefault();
      e.stopPropagation();      // before the selection's own Esc, and before the modal's
      setWebPageFull(false);
    }
  }, true);
}

function wpSectionAction(action, key) {
  if (!key) return;
  const page = (state.webSite && state.webSite.page) || {};

  if (action === 'sechide' || action === 'secshow') {
    const sections = Object.assign({}, WP_PAGE_DEFAULTS.sections, page.sections || {});
    sections[key] = action === 'secshow';
    setWebPageField('sections', sections);
    return webPageRedraw();
  }
  if (action !== 'secup' && action !== 'secdown') return;

  const order = wpOrder(page);
  const shown = k => (Object.assign({}, WP_PAGE_DEFAULTS.sections, page.sections || {})[k] !== false);
  const vis = order.filter(shown);
  const at  = vis.indexOf(key);
  const to  = at + (action === 'secup' ? -1 : 1);
  if (at < 0 || to < 0 || to >= vis.length) return;

  // Swap the two in the FULL array, at the positions its visible neighbours
  // actually occupy — so hidden sections keep their place in the order and
  // come back where they were.
  const a = order.indexOf(vis[at]), b = order.indexOf(vis[to]);
  const next = order.slice();
  next[a] = order[b]; next[b] = order[a];
  setWebPageField('sectionOrder', next);
  webPageRedraw();
}

/* ── SELECTION ────────────────────────────────────────────────────────────
   Held in state, not in the DOM, and that is the whole trick for surviving a
   redraw. The modal rebuilds its contents wholesale on every render; anything
   remembered as a class on a node dies with the node. Remembered as a key, the
   next build simply draws itself selected — the dock included, which is why
   the dock does NOT need to live outside the rebuilt subtree after all. It
   carries no state of its own; it is a view of this one value.

   The exception is a gesture in flight. A drag or a slider being moved must
   not redraw, or the node under the pointer is replaced mid-gesture. Those
   write CSS custom properties live and commit to state once, on release. */
/* SELECTING DOES NOT REDRAW THE PAGE.

   It used to, and the cost was visible: a full rebuild re-runs the hero's
   measuring pass, and re-measuring a stage whose art has just been re-decoded
   moves the crop by a pixel or two. Clicking the header to open its panel
   nudged the very picture you were about to frame — which is the one thing a
   framing tool must never do.

   Nothing about the PAGE changes when a zone is selected. Only two things do:
   an attribute that drives the wash and the dim, and the dock. So set the one
   and swap the other, and leave the page alone. */
function webPageSelect(key) {
  state.webPageSel = key || null;
  const el = document.getElementById('site');
  if (!el) return webPageRedraw();

  if (state.webPageSel) el.setAttribute('data-sel', state.webPageSel);
  else el.removeAttribute('data-sel');

  const old = document.querySelector('[data-wp-dock]');
  if (old) old.remove();
  const html = wpDockHTML();
  if (html) {
    el.insertAdjacentHTML('afterend', html);
    webPageBindDock();
    /* Synchronously, not in a frame. Reading offsetWidth forces the layout
       the placement needs, and this is a click rather than a gesture so the
       cost is one reflow nobody can feel. In a rAF the panel would paint once
       at its CSS position and jump to the element a frame later. */
    wpDockPlace();
  }
}

/* ── THE CROP, AS A PICTURE ───────────────────────────────────────────────
   The whole image, with the part the header actually shows drawn on top of
   it. This is the difference between a zoom control you can use and one you
   are guessing at: a percentage tells you how much you enlarged, and tells
   you nothing about whose face you just cut in half.

   artWindow returns that visible region as percentages of the full picture.
   The maths is the inverse of applyArtPan's: there, an offset decides which
   part of the picture fills the box; here, the same offset decides where the
   box sits on the picture. */
function artWindow(m){
  if(!m) return null;
  const fullW = m.cw * m.z, fullH = m.ch * m.z;
  const w = Math.min(1, m.b.width / fullW), h = Math.min(1, m.b.height / fullH);
  // The stored pan is a fraction of the travel; the thumbnail needs it as a
  // fraction of the PICTURE, so it goes through this stage's pixels first.
  const cx = 0.5 - ((M.art.ox * m.maxX) / fullW),
        cy = 0.5 - ((M.art.oy * m.maxY) / fullH);
  return {
    l: Math.max(0, Math.min(1 - w, cx - w/2)) * 100,
    t: Math.max(0, Math.min(1 - h, cy - h/2)) * 100,
    w: w * 100, h: h * 100,
  };
}

function artURL(){
  const g = WPG;
  return M.up.art || ((g.real && g.hero) ? g.hero
    : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgArt('classic', artSeed)));
}

function artThumbHTML(){
  const hero = site && site.querySelector('[data-edit="art"]');
  const win  = artWindow(hero ? artMetrics(hero) : null) || { l:0, t:0, w:100, h:100 };
  return `<span class="wp-thumb" title="The whole picture — the lit part is what the header shows"
                style="background-image:url(&quot;${artURL()}&quot;);aspect-ratio:${artRatio().toFixed(3)}">
            <span class="wp-win" style="left:${win.l.toFixed(1)}%;top:${win.t.toFixed(1)}%;width:${win.w.toFixed(1)}%;height:${win.h.toFixed(1)}%"></span>
          </span>`;
}

/* Called from applyArtPan, so it keeps up with the hand: the thumbnail is the
   only place you can see what you are losing, and a crop preview that updates
   on release is a crop preview you cannot aim with. Writes styles directly —
   no render, because this runs inside a gesture. */
function refreshArtThumb(m){
  const win = artWindow(m); if(!win) return;
  const el = document.querySelector('[data-wp-dock] .wp-win'); if(!el) return;
  el.style.left = win.l.toFixed(1)+'%'; el.style.top = win.t.toFixed(1)+'%';
  el.style.width = win.w.toFixed(1)+'%'; el.style.height = win.h.toFixed(1)+'%';
}

const WP_DOCK_LABEL = { art: 'Header', buy: 'Buy button', title: 'Title', logo: 'Logotype',
                        header: 'Corner' };

/* PUT THE PANEL BESIDE THE THING IT EDITS.

   Measured rather than declared, because none of these pieces has a fixed
   home: the title and the button are placed by the hero's own layout pass and
   the logotype wherever it was dragged, so the only way to know where a panel
   should go is to ask the page where the element ended up.

   Three rules, in order:
     · ABOVE by preference. A panel under an element covers the artwork the
       element is sitting on, which is the thing you are judging it against.
     · BELOW when above would slide under the browser chrome. The chrome is a
       floating pane, so "inside the frame" is not the same as "visible".
     · CLAMPED to the frame either way, because the frame clips.

   Never on top of its own element — that is the one placement that makes a
   panel useless, and it is what a naive centre-on-the-element would give you.

   This runs after every layout pass rather than once on open: the pass moves
   the title and the button, and a panel measured before them is a panel
   pointing at where they used to be. */
function wpDockPlace() {
  const dock = document.querySelector('[data-wp-dock]');
  if (!dock) return;
  const key   = state.webPageSel;
  const where = WP_DOCK_AT[key] || 'top';
  const frame = dock.closest('.wp-frame') || dock.parentElement;
  /* `.el` first, because that is what the hero's own pieces are — but the
     corner mark is a .hero-head rather than an .el (it is placed by CSS, not
     by the layout pass), and it still deserves a panel beside it. Ask for the
     zone by name and take whichever kind answers. */
  const el    = where === 'el' && site &&
    (site.querySelector(`.el[data-edit="${key}"]`) || site.querySelector(`[data-edit="${key}"]`));
  if (!el || !frame) {
    // The header's panel, and the fallback for a piece that is not on the
    // page: the fixed place under the chrome, laid out by CSS alone.
    dock.dataset.wpAnchor = 'top';
    dock.style.left = dock.style.top = '';
    return;
  }
  const fb = frame.getBoundingClientRect();
  const eb = el.getBoundingClientRect();
  if (!fb.height || !eb.height) return;

  dock.dataset.wpAnchor = 'el';         // switches the CSS off auto-centring
  const dw = dock.offsetWidth, dh = dock.offsetHeight;
  const GAP = 12, EDGE = 10;
  // The chrome floats over the top of the frame; nothing may hide under it.
  const ceiling = (parseFloat(getComputedStyle(site).getPropertyValue('--chrome-h')) || 0) + 8;

  let top = eb.top - fb.top - dh - GAP;
  if (top < ceiling) top = eb.bottom - fb.top + GAP;
  top = Math.max(ceiling, Math.min(top, fb.height - dh - EDGE));

  let left = eb.left - fb.left + eb.width / 2 - dw / 2;
  left = Math.max(EDGE, Math.min(left, fb.width - dw - EDGE));

  dock.style.left = left.toFixed(1) + 'px';
  dock.style.top  = top.toFixed(1) + 'px';
}

/* Four accents. The teal is Shipmate's own default; the other three are a
   warm, a hot and a cool, far enough apart that no two read as a mistake for
   each other and all four hold white type at full saturation. */
const WP_ACCENTS = ['#0EA5A4', '#FFB627', '#FF4D8D', '#52BAFF'];

/* THE HEADER'S PANEL IS THE HEADER'S, not the artwork's. The zone covers the
   whole hero — the picture, the name, the button, and the three things a
   developer can add to it — so its panel offers the picture's framing AND
   what else the header contains. That is the mockup's model and the reason it
   worked: one container, one panel, and everything inside it turned on and
   off from the same place rather than from five scattered menus. */
function wpHeroAddHTML(page) {
  /* "Show", not "Add": the same row now carries things that are ON by default
     and things that are off, and one verb has to be honest about both. The
     title heads it because it is the one you might switch OFF — a page whose
     key art already carries a logotype does not need the name a second time
     in type, and until now there was no way to say so. */
  /* THE TAGLINE IS PARKED, not deleted. It drew the Hook — the same sentence
     that leads the page a few hundred pixels below — so switching it on put
     the same words twice on one screen, and the only way to make it earn its
     place would be a hero line of its own, which means a field that does not
     exist and a text editor on the page that we deliberately do not have.
     The state field and the renderer stay; only the switch is gone, so
     bringing it back is one line here if a real field ever turns up. */
  /* IN THE ORDER THEY SIT ON THE HEADER, top to bottom: the corner mark, then
     the logotype and the name in the stack, then the button under them. With
     three items any order was as good as another; with four, a spatial one is
     the only order a developer can predict without reading the row. */
  const has = [
    ['header', 'Corner header', !!page.headerShow],
    // Opposite corner, same line. Named "Social links" rather than "Links"
    // because the row it draws is recognisably that and nothing else.
    ['links',  'Social links',  !!page.linksShow],
    ['logo',   'Logotype',      !!page.logoShow && !!page.logo],
    ['title',  'Title',         page.titleShow !== false],
    ['buy',    'Buy button',    (page.buyMode || 'button') !== 'none'],
  ];
  return `<span class="wp-lbl">Show</span>` + has.map(([k, label, on]) =>
    `<button class="wp-btn${on ? ' on' : ''}" data-wp="has" data-k="${k}">${
      // A logotype with no file yet opens the picker instead of switching on
      // an empty box — the ellipsis is the promise that it will ask.
      k === 'logo' && !page.logo ? 'Logotype…' : label
    }</button>`).join('');
}

function wpDockHTML() {
  const key = state.webPageSel;
  if (!key || !WP_VISUAL[key]) return '';
  const page = (state.webSite && state.webSite.page) || {};
  const art  = Object.assign({}, WP_PAGE_DEFAULTS.art, page.art || {});

  /* TWO ROWS, AND THE SEAM IS THE HEADER'S OWN STRUCTURE.

     The header is a picture with things floating on it, and those are two
     different jobs: framing the artwork, and deciding what sits over it. In
     one row they interleaved — a zoom slider, then an upload, then a set of
     toggles — and the row read as a list of eight unrelated controls, which
     is what made it feel cramped no matter how much padding it got. Split,
     each row answers one question and the eye can skip the one it does not
     want. Nothing was added or taken away. */
  let rows = [];
  if (key === 'art') {
    rows = [
      // ROW ONE — THE PICTURE: what it is, and how it is framed.
      `<span class="wp-title">Header</span>
       <span class="wp-sep"></span>
       ${artThumbHTML()}
       <span class="wp-lbl">Zoom</span>
       <input type="range" class="wp-range" data-wp="zoom" min="100" max="250" value="${art.zoom}">
       <span class="wp-val" data-wp="zoomval">${art.zoom}%</span>
       <span class="wp-sep"></span>
       <button class="wp-btn" data-wp="upload">Use another image…</button>
       <button class="wp-btn" data-wp="reset" ${
         art.zoom === 100 && art.ox === 0 && art.oy === 0 && !page.artOverride ? 'disabled' : ''
       }>Reset</button>
       ${/* THE ONE WAY LEFT INTO ADAM'S KEY ART PANEL, and it has to be here.
            Moving the header's editing onto the page took away the click that
            used to open it, and that panel still owns something this popup
            does not: the dropdown that picks WHICH of the images Steam
            delivered is the hero. Uploading your own is the common case and
            lives here; choosing between the ones already fetched is the rarer
            one and lives there. Without this button it lived nowhere. */''}
       <span class="wp-sep"></span>
       <button class="wp-btn" data-wp="panel" data-k="webKeyArt">Choose from Steam…</button>`,
      // ROW TWO — WHAT FLOATS ON IT: the four pieces, and the way out.
      `${wpHeroAddHTML(page)}
       <button class="wp-btn wp-done" data-wp="done">✓ Done</button>`,
    ];
  } else if (key === 'buy') {
    /* Three shapes, not a colour picker and a label field. The colour is the
       page's one accent, set in Edit site details; the label is fixed. What is
       genuinely a decision is WHICH call to action a page wants: one pill for a
       game with one store, the availability marks for a game on five, or
       nothing at all when the art should carry the fold alone. */
    const mode = page.buyMode || 'button';
    const accent = (state.webSite && state.webSite.accent) || '#0EA5A4';
    rows = [`<span class="wp-title">Buy button</span><span class="wp-sep"></span>`
      + [['button', 'Button'], ['stores', 'Store marks'], ['none', 'None']]
      .map(([v, label]) => `<button class="wp-btn${mode === v ? ' on' : ''}" data-wp="ctamode" data-k="${v}">${label}</button>`)
      .join('')
      /* THE SWATCHES SET THE PAGE'S ACCENT — the same single value the colour
         picker in Edit site details writes, not a colour of the button's own.
         One page, one colour: it fills the pill AND tints the section
         headings, and letting the button carry a second colour is how a page
         ends up looking assembled rather than designed.

         They are here as well as there because this is where you are looking
         when you form the opinion. Four, not a picker: a colour that has to
         survive being read as white type on a saturated pill over arbitrary
         key art is a narrow problem, and four answers cover it. */
      + `<span class="wp-sep"></span><span class="wp-lbl">Colour</span>`
      + WP_ACCENTS.map(c =>
          `<button class="wp-sw${c.toLowerCase() === accent.toLowerCase() ? ' on' : ''}"
                   data-wp="accent" data-k="${c}" title="${c}"
                   style="background:${c}"></button>`).join('')
      + `<button class="wp-btn wp-done" data-wp="done">✓ Done</button>`];
  } else if (key === 'title') {
    /* NOT THE WORDS. The name comes from the submission and goes on every
       store page with it; letting it be retyped here would create a second
       name that can quietly disagree with the first. What is genuinely a
       decision is how it SITS on this developer's artwork — big and light
       over a busy sky, small and heavy over a calm one — and that is a
       judgement nobody but them can make, made by looking. */
    const size = (page.titleSize || 100), weight = (page.titleWeight || TITLE_WEIGHT);
    rows = [`<span class="wp-title">Title</span><span class="wp-sep"></span>
      <span class="wp-lbl">Size</span>
      <input type="range" class="wp-range" data-wp="tsize" min="60" max="140" value="${size}">
      <span class="wp-val" data-wp="tsizeval">${size}%</span>
      <span class="wp-sep"></span>
      ${/* Medium to Bold, not the whole scale: this is white type over
           arbitrary artwork, and anything lighter than Medium stops holding
           its own against a busy picture. */''}
      ${[[500, 'Medium'], [600, 'Semibold'], [800, 'Bold']].map(([v, l]) =>
        `<button class="wp-btn${weight === v ? ' on' : ''}" data-wp="tweight" data-k="${v}">${l}</button>`).join('')}
      <span class="wp-sep"></span>
      <button class="wp-btn" data-wp="has" data-k="title">Hide</button>
      <button class="wp-btn wp-done" data-wp="done">✓ Done</button>`];
  } else if (key === 'header') {
    /* THREE SOURCES, NOT A SWITCH AND A HOPE. The corner used to be a view of
       the hero's logotype, so with no logotype there was nothing to put there
       but the game's name in fallback type — and no way to say otherwise.
       These are the three things a corner mark actually is. */
    const hsrc = page.headerSrc || 'auto';
    const hsize = page.headerSize || 34;
    rows = [`<span class="wp-title">Corner</span><span class="wp-sep"></span>
      ${[['auto', 'Logotype'], ['image', page.headerImage ? 'Image' : 'Image…'], ['text', 'Text']]
        .map(([v, l]) => `<button class="wp-btn${hsrc === v ? ' on' : ''}"
              data-wp="hsrc" data-k="${v}">${l}</button>`).join('')}
      <span class="wp-sep"></span>
      <span class="wp-lbl">Size</span>
      <input type="range" class="wp-range" data-wp="hsize" min="18" max="72" value="${hsize}">
      <span class="wp-val" data-wp="hsizeval">${hsize}px</span>
      ${hsrc === 'text'
        ? `<span class="wp-sep"></span>
           ${/* Typed in the PANEL, never on the page. The caret problem is the
                whole reason the editing model is split the way it is: a
                contentEditable node the rebuild can replace mid-sentence. An
                input here paints the corner live and commits on blur. */''}
           <input type="text" class="wp-text" data-wp="htext" maxlength="40"
                  placeholder="${esc(WPG.title)}" value="${esc(page.headerText || '')}">`
        : ''}
      ${hsrc === 'image' && page.headerImage
        ? `<button class="wp-btn" data-wp="himg">Replace…</button>` : ''}
      <button class="wp-btn" data-wp="has" data-k="header">Hide</button>
      <button class="wp-btn wp-done" data-wp="done">✓ Done</button>`];
  } else if (key === 'logo') {
    /* THE TINT IS THE ONE CONTROL THAT EARNS ITS PLACE HERE. A delivered
       logotype is usually a single-colour PNG made for one background, and
       the key art underneath it is whatever the game happens to look like —
       so the same file can be perfect on one page and invisible on the next.
       Three answers, because a logotype is either its own colours, or knocked
       out white, or set solid black, and there is no fourth thing anyone
       wants. */
    const tint = page.logoTint || 'original';
    const lsize = page.logoSize || 100;
    /* SIZE FIRST, because it is the thing a delivered logotype almost always
       needs. The file arrives at whatever size its designer drew it for — a
       store capsule, a splash screen — and none of those is "over this key
       art, above this button". Range 40–200: wide, because a wordmark and a
       square emblem want very different numbers out of the same 100%. */
    rows = [`<span class="wp-title">Logotype</span><span class="wp-sep"></span>
      <span class="wp-lbl">Size</span>
      <input type="range" class="wp-range" data-wp="lsize" min="40" max="200" value="${lsize}">
      <span class="wp-val" data-wp="lsizeval">${lsize}%</span>
      <span class="wp-sep"></span>
      <span class="wp-lbl">Tint</span>
      ${[['original', 'Original'], ['white', 'White'], ['black', 'Black']].map(([v, l]) =>
        `<button class="wp-btn${tint === v ? ' on' : ''}" data-wp="tint" data-k="${v}">${l}</button>`).join('')}
      <span class="wp-sep"></span>
      <button class="wp-btn" data-wp="relogo">Replace…</button>
      ${/* "Remove" takes it off the page and KEEPS the file, so putting it
           back is one press in the header's row rather than another trip to
           the file picker. A control that throws away an upload behind a word
           as mild as this one would be a trapdoor. */''}
      <button class="wp-btn" data-wp="has" data-k="logo">Remove</button>
      <button class="wp-btn wp-done" data-wp="done">✓ Done</button>`];
  }

  return `<div class="wp-dock" data-wp-dock>` +
    rows.map(r => `<div class="wp-row">${r}</div>`).join('') +
    `</div>`;
}

/* ── THE GESTURES ─────────────────────────────────────────────────────────
   Drag to reframe, and a slider to zoom. Both follow the same rule: paint
   live, save once.

   Painting live means writing M.art and calling applyArtPan, which sets
   object-position and two custom properties on the hero — no render, so the
   node under the pointer is never replaced. Saving once means a single
   setWebPageArt when the gesture ends, which is the only thing that has to
   survive a reload.

   Dragging spends the crop's slack FIRST (object-position, which reveals more
   of the picture) and only then translates (which slides the already-cropped
   image and reveals nothing). applyArtPan does that split; the drag only has
   to hand it a running offset. */
function webPageBindArtGestures() {
  const hero = site && site.querySelector('[data-edit="art"]');
  if (!hero) return;
  let from = null;

  hero.addEventListener('pointerdown', e => {
    if (state.webPageSel !== 'art') return;   // reframing is a mode, not a hair-trigger
    if (e.button !== 0) return;
    from = { x: e.clientX, y: e.clientY, ox: M.art.ox, oy: M.art.oy };
    hero.setPointerCapture && hero.setPointerCapture(e.pointerId);
    hero.classList.add('wp-panning');
    e.preventDefault();
  });

  hero.addEventListener('pointermove', e => {
    if (!from) return;
    /* The hand moves in pixels and the pan is stored as a fraction of the
       travel, so the conversion happens here — measured against THIS stage,
       which is the only one the hand is actually on. */
    const m = artMetrics(hero);
    if (!m) return;
    M.art.ox = m.maxX ? from.ox + (e.clientX - from.x) / m.maxX : 0;
    M.art.oy = m.maxY ? from.oy + (e.clientY - from.y) / m.maxY : 0;
    applyArtPan(hero);                        // clamps, paints — never renders
  });

  const end = () => {
    if (!from) return;
    from = null;
    hero.classList.remove('wp-panning');
    // applyArtPan has already clamped M.art to what the crop can actually take,
    // so this saves the reachable value rather than the raw pointer total.
    setWebPageArt({ ox: M.art.ox, oy: M.art.oy });
    webPageRedraw();                          // once, to refresh Reset's state
  };
  hero.addEventListener('pointerup', end);
  hero.addEventListener('pointercancel', end);
}

/* ── THE FREE PIECES ──────────────────────────────────────────────────────
   The logotype and the tagline are placed by hand; the title and the buy
   button are not, and that is a decision rather than an omission. The title
   is the game's name and the button its call to action — they are what the
   header IS, they are aligned to each other by a measured rule, and letting
   them be dragged would mean giving up that alignment for nothing. A
   logotype is artwork: where it sits over a picture is a judgement only the
   person looking at the picture can make.

   Same rule as the art: paint live, save once. Moving writes to M and calls
   layoutHero, which only rewrites inline styles — no render, so the node
   under the pointer survives the gesture. */
const WP_MOVABLE = { logo: 1, hook: 1 };

function webPageBindDrag() {
  const stage = site && site.querySelector('.hero-stage');
  if (!stage) return;
  let g = null;

  stage.addEventListener('pointerdown', e => {
    const el = e.target.closest('.el[data-edit]');
    if (!el || !WP_MOVABLE[el.dataset.edit] || e.button !== 0) return;
    const sb = stage.getBoundingClientRect();
    if (!sb.width || !sb.height) return;
    const st = M[el.dataset.edit];
    /* MEASURED AT PRESS, not per move: none of this changes while the hand is
       moving, and re-measuring inside a pointermove is how a drag starts
       costing a layout on every frame. */
    const lb = el.getBoundingClientRect();
    /* WHAT TO LINE UP WITH. Every OTHER piece on the header, not just the
       nearest one — the mockup took the first it found, which meant a
       logotype could snap to the title but never to the button under it. */
    const others = [...stage.querySelectorAll('.el[data-edit]')].filter(n => n !== el);
    const A = others.reduce((acc, o) => {
      const t = alignTargets(stage, el, o);
      acc.x.push(...t.x); acc.y.push(...t.y);
      return acc;
    }, { x: [], y: [] });
    g = { el, st, sb, x: e.clientX, y: e.clientY, moved: false, A,
          wPct: (lb.width / sb.width) * 100, hPct: (lb.height / sb.height) * 100,
          x0: st.x, top0: st.top != null ? st.top : (lb.top - sb.top) / sb.height * 100 };
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
    el.classList.add('wp-moving');
    e.preventDefault();
    e.stopPropagation();          // do not also select the hero underneath
  });

  stage.addEventListener('pointermove', e => {
    if (!g) return;
    /* A TAP IS NOT A TINY DRAG. Below this threshold the gesture is treated
       as a click — a press and release at the same spot, which is how anyone
       asks to open something. Without it the logotype could only ever be
       moved, never selected, because pointerdown claimed the pointer and the
       click that followed was a drag of zero pixels.
       3px, because a mouse click carries a pixel or two of jitter and a
       finger carries rather more. */
    if (!g.moved && Math.abs(e.clientX - g.x) + Math.abs(e.clientY - g.y) > 3) g.moved = true;
    if (!g.moved) return;
    if (!site.classList.contains('wp-dragging')) site.classList.add('wp-dragging');
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const raw = {
      x:   clamp(g.x0   + ((e.clientX - g.x) / g.sb.width)  * 100, 0, 100),
      top: clamp(g.top0 + ((e.clientY - g.y) / g.sb.height) * 100, 0, 96),
    };

    /* SNAPPING HAPPENS IN CENTRE SPACE, always, whatever edge the element is
       anchored by. That is not an implementation convenience — it is how the
       eye lines things up. You judge a logotype as being "on the third" by
       its middle, not by wherever its box happens to start, and an element
       anchored right would otherwise snap by an edge nobody is looking at.
       So: convert to the centre, snap there, convert back. */
    const anchorFrac = ANCHOR[g.st.align || 'center'];
    const cx = raw.x + (0.5 - anchorFrac) * g.wPct;
    const sx = resolveSnap(cx, g.A.x);
    const sy = resolveSnap(raw.top + g.hPct / 2, g.A.y);
    g.st.x   = sx.v + (anchorFrac - 0.5) * g.wPct;
    g.st.top = clamp(sy.v - g.hPct / 2, 0, 96);

    /* TWO KINDS OF GUIDE, AND THEY NEVER CLAIM THE SAME MOMENT. White for the
       frame's own thirds and centre; magenta the instant the piece lines up
       with another piece. The grid line only lights when no alignment is
       holding it, because lining up with the button is a more specific
       intention than landing on a third, and showing both would say the
       position is being decided by two things at once. */
    const gu = site.querySelector('.guides');
    const av = site.querySelector('.aguides .av'), ah = site.querySelector('.aguides .ah');
    if (av) { av.classList.toggle('on', sx.line !== null); if (sx.line !== null) av.style.left = sx.line + '%'; }
    if (ah) { ah.classList.toggle('on', sy.line !== null); if (sy.line !== null) ah.style.top  = sy.line + '%'; }
    if (gu) {
      gu.querySelectorAll('.gv').forEach(n => n.classList.toggle('hit', sx.line === null && +n.dataset.p === sx.v));
      gu.querySelectorAll('.gh').forEach(n => n.classList.toggle('hit', sy.line === null && +n.dataset.p === sy.v));
    }

    // A hand placement is a placement: it must not be re-derived from the
    // bottom by the arrangement on the next pass.
    g.st.bottom = null;
    layoutHero();                 // writes inline styles only
  });

  const drop = () => {
    if (!g) return;
    const key = g.el.dataset.edit;
    g.el.classList.remove('wp-moving');
    /* Every guide off, and off HERE rather than left to the redraw: a tap
       does not redraw at all, and a lit third left burning on the artwork
       after the hand has gone is the page telling you a gesture is still in
       progress when it is not. */
    site.classList.remove('wp-dragging');
    site.querySelectorAll('.guides .hit').forEach(n => n.classList.remove('hit'));
    site.querySelectorAll('.aguides .on').forEach(n => n.classList.remove('on'));
    /* NOTHING MOVED, SO NOTHING IS SAVED. Writing a position here would pin a
       piece where the layout had merely happened to put it, and a piece that
       was only ever tapped would stop following the arrangement. Select it
       instead: the tap was a request to edit, not a placement. */
    if (!g.moved) {
      const k = key;
      g = null;
      return webPageSelect(state.webPageSel === k ? null : k);
    }
    setWebPageField(key + 'Pos', { x: g.st.x, top: g.st.top, align: g.st.align || 'center' });
    g = null;
    webPageRedraw();
  };
  stage.addEventListener('pointerup', drop);
  stage.addEventListener('pointercancel', drop);
}

function webPageBindDock() {
  const dock = document.querySelector('[data-wp-dock]');
  if (!dock) return;
  const hero = site && site.querySelector('[data-edit="art"]');

  // `input` fires continuously while the slider moves, so it must not render.
  dock.addEventListener('input', e => {
    if (e.target.closest('[data-wp=zoom]') && hero) {
      const r = e.target;
      M.art.zoom = +r.value;
      const val = dock.querySelector('[data-wp=zoomval]');
      if (val) val.textContent = r.value + '%';
      applyArtPan(hero);
      return;
    }
    /* THE TITLE'S SIZE, PAINTED THE SAME WAY: --tz is the multiplier the type
       is already built on, so writing it moves the name live without touching
       state and without a render that would replace the slider under the
       thumb. The commit below re-runs the layout, which is what recalculates
       --tfit — the squeeze that keeps a long name on one line beside the
       button — so the live paint is honest about size and settles into being
       honest about fit. */
    if (e.target.closest('[data-wp=tsize]')) {
      const r = e.target, t = site && site.querySelector('.el[data-edit="title"]');
      M.title.size = +r.value;
      const val = dock.querySelector('[data-wp=tsizeval]');
      if (val) val.textContent = r.value + '%';
      if (t) t.style.setProperty('--tz', (M.title.size / 100).toFixed(2));
      return;
    }
    /* THE LOGOTYPE'S SIZE HAS NO VARIABLE TO WRITE. Its box is built in
       PIXELS by inkBoxHTML — measured from the letters, which is the whole
       point of the ink box — so there is nothing to nudge live the way --tz
       nudges the title.
       So the paint is a transform. It changes nothing about layout, which is
       exactly what a gesture wants: no reflow, no re-measure, no render. The
       commit below rebuilds the real geometry and the transform goes with the
       node that carried it.
       The origin follows the alignment, because .logo-el is anchored by the
       edge it is aligned to. Scaling from the centre of a left-aligned mark
       would walk it off the margin as it grew — the same bug the anchoring
       model was built to avoid. */
    /* THE CORNER'S SIZE AND ITS WORDS, painted the same way as everything
       else here: straight onto the node, no state, no render. The text one
       matters more than it looks — a render on every keystroke would replace
       the input under the caret, which is the exact failure the whole
       panel-versus-page split exists to avoid. */
    if (e.target.closest('[data-wp=hsize]')) {
      const r = e.target, el = site && site.querySelector('.hero-head');
      M.header.size = +r.value;
      const val = dock.querySelector('[data-wp=hsizeval]');
      if (val) val.textContent = r.value + 'px';
      if (el) {
        const img = el.querySelector('.hh-img');
        const word = el.querySelector('.hh-word');
        const ink = el.querySelector('.logo-ink');
        if (img) img.style.height = M.header.size + 'px';
        else if (word) word.style.fontSize = (M.header.size * 0.56).toFixed(1) + 'px';
        else if (ink) {
          // The ink box is built in pixels from a measured scale, so this is
          // a transform for the duration of the gesture — the commit rebuilds
          // the real geometry.
          ink.style.transformOrigin = 'top left';
          ink.style.transform = 'scale(' + (M.header.size / (M.header.baseSize || 34)).toFixed(3) + ')';
        }
      }
      return;
    }
    if (e.target.closest('[data-wp=htext]')) {
      const word = site && site.querySelector('.hero-head .hh-word');
      M.header.text = e.target.value;
      if (word) word.textContent = M.header.text || WPG.title;
      return;
    }
    if (e.target.closest('[data-wp=lsize]')) {
      const r = e.target, el = site && site.querySelector('.el[data-edit="logo"]');
      M.logo.size = +r.value;
      const val = dock.querySelector('[data-wp=lsizeval]');
      if (val) val.textContent = r.value + '%';
      const ink = el && el.querySelector('.logo-ink');
      if (ink) {
        const origin = { left: 'top left', right: 'top right' }[el.dataset.align] || 'top center';
        ink.style.transformOrigin = origin;
        ink.style.transform = 'scale(' + (M.logo.size / (M.logo.baseSize || 100)).toFixed(3) + ')';
      }
    }
  });
  // `change` fires when the handle is released. That is the commit.
  dock.addEventListener('change', e => {
    if (e.target.closest('[data-wp=zoom]')) {
      setWebPageArt({ zoom: M.art.zoom, ox: M.art.ox, oy: M.art.oy });
      return webPageRedraw();
    }
    if (e.target.closest('[data-wp=tsize]')) {
      setWebPageField('titleSize', M.title.size);
      return webPageRedraw();
    }
    if (e.target.closest('[data-wp=lsize]')) {
      setWebPageField('logoSize', M.logo.size);
      return webPageRedraw();
    }
    if (e.target.closest('[data-wp=hsize]')) {
      setWebPageField('headerSize', M.header.size);
      return webPageRedraw();
    }
    if (e.target.closest('[data-wp=htext]')) {
      // `change` on a text input is blur or Enter — the moment the developer
      // has finished the word, not the moment they typed a letter of it.
      setWebPageField('headerText', e.target.value.trim());
      return webPageRedraw();
    }
  });

  dock.addEventListener('click', e => {
    const b = e.target.closest('[data-wp]');
    if (!b || b.tagName !== 'BUTTON') return;
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.wp;
    if (a === 'done')   return webPageSelect(null);
    if (a === 'upload') return wpPickImage();
    if (a === 'ctamode'){ setWebPageField('buyMode', b.dataset.k); return webPageRedraw(); }
    if (a === 'tweight'){ setWebPageField('titleWeight', +b.dataset.k); return webPageRedraw(); }
    if (a === 'tint')   { setWebPageField('logoTint', b.dataset.k); return webPageRedraw(); }
    if (a === 'relogo') return wpPickLogo();
    if (a === 'himg')   return wpPickHeaderImage();
    if (a === 'hsrc') {
      /* CHOOSING "IMAGE" WITH NO IMAGE ASKS FOR ONE. The same rule the
         logotype switch follows: making somebody pick a mode and then hunt
         for a second control to give it something is two steps for one
         intention, and the mode would sit there selected and empty in
         between. */
      if (b.dataset.k === 'image' && !(state.webSite.page || {}).headerImage) return wpPickHeaderImage();
      setWebPageField('headerSrc', b.dataset.k);
      return webPageRedraw();
    }
    if (a === 'panel')  {
      if (typeof openStorePreviewSection !== 'function') return;
      // Leaving for a flip panel leaves the selection behind: coming back to
      // a lit zone with a popup over it, minutes later, is a state nobody
      // asked for.
      state.webPageSel = null;
      return openStorePreviewSection('web', b.dataset.k);
    }
    if (a === 'accent') {
      // The page's one colour, written where the page's one colour lives —
      // not a field of the button's own.
      if (!state.webSite) state.webSite = {};
      state.webSite.accent = b.dataset.k;
      return webPageRedraw();
    }
    if (a === 'has') {
      const k = b.dataset.k;
      /* A logotype with no file behind it asks for one instead of switching on
         an empty box. Everything else is a plain toggle. */
      if (k === 'logo' && !(state.webSite.page && state.webSite.page.logo)) return wpPickLogo();
      /* THE BUTTON IS A MODE, NOT A FLAG, so its switch cannot be the same
         kind of toggle as the other three. It has three settings — a pill,
         the store marks, or nothing — and turning it off and on again must
         not quietly demote store marks to a pill. So off remembers what it
         was and on restores it. buyModePrev exists for exactly this and is
         never read anywhere else. */
      if (k === 'buy') {
        const cur = (state.webSite.page || {}).buyMode || 'button';
        if (cur === 'none') {
          setWebPageField('buyMode', (state.webSite.page || {}).buyModePrev || 'button');
        } else {
          setWebPageField('buyModePrev', cur);
          setWebPageField('buyMode', 'none');
        }
        return webPageRedraw();
      }
      const field = { title: 'titleShow', hook: 'hookShow',
                      logo: 'logoShow', header: 'headerShow', links: 'linksShow' }[k];
      const cur = (state.webSite.page || {})[field];
      // titleShow defaults to ON, so an undefined value means "shown" and the
      // first press has to turn it OFF rather than on again.
      const next = field === 'titleShow' ? cur === false : !cur;
      setWebPageField(field, next);
      /* HIDING WHAT YOU HAVE SELECTED LETS GO OF IT. The popup is anchored to
         the element; switch the element off and the panel has nothing to
         point at, so it would fall back to the header's fixed place and sit
         there describing something no longer on the page. */
      if (!next && state.webPageSel === k) state.webPageSel = null;
      return webPageRedraw();
    }
    if (a === 'reset') {
      /* Reset means the FRAMING, not the artwork: zoom and pan go back to
         untouched and a developer's own upload stays. Throwing away an
         uploaded file behind a button labelled Reset would be a trapdoor. */
      setWebPageArt({ ox: 0, oy: 0, zoom: 100 });
      webPageRedraw();
    }
  });
}

/* An upload is the developer choosing, and it outranks anything fetched. Held
   as a data: URL on webSite.page.artOverride so the store's own art stays
   intact underneath — "use the store art" is then a revert, not a re-download. */
/* ── PICKING A FILE ───────────────────────────────────────────────────────
   THE INPUT IS PUT IN THE DOCUMENT, and that is the whole fix.

   A file input created and clicked without ever being inserted is reachable
   only from its own change handler, which the input in turn holds — a cycle
   with no root outside itself. The file dialog is modal and can sit open for
   as long as it takes to find a picture, and in that window the pair can be
   collected: the dialog still opens, you still choose a file, and the change
   event never arrives. Nothing errors; the upload just silently does nothing,
   which is exactly what it looked like.

   Attaching it gives it a root. It is removed again once the choice is made
   or the dialog is dismissed, so nothing accumulates.

   `cancel` matters too: without it, dismissing the dialog would leave the
   input attached forever, one per attempt. */
function wpReadImage(then) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0';
  document.body.appendChild(inp);

  const cleanup = () => { if (inp.parentNode) inp.parentNode.removeChild(inp); };

  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    cleanup();
    if (!f) return;
    const r = new FileReader();
    r.onerror = () => console.error('web page: could not read', f.name);
    // No redraw here any more: wpPickFrom owns it, so the two paths through
    // the picker cannot end up drawing a different number of times.
    r.onload  = () => { then({ name: f.name, dataUrl: r.result }); };
    r.readAsDataURL(f);
  });
  // Fires when the picker is dismissed without choosing. Not in every browser,
  // hence the timeout as a floor — an orphan input costs nothing but it is
  // still litter in the DOM.
  inp.addEventListener('cancel', cleanup);
  setTimeout(cleanup, 5 * 60 * 1000);

  inp.click();
}

/* THE THREE PICKERS NOW OPEN THE LIBRARY, not a file dialog.

   Uploading was never the common case — it is the FIRST case. By the time a
   developer is arranging their page they have already given Shipmate their
   key art, their logotype and eight screenshots, and asking for the file
   again is asking them to find it on their disk a second time. The library
   offers what the project already has, filtered to what belongs in this slot,
   with "Upload new…" as the first tile so the old gesture is never slower.

   `smPickAsset(kinds, done)` lives in app.js because the grid is Shipmate
   chrome rather than page chrome; it falls back to the plain file dialog if
   the library is not loaded, so this file still works standing alone. */
function wpPickImage() {
  wpPickFrom(['art-land','art-port'], file => {
    setWebPageField('artOverride', file);
    setWebPageArt({ ox: 0, oy: 0 });     // a new picture deserves a fresh crop
  });
}

/* One shape for all three: ask the library, and if it is not there, ask the
   disk. `done` receives whatever the page stores — a ref, or the {name,
   dataUrl} record it used to get — and never needs to know which. */
function wpPickFrom(kinds, done) {
  /* AND THEN REDRAW, which the library path was missing.

     Every `done` here ends in setWebPageField, and that deliberately does NOT
     render: it is also what a drag calls on every pointermove, and rendering
     there would replace the node under the pointer. So the redraw belongs to
     whoever finished a gesture — wpReadImage always did one at the end of its
     onload, and routing through the picker skipped past it. The choice landed
     in state and the page carried on showing the old picture until something
     else happened to rebuild it. */
  const then = v => { done(v); webPageRedraw(); };
  if (typeof smPickAsset === 'function') return smPickAsset(kinds, then);
  wpReadImage(then);
}

/* The logotype the developer supplies themselves. Choosing a file IS turning
   it on — asking someone to pick an image and then find a second switch to
   show it would be two steps for one intention. */
function wpPickLogo() {
  wpPickFrom(['logo','icon'], file => {
    setWebPageField('logo', file);
    setWebPageField('logoShow', true);
  });
}

/* The corner's OWN file. Choosing it is switching to it, for the same reason
   the logotype's picker turns the logotype on: nobody uploads an image in
   order to not use it. */
function wpPickHeaderImage() {
  wpPickFrom(['logo','icon'], file => {
    setWebPageField('headerImage', file);
    setWebPageField('headerSrc', 'image');
    setWebPageField('headerShow', true);
  });
}

/* Esc leaves the zone, the same as ✓ Done. Bound once, on the document,
   because the page it belongs to is rebuilt constantly. */
if (typeof document !== 'undefined' && !webPageSelect._esc) {
  webPageSelect._esc = true;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && typeof state !== 'undefined' && state.webPageSel) {
      e.stopPropagation();
      webPageSelect(null);
    }
  });
}

function webPageMount() {
  site = document.getElementById('site');
  if (!site || !M) return;
  webPageBindPanels();
  webPageBindArtGestures();
  webPageBindDrag();
  webPageBindDock();
  webPageBindToolbar();
  /* PLACE IT NOW, not only in the pass below. A rebuilt page brings a rebuilt
     panel, and a fresh panel starts at its CSS position — the header's spot,
     at the top of the frame. Left to the requestAnimationFrame, it paints
     there for one frame and then jumps to its element, which reads as the
     menu flinching every time you press a button in it.
     The pass re-places it afterwards, because that is what decides where the
     title and the button finally sit; this call only stops the flinch. */
  wpDockPlace();
  /* IS THE GEOMETRY REAL RIGHT NOW?

     Shipmate opens and closes an editor by rotating the whole card in 3D.
     While that runs, getBoundingClientRect reports the TRANSFORMED rectangle
     — squashed by the perspective — and every number the hero is built from
     comes from that rect: the title's fit scale, the button's anchor, the
     art's travel limits.

     offsetWidth is the tell. It is the LAYOUT width and a transform cannot
     touch it, so the two disagreeing means an ancestor is mid-animation and
     nothing measured now is worth writing down.

     This is why coming back from a flip panel visibly re-positioned the
     header: a pass ran against the squashed card, placed everything for a
     stage that did not exist, and the transitionend pass then corrected it.
     The correction was the glitch — the same shape as the key art being
     framed twice. Skipping the dishonest pass removes the first placement
     rather than trying to make the second one prettier. */
  let stalled = 0;
  const distorted = () => {
    const st = site && site.querySelector('.hero-stage');
    if (!st || !st.offsetWidth) return false;
    return Math.abs(st.getBoundingClientRect().width - st.offsetWidth) > 1;
  };
  const pass = () => {
    if (!document.getElementById('site')) return;   // the modal moved on
    site = document.getElementById('site');
    /* Try again shortly rather than giving up: transitionend is the reliable
       signal and normally arrives first, but a transform that is cancelled
       rather than finished fires nothing at all, and a hero that is never
       placed is worse than one placed a frame late. Bounded so a permanently
       transformed ancestor cannot spin here forever. */
    if (distorted()) {
      if (stalled++ < 20) setTimeout(pass, 60);
      return;
    }
    stalled = 0;
    const hero = site.querySelector('[data-edit="art"]');
    if (hero) applyArtPan(hero);
    ensureInk();
    layoutHero();
    replaceLayout();
    // LAST, always: the pass above is what decides where the title and the
    // button ended up, and a panel measured before it points at where they
    // used to be.
    wpDockPlace();
  };
  requestAnimationFrame(pass);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pass);

  /* AND AGAIN WHEN THE CARD FINISHES FLIPPING.

     Shipmate opens an editor by rotating the whole card in 3D. While that
     runs, getBoundingClientRect reports the TRANSFORMED rectangle — squashed
     by the perspective — so a measuring pass during the animation reads a
     stage that is the wrong size, scales the title against it and puts the
     button where that stage's bottom would be. Come back to the preview and
     the alignment is off by however much the card happened to be turned.

     The ResizeObserver above cannot see this: a transform does not change the
     content box it reports. Only the animation ending says the geometry is
     finally real, so that is what we listen for. Capture phase because these
     events do not bubble. */
  const settle = e => {
    if (!document.getElementById('site')) {
      document.removeEventListener('transitionend', settle, true);
      document.removeEventListener('animationend', settle, true);
      return;
    }
    if (e.target && e.target.contains && e.target.contains(document.getElementById('site'))) pass();
  };
  document.addEventListener('transitionend', settle, true);
  document.addEventListener('animationend', settle, true);

  /* AND WHENEVER THE STAGE ACTUALLY CHANGES SIZE.

     Anchoring both hero elements from the bottom means a height change slides
     them together instead of apart, which is the real fix. This is the net
     under it: the stage's height is clamp(260px, 42vh, 460px) minus a cut
     that comes from a container query, so it can settle after the frame we
     measured in — a resized window, a modal that grows, a scrollbar
     appearing. Re-placing on a real size change is cheaper than trying to
     predict the one frame where every number is final.

     Guarded against re-entry: placing writes inline styles, which the
     observer would otherwise see as another change. */
  if (typeof ResizeObserver === 'function') {
    const stage = site.querySelector('.hero-stage');
    if (stage) {
      /* WIDTH TOO, not just height.

         This watched only the height, which was enough while the only thing
         that moved was the modal growing. The device switcher changes the
         WIDTH at a constant height, and every number the hero is built from
         is a width: the title's size is clamp(30px, 6cqw, 64px), the button
         is anchored to the stage's right edge, and the fit scale is measured
         against whatever room the button leaves. A width change with the
         observer asleep left the title sized for a stage that no longer
         existed — which is precisely the alignment bug we spent an afternoon
         on, arriving by a new door. */
      let last = '', busy = false;
      const ro = new ResizeObserver(entries => {
        if (busy) return;
        const r = entries[0].contentRect;
        const key = Math.round(r.width) + 'x' + Math.round(r.height);
        if (!r.width || !r.height || key === last) return;
        last = key;
        busy = true;
        requestAnimationFrame(() => { pass(); busy = false; });
      });
      ro.observe(stage);
      // The page is rebuilt wholesale on every render, so this observer dies
      // with the node it watches; nothing to disconnect.
    }
  }
}
const STORE_ICONS = {
  steam  :{ label:'Steam',       svg:'steam',   img:'Assets/Platform_Icons/Steam_white.png' },
  ios    :{ label:'App Store',   svg:'ios',     img:'Assets/Platform_Icons/AppStore_white.png' },
  android:{ label:'Google Play', svg:'android', img:'Assets/Platform_Icons/GooglePlay_white.png' },
  epic   :{ label:'Epic Games',  svg:'epic',    img:null },
  psn    :{ label:'PlayStation', svg:null,      img:'Assets/Platform_Icons/PlayStation_white.png' },
  xbox   :{ label:'Xbox',        svg:null,      img:'Assets/Platform_Icons/Xbox_white.png' },
  switch :{ label:'Nintendo',    svg:null,      img:'Assets/Platform_Icons/Nintendo_white.png' },
};

const SECTION_NAMES = { strip:'Metadata', lead:'Hook', video:'Trailer', about:'About',
                        shots:'Screenshots', footer:'Footer' };

/* The movable middle, in the order they ship in. The hero and the footer are
   absent on purpose — see the note on sectionOrder. */
const WP_SECTIONS = ['strip', 'lead', 'video', 'about', 'shots'];

/* THE STORED ORDER, MADE SAFE TO USE.

   A saved array is data from the past: it can name a section that no longer
   exists, miss one that was added since, or repeat one. Reading it raw would
   mean a page saved today silently losing a section we add next month — the
   exact failure that is impossible to notice, because the page still looks
   fine.

   So: keep what is still real, in the order it was saved, then append
   anything the stored array never heard of. A new section always appears; a
   deleted one always disappears; nothing is ever drawn twice. */
function wpOrder(page) {
  const saved = Array.isArray(page.sectionOrder) ? page.sectionOrder : [];
  const seen = new Set();
  const out = [];
  for (const k of saved) if (WP_SECTIONS.includes(k) && !seen.has(k)) { seen.add(k); out.push(k); }
  for (const k of WP_SECTIONS) if (!seen.has(k)) out.push(k);
  return out;
}

/* HOW MUCH THE KEY ART IS DARKENED UNDER THE TITLE, 0–100, and no longer a
   control. It was a slider, and the slider was answering a question the
   developer should never have been asked: white type needs a dark ground, and
   how dark is a typographic fact, not a preference.

   Fifty is the middle of the range it used to sit in — the fixtures wanted 45
   for Spilled!'s bright blue sky and 85 for Nightfall's near-black art, so the
   honest note is that a constant is a compromise at both ends. It is the right
   compromise: one fewer decision on a page that is meant to arrive finished,
   and if bright art ever proves genuinely unreadable the fix is a measured
   one — sample the art's luminance and set this from it — rather than handing
   the problem back to the user as a slider. */
const SCRIM = 50;

/* THE ABOUT AREA IS A LIST OF PARTS, each naming the field it came from, so
   that typing into one block writes back to exactly one field. The fixtures
   were written before there were parts and still carry a single `long`
   string, so they are normalised into a one-part list here: the page then has
   one shape to render, with no branch anywhere asking whether this game is
   the new kind. Copied, like `strip` and `contact`, so editing one game's
   text never writes into another's. */
function aboutPartsOf(g){
  return Array.isArray(g.about)
    ? g.about.map(p => ({ ...p }))
    : [{ field:'aboutGame', label:'About this game', text:g.long || '' }];
}
const aboutTextOf = parts => parts.map(p => p.text).join('\n\n');

let artSeed = 3;
let aiIdx = 0;

/* ============================================================================
   GENERATED KEY ART — only for titles with no real assets, so the layouts can
   still be judged when nothing has been uploaded yet.
   ========================================================================== */
const PALETTES = {
  classic :{ sky:['#0d1b3a','#123b5e','#2c7f96'], sun:'#8fe6ff', ridge:['#0a1830','#08111f','#04070d'], fog:'#7fd4ee' },
  boutique:{ sky:['#3b2a3f','#8a4f4a','#e2a06a'], sun:'#ffd9a0', ridge:['#3a2a2c','#241a1d','#120c0e'], fog:'#f0c39a' },
  arcade  :{ sky:['#1b0736','#5b1263','#c81f7a'], sun:'#ffe14d', ridge:['#2a0a3c','#180524','#0b0212'], fog:'#ff6bc4' },
};
function svgArt(tpl, seed){
  const p = PALETTES[tpl] || PALETTES.classic;
  const r = n => ((Math.sin(seed*97.13 + n*41.7)+1)/2);
  const sunX = 300 + r(1)*1000, sunY = 430 + r(2)*130, sunR = 110 + r(3)*90;
  const ridge = (baseY, amp, fill, pts) => {
    let d = `M0,900 L0,${baseY}`;
    for(let i=0;i<=pts;i++){
      const x = (1600/pts)*i;
      const y = baseY - Math.abs(Math.sin(seed*3.1 + i*1.37 + baseY*0.011))*amp - r(i+baseY)*amp*0.5;
      d += ` L${x.toFixed(0)},${y.toFixed(0)}`;
    }
    return `<path d="${d} L1600,900 Z" fill="${fill}"/>`;
  };
  let stars='';
  for(let i=0;i<70;i++)
    stars += `<circle cx="${(r(i*2)*1600).toFixed(0)}" cy="${(r(i*2+1)*430).toFixed(0)}" r="${(r(i*3)*1.5+.4).toFixed(1)}" fill="#fff" opacity="${(r(i*5)*.65+.12).toFixed(2)}"/>`;
  return `
  <svg class="kart" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${p.sky[0]}"/><stop offset="55%" stop-color="${p.sky[1]}"/><stop offset="100%" stop-color="${p.sky[2]}"/></linearGradient>
      <radialGradient id="glow${seed}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${p.sun}" stop-opacity=".95"/><stop offset="45%" stop-color="${p.sun}" stop-opacity=".28"/><stop offset="100%" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>
      <linearGradient id="fog${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${p.fog}" stop-opacity="0"/><stop offset="60%" stop-color="${p.fog}" stop-opacity=".22"/><stop offset="100%" stop-color="${p.fog}" stop-opacity="0"/></linearGradient>
      <radialGradient id="vig${seed}" cx="50%" cy="48%" r="72%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".62"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sky${seed})"/>
    ${stars}
    <circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${(sunR*3.4).toFixed(0)}" fill="url(#glow${seed})"/>
    <circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${sunR.toFixed(0)}" fill="${p.sun}" opacity=".92"/>
    ${ridge(600,150,p.ridge[0],9)}
    <rect y="520" width="1600" height="220" fill="url(#fog${seed})"/>
    ${ridge(720,120,p.ridge[1],7)}
    ${ridge(840,90,p.ridge[2],6)}
    <g transform="translate(${(1140 + r(9)*260).toFixed(0)},806) scale(1.5)" fill="${p.ridge[2]}">
      <ellipse cx="0" cy="2" rx="14" ry="3" opacity=".55"/>
      <path d="M-4,0 L-4,-22 L-7,-34 L-3,-46 a4,4 0 118,0 L12,-34 L6,-22 L6,0 L2,0 L1,-16 L-1,-16 L-2,0 Z"/></g>
    <rect width="1600" height="900" fill="url(#vig${seed})"/>
  </svg>`;
}

/* ============================================================================
   LOGOTYPE INK TRIM
   A delivered logotype almost never fills its own file. Spilled!'s is 1280×720
   with the wordmark in a band across the middle: measured, the ink is 1212×474,
   so 35% of the file's HEIGHT is empty alpha (and only 6% of its width — this
   particular file is well balanced left to right). Every measurement downstream
   — vertical centring, the alignment guides, what the size slider means — was
   using the FILE's box while the eye uses the ink. That is why a
   mathematically centred pair still looked wrong, and why the gap between logo
   and button looked far bigger than the 5% it actually was: most of it was
   empty PNG.

   The first version of this actually CROPPED the file — canvas, re-encode,
   swap in a trimmed data URL — and that was wrong. Anything soft that lives
   outside the alpha bounding box, a baked-in drop shadow most of all, got
   sliced off against the new rectangle. The logotype came back with its shadow
   cut in a hard straight line.

   So: MEASURE the ink, never cut it. The bounds come back as fractions of the
   file and are used only for arithmetic — where the element's box is, where
   the alignment guides sit, what the size slider is scaling. The <img> keeps
   the developer's own file, whole, and its shadow renders as far as it likes.

   Cached per source. If the canvas can't be read — opening this page over
   file:// taints it — the bounds fall back to the whole file and the page goes
   back to being slightly loose rather than breaking.
   ========================================================================== */
const FULL_INK = { x0:0, y0:0, x1:1, y1:1, w:1, h:1 };
const _inkCache = {};

function measureInk(src, done, allowCors = true){
  if(_inkCache[src]) return done(_inkCache[src]);
  const img = new Image();
  const give = ink => done(_inkCache[src] = ink);
  // A logotype served from another origin taints the canvas and getImageData
  // throws, so ask for CORS first. If the host refuses, the load fails and we
  // retry plainly — the picture still renders, it just can't be measured, and
  // the bounds fall back to the whole file.
  if(allowCors && /^https?:/.test(src)) img.crossOrigin = 'anonymous';
  img.onerror = () => {
    if(allowCors && /^https?:/.test(src)) return measureInk(src, done, false);
    give({ ...FULL_INK, natW:0, natH:0 });
  };
  img.onload = () => {
    const natW = img.naturalWidth, natH = img.naturalHeight;
    try{
      // Scan a DOWNSCALED copy, never the original. This loop is synchronous
      // on the main thread, so at full size a 4K logotype would be eight
      // million iterations over a 33MB buffer and the page would simply stop
      // responding. The result is a bounding box returned as fractions, so
      // 512px on the long edge is accurate to about a fifth of a percent —
      // far below anything the eye can see in a layout.
      const scale = Math.min(1, 512 / Math.max(natW, natH));
      const w = Math.max(1, Math.round(natW * scale));
      const h = Math.max(1, Math.round(natH * scale));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently:true });
      ctx.drawImage(img, 0, 0, w, h);
      const px = ctx.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for(let y = 0; y < h; y++){
        for(let x = 0; x < w; x++){
          // 8, not 0: a soft edge leaves a halo of near-zero alpha that would
          // push the bounds back out to the file edge and measure nothing.
          if(px[(y*w + x)*4 + 3] > 8){
            if(x < x0) x0 = x;
            if(x > x1) x1 = x;
            if(y < y0) y0 = y;
            if(y > y1) y1 = y;
          }
        }
      }
      // Bounds come back as fractions of the file, so they are independent of
      // the scan resolution — but natW/natH must stay the REAL dimensions,
      // since inkGeom derives the image's aspect ratio from them.
      if(x1 < 0) return give({ ...FULL_INK, natW, natH });        // fully transparent
      give({
        x0:x0/w, y0:y0/h, x1:(x1+1)/w, y1:(y1+1)/h,
        w:(x1+1-x0)/w, h:(y1+1-y0)/h, natW, natH,
      });
    }catch(e){
      // natW/natH, not w/h: those are block-scoped to the try above and would
      // throw a ReferenceError here, turning a handled failure into a crash.
      give({ ...FULL_INK, natW, natH });
    }
  };
  img.src = src;
}

/* Measure whichever game's logotype is loaded, then repaint once it lands.
   Nothing waits on it: the page draws immediately using the whole file as the
   bounds and tightens up when the measurement arrives. */
function ensureInk(){
  const m = MARK();
  if(!m || m.ink) return;
  // An upload's measurement lives in the shared cache keyed by its data URL;
  // a game's own logotype is also stored on the game, which is what the
  // fixtures and the tests read.
  const own = !M.up.logo;
  measureInk(m.src, ink => { if(own) WPG.ink = ink; webPageRedraw(); });
}

/* ALWAYS an <img>, even for the generated scene — which is why the SVG is
   handed over as a data URL rather than inlined. object-fit and, crucially,
   object-position simply do not apply to an inline <svg>, so an inlined one
   would have to be panned a completely different way. One element type means
   one framing model for both. */
/* Is there a picture for the header at all? An upload the developer chose
   outranks everything; failing that, whatever the submission delivered. */
const wpHasArt = () => !!(M.up.art || (WPG.real && WPG.hero));

/* NO ART IS NOT THE SAME AS ART WE HAPPEN NOT TO LIKE.

   This used to draw the generated mountain scene, on the reasoning that a
   picture beats a broken image. True, but it answers the wrong question: a
   plausible-looking landscape reads as a DECISION — someone's placeholder
   art, or worse, art the tool picked for you — so nothing about it says a
   file is missing, and the one instruction the page could usefully give at
   this moment goes ungiven.

   So the empty header states its own name, says what to do, and says what
   size. The dimensions matter more than they look: the header runs roughly
   2.3:1 at desktop and up to 3:1 on a wide monitor, so a square or portrait
   file is going to lose most of itself to the crop, and finding that out
   after uploading is a worse lesson than being told first. 3840 × 1240 is
   named because it is Steam's own library hero — a file most of these
   developers already have, sized for a banner of exactly this shape.

   Nothing else about the hero changes: the title and the button stay where
   they are, so the page still shows its shape rather than collapsing to a
   form. Once a file lands, this markup is gone and the header behaves
   exactly as it always did. */
function heroEmptyHTML(){
  return `
    <div class="kart-empty">
      <span class="ke-box">
        <svg class="ke-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2.5" y="4.5" width="19" height="15" rx="2"/>
          <circle cx="8" cy="10" r="1.6"/>
          <path d="M21 15.5l-4.8-4.8-4 4-2.7-2.7-5.5 5.5"/>
        </svg>
        <b class="ke-t">Header art</b>
        <span class="ke-s">Click to upload your key art</span>
        <span class="ke-d">3840 × 1240 · JPG or PNG — the same file as your Steam library hero</span>
      </span>
    </div>`;
}

function heroArt(cls){
  const g = WPG;
  // An uploaded file outranks everything: it is the developer choosing, and
  // this whole feature exists because the fetched art is a starting point.
  if(!wpHasArt()) return heroEmptyHTML();
  const src = M.up.art || g.hero;
  const fallback = (!M.up.art && g.real && g.header) ? ` onerror="this.onerror=null;this.src='${g.header}'"` : '';
  return `<img class="kart ${cls||''}" src="${src}" alt="${esc(g.name)} key art"
               draggable="false" onload="artLoaded(this)"${fallback}>`;
}
/* The key art's own proportions, learned from the file the first time it
   loads. Needed by fit:'whole', which hands them to the hero so the art is
   shown entire. Falls back to the generated scene's 1600×900 viewBox. */
/* THE MEASURED PROPORTIONS, REMEMBERED ACROSS REBUILDS.

   This is why the key art visibly jumped whenever anything else was committed
   — dropping the logotype, switching the title back on, any press that ends in
   a redraw.

   M is rebuilt from scratch on every render and its artRatio starts null, so
   for the frames between the rebuild and the new <img> finishing its decode,
   artRatio() fell back to 16/9. Every travel limit in artMetrics is derived
   from that number, so applyArtPan computed the crop for a 16:9 picture and
   wrote an object-position for it. Then the image decoded, artLoaded wrote the
   real ratio — 3.1:1 for a Steam library hero — and the framing was corrected.
   The correction IS the jump. It was never the drag moving the background; it
   was the background being placed twice, wrongly and then rightly.

   Keyed by source and held outside M, because the fact "this file is
   3840×1240" belongs to the file and not to a render. Second and later draws
   of the same picture now start with the number they ended with. */
const _wpRatios = Object.create(null);

function artLoaded(img){
  const g = WPG;
  if(!img.naturalWidth) return;
  const r = img.naturalWidth / img.naturalHeight;
  _wpRatios[img.currentSrc || img.src] = r;
  // An upload's proportions are the UPLOAD's, not the game's — writing them
  // onto the game would leave its own art mis-framed after a revert.
  const cur = M.up.art ? M.up.artRatio : g.artRatio;
  if(cur === r) return;
  if(M.up.art) M.up.artRatio = r; else g.artRatio = r;
  // Every travel limit is derived from this ratio, so the framing has to be
  // recomputed the moment it is known for real.
  const hero = img.closest('[data-edit="art"]');
  if(hero) applyArtPan(hero);
}
const artRatio = () => (M.up.art ? M.up.artRatio : WPG.artRatio)
  || _wpRatios[artURL()]
  // Only for a picture nobody has ever seen decode. 16/9 is a guess, and the
  // guess is corrected by artLoaded a frame later — which is fine ONCE.
  || 16/9;

function shotArt(i){
  const g = WPG;
  if(g.real) return `<img class="kart" src="${g.shots[i % g.shots.length]}" alt="Screenshot ${i+1}" draggable="false" loading="lazy">`;
  return svgArt('classic', artSeed + 30 + i*7);
}

/* ============================================================================
   SECTION PARTIALS
   `data-edit` marks anything selectable; `data-sect` anything hideable.
   ========================================================================== */
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Where the hero elements snap: the frame's centre and its thirds, on both
   axes. TOL is in the same units (% of the hero), so the pull feels the same
   whatever the viewport width. */
const SNAPS = [33.333, 50, 66.667];
const SNAP_TOL = 1.8;
const snapTo = v => { for(const p of SNAPS) if(Math.abs(v - p) < SNAP_TOL) return p; return v; };

/* ALIGNMENT BETWEEN THE TWO HERO ELEMENTS.
   Where the dragged element's centre has to sit for it to line up with the
   other one. Three relationships per axis — centre to centre, and the two
   matching edges — which is the set that actually gets used when placing a
   call to action under a logotype.

   Two details that matter:
   · Measured on each element's VISUAL child (the logotype image, the button
     itself), not on the .el wrapper, whose padding would put the guide a few
     pixels off the edge you can actually see.
   · Positions are stored as the element's CENTRE (translate(-50%,-50%)), so
     an edge alignment has to be converted: to match left edges, this centre
     must sit half its own width to the right of that edge. `cx` is where the
     centre goes, `line` is where the guide is drawn — they are only the same
     value for a centre-to-centre match. */
const ALIGN_TOL = 1.2;

function alignTargets(hero, selfEl, otherEl){
  const empty = { x:[], y:[] };
  if(!otherEl) return empty;
  const hb = hero.getBoundingClientRect();
  if(!hb.width || !hb.height) return empty;
  const ob = (otherEl.firstElementChild || otherEl).getBoundingClientRect();
  const sb = (selfEl.firstElementChild  || selfEl ).getBoundingClientRect();
  if(!ob.width || !sb.width) return empty;

  const px = v => (v / hb.width)  * 100;
  const py = v => (v / hb.height) * 100;
  const hw = sb.width/2, hh = sb.height/2;
  const oL = ob.left - hb.left, oR = ob.right  - hb.left, oC = oL + ob.width/2;
  const oT = ob.top  - hb.top,  oB = ob.bottom - hb.top,  oM = oT + ob.height/2;

  return {
    x: [ { cx:px(oC),      line:px(oC) },     // centres
         { cx:px(oL + hw), line:px(oL) },     // left edges
         { cx:px(oR - hw), line:px(oR) } ],   // right edges
    y: [ { cx:py(oM),      line:py(oM) },
         { cx:py(oT + hh), line:py(oT) },
         { cx:py(oB - hh), line:py(oB) } ],
  };
}

/* Element alignment wins over the frame grid when both are in range: lining up
   with the logo is a more specific intention than landing on a third. */
function resolveSnap(v, targets){
  for(const t of targets) if(Math.abs(v - t.cx) < ALIGN_TOL) return { v:t.cx, line:t.line };
  return { v:snapTo(v), line:null };
}

function storesHTML(){
  const SET = (typeof PROTO_PLATFORM_ICONS !== 'undefined') ? PROTO_PLATFORM_ICONS : {};
  return `<div class="stores">` + M.stores.map(id => {
    const s = STORE_ICONS[id]; if(!s) return '';
    const mark = (s.svg && SET[s.svg]) ? `<span class="pi">${SET[s.svg]}</span>`
               : (s.img ? `<img src="${s.img}" alt="${s.label}">` : '');
    return `<a href="#" title="${s.label}" onclick="return false">${mark}</a>`;
  }).join('') + `</div>`;
}

/* The logotype: a box exactly the size of the INK, with the WHOLE file drawn
   inside it and allowed to spill. The box is what the size slider scales, what
   layoutHero measures and what the alignment guides snap to; the spill is the
   file's own soft edges and baked shadow, which must not be cut.
   overflow stays visible — clipping here is precisely the bug this replaced. */
/* THE LOGOTYPE IN PLAY — the developer's upload if there is one, the game's
   own otherwise, and null when there is neither. Everything that draws or
   measures a logotype goes through this, so an uploaded file behaves exactly
   like a delivered one: same ink measurement, same size slider, same shadow,
   same header. */
function MARK(){
  const g = WPG;
  if(M.up.logo) return { src:M.up.logo, ink:_inkCache[M.up.logo], name:g.name };
  return g.logo ? { src:g.logo, ink:g.ink, name:g.name } : null;
}
const hasLogo = () => !!MARK();

function inkGeom(g, s){
  const ink = g.ink || FULL_INK;
  const ratio = (ink.natW && ink.natH) ? ink.natH/ink.natW : 0.5625;
  const boxW  = s * 430;                    // the slider sizes the INK, not the file
  const fullW = boxW / (ink.w || 1);
  const fullH = fullW * ratio;
  return { boxW, boxH: fullH * (ink.h || 1), fullW,
           left: -ink.x0 * fullW, top: -ink.y0 * fullH };
}

/* The scale that makes the INK exactly `targetH` px tall — the header is
   specified by height, the way a site header always is, while the big logotype
   is specified as a percentage of a nominal width. Both go through inkGeom so
   they cannot disagree about what they are measuring. */
function inkScaleForHeight(g, targetH){
  const ink = g.ink || FULL_INK;
  const ratio = (ink.natW && ink.natH) ? ink.natH/ink.natW : 0.5625;
  const k = 430 * ratio * (ink.h || 1) / (ink.w || 1);   // box height at s = 1
  return k ? targetH / k : 0.1;
}

function inkBoxHTML(g, s){
  const k = inkGeom(g, s);
  return `<span class="logo-ink" style="width:${k.boxW.toFixed(1)}px;height:${k.boxH.toFixed(1)}px">
            <img src="${g.src || g.logo}" alt="${esc(g.name)}" draggable="false"
                 style="width:${k.fullW.toFixed(1)}px;left:${k.left.toFixed(1)}px;top:${k.top.toFixed(1)}px">
          </span>`;
}

function logoElHTML(){
  const m = MARK();
  if(!M.logo.show || !m) return '';
  const s = M.logo.size/100;
  const mark = inkBoxHTML(m, s);
  return `<div class="el logo-el" data-edit="logo" data-align="${M.logo.align}" data-tint="${M.logo.tint}"
               style="left:${M.logo.x}%;--sh:${(M.logo.shadow/100).toFixed(2)}">
            ${mark}
          </div>`;
}

/* The page header: the logotype small, in the corner, over the art. Reuses the
   same ink geometry as the big one, so both are measured from the letters. */
/* WHAT THE CORNER ACTUALLY DRAWS, and the three answers are genuinely
   different rather than three routes to one.

   'image' is its own file, measured for its own ink — a square emblem cropped
   for a favicon is a perfectly good corner mark and a terrible hero logotype,
   which is exactly why the two had to stop sharing.
   'text' is words: the studio's name, the game's name, whatever fits a corner.
   'auto' is the old behaviour and still the default — borrow the hero's
   logotype if there is one, fall back to the game's name — so a page nobody
   has touched looks exactly as it did. */
function headerMarkHTML(){
  const h = M.header;
  if(h.src === 'text')
    return `<span class="hh-word">${esc(h.text || WPG.title)}</span>`;
  if(h.src === 'image' && h.img){
    // No ink measurement: its ink is not cached and a corner mark this small
    // is judged by height, which is the one number we have. Width follows.
    return `<img class="hh-img" src="${h.img}" alt="${esc(WPG.title)}"
                 draggable="false" style="height:${h.size}px">`;
  }
  const m = MARK();
  return m
    ? inkBoxHTML(m, inkScaleForHeight(m, h.size))
    : `<span class="hh-word">${esc(h.text || WPG.title)}</span>`;
}
function headerHTML(){
  if(!M.header.show) return '';
  // Inside the stage, so it sits on the content column's left edge.
  return `<div class="hero-head" data-edit="header">${headerMarkHTML()}</div>`;
}

/* THE SOCIAL ROW, IN THE OPPOSITE CORNER.

   The same line as the corner logotype and at the other end of it, because
   that is the shape every game site already has: the mark on the left, the
   ways to reach the studio on the right. Both live inside .hero-stage, so
   both sit on the content column's edges rather than the artwork's — the row
   lines up with the metadata band below it, not with the bleed.

   THE LINKS ARE NOT NEW DATA. They are the same channels the footer already
   draws, from webSite.links plus the contact email, deduced by domain. A
   second list to keep in step with the first is how a page ends up saying two
   different things about where to find someone.

   Capped at five. This is a corner, not a section: a studio with nine links
   would run the row into the middle of the key art, and the footer is where
   the complete list belongs. */
const WP_HEADER_LINKS_MAX = 5;
function headerLinksHTML(){
  if(!M.header.links) return '';
  const on = M.contact.filter(r => r[2]).slice(0, WP_HEADER_LINKS_MAX);
  if(!on.length) return '';
  return `<div class="hero-links" data-edit="links">
    ${on.map(([key, handle]) => `
      <a class="hl" href="${esc(contactHref(key, handle))}" data-cc="${key}"
         aria-label="${esc((CONTACT_ICONS[key] || {}).label || key)}" title="${esc(handle)}">
        ${(CONTACT_ICONS[key] || CONTACT_ICONS.web).svg}
      </a>`).join('')}
  </div>`;
}

/* The game's name, set in type. Double-click to edit, like everything else
   here that carries words. */
/* THE TITLE IS NOT TYPED HERE. It is the game's name, and the game's name
   comes from the submission — the same value that goes on every store page.
   Letting it be retyped on the website would create a second name that can
   quietly disagree with the first one, which is the kind of bug nobody finds
   until a store rejects a build. */
function titleElHTML(){
  if(!M.title.show || !M.title.text) return '';
  return `<div class="el title-el fixed" data-edit="title" data-align="${M.title.align}"
               ${M.title.fit != null ? 'data-nowrap="1"' : ''}
               style="${M.title.maxw ? `max-width:${M.title.maxw}px;` : ''}${M.title.fit != null ? `--tfit:${M.title.fit.toFixed(4)};` : ''}left:${M.title.x}%;--tz:${(M.title.size/100).toFixed(2)};--tfg:${M.title.fg};--ts:${(M.title.shadow/100).toFixed(2)};--tw:${M.title.weight};--tls:${TITLE_TRACK[M.title.weight]}">
            <span class="title-w">${esc(M.title.text)}</span>
          </div>`;
}

/* The tagline. Double-click to edit, like the button's label — a single click
   has to stay free for selecting and dragging. */
function hookElHTML(){
  if(!M.hook.show || !M.hook.text) return '';
  return `<div class="el hook-el" data-edit="hook" data-align="${M.hook.align}"
               style="left:${M.hook.x}%;--hz:${(M.hook.size/100).toFixed(2)};--hfg:${M.hook.fg};--hs:${(M.hook.shadow/100).toFixed(2)}">
            <span class="hook" data-hooktext="1">${esc(M.hook.text)}</span>
          </div>`;
}

function buyElHTML(){
  if(M.buy.mode === 'none') return '';
  // The availability marks, promoted out of the metadata band and into the
  // hero, as the call to action instead of a button. Same links, same data —
  // see the note in toolbarHTML.
  if(M.buy.mode === 'stores')
    return `<div class="el buy-el stores-el fixed" data-edit="buy" data-align="${M.buy.align}"
                 style="left:${M.buy.x}%;--bz:${(M.buy.size/100).toFixed(2)};--bfg:${M.buy.fg};--bs:${(M.buy.shadow/100).toFixed(2)}">
              ${storesHTML()}
            </div>`;
  return `<div class="el buy-el fixed" data-edit="buy" data-align="${M.buy.align}"
               style="left:${M.buy.x}%;--bz:${(M.buy.size/100).toFixed(2)};--bs:${(M.buy.shadow/100).toFixed(2)};--bfg:${M.buy.fg}">
            <span class="buy" data-buytext="1">${esc(M.buy.label)}</span>
          </div>`;
}

/* The band is `data-edit="strip"`, each field `data-edit="strip:<i>"`. Clicking
   a field selects the field; clicking the band around them selects the band,
   which is where you choose WHICH fields are here — the same rule as the hero.
   Hidden fields keep their index, so a field that comes back comes back in the
   position it had, and the footer's reference to it never breaks. */
/* THE BAND IS SELECTABLE; ITS FIELDS ARE NOT.

   Each field used to be its own editable thing, which bought one panel per
   tile — "FIELD · CONTACT · click the value to edit · ← →" — hanging over the
   page to say almost nothing. These values are imported: the developer's real
   question here is which of them belong on the page, not how to retype the
   release date. So the band keeps its toggles and the tiles go quiet.

   Editing the values is a decision deferred, not one refused — there is always
   time to add it, and no time is ever saved by shipping it early. */
function stripHTML(){
  if(!M.show.strip) return '';
  return `<section class="strip" data-sect="strip" data-edit="strip">
    ${wpGripHTML('strip')}
    <div class="strip-in">` + M.strip.map(([k,v,on],i) => !on ? '' :
      /* A row with nothing in it yet shows an em dash rather than an empty
         cell. The band is seen for the first time DURING the submission, so
         all six rows are drawn from the start and the layout settles once —
         a row that materialises when you type into a form you cannot see is
         a page that changes shape under you. The placeholder is muted so a
         filled-in row still reads as the one carrying information. */
      `<dl class="sf">
         <dt>${esc(k)}</dt>
         ${/* `title` carries the whole value, because the two-line clamp above
              can cut one. Only on real text: a title on an em dash would
              announce "—" to a screen reader as though it meant something. */''}
         <dd${v && v !== 'stores' ? ` title="${esc(v)}"` : ''}>${
                v === 'stores' ? storesHTML()
                : v ? esc(v)
                : '<span class="sf-empty">—</span>'}</dd>
       </dl>`
    ).join('') + `</div></section>`;
}

function videoHTML(){
  const g = WPG;
  // An imported title may genuinely have no trailer — plenty of store pages
  // don't — and that is the empty drop slot, not a crash. Every hand-written
  // fixture has one, which is why this went unnoticed until the first real
  // import arrived without one.
  if(!g.trailer) return videoSlotHTML();
  /* A trailer with no poster borrows the key art. With no key art either it
     must NOT borrow the header's empty state — that block is an instruction
     about the header, and repeating it inside the trailer would ask for the
     same file twice in two places, one of which is not the header. The
     generated scene is the right neutral ground here: it is a backdrop behind
     a play button, not a thing anyone is being asked to replace. */
  const poster = g.trailer.poster ? `<img class="vbg" src="${g.trailer.poster}" alt="">`
    : (wpHasArt() ? heroArt('vbg')
      : `<img class="vbg" alt="" draggable="false" src="data:image/svg+xml;charset=utf-8,${
           encodeURIComponent(svgArt('classic', artSeed))}">`);
  return `<div class="video" onclick="this.classList.toggle('playing')">
      ${poster}
      <div class="play"><i><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></i></div>
      <div class="vlabel">${esc(g.trailer.label)}</div>
    </div>`;
}
function videoSlotHTML(){
  return `<div class="slot">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M10 9.5l5 2.5-5 2.5z"/></svg>
    Drop a trailer, or paste a YouTube / Vimeo link
  </div>`;
}
function shotsHTML(n){ let o=''; for(let i=0;i<n;i++) o += `<div>${shotArt(i)}</div>`; return o; }
/* THE CONTACT ROW.
   One element for the toolbar to own (data-edit="contact"), but each handle is
   its own editable text — double-click and type, the same gesture as the
   description and the tagline. Rendered as <a> so it reads as a link on the
   page, with the href built from the handle: an address becomes mailto:, a
   subreddit becomes a reddit.com URL, and anything that already looks like a
   URL is left alone. In the editor the click is swallowed — following a link
   out of a page you are composing is never what you meant. */
function contactHref(key, handle){
  const h = handle.trim();
  if(!h) return '#';
  if(/^https?:\/\//i.test(h)) return h;
  if(key === 'email')    return 'mailto:' + h.replace(/^mailto:/i,'');
  if(key === 'reddit')   return 'https://reddit.com/' + h.replace(/^\/+/,'');
  if(key === 'x')        return 'https://x.com/' + h.replace(/^@/,'');
  if(key === 'instagram')return 'https://instagram.com/' + h.replace(/^@/,'');
  if(key === 'bluesky')  return 'https://bsky.app/profile/' + h.replace(/^@/,'');
  if(key === 'mastodon'){ const [,u,s] = h.match(/^@?([^@]+)@(.+)$/) || []; return u ? `https://${s}/@${u}` : 'https://' + h; }
  return 'https://' + h.replace(/^\/+/,'');
}
/* MARKS, NOT ROWS. Each channel is a rounded square with its logo in it and
   nothing else — the shape everyone already reads as "the studio's socials".
   The handle lives in the link and in the tooltip, which is where a handle is
   useful; spelling it out next to every icon turned a footer into a list. */
function contactHTML(){
  const on = M.contact.filter(r => r[2]);
  if(!on.length) return `<p class="contact-empty">No channels — add one from the toolbar</p>`;
  return `<div class="contact-row" data-edit="contact">
    ${on.map(([key, handle]) => `
      <a class="cc" href="${esc(contactHref(key, handle))}" data-cc="${key}"
         aria-label="${esc(CONTACT_ICONS[key].label)}" title="${esc(handle)}">
        ${CONTACT_ICONS[key].svg}
      </a>`).join('')}
  </div>`;
}

/* THE FOOTER — who made it, when it came out, and where to find them.

   The studio and the date are NOT their own fields: they are the same two rows
   of the metadata band, rendered a second time. One value, two places to edit
   it, and no way for the top of the page to disagree with the bottom about
   when the game shipped. It also means the footer stays editable when the
   metadata band is hidden. */
const stripIndex = label => M.strip.findIndex(r => r[0] === label);
function footStat(label, prefix){
  const i = stripIndex(label);
  if(i < 0) return '';
  /* Read from the band, so the footer and the band can never disagree — but
     NOT its dash. The band draws a placeholder because it is a grid with a
     shape to hold; the footer is a line of prose, and "Developed by —" reads
     as a mistake where an empty cell reads as a blank waiting to be filled.
     Same data, two honest treatments of the same emptiness. */
  const v = M.strip[i][1];
  if(!v) return '';
  return `<span class="foot-s">${prefix}${esc(v)}</span>`;
}
/* TODAY, not the release date.

   The footer used to repeat the band's release date, which was a mistake of
   the obvious kind: the same fact twice on one page, and in the place a
   reader looks for a different one. A release date says when the game arrives
   and belongs in the metadata band with the rest of the facts about the game.
   The date in a footer is about the PAGE — when what you are reading was last
   true — which is the one thing a marketing page that updates itself from a
   live submission can honestly claim. */
function todayLine(){
  return new Date().toLocaleDateString('en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' });
}

function footerHTML(){
  return `<div class="foot">
      <div class="foot-who">
        ${footStat('Developed by','')}
        <span class="foot-s">${esc(todayLine())}</span>
      </div>
      ${contactHTML()}
    </div>`;
}

/* ============================================================================
   THE PAGE
   One function. The skins differ ONLY in the wrapper markup each needs (a
   topbar here, a marquee there) and in the CSS — the seven sections and their
   order are identical everywhere: pick a look, keep the structure.
   ========================================================================== */
function pageHTML(){
  const g = WPG;

  const hero = `
    <section class="hero" data-edit="art"
             ${/* The header's height is --hero-h, always. The old fit:'whole'
                    let the picture dictate it, which meant changing the key art
                    changed the shape of the page. */''}
             style="--az:${(M.art.zoom/100).toFixed(3)}">
      ${heroArt()}
      <div class="hero-stage">
        ${headerHTML()}
        ${headerLinksHTML()}
        <div class="guides">
          ${SNAPS.map(p => `<span class="gv ${p===50?'mid':''}" data-p="${p}" style="left:${p}%"></span>`).join('')}
          ${SNAPS.map(p => `<span class="gh ${p===50?'mid':''}" data-p="${p}" style="top:${p}%"></span>`).join('')}
        </div>
        <div class="aguides"><span class="av"></span><span class="ah"></span></div>
        ${titleElHTML()}
        ${logoElHTML()}
        ${hookElHTML()}
        ${buyElHTML()}
      </div>
    </section>`;

  // Boutique puts the vertical capsule beside the mini description; the other
  // two skins have nowhere sensible for a portrait asset, so they skip it.
  // No "Summarised by Shipmate" badge: the page belongs to the developer, and
  // a tool signing its own output on someone's store page is the tool talking
  // to itself. The ✦ button in the toolbar is where that feature lives.
  /* THE HOOK, OR THE SPACE WHERE IT GOES.

     Normally there is nothing to do here: the Hook is Steam's own
     short_description, arriving with everything else the moment a store page
     is linked, and it is the best line the page could have because the
     developer already wrote it to sell the game.

     But a submission with no linked store page has none, and an empty lead is
     the worst hole on the page — it sits between the key art and the trailer,
     it is the widest type outside the hero, and blank it reads as the page
     having failed rather than as a field waiting. So it says what it is for,
     in two lines, which is also roughly how long a real hook runs: the block
     keeps the height it will have once it is filled, and the layout below
     does not jump when it is.

     Muted and italic so it can never be mistaken for the developer's own
     words, and it names the gesture, because the click that fixes it is not
     otherwise discoverable — the whole zone routes to the Description panel. */
  const HOOK_PLACEHOLDER =
    'This is where you tell people what your game is, in a line or two.<br>' +
    'Click to write it — or link your Steam page and we will bring it across.';
  const miniP = M.mini
    ? `<p contenteditable="plaintext-only" data-field="mini">${esc(M.mini)}</p>`
    : `<p class="mini-empty">${HOOK_PLACEHOLDER}</p>`;
  const lead = M.show.lead === false ? '' : `
    <section class="band lead" data-sect="lead">${wpGripHTML('lead')}<div class="band-in" data-edit="mini">
      ${miniP}
    </div></section>`;

  /* HIDDEN MEANS HIDDEN. This used to fall through to the empty drop slot,
     which made "hide the trailer" put a dashed "drop a trailer here" box on
     the page instead of removing anything. The slot belongs to the case where
     the section is SHOWN and there is no trailer yet — and videoHTML already
     returns it for exactly that. */
  const video = M.show.video ? `
    <section class="band" data-sect="video">${wpGripHTML('video')}
      <div class="band-in">${videoHTML()}</div>
    </section>` : '';

  /* THE REST OF THE DESCRIPTION, under the trailer.
     The hook above the fold has one job — make you want to know more — and
     until now the page had no answer for somebody it worked on. This is that
     answer, and it sits below the trailer on purpose: whoever has watched a
     trailer is exactly the reader who wants the long version. */
  const about = M.show.about ? `
    <section class="band" data-sect="about">${wpGripHTML('about')}
      <div class="band-in" data-edit="about"><h2 class="h2">About this game</h2>
      ${/* One editable block per part, and NO per-part heading yet: today the
            three fields read as one continuous piece of writing under the
            single "About this game" title. The label rides along in the data
            waiting for the day each part becomes its own scroll section — at
            which point this is the only line that changes. */''}
      ${M.about.map((p,i) => `<div class="about" contenteditable="plaintext-only"
           data-field="about" data-part="${i}">${esc(p.text)}</div>`).join('')}</div>
    </section>` : '';

  const shots = M.show.shots ? `
    <section class="band" data-sect="shots">${wpGripHTML('shots')}
      <div class="band-in"><h2 class="h2">Screenshots</h2>
      <div class="shots">${shotsHTML('classic' === 'arcade' ? 4 : 5)}</div></div>
    </section>` : '';

  /* PRESS AND FACTSHEET ARE GONE, and it is worth saying why rather than
     leaving a gap in the numbering.

     Press was pull-quotes. No field in the submission holds them, and there
     is no honest way to invent one — made-up praise for a real game is the
     single worst thing this page could print. A band that can only ever show
     placeholders is not a feature waiting for data, it is a liability.

     Factsheet was the full presskit table, and it lost to the metadata band
     directly above it: same fields, same source, one of them redundant. The
     band won because it is above the fold and reads in a glance.

     Both were already off by default. Deleting them removes two toggles from
     a page whose editing model is meant to be obvious. */

  // Last, because it is the footer: the page says what the game is, shows it,
  // and then says who made it and where to find them. No heading — a footer
  // that has to announce itself is not reading as one.
  const footer = M.show.footer ? `
    <footer class="band contact" data-sect="footer">
      <div class="band-in">${footerHTML()}</div>
    </footer>` : '';

  /* There used to be a per-skin wrapper here — a top bar for Boutique, a
     scrolling marquee for Arcade — picked out of a map by skin name. The map
     is gone with the skins, and it is worth saying why rather than just
     deleting it: an object literal EVALUATES every value before indexing it,
     so Arcade's marquee read M.strip[2][1] on every render of every skin. On
     a brand-new submission the band has no rows at all, and a page nobody had
     chosen Arcade for died on a string it was never going to show.

     One skin, no wrapper, and the whole class of bug goes with it. */
  /* THE MIDDLE, IN WHATEVER ORDER IT IS IN. A map of key to markup, joined by
     M.order — so the page's arrangement is data rather than the order these
     constants happen to be declared in.
     This is also what makes dragging cheap later: the sections are already
     whole, already named, and already reordered by a single array. A drag
     would write that array; nothing else here would change. */
  const parts = { strip: stripHTML(), lead, video, about, shots };
  return hero + M.order.map(k => parts[k] || '').join('') + footer;
}

/* THE HANDLE THAT MOVES A SECTION.

   Not a selection, deliberately. Clicking INSIDE a section already means
   something — it opens the panel that edits that section's words — and
   overloading the same click with "select this band" would make the two
   fight. So the handle is its own small target that appears on hover, in the
   corner, out of the reading column.

   It is also the drag handle this will grow: a grip that already knows which
   section it belongs to is the whole prerequisite for dragging one. Up and
   down first because they cost a fraction of the work and answer the actual
   question — "can I put the hook above the metadata" — and because a list of
   five things is faster to reorder with two buttons than with a gesture. */
function wpGripHTML(key) {
  const i = M.order.indexOf(key);
  const vis = M.order.filter(k => M.show[k] !== false);
  const at  = vis.indexOf(key);
  return `<div class="wp-grip" data-grip="${key}">
    <span class="wp-grip-name">${esc(SECTION_NAMES[key] || key)}</span>
    ${/* Disabled rather than absent at the ends: a control that disappears
         moves the two beside it, so the button under your pointer changes
         identity the moment you reach the top of the list. */''}
    <button data-wp="secup" data-k="${key}" title="Move up" aria-label="Move up"
            ${at <= 0 ? 'disabled' : ''}>${WP_ARROW_UP}</button>
    <button data-wp="secdown" data-k="${key}" title="Move down" aria-label="Move down"
            ${at < 0 || at >= vis.length - 1 ? 'disabled' : ''}>${WP_ARROW_DOWN}</button>
    <button data-wp="sechide" data-k="${key}" title="Hide section" aria-label="Hide section">${WP_EYE_OFF}</button>
  </div>`;
}
const WP_ICO = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const WP_ARROW_UP   = `<svg ${WP_ICO}><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
const WP_ARROW_DOWN = `<svg ${WP_ICO}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;
const WP_EYE_OFF    = `<svg ${WP_ICO}><path d="M9.9 4.24A9.1 9.1 0 0112 4c7 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19M6.61 6.61A18.5 18.5 0 002 12s3 8 10 8a9.1 9.1 0 005.39-1.61"/><path d="M14.12 14.12a3 3 0 11-4.24-4.24"/><path d="M2 2l20 20"/></svg>`;

/* WHERE A HIDDEN SECTION GOES, AND HOW IT COMES BACK.

   Hiding was already possible and restoring was not: the chips that brought a
   section back lived in the development band, which went at port time, so the
   feature had an entrance and no exit. Anything a developer switched off was
   off for good.

   At the very bottom, and only when something is actually hidden — a
   permanent row of controls under a page that is meant to look like a page
   would be the tool talking over the thing it is previewing. */
/* EVERY SECTION, ON OR OFF, IN ONE ROW ABOVE THE PAGE.

   This replaces a bar at the very bottom that only appeared once something
   was hidden, and the problem with it was not where it sat — it was that it
   could only ever answer half the question. It listed what was OFF. To find
   out what was ON you had to scroll the whole page and count, and to switch
   something off you had to find it first.

   One row of every section, lit or unlit, answers both at a glance and makes
   the two actions the same gesture. Above the frame rather than inside it,
   because it is a control panel for the page and not part of it — the same
   reason the device widths moved out of the browser chrome to sit beside it.

   The footer rides along at the end: it cannot be REORDERED (a footer in the
   middle is not a footer) but it can certainly be switched off, and leaving
   it out of the only list of sections would make it look like it could not.
   The hero has no pill because a page with no header is not a page. */
function wpSectionPillsHTML() {
  const keys = M.order.concat('footer');
  return `<div class="wp-pills" data-wp-pills>
    ${keys.map(k => {
      const on = M.show[k] !== false;
      return `<button class="wp-pill${on ? ' on' : ''}"
              data-wp="${on ? 'sechide' : 'secshow'}" data-k="${k}"
              title="${on ? 'Hide' : 'Show'} ${esc(SECTION_NAMES[k] || k)}"
              aria-pressed="${on}">${esc(SECTION_NAMES[k] || k)}</button>`;
    }).join('')}
  </div>`;
}

/* ============================================================================
   HERO LAYOUTS
   Starting points, not modes: each one just places the elements and decides
   which of them are on, and from that instant everything is draggable again
   exactly as before. They exist because "logo left, buy right" and "logo and
   tagline stacked" are two genuinely different pages, and getting either by
   hand means fiddling with three positions.

   Every position is MEASURED, never a hardcoded coordinate — a logotype's
   width depends on the file, the size slider and the skin, so a preset that
   hardcoded percentages would only look right for Spilled at 100%.

   And it aligns the INK, not the boxes. The elements carry padding for their
   selection outline; aligning their boxes to the column would leave the
   letters sitting a few pixels inside it, out of line with the metadata band
   below — which is the whole thing this layout is trying to achieve. */
const HERO_LAYOUTS = {
  /* The one that does not depend on the delivered artwork at all: the game's
     name set in type on the left, the pill on the right, the two centred on
     each other — and the logotype left exactly where it is, free to float
     anywhere over the picture. It is the layout to reach for when a logotype
     is an awkward shape, or reads badly at hero size, or simply is not there.

     Centred on each other rather than sharing a baseline, unlike Split: a line
     of type and a pill have unrelated heights, and sitting them on a common
     baseline leaves the pill looking dropped. */
  textsplit: {
    label:'Text split',
    hint:'Title left, buy button right, sharing a centre — logotype floats free',
    set(){ M.title.show = true; M.logo.show = false; M.hook.show = false;
           if(M.buy.mode === 'none') M.buy.mode = 'button'; },

    /* ONE LINE, ALWAYS — the title is scaled to fit rather than wrapped.

       Wrapping was the wrong answer and "Chants of Sennaar" is why. Seventeen
       characters at 64px want about 600px; the stage is 800 and the pill takes
       200 of it, so the title broke in two — and a two-line hero title beside
       one small pill reads as a mistake however carefully the pill is aligned
       to it. Worse, whether it broke at all depended on the width, the skin
       and whether the webfont had loaded, so the same page had two different
       shapes depending on when you looked at it.

       Scaling removes the question. The title is measured at full size with no
       wrapping allowed, and the type is scaled by exactly the ratio that makes
       it fit the room the button leaves. One line, every game, every width, and
       the vertical alignment stays the trivial case it should always have been.

       The floor is there so a very long name cannot shrink to nothing: below
       it, the pair stops sharing a line and stacks instead. */
    place(sb){
      const b0 = edges('buy');
      const GAP = 28, FLOOR = 0.55;
      const tn = site.querySelector('.el[data-edit="title"]');
      /* THE TITLE CAN BE TURNED OFF — a page whose key art already carries a
         logotype does not need the name a second time in type. This used to
         return here, which left the button wherever the opening stack had
         dropped it, usually floating in the middle of the picture. With no
         title there is no line to centre on, so the button simply takes the
         line the title would have sat on, at the same right margin. */
      if(!tn){
        const bb = edges('buy');
        if(bb){
          alignR(bb, sb.width, sb);
          bottomTo(bb, sb.height * (1 - HERO_BOTTOM), sb);
        }
        return;
      }
      const tw = tn.firstElementChild || tn;

      /* Measure the natural width: no cap, no wrapping, full size. Setting
         these before reading is what makes the read meaningful — the browser
         reflows synchronously for getBoundingClientRect. */
      tn.dataset.nowrap = '1';
      tn.style.maxWidth = '';
      tn.style.setProperty('--tfit', '1');
      const natural = tw.getBoundingClientRect().width;

      const fits = room => (natural > 0 ? Math.min(1, room / natural) : 1);
      let stack = false, k = fits(b0 ? sb.width - b0.vis.width - GAP : sb.width);
      if(k < FLOOR && b0){          // too much shrinking to sit beside the pill
        stack = true;
        k = fits(sb.width);
      }
      k = Math.max(FLOOR, k);
      M.title.fit  = k;
      M.title.maxw = null;          // nothing to cap: it cannot wrap any more
      tn.style.setProperty('--tfit', k.toFixed(4));

      const t = edges('title'), b = edges('buy');
      if(!t) return;
      const base = sb.height * (1 - HERO_BOTTOM);        // where the line ends

      if(stack && b){
        const UNDER = 20;
        // Stacked, and both from the bottom for the same reason as above.
        alignL(b, 0, sb); bottomTo(b, base, sb);
        alignL(t, 0, sb); bottomTo(t, base - b.vis.height - UNDER, sb);
        return;
      }

      alignL(t, 0, sb);
      /* Pinned by the BOTTOM of the span. Nothing should be able to make this
         title taller now, but anchoring by a measured height is what let a
         late webfont push it out of the header once, and there is no reason to
         re-earn that lesson. */
      M.title.bottom = ((sb.height - base) / sb.height) * 100;
      M.title.top = null;
      if(b){
        /* The button's rectangle is centred on the INK of the line.

           `base` is where the title's span bottom lands, which is exactly the
           reference lastLineInkCentre wants. The button's own centre is just
           its box centre: a pill is a rectangle and its middle is its middle.
           Only the type is asymmetric, so only the type is measured. */
        const lh = lineHeightOf(t.node) || t.vis.height;
        const centre = lastLineInkCentre(t.node, base) ?? (base - lh/2);
        alignR(b, sb.width, sb);
        /* BOTTOM-ANCHORED, like the title beside it.

           The title is pinned by its bottom so a wrap grows upward. Pinning
           the button by its TOP looks equivalent and is not: the two
           percentages are measured from opposite edges, so any change in the
           stage's height after the measuring pass slides them apart. That was
           harmless while the hero was a fixed 625px; it is not now that the
           height is a clamp on the viewport plus a container-query cut, which
           resolves after layout.

           This was briefly reverted while hunting a bug that put the button
           under the browser chrome. That bug was a CSS specificity tie taking
           `position:absolute` away from both pieces — nothing to do with the
           anchor — so the revert cost the alignment and bought nothing. */
        bottomTo(b, centre + b.vis.height/2, sb);
      }
    },
  },
};

/* ── ALIGNMENT ────────────────────────────────────────────────────────────
   Which edge an element is pinned to, and therefore which way it grows.
   `x` means a different thing per alignment — left edge, centre, right edge —
   which is what lets a flush-left tagline stay flush when it is resized. */
const ANCHOR = { left:0, center:.5, right:1 };

/* The weights on offer, and the tracking each one wants. Tighter as it gets
   heavier: a bold face at a display size needs the letters pulled in, and a
   medium one falls apart if you tighten it the same amount. */
/* ONE WEIGHT. Medium — 500 — and it is not a choice.

   Three weights meant three chances to pick the wrong one, on the largest
   piece of type on the page, with no way to tell which was right except by
   looking at it next to the other two. Bold at hero size on artwork reads as
   shouting; Medium holds the line and lets the picture carry the drama. */
const TITLE_WEIGHT = 500;
const TITLE_TRACK   = { 500:'-.005em', 600:'-.015em', 800:'-.025em' };

/* How far the low layouts sit off the bottom of the hero, as a fraction of
   its height. One number for all three, rather than the per-layout ratios it
   replaces — they were drifting apart and none of them said what they meant.
   8% of a 625px hero is about 50px: close enough that the title and the
   metadata band read as one block, far enough that they are not touching.
   It used to be roughly double that, which left the row floating in the
   middle of the art with the band stranded below it. */
const HERO_BOTTOM = 0.08;

/* There is no alignment control any more.

   `align` survives as a piece of GEOMETRY — which edge an element is measured
   from, so Text split can pin the title to the left margin and the button to
   the right one — but it is set by the layouts, never by a person. Choosing
   between L, C and R is asking the developer to solve a problem the layout
   already solved, and the text itself now reads left in every case, which is
   what a title and a tagline want.

   Kept as a function that returns nothing rather than deleted at every call
   site: one place to look when the decision is revisited. */
const alignSeg = () => '';

/* Changing the alignment must not MOVE anything: the element keeps the exact
   position it had, and only the edge it is measured from changes. Otherwise
   picking an alignment would jump it across the hero. */
function setAlign(key, v){
  const st = M[key], node = site.querySelector(`.el[data-edit="${key}"]`);
  const stage = site.querySelector('.hero-stage');
  if(!st || !node || !stage) return;
  const sb = stage.getBoundingClientRect(), box = node.getBoundingClientRect();
  if(!sb.width) return;
  const leftPct = ((box.left - sb.left) / sb.width) * 100;
  const wPct    = (box.width / sb.width) * 100;
  st.align = v;
  st.x = leftPct + ANCHOR[v] * wPct;
  webPageRedraw();
}

/* An element plus the box of the thing you can actually SEE inside it, and the
   padding between the two — everything the aligners need. */
/* The height of ONE line of the title, so the button can be centred on the
   last one rather than on the whole block. Read from the computed style, not
   guessed from the font size: line-height here is a unitless .95 and the two
   are not the same number. */
/* WHERE THE LETTERS ACTUALLY SIT — the centre of the INK of the last line,
   not the centre of its line box.

   These are not the same thing and that is the whole bug. A line box is
   line-height tall (.95em here) and the glyphs are centred inside the FONT's
   em box, which is not centred inside the line box: a font reserves room below
   the baseline for descenders whether or not the word has any. "Spilled!" has
   no descender, so its ink sits high in its line and a button centred on the
   line box lands visibly low. Change the skin — Inter, then Instrument Serif,
   then Silkscreen — or change the size, and the error changes with it, which
   is exactly what "falla entre formatos y tamaños" looks like.

   So the ink is measured for real: canvas TextMetrics gives the ascent and
   descent of THIS string in THIS font, and the font's own em metrics give the
   half-leading that positions it inside the line. No table of magic numbers,
   nothing to keep in sync with the CSS.

   Returns null where canvas is unavailable, and the caller falls back to the
   line-box centre — which is what this used to do everywhere. */
function lastLineInkCentre(el, lineBottom){
  const wnode = el.querySelector('.title-w') || el;
  const cs = getComputedStyle(wnode);
  const lh = lineHeightOf(el);
  if(!lh) return null;
  try{
    /* Asked for once per page, not once per placement: this runs on every
       redraw, and an environment without canvas throws every single time. */
    if(lastLineInkCentre._ctx === undefined){
      try{ lastLineInkCentre._ctx = document.createElement('canvas').getContext('2d') || null; }
      catch(e){ lastLineInkCentre._ctx = null; }
    }
    const ctx = lastLineInkCentre._ctx;
    if(!ctx) return null;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    /* 'H', NOT the title. This is the correction that matters most and it is
       the one I got wrong twice.

       Measuring the ink of the actual string makes the answer depend on which
       letters the name happens to contain: "Spilled!" has a descender in its
       p, "Chants of Sennaar" has none at all, so the two get different centres
       and the button visibly sits at a different height on each game. Nobody
       aligning a button to a title by hand would do that — they align to the
       CAP BAND, from the cap top to the baseline, which is the optical line of
       the type and is a property of the face and the size, not of the word.

       measureText('H').actualBoundingBoxAscent is exactly that cap height. */
    const m = ctx.measureText('H');
    const fbAsc = m.fontBoundingBoxAscent, fbDesc = m.fontBoundingBoxDescent;
    const cap = m.actualBoundingBoxAscent;
    if(![fbAsc,fbDesc,cap].every(Number.isFinite) || cap <= 0) return null;
    /* WHAT `lineBottom` IS, because getting this wrong is the whole history of
       this function: it is the bottom of the LINE BOX — the element's own box —
       because the title is positioned with `bottom`, which lays out the
       element, not the text inside it.

       Two boxes are in play and they are not the same. The line box is
       line-height tall (0.95em here). The font's content box is ascent +
       descent (1.21em), and it is CENTRED on the line box, so with a
       line-height under 1 it hangs out of both ends by half the difference.
       Half-leading is that overhang, and it is negative here.

       Both of my earlier versions had correct arithmetic against the wrong
       box: one subtracted the leading while being handed a span bottom, the
       other omitted it while being handed a line-box bottom. Each was out by
       the same 8px at 64px, in opposite directions. */
    const halfLead = (lh - (fbAsc + fbDesc)) / 2;
    const baseline = lineBottom - halfLead - fbDesc;
    return baseline - cap / 2;              // the middle of the cap band
  }catch(e){ return null; }
}

function lineHeightOf(el){
  const w = el.querySelector('.title-w') || el;
  const cs = getComputedStyle(w);
  let lh = parseFloat(cs.lineHeight);
  /* A browser resolves line-height to pixels; anything under 4 came back as
     the unitless factor it was written as (.95 here) or as 'normal', so it is
     multiplied out against the font size instead. Returning 0 when even that
     is unavailable lets the caller fall back to the element's own height —
     which for a one-line title is the same number anyway. */
  if(!Number.isFinite(lh) || lh < 4){
    const fs = parseFloat(cs.fontSize);
    lh = Number.isFinite(fs) ? fs * (Number.isFinite(lh) && lh > 0 ? lh : 1.2) : 0;
  }
  return Number.isFinite(lh) && lh >= 4 ? lh : 0;
}

function edges(key){
  const node = site.querySelector(`.el[data-edit="${key}"]`);
  if(!node) return null;
  const box = node.getBoundingClientRect();
  const vis = (node.firstElementChild || node).getBoundingClientRect();
  return { key, st:{ title:M.title, logo:M.logo, hook:M.hook, buy:M.buy }[key], node, box, vis };
}
// x is the element's centre, so each of these works back from where the ink
// has to land to where the centre must therefore be.
const alignL  = (it, x, sb) => { it.st.align = 'left';
  it.st.x = ((x - (it.vis.left - it.box.left)) / sb.width) * 100; };
const alignR  = (it, x, sb) => { it.st.align = 'right';
  it.st.x = ((x + (it.box.right - it.vis.right)) / sb.width) * 100; };
const centreX = (it, sb)    => { it.st.align = 'center';
  it.st.x = ((sb.width/2 - (it.vis.left - it.box.left) - it.vis.width/2 + it.box.width/2) / sb.width) * 100; };
const topTo   = (it, y, sb) => { it.st.bottom = null;
  it.st.top = ((y - (it.vis.top - it.box.top)) / sb.height) * 100; };

/* ── ANCHORED BY THE BOTTOM, and why it matters that BOTH are ─────────────
   The title is pinned by its bottom so a wrap grows upward. Pinning the
   button by its TOP looks equivalent — both are a percentage of the stage —
   and it is not: the two percentages are measured from opposite edges, so any
   change in the stage's HEIGHT after the measuring pass moves them apart.

   That was harmless while the hero was a fixed 625px. It is not any more. In
   the preview the hero is clamp(260px, 42vh, 460px) and takes a further 50px
   cut from a container query — and a container query resolves AFTER layout,
   so the first measurement can legitimately be taken against a stage that is
   about to change height. The title held its line, the button drifted, and it
   drifted by exactly the amount the stage moved.

   Both anchored from the same edge, a height change slides them together and
   the alignment survives it. `yBottom` is where the element's INK should end,
   in stage coordinates; the correction is the mirror of topTo's. */
const bottomTo = (it, yBottom, sb) => { it.st.top = null;
  it.st.bottom = ((sb.height - (yBottom + (it.box.bottom - it.vis.bottom))) / sb.height) * 100; };

function applyLayout(name, quiet){
  const L = HERO_LAYOUTS[name];
  if(!L) return;
  M.layout = name;
  L.set();
  webPageRedraw();
  // After paint: every position here comes from a measurement.
  requestAnimationFrame(() => {
    if(!placeNow(L)) return;
    if(!quiet) /* hint: L.hint */
    /* And again once the webfonts have actually arrived. Everything here is
       measured, and a text title measured in a fallback face is a different
       width from the real one — so a layout computed before the fonts land is
       computed against type that is about to be replaced. Only re-runs if this
       layout is still the current one, so it can never overwrite a position
       the developer has since dragged. */
    document.fonts?.ready.then(() => { if(M.layout === name) placeNow(L); });
  });
}

function placeNow(L){
  const stage = site.querySelector('.hero-stage');
  if(!stage) return false;
  const sb = stage.getBoundingClientRect();
  if(!sb.height) return false;
  L.place(sb);
  layoutHero();
  return true;
}

/* The hero's stack, top to bottom — the order is wherever things actually
   sit, never an assumed reading order. */
function heroItems(){
  return [['title', M.title], ['logo', M.logo], ['hook', M.hook], ['buy', M.buy]]
    .map(([key, st]) => ({ key, st, node: site.querySelector(`.el[data-edit="${key}"]`) }))
    .filter(it => it.node)
    .sort((a, b) => (a.st.top ?? 0) - (b.st.top ?? 0));
}

/* The gap above an element, in px — derived from where things are rather than
   stored, since positions are now the source of truth. Returns null for the
   topmost element, which has nothing above it. */
function gapAbove(key){
  const stage = site.querySelector('.hero-stage');
  if(!stage) return null;
  const sb = stage.getBoundingClientRect();
  if(!sb.height) return null;
  const items = heroItems();
  const i = items.findIndex(it => it.key === key);
  if(i <= 0) return null;
  const prev = items[i-1].node.getBoundingClientRect();
  const me   = items[i].node.getBoundingClientRect();
  return Math.max(0, Math.round(me.top - prev.bottom));
}

/* Sets that gap by moving THIS element only — the one above stays put, which
   is the same promise as everything else here. */
function setGapAbove(key, px){
  const stage = site.querySelector('.hero-stage');
  if(!stage) return;
  const sb = stage.getBoundingClientRect();
  if(!sb.height) return;
  const items = heroItems();
  const i = items.findIndex(it => it.key === key);
  if(i <= 0) return;
  const prevBottom = items[i-1].node.getBoundingClientRect().bottom - sb.top;
  items[i].st.top = ((prevBottom + px) / sb.height) * 100;
  layoutHero();
}


/* THE PAN IS A FRACTION OF THE TRAVEL, NOT A NUMBER OF PIXELS.

   It used to be pixels, and that made the crop a function of the stage: the
   same stored offset showed a different part of the picture in a 880px modal
   than in a 1400px full-size preview, because every limit it is measured
   against — slack, zoom travel, maxX — scales with the stage. Expanding the
   preview therefore moved the artwork, which is the one thing a full-size
   preview must not do: a monkey centred while editing lost his head when you
   went to look at him properly.

   As a fraction of maxX in [-1, 1], "60% of the way right" means the same
   thing at every width, and the picture stays put through a device switch, a
   window resize and the expand button alike. */
const wpClamp1 = v => Math.max(-1, Math.min(1, +v || 0));

function applyArtPan(hero){
  const m = artMetrics(hero);
  if(!m) return null;
  M.art.ox = wpClamp1(M.art.ox);
  M.art.oy = wpClamp1(M.art.oy);
  // Into this stage's pixels, only for as long as it takes to paint them.
  const px = M.art.ox * m.maxX, py = M.art.oy * m.maxY;

  const hx = m.slackX/2, hy = m.slackY/2;
  const opX = Math.max(-hx, Math.min(hx, px));   // as much as the crop can take
  const opY = Math.max(-hy, Math.min(hy, py));

  const kart = hero.querySelector(':scope > .kart');
  if(kart){
    // 50% is centred; 0% pins the picture's left/top edge. Offsetting the
    // picture to the right means showing more of its left side, hence the
    // minus.
    kart.style.objectPosition =
      (hx ? 50 - (opX/hx)*50 : 50).toFixed(2) + '% ' +
      (hy ? 50 - (opY/hy)*50 : 50).toFixed(2) + '%';
  }
  hero.style.setProperty('--tx', (px - opX).toFixed(1) + 'px');
  hero.style.setProperty('--ty', (py - opY).toFixed(1) + 'px');
  // Every reframe, including each frame of a drag: the thumbnail is the only
  // place you can see what you are losing, so it has to keep up with the hand.
  refreshArtThumb(m);
  return m;
}

function replaceLayout(sync){
  const L = M.layout && HERO_LAYOUTS[M.layout];
  if(!L) return;
  if(sync !== false) return void placeNow(L);
  requestAnimationFrame(() => { if(M.layout) placeNow(L); });
}

/* ── PIECES THAT LIVE ELSEWHERE IN THE MOCKUP ─────────────────────────────
   Pulled in separately because the mockup interleaves them with its editing
   machinery; here they are just what the page needs to draw. */

const CONTACT_ICONS = {
  instagram:{ label:'Instagram', hint:'a handle',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none"/></svg>` },
  email: { label:'Email', hint:'an address',
    svg:`<svg class="brand" viewBox="0 0 127 96" fill="currentColor" aria-hidden="true"><g transform="matrix(5.37437,0,0,5.37437,-13.3834,6.80002)"> <g> <path d="M14.268,8.75C14.593,8.75 14.906,8.617 15.205,8.35L24.961,-0.244C24.447,-0.583 23.789,-0.752 22.988,-0.752L5.557,-0.752C4.756,-0.752 4.095,-0.583 3.574,-0.244L13.33,8.35C13.636,8.617 13.949,8.75 14.268,8.75ZM2.744,14.502L9.971,7.285L2.725,0.898C2.666,0.996 2.612,1.165 2.563,1.406C2.515,1.647 2.49,1.937 2.49,2.275L2.49,13.057C2.49,13.369 2.513,13.643 2.559,13.877C2.604,14.111 2.666,14.32 2.744,14.502ZM5.264,16.084L23.281,16.084C23.639,16.084 23.957,16.045 24.233,15.967C24.51,15.889 24.74,15.785 24.922,15.654L17.49,8.223L16.064,9.492C15.778,9.74 15.483,9.927 15.181,10.054C14.878,10.181 14.574,10.244 14.268,10.244C13.962,10.244 13.659,10.181 13.359,10.054C13.06,9.927 12.767,9.74 12.48,9.492L11.055,8.223L3.623,15.654C3.805,15.785 4.035,15.889 4.312,15.967C4.588,16.045 4.906,16.084 5.264,16.084ZM25.801,14.502C25.872,14.32 25.933,14.111 25.981,13.877C26.03,13.643 26.055,13.369 26.055,13.057L26.055,2.275C26.055,1.937 26.029,1.647 25.977,1.406C25.924,1.165 25.872,0.996 25.82,0.898L18.574,7.285L25.801,14.502Z" style="fill:currentColor;fill-rule:nonzero;"/> </g> </g></svg>` },
  discord:{ label:'Discord', hint:'an invite link',
    svg:`<svg class="brand" viewBox="0 0 127 96" fill="currentColor" aria-hidden="true"><path d="M81.15,0C79.912,2.197 78.801,4.47 77.791,6.794C68.193,5.354 58.419,5.354 48.796,6.794C47.811,4.47 46.675,2.197 45.437,0C36.421,1.541 27.631,4.243 19.297,8.057C2.779,32.53 -1.691,56.373 0.531,79.886C10.204,87.034 21.039,92.489 32.582,95.975C35.183,92.489 37.481,88.777 39.451,84.912C35.713,83.523 32.102,81.781 28.642,79.76C29.551,79.103 30.435,78.422 31.294,77.765C51.575,87.312 75.063,87.312 95.369,77.765C96.228,78.472 97.112,79.154 98.021,79.76C94.561,81.806 90.95,83.523 87.186,84.938C89.156,88.802 91.455,92.515 94.056,96C105.598,92.515 116.433,87.084 126.107,79.937C128.733,52.66 121.611,29.02 107.29,8.082C98.981,4.268 90.192,1.566 81.175,0.051L81.15,0ZM42.28,65.414C36.042,65.414 30.864,59.757 30.864,52.761C30.864,45.765 35.84,40.082 42.255,40.082C48.67,40.082 53.772,45.79 53.671,52.761C53.57,59.732 48.645,65.414 42.28,65.414ZM84.358,65.414C78.094,65.414 72.967,59.757 72.967,52.761C72.967,45.765 77.942,40.082 84.358,40.082C90.773,40.082 95.849,45.79 95.748,52.761C95.647,59.732 90.722,65.414 84.358,65.414Z" style="fill:currentColor;fill-rule:nonzero;"/></svg>` },
  youtube:{ label:'YouTube', hint:'a channel link',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="5.4" width="19.6" height="13.2" rx="4"/><path d="M10.4 9.6l4.6 2.4-4.6 2.4z" fill="currentColor" stroke="none"/></svg>` },
  bluesky:{ label:'Bluesky', hint:'a handle',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11.6C10.6 8.6 7.6 5.5 5.2 5.1 3.4 4.8 2.6 5.9 2.8 8.2c.2 2.2 1 4.4 2.4 5.4 1 .7 2.3.9 3.6.7-2 .4-2.6 1.6-1.6 2.9.9 1.2 2.5 1.6 3.4.6.6-.7 1-1.6 1.4-2.6"/><path d="M12 11.6c1.4-3 4.4-6.1 6.8-6.5 1.8-.3 2.6.8 2.4 3.1-.2 2.2-1 4.4-2.4 5.4-1 .7-2.3.9-3.6.7 2 .4 2.6 1.6 1.6 2.9-.9 1.2-2.5 1.6-3.4.6-.6-.7-1-1.6-1.4-2.6"/></svg>` },
  mastodon:{ label:'Mastodon', hint:'a handle',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 14.6c-.4 1.9-3.3 3-6 3.2-2.9.2-5.7-.3-5.7-.3s0 .8.3 1.4c.4.8 1.7 1.2 3.2 1.3 2.1.1 4-.5 4-.5l.1 1.5s-1.5.8-4.2.7C7.9 21.6 5.4 20.7 4.7 18 4.2 16 4 13.4 4 10.6 4 5 7.7 3.4 7.7 3.4 9.6 2.6 14.4 2.6 16.3 3.4c0 0 3.7 1.6 3.7 7.2 0 0 .1 2.4-.3 4z"/><path d="M9 13.6V9.9c0-1.6 2.9-1.7 3 .5.1-2.2 3-2.1 3-.5v3.7"/></svg>` },
  x:      { label:'X', hint:'a handle',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l16 16M20 4L4 20"/></svg>` },
  reddit: { label:'Reddit', hint:'a subreddit',
    svg:`<svg class="brand" viewBox="0 0 127 96" fill="currentColor" aria-hidden="true"><g transform="matrix(0.535655,0,0,0.535655,79.1827,24.4419)"> <g> <path d="M0,87.96C1.57,88.12 2.57,89.75 1.96,91.21C-3.19,103.52 -15.35,112.17 -29.54,112.17C-43.73,112.17 -55.88,103.52 -61.04,91.21C-61.65,89.75 -60.65,88.12 -59.08,87.96C-49.88,87.03 -39.93,86.52 -29.54,86.52C-19.15,86.52 -9.21,87.03 0,87.96ZM9.96,43.72C18.34,43.72 25.54,52.04 26.03,62.88C26.53,73.72 19.19,78.13 10.82,78.13C2.45,78.13 -3.81,74.2 -4.31,63.35C-4.81,52.51 1.58,43.72 9.96,43.72M-85.1,62.88C-84.6,52.04 -77.4,43.72 -69.03,43.72C-60.66,43.72 -54.26,52.51 -54.76,63.35C-55.26,74.19 -61.51,78.13 -69.89,78.13C-78.27,78.13 -85.6,73.72 -85.1,62.88M-3.56,-19.39C-1.34,-9.98 7.11,-2.97 17.2,-2.97C28.98,-2.97 38.53,-12.52 38.53,-24.3C38.53,-36.08 28.98,-45.63 17.2,-45.63C6.9,-45.63 -1.69,-38.33 -3.69,-28.62C-20.94,-26.77 -34.41,-12.14 -34.41,5.59L-34.41,5.7C-53.17,6.49 -70.3,11.83 -83.9,20.26C-88.95,16.35 -95.29,14.02 -102.17,14.02C-118.68,14.02 -132.06,27.4 -132.06,43.91C-132.06,55.89 -125.02,66.21 -114.85,70.98C-113.86,105.68 -76.05,133.59 -29.54,133.59C16.97,133.59 54.83,105.65 55.77,70.92C65.86,66.12 72.84,55.83 72.84,43.92C72.84,27.41 59.46,14.03 42.95,14.03C36.1,14.03 29.79,16.34 24.75,20.22C11.03,11.73 -6.29,6.39 -25.24,5.68L-25.24,5.6C-25.24,-7.1 -15.8,-17.64 -3.56,-19.37L-3.56,-19.39Z" style="fill:currentColor;fill-rule:nonzero;"/> </g> </g></svg>` },
  web:    { label:'Website', hint:'your own site',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.4 9h17.2M3.4 15h17.2"/><ellipse cx="12" cy="12" rx="4" ry="9"/></svg>` },
};

function layoutHero(){
  const stage = site.querySelector('.hero-stage');
  if(!stage) return;
  const sb = stage.getBoundingClientRect();
  if(!sb.height) return;

  const items = heroItems();
  if(!items.length) return;

  // First run for this game: lay the stack out centred, then store the result
  // so it becomes ordinary placement like anything the developer does by hand.
  // A bottom-anchored element is already placed — `top == null` is its normal
  // state, not a sign that it has never been positioned.
  const unplaced = it => it.st.top == null && it.st.bottom == null;
  if(items.some(unplaced)){
    const GAP = 26;                                    // px between items
    items.forEach(it => it.h = it.node.getBoundingClientRect().height);
    const total = items.reduce((n, it) => n + it.h, 0) + GAP * (items.length - 1);
    let y = (M.stack.y / 100) * sb.height - total / 2;
    for(const it of items){
      if(unplaced(it)) it.st.top = (y / sb.height) * 100;
      y += it.h + GAP;
    }
  }

  for(const it of items){
    // The anchor has to be written out here too, not only in the markup.
    // `left` means a different thing for each alignment — left edge, centre,
    // right edge — so writing the coordinate while the element still carried
    // the previous data-align put it in the wrong place entirely: applying a
    // layout set the state to `left`, the DOM stayed `center`, and the title
    // landed with its CENTRE on the margin instead of its left edge. It only
    // looked right on the second press, once a full render had caught up.
    it.node.dataset.align = it.st.align || 'center';
    it.node.style.left = it.st.x + '%';
    /* ANCHORED BY THE BOTTOM, when the layout says so.

       Everything here is normally pinned by its top edge, which is right for
       something you drag: it stays where you put it and grows downward. It is
       wrong for the title in Text split, where the LAST line has to land on a
       fixed line whatever happens above it. Pinned by the top, a title that
       turns out to need two lines pushes its second line down out of the
       header — and it can turn out to need two lines late, after the webfont
       finally loads and the letters get wider than the fallback's.

       Pinned by the bottom, wrapping grows UPWARD: the last line lands exactly
       where a one-line title would, the button beside it is still right, and
       nothing depends on having measured the height at the right moment. */
    if(it.st.bottom != null){
      it.node.style.top    = 'auto';
      it.node.style.bottom = it.st.bottom + '%';
    }else{
      it.node.style.bottom = '';
      it.node.style.top    = it.st.top + '%';
    }
  }
}

function artMetrics(hero){
  const b = hero.getBoundingClientRect();
  if(!b.width || !b.height) return null;
  const z = M.art.zoom / 100;
  // artRatio() — the proportion learned from the file on load, not the <img>'s
  // naturalWidth read fresh each time, which silently fell back to 16:9 for
  // any call made before the image had decoded.
  const ar = artRatio(), boxAR = b.width / b.height;
  let cw, ch;
  if(ar > boxAR){ ch = b.height; cw = b.height * ar; }
  else          { cw = b.width;  ch = b.width  / ar; }
  const slackX = Math.max(0, cw - b.width),   slackY = Math.max(0, ch - b.height);
  const zoomX  = Math.max(0, (z - 1) * b.width), zoomY = Math.max(0, (z - 1) * b.height);
  return { b, cw, ch, z, slackX, slackY, zoomX, zoomY,
           maxX:(slackX + zoomX)/2, maxY:(slackY + zoomY)/2 };
}


/* THE ONE WAY BACK INTO THE APP.

   The mockup owned its own render(); here Shipmate owns it, so the two places
   that used to redraw the page — the logotype's ink measurement returning, and
   the art pan being clamped — ask the app to redraw instead. Defined as a
   lookup rather than a direct call so this file stays loadable on its own and
   so a missing modal is a no-op rather than a crash. */
function webPageRedraw() {
  if (typeof reRenderStepModal === 'function') reRenderStepModal();
}
