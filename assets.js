/* ============================================================================
   THE ASSET LIBRARY
   ============================================================================

   One pool of images per project, classified on arrival, referenced from
   everywhere. Three jobs, in the order they matter:

     1. SAY WHAT EACH FILE IS. Read its dimensions and transparency the moment
        it lands and label it — icon, logotype, key art, screenshot. Geometry
        answers this; no AI is needed and spending a request on a question
        3840×1240 has already answered would be silly.
     2. LET EVERY UPLOADER DRAW FROM THE SAME POOL, so a developer who uploads
        their key art in Assets does not upload it again for the website.
     3. SAY WHAT IS STILL MISSING, and — the part that actually saves work —
        what the SMALLEST set of masters is that would cover the most stores.

   Descended from the `SteamAssets.html` nav prototype, whose assetKind() and
   hasAlpha() are ported nearly unchanged because they were already right.

   ── ON THE NUMBERS ────────────────────────────────────────────────────────
   Every requirement below carries a `conf` field, and that is not decoration.
   The three console stores keep their specs behind NDA portals, so a number
   for PlayStation is a different KIND of fact from a number for Steam:

     'official' — published in the store's own developer documentation.
     'observed' — measured off the live storefront. Real, but descriptive:
                  it is what the store SERVES, not what it says it wants.

   Anything we could not establish either way is simply absent. A missing
   requirement costs a developer nothing; a wrong one costs them a rejected
   submission, and on a platform with no public doc they have no way to
   sanity-check us. Nintendo is therefore not in this table at all — see
   SM_NO_SPEC.
   ========================================================================== */

/* Verified against the stores' own documentation in September 2026. Two
   things that most third-party guides still get wrong, both of which would
   have been in here if we had trusted memory:

     · STEAM CHANGED EVERY CAPSULE SIZE IN AUGUST 2024. The old 460×215
       header, 231×87 small, 616×353 main and 374×448 vertical are no longer
       accepted at all — not deprecated, rejected.
     · XBOX RETIRED "Branded key art" (584×800) for games, and forbids
       transparency on every store image. Third-party guides still list it
       because it survives in the older MSIX *apps* documentation.

   Flags:
     sq    must be square
     ar    aspect-tolerant: any size at this ratio, at or above this one
     rot   the same measurement rotated is also valid
     shot  must be captured from the game — cannot be derived from key art
     alpha transparency REQUIRED
     noA   transparency FORBIDDEN
     any   alternative accepted sizes
     min   this is a floor, not an exact size */
