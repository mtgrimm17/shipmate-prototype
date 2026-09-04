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
  logo: null, logoTint: 'original', logoShow: true, artOverride: null,
  buyMode: 'button', headerShow: false, hookShow: false, titleShow: true, hiddenRows: [],
  logoPos: null, hookPos: null,
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
             weight: TITLE_WEIGHT, show: page.titleShow !== false, text: g.name,
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
      { x: 50, align: 'center', top: null, size: 100, shadow: 50,
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
const WP_PANEL = {
  art: 'webKeyArt', logo: 'webKeyArt', title: 'webKeyArt',
  buy: 'webFactsheet', strip: 'webFactsheet',
  mini: 'webDescription', about: 'webDescription',
  contact: 'siteInfo',
};
const WP_PANEL_SECTION = {
  strip: 'webFactsheet', video: 'webMedia', shots: 'webMedia',
  about: 'webDescription', footer: 'siteInfo',
};

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
const WP_VISUAL = { art: 1, buy: 1 };

function webPageBindPanels() {
  if (!site) return;
  site.addEventListener('click', e => {
    // A link on the page is a link, not an invitation to edit it.
    if (e.target.closest('a[href]:not([href="#"])')) return;
    const zone = e.target.closest('[data-edit]');
    const sect = e.target.closest('[data-sect]');
    const key  = zone && zone.dataset.edit;

    /* A PIECE YOU DRAG IS NOT A PIECE YOU CLICK. The logotype and the tagline
       are placed by hand; a click on one is the end of a drag, or a drag that
       moved nothing. Either way, flipping the card to a form is not what was
       asked for — and being thrown to the other side of the card every time
       you nudge a logo makes the gesture unusable. */
    if (key && WP_MOVABLE[key]) { e.preventDefault(); e.stopPropagation(); return; }

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
  const cx = 0.5 - (M.art.ox / fullW),      cy = 0.5 - (M.art.oy / fullH);
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

const WP_DOCK_LABEL = { art: 'Header', buy: 'Buy button' };

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
  const has = [
    ['title',  'Title',         page.titleShow !== false],
    ['logo',   'Logotype',      !!page.logoShow && !!page.logo],
    ['header', 'Corner header', !!page.headerShow],
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

  let body = '';
  if (key === 'art') {
    body = `
    ${artThumbHTML()}
    <span class="wp-lbl">Zoom</span>
    <input type="range" class="wp-range" data-wp="zoom" min="100" max="250" value="${art.zoom}">
    <span class="wp-val" data-wp="zoomval">${art.zoom}%</span>
    <button class="wp-btn" data-wp="upload">Use another image…</button>
    <button class="wp-btn" data-wp="reset" ${
      art.zoom === 100 && art.ox === 0 && art.oy === 0 && !page.artOverride ? 'disabled' : ''
    }>Reset</button>
    <span class="wp-sep"></span>
    ${wpHeroAddHTML(page)}`;
  } else if (key === 'buy') {
    /* Three shapes, not a colour picker and a label field. The colour is the
       page's one accent, set in Edit site details; the label is fixed. What is
       genuinely a decision is WHICH call to action a page wants: one pill for a
       game with one store, the availability marks for a game on five, or
       nothing at all when the art should carry the fold alone. */
    const mode = page.buyMode || 'button';
    const accent = (state.webSite && state.webSite.accent) || '#0EA5A4';
    body = [['button', 'Button'], ['stores', 'Store marks'], ['none', 'None']]
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
                   style="background:${c}"></button>`).join('');
  }

  return `<div class="wp-dock" data-wp-dock>
      <span class="wp-title">${WP_DOCK_LABEL[key] || key}</span>
      <span class="wp-sep"></span>
      ${body}
      <span class="wp-sep"></span>
      <button class="wp-btn wp-done" data-wp="done">✓ Done</button>
    </div>`;
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
    M.art.ox = from.ox + (e.clientX - from.x);
    M.art.oy = from.oy + (e.clientY - from.y);
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
    g = { el, st, sb, x: e.clientX, y: e.clientY,
          x0: st.x, top0: st.top != null ? st.top : (el.getBoundingClientRect().top - sb.top) / sb.height * 100 };
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
    el.classList.add('wp-moving');
    e.preventDefault();
    e.stopPropagation();          // do not also select the hero underneath
  });

  stage.addEventListener('pointermove', e => {
    if (!g) return;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    g.st.x   = clamp(g.x0   + ((e.clientX - g.x) / g.sb.width)  * 100, 0, 100);
    g.st.top = clamp(g.top0 + ((e.clientY - g.y) / g.sb.height) * 100, 0, 96);
    // A hand placement is a placement: it must not be re-derived from the
    // bottom by the arrangement on the next pass.
    g.st.bottom = null;
    layoutHero();                 // writes inline styles only
  });

  const drop = () => {
    if (!g) return;
    const key = g.el.dataset.edit;
    g.el.classList.remove('wp-moving');
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
    const r = e.target.closest('[data-wp=zoom]');
    if (!r || !hero) return;
    M.art.zoom = +r.value;
    const val = dock.querySelector('[data-wp=zoomval]');
    if (val) val.textContent = r.value + '%';
    applyArtPan(hero);
  });
  // `change` fires when the handle is released. That is the commit.
  dock.addEventListener('change', e => {
    if (!e.target.closest('[data-wp=zoom]')) return;
    setWebPageArt({ zoom: M.art.zoom, ox: M.art.ox, oy: M.art.oy });
    webPageRedraw();
  });

  dock.addEventListener('click', e => {
    const b = e.target.closest('[data-wp]');
    if (!b || b.tagName !== 'BUTTON') return;
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.wp;
    if (a === 'done')   return webPageSelect(null);
    if (a === 'upload') return wpPickImage();
    if (a === 'ctamode'){ setWebPageField('buyMode', b.dataset.k); return webPageRedraw(); }
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
      const field = { title: 'titleShow', hook: 'hookShow',
                      logo: 'logoShow', header: 'headerShow' }[k];
      const cur = (state.webSite.page || {})[field];
      // titleShow defaults to ON, so an undefined value means "shown" and the
      // first press has to turn it OFF rather than on again.
      setWebPageField(field, field === 'titleShow' ? cur === false : !cur);
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
function wpReadImage(then) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { then({ name: f.name, dataUrl: r.result }); webPageRedraw(); };
    r.readAsDataURL(f);
  };
  inp.click();
}

function wpPickImage() {
  wpReadImage(file => {
    setWebPageField('artOverride', file);
    setWebPageArt({ ox: 0, oy: 0 });     // a new picture deserves a fresh crop
  });
}

/* The logotype the developer supplies themselves. Choosing a file IS turning
   it on — asking someone to pick an image and then find a second switch to
   show it would be two steps for one intention. */
function wpPickLogo() {
  wpReadImage(file => {
    setWebPageField('logo', file);
    setWebPageField('logoShow', true);
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
      let last = 0, busy = false;
      const ro = new ResizeObserver(entries => {
        if (busy) return;
        const h = Math.round(entries[0].contentRect.height);
        if (!h || h === last) return;
        last = h;
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

const SECTION_NAMES = { strip:'Metadata', video:'Trailer', about:'About', shots:'Screenshots',
                        footer:'Footer' };

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
function heroArt(cls){
  const g = WPG;
  // `real` means "has delivered art". An import with no Steam page has none,
  // so it falls back to the generated scene like an unimported title — better
  // than a broken image where the key art should be.
  // An uploaded file outranks everything: it is the developer choosing, and
  // this whole feature exists because the fetched art is a starting point.
  const src = M.up.art || ((g.real && g.hero)
    ? g.hero
    : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgArt('classic', artSeed)));
  const fallback = (!M.up.art && g.real && g.header) ? ` onerror="this.onerror=null;this.src='${g.header}'"` : '';
  return `<img class="kart ${cls||''}" src="${src}" alt="${esc(g.name)} key art"
               draggable="false" onload="artLoaded(this)"${fallback}>`;
}
/* The key art's own proportions, learned from the file the first time it
   loads. Needed by fit:'whole', which hands them to the hero so the art is
   shown entire. Falls back to the generated scene's 1600×900 viewBox. */
function artLoaded(img){
  const g = WPG;
  if(!img.naturalWidth) return;
  const r = img.naturalWidth / img.naturalHeight;
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
const artRatio = () => (M.up.art ? M.up.artRatio : WPG.artRatio) || 16/9;

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
function headerMarkHTML(){
  const m = MARK();
  return m
    ? inkBoxHTML(m, inkScaleForHeight(m, M.header.size))
    : `<span class="hh-word">${esc(WPG.title)}</span>`;
}
function headerHTML(){
  if(!M.header.show) return '';
  // Inside the stage, so it sits on the content column's left edge.
  return `<div class="hero-head" data-edit="header">${headerMarkHTML()}</div>`;
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
    
    <div class="strip-in">` + M.strip.map(([k,v,on],i) => !on ? '' :
      /* A row with nothing in it yet shows an em dash rather than an empty
         cell. The band is seen for the first time DURING the submission, so
         all six rows are drawn from the start and the layout settles once —
         a row that materialises when you type into a form you cannot see is
         a page that changes shape under you. The placeholder is muted so a
         filled-in row still reads as the one carrying information. */
      `<dl class="sf">
         <dt>${esc(k)}</dt>
         <dd>${v === 'stores' ? storesHTML()
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
  const poster = g.trailer.poster ? `<img class="vbg" src="${g.trailer.poster}" alt="">` : heroArt('vbg');
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
  const lead = `
    <section class="band lead"><div class="band-in" data-edit="mini">
      ${miniP}
    </div></section>`;

  const video = M.show.video ? `
    <section class="band" data-sect="video">
      <div class="band-in">${videoHTML()}</div>
    </section>` : `
    <section class="band"><div class="band-in">${videoSlotHTML()}</div></section>`;

  /* THE REST OF THE DESCRIPTION, under the trailer.
     The hook above the fold has one job — make you want to know more — and
     until now the page had no answer for somebody it worked on. This is that
     answer, and it sits below the trailer on purpose: whoever has watched a
     trailer is exactly the reader who wants the long version. */
  const about = M.show.about ? `
    <section class="band" data-sect="about">
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
    <section class="band" data-sect="shots">
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
  return hero + stripHTML() + lead + video + about + shots + footer;
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


function applyArtPan(hero){
  const m = artMetrics(hero);
  if(!m) return null;
  M.art.ox = Math.max(-m.maxX, Math.min(m.maxX, M.art.ox));
  M.art.oy = Math.max(-m.maxY, Math.min(m.maxY, M.art.oy));

  const hx = m.slackX/2, hy = m.slackY/2;
  const opX = Math.max(-hx, Math.min(hx, M.art.ox));   // as much as the crop can take
  const opY = Math.max(-hy, Math.min(hy, M.art.oy));

  const kart = hero.querySelector(':scope > .kart');
  if(kart){
    // 50% is centred; 0% pins the picture's left/top edge. Offsetting the
    // picture to the right means showing more of its left side, hence the
    // minus.
    kart.style.objectPosition =
      (hx ? 50 - (opX/hx)*50 : 50).toFixed(2) + '% ' +
      (hy ? 50 - (opY/hy)*50 : 50).toFixed(2) + '%';
  }
  hero.style.setProperty('--tx', (M.art.ox - opX).toFixed(1) + 'px');
  hero.style.setProperty('--ty', (M.art.oy - opY).toFixed(1) + 'px');
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
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.5 7.5 12 13l8.5-5.5"/></svg>` },
  discord:{ label:'Discord', hint:'an invite link',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 6.2A15 15 0 0 1 12 5.6a15 15 0 0 1 4.5.6c2.2 3 3 6.3 2.8 9.9a15 15 0 0 1-4.2 2.1l-.9-1.5"/><path d="M7.8 16.7l-.9 1.5a15 15 0 0 1-4.2-2.1c-.2-3.6.6-6.9 2.8-9.9"/><path d="M6.6 15.3a12 12 0 0 0 10.8 0"/><circle cx="9.3" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="14.7" cy="12" r="1.15" fill="currentColor" stroke="none"/></svg>` },
  bluesky:{ label:'Bluesky', hint:'a handle',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11.6C10.6 8.6 7.6 5.5 5.2 5.1 3.4 4.8 2.6 5.9 2.8 8.2c.2 2.2 1 4.4 2.4 5.4 1 .7 2.3.9 3.6.7-2 .4-2.6 1.6-1.6 2.9.9 1.2 2.5 1.6 3.4.6.6-.7 1-1.6 1.4-2.6"/><path d="M12 11.6c1.4-3 4.4-6.1 6.8-6.5 1.8-.3 2.6.8 2.4 3.1-.2 2.2-1 4.4-2.4 5.4-1 .7-2.3.9-3.6.7 2 .4 2.6 1.6 1.6 2.9-.9 1.2-2.5 1.6-3.4.6-.6-.7-1-1.6-1.4-2.6"/></svg>` },
  mastodon:{ label:'Mastodon', hint:'a handle',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18.8 14.6c-.4 1.9-3.3 3-6 3.2-2.9.2-5.7-.3-5.7-.3s0 .8.3 1.4c.4.8 1.7 1.2 3.2 1.3 2.1.1 4-.5 4-.5l.1 1.5s-1.5.8-4.2.7C7.9 21.6 5.4 20.7 4.7 18 4.2 16 4 13.4 4 10.6 4 5 7.7 3.4 7.7 3.4 9.6 2.6 14.4 2.6 16.3 3.4c0 0 3.7 1.6 3.7 7.2 0 0 .1 2.4-.3 4z"/><path d="M9 13.6V9.9c0-1.6 2.9-1.7 3 .5.1-2.2 3-2.1 3-.5v3.7"/></svg>` },
  x:      { label:'X', hint:'a handle',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l16 16M20 4L4 20"/></svg>` },
  reddit: { label:'Reddit', hint:'a subreddit',
    svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13.6" rx="8" ry="5.6"/><circle cx="20.3" cy="6.6" r="1.7"/><path d="M12 8.05 13.3 3l4.6 1.1"/><circle cx="9.2" cy="13.2" r="1.15" fill="currentColor" stroke="none"/><circle cx="14.8" cy="13.2" r="1.15" fill="currentColor" stroke="none"/><path d="M9.3 16.4a4.6 4.6 0 0 0 5.4 0"/></svg>` },
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
