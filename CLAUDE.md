# Shipmate Prototype — Claude Context

## What This Is

Shipmate is a web app that helps game developers prepare and submit their games to app stores (iOS App Store, Google Play, Steam, Epic, PlayStation, Xbox, Nintendo). It walks developers through content ratings, data collection disclosures, business categories, screenshots, and binary analysis — using AI to infer answers where possible.

This is a **static HTML/CSS/JS prototype** hosted on GitHub Pages. There is no build system, no npm, no bundler. Everything runs directly in the browser.

Current version: **v6.27**

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
`.guide-card`, toggled by `.guide-cal-btn` — a 22px box beside the collapse
chevron, its `right` derived as `14 + 22 + 6` so moving one moves the other.

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

**The toggle wears the app's own calendar mark**, `SM_CAL_SVG` in state.js —
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

Current version: **v6.27** → next is **v6.28**, then **v6.29**, etc.

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
  longer reflows the step sideways. Invisible where scrollbars overlay, which
  is why the bug looked intermittent.
- **Mac App Store preview for the demo** — adapt it to how the real Mac App
  Store looks. macOS already exists as a platform (`macos` / `macos_full`), and
  `SM_REQS.macos` in assets.js already carries Apple's numbers: icon 1024×1024
  with no alpha, screenshots 16:10 at 2880×1800 / 2560×1600 / 1440×900 /
  1280×800. The web preview (`buildWebSitePreviewSection` + web-page.js) is the
  most developed one and the best model to copy.
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
- **The modal flip "blink"** — the whole modal appears to flash on flip.
  Measured: not an opacity issue (no frame at opacity 1 unrotated) and not
  jank (0 dropped frames on repeat flips). Three suspects left, each a
  one-line console test: `backdrop-filter: none` on `#submit-overlay`,
  promoting the modal to its own layer, and removing the 90px `box-shadow`.
  Awaiting a verdict on which kills it.
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