const SM_REQS = {
  steam: [
    { k:'header',   n:'Header capsule',   w:920,  h:430,  conf:'official' },
    { k:'small',    n:'Small capsule',    w:462,  h:174,  conf:'official' },
    { k:'main',     n:'Main capsule',     w:1232, h:706,  conf:'official' },
    { k:'vertical', n:'Vertical capsule', w:748,  h:896,  conf:'official' },
    { k:'libcap',   n:'Library capsule',  w:600,  h:900,  conf:'official' },
    { k:'libhero',  n:'Library hero',     w:3840, h:1240, conf:'official',
      note:'Safe area 860×380 centred. No text.' },
    { k:'liblogo',  n:'Library logo',     w:1280, h:720,  alpha:true, ar:true, conf:'official',
      note:'PNG with transparency. 1280 wide and/or 720 tall.' },
    { k:'bg',       n:'Page background',  w:1438, h:810,  conf:'official', opt:true },
    { k:'icon',     n:'Community icon',   w:184,  h:184,  sq:true, conf:'official' },
    { k:'shots',    n:'Screenshots',      w:1920, h:1080, ar:true, min:true, shot:true, count:5, conf:'official',
      note:'Minimum five, 16:9, gameplay only.' },
  ],
  ios: [
    { k:'icon',   n:'App icon',           w:1024, h:1024, sq:true, noA:true, conf:'official' },
    { k:'iphone', n:'iPhone screenshots', w:1320, h:2868, ar:true, rot:true, shot:true, noA:true, conf:'official',
      any:[[1320,2868],[1290,2796],[1260,2736],[1284,2778],[1242,2688]],
      note:'6.9" is the primary set; 6.5" accepted instead.' },
    { k:'ipad',   n:'iPad screenshots',   w:2064, h:2752, ar:true, rot:true, shot:true, noA:true, conf:'official',
      any:[[2064,2752],[2048,2732]], note:'Required if the game runs on iPad.' },
  ],
  macos: [
    { k:'icon',  n:'App icon',        w:1024, h:1024, sq:true, noA:true, conf:'official' },
    { k:'shots', n:'Mac screenshots', w:2880, h:1800, shot:true, noA:true, conf:'official',
      any:[[2880,1800],[2560,1600],[1440,900],[1280,800]], note:'16:10 only.' },
  ],
  android: [
    { k:'icon',    n:'App icon',         w:512,  h:512,  sq:true, alpha:true, conf:'official',
      note:'32-bit PNG. Play applies its own mask — do not pre-round.' },
    { k:'feature', n:'Feature graphic',  w:1024, h:500,  noA:true, conf:'official' },
    { k:'shots',   n:'Phone screenshots', w:1080, h:1920, ar:true, rot:true, shot:true, noA:true, count:2, conf:'official',
      any:[[1080,1920],[1920,1080]], note:'320–3840px. 1080×1920 or 1920×1080 for promo surfaces.' },
    { k:'tablet',  n:'Tablet screenshots', w:1920, h:1080, ar:true, rot:true, shot:true, noA:true, count:4, conf:'official',
      note:'Large screens: 1080–7680px, 16:9 or 9:16. Minimum four.' },
  ],
  epic: [
    { k:'logo',     n:'Product logo',            w:960,  h:540,  conf:'official',
      note:'PNG, max 1MB, legible on a dark background.' },
    { k:'offerL',   n:'Offer image — landscape', w:2560, h:1440, conf:'official' },
    { k:'offerP',   n:'Offer image — portrait',  w:1200, h:1600, conf:'official' },
    { k:'libL',     n:'Library image — landscape', w:2560, h:1440, conf:'official' },
    { k:'libP',     n:'Library image — portrait',  w:1200, h:1600, conf:'official' },
    { k:'carousel', n:'Media carousel',          w:1920, h:1080, shot:true, conf:'official',
      note:'Five or more recommended, with a video first.' },
    { k:'social',   n:'Social preview',          w:1200, h:1200, sq:true, conf:'official', opt:true },
  ],
  xbox: [
    { k:'poster',  n:'Poster art',        w:1440, h:2160, conf:'official', noA:true, any:[[1440,2160],[720,1080]] },
    { k:'box',     n:'Box art',           w:2160, h:2160, sq:true, noA:true, conf:'official', any:[[2160,2160],[1080,1080]] },
    { k:'hero',    n:'Super hero art',    w:3840, h:2160, noA:true, conf:'official', any:[[3840,2160],[1920,1080]] },
    { k:'titled',  n:'Titled hero art',   w:1920, h:1080, noA:true, conf:'official', note:'4K is not supported here.' },
    { k:'promo',   n:'Featured promotional square', w:1080, h:1080, sq:true, noA:true, conf:'official' },
    { k:'shots',   n:'Screenshots',       w:3840, h:2160, ar:true, shot:true, noA:true, count:4, conf:'official',
      any:[[3840,2160],[1920,1080]] },
  ],
  /* Measured off the live PlayStation Store rather than published by Sony —
     the role names are theirs, the pixel sizes are what their CDN serves.
     Strong (zero variance across three unrelated titles) but descriptive, and
     labelled as such everywhere it is shown. */
  psn: [
    { k:'master', n:'Master art',   w:1024, h:1024, sq:true, conf:'observed' },
    { k:'hero',   n:'Key art',      w:3840, h:2160, conf:'observed' },
    { k:'port',   n:'Portrait banner', w:1440, h:2160, conf:'observed' },
    { k:'shots',  n:'Screenshots',  w:3840, h:2160, ar:true, shot:true, count:4, conf:'observed',
      note:'PlayStation appears to serve screenshots at 4K only.' },
  ],
};

/* THE ONE PLATFORM WE DELIBERATELY SAY NOTHING ABOUT.
   Nintendo publishes no asset dimensions at all — everything real is behind
   the NDA portal, and the numbers circulating on the open web are either
   marketing-site measurements or SEO filler. A wrong Nintendo number is the
   highest-risk output this file could produce, because it is the platform
   where a developer has no public doc to check us against. */
const SM_NO_SPEC = {
  switch: 'Nintendo publishes no public asset specifications — they arrive with your ' +
          'PR materials request in the Nintendo Developer Portal.',
};

const SM_CONF_LABEL = {
  official: 'From the store’s own documentation',
  observed: 'Measured from the live store — verify in the partner portal',
};

