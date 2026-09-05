# Asset library — spec

**Status:** proposal, nothing built.
**Prior art:** `SteamAssets.html` (nav prototype) already has a working classifier and a
full store-requirements table. This spec is mostly about *connecting* that to Shipmate's
state, not inventing it.

---

## 1. What this is for

Two things, and the second is the one that pays.

**Classify on upload.** Read every image's dimensions and transparency the moment it
arrives and say what it probably is — icon, logotype, key art, screenshot. Shown as a
label the developer can correct in one click.

**Then let every uploader in Shipmate draw from the same pool.** Today "Use another
image…" opens a file dialog, every time, everywhere, and the file it produces is bound
to one named slot and reachable from nowhere else. The developer uploads their key art
in Assets, and then uploads it again for the website.

The classification is the cheap half. The pool is the point.

---

## 2. What already exists

### 2.1 The classifier is written

`SteamAssets.html:1368` — twelve lines, decided by **shape, not size**:

```js
function assetKind(a){
  if(a.kind==='video')  return 'video';
  if(a.alpha)           return 'logo';
  if(a.w===a.h)         return 'icon';
  if(isShot(a))         return 'screenshot';
  if(a.w/a.h>=1.6)      return 'art-land';
  if(a.w/a.h<=0.85)     return 'art-port';
  return 'other';
}
```

The ordering is the design. **Alpha is tested first** because it is the strongest single
bit: an alpha channel means *mark* (logotype, icon), no alpha means *picture* (art,
screenshot). That one boolean splits the set before any ratio is consulted.

`hasAlpha` (`:2063`) is 6 lines: draw to an 8×8 canvas, check that **all four corners**
have alpha < 10. Conservative on purpose — it will miss a logotype with something in a
corner, but it will never call a photograph a logo.

`isShot` is not a guess either. `SHOT_SIZES` (`:1358`) is derived from `REQS` — every
size any store *declares* for screenshots, in both orientations. "Screenshot" means
"matches a size a real store asks for".

### 2.2 The requirements table is the actual asset

`REQS` (`:1307`) declares every store's required sizes with flags — `sq` square, `ar`
aspect-tolerant, `rot` rotatable, `noAuto` must-be-uploaded, `any` alternative sizes.
App Store, Google Play, Steam, Epic. That table is weeks of research and the classifier
is an afternoon.

It also carries derivation rules (`needsFor`, `:1386`): a capsule is *key art + logotype
composited*, a hero is *key art alone*, an icon needs *an icon*. And a match grader
(`fits`, `:1425`) with four grades — `exact` / `square` / `crop` / `ratio` — and one
hard rule: **never upscale**.

Port `REQS`, `assetKind`, `hasAlpha`, `isShot` and `SHOT_SIZES` as-is. They are done.

### 2.3 What Shipmate has

- **No dimensions are recorded anywhere.** Not one upload path reads `naturalWidth`.
- **`measureInk`** (`web-page.js:1588`) already loads an image to a canvas and returns
  the bounding box of its non-transparent pixels, keyed by `src` in `_inkCache`. It is
  the only content-keyed derived-data store in the codebase, and `hasAlpha` is a
  strictly cheaper version of what it already does.
- **Five different record shapes** across eleven upload paths: `{name,dataUrl}`,
  `{id,name,dataUrl}`, `{name,url}`, `{id,name,url}`, `{name,size}`.
- **`dataUrl` vs `url` is load-bearing.** It is the discriminator for "the developer
  chose this" — `filter(s => s.dataUrl)` is how manual uploads survive switching the
  linked Steam title (`app.js:4117`, `4418`, `4436`). Any new shape must preserve that
  distinction explicitly.
- **Slot-by-reference already works.** `platformScreenshots[pid].selected` stores *ids*
  pointing into `state.uploads.screenshots`. The pattern this spec generalises is one
  the codebase already runs.
- Four parallel stores exist: `state.uploads.*` (9 named slots),
  `state.webSite.screenshots` (a one-way mirror), `state.webSite.page.{logo,
  artOverride, headerImage}`, `state.platformScreenshots[pid]`.

---

## 3. The pool

### 3.1 Shape

```js
state.assets = [                  // per project, cloned with uploads
  {
    id:      'as_lk3f9',          // stable, referenced from everywhere
    name:    'library_hero.jpg',
    src:     'data:image/…' | 'https://…',
    origin:  'upload' | 'steam' | 'igdb',   // ← replaces the dataUrl/url tell
    w: 3840, h: 1240,             // measured on intake, always
    alpha:   false,               // measured on intake, always
    kind:    'art-land',          // assetKind() said so
    kindBy:  'auto' | 'user',     // did a human correct it
    mime:    'image/jpeg',
    size:    2481920,
    addedAt: 1757030400000,
  },
]
```

