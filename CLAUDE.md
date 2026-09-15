# Shipmate Prototype — Claude Context

## What This Is

Shipmate is a web app that helps game developers prepare and submit their games to app stores (iOS App Store, Google Play, Steam, Epic, PlayStation, Xbox, Nintendo). It walks developers through content ratings, data collection disclosures, business categories, screenshots, and binary analysis — using AI to infer answers where possible.

This is a **static HTML/CSS/JS prototype** hosted on GitHub Pages. There is no build system, no npm, no bundler. Everything runs directly in the browser.

Current version: **v6.36**

---

## File Architecture

| File | Purpose |
|------|---------|
| `index.html` | App shell, modals markup, script/style tags |
| `splash.html` | Splash/loading screen (loaded in an iframe) |
| `style.css` | All styles |
| `state.js` | Global `state` object — single source of truth |
| `render.js` | Pure rendering functions (`buildXxx`, `renderXxx`) — never mutate state |
| `app.js` | Event handlers, state mutations, initialization |
| `claude.js` | Claude API wrapper (streaming inference) |
| `locale.js` | i18n string lookup helper |
| `locales/` | JSON translation files per language |
| `Assets/` | Images (logos, icons) |
| `config.js` | **GITIGNORED** — real API keys live here, never committed |

---

## Key Code Patterns

### State
All app data lives in the global `state` object defined in `state.js`. Render functions read from it; app.js mutates it. Never mutate state inside render functions.

```js
// Reading state
state.platforms['ios'].screenshots

// Mutating state (in app.js)
state.platforms['ios'].screenshots.push(newShot);
renderDashboard();
```

### Render vs App split
- `render.js` — builds HTML strings, attaches inline event handlers, returns or sets innerHTML
- `app.js` — handles all user interactions, calls render functions to update DOM after mutations

### Platform IDs
`ios`, `android`, `steam`, `epic`, `psn`, `xbox`, `switch`

### CSS 3D flip animation
Platform cards flip between views using CSS 3D transforms. Classes:
- `is-flip-exit` (160ms) — current face rotates out
- `is-flip-enter` (300ms) — new face rotates in

Use `openStorePreviewSection(pid, target)` to trigger a flip. It handles the 3-phase async sequence (flip exit → inference loading with 2s minimum → flip enter).

### Screenshot crop state
Per-platform crop state is tracked in `_shotCropState[pid]`:
```js
{ shotId, src, name, aspect, panX, panY }
```
Pan position is preserved between device preset changes. Reset pan when a new screenshot is dropped.

### Store preview section tracking
`state.storePreviewSectionSeen[pid][target]` tracks whether a user has visited a section. Required for gating "done" state — a section isn't complete until both visited AND data is filled.

### Platform marks share one canvas

`SM_TILE_MARKS` in `platform-icons.js` is the set actually drawn in SELECT
PLATFORMS and in the platform-card headers. Every mark sits on the **same
39×37 viewBox**, reframed so its ink is 90.84% of the canvas height and
centred on (19.03, 18.305) — those numbers are measured, not chosen. That is
what lets identical CSS give identical results; marks on their own exported
canvases bobbed and changed size from tile to tile.

Adding art: drop it in, run `smTileMarkBBoxes()` in the console, and write the
transform from what it reports. Two traps it avoids — `getBBox()` on a
transformed `<g>` reports pre-transform units, and a non-square viewBox
letterboxes (one uniform scale, not one per axis).

Watch for an invisible `<rect style="fill:none">` in Serif exports: a bounding
box counts it, so the mark gets scaled as though its ink filled the artboard.
`_smMarkBody()` strips it.

### One definition per symbol

`smCheckSVG()` and `SM_STEP_CHEVRON` live in `state.js`, which loads before
everything that uses them. Both used to be pasted into each card builder, and
in both cases the copies drifted — six of seven ticks were still an older
glyph, and the chevron was missing from the fourth builder entirely.

Ticks are sized to **the full width of their disc**, not a fixed pixel size.
The discs differ (20px on a card and in the guide, 16px in the collapsed
rail), so a fixed size lands at a different fraction of each; at 100% the ink
is 38.3% of the disc everywhere and the stroke scales with it.

### Shippy is two layers

`.guide-mascot` (z-index 0) sits behind the opaque `.guide-card` and is
cropped by it; `.guide-tentacles` (z-index 2) sits in front. The tentacles are
static PNGs and the illusion rests on one number: **tent.png's only pure
horizontal edge is at 57.57% of its height** (y=700 of 1216, measured with an
alpha scan), and that line must land on the card's top border. So the offset is
derived — `top = -(height × --shippy-tent-flat)` with the height derived from
the width — and no size change can knock it off. Don't expose it as a control.

The breath is built by `shippyBreathe()` (render.js), not in CSS, with
`startTime = 0` on the document timeline. `renderGuide()` rebuilds this column
with innerHTML, so a CSS animation restarts from 0% on every tab change; one
shared clock puts every new node at the same phase by definition. A negative
`animation-delay` computed from a captured clock was tried and measurably
drifted ~2px per tab change.

**`.app-guide` must stay positioned.** Below 1100px a media query used to set
`position: static`, which took it out of the positioning chain and left the
mascot, the tentacles and the `::after` bloom resolving against `<body>` —
hundreds of pixels from their card. It is `relative` there now.

### Colour has meanings