/* ── THE CLASSIFIER ────────────────────────────────────────────────────────
   Decided by SHAPE, not by size, so a file that is the right shape and too
   small is still recognised — and then told it is too small, which is more
   useful than being ignored. */

/* Every size any store declares for a screenshot, both ways round. So
   "screenshot" does not mean "looks like one", it means "matches a size a
   real store asks for". */
const SM_SHOT_SIZES = (() => {
  const out = [];
  Object.values(SM_REQS).flat().filter(r => r.shot).forEach(r => {
    (r.any || [[r.w, r.h]]).forEach(([w, h]) => { out.push([w, h]); out.push([h, w]); });
  });
  return out;
})();
const smIsShot = a => SM_SHOT_SIZES.some(([w, h]) => a.w === w && a.h === h);

/* THE ORDER IS THE DESIGN.

   Alpha is tested first because it is the strongest single bit in the file:
   an alpha channel means MARK (logotype, icon), its absence means PICTURE
   (key art, screenshot). That one boolean splits the set before any ratio is
   consulted.

   One departure from the prototype this is ported from, and it is deliberate:
   there, alpha won outright and every transparent file was a 'logo'. But a
   square transparent PNG is far more often an app icon — Google Play requires
   exactly that — than a square logomark, and calling every icon a logo is the
   more frequent mistake of the two. So square is checked inside the alpha
   branch. A studio whose logomark IS square corrects it in one click, and the
   correction sticks. */
function smAssetKind(a) {
  if (a.kind === 'video') return 'video';
  if (!a.w || !a.h)       return 'other';
  if (a.alpha)            return a.w === a.h ? 'icon' : 'logo';
  if (a.w === a.h)        return 'icon';
  if (smIsShot(a))        return 'screenshot';
  if (a.w / a.h >= 1.6)   return 'art-land';
  if (a.w / a.h <= 0.85)  return 'art-port';
  return 'other';
}

const SM_KIND_LABEL = {
  'logo':'Logotype', 'icon':'Icon', 'screenshot':'Screenshot',
  'art-land':'Key art — landscape', 'art-port':'Key art — portrait',
  'video':'Video', 'other':'Unclassified',
};
const SM_KIND_SHORT = {
  'logo':'Logotype', 'icon':'Icon', 'screenshot':'Screenshot',
  'art-land':'Key art', 'art-port':'Portrait art', 'video':'Video', 'other':'Other',
};
const SM_KINDS = ['art-land','art-port','logo','icon','screenshot','video','other'];

/* ── READING A FILE ────────────────────────────────────────────────────────
   Four corners of an 8×8 downscale. Conservative on purpose: it will miss a
   logotype that has something in one corner, but it will never call a
   photograph transparent — and a false 'logo' is the more damaging error,
   because it sends a piece of key art to the corner slot. */
function smHasAlpha(img) {
  try {
    const N = 8, c = document.createElement('canvas');
    c.width = c.height = N;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, N, N);
    const d = x.getImageData(0, 0, N, N).data;
    return [0, N - 1, N * (N - 1), N * N - 1].every(i => d[i * 4 + 3] < 10);
  } catch (e) {
    // A cross-origin image taints the canvas. Not transparent is the safe
    // answer: it lands the file in the artwork half, where a wrong guess
    // costs a correction rather than a broken corner mark.
    return false;
  }
}

/* Measure an already-loaded <img>, or a src. Callback style to match
   measureInk, which does the same job one step further.

   THE CORS RETRY IS NOT OPTIONAL, and getting it wrong would have made every
   Steam-fetched asset unclassifiable. Reading pixels off a canvas requires
   crossOrigin='anonymous', but setting that on a host which does NOT send the
   matching header makes the image fail to load AT ALL — so a capsule from a
   CDN without CORS would come back 0×0 rather than merely un-alpha-tested.

   So: try with CORS, and on failure try again without. The second attempt
   gets real dimensions and reports alpha:false, because the canvas is tainted
   and cannot be read. That is the right trade — dimensions decide six of the
   seven classifications, and a fetched store asset is opaque artwork
   essentially always. measureInk does the same dance for the same reason. */
