# Open work carried over from CLAUDE.md (as of v6.37)

Moved out of CLAUDE.md so it stops loading every conversation. Live work —
summarised in `NOTES.md`, detail kept here.

## Active Tasks / Known Issues

See GitHub Issues for the current backlog. As of v6.26, the following items are in the queue:

- ~~The step modal's chrome~~ — all three landed: 1 and 2 in v6.11, and the
  scroll reflow in v6.17. `.submit-modal-scroll` and `.mac-spp-main` now carry
  `overflow-y: scroll` + `scrollbar-gutter: stable` with the thumb styled down
  (11px, no track, transparent border) the way `.main` does it — the lane is
  reserved whether or not there is a thumb, so a card growing by a line no
  longer reflows the step sideways. **And it only started actually doing that in
  v6.32**: until then a `scrollbar-color` on those same three elements had Chrome
  drawing overlay bars, so the reserved lane was 0px and every
  `::-webkit-scrollbar` rule was inert. See "`scrollbar-color` is not a
  Firefox-only hint".
- **Mac App Store preview for the demo** — adapt it to how the real Mac App
  Store looks. macOS already exists as a platform (`macos` / `macos_full`), and
  `SM_REQS.macos` in assets.js already carries Apple's numbers: icon 1024×1024
  with no alpha, screenshots 16:10 at 2880×1800 / 2560×1600 / 1440×900 /
  1280×800. The web preview (`buildWebSitePreviewSection` + web-page.js) is the
  most developed one and the best model to copy. (Its NAVIGATION was re-cut in
  v6.28 — see "The Mac preview navigates from the top" — and the sidebar was
  nailed against a screenshot of the real app in the same version. The page's own
  fidelity to Apple's layout is what is still open.)
- **Play and Arcade are the last two hand-drawn sidebar glyphs.** Six of the
  eight are Jaco's exported SVGs as of v6.28; those two are still my redraws and
  he has said he will supply them. Dropping them in is the same one-line swap the
  other six took — see "The Mac sidebar's glyphs are the real art now" for the
  16-unit-box arithmetic and the `fill-rule` trap.
- Auto-fit the hero on mobile: a logotype sized for 1440px overflows at 390px.
  Needs to happen in the measuring pass, re-anchored by the edge it aligns to.
- Press kit — Adam wants a downloadable one with asset links. Blocked on a real
  question rather than a design one: there is no publish path at all, and the
  assets are data URLs or Steam CDN links.
- **One live page** — Marketing's embed and the step modal both render
  `id="site"`, and `#wp-full` appends to `<body>`, changing document order
  mid-gesture. `getElementById` returns the first in document order, which is
  the root cause of both flip bugs fixed defensively in v5.4x
  (`_wpEditSurface`). The agreed fix is that the surface which draws keeps the
  page and the other unmounts. Not started.
- ~~The modal flip "blink"~~ — **FOUND AND FIXED IN v6.33, and it was none of
  the three suspects this entry had been carrying for weeks.** Worth keeping
  the whole story, because the old entry is a case study in how a wrong
  measurement protects a bug.

  **The modal was replaying its ENTRANCE ANIMATION on every flip.**
  `.submit-modal` carries `animation: modalIn .25s` with the default fill mode,
  and `.is-flip-exit` / `.is-flip-enter` REPLACED that shorthand. So when the
  flip class came off — 300ms after the press, exactly as the card settled —
  the cascade reverted to `modalIn`, the animation-name changed back, and the
  browser minted a brand-new `modalIn` starting at its own 0%: `opacity: 0;
  translateY(10px) scale(.98)`. Measured across the removal: opacity **0** at
  +0ms, 0.69 at +76, 0.98 at +196, 1 at +396. A quarter-second re-entrance,
  every flip.

  **The old note said "not an opacity issue (no frame at opacity 1
  unrotated)", and that sentence is what hid it for weeks.** It is true and
  irrelevant: the probe went looking for a frame at FULL BRIGHTNESS, on the
  theory that the modal flashed white. The bad frame is at opacity ZERO. A
  measurement aimed at the wrong end of the range comes back clean and reads as
  an exoneration — so the hunt moved on to `backdrop-filter`, layer promotion
  and the 90px `box-shadow`, none of which had anything to do with it.

  **What made it findable was Jaco's own detail**: *"FLASH al asentarse"* — at
  the END of the rotation, not during it. That put the suspicion on what
  happens when the class comes OFF, which is the one moment none of the three
  suspects could explain and the cascade explains completely.

  The fix is `modalIn` kept at **index 0** of the flip rules' animation list
  (style.css, beside the keyframes, where the long version of this is written).
  Animations are matched to the list by position, so `[modalIn]` →
  `[modalIn, flip]` → `[modalIn]` leaves the first one alone: the same finished
  animation continues instead of a new one being created. Verified after:
  opacity 1 at +0 / +16 / +92 / +292ms, transform straight to `none`, no
  replay.

  **It is CSS animation semantics, not compositing, so it is engine-independent**
  — which is the one reason it was safe to diagnose in Chromium against a bug
  reported in Safari. Confirm it in Safari anyway; if any flash survives there,
  THAT is when the `backdrop-filter` / layer-teardown suspects become live
  again, and they are still untested.

  `.loc-review-card` and `.iap-loc-card` run the same flip classes and are
  **not** affected — checked, their base rules carry no `animation`. Only
  `.submit-modal` has an entrance animation to clobber. Anything that gives one
  of them a base `animation` later inherits this bug.
- Steam's tile mark measures 98.96% of the shared canvas against 90.84% for
  every other logo — its own export, left as authored. One line to bring it
  in line if wanted.