Three, and only three: **green done** (#31DC80), **amber attention**
(rgba(255,184,107,…)), **red wrong** (--alert-*). Anything informational wears
text colours.

The old Subwoofer orange `#fb923c` is retired from the tip vocabulary — the
three `--sw-tip-*` tokens are deleted, not repointed, because that one colour
had come to mean a tip, a warning, a clickable badge AND a hover state at once.

A round `!` or `?` is never coloured: it is a tooltip handle, not an alert. And
inside a chip the badge takes `currentColor` with no fill, because
`.tooltip-icon`'s own fill is an opaque grey that punches a hole through a
selected chip.

**A fourth meaning joined them in v5.73: violet is a change Shipmate is
PROPOSING.** It lives only in Improve Your Submission — `#5436AD` / `#7A00D2`
fills with `#FBA4FF` text on `.imp-split-fix`, and a violet hover on
`.imp-cta[data-imp-act="apply"]`. It marks the suggested half of a
current-vs-fix pair, which none of the three existing colours could say: the
suggestion is not done, not an alert and not wrong.

The distinction that keeps it honest is **violet proposes, blue confirms**. The
moment a fix is chosen the box changes to the selection blue (`--pill-on-*`,
#52BAFF), the same blue an onboarding pill wears when selected — so "this is
the one you picked" reads identically everywhere in the app. Violet must never
mark a chosen or applied state, and blue must never mark an unanswered
suggestion.

The grade tabs bring five more hues (#50F88A / #B4DE52 / #E8974E / #FF7A5C /
#FF5C5C for A–F). Those are a scale, not meanings, and they are scoped to
`.iv-grade-tab`. Don't borrow them for anything else.

Each tab's **fill is that same hue over the tab's #161616 at ~17%** (it was
~10%, which left five panels that were all the same dark grey with a coloured
character on them — the scale was only legible in the letter). Border at 30%.
If a hue changes, recompute the fill rather than eyeballing it:
`c = 22 + (hue − 22) × 0.17` per channel.

Two duplications survive and are worth resolving together some day: **two
ambers** (`#fb923c` in --orange/--orange-soft vs `#FFB86B` everywhere newer)
and **two selection blues** (`--sel-*` #60a5fa, ~14 consumers in Marketing and
content rating, vs `--pill-on-*` #52BAFF). Neither is a bug; both mean a
"selected" or an "attention" looks different depending on the tab.

### Two card builders, one row

`buildActiveCard()` serves Web, PlayStation, Xbox, Nintendo and Epic;
`buildIOSActiveCard()` / `buildAndroidActiveCard()` / `buildSteamActiveCard()`
serve the rest. **A change to the step row has to land in both.** The rows are
`.ios-step-card`; `.card-task` / `.task-dot` are retired.

The two systems used inverted class names — old: `is-complete` on the dot and
`is-done` on the row; new: `is-done` on the disc, `is-complete` on the row. Go
through `_paintStepRow()` (app.js) rather than setting them by hand.

Steps and the submit row must share one `.ios-step-cards` parent: the divider
is an adjacent-sibling rule, so splitting them leaves no line between them.

A completed step is **promoted, not dimmed** — the name goes white, as the nav
prototype's `.step.done` does. An `opacity` on the row also paints its green
disc through gauze, which reads as the wrong green rather than as a dim row.

The line above the FIRST row belongs to `.ios-step-cards`, not to the row. It
was the row's own `::before` for a round, and a row's line is hidden while that
row is lit — so the top of the list blinked away whenever the pointer was
anywhere in Upload Build's 45px band, including the 12px of padding the line
sits in. Owned by the container it is not a hover target at all.

### The card is two columns, top to bottom

Everything in a platform card lands on one of two x values, measured from the
card box: **21** (its 1px border + 20px padding) and **55** (21 + `--pico` +
12). The platform logo's slot, the step discs and the release block's labels
take the first; the platform's name, the step titles and the release values
take the second. The logo and the discs also share a **centre**, 32.

Both of those follow from `--pico`, so tuning the disc moves the text column
with it — that is the design, not a side effect, and it is why there is no
number to keep in sync anywhere else.

```css
--pico:  22px;  /* the step discs — and the logo's SLOT */
--plogo: 26px;  /* the platform logo's glyph, which overflows that slot */
--pname: 19px;  /* the platform's name */
--pstep: 15px;  /* the step titles */
.active-card-platform  { gap: 12px }
.active-card-icon      { width: var(--pico) }
.active-card-icon svg  { width: var(--plogo);
                         margin: 0 calc((var(--pico) - var(--plogo)) / 2) }
```

The reference spec says the logo and the discs are one element at two heights
and must grow together under one variable. That was tried and asking for a
bigger logo grew every checkmark with it, which nobody wanted. The second
attempt gave the logo its own slot and **derived the header's gap**
(`calc(--pico + 12px - --plogo)`) so the name stayed on its column — that
aligned the left edges and left the centres 3px apart, a column of circles
against a bigger logo sitting 3px to their right.

**So the slot is `--pico` and only the glyph is bigger**, overflowing evenly by
a computed negative margin. Centres agree, the column needs no arithmetic, and
either token can move. The cost, on purpose: the glyph's ink starts 2px inside
the card's padding, left of the 21 everything else keeps. For a column that is
otherwise all circles the centre is what the eye reads.

Don't rely on `justify-content: center` to spill an oversized flex item both
ways — it isn't guaranteed. Use the margin.

The logo wears **no well**. It was a 42px rounded square in `--panel-3`, which
made the header the heaviest thing on a card whose every other control is an
outline, and put the mark's ink 6px off the card's only vertical edge.

A `--pcol` token that moved the text column independently of `--pico` was tried
and reverted — the column following the disc is what is wanted. If it ever comes
back, note that the step row's 12px flex gap is the wrong lever: it also spaces
the risk dot from the chevron at the far end of the row.

**Size the glyphs in CSS, never with the size argument.** `smCheckSVG(20)`
appears at nine call sites and `smMarkFor(pid, 20)` at one; all of those
literals were the disc's old fixed size, so the first time `--pico` moved the
ticks silently stopped filling their discs and lost the 38.3% ink ratio the
guide's ticks are matched to. `.ios-step-num svg` and `.active-card-icon svg`
now set the size, so a glyph is a function of its slot.

The step disc is a **soft filled circle**, `rgba(255,255,255,.07)` with the
number at white 42% — no border. The ring it replaced was the last stroked
thing in a card that had had every other stroke removed, and it fought its own
done state: an empty ring turning into a solid green disc is a change of *kind*,
where a soft disc turning green is the same object changing colour. Both risk
states (`is-risk-warn`, `is-risk-high`) therefore tint the **fill**; they used
to tint the border and would otherwise have been silently reduced to a coloured
digit on a neutral disc.

Still open: the guide's pending discs are still rings, so the *pending* state
diverges between the card and the Shippy panel (the tick proportion still
matches).

**The next task wears no ring.** `.gd-task.is-current` used to throw a 1.5px
`--guide-mark` ring around its disc, which reads as "you are here" — a claim the
guide cannot make. `is-current` is derived as the first undone item, while one
tab routinely holds three of them, so it pointed at "Write description" while
you sat on a page containing that and two more. What the guide does know is
which one is NEXT, and that is weight, not a locator: the disc goes to violet
42% (from the pending 20%) and the label comes up out of `--text-dim` to
#cfc4ee, short of the white a *done* label wears. The collapsed rail's
`.guide-mini-dot`s never had the ring, so the two views now agree.

### The release block (VERSION / BUILD / TRACK)

`buildReleaseBlock()` in render.js. Two rows: what was uploaded, then where it
goes. Every number in it is derived from a constraint rather than picked —

- The label column is **`max-content` + a 14px gap**, so the row's own label
  binds to its value at the same 14 `.rel-pair` uses inside the line. It was a
  fixed 62px, which bought values starting at 97 on every card — but it left
  "VERSION" ending 15.8px short of the column edge, so that first gap measured
  **29.8 against the pair's 14**: two different bindings for one relationship,
  and "VERSION" read as a heading over the row instead of as the name of the
  value beside it. Now measured 14 and 14, with 30 still separating the two
  pairs. The cost, paid knowingly: values no longer share an x across cards
  (~12px between a Steam card, which starts at BUILD, and an iOS one). The old
  note said `auto` was "wrong across a grid" — that was written when the row
  was pure text and its left edge was the only thing lining anything up. Since
  shape 4 the row's shared line is the **picker's right edge**, and the labels
  still all start on 21, the card's one real vertical edge.
- `.rel-version { min-width: calc(4ch + 25px) }` caps the gap from the end of
  the version text to the "B" of BUILD at **55px**. That gap is
  `(column − text) + 30` (14px row gap + 16px pair margin) and is widest when
  the text is narrowest, a four-character `v1.0`. In `ch` because the face is
  monospace — 1ch *is* the character advance — so the cap survives a size
  change.
- The track pill is pulled **−14px** so its *text* lands on the value column
  while its box hangs into the label gap. The opposite fix (indenting the text
  +14 to meet the pill) moved every value in the block to accommodate one
  control's padding.
- Labels are **white at 34%**, not `--ob-label-color`'s 72%. They name a value
  and get out of the way. Scoped to `.rel-label`, not by repointing the token —
  that token is Game Details' section headers, where the label *is* the
  heading of a field.
- **No middot and no date.** "v1.0 · 2 days ago" reads as machine-assembled
  metadata; the gap separates the facts instead. The date answered neither
  question the header asks and is the only value nobody can act on. It belongs
  on a build inside a list of builds. `uploadedAt` is still stamped on every
  upload, so nothing needs re-modelling for that.
- The pill is a **ghost trigger** whose hover box is the header buttons' hover
  box — 30px, 8px radius, `var(--surface-hover, rgba(255,255,255,.06))`, no
  stroke. Same kind of object: a control that shows nothing until you go near
  it, living in the card's chrome rather than in a form. The masked `::after`
  ring is switched off with `display: none` scoped to `.rel-track`, so
  Localization's copy of the same pill keeps its ring.

**Stores model this channel → build, not build → channel**, and that is
verified against vendor docs, not remembered. Apple: groups hold their own
build lists, added one at a time ("You can add only one build at a time"), and
internal groups do not auto-receive builds unless automatic distribution is on
— so build 41 on external while 42 is on internal is normal. Builds expire at
90 days. Google: tracks run concurrently, but a lower versionCode on a test
track is *inert*, because a device gets "the highest version code published
across those tracks" and the Console flags it Shadowed. Steam: any of the last
50 builds can be set live on any branch. The current block still shows one
build → one destination; the parallel state needs the build list.

### Improve Your Submission — three batches, one axis

`buildImproveSubmissionSection()` (render.js) draws three batches — Store Page,
Localization, Binary. Each is a `.iv-card` with its school-grade `.iv-grade-tab`
sticking out from **behind** it (the card is offset `margin-right: 52px`), and a
numbered carousel in the header. Everything is scoped under `.improve-v2`, on
the section's own wrapper rather than on the modal, because this step shares
`.submit-modal` with every other step.

**The list stopped shrinking, and that is what the carousel rests on.**
`_mergedStoreItems()` (app.js) returns every suggestion with a derived
`status` — `applied` / `kept` / `open`, read off `acceptedFixes` and
`dismissedFixes` rather than stored — where it used to filter answered ones
out. A tab cannot be drawn for an item the list has forgotten. Answering no
longer moves you either: you pressed a box on the card you were reading.

**One axis for the header.** Type label, file chip, carousel and grade letter
all centre on the same line, from three tokens with the grade's position
*derived*:

```css
--iv-head-h: 26px;      /* the tallest thing a header holds — the file chip */
--iv-card-pad-top: 8px; /* and the head's margin-bottom, deliberately equal */
--iv-grade-lh: 27px;
padding-top: calc(var(--iv-card-pad-top) + (var(--iv-head-h) - var(--iv-grade-lh)) / 2);
```

Equal top padding and bottom margin is what makes the gap above the header's
content equal the gap below it. The file chip carries an explicit `height`: left
to its padding it came out 27.4px and *it* decided the header's height, pushing
the binary batch off the axis the other two sat on.

**Collapse means "this is no longer asking anything", not "hidden".** It is a
three-state override (`_improveCollapsed`): undefined follows the work,
true/false is the header toggle. Derived-only was tried and locked the batch
shut, because the condition that collapsed it never stops being true. Two rules
follow: a collapsed batch has **no selected dot** and **no per-item button** —
both claim a card that is not on screen — and the "looking good" line is only
printed when everything really is answered. Folded away with work outstanding it
shows its header and nothing else.

**A grade rates the submission, not the reading of it.** Localization's grade is
`locAccepted ? 'A' : locGrade`, not `locDone ? …`: "Not now" used to score the
same as "Add language", so the batch went to A for having been answered, and a
grade that rises for dismissing its own advice is worth nothing. Declining a
language leaves the submission exactly as weak as it was. Dismissed still
*collapses* the batch and still prints "Localization handled" — being no longer
asked is a different fact from being better, and only the first is true.

**Only two of the three auto-collapse.** Binary and Localization are
acknowledgements: answered, there is nothing left to do with them. A Store Page
answer is *not* finished when it is made — the accepted fix stays editable
through its pencil, and the text it wrote is the real store copy — so its
default is `false` and it only ever collapses by hand. That is why the all-clear
and no-build states wear `.iv-card-collapsed` too: they are the same claim, and
it buys them the right padding and no divider.

A divider divides two things, so **summaries never have one**: the two
all-clears, Binary's "upload your build to scan for…" caption, and any collapsed
card. `.iv-head:last-child` is what drops the header's bottom margin only when
the header really is the whole card — a blanket `margin-bottom: 0` left those
captions flush against the label above them.

An all-clear and a completion line make the **same claim**, so they wear the
same format: `.iv-strong-line`, uppercase mono at 11px in #50F88A, no icon.
`_allGood()` used to draw a green circle-check with sentence-case text in
`.iys-all-good-inline` — the last of the legacy `iys-` styling inside this
section, and the reason "Localization looks strong for your target markets" and
"YOUR STORE PAGE IS LOOKING GOOD" looked like two different kinds of statement.
(`.iys-all-good-inline`'s rule in style.css now has no live consumer.)

**The carousel nudge answers an answer, not a click.** `_impAfterSelect`
(app.js) pops the circle you pressed; the glint on the *next* one is reserved
for `_impQueueResolve`, called only from the four actions that actually resolve
something (apply, accept-edited, keep, and Binary's "Got it"). It used to run on
every carousel press, so merely reading suggestion 2 lit up suggestion 3 — a
"keep going" shown to someone who had not done anything. The target is the next
unresolved circle **forward from the one answered, wrapping**, not the first
unresolved in the row: answering #3 with #1 still open points at #4, because the
eye is already at #3.

The glint changes **only light**, on a sine (`cubic-bezier(.37,0,.63,1)`). The
first version scaled the dot to 1.18 and threw a 7px ring out of it, which on a
28px circle reads as a control demanding a press rather than as a hint.

**But the light it changes is FILL AND INK, never opacity — and read this
before touching either animation.** The bare `.improve-v2 .iv-tab` rule says
`opacity: .2`, and it is a decoy: every carousel that renders is inside
`.imp-list.iv-blueconfirm` (see the `return` of
`buildImproveSubmissionSection`), where the modifier resets the tab to
`opacity: 1` and carries all four states in `background` / `color` instead —
resting is white **5%** fill with white **35%** text. Both animations were
written against the decoy and so did the exact opposite of what they meant:
each drove the one circle it was pointing at *down* to opacity .2 and a
transparent fill. Twice, because the second was "fixed" by measuring a probe
built without the `.iv-blueconfirm` wrapper. **If you measure a carousel tab,
put it inside `.imp-list.iv-blueconfirm` or you are measuring dead CSS.**

- **The one-shot glint** (`tabNextGlint`, 900ms) runs 5%/35% → 28%/white →
  5%/35%. 0% and 100% must *be* the resting fill, because the class is stripped
  on `animationend` and anything else jumps.
- **The persistent breath** (`_impBreatheNext()`, app.js) is the opposite case
  and takes the opposite floor. It marks the next open circle for as long as it
  is next, and a curve returning to rest spends half of every cycle
  indistinguishable from the dots either side of it — the dot reads as
  *dimming*. So its floor sits **above** resting: 12%/60% → 28%/white, measured
  against a neighbour's 5%/35%. It is lit the whole time and the sine only says
  how lit.

(`startTime = 0` still puts every rebuilt node on one phase; note that writing
`currentTime` to sample it recomputes `startTime`, so a probe cannot check both
at once.)

**Every control in a card is 30px, and the sum has to be integral.** `.imp-cta`
was `line-height: 1.2` on 12px — 14.4, so the pill measured **30.4**, and a
fractional box straddles the device pixel grid: two identical buttons painted a
pixel apart purely from the y they landed on, which is what looked like "some
are 28 and some are 29". It is 16px of line-height + 6 + 6 of padding + two 1px
borders = 30 exactly, which is also `.iv-undo`'s and `.iv-code-copy`'s size. The
footer's own override (`min-height: 39px`) is unaffected. Retune it if you like,
but keep the total a whole number.

**Four bugs worth not repeating.** A `contenteditable` inside a `<button>`
cannot take focus, so the edit pencil did nothing — the boxes are `<button>`
while they are a choice and `<div>` once they are an answer. `focusout` does not
fire reliably here, so the save button commits directly instead of blurring and
hoping. `tabNextPulse` and `impFixFloat` are referenced by the reference's CSS
and defined nowhere in it; both rules were inert until they were written. And a
stroked icon at 13px on a 24-unit viewBox scales to about one device pixel —
the revert arrow was present and invisible, and is a filled path now.

### The step modal has no lines

The shell is `renderStepModal()` (render.js) and its `.submit-modal-*` rules in
style.css. Four changes in v6.11, all of them taken from the questionnaire
prototype's Improve modal rather than invented:

- **The header and footer draw no borders.** A modal that rules a line under its
  header and over its footer is three stacked boxes; content dissolving into
  them is one surface with more of itself above and below. The line is replaced
  by `.submit-modal-fade-top` / `-bottom`, absolutely positioned over
  `.submit-modal-body-wrap` (the scroller's new parent — it took the flex sizing
  so every rule that targets `.submit-modal-scroll`, `.submit-modal-mac-spp`'s
  included, still applies).
- **A fade only shows while there is more content that way.** `_smModalFades()`
  (app.js) toggles `at-top` / `at-bottom` and is re-armed after *every* render,
  because the modal is rebuilt with innerHTML and the old scroller's listener
  goes with it. Two traps it already pays for: **a taller content is not a
  scroller** — the Mac Product Page Preview hands scrolling to `.mac-spp-main`
  and leaves this element `overflow: hidden` with tall content, which pinned the
  bottom fade on and washed out the footer nav, so the overflow is asked before
  the heights; and the wrapper ships with **both classes already on** so a short
  body never flashes a fade on its first paint.
- **The glyph wears no well** (`.submit-modal-hicon`), exactly as the platform
  cards dropped theirs in v5.72 and for the same reason. The 40px slot stays so
  the title column cannot shift between platforms; the glyph is sized in CSS at
  34px, never by `platformIcon()`'s size argument.
- **The × is the platform card's gear**: 30px, no border, 8px radius, bare until
  hover, then `--surface-hover`. Changed on `.task-modal-close` itself, so all
  five modals that use it close the same way.
- **The footer button is the app's pill.** `.imp-cta` was unscoped from
  `.improve-v2` — it is the onboarding "Continue" pill, and the step modal wears
  it too, so it cannot live inside one section's namespace. Improve's variants
  (`data-imp-act`, `.iv-bin-actions`) stay scoped and still outrank it.

The base modal is **680px** (638 of content was crowding its own padding); the
wide variants are sized by what they hold and did not move. `.step-modal-group
.submit-modal`'s flex-basis has to track that number.

**Content Rating went up a size with it.** It was the densest type in the app —
13px questions, 11px section headers, 9px tooltip handles, and answer pills at
10px/700 uppercase with 0.8px of tracking — and it is the step read most
carefully, because every row is a legal declaration. Now: question 14, section
header 12, pill 12/500, handle 10 in a 16px disc (scoped to the question row;
`.tooltip-icon` is app-wide and stays 15/9 elsewhere).

The pills read **"Yes" / "No" / "Frequent"** without a single markup change:
`text-transform: lowercase` on the button, `::first-letter { uppercase }` over
it. CSS cannot sentence-case an already-uppercase string in one pass, but
`::first-letter` is a second pass — and "YES" is written literally at fourteen
call sites (content rating plus Game Center on three platforms), one of which
would certainly have been missed by hand.

**The section headers lost their rule and the questions gained an indent.** A
line under "FEATURES" said "a group starts here" with a graphic element, on a
surface that had just lost the header's and the footer's own lines; position
says it more quietly. Questions sit 12px in (`.ios-q-label`'s padding, NOT the
row's — indenting the row carries the answer pills with it and narrows the row,
where this leaves them anchored 88px from the right edge, and leaves the amber
validation rail on the row's own edge, 12px outside the text). The header's
margins absorbed what the border was holding up: 22/10 for 20/8 plus 5 of
padding-bottom, or it lands flush on its first question. Measured: header at 24,
both question families at 36, pills at 88 from the right.

Rows sit **8px** apart and the pills inside a row **6px** (both `.question-yn`
and `.intensity-group`, which were at 4). At 6 and 4 the two rhythms were close
enough that a row did not read as one unit. Costs 32px of scroll on the whole
step and no row per screen.

Their widths are held equal by hand, and the padding is the lever: **yes / no /
none all measure 52×32**, with `min-width: 52` doing the deciding and the
horizontal padding (13 for `.yn-btn`, 10 for `.intensity-btn`) pulled in far
enough that no label overshoots the floor. Those two numbers track the type —
change the size or the weight and they have to be re-measured, which is what
happened twice in one afternoon here.

**The filter travels with the list it filters.** The Unanswered / All switch
and the "Shipmate inferred X of Y" line are read against the rows below them,
and thirty rows down both had scrolled away. They are now one `.cr-pinned` bar,
`position: sticky` — sticky rather than moved into the modal's header, because
this section also renders inline in Game Details' Content Questions pane, where
there is no header to move it into.

Four things that bar had to be taught, all of them measured:

- **Sticky measures from the MARGIN box.** With the scroller's own top padding
  still in place the bar came to rest 6px below the scrollport and rows slid
  through the strip between it and the title. The scroller now gives up its top
  padding whenever a pinned bar is present (`:has(.cr-pinned)`) and the bar pays
  it back as padding of its own — opaque, so nothing can leak through, and the
  gap above it is identical at rest and pinned (11px, or 17 from the title).
- **Its padding is one number** (7px). The selected half is a filled pill
  against the box's edge, so the gap around it reads as a frame; 6 top/bottom
  against 12 left made that frame twice as wide on one side.
- **The radii nest**: 13 on the selected half, +3 of track padding = 16 on the
  toggle's own rail, +7 of box padding = 23 on the bar. Each curve concentric
  with the one outside it.
- **The fade hangs from the bar's bottom edge** (`.cr-pinned::after`, 36px) and
  the modal's own top fade is switched off while a pinned bar exists. A fade has
  to be longer than what crosses it — a row is 34px — so the first try at 18px
  did most of its ramp in eight and read as a hard cut with a smudge on it.

The toggle is a **segmented control, not a nav**: no separator between the two
halves (a rule down the middle made them read as two adjacent buttons), both at
32px so they match the answer pills they sit above rather than the sub-tabs they
borrow their markup from, and a filled track behind the pair. The line beside it
is printed in **both** views — only the half that asks you to do something
changes ("review the rest" → "12 inferred by Shipmate") — because the count is
the reason to read the list carefully, and because a line that vanishes changed
the bar's height under the pointer.

### Violet proposes, blue confirms — now stated in tokens

The rule was written in "Colour has meanings" and the CSS had drifted off it in
both directions. v6.13 makes it one pair of tokens that two surfaces read:

```css
--pill-ai-bg / --pill-ai-color        /* Shipmate put this here */
--pill-on-bg / --pill-on-color        /* you confirmed it */
```

An **inferred answer** in Content Rating used to be the selected pill at
`opacity: .5` with a white ✦ hanging off its corner. Half a tone is the app's
word for *disabled* and for *not selected*, and this is nearly the opposite —
the answer IS in, it just came from Shipmate. The dimming needed the ✦ on top to
explain what the dimming meant: two marks for one fact. It is now the violet
fill, at full opacity, and pressing it turns it the selection blue.
`_platformAIBadge()` is a no-op stub rather than deleted — a dozen row builders
across four platforms call it.

A **Store Page suggestion** in Improve was three stacked gradients, a pink
gradient stroke, hover bubbles and a `brightness(1.3)` — and in a *different*
violet from the answers, which make the identical claim. Same flat fill now. Its
chosen state was violet too (so one colour meant both "proposed" and "picked");
it is blue.

**Two numbers, because there are two facts.** The pinned line's count of what
Shipmate inferred must not shrink when you agree with an answer — provenance
does not expire — while the review queue must. `confidence` in the answer meta
is the tell: only inference writes it, and the human-confirm path spreads the
existing meta rather than replacing it, so it survives; an answer you typed gets
a meta entry but never a confidence, which is what keeps your own work from
being credited to Shipmate. The count of violet pills (`_platformAIClass`, the
same test that paints them) is the part that counts down. Before this, the line
read the filter's snapshot — which is deliberately re-taken every time you press
"Unanswered" — so answering five questions yourself and pressing it turned
"12 inferred" into 17.

### The destination rides the VERSION row

**Shape 4, and the one the section below predicted.** The picker is back in the
release block — but not on a row of its own: it sits in the FIRST row's value
cell, hard right, beside the build it routes. The row already ended in empty
card, so the destination now costs **no vertical space at all** and the block
stays the two lines it has been since shape 2. Measured on a 418px card: label
at 21, facts at 97, picker 160×30 with its right edge at 21 — the same box, to
the pixel, as the Upload Build pill two rows down.

It wears **`.submit-track-pick`, the same class it had in the Submit row**, so
its 160×30 is one rule in one place; there is no second sizing rule to drift.
`.rel-value--pick` is all that is new — the cell becomes a flex row, the picker
is `flex: none`, and the text takes what is left.

**It breaks, it does not clip.** The grid is `minmax(320px, 1fr)`, so at the
narrow end the value cell has ~200px and the picker alone wants 160 — there is
no arrangement where "v1.0 BUILD 42" also fits. Shrinking the text to make room
turned the build number into "4…", and a clipped build number is worse than a
second line, because it is the one fact on the row nobody can reconstruct. So
the line holds a floor of `min-width: 120px` and the picker **wraps under it**
when the card cannot seat both (measured: one 30px row at 418 and at 420, two
rows totalling 50 at 360), with `margin-left: auto` keeping it on the same right
edge either way. The ellipsis stays only as the last resort.

The Submit row keeps **nothing** of it — `trackPicker` there is now the empty
string. A value in two places drifts, which is what shape 1 was punished for.
The cost, paid knowingly: `submitStepClick`'s gate 3 now spotlights **up** the
card rather than at its own row. That works because
`.active-card.is-spotlight .card-release-block:not(:has(.is-spotlit))` already
existed — the block stays lit when the lit thing is inside it (measured: card
rows at .18, block at 1, chip `is-spotlit`).

Three earlier shapes and why each went:

1. **A pill in the release block.** An empty "Select track" spent a row of a
   status card asking a question, and `submitStepClick`'s third gate had to
   spotlight it — a prerequisite you could only satisfy by finding a ghost
   control elsewhere on the card.
2. **Three inline pills**, grown by the row when Submit was pressed. They
   overflowed the card at App Store label lengths, and they only existed after
   every other step was done, which made the last decision the least reachable.
3. Labels **"TestFlight / internal"** → **"TF (internal)"**: measured, the chip
   leaves 114px for the label and "TestFlight (Int)" needs 115. One pixel.

Nothing is preselected, here or anywhere — the destination is a decision, and a
silent default would make it on your behalf. Gate 3 now spotlights the chip in
its own row, so the row points at itself.

4. **The chip in the Submit row** (shapes 1–3's successor, and what shape 4
   replaced). The tension it never resolved: a Submit button should
   *celebrate*, and that one also asked a question, so the picker and the act
   of sending competed for one row. Shape 4 is the resolution this file
   predicted — the destination back in the card's chrome, Submit reduced to the
   single confident act.

**`.rel-track`'s rules in style.css are still dormant — do not sweep them.**
Shape 4 did NOT revive them: it reuses `.submit-track-pick` instead, because
that is where the 160×30 already lives and duplicating a size is how two copies
of a control start to disagree. `.rel-track` remains the older, pulled-left
ghost-pill treatment from shape 1. Keep or delete it deliberately, not by
sweep.

Still missing, and wanted by every shape so far: a Submit step with a body that
states what each destination implies, since they are different review paths
with different waits.

### After Submit: four phases, in each store's own words

`buildSubmittedCard()` (render.js) draws the card's back face, and the phase it
is in lives on `state.platformFlipped[pid].phase` — one of
`STORE_REVIEW_PHASES` (`in_review` / `accepted` / `live` / `rejected`). Older
submits wrote only `{track, time}` and read as `in_review`, so nothing needed
migrating. Before this there were two faces: amber IN REVIEW, and green LIVE
for Web only.

**The words come from `STORE_REVIEW` in state.js, verified against vendor docs
on 14 Sep 2026** — three of those strings are ones the internet gets wrong.
Apple's `AppStoreVersionState` is deprecated in favour of `AppVersionState`,
which renamed READY_FOR_SALE to **READY_FOR_DISTRIBUTION**; Apple says
**Accepted**, never "Approved"; and it is **Pending Developer Release**, not
"Waiting for Developer Release".

**`accepted` is its own phase because all three stores stop there and hand the
release back to you** — Apple with a *Release This Version* button, Google with
*Publish changes*, Steam saying outright that "Approved titles will not release
themselves". The pattern the card copies: the state names the approval, the
line names the obligation, and the verb is the developer's.

**Amber moved, and that is the design decision to argue with first.** IN REVIEW
used to wear the amber gradient, so the card shouted for days about a state in
which there is nothing to do. Under the app's own colour rule — green done,
amber *this needs you*, red wrong — a wait is none of the three, so `in_review`
is a flat panel grey and amber went to `accepted`, the one phase actually
waiting on the developer.

**A day counter needs days to count.** Apple's verified figure is "90% in less
than 24 hours", so `REVIEW_DAYS`-style arithmetic printed "Day 1 of 1", which
reads as a bug. Under two days the store's own claim goes in that slot instead
("Usually under 24h"). Android counts to 7, Steam to 5.

**ONE TABLE FOR HOW LONG, AND IT IS MARK'S.** `STORE_REVIEW` shipped with a
`days` per store and for one day the app had two answers to the same question:
`OB_PLATFORM_TIMING` (render.js:352, Mark Grimm, v0.58) already fed the Release
Timing panel, the dashboard timeline and the calendar's workback, so the same
submission came out a different length depending on which surface you read it
on. `STORE_REVIEW.days` is gone; `buildSubmittedCard` reads
`OB_PLATFORM_TIMING[pid]` with iOS's number for `macos` (it is App Store review)
and 0 for `web` (a deploy has no review). The vendor claims that justified the
old numbers survive where they belong — as **copy**: Apple's "90% in less than
24 hours" is a sentence in the card, not arithmetic.

**Mark's numbers are fractional (2.2 / 4.3 / 7.1) because they are averages**,
and two things follow. `setDate(+2.2)` silently truncates to 2 — the quiet kind
of wrong, it looks fine and is a day short on every platform — so the card uses
`_addDays`. And **whoever rounds must round the same way**: a calendar cell is a
whole day, so its decision item is `Math.ceil(days)` off the send date; adding
the raw 2.2 in the card put "Est. live" on Sep 15 against the calendar's Sep 16,
one submission with two dates on two surfaces you can see at once. Both ceil
now — verified matching on all three stores.

Two things left deliberately visible rather than tidied away:

- **Steam's `rejected` label is the only string with no vendor source.**
  Steamworks documents no rejection state and no withdrawal at all — the model
  is "feedback sent" or "Ready for release".
- **The card promises an "Est. live" date that no store gives.** Apple
  publishes an aggregate percentage, Google states there is no SLA. That is
  Shipmate's arithmetic wearing the store's authority, and it predates the
  phases.

The height lock is now `min-height`, not `height` + `max-height` +
`overflow: hidden`. The old lock stopped the flipped card stretching its
siblings and also silently clipped it the moment a face held more than the
steps face it replaced — which `accepted` and `rejected` both do.

**Cancelling is a HOLD, not a dialog.** The first version opened two buttons
inside the card — which is a dialog wearing a card's clothes: it asked the
question in the place that had just been answered, and put the safe option one
pixel from the destructive one. Holding makes the gesture and the consent the
same act; there is no wrong button to land on, and letting go is the undo.
`cancelHoldStart` / `cancelHoldEnd` (app.js) own it, and while the button is
down a red sweep crosses the card and the status line becomes **CANCELING
SUBMISSION**, blinking. **The sweep IS the timer** — its duration comes from
`--cancel-hold`, set in JS from the same `SM_CANCEL_HOLD_MS` the timeout uses,
so the bar cannot finish early or late relative to the thing it measures. One
number, two consumers. Releasing early costs one class removal and no render;
only the completed hold re-renders, because only then has anything changed.
Verified: mid-hold the line reads CANCELING SUBMISSION in `rgb(255,59,118)` with
`subCancelSweep` running 1.4s; released at 300ms the card is untouched, the
estimate is back and it is still submitted; held through, `platformFlipped` is
gone and no class is left behind.

Three things the sweep learned by being wrong first:

- **No blink.** The word stepped between full and 25% opacity, and a blinking
  label reads as a fault indicator rather than as a countdown. It also competed
  with the bar: the sweep is already the clock, and a second thing keeping time
  beside it is noise. The word turns red and stays still.
- **Flat, not a gradient.** A gradient has a bright end and a faint one, so the
  bar looked like it was fading out exactly where it was still filling — it
  described its own progress twice and disagreed with itself. One even
  `rgba(255,59,120,.22)`.
- **The card's EDGE goes red with it, and the numbers are borrowed rather than
  picked.** `.submit-ready` is the only other state in this app that colours a
  card's border, and it does it with `0.55` on the border plus a `0.12` ring
  just outside; this is that same pair in the sweep's `#ff3b78`, so "the border
  is carrying a state" is one idea in two places instead of two inventions. It
  is deliberately NOT part of the timer — the sweep measures the hold and must
  stay the only thing that does, so the edge arrives at once and holds, saying
  only which state you are in. No transition had to be written: `.active-card`
  already carries `transition: border-color .15s`, which eases it in on the
  press and back out on an early release. The selector is
  `.active-card.submitted-card.is-cancelling`, three classes on purpose —
  `.active-card:hover` also sets a border-color and the pointer is by definition
  on the card during a hold, so at two classes each the two rules tie and only
  source order decides. Measured: rest `rgba(255,255,255,.08)` / no ring, held
  `rgba(255,59,120,.55)` with `0 0 0 1px rgba(255,59,120,.12)`, released back to
  rest with the card still submitted.
- **Three things GO, they do not dim** — the wait estimate and both links.
  "Usually 3 days" answers a question you stopped asking the moment you started
  withdrawing, and it sits on the same line as the word that replaced it. "Quiet
  time. Go plan your launch" and "Review what was submitted" are invitations to
  go somewhere else, offered in the middle of an act you have to stay put to
  finish — dimming still leaves them there to be aimed at, so they take
  `opacity: 0` and `pointer-events: none`. What stays at .35 is only what
  remains TRUE while the bar runs: the progress, the store's sentence, the
  dates. Measured through a full cycle: 1 → 0 / 0 / .35 → 1, and the card is
  still submitted on release.

**The steps are still reachable once sent, read only.** Hiding them the moment
they were done made the work unreachable exactly when you most want to check it:
you could not see what you had declared without withdrawing first.
`_submittedSteps` redraws the steps face's own `.ios-step-card` rows — same
disc, same tick, same columns — minus the chevron, the risk dot (a risk you can
no longer act on is just a worry) and the Submit row. Folded behind **See what
you sent**, because the card's job now is the wait, not the form.

**Same rows means the same BLEED**, `margin: 0 -12px` on `.sub-steps`, copied
from `.ios-step-cards`. A row is padded 12px inside, so a list left sitting in
the card's own 20px padding puts its discs on 33 while every other disc, label
and release value on that card sits on 21 — the rows looked indented because
they were, and a negative margin on the container is the only thing that pulls a
padded row back onto the column. The bottom `-12` is NOT copied: there the list
is the card's last child and it cancels the card's bottom padding, here the
toggle follows it. Measured against the steps face, both at 418: row left 9,
width 400, disc 21, name 55, height 50.

**The ticks go quiet in this list, and only in this list.** That looks like it
contradicts "DONE IS NOT DIMMED" and does not: that rule was written for the
steps FACE, where green marks progress against rows that are still pending, so
the contrast is the information. Here every row is complete by definition —
being complete is the premise of the list, not news about any row in it — so a
column of solid `#31DC80` discs informs nobody, and since the Release button
went green it also pulls the eye off the card's only control. Dimmed BY COLOUR,
never by opacity on the row, which is the half of the original rule that still
holds: an opacity would paint the disc through gauze and composite to a muddier
version of whatever it was, reading as the wrong colour rather than a quiet one.

**It leaves green ALTOGETHER**, and a green at 18% was the intermediate step
that showed why. Green is this app's word for done *as news* — it exists to mark
one finished thing against others that are not — and nothing here is news: the
list is by definition entirely finished work you are re-reading. A faint green
still made the claim, just quietly, and still competed with the Release button,
which is now the only green on the card and should stay that way. So the disc
takes the PENDING disc's own soft white fill and the tick goes white at 60%,
which is the informational register the colour rule reserves for exactly this.
Measured across all three: pending `rgba(255,255,255,.07)` with a `.42` number,
steps-face done `rgb(49,220,128)` with a `rgb(15,42,26)` tick, submitted list
`rgba(255,255,255,.07)` with a `.60` tick.

**The toggle comes BEFORE the thing it toggles.** It sat after the list, so
opening pushed it down by the list's whole height — you pressed "See what you
sent" and the button fled from under the pointer, landing four rows lower as
"Hide what you sent". A control that moves as a result of being pressed makes
its own second press a hunt, and on a disclosure the second press is the
likeliest next thing you do. Above it, the list unrolls into space the button
never occupied; measured, the toggle's `top` is identical before and after
(334.3 → 334.3, moved 0).

It also stopped wearing `.ios-step-card--inline`. That modifier belongs to the
*modal's* inline lists and says `cursor: default` plus `background: transparent
!important` on hover — so rows that DO open something had no pointer and no
hover pill while claiming to be the same object, and the `!important` quietly
ate a `.sub-step:hover` written to put the fill back. Wearing the plain row
there is nothing to put back.

It said *Review what was submitted* first, and "review" was wrong twice:
reviewing is what you did BEFORE pressing Submit, and the word is already taken
on this very card — the STORE is the one reviewing. It is also **not violet**:
violet is the guide's, and on this card it belongs to the one link that sends
you somewhere else (the Marketing nudge). This opens in place, so it wears the
card's own `--text-dim` and brightens on approach, and carries no arrow —
an arrow means elsewhere.
Opening one goes through `openSubmittedStep`, which sets
`state.stepModalReadOnly = pid` for that visit; `closeStepModal` clears it on
every exit, so no path can leave a modal locked behind it.

**The banner IS the Content Rating bar**, because it is the same kind of object:
a strip above the step's body that says something about the whole of it. They
appear in one modal at once — open Content Rating from a submitted card — and
were two different boxes, this one at white 6% with an 8px radius, 11px type and
a 28px inset against the bar's 15% fill, 18px radius, 12px type and 24px. Four
points of difference for one claim. The width is the tell and it is **24, not
28**: `.cr-pinned` bleeds `-24` out of the scroller and pads 24 back, so the bar
lands on the scroller's content column, while this note lives OUTSIDE the
scroller (a sibling of `.submit-modal-body-wrap`) and has to reach that column
through the modal's own box. Everything else is `.cr-pinned-bar`'s, copied
rather than approximated — including the inset 1px ring instead of a border, for
the reason written there. Measured: both span 422.5 → 1052.5, 630 wide.

**Two things it does NOT copy.** The radius is the ANSWER PILLS' `--field-radius`
(8), not the bar's `+10`: that +10 exists so the bar's curve stays concentric
with a track at +3 wrapping a pill at +0 — three nested boxes — and this wraps a
line of text, so the arithmetic does not apply and at 18 it bowed out beside the
8px `.yn-btn`s below it. And its vertical margin is symmetric (10/10) where it
used to be `0 … 10`, flush against the header and clear of the body, which read
as something the header had grown. The POSITION is right and stays: outside the
scroller, because this is a statement about the whole modal and must not scroll
away, where `.cr-pinned` is about the list underneath it and sticks with it.

**It is a POINTER
lock, not a permissions model** — one class on the scroller plus a banner rather
than `disabled` on every control, because the step bodies come from a dozen
builders across four platforms and teaching each of them a second mode is how
they drift. A keyboard can still reach a field. Right trade for a prototype,
wrong one for a product.

**Submitting turns the guide into the month.** `_doFinalSubmit` sets
`state.guideCal = true` and `monthOffset = 0`, because pressing Submit answers
the question the checklist was asking and replaces it with a different one — not
"what is left to do" but "when do I hear back, and what until then" — and the
month is the surface that answers it. Set ONCE, at the moment of the event,
never derived from "is anything in review": derived, it would drag you back onto
the calendar every time you closed it for the next three days. `renderDashboard`
does **not** rebuild the guide column, so `renderGuide()` has to be called by
name or the face change lands on the next unrelated repaint. `smCardState`
copies the same two lines, or the face would only be reachable by walking every
step for real.

`_guideCalLede` is the why, printed above the month name — a surface that
changes under you without saying so is a glitch. It names the store, the date an
answer is expected (in the wait's own yellow, so the sentence and the band below
it are visibly one fact) and the one thing worth doing meanwhile, in violet with
an arrow, the card's rule for a link that leaves. It exists only while something
is `in_review` and is **not dismissible**: it is not a notification, it is the
state of the month you are looking at, and it leaves on its own.

**The wait note only exists during the wait.** It was gated `!isYours && !isBad`,
which let "Usually 3 days" survive into `live` — beside READY FOR DISTRIBUTION,
on a build that was finished and on sale. It answers "how long will this take",
and past the decision that question has no referent.

**The phase action is the STEP ROW's box, not a pill.** Release This Version is
the last act of the whole submission and the only control on that face, and it
wore `.imp-cta` — 30px, left-aligned, identical to the "View fix" button three
screens away. It is 400×50 at radius 8 with the rows' ±12 bleed now, measured
equal to a real `.ios-step-card`: the row that used to say Submit is replaced by
a row that says Release, same place, same size.

**And it is SOLID GREEN, both halves of which were argued.** Solid, because a
14% wash is what a state wears in this app, not a button — the first attempt
filled it with the phase's amber at 14%, which over the card's `#141414`
composites to `rgb(53,43,32)`, a muddy brown panel with a word in it. It had
been asked to look "like a step row being hovered", and that was the wrong
reference: a hover fill is faint on purpose because it only means "you COULD
press this", where this is the one thing there is to press. Green although the
phase is amber, because the two say different things — amber is the STATE, and
the card already prints it twice (PENDING DEVELOPER RELEASE, plus the 5% wash),
while the button is the act that ENDS the state, and finishing is green
everywhere else here. The known risk is that green also means *already done*, so
a faint green would have read as a finished thing; filled `#2fdc80` with `#08140d`
ink is the app's shape for a call to action, and nothing merely done is ever
painted that way. `is-bad` keeps its faint magenta on purpose — READ THE NOTES
is not a celebration and must not be dressed as one.

**It takes the STEP ROW's type and the step list's full bleed**, because the box
is already claiming to be a step row and half-measures showed. It shipped with
`margin: 0 -12px` and 13px mono at `.06em` in small caps, which measured 9px from
each side but **21 from the bottom** — the sides are pulled out of the card's
20px padding while the bottom sat inside all of it — and read thin and stretched
beside a `.ios-step-name`. `.ios-step-cards` solves the first with a third margin
value, so this takes the same `0 -12px -12px` and lands on the list's own 9 / 9 /
9. The family was never the difference (both are IBM Plex Mono); size, tracking
and case were, so all three go back to the row's — 15 / normal / none — and the
label keeps its sentence case, which is what the stores actually call these
buttons ("Release This Version" is Apple's, verbatim). Measured identical to
`.ios-step-name` on all five properties.

**The gear still turns the card over from here.** Reaching settings while a build
is out is the same want as reaching them while you are filling the form, so the
submitted face routes to `platformGearFromSteps` like the steps face does —
verified rotating out of the submitted card and landing on the account face, and
"Back to steps" returning to the submitted card with its disclosure still open.
The flip is correct on that button precisely because it IS a reverse: the same
press, reversed, brings you back to exactly what you left.

**It is the LAST thing in the card**, because on the other face it already is:
the steps list ends in the Submit row, and Release is that same object seen from
this side. One shape serves both faces — the facts at the top, everything you
read in the middle, the single act at the bottom. It used to sit above "See what
you sent", which made the quiet link read as the card's conclusion. The
read-only steps are reference, so they belong in the middle with the other
things you read. The cost, paid knowingly: opening the list pushes the button
down by the list's height — which is NOT the bug the toggle had, where the
control you pressed fled from under your own pointer and made its second press a
hunt. Here a different control moves as an ordinary consequence of a list
growing, exactly as a Submit row sits below a list that gained a step. Verified
order, collapsed and expanded: head, release block, segbar, state, note,
toggle, [steps], action — `lastElementChild` is the button either way.

**SUBMITTING DOES NOT FLIP THE CARD — IT CLOSES IT.** Read this before reaching
for `rotateY` in `_doFinalSubmit` again.

The flip is already spoken for, and it means one specific thing: **the other
side of this card**. The gear turns the card over to the account/connect face,
the same gear turns it back, and nothing has changed in between — a reversible
look at the reverse of the same object. Submitting is not that: the card moves
FORWARD into a state that costs a 1.4s hold to undo. Turning something over to
say it has advanced spends the "look at the back" gesture on a change of state,
and then the two cannot be told apart.

That overload had already produced a measurable bug, which is how it was caught.
`_platformHeadActions` branched only on `steps` vs everything-else, so a
submitted card fell into the ACCOUNT arm: its gear came out **lit** (`--active`,
the highlight that means "you are inside a temporary, reversible view") with the
tooltip **"Back to steps"** — the card announcing itself as a settings detour you
could reverse with one press, on the one face where going back is a withdrawal.
Submitted now shares the STEPS arm (both want a way to the account); the alert
dot is kept for `steps` only, since nagging about an unconnected account after
the build has gone points at a door that has already closed.

The motion is vertical: the steps go and the box closes over the space they
occupied, from the steps face's height to the submitted card's own, measured
both ways in JS because only JS knows them. `cancelSubmission` is the same
mechanism run the other way — the box OPENS and gives the height back — so the
two cannot drift into different curves, which two hand-written rotation blocks
120 lines apart were already halfway to doing.

Three details that are load-bearing:

- **The header and the release block are excluded from the fade**
  (`.active-card.is-advancing > *:not(.active-card-head):not(.card-release-block)`).
  They are identical across both faces, and fading what did not change is what
  makes a swap look like two cards trading places instead of one card losing its
  list.
- **`overflow: hidden` is set and then CLEARED.** It makes the close read as a
  close rather than as content spilling past a shrinking frame; left on, it
  would clip a card that later grows — which "See what you sent" does by 216px.
- **There is no out-phase.** Nothing needs animating away: the header and
  release block survive the swap, and the steps are precisely what the closing
  box removes.

`state.platformFlippedCardHeight` went with the rotation. It pinned the new card
at the OLD card's height so the flip did not end in a jump, and was written and
deleted in four places while no render function ever read it. Here the height
change IS the animation; pinning it would pin the thing being animated.

Verified by sampling every 55ms: submit 376 → 231.3, cancel 231.3 → 376, both
interpolating smoothly with `transform: none` at every sample, every inline
style cleared and `is-advancing` removed at the end. The gear's own flip still
rotates, "Back to steps" from the account face lands back on the submitted card,
and expanding the steps afterwards grows the card to 447.3 with all four rows
21px clear of its bottom edge.

**To see any of it:** `smCardState(pid)` (app.js) cycles the four phases 2.5s
apart, `smCardState(pid, 'accepted')` holds one, `smCardState(pid, 'off')`
returns to the steps face. It writes the same state a real submit writes, so it
is the real card, not a mock. These faces went a long time unexamined because
reaching them took every step, an account, a track and a press.

### The guide's other face is the month

`buildGuideMiniCal()` (render.js) replaces the tab's checklist inside the same
`.guide-card`, picked by `.guide-faces` — a two-icon segmented control beside
the collapse chevron, its `right` derived as `14 + 26 + 4` so moving one moves
the other.

**IT IS A SEGMENTED CONTROL, NOT A TOGGLE BUTTON, AND THE DIFFERENCE IS
LOAD-BEARING.** It was one 26px icon button that flipped `guideCal`, which is
the right shape for "do a thing" and the wrong one for "pick which of two things
you are looking at" — the card has two faces and only one of them was ever
named. Two halves in a dark track now, the same language as Content Rating's
Unanswered/All: a groove at black 22%, the picked half lifted out of it in the
guide's own violet at 26%, no separator down the middle, radii nesting 7 inside
10.

**The halves SET, they do not flip** (`setGuideFace('list'|'cal')`, app.js).
Pressing the half that is already lit must be a no-op: a toggle there turns the
face OFF, so asking for Checklist while on Checklist would land you on Month,
which reads as the control breaking. `toggleGuideCal` still exists because
`_doFinalSubmit` really does mean "flip", and both now run through one
`_applyGuideFace` so the month-offset reset lives in a single place.

**TWO ICONS, NOT TWO WORDS, and the width is the reason.** The inner column is
254: the eyebrow is 16px uppercase mono and "SHIPPY GUIDE" eats ~115 of it, the
chevron takes 26 plus its gap. Labelled halves did not fit that row — they were
built, measured, and needed a row of their own at 124px a half, costing ~34px of
card height on BOTH faces (445.8 → 497.8). Two 26px icon halves make a **60×32**
track that drops straight into the space the single button already had, so the
control gains its second state for nothing. Measured: track at right 45, 4px
clear of the chevron, the eyebrow's ink ending 50.8px short of it.

**The glyphs are 16 and 15, not both 16.** The list mark is strokes with air
between them, the calendar mark is a filled block; at one size the filled one
reads heavier. Same reason the single button sized its calendar at 14 against a
stroked box's 13.

**The collapse chevron survives, and killing it was on the table.** It is worth
saying no to explicitly: `toggleGuide` is the only door into the collapsed rail,
so removing that button does not tidy a control away — it deletes a feature and
strands the rail's own expand arrow where nobody can reach it.

**Neither of those two wears a stroke, and nothing in this app's micro-buttons
should.** `.active-card-settings` (the platform card's gear) and
`.task-modal-close` (every modal's ×) are both `border: none` on a transparent
ground, bare until the pointer arrives and then a soft fill — that is the
pattern. These two shipped with a 1px violet outline AND a permanent fill,
which made the guide's chrome the loudest thing on a surface whose whole job is
to be read. The hue stays violet because it is the guide's own; only the
outline and the resting fill went. The `is-on` state keeps a fill, because
*pressed* is the one state that earns one. The add row's `+` follows the same
rule; the text field beside it keeps its border, because an input is not a
micro-button — it has to show where you can type before you go near it.

**The month half wears the app's own calendar mark**, `SM_CAL_SVG` in state.js —
the same art as the topbar's Calendar tab, verified identical path. It is a
FILLED 82×75 glyph, not a stroked 24-unit one: at this size a 1.8 stroke is
about one device pixel and the little date squares inside disappear. It is
sized 14 rather than 13 because a filled mark carries more ink than the stroked
box it replaced and needs a touch more room to read the same size as the
chevron beside it. **`index.html` holds a literal copy** inside `#nav-calendar`
— that button is static markup with no JS at parse time — so this is the one
symbol in the app that is knowingly twinned. Change the art in both.

**Submitting now puts something on the calendar — it never used to.** You could
send a build and the month would still be telling you to send it, because
`_calItems` derived its submission items purely as a **workback from the target
launch date** (`Submit to the App Store`, `Math.ceil(days × 2)` before launch)
and nothing anywhere read `state.platformFlipped`. Now a plan item becomes two
facts the moment it really happens: the planned `submit-<pid>` is **suppressed**
for any platform already sent, and in its place go `sent-<pid>` on the day it
went and `decide-<pid>` on the day its store is expected to answer. Both come
off `OB_PLATFORM_TIMING`, the same table the workback leads with, so plan and
fact cannot drift. Phases past the wait (`accepted` / `live` / `rejected`) print
no expected date — they have had their answer.

**The wait is a span, not two dots.** A submission is two dated facts — the day
it went and the day an answer is expected — and the days between them belong to
it just as much: they *are* the wait. Two lone dots made the month say
"something on the 13th, something on the 16th" when what is true is "the App
Store has had this since the 13th". So every day from sent through
expected-decision carries `in-span`, and only while the platform is still
`in_review` — once a store has answered there is no wait left to draw.
Overlapping platforms make **one** band: the question a glance asks is "am I
waiting on anything today", not "on how many".

Three things the band had to be taught:

- **It is a `::before`, not the cell's background.** The cell carries the week's
  rule as a `border-bottom`, and a background paints *under* that border and
  dulls it. The pseudo-element is inset 5px top and bottom so the stroke clears
  both rules and reads as something laid ON the table rather than as a coloured
  row of it.
- **`z-index: 0` on the band and `1` on the cell's children.** A positioned
  pseudo-element beats static content, so without that the band painted over
  the digit.
- **Rounded ends, square middle, and a ROW EDGE counts as an end** — the band
  cannot flow from Saturday to Sunday, it starts again on the next line. That is
  what the `i % 7` tests are doing, not arithmetic on dates. Verified on a span
  that crosses a week: two starts, two ends, one run per row.

**COLOUR IS THE ITEM'S STATUS, NOT ITS ORIGIN — and it was the other way round
until v6.26.** `CAL_KIND` carried a hue each, borrowed from the top-level tabs:
Submission green `#4ADE80`, Marketing yellow `#FACC15`. The submitted card, three
inches away, colours by STATE: `#2fdc80` done, `#FFD84D` the store has it,
`#FFB86B` it is back with you, magenta rejected. Two vocabularies, the same two
hues, on two surfaces you can see at once — the month said "green = this came
from the Submission tab" beside a card saying "green = finished", and it drew the
review WAIT, the one stretch of days in which nothing has been achieved and
nothing can be done, as a green band.

So `CAL_STATUS` (render.js) is now the only source of colour on any calendar
surface, and `_calStatus` / `_calColor` are how every one of them reads it:

| state | hue | what it is |
|---|---|---|
| `todo` | white 55% | not done yet — information, so no hue at all |
| `waiting` | `#FFD84D` | the store has it — the same constant `.sub-seg.is-current` paints |
| `yours` | `#FFB86B` | accepted, the release is yours to make |
| `bad` | `#ff3b78` | rejected |
| `done` / `launch` | `#2fdc80` | |

**The phase is stamped once, in `_calItems`,** on the `sent-`/`decide-` items,
because that is the only place the calendar knows which phase a submission is
in. Everything downstream reads `it.status` through `_calColor` and never looks
at `platformFlipped` again, so the month and the card cannot drift.

**The kind did not go away — it stopped being a colour and became a SHAPE.** It
is still a field, still cycled from the day panel, still what the popover and
the tooltips name; `.gcal-kind` is square for Submission and round for
Marketing, and its FILL is the item's state. That pairing is forced: the dot is
one slot, and a control whose only feedback was a hue it no longer owns would
have been unpressable. Shape says what a thing is, colour says how it is going.

What this costs, knowingly: the glance that separated a marketing beat from a
submission one. It was never legible in a 4px dot, and the day panel names every
item in words. Three follow-ons that had to move with it — the legend now lists
the STATES (`In review` / `Needs you` / `Done`, and not `todo`, because a legend
entry for the absence of a mark explains most of the month); the popover's kind
picker went neutral white, since a picker painting a colour it does not set is a
lie you can see; and the guide grid prints **one dot per STATE**, not per kind,
because a glance at a month asks "is anything waiting on me today".

**The band is `rgba(255,216,77,.13)`** — `#FFD84D` at 13%, the card's in-review
yellow to the digit, so the segment and the band are one statement made twice.
And `.gcal-dot.is-est` draws `var(--d)`, the dot's own colour, where it
hard-coded `#4ADE80` for as long as it existed: invisible while every submission
item was green, and a bug the moment they stopped being.

**An estimate is drawn hollow.** `decide-<pid>` carries `isDecision`, and a day
whose only item of a kind is a decision gets a ring instead of a filled dot
(`.gcal-dot.is-est`) — a date the app worked out and a date something really
happened on must not read as the same kind of mark. A day holding both is
filled: a fact outranks a guess.

**Launch day is the only cell that fills.** It was a 1.5px green ring, which put
it in the same register as the picked day's violet ring — two outlines
competing, and the one that matters reading as a selection. It is a solid
`#2fdc80` box now, green being the app's word for done. Today and launch day can
be the same cell; launch wins the fill (you cannot miss today, it is where you
are) and today keeps a violet ring around the outside so the coincidence still
shows. The launch date itself is `state.formData.releaseDate`, Mark's too,
pre-filled to the 29th of next month.

It is a **window onto the calendar that already exists**, not a second one. It
reads the same `state.calendar.monthOffset`, `_calItems`, `_calGridStart` and
`CAL_KIND` as `buildCalendarMonth`, so the two can never disagree about what is
on a day, and `_calRerender` already repainted the guide. Weeks start on Sunday
because the full calendar does — the reference it was drawn from (Notion)
starts on Monday, and matching it would have put two week starts in one app.

**The grid takes 16px back from the card's padding**, 8 a side (`margin: 0 -8px`
on `.gcal-grid` only, so the month name and the day panel keep the card's real
text column). The card is padded for prose and this is a table: 254px over seven
columns was 36.3 a cell, and 270 makes it **38.3** — the ~2px a day that lets
the number, its disc and the rule under it stop touching. Measured: grid 268
wide, sitting 11 from each card edge, discs at 25 (they were 21).

Even so a cell holds two digits and a dot and nothing else, which is why there
are no chips, no drag and no week selection — all of that is one tab away.
**One dot per KIND, never one per item**, or a day with four marketing items
grows a row of identical dots; and the 4px dot strip is reserved on every cell
so a day that gains an item does not get taller and shove its row.

**The weeks are ruled, and the CELL carries the rule** — `border-bottom` on
every day plus `:nth-last-child(-n+7)` to drop it on the last week. Seven
borders meeting edge to edge read as one line, so nothing has to be laid over
the grid to draw it. Two things that has to say out loud: `box-sizing:
border-box`, because `aspect-ratio` measures the border box and without it every
row comes out a pixel taller than the ratio asked for; and **white at .12, not
.07** — the guide's ground is a dark violet rather than the app's near-black,
and 7% over it was a line you had to be told was there.

**A row is 46px, not a square**, because a square distributes its slack evenly
and the two vertical gaps here are not the same job. The 38.3 cell held 32 of
content and so left ~3px above the number and ~3px under the dots — and a 4px
dot 3px off the rule below it reads as part of the rule. Now `padding: 4px 0
8px`, measured 4.5 from the rule above to the number and **9.5 from the dots to
the rule below**. The content is 25 (disc) + 3 (gap) + 4 (dots) = 32, so both
paddings are derived from it: grow the disc again and they follow.

**Today and the picked day are rounded RECTANGLES, not discs** — 28×24 at
radius 7. A circle round a two-digit number has to be as wide as the number is
tall and then some, so it spends the cell's width on air at the corners; 28
gives the digits room across and takes 3px of height back (5.1 of side air in a
38.3 cell). It also keeps the app's shape language: the step discs are the only
circles here and they hold ONE character. Radius 7 rather than a pill, because
the table's own rules are straight lines and a fully rounded chip beside them
reads as a tag stuck on.

With the rows ruled, **the hover moved onto that box**: a rounded fill spanning
a cell that now has a ruled edge reads as a box someone drew over the table.

**NO RINGS ANYWHERE IN THIS GRID — every state is a fill, and the order of the
rules is what arbitrates.** The picked day is declared FIRST, so any day that
already has a fill of its own (today's violet, launch's green) simply keeps it
and the selection never lands. Two rings were tried and both failed for the same
reason: an outline on a box that is already filled is two marks on one 28×24
shape — drawn *inside* it, launch day came out white-on-green and illegible;
floated *around* it, a halo in a grid of flat rectangles. There was no ambiguity
to solve in the first place: the panel that opens underneath names the day in
words. Launch + today is one green box, full stop.

Opening the face resets `monthOffset` to 0. The Calendar tab starts at 1 on
purpose — it is a planning surface and opens on next month — but a glance that
opens on a month with no "today" in it is the one thing this must not do. Only
on the way in, so paging here and going back keeps your place; it does move the
Calendar tab with it, which is the price of one shared calendar.

**A day opens downwards, it does not navigate.** Pressing a cell used to jump
to the Calendar tab, which is a big move for a small question ("what is on the
18th?") and threw away the month you were looking at. `_guideCalDayPanel` drops
out under the grid instead (`state.guideCalDay`, and pressing the same day
again closes it, so the gesture is its own undo). The way to the full calendar
is now a link inside that panel rather than a side effect of pointing at a
date.

**Treat the panel as the only surface there is** — that is the brief it was
re-cut to, and it is what justifies the extra controls. A row is **three
controls, not one**: the dot sets the kind, the label ticks, the × removes.
It began as a single `.mcal-task` button that only ticked, which is all the
Calendar tab's checklist needs because everything else about an item is a
double-click away in that view's popover; here the kind was unreachable and
nothing could be removed. (A `<div>` holding three buttons, because buttons
cannot nest.) The add row repeats the same three-slot shape, so the dot that
says what a thing IS and the dot that says what the next thing WILL BE sit on
one column — the kind is chosen in the same gesture as the typing.

**Two kinds of item, changed in two different places**, which is why these are
functions and not one-liners. An item you added is a record in
`calendar.custom` and is edited in place. A built-in (`CAL_RECURRING` /
`CAL_ONEOFF`) is a constant: its kind is changed by writing an **override**
keyed on the occurrence, and it is removed by writing to `calendar.hidden`.
Both maps already existed — `calDraftSave` and `calDraftDelete` write the same
two — so this reaches them without the popover. An override replaces the whole
displayed record, so `guideCalCycleKind` spreads what the occurrence is showing
and changes the one field; carrying less would blank the rest.

`_gcalRerender` is the single repaint for all of it, and it does the two things
a repaint here always has to: carry the half-typed title across (innerHTML
throws the input away) and put the caret back. `guideCalAdd` is the one caller
that wants the field emptied, so it clears it *before* calling.

**No rule over the panel.** The grid's last week already stops drawing one, so
a line there was a second ending a few pixels under the first; 18px of space
separates instead. And there is **no "Open in Calendar" link** — a way out is
not a feature of a surface that is meant to be sufficient.

Still light on purpose: no note, no repeat, no time. Those are the popover's.

**The header folds the panel; it is not an ×.** There was one, and the problem
was adjacency: it sat a few pixels above the rows' own ×, which *remove an
item*. Two of the same glyph that close together, one meaning "put this away"
and one "destroy this", is the collision worth designing out. A chevron says
fold, says it in a different shape from delete, and lets the whole header be
the target instead of an 18px box in a corner. (The header is pulled −6px and
given it back as padding, so the date still starts on the panel's text column
while its hover box overhangs the way a row's does.)

The picked day wears a **ring**, not a fill: the fill is today's, and a day can
be both. The × on a row is **bare until the row is hovered** — a delete on every
line, always visible, is a row of invitations to lose something.

### The Mac preview navigates from the top

`_sppPinnedNav(pid, elements)` (render.js) is the Mac Product Page Preview's
navigator, and it replaced `_sppFooterNav` **on that surface only** — iOS and
Mac Full still carry the footer, unchanged and still rendering.

**A stepper was the wrong shape for eight things.** The footer was PREV /
CURRENT / NEXT: it could name where you were and offer the two places either
side, so reaching Data privacy from Title meant pressing next seven times, and
the seven names in between were never on screen together. A pinned row of pills
is the whole map — every section in one press, in the page's own order, printed
along the top of the thing it indexes.

**Pressing a pill is `setStorePreviewFocus`, and that is the whole
implementation.** That function already moved focus AND scrolled
`[data-spp-el="<id>"]` into view (app.js) — the footer's arrows called it too.
So the pills needed no travel code, which is what stops this from becoming a
second navigation model that can disagree with the first. Every section already
carried its `data-spp-el`; nothing new had to be marked up.

**BOTH NAVIGATORS COULD NOT STAND.** They drive the same `storePreviewFocus`,
so a press in one silently moves the other — one list with two controls
reporting different positions. The footer call was removed from the Mac builder
rather than hidden.

**IT SPANS THE WHOLE MODAL, AND IT USED TO SPAN ONLY THE STORE.** It began as
the first child of `.mac-spp-main` — the pane that actually scrolls, since
`.submit-modal-scroll` is `overflow: hidden` on this face — stuck to its top
with `position: sticky` and made opaque so the page stopped existing at its
edge. Every one of those facts followed from where it sat, and where it sat was
wrong: a navigator that indexes the whole step was drawn inside one of the
step's two panes, so it was the width of the store column, and the product page
ran underneath it. An opaque strip sliding over a page reads as a sheet laid on
top of the thing rather than as the modal's own chrome.

It is a **sibling of `.mac-spp-shell`** now, one row of the flex column
`.submit-modal-mac-spp .ios-step-body-content` already is: it takes its natural
height, the shell takes the rest (`flex: none` against the shell's `flex: 1`),
and it sits above the sidebar and the page both. Measured on a 1000px modal:
bar 339 → 1289, which is the body's own 950px content column exactly.

**So `position` and the opaque `background` are GONE, not kept "just in case".**
Nothing scrolls past it any more, and a sticky offset on an element nothing
scrolls past is a claim the next reader would have to disprove. `top: 0`, the
`z-index`, the `--panel` fill and the "an opaque bar says there is more above"
argument all left with it.

**TWO BOXES NOW, NOT THREE.** `.cr-pinned`'s third box was the sticky opaque
strip, and it existed so the container could float without the page showing
through the gap between its rounded edge and the scrollport. With nothing
passing beneath, `.spp-pinned` is just the row's padding — the container
(`.spp-pinned-bar`) and the row of pills (`.spp-pinned-row`) are what is left.

The container is `.cr-pinned-bar`'s: white 15% fill, a 1px ring drawn INSIDE it
rather than as a border (a border clips the background to the border box and
draws the ring a pixel in, two curves that cannot stay concentric — the doubled,
blurry corner that bar was fixed for). Its radius is `--field-radius + 8`, not
that bar's `+10`: outer = inner + the gap between them, and here the pills sit
at `--field-radius` inside 8px of padding where the CR bar's track sits at +3.
Same rule, different arithmetic — copying the 18 would have bent the corners.

**The pills were re-tuned when the container arrived, and they had to be.** They
were white 6% resting and white 15% lit, which is right on the panel's
near-black — but the container IS white 15% over `--panel`, compositing to about
rgb(55,55,55), so a 6% pill on it all but vanished and the lit one matched its
own background exactly. Contrast is measured against what a thing SITS ON, not
against the surface two layers down. Resting is transparent now (the container
is the ground; a fill on every pill would be eight boxes inside a box) and lit
goes to 24%.

**THE `|` BETWEEN THE PILLS IS `.app-subnav`'s, AND BORROWING IT WAS THE POINT.**
Eight transparent labels 6px apart read as one run-on line of words — the exact
problem the Game Details sub-nav (Basic info | Languages | Distribution |
Assets) already solved, and the two rows are the same kind of object: a nav
whose resting items draw nothing and whose selected one is the only filled pill.
So this takes `.app-subtab-sep`'s answer rather than inventing a second one.
Three things came with it, all load-bearing:

- **Hidden, never removed.** `visibility: hidden` via `.is-off` on the two bars
  beside the lit pill, and — from CSS, because hover is not a render — beside a
  hovered one (`.spp-pin:hover + .spp-pin-sep` and the `:has()` twin for the one
  before). Dropping it from the DOM is what used to let a selected pill and its
  hovered neighbour meet in `.app-subnav`; keeping the box means the row never
  reflows. Measured with Screenshots lit: separators 3 and 4 hidden, 8 pills, 7
  bars.
- **It is a real glyph, so it is the GAP TOO.** `.spp-pinned-row` goes to
  `gap: 0` and the pills' own 12px of padding does the spacing. Left at 6 the row
  would have paid 6 + glyph + 6 seven times and started overflowing, which on a
  nav whose whole argument is "every section in one press" would have pushed Data
  privacy off the end. Measured after: 751 of content in 934, no overflow.
- **RE-TUNED FOR THIS GROUND, exactly as the pills were.** `.app-subtab-sep` is
  `--text-faint` at 50%, which is right on the near-black its row sits on — about
  rgb(52) against rgb(20). Copied verbatim into this container it vanished:
  rgb(70) on rgb(55). It is one white alpha now instead of a colour and an
  opacity (one lever, not two), `rgba(255,255,255,.25)`, landing near rgb(105) —
  a third of the way from the container to the pill's own rgb(160) label, which
  is the relationship the original had.
- It takes THIS row's type, 11.5px, not the sub-nav's 14: the same object drawn
  at the size of the thing it separates.

Two more things it took from `.cr-pinned` or decided against it:

- **No bleed arithmetic.** The Content Rating bar has to pull `-24` out of its
  scroller and pay it back as padding; this one is a plain child of the body's
  content column, so it is already the width it should be.
- **It scrolls sideways, it does not wrap.** A nav that wraps to two lines
  changes its own height, which moves the page under the pointer the moment a
  label grows in another language. `flex: none` on the pills and `overflow-x:
  auto` on the row are what keep that from becoming a squeeze later. The
  scrollbar is hidden, because 4px of scrollbar under a row of pills reads as
  damage rather than as an affordance.
- **The leftover width goes INSIDE the row, not at its ends** —
  `justify-content: space-between`, so the bar's own 8px of padding is the only
  margin on all four sides. Two wrong answers came first and each fixed half of
  it. The row is the full width of the container's padding box and the eight
  pills do not fill it: measured, 15px left over. Left alone it all piled up
  after the last pill — first pill 8 inside the bar, last pill 23 from the other
  edge, one number on the left and a different one on the right. `safe center`
  then split it, 15.5 and 15.5, which is symmetric and **still wrong**: the bar
  pads 8 top and bottom, so the pills sat nearly twice as far from the side
  walls as from the ceiling, and a container with one inset is a container with
  one inset. `space-between` pushes the first and last pills flush against the
  padding box and shares the 15px among the 14 gaps between the 15 items — about
  1.1px each, invisible against the pills' own 12px of padding. Measured: 8 / 8
  / 8 / 8 on all four edges, separator air 1.07 and 1.08.
  **It needs no `safe`.** With negative free space `space-between` behaves as
  `flex-start` by spec, so an overflowing row still starts at its left edge and
  the first pill stays reachable — the exact case `safe center` had to be
  spelled out for. Verified by clamping the row to 400px: first pill flush,
  `scrollLeft` 0, nothing stranded.
- **The lit pill is the app's CHIP, and still not a hue.** It shipped as a bare
  white 24% wash — the right VALUE against this container and the wrong OBJECT:
  the one selected pill in the app drawn without the masked gradient stroke that
  says "selected" on `.app-subtab`, the onboarding pills, the yes/no answers and
  the project chip. It joins that shared `::after` selector list at the end of
  style.css rather than redrawing the gradient locally — the list's own note is
  explicit that a shared selector list is the only way "the same stroke" stays
  true after the next change.
  `--pill-bw: 0px`, because `.spp-pin` declares `border: none` and its padding
  box already IS its border box (the project chip's case; getting it wrong is
  what used to paint fill on both sides of the ring). **The fill came down from
  24% to the token's 15%, and that is only safe because the stroke arrived with
  it** — the same trade `.app-subtab.is-on` made going 20 → 15 ("the stroke does
  half of it" is written there), and the same question the Content Rating bar's
  half settled by asking what it sits ON. Here that is the container at white
  15% over `--panel`, rgb(55), so a 15% pill composites to rgb(85): a 30-point
  step plus an edge. Measured: fill `rgba(255,255,255,.15)`, ring
  `rgba(255,255,255,.2)` → `rgba(255,255,255,.05)` top to bottom, inset 0,
  padding 1px. In the completed (green) bar it is rgb(72,102,86) on rgb(26,64,44)
  and still reads. Hover needs its own rule (`.spp-pin.is-on:hover`) because
  `.spp-pin:hover` is weaker and `.is-on` would override it — exactly how
  `.app-subtab.is-on:hover` is written.
  This row is still a LOCATOR, not a status: what is finished and what still
  needs work is the page's own job and it already does it with the glow. A
  second status vocabulary along the top would compete with it.

**EVERY PILL WEARS A DISC — the pending one until there is a check to put in
it.** It is the platform card's scheme wholesale (`.ios-step-num`, plus
`.is-done`), and taking the WHOLE scheme rather than half of it is what fixed
the shape this went through two wrong versions to reach.

The requirement never changed: a mark that appears when a section is finished
makes that pill wider, and in a row of eight that means the pill you were about
to press moves the moment you answer a different one — the `|`'s problem at the
other end of the same object. Version one answered it the `|`'s way too, a
reserved slot with `visibility` switched. Geometry-wise that is correct and it
is still what the numbers say (identical content width with none done and with
all of them, no overflow either way) — **but an invisible box reads as a HOLE**,
a gap in each pill where something obviously belongs. The pending disc occupies
it for real and costs nothing extra, because that geometry was already paid for.

It is also the platform card's own argument applied one surface over: a soft
disc turning green is the SAME OBJECT changing colour, where a blank becoming a
disc is a change of kind. That card dropped its empty ring for exactly this.

**So the disc now means "nothing outstanding here", and that FLIPPED what
Achievements gets.** Under the hidden-slot version the mark meant "you finished
this", so Achievements — `required: false, done: true` permanently, because
there is nothing in it to finish — was deliberately left blank rather than wear
an unearned medal among blanks. With a disc on every pill the reasoning inverts:
withholding the green would leave one section permanently pending, an item that
can never complete, which reads as a fault rather than as an exemption. Nothing
is outstanding there, so it is green. The BAR's own `is-complete` still counts
required sections only, so the aggregate claim is unchanged.

**IT LEADS THE LABEL, and that is what makes the pill the same object as the
rows it borrows the disc from.** The platform card's step rows and the guide's
checklist are both disc-then-name; trailing it made this the only place in the
app where that mark came second, so the pills read as labels wearing a badge
rather than as checklist items. Measured, the disc starts exactly 12px inside
all eight pills — the pill's own padding — one distinct offset across the row.

**ONE CLASS, NOT A SECOND GLYPH.** It shipped as a bare 11px check, a third
dialect for something this app already draws twice. Wearing `.ios-step-num`
means the pending fill, the green, the dark `#0F2A1A` check and the 38.3% ink
ratio are the card's and cannot drift from it; only the SIZE is local, through
`--pico` set to 15px on the pill's own slot. That is the documented lever for
that disc and it reaches nothing else from in there — the card's `--pico`, and
the whole text column derived from it, is untouched. The pending disc carries
NO NUMBER, unlike the card's: there the digit is the step's position in a
sequence you work through, and these eight are a map you enter at any point.
Measured: 15×15 at radius 50%, done `rgb(49,220,128)` on `rgb(15,42,26)` with
the SVG filling it at 100%.

**THE PENDING FILL IS THE ONE VALUE THIS SLOT OVERRIDES, AND THE GROUND FORCES
IT.** `.ios-step-num`'s pending is white 7%, tuned for the card's near-black:
there it composites to rgb(36.5) on rgb(20), a 16.5-point step, **and it holds a
NUMBER** at white 42%. Its job on the card is to be a legible container for a
digit, so a modest step is enough — the ink inside is what you read. This slot
is EMPTY, so the disc's own edge is all there is, and on the bar's lighter
ground (the container at rgb(55)) white 7% lands at rgb(69): a 14-point pale
bump with nothing in it.

**Dark changes what the mark MEANS**, which is the real argument rather than
contrast. A recessed well reads as "an empty socket, something goes here", where
a faint raised disc reads as "there is a pale thing here" — and the app already
owns that vocabulary: the guide's segmented control is a groove at black 22%
with the picked half lifted out of it. So the number is BORROWED from that
groove rather than invented. Measured: `rgba(0,0,0,.22)` → rgb(43) on rgb(55),
−12, and the green discs now land against sockets instead of smudges.

**The value cannot be shared, which is what makes this a forced divergence
rather than a second dialect.** Black 22% over the card's `#141414` composites
to rgb(15.6) — darker than its own ground, invisible. The two surfaces are 35
points apart, so one alpha cannot serve both. Everything else stays the card's,
and only `:not(.is-done)` is touched, so the done state is untouched by
construction (two classes, so it outranks `.ios-step-num`'s one; the done rule
is two as well and keeps winning where it applies). Verified with a bare
`.ios-step-num` probe outside any pill: pending still `rgba(255,255,255,.07)`
with `.42` ink, done still `rgb(49,220,128)` on `rgb(15,42,26)` — the override
needs `.spp-pin-tick` and cannot reach a card.

The disc is fatter than the bare check, and it costs: content went 879 → 919 in
a 934 row. It still does not overflow, but the headroom is 15px now rather than
55, so another language will start scrolling this row. That is what
`overflow-x: auto` is there for, and it is the price of one mark instead of two.

**Green is right here, and the submitted card's read-only list argues the
opposite for a reason that does not apply.** There, every row is finished by
definition, so a column of green discs is news to nobody and the ticks go white.
This list is MIXED — that is the entire point of the mark — so green is doing
what the colour rule reserves it for: one finished thing against others that are
not.

**"WE DID IT" IS A MOMENT PLUS A STATE, AND THEY ARE TWO MECHANISMS ON PURPOSE.**

The state is `.spp-pinned-bar.is-complete`, derived in `_sppPinnedNav` from the
sections themselves, so it is exactly as true as they are and it leaves by
itself if you empty a field. **The whole bar goes green, fill included.**

It shipped as the EDGE only, on the argument that the pills' resting contrast was
measured against the container's white 15% and tinting the fill would move the
ground under all eight of them. That argument was right about the risk and wrong
about the conclusion — the risk is answered by holding the LUMINANCE, not by
refusing to touch the fill — and edge-only was far too quiet to be the point of
the thing.

**So the alpha is COMPUTED, not picked.** White at .15 over `--panel` (20,20,20)
composites to 55 a channel; matching that in perceived light with `#31DC80` means
solving `20 + 157α = 55.25`, where 157 is the green's channel deltas through the
0.2126 / 0.7152 / 0.0722 luma weights. That gives **α = .22**. Verified against
the real panel: the white bar composites to luminance 55.2 and the green one to
54.5, 1.4% apart — the bar changes hue and keeps its brightness, so every pill on
it (transparent at rest, white 24% when lit) keeps the relationship it was tuned
for. If the green ever changes, redo that line rather than eyeballing a new
alpha; same discipline as the grade tabs' fills.

The ring goes green with it rather than staying the lone signal, so the two are
one statement. Measured complete: `rgba(49,220,128,.22)` with
`inset 0 0 0 1px rgba(49,220,128,.45)`.

The moment is `.is-celebrating`, and **it cannot be derived, which is the whole
reason `_sppCelebrate` (app.js) exists.** A render knows "everything is done"; it
cannot tell that from "you re-opened a step that was already done", and a bar
that sweeps green every time you open the modal is a bar whose sweep means
nothing. So the flank is detected after the paint against what was last seen —
the same shape `_impPostRender` uses to tell a grade that ROSE from a grade
merely redrawn, `undefined` guard included so the first paint never counts as a
rise. Keyed by platform, because finishing Mac must not spend Steam's
celebration. Verified in three states: still incomplete → no ring, no sweep; the
render that completes it → ring **and** sweep; a re-render while already
complete → ring, **no** second sweep.

**The sweep TRAVELS and leaves; the cancel hold's FILLS and stays.** They are
opposite kinds of thing and the difference decides the paint. That one is a
clock and must say how much of the hold is done, which is why it is flat and
even — a gradient there described its own progress twice and disagreed with
itself. This one measures nothing: it is a specular pass, a light crossing a
surface, and that is exactly the case where a gradient is honest. Soft at both
edges, one pass, 900ms, `overflow: hidden` on the container so its rounded
corners cut it, and the class stripped on `animationend` — left behind, the next
render would inherit a finished animation and sit permanently mid-celebration.
Both the sweep and `_sppCelebrate` bail on `prefers-reduced-motion`.

**THE SEARCH FIELD HOLDS THE GAME'S NAME.** `_buildMacSppSidebar(gameTitle)` —
it is the one line of that fake chrome that can tell the truth about your
submission, and it costs nothing to: you are looking at your game's product
page, so the way you got here was by searching for it. A literal "Search" beside
a page that is unmistakably one game's was the last part of the sidebar still
describing a generic App Store. It falls back to "Search" with no title — an
empty field is what an untouched one looks like, and inventing a placeholder
game name would put a second fake title on a screen whose real one is right
beside it already saying "Your Game Title". `.is-query` is what separates the
two registers: a real query is `--text`, a prompt stays `--text-faint`, the same
distinction an input's value has from its placeholder. Ellipsised, because the
title is capped at 30 characters and the column is 176 wide.

`ALL_ELEMENTS` grew a `short` on exactly the two entries whose `label` is a
sentence — "Adjust Screenshots" and "Answer Data Collection Questions" read fine
after an arrow, and not at all inside a pill. The other six already had names,
so they carry no `short` rather than a copy of their own label.

**THE SIDEBAR NO LONGER HAS TO CATCH UP WITH THE PAGE.** While the nav was the
scroller's first child it pushed the page down by its whole height and left the
sidebar — which starts at the shell's top — that much too high, so
`--spp-page-top` had to add the strip's paddings and its pill back up
(`10px + 8px + 28px + 8px + 9px + 4px`) and hand the total to the sidebar as
`margin-top`. With the nav above BOTH columns the only thing still displacing
the page is `.ias-device-wrap`'s own 4px of top padding, so the variable is that
one term. Keep it written as the box it comes from: if that padding moves, this
is the line to edit. The sidebar still keeps no height of its own, so it
stretches to the bottom the way the real app's does. Measured: sidebar top 247,
page top 247, 0 apart.

**PRESSING A PILL SPOTLIGHTS WHERE IT LANDED YOU**, and it is the platform
card's own `_smSpotlight` rather than a second mechanism — `_sppSpotlight`
(app.js) just hands it `.mac-spp-shell` in place of a card.

Why this surface earns it: the pills are a MAP of eight sections and one press
can move you past six of them. Arriving somewhere you did not travel through
leaves you hunting for the thing you asked for, and the page's own amber glow
cannot answer that — it marks what is UNFINISHED, a different question from
where you just landed. Two marks, two questions, no competition: the spotlight
says which part of the page, the glow says which field inside it.

Three ways it deliberately differs from the card's:

- **The dim starts with the TRAVEL, not on arrival.** It is what carries the eye
  across the scroll; lit on arrival it would read as a second event happening to
  you after the first. Which is why the duration is not the card's 1100 — the
  longest travel on this page measured 515ms, so **1600** guarantees a full beat
  of "here it is" after you land, whatever the distance.
- **It does not lock the pointer**, where the card's does. That one is
  explaining a PREREQUISITE, so a dimmed row that still opens its step invites
  you to act on the thing being de-emphasised. This one is a locator and you are
  free to go anywhere; freezing the page for 1.6s because you pressed a
  navigation pill would punish the gesture.
- **The pills stay lit and live**, because they are the shell's SIBLING and the
  class cannot reach them. A navigator that greys itself out after one press
  reads as refusing the next one.

**The leaf groups are the page's own direct children**, and `:not(:has())` does
the same job it does on the card: only two of the eight targets ARE a direct
child (Screenshots, Achievements) — the other six sit inside one, with title /
subtitle / business sharing `.ias-header` and content inside the meta strip. A
child that CONTAINS the mark stays at full, so what lights up is the section you
landed in rather than the field. Dimming five of six cells in one metadata row
to point at the sixth is fussier than the glow already sitting on it.

**THE DIM IS .35, NOT THE CARD'S .18, AND THE NUMBER IS BORROWED RATHER THAN
SOFTENED BY EYE.** It shipped at the card's .18 and that was too strong: the
card is explaining a PREREQUISITE — those rows are in your way, and .18 is close
enough to gone to say so — where this is a locator. The rest of the page is
still perfectly true, it is just not what you asked for, and at .18 it read as
switched off rather than as stepped back. **.35 is the value this app already
uses for exactly that claim**: the submitted card's cancel hold, whose note
reads "what stays at .35 is only what remains TRUE while the bar runs". Same
sentence, different surface.

**The sidebar dims proportionally, not to the same number.** It rests at
`opacity: .42` because it is a picture; sent to the page's own value it would
arrive at exactly the page's level, the decorative column ending up as loud as
the real store copy — the relationship this whole preview exists to avoid.
`.42 × .35 = .147`, so **.15**: it recedes by the same FACTOR and keeps its
place in the order. Re-derive it if the page's number moves again.

`_smSpotlight` gained a `_spotHost` while it was there. Two surfaces can now be
on screen at once (the step modal opens over the dashboard), and starting one
while the other ran cleared only the NEW host's marks while the shared timer had
just been cancelled — leaving `is-spotlight` on the old host permanently.

Measured pressing Content from the bottom: the meta strip holding it at
`opacity 1`, the other ten children at `.35`, the sidebar `.42 → .15`, every
pill still at 1 and `pointer-events: auto`; after the window, zero children
dimmed, the sidebar back at .42 and no `.is-spotlit` left anywhere. Switching
pills mid-spotlight leaves exactly one mark.

**The travel is animated BY HAND — see "The travel is ours, not the browser's"**,
which is also where the reason lives. Short version: `scrollIntoView` picks its
own scroller and implements `behavior: 'smooth'` its own way, and this surface
has two boxes stacked, so Chrome and Safari did not agree. `_smScrollCentre`
names the scroller and writes `scrollTop` frame by frame instead.

Things that still produce an instant landing, worth ruling out before touching
the travel code: a `scrollTop` written before layout (see "A scroll restore must
flush layout first"), `prefers-reduced-motion` (deliberate — it also switches
this spotlight off), and a stale cache, since `?v=` is the only cache key these
files have.

**iOS keeps the footer stepper and gets none of this on purpose:** PREV / NEXT
moves you exactly one section, so you already know where you arrived.

### The Mac sidebar's glyphs are the real art now

`_buildMacSppSidebar()` (render.js). **Six of the eight are Jaco's exported
SVGs** — Discover (star), Create (paintbrush), Work (paper plane), Develop
(hammer), Categories (grid) and Updates (download arrow) — so those six stopped
being redraws. **Play (rocket) and Arcade (joystick) are still mine** and are the
only two left to replace; he has said he will supply them.

**That makes the column two families, and the split is temporary rather than a
design.** The exported art is FILLED — outline shapes drawn as filled paths with
their own counters, the way SF Symbols are authored — where the two redraws are
1.3px strokes. Both read as outlines at 14px, which is all that matters here: a
genuinely filled mark in this column would read as the selected one, and these do
not, because the fill only ever paints the outline itself.

**EVERY GLYPH IS ON THE SAME 16-UNIT BOX, exported art included.** The source
files are 128-unit canvases carrying a `matrix(4.01085, …)` of their own, so each
export's matrix is multiplied by 0.125 (scale → 0.501356, translations ÷ 8) and
baked into its `<g>`. One viewBox for all eight is what lets one CSS rule size
them; two canvases would have them bobbing against each other the way the
platform marks did before `SM_TILE_MARKS`.

Two details that are easy to lose:

- **`fill-rule` is carried per glyph**, not left to the default. `hammer.svg` is
  authored `evenodd` and the other five `nonzero`; at `nonzero` the hammer loses
  the holes in its claw.
- **`overflow: visible` on the filled `<svg>`.** The exported art really does
  reach the edges — the hammer's ink measures 0 → 16 on the box exactly — so at
  the default `hidden` its outermost antialiased pixel is the one being clipped.

Measured ink (w × h in the 16-unit box): Discover 14.5 × 13.85, Create 13.88 ×
15.52, Work 13.68 × 13.68, Develop 16 × 15.15, Categories 12.02 × 12.02, Updates
11.59 × 14.09 — the variation is the art's own optical balance (a diagonal hammer
has a bigger box than a grid) and is left alone. My two placeholders are visibly
lighter at 10.8 and 7.4 wide, which is the tell that they are still placeholders.

**THE AVATAR IS AN EMPTY DISC AND THE NAME IS GENERIC.** The row carried a
person glyph inside the circle and the literal name "Jacobo Abril". Both went,
for different reasons. The glyph, because a picture OF a person sitting beside a
person's NAME says the same thing twice and the drawing is the half carrying no
information — an account with no photo is a plain disc, here and in the real
app. Its fill goes .14 → .20 to pay for that: the lower value was chosen while a
glyph sat on top and only had to be a ground for it, and alone it read as a hole
rather than a deliberate blank, which is the exact failure the original stroked
version had. `overflow: hidden` stays so a real `<img>` drops in later and clips
to the circle with no second rule.
The name, because it was the one value on that screen that was true about a
real person rather than about the prototype. "Developer" is seeded the way every
other fake value here is (My Game, Pixel Forge, Your Company). There is still no
account model to read it from; when one exists, that is the one line to change.

**NO ROW IS CURRENT, and the highlight was removed rather than moved.** This
sidebar is decorative chrome around a PRODUCT PAGE, and a product page is not
any of the eight destinations listed in it — lighting "Discover" claimed you had
navigated somewhere you had not, on the surface whose whole job is to say "this
is your game's page". The real app leaves those rows unselected while a product
page is open, for the same reason. The `current` parameter and
`.mac-spp-nav-item.is-current`'s two rules went WITH it rather than being left
dormant: a state nothing can set is a control waiting to be turned back on,
which is the argument the dev bar was deleted under.

**The traffic lights are in, and I argued against them once.** When this sidebar
was first nailed against the reference I left them out on the grounds that they
are WINDOW chrome rather than sidebar — true about the object, wrong about this
drawing. Everything else in the column exists to say "you are looking at the Mac
App Store app", and those three dots are the most recognisable thing on a macOS
window; without them the column read as a web sidebar that happens to list
Apple's sections. They are the cheapest fidelity in the whole preview.

They are **dead by construction** — no hover, no `cursor: pointer`, no handler,
`aria-hidden` — because a control that looks pressable and does nothing is worse
than a picture of one, and this is a picture. Apple's colours as LITERALS
(`#FF5F57` / `#FEBC2E` / `#28C840`) on purpose: they belong to macOS, not to
this app's palette, and pointing them at `--alert-*` or the done green would
quietly have made them mean something here. 11px at 7px apart rather than the
real 12 and 8 — the column is 176 wide against a real window's hundreds, so the
trio is scaled to the drawing it sits in.

**The search field got shorter.** At 7px of vertical padding it measured 30
tall, which is the height of a real control in this app and is what it looked
like: something to press, above eight rows that are not. 4px of padding brings
it to ~25, close enough to the nav rows that the column reads as one rhythm.
The horizontal 11 stays — it is what keeps the magnifier off the pill's curve.

**THE LANGUAGE SWITCHER IS CHROME, NOT AN ANSWER.** `_macSppLangDropdownHTML`
puts a `.loc-primary-pill` in the modal's header, and it was the loudest thing
there. The diagnosis is sharper than "too heavy": it wore `--pill-on-bg` /
`--pill-on-color`, the SELECTION blue, which in this app means *you confirmed
this*. In Localization that is right — the primary language is a declaration the
submission carries, chosen inside a form, and that copy of the pill is
untouched. Here the same component picks which language you are LOOKING at. It
is a lens, not an answer; nothing about the submission changes when you move it.
Blue was making a claim the control cannot make, in the brightest colour
available, two inches from the title.

**The fix is `.rel-track`'s, wholesale** — that rule was written for this exact
situation (a picker living in chrome rather than in a form) and a third
treatment for one component was not needed. Ghost trigger: no fill and no ring
at rest, both arriving on hover, and the hover box is deliberately
`.task-modal-close`'s own — 30px tall, 8px radius, flat grey, no stroke — because
that button is one sibling away and two controls in one row inventing separate
boxes is the only reason they would look like two different things. The ring is
switched off with `display: none` rather than deleted, so Localization keeps
its. Scoped to `.submit-modal-header-actions`.

**And it shrink-wraps**, the third piece of that copy: the card's track picker
takes the room its value needs, while this one was pinned at a fixed 150px with
the label stretched across 102 of it. `swSelect` now gets `'auto'` and
`.loc-primary-name` drops its `flex: 1` (that stretch is what kept the word
floating in an oversized box). Measured: 150 → 98.4 wide, 30 tall, radius 8,
transparent, ring `none`, label `--text-dim` → `--text` on approach, same height
and radius as the × and centred with it, 20px apart. The panel still opens
right-aligned; open still lights the same 6% fill; Localization's copy still
measures `rgba(0,154,255,.35)` with its ring `block`.

**THE PAGE DISSOLVES AT BOTH ENDS INSTEAD OF BEING CUT.** The store column
scrolls 464px under a bar that is no longer inside it, and there was no fade at
all: the modal's own top fade sits at opacity 0 on this face (its wrap is
`overflow: hidden` here, so `_smModalFades` reads it as unscrollable), and the
page was chopped dead on the bar's bottom edge.

It is `.cr-pinned::after`'s fade, re-hung on the surface that actually moves.
That bar hangs its fade off its own bottom edge because it is sticky INSIDE the
scroller; this one sits outside the shell, so an `::after` on it would also lie
across the top of the SIDEBAR, which does not scroll. **The fade belongs to the
column that moves.**

**A sticky `::before` on the scroller**, which costs no markup and no geometry —
no need to know the sidebar's width or the shell's gap. As the first in-flow
child it would push the page down 36px, so a negative `margin-bottom` gives that
space straight back (measured: the page still starts at the scrollport's top +
`.ias-device-wrap`'s own 4px, exactly where it did before). Sticky rather than
absolute is the load-bearing part: an absolutely positioned child of a scroll
container is laid out against the padding box and scrolls away with the content.

**The colour follows the ground, and the ground MOVED.** It was solved in
rgb(28) while the page still carried its own `--panel-2` container; that
container is gone (below), so what sits under this fade is the modal's
`--panel` and the stops are re-solved in 20. Leaving 28 would paint a strip
LIGHTER than what it covers — a glow, not a fade.

**It reaches full opacity and it ramps EVENLY, which is where it stops copying
`.cr-pinned::after`.** That bar tops out at 0.96 and spends more than half its
drop in its first 20px — front-loaded, because there it only has to kill a 34px
row sliding under an already-opaque strip. Here there is no opaque strip: this
fade IS the whole boundary. A top that never quite reaches the ground colour
leaves the cut faintly visible underneath it, and a front-loaded ramp reads as a
smudge with a hard edge above it rather than as a dissolve. So it starts at a
true 1.0 — exactly `--panel`, so content stops existing rather than dimming —
across eight stops instead of five, over **48px** rather than 36: the span is
the dissolve now, not a softener laid on top of one.

**It is only there while something is above it**, which the CR bar does not
bother with (it is opaque and always has rows under it). At `scrollTop` 0 a fade
over the page's own header is a shadow claiming content that is not there. The
default is OFF and `_smModalFades` adds `.is-scrolled` — inverted on purpose, so
a freshly rendered scroller at the top never flashes a fade for one frame before
the class lands.

**AND THE BOTTOM GETS THE SAME FADE, WHICH IT DID NOT FOR ONE VERSION.** This
column shipped with only the top one, on a line written in the CSS and in this
file and never measured: *"there is no bottom fade on this column — the page ends
in the footer's own space and nothing is cut there."* Measured, it is cut. With
464px still below the fold an `.ias-achv-section` sat hard on the scrollport's
bottom edge, and only **12px** separate that edge from the modal's footer — far
too little for anything to absorb it. A column that dissolves at one end and is
guillotined at the other says the boundary is real at the top and an accident at
the bottom.

It is the top fade **mirrored**, not a second design: `.mac-spp-main::after`,
sticky at `bottom: 0`, same 48px, the same eight stops in `--panel`, read
bottom-up, and `margin-top: -48px` giving back the space it would otherwise add
below the page as the last in-flow child. Sticky for the same load-bearing reason
as the top one — an absolutely positioned child of a scroll container is laid out
against the padding box and scrolls away with the content.

So it is **two classes after all**, and the second rests on the first's own
argument: a fade at the very end of the scroll claims content that is not there
exactly as one at `scrollTop` 0 does. `_smModalFades` adds `.is-scrollable-down`
only while `scrollTop + clientHeight < scrollHeight - 2`. Both are stated
positively rather than as `at-top` / `at-bottom`, so the resting state at each end
needs no class at all. Measured across a full scroll: top 0 / bottom 1 at the
start, both 1 in the middle, top 1 / bottom 0 at the end, `pointer-events: none`,
and `scrollHeight` **identical** with the pseudo-element and with it disabled —
the negative margin costs zero layout.

**AND `.mac-spp-main` CARRIES NO `padding-bottom`, WHICH IS A CONSTRAINT OF THAT
FADE AND NOT A TIDY-UP.** A sticky element cannot leave its **containing block**,
and for a child of this scroller that is the scroller's CONTENT box — not its
scrollport. The 4px of bottom padding this element used to carry (the tail
matching `.ias-device-wrap`'s own 4px of padding-top) therefore held `::after`
4px short of the scrollport, leaving a hairline of un-faded page between the
gradient and the footer's opaque edge. Measured with a sticky probe: **exactly
4.0px**, the padding to the pixel — the kind of thing that looks like a
half-pixel rounding bug and is arithmetic.

The tail air did not go, it **moved onto the content it belongs to**
(`.mac-spp-main > .ias-device-wrap { padding-bottom: 4px }`, scoped so iOS and
Mac Full are untouched), so the page still ends with the same air and
`scrollHeight` is unchanged — verified at 4px exactly, with the rule on and off.
The rule to carry forward: **anything added to this scroller's bottom padding
pushes the fade up by that amount.** Put tail space on the child.

**`_smModalFades` arms it, and that is not an arbitrary home.** Pressing a pill
calls `setStorePreviewFocus` → `reRenderStepModal()`, which rebuilds the modal
with innerHTML and takes the old scroller's listener with it — the exact reason
that function already re-arms after every render. Verified across three pill
presses: Description → `scrollTop` 169 with the fade on, Data privacy → 455 on,
Title → 0 with the fade off again, target in view and the right pill lit every
time, and the class correctly re-armed on the new node each round.

**THE PAGE WEARS NO CONTAINER OF ITS OWN, and that is FIDELITY rather than
tidying.** `.ias-page` gives every preview a `--panel-2` fill, a 1px border and
a 16px radius — a card. In the real Mac App Store the product page FILLS THE
WINDOW beside the sidebar; it does not sit in a rounded box. That card was a
Shipmate invention, and it also made this a panel inside a panel, since the
modal already is one.

**The sidebar KEEPS its box, and dropping both was the wrong tidier-looking
option.** The two columns are not the same kind of thing: the sidebar is a fixed
rail that never moves and its edge is what says so, while the page is the
surface that scrolls under the pills. A rail with a box and a page without one
is the real app's own arrangement. Verified: the sidebar holds `rgb(28)` fill,
`rgb(42)` border, 12px radius and does not move a pixel while the page scrolls
300.

**Scoped to `.mac-spp-page`.** iOS and Mac Full share `.ias-page` and are
deliberately untouched — those previews are drawn as a device showing a page,
where a card edge is exactly right. Verified both still measure `rgb(28)` with
a `rgb(42)` border at 16px radius.

Two things it drags with it, both handled: the top fade's stops are re-solved in
`--panel` (above), and the page's inner boxes — the screenshot frames at
`rgb(36)` — now sit on rgb(20) rather than rgb(28) and read a step heavier. Left
as they are; if they are ever re-tuned, that is the ground to measure against.

**THE SCROLLBAR MOVED OUT OF THE PAGE, AND THE PAGE DID NOT MOVE WITH IT.**
`margin-right: -24px` + `padding-right: 24px` on `.mac-spp-main` — bleed and pay
back, the same two-line trick `.cr-pinned` uses on its own scroller. The
scroller's BOX grows 24px to the right; the padding hands that space straight
back to the content. So the page keeps its 754 width with its right edge on the
body's content column at 1220.5 — flush under the pinned bar, verified to 0.6px
— while the scrollbar, which paints at the scroller's padding-box edge, moves
out to the modal's own edge.

**24 IS NOT A GUESS — it is `.submit-modal-scroll`'s own side padding**, which
is what makes this land where the app already puts a scrollbar rather than at a
third position. Every other step scrolls on that element: its box reaches the
modal's inner edge while its 24px of padding holds the content column 24 short,
so its bar paints on the modal's edge. Paying back exactly 24 here reproduces
that. Verified by measuring the INSET from each scroller's right edge to its own
modal's — Content Rating 1px, the Mac preview 1px. (Absolute x cannot match:
those modals are 680 and 1000 wide. A first pass used 12, half the gutter,
eyeballed — and put the bar somewhere neither modal uses.)

**It only became visible when the page lost its container.** A scrollbar sitting
on a card's edge reads as that card's; the same scrollbar with no card under it
reads as a line drawn through the page — a leftover of a box that is no longer
there.

**THE PAY-BACK IS `24px − var(--sm-bar)`, NOT 24.** The bar is drawn INSIDE the
padding box, so it eats its own width out of whatever the padding hands back. At
a flat 24 the store page ended 11px short of the pinned bar it is supposed to sit
flush under — measured 11.0, the bar's width to the pixel. Written as the
subtraction rather than as 13 so the two cannot drift.

That correction only became possible once the bar was real. **An earlier version
of this note said "`scrollbar-gutter: stable` reserves NOTHING here — this
browser's scrollbars are overlay", and that was the symptom mistaken for the
cause**: they were overlay because this app's own CSS was asking for it. See
"`scrollbar-color` is not a Firefox-only hint" below. With that removed the lane
really is reserved (`offsetWidth − clientWidth = 11`), the page is flush again
(measured 0.0 against the pinned bar, page still 754 wide) and the bar still sits
1px inside the modal's edge, exactly where it was designed to.

**THE SIDEBAR IS DIMMED AS ONE OBJECT, and `opacity` is the right lever here for
once.** This app's rule is the opposite — dim by COLOUR, never by opacity,
because an opacity paints a thing through gauze and composites it to a muddier
version of whatever it was (see the submitted card's ticks). That rule is about
CONTENT, where the muddied colour still has to mean something. This column is a
PICTURE: eight rows nobody can press, a dead search field, three dots that do
nothing. There is no state in it to misread, so there is nothing for a composite
to corrupt. One lever also beats four — labels, glyphs, panel and border recede
together and keep their relationships, where dimming each by hand is four
numbers that will drift. `opacity: .42`, which puts the labels near rgb(79) on
the modal's rgb(20): legible as chrome, and no longer arguing with the store
page beside it.

### Editing a field must not move the page

`_iasMountInlineEditor` (app.js) and `.ias-editing` (style.css). Clicking Title
in a Product Page Preview used to shove everything under it down 21.6px, and
clicking Subtitle 41px. Three separate causes, stacked, all measured:

- **The counter row was INSERTED** as a brand-new line under the field: +19.4px.
- **The input's 1px border** made its box taller than the text it replaced: +2px.
- **`.ias-inline-input`'s `margin` SHORTHAND wiped the field's own margins** — so
  the subtitle lost its −5px top margin the instant it became an input. That is
  the sneaky one, and the reason Subtitle moved twice as far as Title.

**THE EDITOR IS MOUNTED INSIDE THE FIELD NOW, NOT IN PLACE OF IT**, and that
answers all three by construction rather than with three corrections. The field
element stays in the DOM and becomes a flex row holding its own input and its
own counter. The box that holds the text is the same box either way, so it
cannot change size; the field's margins are still the field's; and the counter
is not in the sibling chain at all.

**That last part deleted three CSS rules.** Five `:has()` rules had grown up
around this file's own mount: the old editor replaced the field (so Title
stopped being `.ias-app-name`) and wedged the counter between it and Subtitle
(so Subtitle stopped being its sibling), and every clearance rule had to be
rewritten for each arrangement — anchored on the input, on the counter row, on
the counter row while over-limit. They all said the same thing. One rule covers
every state now.

**THE COUNTER SITS BESIDE A ONE-LINE FIELD, NOT UNDER IT** — Jaco's call, and
the right one: there is room to the right, and this is a DRAWING of the Mac App
Store, where the counter is editor chrome rather than part of the drawing.
Chrome must not push the drawing around.

**Its column is reserved and MEASURED, and the first measurement was wrong in a
way worth repeating.** It holds "Must be less than 30 characters." (148.3 at
11px) + an 8px gap + the count. Sizing the count from a two-digit overshoot gave
172 — and the real row then measured **172.0 exactly**, so the sentence wrapped
and the page moved 12.6px the moment you crossed the limit. Same bug, one state
further in. Sized from a four-character overshoot (`-970`: paste a paragraph
into a 30-character field) it is 148.3 + 8 + 31 = 187.3 → **188**, the next
multiple of the 4px this row is spaced on. The sentence is `nowrap` with an
ellipsis as the belt to that braces: past some absurd overshoot a shortened
sentence is a far better failure than a taller row.

Reserved (`flex: 0 0`) rather than fitted, for the pinned nav's reason: a column
that grows when the error appears would shrink the input you are typing in at
the exact moment you cross the limit.

**The ring is an OUTLINE, and a box-shadow was tried first and broke the
description.** An inset box-shadow costs no layout either, but `box-shadow` is
one property and half the things edited here already spend it — the
description's box carries the preview's amber glow, and an empty field's pulse
*animates* it. Whichever rule won, one mark vanished; measured, the
description's blue ring was simply gone. `outline` + `outline-offset: -1px`
draws in the same place on the same radius, collides with nothing, and makes the
ring the real focus ring instead of a look-alike beside `outline: none`.

**SCOPED TO `.ias-editing`; the shared `.ias-inline-input` rule is untouched on
purpose.** The same trade is wrong one surface over: a Localization Review
card's field has a real 1px border of its own, so the bordered editor is exactly
its height and a borderless one measures 1.9px short — swapping it there would
have introduced the very jump this removes here. Verified: the shared rule still
computes `1px solid rgb(10,132,255)` with `outline: none`, so Loc Review and IAP
are bit-for-bit as they were.

**`ias-placeholder` STAYS ON while a field is open**, which stripping it taught
the hard way: the subtitle jumped 14px *up* on click, because the empty-field
clearance rule stopped matching. The class is what the layout reads to mean
"still empty", and clicking a field does not fill it — that happens on commit,
when the body is rebuilt and the class is recomputed from the real value. Only
the pulse has to go, and it goes in CSS (`.ias-editing { animation: none }`).

**SINGLE-LINE FIELDS ONLY.** Description and What's New stay on `replaceWith`:
their host is a `-webkit-line-clamp` box inside the `.mac-spp-desc-flex` grid,
and nesting a textarea in a clamped box clamps the textarea. There is also no
"beside" next to a four-row textarea. Editing the description still opens the
page by 31.4px — a multiline box genuinely has to grow, which is a different
thing from a one-line field moving for no reason, but it is the case left open.

Measured on both previews, empty and filled, under limit and over: Title and
Subtitle move **0.0px** on click, on going over the limit, and on blur — and the
text itself lands on the same x it was drawn at (604.5 → 604.5).

### The travel is ours, not the browser's

### AND EVERY MEASUREMENT IN THIS FILE WAS TAKEN IN ONE ENGINE

Read that heading first, because it is the expensive half. Claude measures in a
Chromium pane. **Jaco develops in Safari.** Nobody said so for two sessions, and
a scroll bug he could see on every single press was un-reproducible here on every
single press — sixteen trips, all smooth, all measured. Three separate "fixes"
shipped against Chrome-only evidence before the word *Safari* appeared and
explained all of it at once.

So: when a report and a measurement disagree flatly, **ask which browser before
writing a line of code**. And prefer a mechanism with no per-engine behaviour to
one that has to be verified in an engine you cannot drive.

`_smScrollCentre` (app.js) is that preference applied. It replaced
`el.scrollIntoView({ behavior: 'smooth', block: 'center' })`, which looked like
the obvious tool — one line, and it finds the scrolling ancestor for you.
**Finding it for you is the problem.** Which box an engine decides to scroll, and
whether it honours `smooth` on a NESTED scroller, is per-engine, and this surface
stacks two: the modal's `.submit-modal-scroll` (`overflow: hidden` on the Mac
face — still a scroll container) and `.mac-spp-main` inside it. Chrome picked the
inner one and animated it, measured 466 → 2 in eleven interpolated steps. Safari
moved the page and left the scrollbar where it was — the signature of the other
box having been scrolled, or of the smooth behaviour being dropped.

It now names its own scroller (`_smNearestScroller`, the nearest ancestor that
really overflows), computes the `scrollTop` that centres the target, clamps it to
the scrollable range, and writes it frame by frame. That removes three engine
differences in one move: nothing else can be chosen to scroll, no engine's smooth
implementation is involved, and any scrollbar follows because the position really
is changing every frame.

- **420ms** is the card's own advance duration (`.is-advancing`), borrowed rather
  than picked so two travels in one app do not run at two speeds.
- The curve is the app's sine — the shape `cubic-bezier(.37,0,.63,1)` draws for
  the carousel glint — written as its closed form, `0.5 − cos(πt)/2`.
- **A user gesture wins.** A wheel, touch or key aborts the animation where it
  stands rather than fighting whoever grabbed the scroller. Verified: interrupted
  at 82, settled at 82.
- `prefers-reduced-motion` jumps instead, the one case where an instant landing
  is right.

Verified in Chromium across all sixteen trips (eight targets from the top, eight
from the bottom): every trip with real distance takes 12 interpolated steps, none
jumps, and the no-op cases correctly do nothing. iOS's own scroller — the modal
body — travels 0 → 512 and 671 → 0 on the same twelve. **Safari is unverified
from here and has to be checked by hand**; that is the honest state of it.

### `scrollbar-color` is not a Firefox-only hint

Three scrollers carried `scrollbar-color: rgba(255,255,255,.13) transparent`
with a comment saying it was for Firefox — `.main`, `.submit-modal-scroll` and
`.mac-spp-main`. **In Chrome that property is neither ignored nor additive:
specifying it switches the element to the standard scrollbar path, which makes
every `::-webkit-scrollbar` rule in this file inert on that element, and on
macOS the standard bar is the OVERLAY one.**

Measured on `.mac-spp-main`, one line apart:

| | `offsetWidth − clientWidth` |
|---|---|
| `scrollbar-color` as authored | **0** |
| `scrollbar-color: auto` | **11** |

So the 11px bar this file carefully styles had never once been drawn on those
three elements, and `scrollbar-gutter: stable` reserved nothing because there was
nothing to reserve. Firefox keeps the styling through
`@supports not selector(::-webkit-scrollbar)`, where the two cannot collide.

**AN OVERLAY BAR DOES NOT FOLLOW A PROGRAMMATIC SCROLL, and that is the bug it
was reported as.** Wheel to the bottom of the Mac preview (the thumb appears),
press a pill in the pinned nav, and the page travels while the thumb sits where
you left it and fades — *"me lleva al sitio pero la barra no se mueve"*. Two
sessions went into the travel code looking for a teleport that was not there:
`scrollTop` was measured animating 466 → 2 in eleven interpolated steps every
single time. **The thing that was stuck was the only thing you can see.** When a
report and a measurement disagree this flatly, suspect that they are about two
different objects.

**Killing it exposed a second bug the same minute, and the two had been hiding
each other.** `.submit-modal-mac-spp .submit-modal-scroll` is `overflow: hidden`
— it hands scrolling to `.mac-spp-main` — but it still inherited
`scrollbar-gutter: stable`, and **`overflow: hidden` does not switch that off**:
a hidden box is still a scroll container, so the gutter stays reserved. With
overlay bars that reserved 0px and nobody noticed; with real ones it became 11px
of permanently empty lane down the modal's right edge, for a bar that can never
appear because there is nothing there to scroll — a second, dead track beside the
live one. `scrollbar-gutter: auto` on that override kills it (measured 11 → 0).

Two wrongs that both measured zero is why this survived so long. The width is a
token now (`--sm-bar`), because one consumer has to subtract it — see the Mac
preview's bleed.

Verified after: dead gutter 0, live bar 11, thumb 369px tall travelling 269px top
to bottom, page flush under the pinned bar at 0.0 and still 754 wide, bar 1px
inside the modal edge, Content Rating's own `.cr-pinned` bleed still landing on
its rows' column to the pixel (bar right 963, row right 963), and the dashboard's
`.main` reserving its lane with no horizontal overflow.

### A scroll restore must flush layout first

`reRenderStepModal` (app.js) captures three scroll positions before the render
and puts them back after it. **All three assignments were silently landing on
zero**, and the one-line reason is worth carrying: `renderStepModal` has just
replaced the element with a brand-new node whose children are parsed but NOT
laid out, so its `scrollHeight` still equals its `clientHeight` — it has no
overflow yet — and a `scrollTop` assignment is **clamped to that maximum, which
is 0**. The write does not throw and does not warn. Reading `scrollHeight` first
forces the pending layout and the same assignment then sticks.

**It surfaced as "the nav doesn't scroll".** From the bottom of the Mac preview,
pressing Title teleported to the top with no motion. The travel was innocent:
`setStorePreviewFocus` re-renders and then smooth-scrolls the target into view
one frame later, but the scroller had already been snapped to 0 here, so there
was nothing left for the animation to cross. Measured on a clean load with a
real mouse: **5ms after the click the scroller read 0**, and the `scrollIntoView`
was a no-op. After the flush: 466 at 16ms, moving at 33ms, thirty interpolated
steps, 0 at 515ms.

**AND IT HID FROM EVERY PROBE, WHICH IS THE PART TO REMEMBER.** Reading
`scrollTop` from the console *is* a layout flush, so any attempt to watch the bug
repaired it — by hand it measured 466 → 466, and 466 → 0 the moment nobody was
looking. Three instrumented runs in a row "proved" the code was fine. Only a
trace with no reads inside the click's own turn caught it. If a scroll bug will
not reproduce under measurement, suspect the measurement.

The three restores now go through one `restoreScroll(el, top)` helper rather than
three copies, so the flush cannot be present in two of them and missing in the
third. Verified after the fix: the Mac preview's pinned nav animates in both
directions, iOS's footer nav does too (671 → 0 in thirteen steps, 0 → 512 back),
Content Rating holds 420 across answering a question, and committing an inline
edit while scrolled to 300 leaves you at 300.

### The icon has two doors

`smAppIcon()` / `smAppIconSrc()` in assets.js, and they exist because the answer
to "what is this game's icon" was written five times and right once.

`state.uploads.appIcon` is the dedicated uploader's slot. But the asset library's
drop well takes any file and classifies it, so a developer who drops their icon
in there has unmistakably added one — the tool even labels it Icon — while the
slot stays null. Every store preview read the slot directly, so the page went on
drawing the grey mountain placeholder beside a title, a subtitle and a GET button
that were all filled in: broken-looking, over a file we already had. The guide
was louder still — it kept printing "Upload an app icon", pointing at a job
already done, and a checklist that nags about finished work is worse than one
that is merely incomplete.

**The fix already existed on exactly one surface**, written in place in the
project-selector chip (`renderTopbar`), which is precisely how a rule ends up
true on one surface and wrong on five. It is lifted out now and the chip reads it
like everyone else: five previews, the chip and `shippyAssetsNotes`, one
function.

**The slot still wins when it is set** — that file was chosen for this job, where
a pool icon was merely recognised as one.

**Two functions, because the two doors hand back two SHAPES.** An upload is a
screenshot-style entry (`{ref}` / `{dataUrl}` / `{url}`) that only
`_screenshotSrc` resolves; a pool record carries a flat `.src`. `smAppIcon()`
returns the record for callers that only need truthiness; `smAppIconSrc()`
resolves the src so no caller has to know the difference. Verified: with the slot
empty and one `kind: 'icon'` asset in the pool, the preview draws the real image
and the placeholder is gone.

### The Content Rating bar is never silent

Three outcomes, three lines (`buildContentRatingSection`): Shipmate inferred
something → the count; the call succeeded and inferred **nothing** → "X of Y
still to answer"; everything answered → "All Y answered". A failed call never
reaches the bar at all — with no snapshot there is no toggle, and the red
"Analysis failed" banner has the floor.

Inferring nothing is a real outcome, not a failure: `tryApply` (claude.js) needs
a valid value AND confidence ≥ 80, so a thin game comes back with the call
perfect and not one answer filled. The snapshot is still taken, so the toggle
appeared with an empty space beside it and the step looked broken rather than
untouched.

Age Category goes into that snapshot too (`_crAgeAnswered`). It was the one
condition reading the LIVE answer, so picking "Not applicable" made the whole
Additional Information section vanish on the next render, out from under the
pointer that had just set it — where every other answer stays until the filter
is re-taken. Note the routing trap: `ageCategory` is in
`IOS_MAC_SHARED_ANSWER_FIELDS`, so for Mac App Store it lives in the iOS store —
`_appStoreAnswers('macos')` without a field id hands back Mac's own bucket,
where it is always null.

### Versioning — required on every change

Bump **once per publish**, not once per edit — a batch of changes that ships
together is one version. (v5.36→v5.48 burned twelve numbers by bumping on every
tweak; the cost is only cosmetic, but it makes the history unreadable.)

**ONE EXCEPTION: A CACHE THAT HAS ALREADY DIVERGED.** `?v=` is not decoration,
it is the only cache key these files have. A long session of edits under one
unpublished number means a browser that loaded the app early is still holding
those bytes while the files on disk have moved on — and the symptoms are
indistinguishable from real bugs. That is exactly how an afternoon went: a scroll
teleport that had been fixed and measured kept being reported, because the tab
reporting it was running the pre-fix `app.js`. If the file changed and anyone has
loaded the old one, bump. Test with a hard reload before concluding anything
about behaviour that "should" already be fixed.

**BUT THE NUMBER IS A SHARED RESOURCE, AND THAT EXCEPTION COLLIDED WITH IT.** The
bump above was taken mid-session as v6.28 → v6.29 — while Mark was shipping his
own **v6.29, v6.30 and v6.31** from the Distribution side. Two people minted the
same number on the same afternoon, and the local repo had no idea because its
`origin/main` was a day stale. This work went out as v6.32 for that reason, not
v6.29.

**THE FETCH IS FOR WHOEVER WRITES THE NUMBER INTO THE FILES, NOT FOR WHOEVER
RUNS `ship.sh`.** That distinction was missing for a version and the note
quietly became a chore for the wrong person. The workflow at the terminal is
unchanged and is still exactly one command:

```bash
./ship.sh "v6.xx — description of change"
```

`ship.sh` already pulls and rebases; nothing needs to be run before it. The
collision risk belongs to the step BEFORE that — choosing the number, which
happens hours earlier, in a session that may be holding a stale `origin/main`.
When Claude is the one choosing, Claude cannot check: **it is barred from every
git command in this repo** (see Git Workflow). So it either asks, or it picks
and accepts the conflict.

**AND THE CONFLICT IS A REAL BACKSTOP, WHICH IS WHY PICKING BLIND IS SAFE
ENOUGH.** A duplicated number cannot publish quietly: both sides edit the same
fifteen version lines, so `ship.sh`'s rebase conflicts on `index.html` and
`splash.html` *every* time. There is no path where new bytes go live under a
number already taken — the failure this section exists to prevent is caught by
construction. The cost of tripping it is one paste of the conflict and one pass
to resolve it (see "`ship.sh` REBASES" below), not a bad publish.

So: no extra step at the terminal. A fetch is worth it only when someone who
CAN run git is picking the number and happens to know the other side has been
shipping that day.

Current version: **v6.36** → next is **v6.37**, then **v6.38**, etc. (v6.29 –
v6.31 are Mark's Distribution work, shipped in parallel.)

Update the version in **three places**:
1. `index.html` — all `?v=X.XX` cache-bust params on script/style tags (14 of them)
2. `index.html` — the footer badge: `<span class="app-footer-version" id="app-footer-version">vX.XX</span>`
3. `splash.html` — the version badge text (around line 1366)

Note on splash.html: the iframe that used to load it was ported into `splash.js`
back in v2.34, so nothing references `splash.html` any more. Its badge is
updated for consistency only — there is no `src="splash.html?v=X.XX"` to change,
despite what earlier versions of this file said.

Always include the new version number in the ship note, e.g. `"v6.26 — add tooltip to age rating cell"`.

---

## Security — Read This First

`config.js` is gitignored. It contains real API keys and must never be committed.

```js
// config.js (gitignored — never commit)
const CONFIG = {
  CLAUDE_API_KEY:     'sk-ant-...',
  IGDB_CLIENT_ID:     '...',
  IGDB_CLIENT_SECRET: '...',
};
```

The repo contains placeholder keys in `index.html`:
```js
const CONFIG = {
  CLAUDE_API_KEY:     '__CLAUDE_API_KEY__',
  IGDB_CLIENT_ID:     '__IGDB_CLIENT_ID__',
  IGDB_CLIENT_SECRET: '__IGDB_CLIENT_SECRET__',
};
```

**Never replace these placeholders in index.html with real keys.** Real keys go in `config.js` only.

API keys are injected automatically by GitHub Actions at deploy time — contributors do not need a local `config.js`.

---

## Git Workflow

**Claude must NOT run any git command in this repo — no `git add`, `commit`, `pull`,
`push`, `gc`, or `maintenance`, and no `rm` of `.git/*.lock`.** The Cowork sandbox is
denied permission to delete files inside `.git` (even ones git itself just created),
so any git operation Claude runs leaves stale `.git/*.lock` files and half-written
`.git/objects/tmp_obj_*` behind. Those leftovers then break the human's `./ship.sh`.
This was the cause of the recurring "index.lock: File exists" failures.

Division of labor:
- **Claude** edits files only, and bumps the version number (see Versioning). Claude
  never commits. When done, Claude tells the contributor to run `./ship.sh`.
- **The contributor** runs everything git via `./ship.sh` from a real terminal (which
  *can* clean up `.git`, and self-heals any stale locks on startup).

Typical workflow:
1. Describe changes to Claude in Cowork — Claude edits the files (no git).
2. Test locally: `python3 -m http.server 8080` → open `http://localhost:8080`
3. Publish: `./ship.sh "v5.xx — description of change"` (commits, pulls, pushes).

GitHub Pages auto-deploys from `main` within ~30 seconds of a push.

Include the version number in the ship note: `./ship.sh "v6.26 — description of change"`.

### `ship.sh` REBASES, so `--ours` is the OTHER person's side

When two people bump the version on the same afternoon, `index.html` and
`splash.html` conflict on all fifteen version lines and nothing else. The
resolution is "keep ours" in plain English and **`--theirs` in the command**,
because a rebase replays your commit ON TOP of `origin/main`: "ours" is the
branch being rebased onto — *theirs* — and "theirs" is the commit being
replayed — *yours*. Inverted from a merge, which is where the instinct comes
from.

```bash
git checkout --theirs index.html splash.html && git add index.html splash.html
GIT_EDITOR=true git rebase --continue && git push
```

Getting it backwards is silent and expensive: you would publish new bytes under
a number already live, which is precisely the diverged-cache failure the
Versioning section exists to prevent. **Verify before continuing** — the count
of `?v=` must match the new number, not the old one:

```bash
grep -o '?v=[0-9.]*' index.html | sort | uniq -c   # expect 14 of the new one
```

`GIT_EDITOR=true` is the second half. `ship.sh` opens `$EDITOR` for the commit
message, and on this machine that is `vi` — which hit a **three-day-old
`.COMMIT_EDITMSG.swp`** from a crashed session and sat at an E325 prompt no
amount of `:wq` escaped. The message is already prepared by the rebase, so
there is nothing to type: `GIT_EDITOR=true` accepts it without opening an
editor at all. Worth doing permanently:
`git config --global core.editor "nano"`.

Two states that look identical from the outside and are not: HEAD detached at
the same SHA as `.git/rebase-merge/onto`, with `msgnum/end = 1/1`, means the
commit **has not been created** and the push has nothing to send — live stays
on the old number. Check `.git/rebase-merge` exists rather than inferring from
`ls` (an `ls` of two paths where only one exists returns non-zero, which reads
as "clean" through `&&`; that misread cost a round trip here).

---

## Testing

Run a local server — opening `index.html` directly in a browser won't work properly (scripts and the splash iframe won't load):

```
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Leave the Terminal window running while testing.

AI inference features won't work locally (keys are injected at deploy time). All UI and navigation works without them.

---

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

## Pending AI Model Decision

The team is evaluating which AI model to use for production inference. A benchmark spec is in `shipmate-ai-benchmark-spec.md`. Current leading candidate: **Claude Sonnet 5** for real-time inference. Open-weight fine-tuning (Qwen2.5-32B range) is a future option once sufficient labeled data is collected.