function smMeasure(src, done, allowCors = true) {
  const img = new Image();
  const remote = /^https?:/i.test(src);
  if (allowCors && remote) img.crossOrigin = 'anonymous';
  img.onload = () => done({
    w: img.naturalWidth, h: img.naturalHeight, alpha: smHasAlpha(img),
  });
  img.onerror = () => {
    if (allowCors && remote) return smMeasure(src, done, false);
    done({ w: 0, h: 0, alpha: false });
  };
  img.src = src;
}

/* ── THE POOL ──────────────────────────────────────────────────────────── */

let _smSeq = 0;
const smNewId = () => 'as_' + Date.now().toString(36) + '_' + (_smSeq++).toString(36);

function smPool() {
  if (!state.assets) state.assets = [];
  return state.assets;
}
const smGet = id => smPool().find(a => a.id === id) || null;

/* THE RECORD. `origin` is the field that matters most, and it is a bug fix as
   much as a feature.

   Today the question "did the developer choose this file?" is answered by
   asking whether it has a `dataUrl` — see `filter(s => s.dataUrl)` in three
   places. That works only because auto-filled assets happen to arrive as
   remote URLs. It is not a fact about the file; it is a coincidence about
   where it came from, and it breaks silently the day an upload is stored as a
   blob URL or a fetched image is inlined. `origin` states the fact. */
function smAdd(rec) {
  const a = Object.assign({
    id: smNewId(), name: 'image', src: '', origin: 'upload',
    w: 0, h: 0, alpha: false, kind: 'other', kindBy: 'auto',
    mime: '', size: 0, addedAt: Date.now(),
  }, rec);
  if (a.kindBy !== 'user') a.kind = smAssetKind(a);
  // The same file twice is one asset. Data URLs make this exact and free.
  const dup = smPool().find(x => x.src && x.src === a.src);
  if (dup) return dup.id;
  smPool().push(a);
  return a.id;
}

/* Intake from a File. Measures BEFORE the record exists, so no asset is ever
   in the pool without knowing its own shape. */
function smAddFile(file, done) {
  if (!file || !file.type || !file.type.startsWith('image/')) return done && done(null);
  const r = new FileReader();
  r.onerror = () => done && done(null);
  r.onload = () => {
    const src = r.result;
    smMeasure(src, m => {
      const id = smAdd({
        name: file.name, src, origin: 'upload',
        w: m.w, h: m.h, alpha: m.alpha, mime: file.type, size: file.size,
      });
      done && done(id);
    });
  };
  r.readAsDataURL(file);
}

/* Adopt something that already exists — a Steam fetch, or a record from
   before the pool did. Measured lazily: the label can wait a frame, and a
   remote image that never loads must not block the record being created. */
function smAdopt(rec, origin) {
  if (!rec) return null;
  const src = rec.dataUrl || rec.url || rec.src || '';
  if (!src) return null;
  const existing = smPool().find(x => x.src === src);
  if (existing) return existing.id;
  const id = smAdd({
    name: rec.name || 'image', src,
    origin: origin || (rec.dataUrl ? 'upload' : 'steam'),
    w: rec.w || 0, h: rec.h || 0, kind: 'other',
  });
  smMeasure(src, m => {
    const a = smGet(id);
    if (!a || !m.w) return;
    a.w = m.w; a.h = m.h; a.alpha = m.alpha;
    if (a.kindBy !== 'user') a.kind = smAssetKind(a);
  });
  return id;
}

/* A human disagreeing with the classifier is the end of the argument. */
function smSetKind(id, kind) {
  const a = smGet(id);
  if (!a || !SM_KINDS.includes(kind)) return;
  a.kind = kind;
  a.kindBy = 'user';
}

function smRemove(id) {
  const i = smPool().findIndex(a => a.id === id);
  if (i >= 0) smPool().splice(i, 1);
}

/* Resolve anything to a drawable src: a ref, a pool record, or one of the
   five legacy shapes. Every reader in the app funnels through here or through
   _screenshotSrc / _wpSrc, which call it. */
function smSrc(v) {
  if (!v) return '';
  if (typeof v === 'string') {
    const a = smGet(v);
    return a ? a.src : v;
  }
  if (v.ref) { const a = smGet(v.ref); return a ? a.src : ''; }
  return v.dataUrl || v.url || v.src || '';
}
const smRef = id => (id ? { ref: id } : null);

/* ── WHAT IS COVERED, AND WHAT WOULD COVER IT ───────────────────────────── */

const SM_SOURCE_FOR = r => {
  if (r.shot)  return 'screenshot';
  if (r.sq)    return 'icon';
  if (r.alpha || /logo/i.test(r.n)) return 'logo';
  return (r.w / r.h < 1) ? 'art-port' : 'art-land';
};