- **Xbox and Nintendo have no measured tile mark**, so the platform picker and
  the card headers still fall back to their brand PNGs (visibly the only two
  colour icons in the list). `smMarkFor()` already prefers a measured mark, so
  dropping art on the shared 39×37 canvas into `SM_TILE_MARKS` is the whole
  job — no code change.
- The two colour duplications above (two ambers, two selection blues).
- `.ob-sec-divider` between Distribution and Localization is dead markup —
  measured `getClientRects().length === 0`, because the sub-tabs never show
  the two sections together. Those two also still share one `.ob-form`, which
  is why leftovers like this exist: structurally it is still the old long
  scrolling form with tabs revealing one slice at a time.
- The repeated section headers in Distribution / Localization / Assets are
  **deliberate** — we removed all three, looked at it and put them back. There
  is a note in render.js; please don't tidy them away.
- T4: Sync data type selections from natural language description (state.js task #4)
- ~~The dev bar~~ — **deleted in v6.26**, all three pieces: the block in app.js,
  the `.sm-devbar` rules in style.css and the call at the top of
  `renderDashboard`. It was listed here precisely so it would not quietly become
  part of the app, and it was removed rather than switched off for the same
  reason — a flag left at `false` is a control waiting to be turned back on.
  Everything it did is still reachable from a real console through
  `smReviewVariant` and `smCardState`.
- **The submitted card's two shapes** — SEGMENTS won and ships (`subVariant`
  defaults to 1). The dates variant is kept alive on purpose, still reachable as
  `smReviewVariant(2)`, because the comparison is not finished. When it is, the
  loser goes along with `state.subVariant` and its branch in
  `buildSubmittedCard`.

### Queued next (Jaco, v6.26)

- **The boxes and outlines are too loud — a refinement pass.** Jaco's brief,
  given the evening v6.32 shipped and not yet scoped: *"cambios a cómo se
  stylean los recuadros y outlines que son demasiado llamativos, y afinar todo
  un poco."* No specific offender named, so the first job is an inventory
  rather than an edit — walk the step modal and the platform cards and list
  every rule that draws a ring, a border or a stroked edge, then ask of each
  whether it is carrying a STATE or merely drawing a box. This file already
  argues that case in three places and each one is a precedent, not a rule to
  reapply blind: the micro-buttons lost their strokes because a bare control
  that fills on hover is the app's pattern; the platform card's step disc
  dropped its ring because a soft disc turning green is one object changing
  colour; the Content Rating bar and the pinned nav draw their ring INSIDE the
  box because a border cannot stay concentric with the fill it clips. Start
  from the previews, since that is where the complaint was made, and measure
  the composite of each edge against what it sits ON — half the strokes in this
  app were tuned over the near-black `--panel` and are now on lighter grounds.
  **Beware the one trap:** three of those edges are load-bearing state
  (`.submit-ready`'s border, the cancel hold's red edge, the inline editor's
  blue focus outline), and softening them by sweep would quietly delete
  meaning. Anything that changes colour to say something keeps its weight.

  **And the brief got sharper the same evening, in a way that changes the
  job.** Jaco again: *"le falta claridad, y los recuadros de colores son
  extraños, no queda muy claro qué campos son editables."* That is not a
  volume complaint, it is an AFFORDANCE one — the question the page fails to
  answer is *which of these can I click?* — and the two pull in opposite
  directions, so turning every edge down would make it worse. The preview
  currently says "editable" three different ways at once: the amber glow (which
  actually means UNFINISHED, not editable), the blue focus outline (only once
  you are already in), and nothing at all on a field that is filled in — so a
  completed title looks exactly like the drawing around it. The real target is
  **one resting mark that means "this is yours to edit", present on every
  editable field whether or not it is finished**, and then the loud colours can
  come down because they stop carrying a job they were never meant to have.
  Worth deciding before touching a single value, because it settles which
  edges are allowed to go quiet. The Mac preview is the place to solve it: it
  is the one whose whole argument is that the page is a DRAWING of a store with
  editor chrome laid over it, and this is exactly the seam between the two.
- **Make the Submit button celebratory.** This is the debt shape 4 took on
  deliberately: the destination moved out of the Submit row precisely so Submit
  could be "reduced to the single confident act" — and then it was left looking
  like every other row. The Release button on the other face is the reference
  now (solid `#2fdc80`, the step row's box and type, last thing in the card);
  Submit is the same moment one face earlier and should not be quieter than the
  thing that merely *finishes* what it started. Watch the one trap already
  written down: whatever it becomes must not also ask a question, or shape 4's
  whole argument comes back.
- **Animate the submit → in-review transition properly.** What exists is the
  honest minimum, not the design: the box closes from the steps height to the
  submitted one over 420ms while the new content fades up 5px (`.is-advancing`,
  and `_doFinalSubmit` / `cancelSubmission` in app.js). It reads as correct and
  not as an event. Two things it should probably gain and neither is free — a
  beat where the steps acknowledge being sent before they go, and something that
  carries the eye from the card to the guide's month, which changes face at the
  same instant with nothing connecting the two. Keep the rule the current one
  rests on: the header and the release block are identical across both faces and
  must not be animated, or one card becoming another reads as two cards swapping.
- **The calendar wants another pass.** No brief yet — the colour vocabulary and
  the wait band landed in v6.26 and the shape underneath them has not been
  revisited since. Likely starting points, none agreed: the guide's month and the
  Calendar tab still share one `monthOffset` (paging in either moves both), the
  day panel is deliberately missing note/repeat/time, and the workback items are
  still derived from the target launch date rather than from anything the
  developer has said they will do.

---