**`origin` is the migration hazard, and it is the one thing to get right.** Today the
question "did the developer choose this?" is answered by *"does it have a `dataUrl`?"*
That conflation works only because auto-filled assets happen to arrive as URLs. It is
not a fact about the file, it is a coincidence about where it came from — and the moment
an uploaded file is stored as a blob URL, or a fetched one is inlined, the coincidence
breaks silently. `origin` states the fact instead, and every `filter(s => s.dataUrl)`
becomes `filter(a => a.origin === 'upload')`.

### 3.2 Intake

One function, `addAsset(file)`, replacing eleven near-copies:

```
File → objectURL → new Image() → onload:
  w, h        = naturalWidth/Height
  alpha       = hasAlpha(img)
  kind        = assetKind({w, h, alpha})
  → read as data URL, push record, return id
```

`SteamAssets.html:2077` does exactly this. Note it uses `URL.createObjectURL` and keeps
the object URL as `src`, which Shipmate cannot: uploads are deep-cloned into
`proj.uploads` and must survive a reload, so intake reads the data URL as it does today
and measures from the same `<img>` before discarding the object URL.

### 3.3 Slots become references

`state.uploads.*` keeps its nine names — they mean something, and everything reads them —
but a slot now holds a reference:

```js
state.uploads.steamKeyArtHero = { ref: 'as_lk3f9' }
state.uploads.screenshots     = [{ ref: 'as_a' }, { ref: 'as_b' }]
```

Almost every reader already goes through **`_screenshotSrc`** (`app.js:9449`) or
**`_wpSrc`** (`web-page-data.js:66`). Teach those two to resolve a `ref` and most of the
app keeps working untouched. That is the whole reason this is affordable.

Migration runs once on project load, and is idempotent: walk `state.uploads`,
`state.webSite.screenshots` and `state.webSite.page.*`; for each record found, create a
pool asset (measuring `w`/`h`/`alpha` lazily, on first need, since a data URL costs
nothing to keep and a decode costs a frame) and replace the record with a ref. A record
that is already a ref is left alone.

**One asset, many slots.** The same key art can be the website hero *and* the Steam
library hero without being stored twice — which is also what makes "this file already
covers 3 of Steam's 9 requirements" possible later.

---

## 4. The picker

`wpPickImage`, `wpPickLogo`, `wpPickHeaderImage` and the four Key Art dropzones stop
opening a file dialog and open a grid instead:

- **Filtered by what belongs there.** The header offers `art-land`; the corner offers
  `logo` and `icon`; screenshots offer `screenshot`. Everything else is behind a
  "Show all" toggle rather than hidden — a developer whose logotype was classified as
  `art-port` must still be able to find it.
- **"Upload new…" is the first tile**, so the current gesture is never slower than it is
  today.
- Each tile shows the thumbnail, its dimensions, and its kind as an editable chip.

**Correcting a classification is one click, and it sticks** (`kindBy: 'user'`), because
being confidently wrong about which file is the key art is worse than asking. A wrong
label is noticed instantly and fixed in a second; a file silently filed as a screenshot
is a file the developer cannot find.

---

## 5. Phases

Each is shippable alone and useful alone.

**1 — Measure and classify.** `addAsset`, `hasAlpha`, `assetKind`, `state.assets`.
Existing uploads keep working exactly as they do; the pool is written alongside and
nothing reads it yet. Ends with: the Assets tab shows what each file is, and the labels
are correct. *No behaviour changes, so nothing can break.*

**2 — Slots become refs.** The migration, plus `_screenshotSrc`/`_wpSrc` resolving refs.
Ends with: one file, one copy, many uses. This is the phase with real regression risk —
the `origin` swap and the `filter(s => s.dataUrl)` call sites are the places to be
careful.

**3 — The picker.** Replaces the file dialogs. Ends with: the website can use anything
the project already has, which is the thing that was actually asked for.

**4 — Coverage.** Port `REQS` and `assetReport`: *"this covers 6 of Steam's 9; the
vertical capsule is missing; your key art can generate it."* This is where the
classification stops being a label and starts being advice — and it is the natural
foundation for the press kit, which is a classified asset folder with a page in front
of it.

---

## 6. Open questions

- **Does the pool span projects, or live inside one?** Inside, initially — it clones
  with `proj.uploads` and needs no new persistence. A studio logotype reused across
  three games is a real want, and a real second problem.
- **Where does the Assets tab go?** It currently renders screenshots and a trailer, and
  has orphaned handlers for an icon and a feature graphic whose dropzones were removed
  (`render.js:1024` computes `hasAndroid` and never uses it). The library is the natural
  shape for that tab — one well, everything in it, sorted by kind.
- **Video.** `assetKind` handles it and Shipmate stores trailers as `{name, size}` with
  the bytes never read. Out of scope here; the record shape leaves room.
- **When is AI worth a round trip?** Only for what geometry cannot settle — a 16:9 image
  with no alpha that is either a screenshot or a wide piece of key art. `claude.js` is
  there for it. It would be wrong to spend a request on a question `3840×1240` has
  already answered.