const smSizes = r => {
  const base = r.any || [[r.w, r.h]];
  return r.rot ? base.concat(base.map(([w, h]) => [h, w])) : base;
};

/* TWO DIFFERENT QUESTIONS, and conflating them produced a panel that claimed
   four masters covered Steam and then marked every Steam slot unmet.

     smFits(a, r)   — can this file be SUBMITTED as it stands? Strict. Steam
                      wants a header capsule at exactly 920×430; a 3840×2160
                      master is not one, however much art it contains.
     smCovers(a, r) — can the deliverable be MADE from this file? True when
                      the file is the right source kind and has at least as
                      many pixels in each axis, because producing a capsule
                      from a master is a crop and a resize down.

   The library answers the first ("this file fills that slot") and the master
   set answers the second ("this one file is where six slots come from"). */
function smCovers(a, r) {
  if (!a || !a.w || !a.h) return false;
  if (r.shot) return a.kind === 'screenshot';   // captured, never derived
  if (SM_SOURCE_FOR(r) !== a.kind) return false;
  return a.w >= r.w && a.h >= r.h;
}

/* Does this asset satisfy this requirement, and how well? Four grades, and
   one rule that overrides all of them: NEVER UPSCALE. A 1920-wide file
   offered for a 3840-wide slot is not a near miss, it is a no. */
function smFits(a, r) {
  if (a.kind === 'video') return null;
  const near = (x, y) => Math.abs(x - y) < 0.01;
  if (smSizes(r).some(([w, h]) => a.w === w && a.h === h)) return 'exact';
  if (r.sq && a.w === a.h && a.w >= r.w) return 'square';
  if (a.w < r.w || a.h < r.h) return null;
  // A shot slot takes any screenshot with pixels to spare in both axes.
  if (r.shot) return a.kind === 'screenshot' ? 'crop' : null;
  if (!r.ar) return null;
  if (a.kind === 'logo' || a.kind === 'icon') return null;
  return smSizes(r).some(([w, h]) => near(a.w / a.h, w / h)) ? 'ratio' : null;
}

/* Which requirements the project's assets already answer, per platform. An
   asset is never CONSUMED: one wide master can satisfy Steam's hero and
   Xbox's super hero at once, and saying so is the point. */
function smCoverage(platforms) {
  const pool = smPool();
  const out = [];
  (platforms || []).forEach(pid => {
    const reqs = SM_REQS[pid];
    if (!reqs) {
      if (SM_NO_SPEC[pid]) out.push({ pid, noSpec: SM_NO_SPEC[pid], rows: [] });
      return;
    }
    const rows = reqs.map(r => {
      const hits = pool.map(a => ({ a, grade: smFits(a, r) })).filter(x => x.grade);
      return { r, hits, grade: hits.length ? hits[0].grade : null,
               need: SM_SOURCE_FOR(r) };
    });
    const req = rows.filter(x => !x.r.opt);
    out.push({ pid, rows,
      done: req.filter(x => x.grade).length, total: req.length });
  });
  return out;
}

/* ── THE SMALLEST SET THAT COVERS THE MOST ──────────────────────────────────

   The question a developer actually has is not "which of my forty files goes
   where", it is "what do I need to make". Every requirement in the table
   reduces to one of five source kinds, so the answer is five files — and the
   size of each is simply the largest any store asks of it, because a master
   can be cropped down and must never be scaled up.

   Computed from SM_REQS rather than written out, so it cannot drift from the
   table it is derived from. When Steam changes a capsule size again, this
   changes with it. */
function smSourceSet(platforms) {
  const need = {};
  (platforms || []).forEach(pid => (SM_REQS[pid] || []).forEach(r => {
    if (r.opt) return;
    /* SCREENSHOTS ARE NOT IN THE MASTER SET, and leaving them in was the
       first thing this got wrong. Taking the max of each axis across every
       screenshot slot produced 3840×2868 — a size no store asks for and no
       screen produces, arrived at by mixing a landscape console capture with
       a portrait phone one.

       The deeper reason is that a screenshot cannot be derived at all. Every
       other slot here is artwork that crops down from one big master; a
       screenshot is a capture of the game at a device's resolution, and
       cropping an iPhone capture into an iPad one throws away the parts of
       the interface an iPad would have shown. The stores know this, which is
       why they mark these slots as must-upload. They are listed separately,
       per platform, rather than folded into a number that would be wrong. */
    if (r.shot) return;
    const k = SM_SOURCE_FOR(r);
    const n = need[k] || (need[k] = { kind: k, w: 0, h: 0, from: [], alpha: false });
    // The master must be at least as large as the largest slot in EACH axis,
    // which is not the same as the largest slot: Steam's 3840×1240 hero and
    // Xbox's 3840×2160 together demand 3840×2160.
    n.w = Math.max(n.w, r.w);
    n.h = Math.max(n.h, r.h);
    if (r.alpha) n.alpha = true;
    n.from.push(pid + ':' + r.n);
  }));
  return SM_KINDS.filter(k => need[k]).map(k => need[k]);
}

/* The screenshot slots, which the master set deliberately leaves out. Grouped
   by the size actually asked for, so a developer sees "capture at these three
   resolutions" rather than one impossible number. */
function smShotNeeds(platforms) {
  const by = {};
  (platforms || []).forEach(pid => (SM_REQS[pid] || []).forEach(r => {
    if (!r.shot) return;
    const key = r.w + 'x' + r.h;
    const n = by[key] || (by[key] = { w: r.w, h: r.h, min: !!r.min, count: 0, pids: [] });
    n.count = Math.max(n.count, r.count || 1);
    if (!n.pids.includes(pid)) n.pids.push(pid);
  }));
  return Object.values(by).sort((a, b) => (b.w * b.h) - (a.w * a.h));
}

/* What the pool is missing from that set — the actual to-do list. */
function smMissingSources(platforms) {
  const have = {};
  smPool().forEach(a => { have[a.kind] = (have[a.kind] || 0) + 1; });
  return smSourceSet(platforms).filter(s => !have[s.kind]);
}

/* ── MIGRATION ─────────────────────────────────────────────────────────────
   Every upload that predates the pool, adopted into it and replaced by a
   reference. Idempotent: a slot that is already a ref is left alone, so this
   can run on every project load without asking whether it already has.

   Deliberately NOT rewriting state.uploads' key names. They mean something,
   everything reads them, and the whole affordability of this change rests on
   the readers not having to move. */
const SM_SINGLE_SLOTS = ['appIcon','featureGraphic','steamCapsuleImage','steamHeaderImage',
                         'steamKeyArtCapsule','steamKeyArtHero'];

function smMigrate() {
  const u = state.uploads;
  if (!u) return 0;
  let n = 0;
  SM_SINGLE_SLOTS.forEach(k => {
    const v = u[k];
    if (!v || v.ref) return;
    const id = smAdopt(v, v.dataUrl ? 'upload' : 'steam');
    if (id) { u[k] = smRef(id); n++; }
  });
  if (Array.isArray(u.screenshots)) {
    u.screenshots = u.screenshots.map(s => {
      if (!s || s.ref) return s;
      const id = smAdopt(s, s.dataUrl ? 'upload' : 'steam');
      if (!id) return s;
      n++;
      // The id is kept: platformScreenshots[pid].selected references these by
      // id, and rewriting them here would break a selection that is correct.
      return { id: s.id, ref: id };
    });
  }
  const ws = state.webSite || {};
  if (Array.isArray(ws.screenshots)) {
    ws.screenshots = ws.screenshots.map(s => {
      if (!s || s.ref) return s;
      const id = smAdopt(s, s.dataUrl ? 'upload' : 'steam');
      if (!id) return s;
      n++;
      return { id: s.id, ref: id };
    });
  }
  const page = ws.page || {};
  ['logo','artOverride','headerImage'].forEach(k => {
    const v = page[k];
    if (!v || v.ref) return;
    const id = smAdopt(v, 'upload');
    if (id) { page[k] = smRef(id); n++; }
  });
  return n;
}

/* Did the developer choose this, or did Steam? The question three call sites
   used to answer by looking for a dataUrl. */
function smIsOwn(v) {
  if (!v) return false;
  if (v.ref) { const a = smGet(v.ref); return !!a && a.origin === 'upload'; }
  return !!v.dataUrl;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SM_REQS, SM_NO_SPEC, SM_KINDS, SM_KIND_LABEL, SM_KIND_SHORT,
                     SM_SHOT_SIZES, smAssetKind, smIsShot, smFits, smCovers, smCoverage,
                     smSourceSet, smShotNeeds, SM_SOURCE_FOR };
}
