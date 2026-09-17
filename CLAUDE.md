# Shipmate Prototype — Claude Context

## What This Is

Shipmate is a web app that helps game developers prepare and submit their games to app stores (iOS App Store, Google Play, Steam, Epic, PlayStation, Xbox, Nintendo). It walks developers through content ratings, data collection disclosures, business categories, screenshots, and binary analysis — using AI to infer answers where possible.

This is a **static HTML/CSS/JS prototype** hosted on GitHub Pages. There is no build system, no npm, no bundler. Everything runs directly in the browser.

Current version: **v6.49**

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

**AND THE PRIVACY PRESET CHIPS WERE THE LAST ORANGE SELECTION IN THE APP
(v6.43).** Jaco: *"en data privacy… las pills de los presets no siguen el estilo
de nuestras pills clásicas (quiero que sigas el mismo estilo de stroke degradado
y fill azul si se seleccionan)."*

Two things were wrong and only one of them is the shape. The selected state was
`--orange` on `--orange-soft` — **`#fb923c`, the Subwoofer orange this file
records as RETIRED** from the tip vocabulary, surviving here because nothing had
looked at `.prv-preset-chip` since. And a selection is precisely what
`--pill-on-*` is for: these are answers you confirmed, so they are blue.

The resting state was already the pill's own values written as literals
(`--panel-2` / `--border` / `--text`), so pointing them at `--pill-off-*` is the
same paint through the tokens the rest of the family reads — which is what makes
the hover free as well. **It joins the shared `::after` selector list rather than
redrawing the gradient**, for that list's own stated reason, with `--pill-bw: 1px`
and `border-color: transparent` on select so the ring replaces the edge and the
box does not change size.

The one thing it does NOT copy is `.ob-preset-pill`'s geometry: that is a
one-line pill at `--field-h` and this holds a label AND a sub. Size and weight
already separate those, so the sub takes **one alpha of the same blue**
(`rgba(82,186,255,.72)`) — one lever, the relationship `--text-faint` has to
`--text`, and the same move the pinned nav's separator made in going from a
colour plus an opacity to a single alpha.

Measured against a live `.ob-preset-pill.is-active` probe: fill
`rgba(0,154,255,.35)`, border transparent, ring `rgba(82,186,255,.75) → .25` at
`inset: -1px` with `padding: 1px` and `mask-composite: exclude` — identical on
both. Label `rgb(82,186,255)`, sub `rgba(82,186,255,.72)`, resting `rgb(28)` on a
`rgb(42)` border. All six chips **201 × 60 in both states**, zero `#fb923c`
anywhere in the subtree, and the CSSOM confirmed carrying both new rules (the
test that catches a comment delimiter swallowing one).

**AND THE BUILD PILL'S TOOLTIP IS THE HINT, NOT THE FORMAT LIST.** Jaco: *"el
tooltip … fuera 'Export a signed .pkg from Xcode', igual que en el modo inline
de Mark."* It read "Upload build — accepts .pkg or .zip", and `hint`'s own note
in state.js already argues why that is the wrong half: *"'Export a signed .pkg
from Xcode' tells you what to go and DO, which is the actual question someone
staring at an empty Upload Build has."* Mark's pane prints that string beside
this same pill, so the card was the one surface saying something different about
one control.

One string in both states — it stays true once a build is in, because replacing
it means exporting another — and `accept` is untouched, since what we recommend
and what we permit are two different things. Verified per store: Mac "Export a
signed .pkg from Xcode", iOS "…signed .ipa…", Steam still "Upload an .exe or
.zip" (naming a tool only where one extension is the real answer), and the file
dialog still filtering on `.pkg,.zip`.

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
- **Two things GO, they do not dim** — the wait estimate and the disclosure.
  "Usually 3 days" answers a question you stopped asking the moment you started
  withdrawing, and it sits on the same line as the word that replaced it. "See
  what you sent" is an invitation to go somewhere else, offered in the middle of
  an act you have to stay put to finish — dimming still leaves it there to be
  aimed at, so both take `opacity: 0` and `pointer-events: none`. What stays at
  .35 is only what remains TRUE while the bar runs: the progress, the store's
  sentence, the dates. Measured through a full cycle: 1 → 0 / 0 / .35 → 1, and
  the card is still submitted on release. (It was THREE until v6.56 — the third
  was the Marketing nudge, which has left this card; see below.)

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

**EACH ROW LEADS WITH ITS PLATFORM'S MARK (v6.55).** The store's name is the one
thing here you have to read to tell the rows apart, and every other list in this
app answers "which one is this" with a mark before the label — the card's step
rows, the guide's checklist, the pinned nav's pills. Trailing it would make this
the only place that mark comes second, and the row would read as a label wearing
a badge.

Three things it is written under, all of them rules that already existed:

- **`smMarkFor(w.pid)` with NO size argument**, and the 12px slot in CSS. Same
  lesson as `.active-card-icon svg` and `.ios-step-num svg`: a literal at the
  call site is what went stale the first time a slot moved. It also means Xbox
  and Nintendo — which have no measured mark and fall through to `platformIcon`
  — cannot come out a different size from the rest.
- **`align-self: center`, not the row's baseline.** A replaced element in a
  baseline-aligned row sits its BOTTOM EDGE on the baseline, which hangs a square
  mark a couple of pixels low beside 11px text. The two pieces of text keep the
  baseline they had; only the picture is centred against them.
- **The mark takes the STORE NAME's colour, not the date's yellow.** The mark and
  the label are one half of the row — *which store* — and the date is the other.
  A yellow mark would split a name from its own icon and leave two of the three
  things on the line claiming to be the value.

`space-between` went with it: with three children it would have spread the
leftover width between the mark and the name too, prising a store away from its
own icon. The name takes `flex: 1` and pushes the date right instead — one gap,
and the pair stays glued. Measured with two waits: mark 12×12 with 10.3–11.3 of
ink, centred on the row to 0.00, names on one column at 20, dates flush right at
0.0, and the row still 15.9 tall.

**HOVERING A ROW LIGHTS THAT WAIT'S OWN DAYS (v6.57).** `gcalWaitHover` (app.js)
puts `is-wait-focus` on the grid and `is-wait-lit` on the days of the wait under
the pointer; everything else banded steps back to `.35`.

**It is the question the band cannot answer, asked at the only moment it can
be.** The band is a union on purpose and so cannot say whose days are whose;
this list names the store and the date but not the stretch between them. Hover
is what joins them, and the reason it is affordable where the STRIPE was not:
the stripe answered the same question permanently and cost +42px of card per
lane, where a transient mark costs nothing and leaves the moment you stop
asking.

Four things it is built under, three of them rules that already existed:

- **FOCUS IS THE ABSENCE OF DIMMING**, and `opacity` is right here for the same
  reason it is right on `.gcal-strip.is-dim` twenty lines up: what steps back is
  a stroke and a date box, not content whose colour has to keep meaning
  something. The lit run takes no hue and no ring — it already wears the wait's
  yellow, and a second mark on it is the "two marks on one stroke" this grid has
  now refused three times.
- **IT TOUCHES THE DOM, IT DOES NOT RENDER.** A hover is not a state change, and
  `renderGuide()` rebuilds this column with innerHTML — which would throw away
  the add row's half-typed title and its caret on every pass of the mouse, and
  is the fastest way to make a hover feel broken. Two class names, added and
  removed. `mouseenter`/`mouseleave`, not `mouseover`/`mouseout`, which fire
  again for every child the pointer crosses.
- **THE LIT PIECE GETS ITS OWN CAPS** (`is-wait-lit-start` / `-end`). The
  union's `span-start` / `span-end` round where the WHOLE band begins and ends;
  the bright segment inside it starts somewhere else, and left square it reads
  as a stroke cut with scissors. A row edge counts as both, for the band's own
  reason — verified on Steam 11 → 19: caps on 11, 12 (Saturday), 13 (Sunday) and
  19, two capsules, not one square-ended smear.
- **AND THE CAPSULE IS A SECOND LAYER — one layer is why it looked broken
  (fixed v6.59).** The first version dimmed the un-lit days and rounded the LIT
  ones' own `::before`, one element per cell doing both jobs. So the rounded
  corner cut a notch out of the only band that cell had, and what showed through
  was the CARD, not the stroke either side of it: a bite out of a continuous
  line. Jaco: *"queda como un hueco sin rellenar."*

  A rounded cap on a sub-range is BY DEFINITION a shape laid on something, so
  the cell needs both layers. `::before` stays the band — square through the
  middle, the union's caps at the union's ends, **dimmed along its whole length,
  lit days included**, which is the change that makes it work: the base has to
  be continuous or the notch has nothing to show. `::after` is the bright
  capsule and carries the lit caps. The corner now reveals the dim band, which
  is what is really under it.

  The cost, measured rather than hidden: a lit day is the dim band (.10 × .35)
  plus the capsule (.10) ≈ **.132** against a resting band's .10 — three
  luminance points out of 255, below the floor at which anything on this grid
  reads, and arguably right: with two levels on screen the lit one should not be
  dimmer than the stroke was before you pointed at anything. Verified with Mac
  (14 → 17) lit: every banded `::before` at .35 keeping the UNION's caps (11
  left, 12 right, 13 left, 19 right), `::after` present only on 14–17 at
  `rgba(255,216,77,0.1)` with caps on 14 and 17 — and **cell 14's `::before`
  radius is 0**, which is the fix stated as a number.
- **Today, launch and the picked day keep their fill**, hence the `:not()`
  chain. They are not part of the wait vocabulary and say nothing about which
  store is being pointed at; violet in particular is the ONLY thing on this
  month that says *you are here*, and a hover in a list must not take that away.
  Their band underneath still dims, so the run reads correctly THROUGH them —
  measured with Google Play (8 → 13) lit: today's band `.35`, today's number
  still `1` on `rgb(160,120,255)`.

No transition: a highlight that eases in arrives after the pointer has moved on
to the next row, so the month appears to lag behind the list.

The cost, knowingly: **there is no hover on a touch screen**, so this surface
says less there than on a pointer. That is acceptable while it is the SECOND way
to read a fact the list already prints in words, and would not be if anything
load-bearing ever moved into it.

`data-iso` on the band-mode cell is what makes the lookup possible — the date
was already in the cell, inside the `onclick` string, and reading it back out of
an attribute is the difference between a lookup and parsing a handler.

**THE LIST GREW, AND THE GAP GREW MORE (v6.57).** 11px at a 3px gap read as one
paragraph of small print that happened to have dates in it. It is 12px/1.5 with
the container's gap at 7 — and the GAP is the half doing the work, moving 3 → 7
against the type's 11 → 12. Rows this short are told apart by the air between
them long before they are told apart by their size, which is the same reason
Content Rating's question rows went to 8 with their pills at 6.

**Two spacings in this block are the container's gap PAID TWICE, and both were
wrong first.** The head and the link are flex children like every row, so their
own margin lands ON TOP of the gap: a head margin of 10 measured **17** on
screen, and the fix is not "10 looked too big" but that the gap was being paid
again. The head is 2 + 7 = 9 now, which is Content Rating's own proportion for
this object (a section header sits 10 above its first question with the
questions 8 apart) — a label over a column is not a divider, and the register
does the separating. The link's margin is deliberately ONE ROW-GAP, so it lands
at 7 + 7 = 14 against the rows' 7, exactly twice as far. Set it to whatever the
gap is if that ever moves; the point is the ratio.

The mark went 12 → 13 WITH the type: the slot is sized against the line it
leads, so leaving it behind would have made it shrink relative to its own label.
Measured: rows 18 tall, 7 apart, head 9 clear, link 14 clear, mark 13, lede 104
tall — about +21px of card at two waits, which is the price of the list being
legible at a glance.

**THE ROW IS A BUTTON, AND THAT IS WHAT BUYS THE POINTER (v6.58).** The hover
above was doing real work and announcing it with nothing — a highlight you only
find by happening to pass over the right 250×18 strip. A `cursor: pointer` says
so, and this app does not put a pointer on something that cannot be pressed, so
the press had to become real rather than the cursor become a lie.

What it does is **the hover made permanent, not a second idea**:
`guideCalWaitOpen` already opens a day and focuses a submission, and the day it
opens is that wait's own decision date — the one the row prints. Hover previews,
press pins and names it in the panel, press again lets go (that function already
toggles). Verified: press → `guideCalDay` 2026-09-17, `guideCalWait` macos,
`.gcal-focus` drawn; press again → wait null, focus gone, day still open.

`<button type="button">` with all five UA properties reset (background, border,
padding, margin, text-align) — a `<button>` arrives carrying every one of them
and any one would have redrawn the line. Measured identical to the div: row 18
tall, name on 23.

**AND THE NAMES ARE FULL WHITE.** At 62% the store — the thing you scan the list
FOR — was in the register this app reserves for supporting text, quieter than
the date beside it, so the line read as a headline date with a caption under it.
White and the wait's yellow are two things at full strength saying two halves of
one fact. The mark goes white and 13 → 15 with it, for v6.55's reason (mark and
name are one half of the row and must not split) — and it deliberately overshoots
the line, because a mark the exact height of its label reads SMALLER than the
label: letters have no counters to lose.

**THERE IS NO HEADING (v6.62), AND REMOVING IT IS WHAT MADE THE BLOCK EVEN.**
It went through two: "Answers expected" (a description of the DATES on the
right, written when the dates were all this block had) and then "In review"
(v6.59, naming the STATE once the rows had gained a mark and a full-white store
name). Both were true of the store rows and neither was true of Launch day.

**A heading over PART of a list forces the rest of it to be set apart, and that
is the whole chain this removes.** Because IN REVIEW was false of Launch day,
Launch day had to be pushed out from under it — first with a 1px rule (v6.58),
then, when the rule came off, with double the gap (14 against the rows' 7). Two
versions of a separator, both paying for a label that only covered two thirds of
what it sat over. Jaco: *"quizás puedes quitar el IN REVIEW, y que las
plataformas y el launch day estén igual de espaciados, porque queda raro."*

With the label gone the block is one list of dated things in this month, every
row 7 apart, and the container's gap is the only spacing in it. Measured:
eyebrow → first row 14, three rows 18 tall at 7 apart, names on one column, the
violet link 14 clear, lede 136 → 110.

**Nothing is lost, because the rows never needed telling apart in words.** Each
says what kind it is twice and per ROW rather than per group: a store wears its
platform mark and a yellow date, Launch day a green dot and a green date — and
those two hues are `CAL_STATUS.waiting` and `CAL_STATUS.launch`, the same
colours their days wear in the grid three inches below. Colour sorts the list
and the month agrees with it without a label on either.

`.gcal-lede-head`'s rule is **deleted, not left dormant** — the dev bar's
argument, and here specifically because a rule with no consumer would bring the
unequal spacing back with it. `.gcal-lede-go` keeps its 14: it is a violet link
that LEAVES, the one thing in the block that really is a different kind.

**If a heading ever comes back it has to be true of every row**, or the block
splits into two groups again. That is the test the last two failed, and it took
three versions to state.

Two candidates were rejected on vocabulary while a heading still existed, and
they are worth keeping for whoever writes the next one. **"Pending" is taken** —
Apple's real state is *Pending Developer Release*, the phase AFTER this one,
which means the opposite thing (it is back with you). **"In progress" is what
the other face means**: a submission you are still filling in is in progress;
one that has gone is out of your hands, which is the whole reason this face
replaces the checklist when you press Submit.

**LAUNCH DAY IS A ROW OF ITS OWN (v6.58), AND THE RULE ABOVE IT CAME OFF IN
v6.62.** Jaco's both times, and the separation is the whole design: everything
above is a date a STORE will hand you, this is the one date you choose. In the
list it would sit under a heading saying IN REVIEW and read as a fourth store.

**IT IS SPACED LIKE EVERY OTHER ROW, AND IT TOOK TWO GOES.** The 1px rule at
white 7% went first: the line was doing a job position already does — the same
trade the step modal's section headers made when they lost theirs ("a line said
'a group starts here' with a graphic element, on a surface that had just lost
the header's and the footer's own lines; position says it more quietly") — and
the block already ends in a `.10` boundary, so the divider made two horizontal
rules inside 100px of a 254px column. That left behind the distance the rule was
holding, 7 of margin on the container's 7. Looking at it, Jaco asked for the
rest, and the cause was one step further back than the gap: **the step existed
to clear a HEADING, not to separate a kind** (above). Both extras are deleted
rather than zeroed — the margin, and the `padding-top` the border needed — so
`:first-child` has nothing left to special-case and that rule went too.

- **It is always there, which is why `_guideCalLede` no longer returns early on
  an empty `waits`.** The waits come and go with the review; the launch date is
  true about the month whether or not anything is out, and a control that
  vanishes when you cancel your last submission is one nobody can rely on. With
  nothing in review the block IS this row, and now that costs no rule at all:
  one row in a list of one.
- **A native `type="date"`, hidden inside the `<label>`** — 0×0 and clipped, not
  `display: none`, which would take it out of the accessibility tree and stop it
  receiving the click. Release Timing already edits this field with one
  (`#ob-date`); a second date UI for one value is how two pickers start
  disagreeing about what a valid date is.
- **It writes through `setLaunchDate`, which gained `renderGuide()`.**
  `renderDashboard` does not rebuild the guide column — the same trap
  `_doFinalSubmit` is written under — so without it the date you just picked
  would land on the next unrelated repaint and the row you set it from would
  still show the old one. Verified end to end: picking Sep 25 turns the 25th
  green in the visible month and rewrites the row in one paint.
- **The dot and the date take `CAL_STATUS.launch` through `--d`**, not a
  literal, so the row and the box on that day are one fact stated twice — the
  same relationship the waits' yellow dates have with their band.
- **Empty is a real state, and it is `todo`'s register**: *Not set* at white
  34% with a hollow dot, and the month draws no box. Not an error, because it is
  not one — "not done yet: information, so no hue at all" is what that line of
  the colour table means. Verified: cleared → row says Not set, zero
  `.is-launch` cells.

**~~One thing this makes VISIBLE rather than causes~~ — FIXED IN v6.60, and it
was the one-line fix this note predicted.** `OB_PLATFORM_TIMING` had no `macos`,
so Mac fell through to iOS for its days AND for its label: the calendar printed
"App Store decision expected" and this list printed "App Store" for a submission
whose own card says Mac App Store, three inches away. With the marks in, iOS and
Mac in review together were two identical rows — same glyph (`macos → ios` is a
deliberate alias in `SM_TILE_MARK_ALIAS`, same mark different label) under the
same name, with nothing on screen to tell them apart.

`macos` is its own row in that table now. **The days are iOS's on purpose and
are DUPLICATED rather than referenced** — it is the same App Store queue and the
same 2.2-day average, and this table is data; a self-reference would be the
first expression in it. If Apple's Mac review ever diverges, that is the one
line that changes. `buildSubmittedCard`'s own `macos → ios` special case is dead
weight now rather than load-bearing, and can go whenever someone is in there.
Verified: the lede row and the day panel both say "Mac App Store", the wait's
dates are unchanged (14 → 17), and both cards still read Steam / Mac App Store
with "Usually 8 days" / "Usually 3 days".

**THE MARKETING NUDGE LEFT THE CARD AND THE GUIDE KEEPS IT (v6.56).** "Quiet
time. Go plan your launch →" (`.sub-nudge`) lived on the submitted card from the
day the wait got a face, on the argument that the one phase with nothing to do
in it is the one that should point somewhere. That is still true; what changed
is that a better surface started saying it.

**It is a sentence about YOUR TIME, not about this submission.** Everything else
on that card is a fact about that build — the store, the version, the day an
answer is due — and where to spend the days the wait has just freed up is the
CALENDAR's subject. `_guideCalLede` prints it once, in the same violet with the
same arrow, under the list of what you are waiting on, and it exists for exactly
the span the button did.

**And it multiplied.** One card said it once; three platforms in review said it
three times on one screen, identically, while the month said it once. That is
noise proportional to the number of platforms — the shape of a line that is in
the wrong place rather than one that is merely repeated.

The cost, knowingly: with the guide collapsed, or on the checklist face, the
invitation is nowhere. `_doFinalSubmit` flips the guide to the month at the
moment of sending, so it is on screen when it matters — but someone who works
with that column folded will not see it at all. **If that bites, the fix is the
collapsed rail, not this button coming back.**

Removed rather than switched off, all three pieces: the markup in
`buildSubmittedCard`, `.sub-nudge`'s rules, and its selector in the cancel
hold's GONE-not-dimmed list. Verified after: zero `.sub-nudge` in the document,
card 233.4 tall ending in "See what you sent" on `in_review` and in the Release
button on `accepted`, and a full cancel hold still correct — red edge
`rgba(255,59,120,.55)` with its `.12` ring, CANCELING SUBMISSION in
`rgb(255,59,118)`, note and toggle at 0, segbar and note at .35, everything back
and still submitted on release.

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

**SUBMITTING IS A HOLD, AND THE FILL IS WHAT YOUR THUMB IS DOING (v6.62).**
Jaco: *"mantener pulsado el botón de submit ES LO QUE RELLENA el contenedor."*

**THIS FILE HAD BEEN CALLING THE FILL "THE CANCEL HOLD RUN FORWARD" SINCE v6.39
AND IT WAS NOT ONE.** Cancelling is a hold: the red sweep runs for exactly as
long as the button is down and letting go is the undo. Submitting was a CLICK
that started a 1100ms animation you could not stop. So the card offered a bar
you could abandon for the reversible act — withdrawing, undoable by releasing —
and a bar you could not for the irreversible one. Exactly backwards, for three
versions, under a note asserting the opposite.

**A prose claim of symmetry is not symmetry.** The two shared their paint and
nothing else, and the paint is what kept anyone from noticing. If two things are
one idea, the MECHANISM has to say so — that is the general form of this, and it
is the same failure as `smReadyToShip`'s two notes down: a comment describing
what the code ought to do, never checked against what it did.

It also meant the bar measured nothing. A bar that reports elapsed time on a
decision already taken is a loading screen; a bar tied to a thumb is a clock you
are holding the hands of.

`submitHoldStart` / `submitHoldEnd` (app.js) are `cancelHoldStart`'s twin:

- **ONE NUMBER.** `SM_SUBMIT_HOLD_MS = SM_CANCEL_HOLD_MS`, by reference rather
  than a second 1400 — send and withdraw are one gesture in two directions, and
  a card teaching two different hold lengths has taught neither. v6.61's own
  argument for 1100 ("you are watching, not deciding") was right about a click
  and is void for a hold: you are deciding, so it has to be long enough to
  abandon. `--submit-fill` still carries it to the CSS from that constant.
- **A refusal is not a hold.** `submitStepClick` is now the three gates and
  nothing else, returning `true` when clear and `false` when it has already
  answered with a shake or a spotlight. The hold asks first and simply does not
  start, so an unconnected account still shakes the gear on the press with no
  fill creeping along behind the refusal.
- **Letting go anywhere cancels** — `pointerup`, `pointerleave`,
  `pointercancel`. Sliding off the row mid-hold is an undo rather than a
  submission whose bar you can no longer see.
- **Only a completed hold changes anything**: an early release costs one class
  removal, one node removed and no render.
- **`prefers-reduced-motion` keeps the hold and drops only the fill.** The
  gesture is the safety; removing the bar must not remove the second chance.
- **`user-select: none` + `touch-action: none`** on the ready row, or the
  browser reads a 1.4s press as "start selecting" on a pointer and "begin
  panning" on touch, and takes the gesture away mid-fill.

**THE STEPS GO, THE BOX DOES NOT MOVE, AND THE WORD IS WRITTEN OVER THEM.**
Jaco's design, and it fixed the one thing the hold got wrong on its first pass:
*"puedes hacer desaparecer los 4 pasos anteriores, sin modificar el tamaño de la
card, y escribir el submitting encima."*

The line was inserted in FLOW after the release block, which **pushed the Submit
row 39.1px down, out from under the thumb holding it** — measured, card
376 → 415.1. On a click that is ugly; on a hold it is close to a bug, because a
row sliding out from under a stationary pointer fires `pointerleave` and cancels
the gesture that caused it. **A control must not move as a consequence of being
pressed** — the submitted card's disclosure toggle was rebuilt under exactly that
rule ("the button fled from under the pointer and made its second press a hunt").

- `visibility: hidden` on the ROWS, not `display: none` and not on the list:
  every row keeps its box, `.ios-step-cards` keeps its height, and the card is
  the same size to the pixel. Verified 376 → 376 → 376 across press, release and
  a second press, with the rows back and no node left behind.
- **EXCEPT THE ROW YOU ARE HOLDING.** Jaco: *"¿crees que el botón de submit
  debería desaparecer mientras lo pulso? Yo creo que no, porque necesito saber
  qué estoy pulsando."* He is right, and the reason is stronger than visibility:
  **Submit is the only row in the list that is still TRUE.** The four above are
  finished work being cleared away — the close started early — while Submit is
  not being cleared, it is the thing HAPPENING. Hiding it made the card
  contradict itself: announcing an act in 21px green while deleting the control
  performing it. And a control that vanishes under a held thumb is worse than
  one that moves, which this file refused twice over: a moving control makes its
  next press a hunt, an absent one gives the gesture nothing to confirm against,
  and on a 1.4s hold the row is the only evidence your thumb is on the right
  thing — the fill covers the whole card and says nothing about where you are
  pressing. **It costs no space**, which is what makes it free rather than a
  trade: the word is absolutely positioned at the TOP of the list and Submit is
  the LAST row. Measured mid-hold: four rows hidden, Submit visible on its green
  fill, card +0, and 176.9px of clear air between the word's bottom and the
  row's top. `:not(.submit-step-card)` is the whole change.
- **The list's own top line goes with them.** Jaco: *"la línea divisoria
  horizontal encima del primer paso también debería desaparecer."* It is a third
  object — the line above the FIRST row belongs to `.ios-step-cards`, not to any
  row, moved onto the container in the first place so a row's hover could not
  blink it away — so hiding every row left one white hairline floating over an
  empty box, ruling off a list that was no longer there.
- **AND NEITHER CAN BE EASED, which is a Safari precaution rather than a
  measurement.** Jaco: *"los 4 pasos desaparecen no inmediatamente, como después
  de empezar, y queda sloppy."* Sampled every frame in Chromium they are
  `hidden` on the FIRST frame after the press — zero lag — so this file's own
  rule decides it: he develops in Safari, that is unverifiable from here, and the
  preference is always a mechanism with no per-engine behaviour over one that has
  to be checked in an engine nobody can drive. The row carries
  `transition: opacity .22s`, so a transitionable property is already sitting on
  that element; `opacity: 0` and `transition: none !important` alongside the
  `visibility` make it impossible for any engine to ease either. Out is
  instantaneous by construction.
- **Coming back is not**, and that asymmetry is kept rather than tidied: with
  `is-submitting` gone the row's own `.22s` applies again, so an early release
  eases the list back over 220ms. Instant out is decisive; a gentle return is
  what an undo should feel like. Verified back at `opacity: 1`, visible, on the
  frame after release.
- **Hiding them is not a trick to make room — it is the close, started early.**
  `_doFinalSubmit`'s motion is the box closing over the space the steps
  occupied, with the header and release block surviving untouched because they
  are identical on both faces. The hold now shows precisely that: the two things
  that stay, the word arriving, the list already gone.
- The line is **prepended into the step list and absolutely positioned at its
  top**, which deleted the anchor branch: no `:scope > .card-release-block` /
  header fallback, because the list exists in every layout arm. All the geometry
  is CSS — `left: 12px` cancels the list's own `-12` bleed, so the word lands on
  **x = 21**, the card's one real text column, measured. And the top of the step
  list is where the status line sits on the submitted card, so the word appears
  where it is about to live and stays there through the close.

**TWO SMALLER THINGS WENT WITH IT, both Jaco's eye.**

*"En el top stroke hay algo extraño, raro."* Measured: **two 1px lines stacked**
at the top of the Submit row — its own `border-top: 1px solid rgba(47,220,128,
.25)` and, touching it, the step list's divider, drawn as each row's `::before`
at `height: 1px; background: rgba(255,255,255,.07)`.

**Killing the divider was the first answer and it fixed the wrong half**: *"sigo
viendo el stroke curvado raro."* The BORDER is what had to go, and the radius is
why — this row carries `border-radius: 8px`, and **a border follows the radius**,
so the line curled up into a hook at each end and the row wore a rounded-box
outline that stopped a third of the way down each side. Nothing else in the list
draws a border, which is exactly why nothing else did it.

**AND THEN THE DIVIDER WENT TOO, WHICH IS THE THIRD PASS AND THE ONE THAT NAMES
THE RULE.** Jaco: *"debería desaparecer la divisoria horizontal justo en el
momento en el que el recuadro de submit se convierte en persistent después de
completar todo."*

It is the two-marks argument one step further in: a LOCKED Submit row is drawn
like every other row and needs the list's line to say where it begins, but a
READY one gains a soft green box of its own — and **a box's own edge is already a
boundary**. Ruling a line over something visibly bounded is exactly what the
border was guilty of, just quieter.

So the line's whole job is to exist until the box does. The moment every step is
answered the row fills and the divider leaves in the same paint, and what
separates Improve Your Submission from Submit is the fill — which is also the
thing inviting the press. One selector, `.submit-step-ready::before`; locked
keeps the standard white divider, having no box to be bounded by. Measured:
locked → divider `block` at `rgba(255,255,255,.07)`, no fill, no border; ready →
divider `none`, fill `rgba(47,220,128,.04)`, no border, and the row above keeps
its own line.

**Three passes on one 1px boundary, and the sequence is the point**: a border
that curved, a divider that duplicated the border, and then a divider that
duplicated the fill. Each removal was correct and each one only became visible
once the mark above it was gone. When a small thing keeps looking wrong after a
fix, the fix probably uncovered the next one rather than missing.

*"Si hovereo sobre el botón, debería estar verdecillo no blanco."* The orange
hover left with the pulse, which dropped this row onto the generic white 7% every
pressable row uses — wrong here because **this is the one row whose resting state
is already coloured** (green 4% with a green border, because it is ready). A
white wash over that does not brighten the state, it greys it: the row goes
duller on approach. `rgba(47,220,128,.10)` against the resting `.04`, the same
order of step white 7% is over nothing. Scoped to `.submit-step-ready` — a LOCKED
row keeps the white, having no green to be more of.

**`_doFinalSubmit` LOST ITS FILL BLOCK ENTIRELY**, and with it the long note
explaining why the commit used a `setTimeout` rather than `animationend` (a
backgrounded tab would have left the card green forever with nothing applied).
There is no timer between the press and the state change now — the hold's own
timer is the only clock and it owns both the bar and the decision. That function
is back to the state change plus the close, which is what it was before v6.39;
the beat that "gives the advance something to be the end of" belongs to the
gesture, not to the commit.

~~The label stays "Submit"~~ — **IT SAYS THE GESTURE ONCE THE GESTURE EXISTS
(v6.63).** The sentence this replaces was *"the fill teaches the rest: a short
press starts the bar and snaps it back, which is a safe thing to discover"*, and
that was the whole bet: that the row would teach its own gesture to anyone who
pressed it. Jaco, relaying feedback: *"se siente un poco confuso porque nada te
dice que tienes que pulsar para submit."*

**MEASURED, THE ROW SAID NOTHING, AND THE FILL COULD NOT HAVE TAUGHT ANYTHING
BECAUSE NOBODY PRESSES WHAT DOES NOT LOOK PRESSABLE.** Every channel was spent
drawing it as a sixth step:

- the "ready" fill is `rgba(47,220,128,.04)` over the card's `rgb(20,20,20)` →
  **rgb(21,28,24)**, luminance 20 → 26.2: **6.2 points out of 255**;
- `border-top-width` is **0** — the green top border this file elsewhere credits
  `.submit-step-ready` with went in v6.62, because it followed the 8px radius and
  curled into hooks, and the divider above it went in the same batch. So the
  three marks that said "ready" became one, and it is the weakest;
- the name is 15px/500 in `rgb(245,245,245)` — **identical to a finished step's**;
- the disc is still the pending `rgba(255,255,255,.07)` with a grey digit while
  the five above are solid `rgb(49,220,128)`: the one row you must press is the
  only one that looks unfinished;
- it is the **only row with no chevron**, so the trailing column says "this opens
  something" five times and then says nothing where the act is;
- and the only statement of the hold was a `title`, i.e. a tooltip you find by
  hovering the thing you do not know is pressable.

**THE LABEL CHANGES WITH THE STATE, WHICH IS WHY IT IS NOT A RENAME.** Jaco:
*"cuando todos los pasos están completados y ya vas a poder submitear, el texto
cambia a Hold to Submit."* Locked, the row is a NAME — the last item of a
checklist, and printing a gesture you cannot perform yet is an instruction for a
shut door. Ready, it is the only act on the card, so it stops naming itself and
says what to do. Same shape as the store pill reading "Set price" until Business
is answered and `GET` after: **what is empty says so, what is available says how**.

It costs no geometry: at 15px IBM Plex Mono "Hold to Submit" is **126px** in the
308.5 the row leaves after its disc, against "Improve Your Submission" at 296.5 —
so the longest name in the list is still some other row's. Measured across
locked → ready: row **354.5 × 50** in both, no clipping.

Four strings rather than two (`step.submit.hold` / `step.web.submit.hold`, en and
zh-CN), because the two existing labels already go through `t()` and a hard-coded
English pair beside them would be the one place this control is not translatable.
The `title` / `aria-label` keep the same words rather than being dropped: they are
the ACCESSIBLE name, and the visible label being identical is the point.

**TITLE CASE — "Hold to Submit", not "Hold to submit"** (Jaco: *"Submit con
mayúscula"*). The verb is the button's own NAME, the one the locked row prints
and the one the whole app calls this step, so lower-casing it inside the
instruction would make the row read as a sentence about some other control. Web
takes **"Hold to Deploy"** for the same reason. All four places carry the same
string — the two locale keys and the `title` / `aria-label` fallbacks — so the
accessible name and the visible label cannot drift apart.

**THE SUBMITTED ARM IS DELIBERATELY THE LOCKED ONE.** `submitDone || stepLocked`
prints the plain name, so once the platform has been sent the row is a finished
step called Submit, not an instruction for something already done.

**AND THE TEST WAS THE WRONG ONE — v6.64 SHIPPED IT AND v6.65 FIXES IT.** Jaco,
on the live build: *"el botón submit cambia a Hold to Submit cuando todavía me
queda el Tracking que seleccionar. No debería pasar."*

**It is this entry's own argument used against itself.** `stepLocked` is
`locked || !connected` — the STEPS and the account, and nothing about the
destination. `submitStepClick` refuses on THREE gates and the third is the
track: press a row reading "Hold to Submit" with no track and the hold does not
start, it spotlights the chip up in the release block. So the row was printing
a gesture that cannot be performed, which is precisely *"an instruction for a
door that is shut"* — the sentence three paragraphs up, on the one state it did
not enumerate.

**The right test was already computed and already CLAIMED to be doing this.**
`readyToSubmit` is `connected && !locked && !!selTrack && !submitDone` — the
hold's own three gates — and its comment says it *"still decides ready-vs-locked
below"*. Nothing read it. **A variable whose note claims a job it does not have
is the same failure as the fill that called itself the cancel hold run
forward**, and this file has now recorded that shape three times.

**The green fill moves with the label**, because they are one claim: four ticks
and no destination is a LOCKED row, which is true, and it leaves the track chip
the only lit thing on the card when gate 3 points at it. The `submitDone` arm is
branched BEFORE this test rather than through it — `readyToSubmit` is false once
sent, and a finished step must keep the paint it had.

Measured on macos, all four states: no track → "Submit" / `submit-step-locked`,
and the gate returns **false** with `is-spotlight` on the card and `is-spotlit`
on the chip; track chosen → "Hold to Submit" / `submit-step-ready` at
`rgba(47,220,128,.04)`; a step taken away with the track still set → back to
"Submit" / locked at 2/4; restored → ready again.

**One probe note, and it is the coordinate-frame lesson in another shape.** The
first run of this reported `gate: true` with no track — the bug apparently not
reproducing — because the delete and the call were split across two turns and a
render in between had re-seeded the track. Measured in ONE turn it is `false`
every time. **A state you clear in one probe is not still cleared in the next
one**; if a gate has to be tested, clear, assert and call inside a single
evaluation.

**AND THE CLICK WAS THE OTHER CANDIDATE — read this before reaching for it.**
Jaco weighed two: the label, or *"lo convertimos en un clic, que después hace la
animación"*. The click is what anyone expects of a button saying Submit and needs
no discovering, which is exactly the complaint — but it is also **precisely what
this section replaced**, a click that launched 1100ms you could not stop, with
the abandonable bar on the reversible act and the unabandonable one on the
irreversible act. It would also demote the fill: a bar tied to a thumb is a clock
whose hands you are holding, and the same bar over a decision already taken is a
loading screen. The honest case for it is that the second chance is not lost —
the submitted card's own cancel hold can still withdraw it. The label was chosen
because **the complaint is about discovery, not about the mechanism**, and
changing the gesture to fix a label pays too much.

**STILL OPEN, AND IT IS THE HALF THE LABEL DOES NOT BUY:** the weight. The six
points of luminance and the pending grey disc are untouched, so the row reads as
pressable only once you have read the words. That is the backlog's *"make the
Submit button celebratory"* and the two levers measured here are the Release
button's solid `#2fdc80` and the disc going green.

Verified end to end: mid-hold the card carries `is-submitting` with SUBMITTING…
in it; released at 400ms nothing is flipped, no `.sub-state-sending` is left and
the card is back to `submit-ready`; held through 1400 it flips, prints
IN REVIEW…, advances and turns the guide to the month. And the fill really is
progressive — screenshotted at a deliberately slowed `--submit-fill`, the green
wash covers ~55% of the card with a clean vertical edge.

**One measurement trap, worth carrying.** `getAnimations({subtree: true})` and
`getComputedStyle(card, '::after').transform` BOTH came back empty for this fill
— zero animations, `transform: none` — while `animationName` read
`subSubmitFill` and `animation-play-state` read `running`. The animation was
fine; the probes are blind to pseudo-element animations in this pane. A
screenshot settled it in one shot. Same shape as the scroll-restore bug's own
note: when a probe and the screen disagree, suspect the probe.

**THE ORANGE PULSE IS GONE (v6.62).** Jaco: *"quita el ring pulsante naranja
feo."* `@keyframes submit-step-pulse` threw a 5px `rgba(255,149,0,.3)` ring out
of the Submit row every two seconds, forever, with a matching orange hover.
Three reasons, any one sufficient: the hue is **not in this palette** (`#FF9500`
would have been a third amber beside the two this file already flags as a
duplication problem); amber means *this needs you* and the row it ringed is the
one that is READY, which is green's job and which `.submit-step-ready` already
says twice with its green tint and green top border; and **a ring is the one
mark this app does not use** — the step disc dropped its ring, the micro-buttons
their strokes, the calendar refused rings three times. It also never stopped,
and a nudge that repeats forever is not pointing at anything.

Removed rather than switched off — the keyframes, both rules and the
`pulseClass` that emitted it. What says "ready" is the row's green; what says
"going" is the hold's fill.

**THE SUBMITTING WORD IS THE STATUS LINE, NOT THE SUBMIT ROW (v6.61).** The
green fill has been the cancel hold run forward since v6.39, and then said so in
the wrong voice: `Submitting…` was written into the pressed row's own
`.ios-step-name` — 15px, sentence case, `--text-dim`, at the bottom of the card
— while the cancel hold says CANCELING SUBMISSION in the 21px mono status line.
One idea, two registers, one of them a whisper. Jaco: *"mismo tamaño y posición
que cuando pone CANCELING SUBMISSION."*

It is a real `.sub-state` / `.sub-state-line` now, the submitted card's own
markup borrowed rather than approximated, in the app's done green (`#2fdc80` —
the Release button, the tick, launch day) because this is the act that finishes.
Measured mid-fill: SUBMITTING… at `rgb(47,220,128)`, 21px, 500, IBM Plex Mono —
`.sub-state-line`'s own values, inherited rather than restated.

**It rides ABOVE the fill.** `.is-submitting::after` is `inset: 0` at
`z-index: 3`, so a line left in normal flow reads through a 30% green wash — the
register this app reserves for what is no longer the point. `position: relative`
(a static element has no stacking position at all) plus `z-index: 4`.

**THE ANCHOR IS THE HEADER, AND THE FIRST ATTEMPT PROVED IT.** It was inserted
after `.card-release-block`, on the argument that the submitted face's order is
head, release block, state — so the line would arrive exactly where it is about
to live. Measured on a real steps card, its children are only
`active-card-head` and `ios-step-cards`: **there is no release block at that
level**, because it came down into Upload Build's body when the steps went
inline. The fallback fired and the word landed at the BOTTOM — right type, wrong
place, which was half the bug. The selector is `:scope > .card-release-block`
first and `:scope > .active-card-head` second, so neither layout is the special
case. Verified: order head → `sub-state` → steps, and zero `.sub-state-sending`
left after the close, with the card reading IN REVIEW… in that same slot.

**`smReadyToShip(pid)` PRESSES SUBMIT FOR REAL (v6.61, AND IT DID NOT WORK UNTIL
v6.62).** `submitStepClick` refuses on three counts — no account, steps
outstanding, no track — so the button could not be exercised from the card at all
without doing an afternoon's work first. This **satisfies the gates rather than
bypassing them**: jumping straight to `_doFinalSubmit` would test the animation
and leave the three refusals (the gear shake, the step spotlight, the chip nudge)
unexercised in the one place they matter.

**v6.61's version reported success and achieved nothing**, and the way it failed
is the more useful half of this entry. Jaco: *"no marca los pasos anteriores como
completados, y al dar a submit me muestra el estado dim de lo no completado."*
Measured, the log said "4 steps ticked" while `platformStepCount('macos')` said
`complete: 0`. Two independent mistakes, stacked, each silent on its own:

1. **`markTaskDone` writes a status nothing reads on this platform.**
   `platformStepCount` branches per platform, and for **ios / macos / macos_full /
   android / steam** it counts `is<X>SectionComplete(step)` — derived from the
   ANSWERS. Only the remaining platforms (Web, PSN, Xbox, Switch, Epic) fall
   through to the `platformStepStatus` default. So the map this was writing had
   no consumer at all.
2. **`_paintStepRow` returned on its first line.** It looks up
   `#dot-<pid>-<stepId>`, and **only two builders emit that id** (render.js:5119
   and 5897). The builder this card uses emits `.ios-step-num` with no id, so
   `getElementById` came back null and the function returned before touching a
   class. No error, no warning.

**v6.61's own note theorised about ORDERING** — "mark after the render, because a
render recomputes from `_paneComplete`" — and that trap is real but was not this
bug: no ordering can help a status nobody reads or a paint that never runs. The
theory was written from reading the code and never checked against
`platformStepCount` afterwards, which is the actual mistake.

**So the rule this leaves behind: a helper must report what the STATE says, not
what its own loop did.** The old line printed the length of its `forEach`. The
new one calls `platformStepCount` after the render — the same function the card's
progress bar and gate 2 read — and `console.warn`s the outstanding section ids if
it fell short, so it cannot be more optimistic than the screen.

What it does now, for the App Store family:

- **It fills the DATA, so the ticks are real and survive a render.** Each
  predicate gets the minimum it wants: a build with `platformBuildProcessing`
  false plus a track, every `IOS_INTENSITY_QUESTIONS` / `IOS_CONTENT_YN_QUESTIONS`
  answered, `ageCategory`, a privacy URL with `collectsData: 'no'`, `hasIAP` and
  `usesEncryption`, one screenshot in the asset pool, and the two
  "you have looked at this" flags (`improveSubmissionSeen`, `*LocalizationsSeen`).
  Nothing is painted by hand. v6.61's "the ticks last until the next full
  `renderDashboard`" limit is gone with the mechanism that caused it.
- **Every field goes through `_appStoreAnswers(pid, field)`**, the app's own
  router, never a bucket chosen by hand — Mac App Store shares Content Rating and
  Data Privacy with the App Store (`IOS_MAC_SHARED_ANSWER_FIELDS`) and keeps
  Business to itself, so writing `state.macSubmitAnswers` directly would put
  three fields where nothing checks them: mistake (1) one layer down.
- **It only fills blanks**, so running it over real work does not overwrite it.
  Values are the quietest true ones — intensity `none`, yes/no `no`, age
  `not_applicable` — because a submission a helper fabricates should claim as
  little as possible about the game.
- **It activates the platform first.** All three pieces of state were correct and
  nothing appeared, because `activePlatforms` was empty and the grid draws from
  that. A platform you have not added has no card, and a card is the point.
- **Android and Steam are named as NOT covered** rather than failing quietly:
  they are answer-derived too and their fillers are unwritten, so the helper
  warns.

Verified from a real press on `macos`: 4/4 complete, all four rows carrying
`is-complete` with their discs `is-done`, the submit row **not** `submit-step-locked`,
and the click producing SUBMITTING… at `rgb(47,220,128)` / 21px for six samples
across the 1100ms fill, then `platformFlipped.macos` written, zero
`.sub-state-sending` left, the slot reading IN REVIEW… and the guide on the month.

**One correction to v6.61's anchor note.** It said the steps card has no
`.card-release-block` at top level. That is true in ONE layout arm and false in
the other — measured under `layout: modal` the order is
`active-card-head > card-release-block > sub-state > ios-step-cards`, so the
first selector fires there and the fallback fires elsewhere. Which is exactly
why the two-selector form is right, and why "measured once" is not the same as
"true".

Console-only, for the reason the dev bar was deleted under.

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
clear of the chevron.

**AND THE EYEBROW NAMES THE FACE, which is where those labels ended up (v6.50).**
It said "Shippy Guide" on both faces — naming the CARD, while the two icons that
pick between the faces went unlabelled and the one line with room to spare said
nothing that changed. It is `guide.eyebrow.list` / `guide.eyebrow.cal` now,
**Shippy Checklist** and **Shippy Calendar**, branched on the same `onCal` the
body already reads.

"Calendar" and not "Planner" because the app calls that surface a calendar
everywhere else — the topbar tab, `SM_CAL_SVG`, `state.guideCal` — and a second
noun for one object is how two names for the same thing begin. One string in the
locales if that is ever re-argued.

Measured on the real column (252 wide): CHECKLIST's ink is 153.6 and stops
**48.8px** short of the segmented track, CALENDAR's is 144 and stops 58.4 short;
neither wraps and the card is 456.8 tall on both faces, unchanged. **The figure
this note used to carry — "the eyebrow's ink ending 50.8px short" — was stale**
and would have condemned the longer name on arithmetic: it implies the track
starts at 166 from the eyebrow's left, where it really starts at 202. Re-measure
before trusting a gap in this row; do not subtract from the old number.

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

**AND THERE ARE NOW TWO WAYS TO DRAW IT — `state.calWaitStyle`, up for a
decision.** `'band'` is everything above and still the default; `'stripe'` gives
each submission a 3px rule of its own under the number. They answer two
different questions and that is the whole comparison: the band answers *am I
waiting on anything today* and deliberately collapses every wait into one
stroke, the stripe answers *on what, and how far along* — and, because a lane
belongs to exactly one submission, it can be PRESSED, which a band covering
three builds never could.

`smWaitStyle()` in the console flips between them and re-renders; `?wait=stripe`
survives a reload (`sm.wait`, the same shape as `sm.layout`).

Four things the stripe had to be taught, three of them the band's own lessons
one layer down:

- **The lanes are ordered ONCE for the whole month** (`_calWaitLanes`), sorted
  by send date then platform id. A wait that picked its row from the days it
  happens to cover would change lanes the moment another one started beside it,
  and a run that jumps rows mid-week is not a run.
- **Every cell reserves the whole lane block**, drawing `.gcal-strip.is-off` for
  a lane it is not inside — the 4px dot strip's rule exactly: a day that gains a
  wait must not get taller and shove its row.
- **The height is derived from the same three lines the cell already used.**
  `--lane` is written on the grid as `n×3 + (n−1)×2` and the cell is
  `55 + 4 + lane`. Measured with two lanes: 10 / 28 / 3 / 4 / 3 / 2 / 3 / 11 =
  67. One lane is 62 a row, two 67, three 72 — **+42 / +84 / +126 of card
  height** against the band, which is the cost side of the trade and the reason
  `GCAL_MAX_LANES` is 3.
- **The cap is 2px, not the band's 8.** A 3px rule capped at 8 is a lozenge; the
  cap has to read as an end, not as a shape. A row edge still counts as both
  ends, for the band's reason.

**FOCUS IS THE ABSENCE OF DIMMING.** Every strip is the wait's yellow because
colour is the STATE here as everywhere on this grid, so the focused one cannot
take a hue of its own, and a ring on a 3px rule is two marks on one stroke — the
argument this grid already settled for the day boxes. The others step back to
`.35`, this app's own value for "still true, just not what you asked for".

**And the press has to land somewhere worth arriving at**, or a strip is a
second, thinner copy of the cell above it. `guideCalWaitOpen(pid, iso)` opens the
day AND focuses the submission, and the panel prints `.gcal-focus`: the store,
both dates, and `Day N of M`. Those are the facts neither presentation can show
— band and stripe both say "a wait covers this day" and neither can say WHOSE or
HOW FAR. Focus is per SUBMISSION, not per day, so walking along a run keeps the
block and only the day number changes; pressing the same lane on the same day
lets go of it and leaves the day open, the way pressing a day folds the panel.

**The cell stops being a `<button>` in stripe mode** (a `<div>` with
`.gcal-day-main` taking the old press) because buttons cannot nest — the same
thing the panel's three-control rows already do. Band mode's markup is untouched;
verified 55px cells and 10 banded days after flipping back.

**It expires like `submission.layout` does.** When the choice is made the loser
comes out — the field, the hook, the arm in `buildGuideMiniCal`, the CSS and this
note.

**The band is `rgba(255,216,77,.13)`** — `#FFD84D` at 13%, the card's in-review
yellow to the digit, so the segment and the band are one statement made twice.
And `.gcal-dot.is-est` draws `var(--d)`, the dot's own colour, where it
hard-coded `#4ADE80` for as long as it existed: invisible while every submission
item was green, and a bug the moment they stopped being.

**A PROGRESS SPLIT WAS TRIED AND REMOVED, and the argument generalises.** v6.45
gave the days already waited a heavier `.30` against the `.20` of the days still
to come, so the band read as a bar filling toward its own end with today as the
seam. It shipped, it measured correctly, and it came out in v6.48.

**A calendar already says where today is.** Every day left of the violet box is
elapsed by construction; the split restated in COLOUR what POSITION states for
free — and it did it in the one cell already carrying the loudest mark on the
month, so the two competed.

The question worth answering is "how much longer", and the ends answer it better
than a tone can: since they became filled boxes the end of a run is a visible
object and the days between are countable cells. Three squares is a more precise
reading than a 20 → 30% step in luminance, and the exact version — `Day 2 of 3` —
is already printed in words in the day panel.

It also cost a tone. Yellow was being asked to mean four things in one grid
(band pending, band spent, end box, dot), and every added tone makes the next one
harder to introduce. **Anything that tries to say "how far along" on this grid
has to clear that bar first.**

**The ends are the DAY'S OWN BOX, filled (v6.47).** A 38px band against a 4px
dot had the ink inverted against the meaning: the stretch where nothing happens
was the loudest thing in the grid and the two dated facts it runs between were
drawn like any marketing reminder. Fixed by raising the facts, not by softening
the state — softening would have made the month say less, and the band cannot go
quieter anyway.

The first attempt painted 4px of stronger yellow into the band's edge, and it
was right about the problem and too quiet to solve it: **4px in a 38px cell is
below the size at which anything on this grid reads**, which is the same floor
the kind-vs-colour note ran into with the 4px dot. Jaco drew the answer and it
is the grid's own vocabulary — fill the 28×28 box. Today fills, launch fills,
nothing wears a ring; an end is a third thing that happens to one day, so it
fills too, in `#FFD84D` with `#2A2205` ink. **The numbers inside the band go
yellow with it**: with its ends filled the band stops being a highlighter laid
behind a table and reads as one object, and white-80% digits sat on it like text
that had not been told.

**AND IN v6.58 THE BOX CAME OFF AGAIN — IT IS A NUMBER, NOT A CHIP.** Jaco:
*"no quiero aturdir."* He was right, and **what changed is the COUNT, not the
argument**. v6.47 filled the box because one strong mark was needed against a
38px band and 4px of stronger yellow could not carry it — with ONE wait on the
month. v6.56 then fixed a bug that had been hiding every second wait's terminal,
so the same month draws two filled boxes now, plus today's violet, plus launch's
green: four solid chips in a 270px table. **A weight that is right once is not
right four times**, and that is the shape of this whole class of mistake — the
value was never wrong, the census was.

**Green was asked for and is the one answer this cannot take.** On this grid
green is `done` / `launch` and it is the only green thing on the month; a
decision day is `waiting` — the store still has it. A green answer date would
claim the submission had finished and would collide with the one cell that means
exactly that, a row or two down.

So the hue stays and the contrast is bought INSIDE it: the days a wait passes
through step back to `rgba(255,216,77,.55)` and the day it ends on keeps the
full `#FFD84D` at 600. That is this file's own instruction — "colour is the
emphasis, never weight" — applied honestly, with the weight riding along rather
than doing the work alone: two tones of one hue is a comparison the eye makes
instantly, where 500-vs-600 at 12px on a mono face is not. Measured: band days
`rgba(255,216,77,0.55)` / 500, both terminals `rgb(255,216,77)` / 600, no
background on either.

The cost, knowingly: the band's numbers were full yellow from v6.47, when they
were the only yellow ink in the cell. They are the ground the terminal is read
against now — which is the job the band's own fill already does for the row.

**TODAY OUTRANKS THE END**, and launch and the picked day with it. Written as a
`:not()` chain rather than left to source order, because this rule carries three
classes to `.is-today`'s two and specificity would hand it the win. The
argument: violet is the ONLY thing on this month that says *you are here*, while
an end is said twice — by the box and by the band's rounded cap, which is still
underneath. So on the two days a wait begins or ends on today, the cap carries
it alone and nothing unreadable is lost.

The send day and the decision day are drawn **identically**, which the rest of
this grid would argue against — a fact and a guess are a filled dot and a hollow
one everywhere else, and the dots under them still keep that apart. Worth
revisiting if the two ends turn out to need separating.

**`run-open` / `run-close` are NOT `span-start` / `span-end`, and running them
off one test is the bug this nearly shipped with.** The span pair is about the
stroke as drawn, where a row edge counts because the band cannot flow from
Saturday to Sunday; the run pair is about the WAIT, which knows nothing about
weeks. Shared, every Saturday the band crossed would have worn a terminal — the
calendar claiming a submission ended there because the grid ran out of week.
Verified on a span crossing a week: the 19th (Saturday) takes `span-end` and no
`run-close`, the 20th `span-start` and no `run-open`, terminals only on the real
11th and 24th.

**AND A SECOND WAIT'S END USED TO VANISH INSIDE A LONGER ONE (fixed v6.56).**
`run-close` was derived as `!span.has(tomorrow)` — off the UNION — so the box
only ever landed where the whole band stopped. Steam out 11 → 19 with Mac out
14 → 17 drew one filled box, on the 19th, and the month said nothing about the
17th at all: two platforms, one answer date. Jaco spotted it from the grid.

The band is a union ON PURPOSE (*am I waiting on anything today*) and the day an
answer is due is a fact belonging to ONE submission — a union cannot hold two of
them. So `due` is collected in the same loop that builds the span, straight off
`_calWaits`, and `run-close` reads that set instead.

**This is the `run-close` / `span-end` lesson one level further in.** That pair
was separated because a WEEK boundary is not a wait's end; this separates them
because ANOTHER WAIT'S SPAN is not a wait's end either. The stroke and its
rounded caps stay the union's; the terminals are each submission's own. If a
third thing ever wants to mark the band, ask which of the two it is about before
reusing either test.

A day where two waits are due gets ONE box — it is a mark on a DAY, and the day
panel is what names which stores. Measured with Steam 11 → 19 and Mac 14 → 17:
band 9 days, `run-close` on 17 and 19 (was 19 alone), `span-start` on 11 and 13,
`span-end` on 12 and 19 — so the Saturday still caps without claiming a
terminal. Cancelling Mac leaves the band at 9 and one terminal. A wait due
inside the band on a Sunday (Android, sent the 8th) boxes correctly on the 13th,
and today keeps its violet: `is-today` still outranks the end.

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
shows. The launch date itself is `state.formData.releaseDate`, Mark's too.

**IT IS PRE-FILLED TO THE 28th OF THIS MONTH, NOT THE 29th OF NEXT (v6.60).**
The old default was next month's, which kept every submission deadline counting
back tidily inside that month — and put the green launch box on a month **this
face never opens on**. The guide resets `monthOffset` to 0 on the way in,
deliberately, because a glance that opens on a month with no "today" in it is
the one thing it must not do. So the one date the prototype most wants you to
see was always one page away. It went unnoticed because the Calendar TAB opens
on next month and showed it fine.

Still evergreen rather than hard-coded: past the 28th it rolls to next month's,
so a cold open in the last two days of a month has a launch ahead of it rather
than behind.

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

**THE WAIT SPEAKS ONLY ON THE DAYS NOTHING ELSE DOES (v6.62).** `Day N of M with
the <store>` used to print on every day of a span, the two ends included — so
the send day read "Day 1 of 3 with the Mac App Store" directly above "Sent to
Mac App Store", two lines in a 254px mono column differing by a tense, and four
lines with two platforms out. Jaco: *"con poner el Sent debería valer, el 1/3 y
1/8 me sobran bastante."*

The old argument was that an EVENT and a STATE are different facts — what
happened versus what is true — and it is a real distinction that still did not
earn a line. Both ends already carry a dated item of their own (`sent-<pid>`,
`decide-<pid>`), which is also what guarantees the panel is never left empty by
this; the days in between are the ones with nothing, and they are exactly what
the band exists to draw. So the test is the **open interval** `from < d < to`
rather than a pair of special cases: anything that ever puts a third dated item
on a span should drop that day too. It is per WAIT, not per day — verified on
Mac's decision day, which prints "Mac App Store decision expected" beside "Day 3
of 8 with the Steam Store".

**And removing the duplication exposed an off-by-one that had been there the
whole time.** `n` was `elapsed + 1`, counting CELLS, so on a 14 → 17 wait Sep 16
read "Day 3 of 3" with a full day still to come. It was invisible precisely
because the line it contradicted sat right above it: "Sent to…" saying Day 1 on
the day nothing had elapsed. With both ends silent the interval is exactly the
days that have passed, so `n` is a plain subtraction. Walked end to end: Sep 14
the item, 15 "Day 1 of 3", 16 "Day 2 of 3", 17 the item; Steam 1 through 7 of 8,
then its item on the 22nd. `m` is untouched — `to − from` is already
`ceil(days)`, the same rounding the decision item uses.

The cost, knowingly: the send day no longer states how LONG the wait is. That
fact is on screen twice already — the lede prints every wait's answer date, and
the card prints "Usually 3 days".

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

**A DERIVED ITEM IS A FACT, NOT A RECORD — AND IT CANNOT BE EDITED HERE
(v6.60).** `sent-<pid>`, `decide-<pid>` and `launch-day` are read off OTHER
state — the first two off `state.platformFlipped`, the third off
`formData.releaseDate` — where everything else on this calendar is a constant or
something somebody typed in. All three of a row's controls write to
`state.calendar.*`, and on one of these every one of them is a lie:

- the **×** writes `calendar.hidden[key]`, which hides the ROW and changes
  nothing about the submission. The band still crosses those days, the lede
  still lists the store, the card still says IN REVIEW — the month contradicting
  itself on one screen. Jaco: *"no debería poder borrar los 'x platform decision
  expected'."*
- the **tick** writes `calendar.done[key]`. "Done" has no referent for a day a
  store is going to answer on; the store decides that, and when it does the item
  stops being drawn by itself.
- the **kind dot** cycles Submission ⇄ Marketing on something that is a
  submission by construction.

So the panel draws them read-only: `<span>`s instead of `<button>`s, no ×, and
`cursor: default`. **Nothing else changes** — same row box, same kind shape,
same state colour, because all three are still true about it. A fact that LOOKED
different from an item would be a second vocabulary for "this is on the 17th".

`derived: true` sits on the ITEM (`_calIsDerived`), not sniffed from the key's
prefix, because a prefix test is a second place that has to know how ids are
spelled.

**And the guard is on the WRITERS too, which is what makes it a rule rather than
a hidden button.** `guideCalRemove` refuses a derived item even though nothing
in the UI now reaches it, and `calDraftDelete` — the Calendar tab's popover, the
OTHER door into `calendar.hidden` — got the same test. One rule, two doors. The
popover still DRAWS its delete button for these (it is generic markup with no
item in hand at parse time); that is the remaining half, and it belongs with
whoever next opens that builder. Verified: calling `guideCalRemove` directly on
`decide-macos@…` and `launch-day@…` leaves `calendar.hidden` untouched and both
items still drawn, while a real custom row still shows three BUTTONs and still
deletes.

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

**EXCEPT THE HEADER, WHICH HOLDS THREE TARGETS AND THEREFORE GOES ONE LEVEL
DEEPER.** Jaco: *"cuando doy a business, el title y el subtitle no se dimean."*

The paragraph above is right for the five groups holding ONE target each — the
mark reads as the section you landed in, and there is nothing inside it to
disambiguate. `.ias-header` holds **three**: Title, Subtitle and Business are
three separate pills in the nav and three separate rows of the same box. So
pressing any one of them lit all three, and the one place on this page where
the locator actually has a choice to make was the one place it said nothing.

It is **the same rule applied one level in**, not a second mechanism — a child
that IS the mark or CONTAINS it stays, everything beside it takes the page's own
`.5`. Two selectors, because the header is two levels (the icon is
`.ias-header`'s child, the three targets are `.ias-header-meta`'s) and Business
sits two boxes further down inside `.mac-spp-get-row`, which is what the
`:has()` is for. **It does not compound**: the header is never dimmed (it
contains the mark), so its children land at a flat .5 like every other group.

The meta strip is deliberately NOT given the same treatment — Content is the
only target in it, so the original argument stands unchanged.

Measured, with the transition extended to the three new levels so they travel on
the same curve: **Business** → title .5, subtitle .5, icon .5, get-row 1, header
1, strip .5, shots .5, sidebar .21. **Title** → title 1, subtitle .5, get-row
.5, icon .5. **Subtitle** → the mirror. **Content** → the whole header .5 and
the strip 1, unchanged. Everything back to 1 / .42 after the window with no
`.is-spotlit` left.

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

### An editable field wears a well (v6.40)

The answer to the brief's *"no queda claro qué campos son editables"*, and the
first thing the inventory found is that the diagnosis in that brief was
backwards. It had been filed as a volume complaint — *"los recuadros de colores
son demasiado llamativos"*. Measured, the page was the opposite of loud.

**THE AMBER WAS NOT LOUD, IT WAS UNREADABLE — AND THE PULSE NEVER RAN AT ALL.**
`.is-spp-static` is `box-shadow: 0 0 0 2px rgba(255,149,0,0.06)`. This page's
ground is `--panel` #141414 (`.mac-spp-page` sets `background: transparent`, so
`.ias-page`'s `--panel-2` is not what anything here sits on), and 6% orange over
that composites to about **#1f1a14: eleven points of luminance**. Meanwhile
`ias-meta-pulse` and `spp-pulse` — the two animations this file's own comments
describe as how an empty field announces itself — are **dead code on this
surface**: every element carrying one also carries a `_sppGlowCls` class whose
`animation` is `!important`, so nothing on the Mac preview has ever pulsed.

**AND A FILLED FIELD DREW NOTHING.** `.ias-editable` reduces to `border: 1px
solid transparent; border-radius: 4px`. So a completed title was
indistinguishable from the drawing around it and the only affordance left was
hover — and **hover is not a resting mark**: in a still screenshot the page said
nothing about what could be clicked. Four ring vocabularies (amber static, amber
pulse, green pulse, gray pulse) all answering *where are you / what is left*, and
zero answering *what can I press*.

**SO THE TWO CHANGES HAD TO LAND TOGETHER**, which is the shape of this whole
entry: the amber could only leave once something else carried "this is yours to
edit", and the well could only be introduced once the amber stopped being the
page's only mark. Jaco: *"como si fueran input fields como ya los tenemos en el
game details… un recuadro más oscuro que el fondo del modal, con stroke
blanquecino, alrededor de las áreas editables."*

**DARKER, WHICH INVERTS GAME DETAILS ON PURPOSE.** `.ob-form .form-input` is
`rgba(102,97,122,.16)` over #141414 → ~#212024, one step UP from its ground. This
goes down, and the precedent is this file's own: the pinned nav's pending disc is
`rgba(0,0,0,.22)` because *"a recessed well reads as an empty socket, something
goes here, where a faint raised disc reads as there is a pale thing here"*. An
empty field is a socket; a filled one is still a place your text lives rather
than part of the store page.

**Every value already existed in the app** — none of this is a new dialect:

- the fill is **`--bg` (#0a0a0a)**, which is what the base `.form-input` rule
  already uses for an input background. Ten points below the page's #141414.
- the stroke is **`rgba(255,255,255,.14)`, hovering to `.24`** — those are
  `.ob-form .form-input.is-complete`'s own two values, i.e. exactly what a Game
  Details field wears once it holds real content.
- the radius is **`--field-radius`** (8), not the 4 `.ias-editable` used while
  the box was invisible.

**A stroke is allowed here and that needed a licence**, because this app spent
three versions removing them. It is the guide's add row: *"an input is not a
micro-button — it has to show where you can type before you go near it"* (the
field kept its border in the same change that stripped the `+` beside it). A
control that fills on hover can afford to be bare; a field cannot, because being
findable before you approach it is the entire job.

**IT COSTS NO LAYOUT, which is what makes it free rather than a trade.**
`.ias-editable` already reserved its box with matching negative margins
(`margin: -2px -4px; padding: 2px 4px`), so the padding can grow to a real
field's padding as long as the margin grows 1:1 — `-4px -10px` / `4px 10px`.
Measured: the text lands on the same x and y it was drawn at.

**AND IT EXPOSED A JUMP THAT PREDATES IT BY A LONG WAY.**
`.ias-app-name.ias-placeholder { margin-bottom: 14px }` gives Title clearance
**only while one of the pair is empty**. Filled, it falls back to
`.ias-editable`'s negative margin, so the gap goes 14 → −4 and **the whole page
rises 18px the moment you commit a title**. Invisible while neither box drew
anything; not invisible now, since at −4 the two wells overlap. The Mac preview
takes the 14 unconditionally (`.ias-page.mac-spp-page .ias-app-name`, three
classes so the tie with the conditional pair is settled by specificity rather
than by source order). **The point is the invariance, not the 14** — and note
what it completes: "Editing a field must not move the page" fixed the moment the
editor MOUNTS and left the moment it COMMITS still moving. Measured 10px of clear
air between the wells and a 0px page shift, identical empty and filled.

**THE WELL DOES NOT INVERT WHEN YOU OPEN IT.** `.ias-inline-input` fills with
`--panel-3` (#242424) — a value picked when the field it replaced drew nothing,
so "lighter than the page" was the only way to say *live*. Over a well that reads
as the box changing KIND on click, the failure the step disc was rebuilt to
avoid. It keeps `--bg`; only the stroke moves, `.14` → the blue. **Both mounts
needed covering because there are two**: Title/Subtitle mount the input INSIDE
the field, so the input goes `transparent` and the parent's well shows through;
Description still REPLACES its element (a textarea in a clamped box cannot be
nested), so the textarea carries the well itself — **including its box**, since
the className copy drops `ias-editable` and it fell back to the shared −2/4,
measured as a 2px drop on click. 0 after.

**AND THE BLUE MOVED ONTO THE WELL, BECAUSE THE WELL CREATED A SECOND BOX.**
Jaco: *"¿por qué se crea dentro del input field otro input field azul?"* —
`.ias-inline-input` draws its own blue ring plus a `--panel-3` fill, and that was
RIGHT for as long as the element it replaced drew nothing: the ring was the only
box on screen, so it read as the field. Put a well under it and the same ring is
a second box inside the first — two concentric strokes, and of two different
widths, because the well also holds the character counter and the input does not.

So `.mac-spp-page .ias-editing:not(.is-over-limit)` takes `#0a84ff` on its own
border and the input draws **nothing**: no border, no outline, no fill. The box
you clicked is the box you type in, and the stroke is one property through three
states — `.14` at rest, `.24` on approach, blue when live. That also stops the
blue being a look-alike focus ring beside `outline: none` and makes it the
field's own edge changing colour, which is this app's idiom everywhere else (the
step disc, the submit row, the cancel hold's border). `:not(.is-over-limit)`
because the magenta already paints the host and an error outranks a focus —
without it the two rules tie and source order would hand it the blue.

Description needed none of this: it still REPLACES its element, so its textarea
IS the well, carries the blue on its own border and was a single box already.

**AND THEN THE FOCUS MARK WENT TOO — three colours to one to NONE.**
`is-spp-focused` / `-done` / `-optional` painted amber / green / gray for one
event, encoding DONE-ness in a mark whose only job is *the nav sent you here*.
Collapsing them into one neutral pulse was the first fix and it lasted a version.
Jaco: *"no entiendo los halos constantes."*

**The count is the argument, not the colour.** "You are here" was being said
three times on this page: the pinned pill stays lit, `_sppSpotlight` dims the
whole page around where you landed for 1.6s, and then a halo pulsed on the
element for as long as it held focus. And the third was the weakest kind — it
never stopped, which is the sentence this file already used to kill the Submit
row's orange ring two versions earlier: *a nudge that repeats forever is not
pointing at anything*. A locator still flashing a minute after you arrived has
stopped being about arriving.

`_sppGlowCls` is **deleted from the Mac builder**, not left returning `''` — a
helper that can only produce the empty string is a switched-off control — along
with its ten call sites and `.is-spp-focused-here`'s rule. The iOS twin is
untouched and still returns all five. `_sppIsFocused` stays: the pinned bar reads
it to light its pill, which is where "where you are" now lives, once.

**DELETING IT BROUGHT TWO AMBER PULSES BACK TO LIFE, and this is the trap worth
carrying out of the whole change.** `ias-meta-pulse` (the Content cell) and
`spp-pulse` (the Data privacy button) were measured as dead code on this page —
they never ran, in any state, ever. But the REASON they never ran was the
`!important` on the classes being deleted: every element carrying a pulse also
carried a `_sppGlowCls` class that overrode `animation`. **The suppressor was
load-bearing.** Remove it and the amber this page had just been cleared of
appears for the first time in its life, on the two elements nobody was looking
at. They are switched off explicitly now, scoped to `.mac-spp-page`, and not
deleted, because iOS runs both and is correct.

The general form: **before deleting a rule, ask whether anything is surviving
only because that rule was standing on it.** "Dead code" verified by measurement
is dead only under the conditions it was measured in.

**One more, and `node --check` does not catch it.** A comment inside a template
literal must contain no backticks. One backtick in the `spp-get-glow-wrap` note
ended the string and turned the next word into an identifier — the page rendered
empty with `ReferenceError: get is not defined`, while the file still parsed
clean. Hunt the backtick, not the identifier.

Verified: zero amber elements and zero running animations anywhere on the page
in any state, wells at `rgb(10,10,10)` with `rgba(255,255,255,.14)` at radius 8,
the well going `rgb(10,132,255)` on click with the input at `border: none /
outline: none / transparent`, 10px between Title and Subtitle empty AND filled,
page shift 0 on commit, and 0px movement on opening Title and Description.

**THE PINNED BAR FOLLOWS YOU INTO A FIELD.** Jaco: *"que el field en el que
esté se updatee en el top container de pills, que sirva como tracker y como
dónde estoy."* Focus only ever moved one way — pressing a pill set it — so the
row knew about its own presses and nothing else: right when you pressed it,
stale the moment you touched the page it indexes. With both doors lighting the
pill the bar answers two questions at once, the DISC saying what is finished and
the lit PILL saying where you are.

`_sppFocusHere(pid, id)` (app.js) writes the one state field and moves two class
names. **It touches the DOM, it does not render**, and that is a requirement
rather than an optimisation: `setStorePreviewFocus` re-renders, and the thing
that just happened is that an editor was mounted into one of those fields — a
render would destroy the input on the frame it was created and take the caret
with it. Same argument as `gcalWaitHover`: where-you-are is not a state change.
The separator rule is reproduced exactly (`.spp-pin-sep` k hides when pill k or
k+1 is lit) so the row cannot reflow; `data-spp-pin` on the button is what makes
it a lookup rather than parsing the `onclick` string, the same move `data-iso`
made on the calendar cell. The state write is what makes it survive the next
real render.

**AND THEN IT TOOK TWO CLICKS TO GO ANYWHERE — ONE CAUSE, THREE PLACES.**
Jaco, twice: *"creo que ahora necesito 2 clics para ir de un sitio a otro"* and
*"si entro a editar algo y toco cualquier otro pill de arriba, necesito 2
clicks."*

**A `click` event only exists when the down and the up share a target.** The
editor committed on `blur` with a synchronous `reRenderStepModal()`, so pressing
a second field ran: mousedown → focus leaves the first input → blur → commit →
the whole modal rebuilt with innerHTML **mid-press** → the element the mousedown
targeted is detached → mouseup lands on its replacement → **no click is ever
generated**. The first press was not swallowed; it never became a click. The
second worked because by then nothing needed committing.

Three edits, and each one closes a gap the previous one opens:

- **`_stepModalInteractionActive` now counts a FOCUSED inline editor.** That
  guard exists to stop the modal being rebuilt under the user's hands, and a
  caret in an input is exactly that — it was only ever missing because the
  pointer flag happened to cover the common case. The test is `:focus`, not
  merely mounted, and that is load-bearing: an editor commits on `blur`, so at
  the moment its commit asks for a render its input is still in the DOM. Keyed
  on presence it would veto the render that closes it, forever.
- **`commit` calls `_deferredRerenderStepModal()`.** The value is still written
  synchronously — only the repaint waits — so nothing can read a stale answer.
- **The three Mac fields mount on `pointerdown`, not `click`**, because
  `_flushPendingStepModalRerender` runs on `pointerup`, i.e. BEFORE `click`: a
  render deferred out of the press would otherwise fire in the gap between up
  and click and detach the target all over again. Opening on the DOWN edge means
  the new editor holds focus by the time that flush is reached. `preventDefault`
  only on the pointer path, or the browser's own mousedown default fights the
  `input.focus()` that follows. iOS and Mac Full stay on `onclick`, untouched.

**And the flush itself now waits for the click** — `setTimeout(…, 0)` on
pointerup/pointercancel, the gesture flags still cleared immediately. That is one
line against a whole class of "it takes two clicks": it fixes the pills, the
footer, the language picker and anything added later, rather than teaching each
control its own workaround. The pills are where it showed because pressing one is
the natural thing to do straight after typing.

Verified with REAL pointer clicks (synthetic `MouseEvent`s cannot reproduce any
of this — they never move focus, so the blur path never runs and everything
looks fine): Title → Subtitle → Description, one click each, every value kept and
the pill following; and from inside the Title editor, one click on the Data
privacy pill lights it, travels `scrollTop` 0 → 468, writes the focus and leaves
zero editors behind.

**One more thing the wells exposed: two fields blue at once.** Committing fires
the blur handler, but the render that REMOVES the node is deliberately deferred —
so clicking Description then Title left the description's textarea in the DOM,
committed, unfocused and still wearing the focus colour. The blue is tied to
`:focus-within` now rather than to being mounted, so a stale node falls back to
the resting well by itself with no clean-up pass to forget. (`:focus-within`
rather than `:has(> .ias-inline-input:focus)` — the `:has()` form measured NOT
matching with that very input as `document.activeElement` and a verified direct
child. Don't swap it back.)

**AND CONTENT WEARS THE WELL TOO — THE LINE WAS IN THE WRONG PLACE.** This entry
first shipped with the three text fields marked and the four other click targets
bare, on the argument that a well means *type here* and those four open another
step. Jaco: *"¿cómo podemos hacer el mismo tratamiento con la sección de Content?
¿Sería posible que le rodease como un input field, clicable?"*

**A well means *this value is yours to set*.** How you set it — typing, or
opening a step — is a SECOND question, and the drawing already answers it: that
cell carries a pencil (`.ias-meta-action-icon`). So the same well, with the
pencil still saying "it opens elsewhere" — two facts, two marks, no second
vocabulary invented for the difference.

**It is an `::after`, not the cell's own box**, for two reasons either of which
decides it. The cell is `flex: 1 1 0%` in a strip of six with 1px
`.ias-meta-divider`s between them and no padding of its own, so anything drawn
on the cell runs edge to edge and eats the dividers. And a fill plus a border on
one box is the pair this file has refused twice, so the ring is INSET, the way
`.cr-pinned-bar` and `.spp-pinned-bar` draw theirs. `inset: 0 5px` is the whole
geometry — full cell height against the divider's 28, 5px in at each side so the
dividers keep their air — and it costs zero layout, because a pseudo-element
cannot move a flex item. That is the same guarantee the text fields get from
their margin/padding pair, reached differently because this box had no padding
to trade. Measured: every cell width and the strip's height identical before and
after. The children need `position: relative; z-index: 1`, or the positioned
`::after` paints over them — the trap the calendar's wait band hit with its
digit.

The hover is the stroke, `.14 → .24`, the fields' own. The cell's `--panel-3`
hover fill is switched off here (it drew a second, squarer box around the well)
and `.ias-meta-cell--seen`'s green hover with it — that green was the only thing
saying "already answered" on approach, and the pinned bar's disc says it
permanently.

**THE STRIP BREATHES, IS RULED ONCE, AND THE SHOTS SHOW A WHOLE PAIR.** Three of
Jaco's, and the first two are the same argument as everything above.

*"Gana más espacio vertical de la franja de tiles."* 8px of vertical padding was
set when these cells were flat text; they are a band of objects now, and that
needs air around the band rather than around the words. 14, and it is the one
number — the cells have no padding of their own. Measured 48.6 → 59.6.

*"Quita la divisoria horizontal de debajo de las tiles."* **The strip is a
boundary, not a box.** Two rules 48px apart made it a bordered band floating in
the page; the real store rules above and lets the screenshots start on space.
Same argument twice already in this file — the step modal's section headers lost
theirs because position says it, the Submit row lost its divider because the
fill was already a boundary. The TOP rule stays: it separates the strip from the
header and nothing else draws that.

*"Fuerza a que se vean 2 imágenes, no 2 y pico, con una flecha lateral."* A
carousel that cuts its third item mid-frame reports its own overflow rather than
your screenshots.

**The arrow is the scroller's SIBLING** (a `.mac-spp-shots-row` flex parent), not
its last child: inside, it would scroll away with the shots; beside it, its 40px
come out of the row. And the frame width is DERIVED — `calc((100% - 16px) / 2)`
with `aspect-ratio: 16/10`, Apple's own Mac screenshot ratio (`SM_REQS.macos`,
2880×1800) — rather than the `336px` / `height: 210px` literals it happened to
equal at this modal width.

**Three wrong answers first, and each was a different wrong model of the box:**

1. **`padding-right` does not reserve anything from overflow.** Overflow content
   paints across the whole PADDING box, so the 40px lane just moved the sliver
   into it. That is why the arrow had to leave the scroller entirely.
2. **`(100% - gap) / 2` fits the PAIR, and the pair is not what has to fit.** The
   next frame starts one gap later, i.e. one gap INSIDE the viewport. What must
   fit is the pair *plus the gap that follows it* — hence `- 16px`, two gaps.
3. **The left padding was a GHOST.** This scroller rests at `scrollLeft: 16`
   (restored, not authored), so its 16px of left padding was already scrolled out
   of view and the first frame sat flush anyway — while `100%` still resolved
   against a content box the scroll had cancelled. Every calculation was one gap
   out for that reason alone. With it gone the resting position really is 0 and
   nothing moved on screen: it was drawn flush before and is flush now.

Measured after: resting `scrollLeft` 0, viewport 720, frames 352 at 0 / 360 /
720 — the pair ends at 712 and the third starts at 720, **0px visible** — ratio
1.600, and the chevron advances to 352, `scrollWidth − clientWidth` exactly.

**Three targets are still bare, and they are not one question.** Business is
already a solid blue GET button and Screenshots already draw their own 1px
frames — both are visibly objects, so a well would be a second box on something
that has one. **Data privacy is the real remaining case**: `.spp-section-btn`
when unanswered and `.ias-privacy-block` when done are both bare, and both are
full-width blocks rather than a cell, so the same well at that size is a
different shape and wants deciding rather than copying.

**THE CONTENT WELL IS TWICE THE CELL, AND THE STRIP'S PADDING IS THE OTHER HALF
OF THAT NUMBER.** Jaco: *"que el content well sea más alto, como el doble y un
poco más ancho, para que claramente sea un field."*

At `inset: 0 5px` it was exactly the cell — 28.6 tall, the height of the two
lines inside it. That is the size of a LABEL. Every other field on this page has
air between its text and its own edge (`.ias-editable` pays 4px top and bottom
on top of the line it wraps); this one was shrink-wrapped to its content, so it
read as a rule drawn round a caption rather than as somewhere a value lives.

`inset: -14px 2px` → **56.6 tall**, 28.6 + 28, against the cell's own 28.6. All
28 of those are free: it is still an `::after`, so the well grows INTO the
strip's padding and moves nothing. **The strip's padding is what pays**, 14 →
**18** — not a second decision but the same one, since the 4px it gains is
exactly the clearance between the well's new top edge and the rule above it.
The relationship to keep: the well's clearance is `padding − 14`.

`2px` rather than 5 is the "poco más ancho", and the divider spends it.
`.ias-meta-divider` carries `margin: 0 4px`, so the air between the well and the
divider beside it was 4 + 5 = 9 against the well's own 8px radius — the corner
curve was smaller than the gap it sat in. At 2 it is 6, verified both sides.

**The dividers do NOT grow with it.** They separate the row's cells, which are
still 28.6 of text; the well is one cell's field and a different kind of object.
A 57px divider would make the strip a table with ruled columns — the "bordered
band" the bottom rule was removed for, rebuilt vertically.

**AND EVERY TILE IS NOW THE SAME WIDTH, WHICH THE WELL IS WHAT FORCED.** Jaco:
*"todas las tiles (separación entre divisiones) tienen que medir lo mismo, que
no sean variables."* `.ias-meta-cell-wide` gave Category `flex: 1.4` against
everyone else's `1`, so the row was 106.7 / 106.7 / **149.4** / 106.7 / 106.7 /
106.7 — one column 40% wider than the five beside it, and the dividers therefore
at six different distances from each other.

That is right on a row of plain text, where a cell only has to be as wide as the
word it holds, and **wrong the moment one of them wears a well**: a field 40%
narrower than its neighbour reads as a different KIND of box rather than as the
same box holding less. A metadata strip is a rhythm — the dividers are what you
actually see, and evenly spaced they read as one ruled band.

`flex: 1` on all six, scoped to `.mac-spp-page` (iOS and Mac Full share the
class, are drawn as a device showing a page, and have no well in the row). It
costs Category nothing anyone will notice, because five columns get WIDER:
measured **113.83 / 113.84 × 6**, divider-to-divider 122.83 across the board,
nothing ellipsised, strip still 67.6 and the well now 109.8 wide.

**AND THE LABEL IS A LABEL — IT NEEDED AIR UNDER IT.** Jaco: *"espacia un poco
más el content del lápiz, y el ratings de la raya — los titulillos de las tiles
y el texto de debajo. Y haz los titulillos un pelín más grandes y bold."*

`.ias-meta-label-top` was `.ias-meta-bot`'s look flipped upside down — 9px,
`--text-faint`, normal weight, 2px of margin — and that is the giveaway: it was
copied from a CAPTION, which sits below its value, where 2px is right precisely
because a caption belongs to the thing above it. Here the label comes FIRST and
names what follows, so 2px glued RATINGS to its own dash and CONTENT to its
pencil: two lines reading as one lump rather than as a name and a value.

**6px, and the gap is the half doing the work** — the guide's wait list's own
lesson going 3 → 7 ("rows this short are told apart by the air between them long
before they are told apart by their size").

9 → **10px at 600**, which is as far as it can go. The VALUE under it is 12px/700
in `--text-dim`, so the label has to stay smaller and fainter or the cell has two
headlines; what keeps the hierarchy at 10/600 is the COLOUR, `--text-faint`
against `--text-dim`, which is this file's own rule that colour carries the
emphasis and weight only rides along.

It costs height, and that is fine **because the well is derived from it**: the
cell grows, the strip's padding does not move, and `inset: -14px` keeps the well
exactly 28px taller than whatever the cell measures. One number moves and
everything hanging off it follows — cell 28.6 → **34**, strip 67.6 → **73**, well
56.6 → **62**, clearance still 6, the six columns still 113.8 each, and the
`::after` still costing nothing (identical widths and strip height with it
disabled). Scoped to `.mac-spp-page`; iOS verified still 9px / 400 / 2px.

Measured: strip 59.6 → 67.6, cell still 28.6, **every cell width identical with
the `::after` on and disabled** (106.7 / 106.7 / 149.4 / 106.7 / 106.7 / 106.7)
and the page the same height to the hundredth — zero layout, as promised. Well
6px from each divider, 6 clear of the top rule and 5 of the strip's bottom edge,
hover still `.14 → .24` with the cell's own fill staying transparent.

**AND THE BLUE PILL ASKS BEFORE IT REPORTS.** Jaco: *"que el GET sea quizás un
'set price'."* GET is the store's own word for a free app and it is TRUE once
somebody has said the app is free — but this preview cannot tell "free" from
"nobody has set a price", because `isFree` is derived from an empty string as
much as from a zero. So until Business is answered the one required element
still wearing the store's voice while it is really asking a question says what
it wants: **Set price**. After, it is the store's own `GET` / `$4.99`.

That is the order every other field on this page already follows — what is empty
says so, what is answered shows the answer — and `businessDone` is the same gate
the pinned bar's disc reads, so the two cannot disagree. It is a LABEL, not a
second control: same button, same handler, same target, same `title`. The pill
has no fixed width (`.ias-get-btn` is padding + `white-space: nowrap`), so the
longer string costs nothing: 63.3 → 92.7. Verified in all three states — unset →
"Set price", answered and free → "GET", answered at 4.99 → "$4.99".

**AND THE AMBER CAME BACK A THIRD TIME, ON `.ias-placeholder`.** Same trap as
`ias-meta-pulse` and `spp-pulse` above, one selector further out and missed by
the sweep that "verified" it: `.ias-placeholder` also carries `animation:
ias-meta-pulse 2s infinite`, also invisible only because every empty field used
to carry a `_sppGlowCls` class. With that gone the three empty fields — Title,
Subtitle, Description — were pulsing an amber ring on the page this whole entry
cleared of amber. Measured over one cycle: `rgba(255,149,0,.35)` at 0px
spreading to `.067` at 4.07px, every two seconds, on all three.

It is added to the Mac-scoped `animation: none` list. **And the note above it
was wrong** — it claimed "zero amber elements and zero running animations
anywhere on the page in any state", from a sweep that queried the selectors it
had just edited rather than the page. Sweep the whole subtree. Verified now on a
cold load: zero elements with an animation, zero with an amber shadow or fill,
`.ias-app-name`'s `box-shadow` at `none`, and iOS untouched (its own glow system
still runs `spp-focus-pulse` on the focused field).

**THE DESCRIPTION IS A FIELD WITH A FLOOR, AND A LINE-CLAMP BOX WILL NOT GIVE
YOU ONE.** Jaco: *"el cajetín de descripción tendría que tener mínimo 100 de
altura."* It was shrink-wrapped to its text — 30.8 tall on the placeholder's one
line, in a section 101 tall, so **60px of the box below it was empty page**: a
caption with a rule round it, and the emptiness reading as section rather than
as field.

**The one-line version does not work, and this is the trap to carry.** A
`-webkit-line-clamp` box **refuses to contribute a min-height to layout**:
measured, it painted 100px tall and the engine wrote itself a
`margin-bottom: -75.46px` so its MARGIN box still matched its line boxes — the
section stayed 95 and the field hung 15px through the divider. Stretching it
instead is worse: given a `1fr` grid track it came out **179.5 tall with a −75px
bottom margin**, and in another arrangement 185 / −85. The engine is not laying
it out, it is cancelling you.

So the height is carried by `.mac-spp-desc-row`, a plain flex row that behaves,
and the well is sized to match: `min-height: 100px` on the row, `104px` on the
clamp — **the +4 is derived**, since `.ias-editable` pays its box in negative
margins and the well already starts 4px above the column, so ending on the
column's bottom edge costs exactly that overhang.

**AND THE GAP TO THE DIVIDER IS 48px, NOT ZERO.** This shipped flush first, from
*"llegar hasta la divisoria horizontal que lo separa de achievements"*, and Jaco
corrected it against the real Mac App Store the same minute: *"miento, SIEMPRE
tiene que mantener 48px de distancia."* The reference is unambiguous — the
description ends, then a clear band, then the rule — and the band does not change
with the text, so it is `padding-bottom` on the section rather than anything
derived from the field. Because the well is exactly the column + its own 4,
`rowHeight + padding − wellHeight + 4` collapses to `padding`: **one number in
the CSS is one number on screen.** Measured 48.00.

**AND THE RAIL IS A STACK, NOT A SPREAD.** Jaco: *"20px de separación de altura
entre developer, website y support, y ese pack, alineado con el top de
description input box."* The first pass left it alone on the grounds that
`space-between` already bottom-aligned it — **and the floor is what invalidated
that**. `space-between` was written when the column's height WAS the
description's four clamped rows, so spreading three links across it put Developer
on the first line and Support on the last by construction: the native page's own
arrangement, read off a box that fitted its text. With a 100px floor the column
no longer tracks the text at all, so the spread stopped meaning anything and just
pushed the links as far apart as the floor happened to be. A set of links is a
STACK with a rhythm, not a thing distributed across a box.

`flex-start` + a real **20px** gap, hanging from the top — and the pack's
`margin-top: -4px` is **the well's overhang for the third time**: the
description's painted top edge sits 4px above the row both columns start on, so
anything that lines up with that field's EDGE has to account for the 4, because
the edge is not where the layout thinks it is. Same number as the clamp's +4,
same reason. Measured: gaps 20.02 / 20.03, pack top on the well's top edge to
**0.00**.

**AND DATA PRIVACY WEARS THE WELL, WHICH CLOSES THE LAST OF THE FOUR.** Jaco:
*"el answer data collection debería estar también en un pocillo como el de
Content."* It was left open with a real question attached — both of its states
are FULL-WIDTH BLOCKS rather than a cell, so "the same well at that size is a
different shape and wants deciding rather than copying". Decided: **the size is
not what a well means.** It means *this value is yours to set*, and that is as
true of a 720px block as of a 114px cell; the two were answering the identical
question differently only because one of them happened to be narrow.

It goes on the element's OWN box rather than an `::after` — Content needed the
pseudo-element because that cell is a flex sibling of 1px dividers with no
padding to trade, and these two are plain blocks that already carry their own.
The ring is still INSET, for the standing reason. Both states take it
(`.spp-section-btn` unanswered, `.ias-privacy-block` answered), their `--panel-3`
hover fills are switched off (a fill under a well is a second, squarer box) and
`.spp-section-btn`'s `translateY(-1px)` lift goes with them: a field does not hop
when you approach it, and nothing else on this page moves on hover.
`.spp-section-btn--done` keeps its green — it is iOS's and Mac Full's state,
unreachable here.

**OVER THE LIMIT IS ONE BOX TOO, AND IT IS THE BLUE'S BUG IN ANOTHER COLOUR.**
Jaco: *"si me paso de caracteres se genera un nuevo recuadro rojo dentro, no
debería, debería ser el recuadro general del input field."*

It survived the focus fix because **the two states are flagged in different
places**: blue is a SELECTOR on the host (`:focus-within`), over-limit is a CLASS
and the class was only ever written onto the input — the borderless thing nested
inside the well. So the magenta had nowhere to land but the input's own box and
drew the exact second rectangle the well note exists to prevent.

`startMasInlineEdit` writes it onto the host as well now (single-line only — a
multiline field replaces its element, so its textarea IS the well and was already
one box). **The stroke is one property through four states: `.14` at rest, `.24`
on approach, `#0a84ff` live, `--magenta` over.** The fill never leaves `--bg`,
which is why the shared rule's `--magenta-soft` is overridden rather than
inherited — a well that changes colour AND kind is the second-box argument one
more time. It also means the flagged box is the same box before, during and after
editing, where the display element already wore `is-over-limit` between edits.

**AND THE COUNT IS THE WHOLE MESSAGE.** Jaco: *"que no ponga 'must be less
than…', es suficiente con mostrar un número rojo en negativo."* "Must be less
than 30 characters." was 148px of prose restating in words what `-4` in magenta
says in two characters — and the count was already magenta on its own, so the
pair was one fact said twice with the louder half being the one that reads
slower. Hidden in CSS rather than removed from the JS: `.ias-char-error` is the
same node Localization Review, IAP and the iOS preview all build, and it says the
right thing on a real form; this is the one surface that is a DRAWING of a store.
One node with no rule is cheaper than a fifth call site to keep in sync.

**It pays back 152px of the field**: the reserved column was measured for
sentence + gap + count (148.3 + 8 + 31 → 188) and now only has to hold a
four-character overshoot, 31 → **36**, the next multiple of 4. Still RESERVED
rather than fitted, for the reason the 188 was — a column that grows when the
error appears would shrink the input you are typing in at the exact moment you
cross the limit. Measured: sentence `display: none`, count `-20` in
`rgb(255,59,118)`, column 36, host magenta, input `outline: none` on a
transparent fill.

**AND A FILLED FIELD RECEDES.** Jaco: *"cuando algo ya está relleno, ¿debería
bajar la intensidad del input field?"* Yes, and this file's own socket argument
is why: the well exists to say *this value is yours to set*, which is urgent
while the box is empty and merely true once it is not. An empty field has nothing
but its edge; a filled one is read by its CONTENT and the edge only has to say
where the content ends. Same reason the pinned nav's pending disc is a recessed
socket and its done state is a solid mark — **the mark is for what is
outstanding** runs through this whole surface.

`.14 → .08`, a halving rather than a new value, with hover still `.24` on both so
approaching either brings it fully back. `.ias-placeholder` is the test and it is
the right one: the builder recomputes it from state on every render, and it
deliberately STAYS ON while a field is open, so opening an empty field neither
brightens nor dims it — it just goes blue. Content takes the same step through
`.ias-meta-cell--seen` and Data privacy gets it for free (its two states are two
different elements), so "answered recedes" is one idea across all five fields
rather than a text-field special case. Measured: empty `.14`, filled `.08`, hover
`.24`, over-limit magenta.

**One process note, because it cost a round trip.** The `is-over-limit` fix
measured as not working while the file on disk was correct — the pane was running
a **cached `app.js`**, since `?v=` had not moved and this is all one unpublished
version. `startMasInlineEdit.toString()` is what caught it (the running function
did not contain the line). Before concluding that an edit did not work, check the
running code, not the file.

**AND THE DESCRIPTION STOPS REORGANISING THE PAGE — TWO CAUSES, BOTH MEASURED.**
Jaco: *"¿por qué cambia la caja de descripción al entrar y salir y mueve las
cosas? No debería y es molesto. Mete el número de caracteres en el top right
corner del input field. Pero no reorganices las cosas cada vez que salgo y entro
de un field."*

This is "Editing a field must not move the page" arriving at the ONE field that
note deliberately left open, and there were two independent movers:

1. **The counter was a grid ROW.** `grid-row: 2` — a track that only exists while
   you are editing — so clicking the description grew the flex 100 → **115.4**,
   the section 162 → 177.4 and the page 1193.2 → 1208.6. Exactly 15.4, the
   counter's own height. It is `position: absolute` now, in the grid's own
   positioning context, and **both offsets are derived**: `right: 40px` is the
   chip column (32) + the column-gap (8), which lands on column 1's right edge,
   and `top: 2px` is the well's −4 overhang plus 6 of air. `pointer-events: none`,
   because a click landing on a readout instead of in the text you are editing is
   the worst kind of near-miss.
2. **`width: 100%` on the textarea, which is subtler and was the other half.** An
   explicit 100% is a RESOLVED length, so the well's `margin: -4px -10px` then
   SHIFTS that fixed box 10px left instead of widening it — measured, the field
   went **544 → 524 and moved left 10** the instant you clicked it. The display
   box has no explicit width, so its auto fill takes the grid area and the
   negative margins extend it 10 each side. `width: auto` makes the textarea do
   the same. (The shared `.ias-inline-input` keeps its 100%: Loc Review and IAP
   have no overhang to reckon with.)

Verified across rest → editing → rest: page **1193.24** every time, section 162,
row 100, box **104 × 544 at left 447 / top 509.68** — identical to the
hundredth — with the count 10px inside the field's right border and 6 below its
top, and zero editors or counters left behind on exit.

The cost, knowingly: with a long first line the count overlays the text. It is
34.7px wide, it exists only while you are typing, and the alternative — reserving
a `padding-right` on the textarea — would rewrap the text between reading and
editing, which is the same complaint in a smaller box.

**AND A DESCRIPTION TYPED IN GAME DETAILS NEVER REACHED THE MAC PREVIEW.** Jaco:
*"cuando pongo una descripción en game details, no se manda a la store page."*

`seedMacAppStoreListing` copies Game Details' values the first time the Mac App
Store platform is activated and is a deliberate no-op ever after — seed once,
then fully independent, so Mac's Description can differ from the App Store's.
That design is right and it was **seeding the wrong moment**: you add the
platform before you have written a word, so the copy it freezes is `''`, and from
then on the preview is independent of a field that has never had a value. iOS was
fine throughout because `_iasFieldValue` reads `formData` live; only Mac has its
own bucket. Reproduced: `formData.description` set to a real sentence,
`_masFieldValue` returning `""`, the page still drawing its placeholder.

**The fix is what "independent" has to mean while nothing has diverged**: an
empty Mac value is not a decision, it is the absence of one, so `_masFieldValue`
falls back to Game Details — and the moment you edit the field HERE,
`_masSetFieldValue` writes the Mac copy and the fall-back stops applying by
itself, with no flag to keep in sync. Same shape as `smAppIcon`'s two doors: the
dedicated slot wins when it is set, and until then the shared source answers.

Known edge, and it is the cheaper one: deliberately CLEARING Mac's description
resurrects Game Details' rather than showing an empty field. A preview
permanently blank because of when you happened to press a toggle is worse, and
the first is what people actually hit. Title and Subtitle never had this —
`MAS_SHARED_LISTING_FIELDS` routes them straight to `_iasFieldValue` — so this
reaches only `description` and `releaseNotes`.

Verified end to end: seeded `""`, Game Details' sentence drawn on the page with
the placeholder class gone and the Description pill's disc green; then
`_masSetFieldValue` to a Mac-only string → the page shows the Mac one and
`formData.description` is untouched.

**AND ACHIEVEMENTS WEARS ONE TOO, ON ONE LEFT EDGE WITH EVERYTHING ELSE.** Jaco:
*"¿tan difícil es que alrededor de achievements me crees el mismo tipo de
pocillo? Y quiero que todos los pocillos estén bien alineados a la izquierda, de
forma que coincidan los screenshots, el input de descripción, el pocillo de
achievements, el pozo de answer data collection."*

The well itself is the easy half — Achievements is a target like any other
(`data-spp-el`, its own `onclick`) and takes the receded `.08`, because its pill
disc is permanently green and "answered recedes" must agree with that rather
than contradict it.

**THE ALIGNMENT WAS THE REAL WORK, AND THERE WERE THREE COLUMNS.** Measured
before: screenshots **441**, description well **447**, Data privacy **457** — and
each arrived honestly, which is why nobody had noticed:

- **441** is `.ias-device-wrap`'s edge plus the page's 1px border. The shots row
  is not inside an `.ias-section` at all, so that is where it sits.
- **457** is `.ias-section`'s CONTENT column — the section's box is at 441 with
  `padding: 14px 16px`.
- **447** is the description well's painted edge: 457 pulled back by
  `.ias-editable`'s own −10 overhang. Achievements' box was there too, from a
  `margin: 0 6px`.

**441 wins because it is the only one that is a real edge** — the page's — and
because the screenshots are the widest objects on the surface, so they are what
the eye measures the column against. One statement applied four ways: **every
well pulls out exactly the padding standing between it and that edge.**

- `.ias-achv-section` → `margin: 0`, padding back to 16. That `0 6px` / `14px
  10px` pair was written to give `is-spp-focused-optional`'s 7px outward ring
  room to clear `.ias-page`'s `overflow: hidden` — **and that ring no longer
  exists here**, since v6.40 deleted `_sppGlowCls` from the Mac builder. So the
  margin has no consumer left on this surface, and 0/16 puts the box on the edge
  with its content unmoved. iOS keeps the 6/10 and its rings. It needs
  `.ias-page.mac-spp-page` to win: the old rule is `.mac-spp-page
  .ias-achv-section` too, same specificity and LATER in the file.
- Data privacy → `margin-inline: -16px`, the section's own side padding.
- the description well → `-16` / `16` instead of `-10` / `10`, so the box reaches
  the edge while its TEXT stays on 457: the padding grows by the same 6 the
  margin does, which is the entire reason `.ias-editable` pays its box that way.
  The counter's offset follows — `40 − 16 + 10` = **34**, keeping the same 10px
  inset it had against an overhang that changed.

**And the `width: 100%` trap turned up a THIRD time in one session.** The privacy
BUTTON could not take `width: auto` like the block beside it: a form control
shrinks to fit at auto (measured **282.4** instead of 752) and its authored 100%
is a resolved length that negative margins merely SHIFT. So it states
`calc(100% + 32px)` — the two 16s it is pulling out. Same shape as the
description textarea's shift and the counter row's, on a third element.

Measured after: screenshots, description well, Achievements and Data privacy all
on **one left edge**, identical to the tenth.

**AND THEN A WELL NEEDED CLEARANCE FROM A DIVIDER, WHICH IS THE SAME CHANGE ONE
AXIS OVER.** Jaco: *"¿hay alguna forma de que siempre dejes al menos 15px entre
los recuadros de pozo y las líneas divisorias? Veo por ejemplo el caso de
achievements, que está tocando tanto arriba como abajo con su línea divisoria."*

Measured, Achievements ran from one divider's bottom edge to the next one's top:
**0.0 above, 0.0 below.** And it always had — `margin: 0 6px` was zero vertically
long before v6.40, and the `0`/`16` the alignment pass replaced it with kept the
zero. **The geometry was already wrong and the well is what made it legible**,
which is this whole entry's pattern for the fourth time.

**THE ASYMMETRY IS WHERE THE SECTION'S PADDING LANDS, and it decides the fix.**
Every other well sits INSIDE an `.ias-section`, so that section's 14px of
vertical padding falls OUTSIDE the well and is its clearance. Achievements IS the
section (`.ias-section.ias-achv-section`), so its padding falls INSIDE its own
well and buys it nothing. So this could not be fixed by touching padding — it is
a MARGIN, and Achievements is the only object on the page that needs one.

**16, not 15.** He asked for a floor and the clearance everywhere else was 14 —
already under it — so the number had to move regardless, and once it moves it
should be ONE number rather than "14 here, 15 there". 16 is `.ias-section`'s own
side padding, already on this page, so a well's clearance from a divider is now
the same number as its text's inset from the page's edge. One token
(`--spp-well-gap`), and every well reads it.

Two things that came out with it:

- **The description keeps its 48 below**, which is not an exception but the
  store's own measurement (*"SIEMPRE tiene que mantener 48px de distancia"*). It
  takes the 16 on TOP like everything else. Written as `:not(:has(…))` on the
  blanket rule plus an explicit `padding-top` on the description section's own,
  rather than a `padding-block` a later rule has to undo — the two selectors tie
  at three classes, so source order would otherwise decide whether 16 or 48 won.
- **`.spp-section-btn`'s stray `margin-bottom: 8px` goes**, scoped here. It made
  Data privacy measure **22 below against 14 above** — one control with two
  different clearances, from a margin written when nothing below it drew a box.

Measured after: Achievements **16.0 / 16.0**, Data privacy **16.0 / 16.0**,
description 16 above and **48.0** below, all four wells still on 441.

**AND THE HEADER'S FIELDS JOINED THE CONTENT WELL'S COLUMN.** Jaco: *"¿podemos
alinear título y subtítulo para que sus input fields estén alineados a su
izquierda con el content pocillo? ¿Y que el set price ocupe el ancho exacto de
content pocillo de debajo?"*

Measured before: the Content well's painted edge at **577.8**, Set price's box at
**577**, and the Title/Subtitle wells at **567** — a full 10.8 left of the other
two. It is `.ias-editable`'s overhang: `margin: -4px -10px; padding: 4px 10px`
grows the box 10 outward and pads 10 back, so the TEXT stays put and the WELL
hangs left.

**WHAT MOVES IS THE WELL, AND THE TEXT GOES WITH IT — that is the decision to
argue with first.** There is no arrangement where the well's edge lands on 577
and its text also stays on 577: a well needs horizontal padding or its stroke
touches the first letter. So either the boxes align and the title's text shifts
10px right, or the text holds and the boxes stay ragged.

The boxes win, on this file's own rule taken one step on: **once a field wears a
well, the well IS the object the layout spaces.** The header's 18px gap was
landing on the title's TEXT while the well hung into it, leaving **8px** of real
air between the icon and a painted box — the gap read as half what it was
authored as. `margin-inline: 0` puts the well on 577 and hands the icon its full
18 back (measured 18.0 icon → well). The relationship the store drawing is
faithful to is icon → title, and with the title drawn as a box that is icon →
well, which is now correct for the first time.

**SET PRICE TAKES THE WELL'S WIDTH, DERIVED RATHER THAN TYPED.** The Content well
is one metadata tile inset 2px a side, and a tile is the strip's content width
shared six ways — all three terms already in the CSS, so `--spp-tile` /
`--spp-well-w` restate nothing. The strip's side padding, the divider's margin
and the well's own `inset` are rewritten to read the same tokens, so there is one
source rather than two copies to drift. 92.7 → **109.83** against the well's
109.84.

**`cqw` AND NOT `100%`, AND THE FIRST ATTEMPT IS THE REASON.** A custom property
holding a percentage is substituted as a TOKEN and resolved where it is USED, not
where it is declared — so `width: var(--spp-well-w)` on Set price measured its
"tile" against the 594px get-row it sits in rather than the 752px page, and the
button came out **36**. There is no percentage that can mean "the page" from
inside the header; a container unit is the only thing that does. `.mac-spp-page`
takes `container-type: inline-size` — inline-size and not `size`, so only the
width is contained and the page's height still grows with its content, which
everything on this surface depends on. Verified after: the page still 1227 tall
and scrolling, the shots carousel still 352-wide frames at 0 / 360 / 720 with the
third exactly at the viewport edge, both sticky fades intact.

**THE ONE HONEST GAP: 0.83px.** Set price and the title wells land on **577** —
page edge + 22 of header padding + a 96 icon + an 18 gap, every term fixed —
while the Content well lands on **577.83**, because a tile is 683/6 and the
remainder falls there. Constant (the modal is a fixed 1000), below anything that
reads, and not closable without hard-coding a sub-pixel: the two columns are
built from different arithmetic and only this modal width makes them nearly
agree. Don't chase it.

**AND VERIFYING IT FOUND A REGRESSION THE ALIGNMENT PASS HAD SHIPPED.** Clicking
Description moved the field **6px right** — 441 at rest, 447 while editing.
`.mac-spp-page textarea.mac-spp-desc-clamp` is (0,2,1) and so is
`.mac-spp-page textarea.ias-inline-input`, which declares `margin: -4px -10px`
and is LATER in the file, so the tie went to the 10 while the display `<div>`
had moved to −16. **The check that signed that change off measured the RESTING
box only** — the note above says "identical to the tenth" about four left edges
and never opened one of them.

`.ias-inline-input` added to the selector makes it (0,3,1) and settles it by
weight. It also fixed the counter for free: `right: 34px` was derived for a −16
overhang and had been landing on a −10 box, measuring **4px** inside the field's
right border instead of its designed 10. Both 10 now.

**Third specificity tie of this shape on this surface** (after
`.ias-achv-section`'s margin and `.ias-app-name`'s). The rule this leaves: when
two rules on one surface both want a box, give the newer one an extra class
rather than trusting its position in the file.

Measured across rest → editing → rest: description **441 × 556** and page
**1227.24** at every sample, title and subtitle wells on 577 throughout, and
iOS / Mac Full verified bit-for-bit untouched (Achievements still `0 6px` /
`14px 10px`, `.ias-section` still `14px 16px`, `.ias-editable` still `-2px -4px`,
GET still shrink-wrapped at 63.3, strip still `8px 12px`).

**AND THE DESCRIPTION REALLY DID STILL RESIZE — IT WAS THE LINE BREAKER, NOT THE
BOX.** Jaco, a third time: *"sigo viendo que al entrar y salir del DESCRIPTION
input box, cambia su tamaño."*

**TWO PASSES HAD MEASURED THE BOX AND BOTH CAME BACK CLEAN, because the box is
not what changes.** Measured across the swap: 104 × 556 at 441 / 767.18, page
1227.24, section 164, row 100 — identical to the hundredth in both states, which
is exactly what the previous two notes proudly report. What changes is the
**TEXT**: the paragraph re-wraps, words jump between lines, and the block visibly
changes shape while its box sits perfectly still.

**One computed property out of twenty-six differs, and it is the UA's.** Diffing
family, size, weight, style, stretch, letter-spacing, word-spacing, line-height,
indent, transform, white-space, word-break, hyphens, kerning, feature settings,
variant, rendering, direction, writing-mode, tab-size, align, synthesis, optical
sizing and variation settings across the DIV → TEXTAREA swap leaves exactly one:
**`overflow-wrap`, `normal` on the div and `break-word` on the textarea.** No
author rule sets it — Chrome's UA stylesheet ships it on `<textarea>`. A
different line breaker is enough on its own.

`normal` on both, stated on the pair rule, because the DIV is the drawing: the
store renders a paragraph and the editor conforms to it. `word-break: break-word`
(`.ias-desc-text`) already stops a long unbroken word overflowing, so nothing is
lost.

**The rule this leaves: when one element REPLACES another, diff every computed
TEXT property across the swap, not just the geometry.** A UA default on the
replacement appears nowhere in this file and nowhere in the cascade — it is
invisible to every kind of search except a diff of the two computed styles.
Verified after: `overflow-wrap: normal` in both states, box and page identical
across rest → editing → rest at a pinned scroll.

**AND THE COUNT SITS ON THE FIELD'S EDGE.** Jaco: *"pon los numéricos en el edge
derecho tío, a 5px de distancia si quieres."* Two things held it off, and only
one of them was the number. The row is `justify-content: space-between`, written
when it held the error sentence AND the count; with the sentence `display: none`
on this surface that leaves ONE child, and space-between then behaves as
flex-start — so the number hugged the LEFT of its own reserved 36px column and
measured **32.9px** from the border. `flex-end` is what that rule meant once the
sentence left. The remaining 11 is the field's own `border 1 + padding 10`, so
the row is pulled 6, written as the subtraction. Measured **5.0** on Title,
Subtitle and Description alike.

**APP PRIVACY IS THE SECTION'S NAME, NOT ITS ANSWERED STATE.** Jaco: *"el
pocillo de answer data collection podría tener el mismo título 'App Privacy' que
tiene Achievements, así queda aún más fiel a la tienda."*

The DONE arm already carried that heading and the ASK arm was a bare `_sppBtn` —
so the one section whose name the real product page always prints went unnamed
for exactly as long as it was unanswered, and **renamed itself the moment you
filled it in**. The store says App Privacy before you have read a word of it, the
same way it says Achievements over a card with nothing completed.

Both arms are `.ias-privacy-block` now — one object, one heading, two bodies —
with `--ask` carrying the difference (the outstanding `.14` against the answered
`.08`, since the free ride that "two states are two different elements" gave
"answered recedes" is gone). The wrapper is the target, so there is one pressable
box and one `data-spp-el="data"` rather than two, and the ask row is a plain
`<div>` rather than `_sppBtn`'s `<button>`. `_sppBtn` itself is untouched —
screenshots use it, and so do iOS and Mac Full for this same element.

**AND THE SHOTS WEAR A WELL, WHICH REVERSES A LINE THIS FILE DREW.** Jaco: *"los
screenshots deberían tener un pocillo alrededor, para indicar que hay que
clicarlos y revisarlos."* The earlier pass left them bare on the argument that
they "already draw their own 1px frames, so a well would be a second box on
something that has one". **That read the frames as the OBJECT and they are the
VALUE** — a well says *this is yours to set*, and the frames are what is
currently set, exactly as the title's text is what the title's well contains.
The pencil-and-well pair on Content had already settled this.

The padding is **8px, the scroller's own `gap`**, so the air around the pair
equals the air between them and the carousel reads as one evenly spaced group
rather than two pictures with a frame near them. It is the only number the shots
give up: the frames are `(100% − 16px) / 2` of whatever box they get, so they
simply come in by the padding — 352 → **344**, the "sliiightly smaller" that was
offered. The well goes on the ROW rather than the scroller so it spans 441 → 1193
like every other well instead of stopping 32px short, which puts the chevron
inside it (right: it drives this carousel), and the chevron gives up its `-8px`
pull, since a control hanging over its own container's edge is the one thing this
box is drawn to deny. `data-spp-el` stays on the scroller — the spotlight's
`:not(:has())` keeps a group lit when it CONTAINS the mark.

Measured: all four wells on **441 and 1193**, Achievements and Data privacy
16 / 16 clear of their dividers, the description 48 below.

**TWO CONFIRMATIONS, AND THE SPLIT BETWEEN THEM IS WHAT STOPS THEM COLLIDING.**
Both are Jaco's, ported from the questionnaire prototype: *"nice animation of
glimmering green on input text once I leave the field"* and *"nice animation when
I come back from a flipped modal and some information is put in place."*

**A text field you type in place confirms ITSELF** — you are looking at the
words, and the sweep says "that is saved". **An element you set somewhere else
has the opposite problem**: you were on another screen when it changed, so when
the page returns there is no reason to look at the one box that is different. One
confirms, the other locates. So the sweep is for the three text fields, the pop
is for the four that open a step, and no element can ever get both.

**The sweep is `.flash-char` / `charToOwn`** — each letter starts green and fades
to its own colour on a left-to-right stagger. `forwards`, and 100% IS `inherit`,
because the overlay is removed a moment later and anything else would jump: the
pinned bar's one-shot glint has the same rule.

**IT IS AN OVERLAY, AND THE FIRST VERSION WAS NOT — this is the useful half.**
Painting the DISPLAY element after the commit is the obvious shape, costs no
cloned metrics at all, and does not work: **the render that turns the editor back
into a display element is DEFERRED and can be deferred indefinitely.**
`_stepModalInteractionActive` vetoes a rebuild while any inline editor holds
focus, so the most ordinary gesture on this page — leaving Title by clicking
straight into Subtitle — commits Title and then renders nothing until Subtitle is
done too. Measured: the title committed, its element still held an editor, and
zero `.flash-char` were ever created. **A confirmation that waits on an unrelated
event is not a confirmation.** So it is the reference's `position: fixed` box,
pixel-matched to the input, tied to nothing — not to a render, not to the element
surviving, not to what you do next. The metrics are copied, which is the cost:
every value comes off `getComputedStyle` of the real input, `overflow-wrap`
included, for the reason two paragraphs up.

**The pop is `.spp-just-changed` / `storeJustChanged`**, and the idea that makes
it cheap is the **9999px shadow**: the element dims everything around it from its
OWN box, so there is no scrim node to insert, position and remove, and nothing
can be left behind if a render lands mid-animation. `.ias-page`'s `overflow:
hidden` clips it to the store page. `z-index: 30` over `position: relative`,
because a static element has no stacking position at all — the same trap the
SUBMITTING… line hit. The hold at 32–58% is the point: it arrives, WAITS long
enough to be read, and leaves.

**It is `_sppCelebrate`'s flank test one level finer** — that one asks "did the
whole bar just complete", this asks "did THIS element just fill in", per target,
against what was last seen, with the same `undefined` guard so a first paint
never pops. **"Filled" is read off the PAGE, not out of the state**, for
`_sppCelebrate`'s own reason: each target already says so in its own way
(`--seen`, `--ask`, `is-shots-done`, and Business no longer saying "Set price"),
so this cannot disagree with what is drawn. Content's mark is its `::after`, so
the ring rides along there — the cell itself paints nothing.

Verified: baseline render no pop; the render that fills it → `sppJustChanged`
running, `z-index: 30`, the dim present, scale interpolating 1 → 1.013 and the
ring easing white → green; a re-render while already answered → **no second
pop**; the sweep firing on a real commit (10 spans, `rgb(49,220,128)`, the
overlay on the input's own box to the pixel), silent when nothing changed, and
zero nodes left behind after either. iOS and Mac Full verified untouched — no
shots padding or ring, no privacy ring, counter still `space-between` at margin 0.

**One process note.** The browser pane serves a CACHED `render.js` / `app.js`
past a `?bust=` on the PAGE — `?v=` is the only cache key those tags have, and
this batch has not bumped it. A hard reload did not clear it either; what did was
fetching each file with a unique query and re-evaluating it. Worth knowing before
concluding an edit did not work: **check the running function's source, not the
file**, which this file already says and which cost a round trip again here.
(One artifact of that harness: `let` / `const` at the top level of an indirect
`eval` do NOT become global bindings, so a probe reading one gets
`is not defined` while the functions closing over it work perfectly.)

**AND THE PRICE IS TWO OBJECTS WEARING ONE BUTTON.** Jaco: *"cuando complete el
pricing, la pill de precio se sizee correctamente de ancho como sería una real de
Apple, y quede alineada por su izquierda con el texto de título y subtítulo."*

The tile width was right for "Set price" and wrong for "GET", and the reason is
that they are not the same thing. **Unanswered, this is the page's fourth editor
FIELD** and should measure like one — the width of the Content well below it,
which is exactly what the earlier pass asked for. **Answered, it stops being a
question and becomes the store's own PILL**, and Apple's pill is as wide as the
word in it; a 110px "GET" is a field with a label in it, not a price.

**THE WIDTH AND THE COLUMN MOVE TOGETHER, and the column is the tell that this is
one change rather than two.** A field belongs on the WELL column (with every
other well's painted edge) because that is where fields line up; a pill belongs
on the TEXT column, with the title and subtitle it sits under, because that is
where the store's own content lines up. The 10 between them is `.ias-editable`'s
own padding — the same overhang that put the wells on their column in the first
place — so `margin-left: 10px` is that number paid back rather than a new one.
Measured: unanswered "Set price" **109.8 wide on the well column**, answered
"GET" **65.1 wide with its left edge on the title's text to 0.00**.

**AND THE SUBTITLE CAME UP 5.** Jaco: *"sube el subtítulo y su input field 5px
hacia arriba, más pegado al título."* The pair is one object — a name and its
line — and 10px of clear air between two painted wells had them reading as two
stacked fields. `-9px` is `.ias-editable`'s own −4 overhang plus the 5, written
as the sum so the overhang stays visible in the number. It lands on the FIELD
rather than on an editing state, so the box is in the same place whether you are
reading it or typing in it — verified identical across rest → editing → rest —
and the price pill comes up with it, which is the stack tightening rather than a
second change.

**APP PRIVACY AND ACHIEVEMENTS ARE THE SAME OBJECT AND NOW MEASURE LIKE IT.**
Jaco: *"que App Privacy tenga el mismo tamaño y colocación que achievements, si
es necesario quita el lápiz… y alinea ese chunk de texto a la izquierda con App
Privacy y Achievements."*

They differed in exactly two ways and both were invisible until the wells put the
two boxes on one edge: `.ias-privacy-block` pads **10** horizontally against
`.ias-achv-section`'s **16**, so their contents sat on columns 6px apart; and
`.ias-section-head` is **15px** against `.ias-achv-title`'s **20px**, so one
section name was smaller than the other on a page where both are names the store
prints. Neither was a decision — privacy was built as a generic `.ias-section`
head and Achievements as its own thing.

**The pencil was the third thing pushing that text off the column.** It arrived
with `_sppBtn`'s three-slot line, where an icon leads because the whole row IS
the control. Here the row sits under a heading inside a well that is already the
control, so the icon only bought a 24px indent. **Content keeps its pencil for
the opposite reason**: that cell has no heading and no room for one, so the
pencil is the only thing saying the value opens elsewhere. Measured after: both
blocks `14px 16px`, both titles 20px, and the two titles and the ask text all on
**17**.

**THE SHOTS WELL SAYS WHAT IT WANTS, AND THE ARROW WAITS ITS TURN.** Jaco: *"el
pocillo de screenshots debería marcarse de alguna forma en este caso, como por
encima de los screenshots, y quitar la flecha de scroll lateral hasta que no los
hayan revisado."*

Both halves are about the unreviewed state and they are one idea. This is the
only well with nothing to read: Achievements and App Privacy are named by the
STORE, so their own headings mark them, while the real product page never titles
its screenshots — there is no store word to borrow and an invented 20px heading
would be Shipmate writing on the drawing. So it gets the ASK instead, the same
two lines App Privacy uses while it is unanswered — the editor talking rather
than the store — and like that one it leaves once answered. Fourth application of
"answered recedes".

**The arrow is gated on the same flag, and that is the half worth arguing.** A
carousel that offers to page before you have looked at what is on screen invites
you to skim past the thing you were asked to check; once reviewed, paging is
exactly what you want. The prompt and the chevron are two faces of one state and
can never both be on. The row becomes the well and a new `.mac-spp-shots-strip`
takes the flex line it used to be, so the scroller's `flex: 1` and the chevron's
40px lane are untouched and the ask simply sits above them.

**AND AN ANSWERED WELL NEARLY REJOINS THE PAGE.** Jaco: *"quizás cuando algo ya
está rellenado y completo, el fondo del pocillo debería bajar al color del fondo
de la store, quizás un pelín más oscuro pero casi imperceptible."*

This is "answered recedes" arriving at the FILL, which is the half the halved
stroke left behind. The well is a socket — `--bg` #0a0a0a, ten points BELOW the
page's `--panel` #141414 — and a socket is a thing waiting to be filled. Once it
IS filled that depth claims something untrue: the value is in, the box is read by
its content, and a dark cut-out under finished copy makes the store page look
like a form.

**NOT flush with the page, which is the "pelín" doing real work.** At exactly
`--panel` the box would be gone, and an editable field has to stay findable
before you approach it — the licence this whole entry rests on. One step of depth
plus the `.08` ring is enough to say "still a field" and quiet enough to stop
saying "empty".

**rgb(18) is a FIFTH of the way back down from the page toward the socket**,
`20 − (20 − 10) × 0.2` — derived so it moves if either ground does, and written
as the literal because `color-mix` is the kind of per-engine behaviour this file
prefers to avoid. Two points against the page, under the floor anything on this
surface reads at; ten against the empty well, which is the contrast that matters.

Two tokens (`--spp-well-fill` / `--spp-well-fill-done`) and five consumers, so
the two states are one idea rather than five copies. Three details:

- **Hover returns the socket** on all five, alongside the stroke's `.24`. Fill
  and edge recede together or they say two different things about one box.
- **A field you are IN is a socket again**, whatever it holds — the depth is the
  page saying "the text goes here", which is true at exactly the moment you are
  putting text there. On `:focus-within` rather than the editor's class, so the
  stale committed textarea the deferred render has not removed yet falls out of
  it by itself. Same reason the blue is tied there.
- **Achievements is born answered** — its pill disc is permanently green — so it
  takes the receded fill from the start rather than sitting in a socket that can
  never be filled.

Measured: all three answered wells at `rgb(18,18,18)` with `.08` rings, the two
outstanding ones (privacy's ask arm, the unreviewed shots) at `rgb(10,10,10)`
with `.14`, and iOS / Mac Full verified untouched — no fills anywhere, privacy
still `14px 10px` with a 15px head, Achievements still `0 6px`, GET still
shrink-wrapped, the subtitle still on `.ias-editable`'s plain −2.

**AND THE ICON CARRIES ITS OWN CLEARANCE.** Jaco: *"puedes bajar la pill de
precio como 20px. La distancia entre el icono y la primera línea divisoria
horizontal de las tiles debe ser 30px, así que pushea todo ese content hacia
abajo como 15px cuando muevas la pill."*

Measured before, icon bottom → the strip's top rule was **15.9**, so his ~15 was
exactly the shortfall. **But the two halves are not independent, and that is the
whole of this.** The header is `align-items: flex-start` with the icon at 96 and
the meta column at 97.9, so **the meta column is what sets the header's
height** — barely, by 1.9. Drop the pill 20 and the meta becomes 117.9, the
header grows 20 with it, and the gap reaches **35.9 on its own**. Pushing
anything further down would overshoot; the padding would have to come DOWN to
8.1 to land on 30 — and 8.1 is a number derived from the meta column's exact
height, so the title's font, the subtitle's margin or the pill's own size would
each silently break it.

**SO THE CONSTRAINT IS STATED ON THE THING IT IS MEASURED FROM.** The gap he
named starts at the ICON's bottom edge, so the icon reserves it
(`margin-bottom: 30px`) and the header's `padding-bottom` goes to 0, since it
was only ever standing in for this. The header's content box is then
`max(icon + 30, meta)`, which makes 30 a **floor** rather than a coincidence:
exact while the meta column is shorter than 126, growing with the meta beyond
that rather than being eaten by it. Nothing in the header's type or spacing can
break it, the pill's own 20 included. Measured 30.00 in both Business states.

**TWO SPECIFICITY TIES, BOTH THIS FILE'S STANDING LESSON.**
`.mac-spp-page .ias-header` ties with the `padding: 22px 22px 14px` shorthand
further down and lost on source order, so the 14 is edited in that rule rather
than overridden; `.mac-spp-page .mac-spp-get-row` ties with
`.mac-spp-get-row.is-spp-done`, so the new rule carries `.ias-page` as a third
class. Fifth and sixth of this shape on this surface.

**AND `is-spp-done`'s OWN SPLIT COLLAPSES HERE, which the tie is what exposed.**
That rule drops an ANSWERED row from 20 → 8, *"only ever there to clear that
glow"* in its own words — and **the glow was deleted from the Mac builder in
v6.40**, so the larger value has had no consumer on this surface for a while and
the pill was silently sitting at two different heights depending on an invisible
ring. One number for both states here (the tight 8 the reference screenshot
shows, plus his 20); iOS and Mac Full keep the split and their rings. Same shape
as Achievements' `margin: 0 6px`, which was also a clearance for a ring that had
stopped existing.

**One CSS trap worth carrying, and it cost a round trip.** A second `*/` left
mid-comment ended it early, so the prose after it became an invalid SELECTOR —
and the parser, recovering, **swallowed the next rule whole**: the icon's
`margin-bottom` was in the file, absent from the CSSOM, and everything else
around it applied normally. `node --check`'s equivalent here is counting `/*`
against `*/` (balanced — the stray one was a duplicate, not an orphan), so the
test that actually catches it is querying the CSSOM for the selector you just
wrote. Same family as the backtick-in-a-template-literal note above: a
delimiter mistake that parses clean and deletes one rule silently.

**THE FRAMES ARE NOT THE BUTTON — THE WELL IS.** Jaco: *"el adjust screenshots
text está extraño, y es raro que me dejes acceder seleccionado cada uno de los
screenshots, debería haber como una capilla de opacidad por encima de los
screenshots (pocillo) que actúe como un pulsador único."*

Every frame carried its own `onclick`, so a two-shot carousel was six press
targets and picking one screenshot looked like it meant something. It does not:
the step you land in adjusts the whole SET. The row takes the click now, the
frames take none, and the veil is **paint** — `pointer-events: none` — so there
is no arrangement in which a single frame can be aimed at.

**The two-line ask went with them**, and it is the same argument the pencil's
was: that object belongs to App Privacy, where it sits in a block with nothing
else in it. Floating above two pictures it was a caption nobody asked for,
saying in words what a wash says by covering the thing it is about.

- **`inset: 0` on the STRIP, not on the scroller.** The scroller is a `flex: 1`
  sibling of a 40px lane, so an overlay sized to it would have to know that
  number. The chevron is lifted over the wash instead (`z-index: 3`), one line
  against an arithmetic that would need re-solving every time the lane moved —
  and it carries `event.stopPropagation()`, or paging would open the step.
- **Answered recedes, a fifth time.** Unreviewed the veil rests visible and
  carries the label; reviewed it rests at `opacity: 0` and returns lighter on
  hover. One property between the two states, so they cannot drift into two
  designs.

**AND THE CAROUSEL GAINED A LEFT ARROW THAT COULD NOT COPY THE RIGHT ONE.**
Jaco: *"igual que tenemos flecha hacia la derecha, tenemos flecha a la izquierda
cuando la necesitamos."*

The next chevron takes its 40px OUT of the row — that is the whole reason the
third frame stopped peeking, and the frame width is solved against it. **A
mirrored lane on the left would push the pair 40px right, off the column the
shots had just been aligned to.** So this one is an overlay on a dark disc
(`rgba(10,10,10,.60)`), read against a screenshot rather than against the well,
costing no layout at all.

`_macShotsArrows` (app.js) toggles both off the scroller's real position,
because **an arrow pointing at nothing is a control that lies** — at rest there
is nothing to the left, at the end nothing to the right, and a set of two shows
neither. `visibility`, never `display`: dropping the NEXT one from the DOM would
widen the frames and re-admit the sliver its lane exists to kill. 1px of slack
at each end, since `scrollLeft` is fractional on a scaled pane and an exact
comparison flickers across a smooth scroll. Re-armed after every render, the
`_smModalFades` shape — `reRenderStepModal` restores this scroller's position,
so "at the start" is not safe to assume.

**AND THE SHOTS START ON THE DESCRIPTION'S OWN TEXT LINE.** Jaco: *"los
screenshots tienen que estar alineados en su izquierda con la misma línea que
marca el cuerpo de la description."*

Two columns run down this page: every well's painted edge on 441 and every
well's TEXT on 457. The shots well was correctly on 441 and its 8px of padding
put the first frame on 449 — eight short of the description's body and of every
other line of copy. The left padding is `.ias-section`'s own 16 now, so this is
the one box on the page with asymmetric padding: 16 on the left because its
content is COPY-ALIGNED, 8 on the other three because that is the scroller's
`gap` and the air around the pair has to match the air between them.

**The `+1` is not a fudge.** `.ias-editable` carries `border: 1px solid
transparent`, so the description's copy really starts one pixel further in than
the section's padding says — measured, a flat 16 put the frames on 496.5 against
the text's 497.5. Written as `calc(1px + 16px)` so the term stays visible.
Measured after: **497.5 / 497.5**, and the well still 480.5 → 1232.5 with every
other well.

**AND THE CLAMP HAD NEVER RUN — THREE LINES WAS NOT THE BUG, `display` WAS.**
Jaco: *"después de las 3 líneas, si pones puntos suspensivos, no me dejes ver la
4ª línea, sino que la quites."*

He was describing a HARD CROP and that is exactly what it was. Measured,
`#mas-desc-text`'s computed `display` is **`flow-root`, not `-webkit-box`**: a
GRID ITEM IS BLOCKIFIED, and this box became one when the description was
rebuilt as a two-column grid. So `-webkit-line-clamp` has been inert on that
element ever since — what looked like a clamp was `overflow: hidden` cutting at
the well's own `min-height: 104`, which is why a fifth line sat half-sliced
under the fourth and **there was never an ellipsis at all**.

Nothing on the box could have fixed it. The clamp moves to
`.ias-desc-text-inner`, the span the builder already wraps the text in, which is
an ordinary child and keeps the display it is given. The WELL stays the outer
box, so the 104px floor, the stroke and the fill are untouched: the field is
still ≥100 tall and the TEXT inside it is three lines and a real ellipsis.

**Two measurements had to follow it down**, and both had been asking the wrong
question while agreeing with the right answer by accident:

- `_updateMasDescMoreBtn` tested `el.scrollHeight > el.clientHeight`, i.e.
  whether the text overflowed the WELL'S FLOOR rather than three lines. On the
  inner span it measured 62 against 104 and the chip went permanently hidden.
- `_alignMasDescTextBottom` clipped its line rects against the BOX's bottom, so
  every line inside the floor counted as visible and the chip aligned to a line
  the clamp had already thrown away. It takes `min(box, inner)` now; the delta
  is still measured to the box, because that is what the grid row is sized from.

**The rule this leaves: when a clamp stops clamping, read the computed `display`
before touching the line count.** Both numbers here (3 and 104) were fine. A
computed value that nothing in the cascade sets is the one kind of bug a search
of this file cannot find — same family as the `<textarea>`'s UA
`overflow-wrap`.

**AND THE CHIP FOLLOWS THE ELLIPSIS INSTEAD OF SITTING ON THE BOX.** Jaco: *"el
more/less está ahora mismo tocando la caja, quizás debería estar después de los
3 puntos suspensivos."* Measured it was worse than touching: the well bleeds
`-16` past column 1 while the grid's `column-gap` is 8, so the chip's left edge
sat **8px INSIDE the well's stroke**.

It moves into column 1 with `justify-self: end`, landing where the TEXT ends —
and **the 40px lane stays EMPTY, which is the part to read before tidying it
away.** That track (32 + 8) is what holds the well's right edge on the wells'
column: the well is `container right − 40 + 16`. Collapse the grid to one track
and the well grows 40px past every other well on the page. The lane is no longer
the chip's column, it is the geometry the well's bleed is solved against.

**The backdrop is what makes "after the ellipsis" honest** — a clamped line is
filled to its right edge, so without one the label lands on the last glyphs. It
fades in over 12px from the well's own fill through **one token**
(`--spp-desc-bg`) declared on the row and switched by the same conditions that
switch the well underneath it. Verified: rest `rgb(18,18,18)` on both, editing
`rgb(10,10,10)` on both — the chip cannot be caught on the wrong ground.

**AND THE PILL CAME UP 5, WHICH IS WHAT KEEPS 18 EXACT.** Jaco: *"puedes subir
la pill unos 5px, porfa, pero que la distancia con respecto al inicio de la
línea divisoria de las tiles sea 18px."*

30 → 18 on the icon and 20 → 15 on the pill, and the second half is not a
separate request. The header is `max(icon + gap, meta)`: at the pill's old +20
the meta column measures 117.9, taller than `96 + 18 = 114`, so asking for 18
alone would have left the meta deciding the header and the gap landing at 21.9.
Raising the pill 5 takes the meta to 112.9 and hands the decision back to the
icon by 1.1px. **Measured 18.00.**

The cost, stated rather than hidden: 18 is still a FLOOR by construction, but
the margin between the two columns is now 1.1px rather than 12, so a bigger
title will start growing this gap. That is the correct failure and not a silent
one.

**AND THEN 5 EACH WAY AGAIN — THE PILL'S OWN 5 HAD BEEN SWALLOWED.** Jaco: *"se
te ha olvidado lo de subir la pill de precio unos 5px y bajar a su vez el resto
de contenido como 5px más."*

It had not been skipped. The pill really did come up 5 — and the same change took
the icon's clearance 30 → 18, so the strip came UP 12 in the same paint and a
5px move in the other direction was invisible inside it. **A change measured
against something that moved with it cannot be seen.** What he was reading is the
air between the PILL and the rule, and that had gone the wrong way: measured
**1.1px**, the meta column ending all but flush on the divider.

Both numbers move again, 5 each, opposite directions — the pill to `8 + 10`, the
icon's clearance to 23 — and the pill → rule air goes **1.1 → 11.11**. That gap
is what this pair is really tuning, and it is the one nobody had named yet.

**The cost contradicts the 18 he asked for and is stated rather than hidden:**
icon → rule is now **23**. It cannot be both, because they are the same edge —
"lower the content 5" and "keep the icon 18 clear" are one 5px pulling two ways.
The mechanism is unchanged and so is its guarantee: the constraint still sits on
the ICON (`max(icon + 23, meta)`, meta 107.9), exact by 11.1px of margin rather
than 1.1, so a longer title has more room before it starts growing the gap.

**GAME CENTER IS A SUB-PANEL, AND IT WAS THE LAST MODAL SAYING OTHERWISE.**
Jaco: *"Achievements es el único modal que no sigue el mismo patrón de flecha
para volver atrás… tiene un Done que cierra todo, la tienda incluida, y eso no
está bien."*

The back arrow was written against `isFlipped`, and that test names the
MECHANISM rather than the fact it was reasoning from — **that you arrived from
somewhere, and back is not closed**. Game Center reaches the same situation by a
different road: it is in no platform's `steps` at all, so the Achievements card
on the Product Page Preview is its ONLY door. That makes "where back goes"
derivable rather than guessed, and it makes the × and the Done exactly as wrong
here as they were there — one level down, the most obvious control in the corner
threw away the store page you were reading, and the footer button did the same
while claiming to be finished.

So the chrome follows the SITUATION: `isSubPanel = isFlipped || cameFromPreview`
is what the header and the footer read. Nothing about the flip changes — the
title still comes from `step?.label` (not a `FLIP_LABELS` entry), the body is
still Game Center's own builder, and a flipped panel is untouched. Back is
`openStepModal(pid,'storePreview')`, the same call the Achievements card makes in
the other direction, so the two presses are one gesture and its reverse rather
than two code paths that can disagree.

Verified on all three platforms that have it: macos / ios / macos_full each show
the arrow, no ×, **Save & Return**, and both controls pointing at their own
`storePreview`; pressing back lands on Product Page Preview with its own × and
Save & Close; and a plain step (Content Rating) is untouched — no arrow, × and
Save & Close as before.

**AND THE PER-FRAME HOVER RING WENT WITH THE PER-FRAME CLICK.** Jaco: *"quita el
ring blanco cuando hovereo sobre cada screenshot particular."*

Same change as the frames losing their `onclick`, arriving one paint later: a
hover mark says *this is the thing you would press*, and on this surface the
thing you press is the WELL. Two press affordances inside one button is the
"two marks on one object" this page has refused all afternoon — and this one
pointed at the wrong object, lighting one picture while the veil lights the whole
strip. Scoped to `.mac-spp-page`; iOS and Mac Full keep the ring, where the
frames really are the target.

The CURSOR is deliberately NOT removed — `cursor: inherit` hands it back from the
row, so the pointer is continuous across the well instead of appearing only over
the pictures. Verified `box-shadow: none` on a Mac frame and its `onclick` gone,
with iOS's own frame still carrying both.

**AND THE DESCRIPTION IS THREE LINES WHETHER OR NOT YOU ARE IN IT.** Jaco: *"haz
que mida las 3 líneas de altura cuando no está editado también, así queda mejor
cuando sólo muestra las 3 líneas."*

The 100px floor was measured when the clamp was four lines AND NOT CLAMPING (the
`display: flow-root` bug above): the box was cropping by height, so a floor near
its own content read as the field's size. With the clamp really running at three,
62.4px of text sat in a 94px content box — **38px of empty well under finished
copy**, which is the "caption with a rule round it" that floor was introduced to
fix, arriving from the other side.

So the floor stops being a number and becomes the CONTENT: three lines, which is
also what a truncated description is by construction. Measured **72.4 empty and
72.4 full** — the field does not change size when you write in it, which is the
property worth having.

`--spp-desc-3` is the one place the type appears and it must track
`.ias-desc-text` (13px / 1.6). A token rather than `3lh`, because `lh` resolves
against each element's OWN line-height and the ROW is a flex box that does not
inherit the paragraph's. The row takes `+6` and the clamp `+10`: the 4 between
them is `.ias-editable`'s overhang, kept so "the gap IS the padding" stays true,
and the 10 is the clamp's `4 + 4` of padding plus its two 1px borders.

**ONE CONSEQUENCE TO DECIDE ON, MEASURED RATHER THAN HIDDEN: the two columns no
longer end together.** The Developer / Website / Support rail is three items at
his own 20px gaps — **93.19 tall** — and the description is now 64.4. So the rail
is the taller column, the section is sized by it, and the 48 is exact **from the
rail** (measured 48.00) while the description's own bottom reads **68.79** from
the rule. Nothing is wrong: the store's 48 is a band under the section's content
and that is where it is. But if the band under the DESCRIPTION is what the
reference measures, the lever is the rail's 20px gap, not this floor — the two
requests (three lines, and 20px between the links) cannot both end on one line.

**BOTH CHEVRONS CAME OUT AGAIN ONE VERSION LATER (v6.41).** Jaco: *"no me
convence las flechas del screenshot."* Deleted rather than hidden — the markup,
`_macShotsArrows`, its render hook and both rules.

**And the frame arithmetic maintained itself, which is the vindication of having
written it as a fraction.** The note above says the NEXT chevron's 40px lane is
"the whole reason the third frame stopped peeking", and that is true of the lane
and NOT of the rule: `(100% − 16px) / 2` is solved against whatever box the
scroller gets, so losing 40px of lane simply made both frames 20px wider.
Measured after: frames **355.5** at 0 / 364 / 727 in a 727 viewport — the third
starts exactly on the edge, 0px visible, with no number re-solved. Had that width
still been the `336px` literal it once equalled, this removal would have put a
sliver back.

The cost, knowingly: paging is a trackpad gesture now and nothing on screen says
there is a third screenshot. That is the trade — a chevron inside a well whose
whole argument is ONE press was a second control inside a button.

**AND THE VEIL BELONGS TO THE UNREVIEWED STATE ONLY.** Jaco: *"ni que sigas
marcándolos una vez editados y en check — el oscuro de los screenshots me gusta
para el previo, no después."*

It shipped resting at `opacity: 0` once reviewed and returning on hover, filed
under "answered recedes" — and that was the wrong rule for this object. Everything
else that recedes is still DESCRIBING something once answered: a well still says
*this value is yours to set*, so it goes quiet rather than away. The veil's whole
sentence is *you have not looked at these yet*, which stops being true the moment
you have — so bringing it back on approach re-asks a question that has been
answered. It is not rendered at all when `screenshotsDone`, and the reviewed
carousel is the screenshots at full strength, the way every other answered field
shows its value plainly. The WELL still carries the press, its `.08` ring, its
hover and the row's pointer.

**The rule this leaves: "answered recedes" applies to marks that stay TRUE when
answered.** A mark whose only content is the question itself does not recede, it
leaves.

**AND THE CHIP WAS EATING THE THIRD LINE — 33px OF IT, MEASURED.** Jaco: *"quiero
que la descripción muestre realmente 3 líneas, no 2 y puntos suspensivos."*

All three lines were being rendered in full; the chip sat **33px on top of the
last one** with its gradient painting the tail out. So the previous pass's
backdrop — "what makes after-the-ellipsis honest", faded from the well's own fill
— was not a fix: it made the collision INVISIBLE rather than absent, which is
exactly what "two lines and an ellipsis" looks like. **A backdrop that hides an
overlap is a report of the bug, not a repair.**

The lane is reserved on the TEXT instead (`--spp-desc-chip`, 32 for the chip plus
10 of air, added to the clamp's own `padding-right`): the clamp is what wraps the
paragraph, so the ellipsis lands where the chip begins BY CONSTRUCTION, at any
width and in any language. On the PAIR rule, so the textarea wraps identically —
`overflow-wrap`'s own requirement. The gradient and `--spp-desc-bg` are deleted
with it.

The cost, paid knowingly: the first two lines stop 42px short of the well's right
edge too, because a padding cannot apply to the last line alone. Measured after:
three visible lines at 445 / 460 / 456 wide, **38px of clear air** between the
ellipsis and "more", `padding-right: 58px` identical at rest and while editing,
box 556 wide in both.

Measured across the whole batch: all four wells on **480.5 / 1232.5**,
description 48.0 below its own section's edge, first frame and description copy
both on **497.5**, icon → strip rule **18.00**, Set price 109.8 on the well
column, arrows hidden/visible correctly at rest, mid-scroll and at the end, the
veil at 1 unreviewed and 0 reviewed, zero `onclick` on any frame — and iOS /
Mac Full verified untouched (per-frame handlers intact, no veil, no prev arrow,
Achievements still `0 6px` / `14px 10px`, `.ias-section` still `14px 16px`).

### A listing is an ordered row of pictures (v6.41–47)

`buildScreenshotsSection` (render.js) and the `_shotEd*` family (app.js). The
Screenshots step stopped being a picker and became an editor. Jaco: *"ahora
mismo se abre un modal extraño, y quiero que sea un poco diferente… 1. que se
muestren los screenshots de la submission y que me permitas drag to order them
as they'll look on the store. 2. que me dejes borrarlos/ocultarlos. 3. que si
selecciono uno, me muestres la preview ocupando todo el ancho del modal y que yo
pueda recortar y dragear dentro de la propia foto con slider/mouse wheel, y que
se actualice para la store."*

**THE OLD STEP ANSWERED A QUESTION THE ASSETS TAB HAS ALREADY ANSWERED.** It was
a grid of every upload with a checkbox on each, plus a drop zone underneath that
previewed a crop — so the model was SELECTION, and the three things a store
listing actually is (a sequence, minus what you took out, cropped to the store's
frame) could not be expressed at all. The crop zone is the sharper example: it
positioned a dashed frame over an image, let you drag the image under it, and
then **wrote nothing anywhere**. Pan lived in CSS pixels of an `<img>` sized by
whatever the layout gave it, which is not a quantity that can be turned into a
crop of the original; the aspect buttons named iPhone devices on every platform,
Mac included. It was a drawing of an editor.

**THE SHAPE IS THE REFERENCE PROTOTYPE'S** (`shipamte_fullquestionnaire.html`'s
`.shot-editor`), and its three parts map onto his three asks one for one: a
STRIP of thumbnails that reorders by drag and removes by its own ×, and above it
a STAGE showing the selected one at the modal's full width, panned by dragging
inside the picture and zoomed by slider or wheel.

**IT WEARS NO CHROME OF ITS OWN**, and that is the one place it deliberately
departs from the reference. There, the editor is a sub-panel inside a store modal
and needs a back arrow, a Done and a "Saved" flash. Here it is a STEP, and the
step modal already carries a header, an × and Save & Close — a second set inside
the first is exactly what the Game Center pass had just finished removing one
version earlier. Everything commits as it happens, so there is nothing for a Done
to mean.

#### THE MODEL: THREE FIELDS, AND ALL THREE ARE ABSENCES UNTIL YOU SAY SOMETHING

`state.platformScreenshots[pid]` keeps `selected` and `custom` — the two POOLS a
listing can draw from — and gains three fields that are about the LISTING:

| | |
|---|---|
| `order` | ids in store order. A **preference, never a whitelist**: ids it does not name are appended in pool order, so a screenshot dropped into Assets later still appears instead of silently vanishing. |
| `removed` | ids taken OUT. The difference between *not chosen yet* and *chosen against* — an empty `order` means untouched, where a `removed` entry is a real answer. |
| `crops` | `{ [id]: { z, tx, ty, url } }` — the transform, plus the baked preview the store draws. |

**ONE RESOLVER, FIVE READERS.** That same `selected+custom||allUploaded`
expression was copied verbatim in five places — the iOS preview, Mac's, Mac
Full's, the screenshots step and Steam's. `platformStoreShots(pid)` is the one
definition now, the argument `smCheckSVG` and `smAppIcon` were lifted out under,
and it is what let three new fields reach all five surfaces without teaching any
of them a new model. **With nothing set it returns exactly what the copies did**,
which is what made the swap safe.

**A CROPPED SHOT IS A COPY, NOT A MUTATION**, and the spread has one non-obvious
term. The baked preview goes on as a plain `dataUrl` with `ref` and `url`
CLEARED, because `_screenshotSrc` resolves a library reference BEFORE it looks at
the bytes — left in place the ref wins and the crop is never drawn. The library
asset is untouched, so Reset is a real revert rather than a second crop back.

**NON-DESTRUCTIVE IS ALSO WHY THE EDITOR NEVER READS ITS OWN OUTPUT.**
`_shotEdOriginal` goes to the pools, not to `platformStoreShots` — handed the
cropped copy it would compound crop on crop and Reset would revert to the last
bake.

#### THE STAGE IS MEASURED, NOT SIZED

Its width is the modal's — the literal ask — so it states no width at all: it is
a block in the step's content column and is that column by construction.
**`_shotEdArm` solves the geometry after the paint**, the way everything else on
these surfaces that depends on layout does, and that is also where the listeners
are re-attached, because the step modal is rebuilt with innerHTML and takes them
with it (`_smModalFades`'s own contract).

**THE FRAME IS THE FULL WIDTH WHEN THE STORE'S SHAPE IS LANDSCAPE.** For Mac
(16:10) the crop frame IS the canvas, so there is nothing outside it to dim and
`.is-full` drops the mask — an outline round a box with no context in it reads as
a stray stroke. A PORTRAIT store cannot do that, and the reference's answer is
taken whole: the canvas stays a landscape band at the full width (`CW / 1.96`,
its own 632 × 322 proportion) with the frame a narrower vertical selection
centred in it, everything outside dimmed by one `0 0 0 9999px` shadow — no scrim
node to insert, position and remove, and nothing that can be left behind if a
render lands mid-drag.

Measured on the 680px step modal: stage **619 wide** (680 − 2 border − 48 of
scroller padding − the 11px bar), frame **619 × 387 at ratio 1.5995**, `is-full`
with `box-shadow: none`.

**ROTATION IS DERIVED, NOT A TOGGLE.** `_shotEdRatio` reads the store's own table
(`SM_REQS[<store>]`'s first `shot: true` row) and flips it when that row is
marked `rot: true` and the picture is the other way up. Three of the four stores
carry that flag, so a set of landscape captures gets a landscape frame instead of
being asked a question the pictures already answer. Mac has no `rot`: 16:10 only.
The reference's orientation toggle is not ported.

**THE PAN IS CLAMPED AGAINST THE FRAME, NOT THE CANVAS.** The canvas may
legitimately show dimmed margin either side of a portrait frame; the FRAME is
what gets exported, so it is the box the picture has to keep covered.

**THE BAKE IS AT THE SOURCE'S RESOLUTION, capped at 1400 on the long edge** — the
stage is however wide the modal happens to be, and baking at that size would make
a screenshot's quality a function of the window.

**AUTO-SAVE, BECAUSE THERE IS NOTHING FOR AN APPLY BUTTON TO MEAN.** Every other
field on this journey writes as you leave it; a crop that needed confirming would
be the one thing here you could lose by closing the modal. It bakes 350ms after
you stop moving, so a drag is one write rather than sixty.

**AND FOR FIVE VERSIONS IT LOST THE LAST EDIT — LEAVING IS A COMMIT (v6.66).**
Jaco: *"the zooming on the modal doesn't keep the preview when I go back to the
store, so changes are not kept."*

Reproduced exactly: zoom and leave inside the 350ms window and
`crops[shotId]` is **never written at all** — the store row redraws the original
and the crop is gone. The sentence above is what makes it obvious in hindsight:
*"a crop that needed confirming would be the one thing here you could lose by
closing the modal"* — and that is precisely what a debounce nothing flushes
turns the auto-save back into.

**The debounce is right and is not what changed.** One write per drag rather
than sixty is still the point. What was missing is the other half of a deferred
write: **anything that ends the gesture has to flush it.** Switching shots
already knew that (`_shotEdCommit()` fires before the swap); the two doors OUT
of the step did not.

`_shotEdFlush()` clears the timer and commits if anything is pending, and it is
called from **`openStepModal` and `closeStepModal`** — the two exits, both
single doors. In `openStepModal` it goes above the per-platform branches for
that function's own stated reason: every one of them returns early, so anything
that must happen on every open has to happen before them *"or be forgotten in
the sixth"*.

**AND IT WAS INVISIBLE TO EVERY MEASUREMENT THE EDITOR SHIPPED WITH, because
they all slept first.** The batch note above reads "auto-commit baking a real
dataURL 350ms later" — a probe that waits out the debounce is testing the timer,
not the exit. **When a write is deferred, the test has to be the path that does
NOT wait.** Same family as the scroll-restore bug, which repaired itself under
any probe that read `scrollTop`.

Verified on macos, four paths: zoom → straight back to the store preview → crop
saved at z 3 with a real bake and the store row drawing **17591** bytes rather
than the original's 399; zoom → `closeStepModal` at once → saved at 1.8; the
ordinary waited path unchanged at 2.4; and **opening and leaving with no edit
writes nothing** — `crops` still empty, so the flush cannot manufacture a crop
out of a visit.

**A REMOTE SCREENSHOT TAINTS THE CANVAS and that is stated rather than
swallowed.** An IGDB image through the proxy makes `toDataURL` throw, so there is
no baked preview: the TRANSFORM is still saved and re-applies in the editor, and
only the store's own thumbnail keeps the uncropped picture. The one case where
the two surfaces disagree.

#### THE STRIP

Drag-to-reorder with **live reflow** — as the cursor crosses a thumbnail the
others slide out of the way (FLIP), so the dragged one previews the slot it will
land in rather than being followed by a line you have to interpret. **The DOM is
the answer on drop**: the preview has already put them in the order the drop
means, so `_shotEdCommitOrder` reads them back instead of recomputing an index.
One source for what you can see and what gets stored.

The order badge is printed rather than left to be counted — a listing's third
screenshot is a thing people talk about. The × is **bare until the thumbnail is
hovered** (the calendar day panel's rule: a delete on every row, always visible,
is a row of invitations to lose something) and red only on its own hover, so the
colour arrives with the aim. The selected ring is the app's `#52BAFF`, meaning
*this is the one you picked* — here, which one is OPEN, since everything in the
strip is in the listing by definition.

**REMOVAL IS FROM THE LISTING, NOT FROM THE LIBRARY.** The asset stays in Assets,
where it is shared with every other platform — taking a screenshot out of the Mac
listing must not delete it from the Steam one. Two consequences that both took a
correction:

- **It keeps its place in `order`.** The first version filtered the id out, and
  measured, restoring then dropped three screenshots to the END of a row they had
  been arranged inside. `removed` already takes it out of the listing; also
  taking it out of the sequence throws away where it WAS, which is the only thing
  an undo has to know. An id in `order` that no longer resolves is dropped by
  `platformStoreShots`'s own `filter(Boolean)`, so carrying it costs nothing.
- **A PLATFORM-SPECIFIC UPLOAD IS THE EXCEPTION, and it is a real one.** It
  exists nowhere but this listing, so removing it IS deleting it — counting it
  among the "N removed" would offer an undo the model cannot honour.

#### TWO BUGS THIS UNCOVERED, BOTH OLDER THAN IT

**`renderDash` HAS NEVER EXISTED.** The old `togglePlatformScreenshot` ended with
`if (cardEl) renderDash();` — a call to a name that is nowhere in this codebase,
latent because it only ran when an element with a particular id was present and
that id is emitted by two builders this step is not one of. Six of them got
written into the new code by copying that line, all `typeof`-guarded, all
therefore silently doing nothing — which is how it was caught: the first probe
threw `renderDash is not defined` from a hand call. The function is
`renderDashboard`. **The general form: a `typeof`-guarded call to a name that
does not exist is a switched-off feature that reports success**, and it is
indistinguishable from a working one until something calls it unguarded.

**A PLATFORM UPLOAD USED TO REPLACE THE WHOLE LISTING.** The five copies read
`selected.length || custom.length ? [...selected, ...custom] : all`, so a
non-empty `custom` with an empty `selected` sent it down the explicit arm and the
library fallback switched off. Measured: with five screenshots showing and
nothing picked, adding ONE here took the listing **from 5 to 1**. Tolerable while
the only door was a picker where you also ticked; not tolerable once adding is a
slot in a strip.

The fix is the sentence, not the expression: **an ADDITION is not a REPLACEMENT.**
An explicit pick still means what it always did — you named the ones you want —
but adding a shot says nothing about the library ones, so they stay and the new
one joins them. `removed` is the field that means "chosen against" and is now the
only thing that takes a screenshot out. Verified across all four states:
untouched → all five, picked → just those, added → five plus the new one, picked
plus own → both.

#### AND THE STORE ROW NOW AGREES WITH THE EDITOR

`.ias-shot-img` is `height: 100%; width: auto` — the image keeps its own shape
inside a frame that has a fixed one. On the Mac page the frame is
`aspect-ratio: 16/10` with `overflow: hidden`, so measured: a 16:9 capture came
out **391 wide in a 355 box** and was clipped off its right edge, and a PORTRAIT
one came out **165** and left 190px of bare `--panel-3` inside the frame — a grey
band in the middle of the store's own screenshot row.

`object-fit: cover` is not a tidy-up of that, it is the row agreeing with the
editor: the crop stage cover-fits at zoom 1 and exports at 16:10, so an uncropped
shot now previews **exactly** the crop opening the editor would offer it, and a
cropped one is already the frame's shape and is shown untouched. Before this the
row and the editor disagreed about the same picture, which on the one surface
whose argument is *this is a drawing of the store* is the difference between a
preview and a guess. Scoped to `.mac-spp-page`: iOS and Mac Full are drawn as a
DEVICE showing a page, their frames take the image's own width, and there is no
fixed ratio for a cover to fill.

**EMPTYING THE LISTING IS AN ANSWER, AND IT IS "NOT DONE".** The four
`is*SectionComplete('screenshots')` arms read the two POOLS, which is the right
question while the only thing you can do is pick. With removal in, a platform
whose every screenshot had been taken out still had an upload in the pool and
still reported complete, with nothing in the store row underneath it. They read
`platformStoreShots` now — what the preview draws is what the tick has to agree
with — guarded, because state.js loads before render.js.

Measured across the whole batch: stage 619 on a 680 modal with the frame
619 × 387 at 1.5995 and `is-full`; wheel → z 1.64 with the slider following, drag
→ tx 60 / ty 40, auto-commit baking a real dataURL 350ms later; drag-to-reorder
committing `['ss5','ss1','ss2','ss3','ss4']` with the badges renumbered and the
resolver agreeing; remove → "4 screenshots · 1 removed" with `ss3` still in
`order`; restore → back in place, `restoredInPlace: true`; empty listing →
`complete: false`, empty stage, toolbar off, slider disabled; add → 5 → 6 with
the new one selected, and deleting it a real delete with no restore offered; all
five Mac frames 355.5 × 222.2 at 1.600 with their images filling them at `cover`;
and iOS / Mac Full verified untouched — `object-fit: fill`, per-frame widths
still varying with the image, per-frame handlers intact.

#### THREE SMALL ONES, AND TWO WERE THE SAME MISTAKE

**A VALUE THAT IS RIGHT FOR THE TARGET YOU WERE LOOKING AT IS NOT RIGHT FOR THE
SELECTOR YOU WROTE IT ON.** Jaco: *"la pill de precio, cuando vuelvo de poner un
precio en el modal, no es completamente redonda, pasa por unos frames de
rectangular y queda feote."*

It was not an animation at all — no frames, no easing. `.spp-just-changed`
carried a blanket `border-radius: var(--field-radius)`, so for the whole 600ms
of the return pop the GET pill was flatly re-shaped from its own 20px pill into
an 8px rounded rectangle, and snapped back at `animationend`. One value, five
targets, four different shapes: the three wells and the shots row already ARE
`--field-radius`, so nobody could see it was being IMPOSED rather than
inherited, and the single target that is a pill is the one it broke.

The 8 was Content's — that cell paints nothing and has no radius, so the 9999px
scrim cut a sharp-cornered hole around it. That is a fact about one target and
it is scoped to that target now. **A pop is a light and a scale; what shape the
light traces is the element's own business.** Third time this file has caught
the same shape (the pending disc's fill, the separator's alpha): a number
measured against one thing, then applied to the selector that happened to be
open. Measured: 20px at every one of ten samples across the pop.

**AND THE STAGE HAD NO BOX UNTIL AN IMAGE DECODED.** Jaco: *"la primera vez que
se abre el modal de los screenshots, la preview es cuadrada."*

The geometry was solved only inside the image's `onload`, so until the bytes
came back the crop canvas carried no height at all — and on a screenshot that
never loads (an IGDB url through the proxy, offline) it stayed **0 forever**.
Measured on a remote shot: `stageH` 0 for every frame sampled and still 0 after
1.2s.

**It was invisible in every measurement the editor shipped with, and the reason
is the test data.** A local data URL decodes before the next frame, so the box
was always correct by the time anything looked at it. That is the same class as
this file's own "dead code verified by measurement is dead only under the
conditions it was measured in" — here, *correct* only under them.

**The RATIO is a fact about the STORE, not about the picture.** It comes off
`SM_REQS` and needs no image, so `_shotEdArm` solves and applies the box
immediately; the load only re-applies it, and only changes anything on a store
whose row is marked `rot: true` and a picture that really is the other way up.
Mac never flips. Verified on a shot that never loads: frame 619 × 387 at ratio
1.599 from the first frame and unchanged after 1.2s.

**AND THAT FIXED THE CASE IT WAS MEASURED AGAINST, NOT HIS.** Jaco came back
with the other half: *"la primera vez que lanzo el screenshot modal después de
haber subido yo mis propios screenshots… el preview sigue siendo completamente
cuadrado. Solo cuando selecciono un segundo screenshot, se cambia a la reso
correcta."*

**The real way in is the FLIP, and the flip is a moving width.** The Screenshots
step is normally reached by pressing the well inside the Mac Product Page
Preview — whose modal is **1000px wide** and animates down to 680 as the
sub-panel turns over. Sampled every frame through that transition the stage
reads **939 → 918 → 872 → 811 → … → 619 over about twenty frames**. Arming on
the first of those solved the frame at 939 × 587 and pinned it in inline pixels;
the modal then shrank to 619 around it, leaving a frame overflowing its own
stage of which **619 × 587 is visible — ratio 1.05**. That is what "completely
square" was, and picking a second screenshot re-armed it against a settled 619,
which is the half of his report that names the cause.

**SO THE FIX IS NOT TO WAIT FOR THE WIDTH, IT IS TO STOP ASSUMING IT HOLDS.**
`transitionend` would be a guess about which property on which element, and this
file's standing preference is a mechanism with no per-engine behaviour over one
that has to be verified in an engine nobody can drive. `_shotEdWatchWidth` puts
a `ResizeObserver` on the stage, so the geometry is a **function** of the width
rather than a snapshot of it: the flip, a window resize and any layout change
this surface gains later are one case needing no timing at all. It cannot loop —
what a re-solve writes is the canvas's HEIGHT and the frame's box, never the
stage's width, and a repeat of the same width is guarded to a no-op.

`_shotEd.landscape` is REMEMBERED off the decoded image rather than re-derived,
because the observer has no picture of its own to ask: without it a re-solve
mid-flight would flip a portrait store's frame back to its default while the
image was still loading.

Measured at ratio **1.599 in all four**: after the flip (619 × 387), narrowed
live to 459 (459 × 287), back to 619, and on the direct open. The frame never
exceeds the stage at any sampled frame of the transition. (The ratios logged
*during* the flip climb 0.18 → 1.60 because `getBoundingClientRect` reports the
rotateY projection — the LAYOUT is correct throughout; that is the animation
being seen, not the box being wrong. Measure `clientWidth`, not the rect, on
anything mid-flip.)

**AND THE PINNED BAR TELLS THE TRUTH ABOUT A BROKEN FIELD.** Jaco: *"si estando
la tienda perfectamente completada, me da por cambiar el título o algún input
que deje en rojo el cajetín, deberías retirar el checkmark de la pill
correspondiente, o incluso marcarlo en rojo con un check con una x?"*

Two options offered and the second is right, for a reason worth stating because
the first sounds tidier. **Retiring the tick puts the pill back in the PENDING
socket, and that socket already means something else** — *you have not done this
yet*. An over-limit title is not that: you did it, and what you wrote is now
invalid. Collapse the two and a broken section looks exactly like an untouched
one, so the only way to find it is to open all eight pills — which is the walk
this bar exists to save.

So the disc gains a THIRD state rather than losing its second: red fill, and the
tick becomes a cross. **One object through three values**, which is the platform
card's own argument (an empty ring becoming a solid disc is a change of KIND; a
soft disc going green is the same thing changing colour) — not a mark that comes
and goes.

- **RED IS FORCED, NOT CHOSEN.** The colour table gives three meanings and only
  one fits: green done, amber *this needs you*, red WRONG. And the hue is
  `--magenta` — the exact value the field's own well takes when it crosses the
  limit — so the bar and the field are one fact stated twice, the relationship
  the waits' yellow dates have with their band. Not `--alert-*`, which would be
  a third colour for one condition.
- **`bad` OUTRANKS `done`, and it has to.** An over-limit field is non-empty, so
  every `done` test on this page says true about it. Stated in the JS (the
  `disc` helper never emits both) with the CSS tie as a belt to those braces.
- **THE GREEN BAR ANSWERS TO THE SAME FLAG.** A submission with an invalid title
  is not finished, and `_sppCelebrate` reads `is-complete` — so without this the
  sweep would have fired on the render that BROKE it. `bad` is tested on every
  element rather than only the required ones: an optional section holding
  invalid text is still invalid, where one merely left empty is fine. That is
  exactly the distinction `required` makes and `bad` does not.
- **ONLY THREE SECTIONS CAN CARRY IT**, and the asymmetry is real. Title,
  Subtitle and Description are free text against a character limit, so they have
  a way to be answered AND wrong; the other five are answered by making choices
  in another step, where every reachable answer is legal. They read the SAME
  `*OverLimit` booleans the fields themselves wear as `is-over-limit`, so the
  magenta well and the red disc cannot disagree about one string.
- **`smCrossSVG` joins `smCheckSVG` in state.js** — same 24 viewBox, same 2.2
  stroke, same round caps. It goes in the same SLOT, so it has to be the same
  object drawn differently rather than a second kind of badge.
  `buildScreenshotsSection`'s thumbnail delete uses it too, for the reason that
  function exists: seven inlined copies of the check, six of them stale.

  **AND ITS EXTENT IS SOLVED AGAINST THE CHECK, IN THE RIGHT UNITS.** Jaco:
  *"que la x del check circular mida lo mismo que el check, para que no parezcan
  desbalanceados."* It shipped at 7.5 → 16.5 on the claim that its ink "matches
  the check's own extent" — eyeballed from the WIDTH, and **width is the wrong
  measure for a mark in a round disc**. The disc is a circle, so what the eye
  compares is how far the ink reaches from the CENTRE. The check's furthest
  point, (16.6, 8.7), sits **5.661** units from (12,12); a cross's furthest
  points are its corners, which at 7.5 landed at √(4.5²+4.5²) = **6.364** —
  12.4% further out. A cross is also 9 × 9 against a check that is 9.2 × 6.6, so
  **matching them by width guarantees mismatching them by radius**. The
  half-extent is `5.661 / √2` = 4.003, so it runs **8 → 16**; both now reach
  5.661 (measured 5.661 / 5.657), and identical round caps extend both by the
  same `sw/2` radially outward, so matching the path endpoints matches the
  painted ink. Measured in a real 15px disc: ink 11.4 × 8.8 against 10.2 × 10.2,
  same 2.2 stroke, same radius.

**THE GEOMETRY THIS ROW GUARDS DOES NOT MOVE.** The disc is 15px in all three
states and the glyph fills it at 100%, so measured across complete → broken →
recovered the eight pill widths are identical (80 / 100 / 100 / 93 / 121 / 121 /
128 / 128) and the row's `scrollWidth` holds at 934. That was the requirement
the pending disc was introduced under and a third state must not spend it.

Measured end to end: complete → bar `rgba(49,220,128,.18)` with its green ring,
zero bad; title over 30 → bar back to white 12%, the Title disc `rgb(255,59,118)`
with `rgb(46,7,19)` ink and the full cross path, 15px box and 15px glyph, the
field's own well `rgb(255,59,118)`, tooltip "Title — over the character limit";
title fixed → green again, zero bad, every width unchanged throughout.

#### AN EMPTY EDITOR STILL KNOWS ITS FRAME (v6.46)

Jaco: *"cuando no hay screenshots, haz que la preview tenga el ratio de la
plataforma en la que está — en Mac App Store el blank preview debería ser 16:10
en vez del dropwell de 617×178."*

**This file had already written the sentence that decides it, twice, and never
applied it to the empty arm.** *"The RATIO is a fact about the STORE, not about
the picture"* is why `_shotEdArm` solves the frame before an image decodes, and
why a `ResizeObserver` replaced a snapshot of the width. The empty stage was
`min-height: 180px` — a number with nothing behind it — so the one moment the
editor exists purely to say **what shape the store wants** was the one moment it
drew a shape of its own.

It also moved: the box went **180 → 387** the instant the first screenshot
landed, which is "a control must not move as a consequence of being used"
arriving at a drop well. Measured now, Mac: empty **619 × 386.9**, filled
**619 × 387** — 0.1px, `Math.round` in JS against the exact ratio in CSS.

**ONE HELPER, THREE CONSUMERS, because the 1.96 was a literal in the only place
that knew it.** `_shotEdCanvasRatio(pid)` (render.js, beside `_shotEdRatio`)
states the canvas rule once — a landscape store's frame IS the canvas so the
canvas takes the store's ratio, a portrait store's canvas stays the reference's
1.96 band with the tall frame centred in it. `_shotEdGeometry` reads it, and the
builder writes it onto the empty stage as `--shot-canvas-ratio` for an
`aspect-ratio` to consume. The empty box and the live one cannot disagree
because they are solved from the same number. Verified: Mac 1.6 (empty 386.9 /
filled 387), Steam 1.778 (348.2 / 348).

**`rot: true` IS THE ONE PLACE EMPTY AND FILLED LEGITIMATELY DIFFER, and it is
not a bug to chase.** iOS and Android accept their screenshots either way up, so
the frame is derived from the picture — which the empty state has not got.
Measured on iOS: empty **619 × 315.8** (the 1.96 band, i.e. exactly where a
PORTRAIT shot settles), landscape shot **619 × 285**. About 30px, and the
alternative is asking the developer a question the pictures answer. Mac carries
no `rot`, so there it is exact by construction.

**AND THE SEED HAD NO `id`, WHICH FAKED THE STATE THIS WAS ABOUT.** Found while
opening the step: `smReadyToShip` pushed `{name, dataUrl}` into
`state.uploads.screenshots`, and every real door mints an id — `ss_…` from the
Assets well, `igdb-…` from a fetched title, `pshot-…` from the editor's own +,
because `order`, `removed` and `crops` are all keyed on it. So `shots[0]?.id`
came back `undefined`, `sel` fell to null, and **the stage drew its EMPTY arm
with the thumbnail sitting in the strip underneath it** — one screenshot on
screen, an editor saying there were none, and that thumbnail rendered
`data-shot-thumb="undefined"` and could not be opened at all.

**A helper that fabricates state has to fabricate it in the shape the real doors
produce**, or it exercises a state the app cannot reach — the same failure as
v6.61's ticks, which reported success while writing a status nothing read.
Verified: `_shotEd.shotId` and the thumb's own id both `ss_seed_macos`, zero
`undefined` in the strip.

**AND THE EMPTY STAGE SPEAKS IN THE ASSETS WELL'S VOICE (v6.47).** Jaco:
*"Upload screenshots en vez de 'Add a screenshot', puedes copiar el mismo
estilo de texto del dropwell que tenemos en assets."*

It was a `+` glyph and one 12px line — a control's label where the surface it
is quoting uses three lines: an arrow, a 13/600 label and an 11px hint. The
three `.asset-dropzone-*` classes are **borrowed, not copied**, so the type
cannot drift from Game Details' own well; measured, all nine values match it
(icon 20px/300 at `rgb(85)` with 6px under, label 13px/600 at `rgb(160)` with
4, hint 11px at `rgb(85)`).

**What is deliberately NOT taken is `.asset-dropzone` itself** — its dashed
border and `--inp-bg` fill — because this box already IS a well, and wearing
both is the second box this surface has refused all session. The flex `gap`
went with them for the same reason one layer down: those classes bring their
own margins, so a gap on top pays the spacing twice, which is the guide's
wait-list mistake in a smaller box.

The hint names the FILE and never the size: the head above already prints the
store's own "2880 × 1800 — 16:10 only", and since v6.46 the frame you are
looking at states the shape. The REMOVED-everything arm keeps its own sentence
and gains a second line pointing at the restore button underneath it.

**Still open, and it is a judgement rather than a measurement:** the zoom slider
and Reset are still drawn under an empty stage at `.4` and `pointer-events:
none`. Two rules in this file point opposite ways — `.35` is "still true, just
not what you asked for", while the shots veil's is *"a mark whose only content
is the question itself does not recede, it leaves"*. A zoom control for a
picture that does not exist looks like the second, but reserving the row is what
stops the strip moving when the first shot lands. Worth deciding rather than
sweeping.

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

### A hint is the app's bubble, never the browser's (v6.71–72)

`initGlobalTooltip` (app.js) and `.g-tip` (style.css). Jaco, pointing at the
submitted card's withdraw button: *"el tooltip tarda muchísimo en salir, debería
ser tan inmediato como los tooltip de la tabla de data privacy."*

**IT WAS NOT A SLOW TOOLTIP, IT WAS A DIFFERENT ONE.** That button carried a
bare `title`, which every browser sits on for about a second and then draws in
the SYSTEM's style. Measured, the platform card was the last surface in the app
still doing that — **zero `.tooltip-anchor` on a card and four plain `title`s**
(gear, cancel, version, build) — so the hint that names a gesture nobody can
guess was also the slowest and the least like the rest of the product.

**THE ATTRIBUTE IS THE TOOLTIP; THE CLASS IS THE LAYOUT.** The obvious fix is to
add `.tooltip-anchor`, and that rule sets FOUR layout properties written for a
span in prose — `inline-flex`, `align-items`, `vertical-align` and
`position: relative`. The last is the trap this file has now paid for twice (it
REPLACES `sticky` on the privacy headings; here the gear carries an absolutely
positioned alert dot). So the delegated handler accepts `.tooltip-anchor,
[data-tip]` instead: `showTip` has always read `dataset.tip` FIRST, which means
the attribute was already the real trigger and the class was only coming along
for the ride. Checked before widening it — **every `data-tip` in the codebase
was already on a `.tooltip-anchor`**, so nothing becomes a tooltip by accident,
and a control can now take the instant bubble with NO CSS and therefore no way
for its geometry to move. Measured: both buttons still 30 × 30, `display: flex`,
`position: static`, on the same x.

`aria-label` stays and only `title` goes — the accessible name is a different
job, and `title` was never doing it.

**AND THE BOX SHRINK-WRAPS AND CENTRES (v6.72).** Jaco: *"que el texto esté
centrado, que no sobre ancho en los tooltips."* `.g-tip` was a hard
`width: 230px`, sized for the 35 data-type descriptions — paragraphs beside a
"?" — so "Hold to cancel submission" sat in a box nearly twice its length with
the words stranded at the left, and the bubble read as misaligned **even though
its box was centred on the button to the pixel**.

**The nudge variant had already made this exact argument** — its own note says
"two words in that box leave most of it empty and the text stranded on the left"
— and solved it for itself. The base simply takes the same answer rather than
staying the one shape that still needed the exception.

`width: max-content` capped at the old **230** rather than the nudge's `nowrap`:
a one-line hint shrinks to its own text, and anything long enough to have needed
the 230 wraps at exactly the width it always did. Verified: a real 130-character
description still measures **230 wide**, so the paragraphs are untouched by
construction and only the short ones moved.

**THE WIDTH IS MEASURED IN JS, AND THAT IS THE LOAD-BEARING HALF.** `showTip`
centred against the CONSTANT `TIP_W = 230`; with the box free to shrink, that
constant parks a 206px bubble as though it were 230 and pushes it left of the
thing it points at, by half the slack. It reads `offsetWidth` now — after the
text AND the classes are set, or it measures the previous tooltip — the way it
already read `offsetHeight`. Measured: both bubbles centred on their button to
**0.00 / 0.1**, at 206 and 213.2 against the old flat 230.

The cost, stated rather than hidden: a MULTI-LINE tooltip is now centred prose.
That is right for the one-liners this was asked for and arguable for Apple's
descriptions; `text-align: left` on a `:has()` or a length test is the lever if
it ever reads badly.

**AND THE WITHDRAW HINT WEARS THE WITHDRAW COLOUR.** Jaco: *"el tooltip de hold
to cancel submission que sea rojizo."* `#ff3b78` is not a new hue — it is the
cancel hold's own, already shared by the sweep, the CANCELING SUBMISSION line
and the card's red edge. So the bubble joins a signal that exists rather than
adding a fifth colour: point at the button and the hint is already the colour
the card is about to turn.

It is the nudge's TWO-LAYER construction, copied rather than approximated, for
that variant's own stated reason: a single translucent background lets the card's
edge and the page show through, and a bubble floating above the layout must not
be transparent to it. Opaque `--panel-2` base, the tint laid over it as a flat
gradient. It does NOT take the nudge's `nowrap` or padding — those belong to a
two-word prompt, and this is the base bubble with a tone on it.

**Driven by `data-tip-tone="danger"` on the ANCHOR**, not by a selector naming
the button: the bubble is one shared element and the anchor is the only thing
that knows what the hint is about. And the class is **reset on every show**, for
the same reason `g-tip--nudge` is — otherwise a red tooltip follows the pointer
onto the next control. Verified: cancel → `g-tip--danger` with
`rgba(255,59,120,.14)` over `rgb(28,28,28)`, a `.32` border and
`rgba(255,105,150,.96)` ink; the gear one hover later → base bubble, zero
gradient, `rgb(58,58,58)` border, and the class gone.

**Still on `title`: the release block's `version` and `build 42`.** They are
labels rather than controls, so they were left; the two header BUTTONS are what
moved, because a row where one control hints instantly and its neighbour takes a
second is the "two controls in one role behaving differently" this file refuses
elsewhere.

### A preset that cannot answer without the network is not an answer (v6.43)

Jaco: *"si elijo varias casillas como cloud save, leaderboards, no guarda el
resultado y nunca marca como completado el paso en la store page review."*

**It was saving everything except the one field the step reads.** Measured with
cloudsave + leaderboards: both ids in `state.privacyPresets`, both chips lit,
`collectsData: 'yes'`, a 692-character `privacyDescription`. Empty:
**`dataPerType`** — and `isIOSSectionComplete('privacy')` requires it the moment
`collectsData` is `'yes'`. So the answer really was stored and the step still
could not finish, which is exactly what "no guarda el resultado" feels like from
the outside.

**The only writer of that field was the AI call.** `_triggerPrivacyAI`'s first
line is `if (!CLAUDE_API_KEY) return` — true in every local session by design
("AI inference features won't work locally"), and true live whenever the call
fails. **A checklist item that cannot be completed without a network round trip
is not a checklist item.**

**And the answer was already in the file, written for a machine to read back.**
Each preset's `description` names Apple's own data types and groups in quotes,
with purposes, because it was authored as a PROMPT: *"App Store privacy data
types collected: \"User ID\" (Identifiers group) for App Functionality…"*. The
preset knew precisely which rows it meant and then threw that away into a
sentence so an LLM could parse it out again. `types` on each preset states it
directly — same content, in the shape `dataPerType` stores — and
`togglePrivacyPreset` applies it synchronously.

Four things it is built under:

- **The union is per TYPE, not per preset.** Cloud Save and Leaderboards both
  collect `user_id` and `gameplay`; the table has one row each, carrying both
  presets' purposes. Verified: accounts + analytics gives `crash` →
  `analytics + app_function`, six rows in total.
- **`tracking` and `identity` take the STRONGER claim.** A type any selected
  preset tracks is tracked, because Apple's label is a statement about the APP
  rather than about one feature — the safer answer has to win a merge.
- **It recomputes from the selection rather than merging into what is there**,
  so DESELECTING a preset removes exactly its rows. Verified: +ads → 4 rows with
  `device_id` / `ad_data` at `trk: yes`; −ads → back to the same 2 rows.
- **The shape is `togglePrivacyDataType`'s own** (`purposes` / `identity` /
  `tracking`), not a second dialect, so a preset's rows are indistinguishable
  from hand-ticked ones and every existing control edits them.

**The AI is not removed and is not in conflict** — it still runs and still
replaces `dataPerType` wholesale when it answers, reading these very
descriptions and able to be more nuanced than a table lookup. What changed is
that nothing DEPENDS on it. That is the general form: *an inference may improve
an answer; it must not be the only thing that can produce one.*

Verified end to end on Mac App Store with a privacy URL set: cloudsave →
complete, +leaderboards → complete (same 2 rows), +ads → 4 rows, −ads → 2, all
off → `dataPerType {}` and `complete: false` (right: `collectsData` is null
again), Guest Play → `collectsData: 'no'`, no rows, complete. On screen the
badge reads **"6 data types selected"** with 6 rows lit and 10 boxes ticked.

**GOOGLE PLAY HAS THE IDENTICAL BUG AND IS DELIBERATELY NOT FIXED HERE.**
`isAndroidSectionComplete('dataSafety')` also demands a non-empty `dataPerType`,
and `androidSubmitAnswers.dataPerType` is written only by
`_triggerAndroidDataAI`. It is not a copy-paste away: Google's table is
`ANDROID_DATA_TYPES` with its own ids and its own flags
(`collected` / `shared` / `ephemeral` / `required`), so the Apple-shaped `types`
map above cannot serve it — mapping each preset onto Google's vocabulary is the
real work, and it is the next thing to do here.

### The cell is the control (v6.46)

`_prvCell` (render.js) and `.prv-hit` / `.prv-box` (style.css). Jaco, after the
inventory below: *"podemos empezar poco a poco, quitando los checks cuadrados y
convirtiendo todas las celdas en pulsables."*

**THE INVENTORY FIRST, because the number is what decides what this table
becomes.** Measured with three presets on: **35 data types × 8 columns = 280
cells if you open everything, and 40 of them hold a control — the grid is 86%
empty.** As it stands on screen, 14 rows visible, 5 are your answer and **9 are
there only because they share a group with one of yours**. A row is drawn
because of its neighbour, not because of anything you said. That is the
structural question, and it is still open; everything below is the first pass.

**THESE WERE THE LAST NATIVE CONTROLS IN THE APP.** Eight
`<input type="checkbox">` a row on `accent-color`, in a codebase where every
other pressable thing — the step disc, the pills, the masked selection stroke —
is drawn by us. **And the target was 15px wide in a 98px column**: the cell was
a box with a tiny control floating in it, so most of what you aimed at did
nothing. Same complaint the Mac preview's screenshot frames answered — *the
frames are not the button, the well is*.

**THE FIRST PASS MOVED THE TARGET AND LEFT THE PAINT BEHIND, AND THAT IS THE
LESSON (fixed v6.48).** It made `.prv-hit` the whole cell — measured, 100% of
its width and 36 of its 37px height — and then drew an 18 × 18 rounded chip in
the middle of it. Jaco, looking at the result: *"pero sigue igual no? yo me
refería a que las celdas fueran pulsables enteras, no con un checkmark cuadrado
de 18x18 dentro de cada celda."* He is right, and the numbers say so: the hit
had grown ~13×, the thing you can SEE had not moved at all, so from the chair
nothing had changed. **A hit area you cannot see is not an affordance** — which
is the same sentence the well pass rests on ("hover is not a resting mark"),
missed on the one surface where I had just finished quoting it.

So the box is the cell too: `flex: 1` + `align-self: stretch` inside the hit,
**92.31 × 30 — 94% of the cell's width and 81% of its height** — and the check
is a mark INSIDE the control rather than the control. The only inset is 3px a
side, and it is not decoration: the six purpose columns draw no dividers
between them, so a full-bleed fill merges three adjacent answers into one wide
blue bar and the row stops saying how many purposes you picked. 6px of ground
between neighbours, measured.

**THREE BLUES IN ONE TABLE, and none of them the app's.** The checkbox accent
was `#60a5fa` (`--sel-*`), the selected row was `rgba(37,99,212,…)` — **#2563d4,
a blue that appears nowhere else in this app** — and neither is `--pill-on-*`
(#52BAFF), which is what this app means by *you confirmed this*. One blue now:
the mark is `--pill-on-bg` / `--pill-on-color` and the row tint is that same
rgb(0,154,255) at the tint alphas, so a row and the marks in it are one
statement.

**THREE STATES, AND THE THIRD IS WHY IT IS A HELPER.** *live* — your row, socket
visible at rest. *add* — the row is not part of your answer yet, and **pressing a
cell there is a STATEMENT rather than a refusal**: saying "I collect Crash Data
for Analytics" is saying "I collect Crash Data", so it does both. It used to be
`disabled` at `opacity: 0`, i.e. a name followed by seven voids, which reads as
broken rather than as off. *locked* — genuinely unavailable, which **only Google
Play has**: Ephemeral and Required mean nothing until Collected is on. A real
impossibility keeps no pointer and is a `<span>`, not a button.

**THE SOCKET ONLY RESTS VISIBLE ON A LIVE ROW.** An add row reveals its sockets
when the pointer crosses it — the calendar day panel's × argument (*a delete on
every row, always visible, is a row of invitations*), and at any moment ~86% of
this grid is cells you have said nothing about. Measured: aimed cell **.10**,
its siblings in that row **.04**, a different add row **transparent**.

**WHITE 4%, AND IT CAME DOWN FROM 7 WHEN THE BOX BECAME THE CELL.** The step
disc's own pending fill is `rgba(255,255,255,.07)` and that is what an 18px chip
wanted; the same alpha over 92 × 30 is nearly ten times the ink, and the table
read as a wall of grey slabs. **An alpha is not a quantity of light until you
say how big it is** — this file's own "a weight that is right once is not right
four times", arriving through area rather than through count.

It is also not the pinned nav's `rgba(0,0,0,.22)`: that one sits on the bar's
rgb(55), and on this table's rgb(20) ground black 22% composites to rgb(16) —
four points, invisible. So it goes lighter rather than darker. The same forced
divergence that note describes, running the other way.

**AND THE PAINT IS WHAT MADE THE META SLAB UNTENABLE.** `.prv-meta-col` carried
`background: var(--panel-3)` — a permanent rgb(36) block down the right of the
table — *on top of* a `border-left` that already separates those two columns.
One boundary said twice, which the metadata strip's bottom rule and the Submit
row's divider both lost on. It survived while the cells drew almost nothing, and
stopped being survivable the moment they drew something: the socket is solved
against rgb(20), so over the slab white 4% lands DARKER than its own ground and
two columns of sockets inverted while the other six read correctly. The border
stays and is now the only thing drawing that edge.

**A CELL PRESS RENDERS, AND THAT IS NOT AN OPTIMISATION QUESTION.**
`togglePrivacyPurpose` used to say "checkboxes manage themselves — no full
re-render needed", which was true of a native checkbox and is false of a drawn
one: a button's appearance IS the render. Rendering is also the only correct
answer rather than a surgical class flip, for this file's own reason —
`dataPerType` is read by the count badge, the tracking note, the group ORDERING
(a flagged group floats to the top) and `isIOSSectionComplete`, and a repaint
would be an inventory of those. `reRenderStepModal` already captures and
restores this table's own scroll, so it keeps its place.

**AND `setPrivacyMeta` WAS DEFINED TWICE, twenty lines apart.** The second won,
and the two differed in exactly one line: the first called
`reRenderStepModal()`, the second carried a comment reading *"Tracking warning
updates lazily on next section re-open"* — which was not a decision, it was the
duplicate describing its own symptom. Ticking **Used for Tracking** is supposed
to print Apple's AppTrackingTransparency note under the table and did not until
you closed the section and came back. One definition now, same rule as
`smCheckSVG` and `SM_STEP_CHEVRON`; verified the note arrives and leaves in the
same paint.

**ONE MORE SPECIFICITY TIE, AND THIS ONE IS A COUNTING MISTAKE WORTH KEEPING.**
The empty socket's fill is one custom property through four rungs, all set on
`.prv-hit` itself so the ladder stays flat instead of becoming a fight between
`.prv-hit:hover .prv-box` and `.prv-hit.is-add .prv-box`. The obvious direct-hover
rule `.prv-hit.is-add:hover` is **three** in the class column and the row-reveal
rule `.prv-data-row:hover .prv-hit.is-add` is **four** — **`:hover` counts** — so
pointing straight at a cell left it at the row's own .07 and the cell you were
aiming at never brightened. The fix is the row-reveal selector plus `:hover`.

**AND THE PROBE LIED TWICE BEFORE THE CSS DID ANYTHING WRONG.** `.prv-box`
carries `transition: background .12s`, so reading `getComputedStyle` in the same
turn as the hover returns the interpolated value — transparent, every time,
which reads exactly like a rule that is not applying. Two rounds went into a
specificity hunt that was half real and half this. **Wait out the transition
before measuring a hover**, and when a probe and the screen disagree, suspect the
probe.

**ONE MORE THING THE GLYPH HAD TO GIVE UP.** `.prv-box svg` was `100%`, which
is the standing rule (size in CSS, never by `smCheckSVG`'s argument) and was
also the right SIZE only while the slot was 18px square — at 92 × 30 a check at
100% is a tick stretched across the whole cell. It states its own 18 now,
because it is a mark inside the control rather than the control. Every other
consumer of that helper is a square disc and keeps filling its slot.

Verified across all three tables that share `.prv-matrix`: App Store — zero
native inputs, 112 cells and 112 hits, the painted box **92.31 × 30 at radius 6
with 6px between neighbours**, checked `rgba(0,154,255,.35)` with
`rgb(82,186,255)` ink, hovered `.42`/`rgb(111,196,255)`, pressing a purpose on
an unselected row creating exactly that one type with exactly that one purpose
and the badge going 5 → 6, and the press inverting cleanly back. Google
Play — 418 hits, **76 locked**, pressing Collected on Crash logs unlocking
Ephemeral and Required in the same paint. Steam Languages — 6 cells, none ever
add or locked (every row is on by definition), each call inverting its own
current value, remove button untouched. Rows went 35.9 → 37 tall, so the table
grew 13px inside its 480px window; nothing else moved.

### The heading is a band, and the modal is sized from the table (v6.51)

`_prvColHead` (render.js), `IOS_PURPOSES[].head` (state.js). Jaco: *"alguna
opción de comprimir el ancho del modal, de forma que sigamos pudiendo estar
cómodos de espacio? Quizás los tooltip symbols nos hacen daño."*

**THE SUSPECT WAS INNOCENT AND THE MEASUREMENT SAYS SO IN ONE NUMBER.** A
column's floor is the longest WORD in its heading, because everything else
wraps — and for the six purposes that is **"Personalization" at 84.0px** against
88 of content in a 98px column. The `?` disc does not touch that, and neither
does the label's full length. **So the purposes could not narrow by a single
pixel**, and no amount of tidying the header was going to change it short of
taking 9px type smaller.

**THE META COLUMNS WERE PAYING FOR A CONSTRAINT THAT IS NOT THEIRS.** "Identity"
and "Tracking" are **44.8px**, half of Personalization, and they sat at the same
98 only because every column did. They are a different GROUP — their own
question, their own border — so equal width applies WITHIN a group and not
across the rule between them, which is also what lets the two read apart at a
glance. 66 rather than the 53 the words strictly need, because this row is the
one part of the table you read rather than press. Within the six purposes they
stay identical, for the metadata strip's own reason.

**AND THE MODAL IS DERIVED FROM THE TABLE NOW, NOT PICKED.** It was 1000 — the
Mac Product Page Preview's number, borrowed on the argument that the headers
"and their tooltip icons" needed room. The table is 870 (150 + 6 × 98 + 2 × 66)
and the modal is that plus everything between it and its own outer edge: 48 of
scroller padding, the 11px bar, `.prv-matrix-wrap`'s 1px border and the modal's
1px border, both sides — **933**.

**THE WRAP'S BORDER IS THE TERM THAT IS EASY TO FORGET.** At 931 the wrap's
content box came out **868 against an 870 table** and the whole thing sat in
permanent 2px horizontal scroll. Measured before and after; the sum is written
out at `.prv-matrix`'s `min-width`, and those two numbers move together.

**THE NAME IS THE HANDLE.** This table already had two tooltip conventions and
only one drew a mark: the 35 data-type names down the first column are bare
`.tooltip-anchor`s — hover the name, no glyph — while the eight headings carried
a `?` disc. One table, two answers to one question; the row labels are the older
and the quieter, so the headings joined them. **The icon was never the trigger
either** — `app.js`'s handler is `e.target.closest('.tooltip-anchor')`, so it
was a visual handle on a hover area it did not define.

What it really cost is **HEIGHT**: it rode along as one more wrapping token,
pushing App Functionality to three lines and the header row to 61px. Gone, 44.8.

**BLOCK, NOT `inline`, AND THAT IS THE HALF THAT MAKES THE NAME A REAL HANDLE.**
An inline box's hover area is its GLYPHS: measured, `elementFromPoint` at the
dead centre of a two-line heading returned the `<th>`, because the centre falls
in the leading BETWEEN the lines where no inline box exists. So the target would
have been two short runs of 9px text with a dead stripe through the middle — a
smaller and stranger target than the disc it replaced, which is the opposite of
the point. As a block it is the whole heading area; verified, the centre of all
eight now hits the anchor.

**TWO LINES ARE STATED, NOT WRAPPED INTO.** Jaco, on a mockup of the row: *"mola
que casi todos tengan 2 lineas, queda más ordenado."* He is right and the reason
generalises: a header row that breaks in the same place in every cell reads as
ONE BAND, where a ragged mix of one and two lines reads as eight captions
sitting above a table. Sized so the natural wrap happens to land there, the
break is luck — one more character in a translation, or a font that falls back,
and a column silently becomes one line or three while its neighbours do not.
Stating the lines is also what lets a column be sized by its longest WORD rather
than by its longest label.

`head` is its own field because `label` is not only a heading: `_triggerPrivacyAI`
builds its prompt out of `${p.id}: ${p.label} — ${p.desc}`, and a `<br>` in there
would be sent to the model. Personalization takes Apple's own full name —
**Product Personalization** — which costs nothing once the heading is two lines,
and en.json was updated to match so the two cannot disagree.

**AND `vertical-align: bottom`, because the cells inherit `middle`.** Analytics
is one word and cannot break, so centred it floated between its neighbours' two
lines and read as misplaced rather than as shorter. Bottom puts every heading's
last line on one baseline — measured, **456.8 for all eight** — and the spare air
goes above, where there is nothing to align to.

**THE BREAK IS AN ENGLISH TYPOGRAPHIC DECISION, so a translation does not
inherit it** — and the first attempt got this exactly backwards. `t()` returns
the KEY when a string is missing and en.json is a verbatim copy of `label`, so
"is there a locale override" is not the question: en.json always answers, and
every heading came back single-line. The test is whether the resolved string IS
the English one. Verified both ways: English takes the chosen lines, zh-CN's six
translations all print as one string and wrap on their own, which is right for a
language that breaks per character.

Measured end to end: modal **1000 → 933**, table **937 → 870**, header row
**61 → 44.8**, no horizontal scroll (wrap content 870 against a 870 table), zero
icons, all eight tooltips intact, seven of eight headings on two lines with
Analytics the one single, and Google Play verified — 11 headers, no icons, tips
intact, its own pre-existing sideways scroll unchanged (eleven columns have
never fitted a 680 modal, which is what `overflow-x: auto` is there for).

### The data types table is an accordion (v6.52–70)

`buildPrivacyMatrix` (render.js), `.pvt-*` (style.css), `togglePrivacyGroup` /
`_privacyStampOrder` (app.js). Ported from Jaco's own mock,
`apple-privacy-modal-990.html`, which is where the design was argued — this is
the port, not the design.

**IT ANSWERS THE STRUCTURAL QUESTION v6.46 LEFT OPEN.** That entry measured the
grid and stopped: *"35 data types × 8 columns = 280 cells if you open
everything, and 40 of them hold a control — the grid is 86% empty… That is the
structural question, and it is still open."* The answer is that the 16 GROUPS
are the view. All sixteen fit on one screen with nothing scrolled, each one
carries a count of what you have declared inside it, and exactly one opens at a
time.

**THE OLD MODEL'S CENTRAL CLAIM WAS THE PROBLEM.** It read, in its own comment:
*"a group with one or more flagged data types is ALWAYS expanded, every time the
table renders — that invariant is non-negotiable."* Two costs, and its own
words admit the first: the header of a flagged group is **a button that does
nothing**, because the invariant re-opens it on the next paint. The second is
arithmetic — three presets flag four groups, so four blocks opened at once and
the table was a wall again.

**The counter is what made the invariant unnecessary.** A closed group that says
"2" has not hidden anything from you; it has told you what is inside without
spending a screen on it.

**ONE AT A TIME, and that is the load-bearing half.** With several open the
lighter ground marks four places and stops meaning *you are here*; with one it
is the only lit block on the table and the other fifteen step back to .38.
Pressing the open group closes it, so the header is never inert. The whole model
is `state.privacyGroupOpen[pid]` — one group name, or null.

**THE ORDER IS FROZEN WHEN THE TABLE OPENS.** Flagged groups still float to the
top in Apple's own relative order; what changed is WHEN that is decided.
Recomputed per render, marking the first cell of an untouched group sent that
group to the top **under the pointer that had just pressed it** — the same rule
the submitted card's disclosure toggle and the hold-to-submit row were both
rebuilt under. `togglePrivacyMatrix` stamps it on the way in.

**A PRESET CLICK IS THE ONE EXCEPTION**, and it is a real one rather than a
loophole: a preset chip lives ABOVE the table, and pressing one is exactly the
event that changes which groups hold data. So `togglePrivacyPreset` re-stamps
after writing `dataPerType` — the one case where the thing you are pointing at
cannot be the thing that moves. The open group is left alone; re-stamping
reorders, it does not fold.

**THE CELL IS STILL THE CONTROL — ONLY THE PAINT SHRANK.** v6.46's sentence is
unchanged and the mock says it too: *"la zona pulsable es SIEMPRE la celda
entera —acertar un cuadrito de 14px es una lotería—; lo que cambia es dónde se
pinta la marca."* At 92 × 30 the mark was right for six columns in an 870px
table and turned eight columns in a 748px one into a wall of slabs. **An empty
cell now draws almost nothing**: a 14px square outlined at white 7%, the
dividers' own alpha, so the table reads as white space with blue marks in it
rather than 280 boxes asking to be answered. Same arithmetic as v6.46's *"an
alpha is not a quantity of light until you say how big it is"*, run the other
way.

The square wears the app's own selected-pill stroke at a 4px radius and joins
the **shared `::after` selector list** rather than redrawing the gradient — that
list's own stated reason. Note the entry is a descendant selector
(`.pvt-cel.is-on .pvt-sq::after`) because the state class is on the BUTTON and
the ring is drawn on the square inside it.

**`table-layout: fixed` IS THE FIX FOR A BUG THIS TABLE ALWAYS HAD.** In auto
mode the browser re-solves every column from what is VISIBLE, so opening a group
introduced longer type names, the first column widened, and the eight check
columns shifted sideways under the pointer that had just opened it. `fixed` only
takes effect on a table with a definite width, so `width: 100%` is load-bearing
rather than tidy: the table then follows the scroller's gutter and there is no
arrangement where it scrolls sideways.

**THE ABBREVIATIONS ARE THE COLUMN'S FLOOR SPEAKING.** The two words that
decided the old 98px column were "Personalization" (84.0) and "Functionality"
(79.2) — the longest WORD is the floor because everything else wraps. Shortened
to **"Personaliz."** and **"Functional."** in `IOS_PURPOSES[].head`, the longest
line in any purpose is 66px, inside the 75 a 79px column leaves. Nothing is lost
because the `<th>` is a tooltip anchor carrying the full label AND Apple's
description: an abbreviation with no way back would not be worth 40px of modal;
one with the full name attached is the column being honest about its width.
`label` stays flat and full — `_triggerPrivacyAI` builds its prompt from it.

**THE MODAL IS 807, DERIVED:**

```
    748 table   116 name + 8 × 79
    + 48  .submit-modal-scroll's side padding (24 each)
    +  9  the TABLE's scrollbar lane (--pvt-bar) — .pvt-scroll has its own
    +  2  the modal's own 1px border, both sides
    = 807
```

**THE SCROLL IS INSIDE THE TABLE, AND THAT IS WHAT PAYS FOR THE OTHER TWO
NUMBERS.** Jaco: *"el scrolling debería ser dentro de la tabla, de forma que
siempre se vieran las preset chips en el mismo sitio."* Opening a group moves the
rows and leaves the chips, the URL field and the opening question exactly where
they were — which is the whole point of an accordion you work down.

**THE FLEX CHAIN IS FOUR BOXES DEEP AND THE FIRST VERSION STOPPED AT THE TOP OF
IT.** A `flex: 1` child is only bounded if EVERY box between it and the scroller
is itself a flex column; one `display: block` in the chain and the height reverts
to "as tall as my content". Measured then: the table grew to its full 653 and the
MODAL took the 239px of overflow instead, so the chips scrolled away and nothing
looked different from before. The chain is
`.submit-modal-scroll > .ios-step-body-content > .prv-nlp-wrap > .ios-subsection
> .pvt-scroll`, and each link is selected by **`:has(.pvt-scroll)`** rather than
by position — three of those class names are shared with steps that must not
become flex columns, and `:last-child` is a fact about the markup a later edit
can quietly change. `min-height: 0` on each, or a flex item's default
`min-height: auto` refuses to shrink below its content and hands the overflow
straight back.

It is **scoped to this step**: `.submit-modal-scroll` is shared by every step in
the app and turning it into a flex container globally is not a change this
surface gets to make.

**AND THEN THE MODAL'S OWN LANE BECAME DEAD WEIGHT — 820 → 807.** Jaco again:
*"eso a la vez nos permitiría que el modal no tuviera nunca una barra de scroll
lateral… dejando el padding a ambos lados de 24px."* Right: the body cannot
overflow once the table absorbs the slack, so `overflow-y: scroll` was reserving
11px for a bar that can never be drawn. `auto` rather than `hidden`, and that is
the part worth arguing — the modal is `clamp(560px, 88vh, 860px)`, and at its
floor the content above the table plus the table's own min-height is tight, so
`hidden` would make a short viewport uncloseable rather than merely cramped. The
opposite trade from `.submit-modal-scroll`'s own default, for the opposite
reason: there the lane is reserved because content grows under the pointer, here
nothing can.

**THE BAR IS `.main`'s, NARROWED — AND SETTING ONLY ITS WIDTH IS WHY IT LOOKED
AWFUL.** Jaco: *"no necesito que el scroll bar de dentro de la tabla sea tan
horroroso y ancho."* With `width` but no track or thumb rule it fell through to
the app-wide default at the top of style.css (`::-webkit-scrollbar-thumb {
background: var(--border) }`) — a solid 11px block. That default is written for
6px bars and is exactly what `.main` had to override. So this takes `.main`'s
treatment whole: transparent track, translucent white thumb inset by a
TRANSPARENT BORDER with `background-clip: content-box`, fully rounded. **9px, not
11**, because this bar sits inside the table a few pixels from the rows it
scrolls where the modal's sits on the modal's edge with nothing beside it — the
visible thumb is 5px in both (9 − 2×2 here, 11 − 2×3 there), so the ink is the
app's and only the lane is tighter.

**AND THE THUMB IS ONLY THERE WHILE YOU ARE.** Jaco: *"que el scroll no esté si
no lo uso."* A bar parked down the side of the table is a permanent mark for a
transient act — the same argument the calendar's row × and this table's own empty
sockets are built on. **It hides the THUMB, not the lane**, which is the whole
safety of it: the 9px stays reserved, so the eight columns cannot shift by a
pixel between resting and scrolling. Hover on the SCROLLER rather than on the
thumb, because a thumb you cannot see is a thumb you cannot aim at. And
deliberately NOT the native overlay bar, which would do this for free on macOS:
it costs `scrollbar-width` or `scrollbar-color`, either of which switches Chrome
off the WebKit path — the trap recorded twice in this file — taking the lane to 0
and making the table's width depend on a system setting.

**THE HEADER'S RULE IS 1px AT THE HEADINGS' OWN ALPHA.** It was 2px at white 16%.
A thick soft line is a BAND — you read its width before its position — where a
hairline is an EDGE, which is all this is; it separates two KINDS of thing rather
than two rows, so it has to outrank the `.06` between rows, and at 1px it does
that by being brighter rather than fatter. Full white was the first try and was
too much for a reason worth keeping as a rule: **the line was brighter than every
label it underlines** (the eight headings are `.55`, DATA TYPE is `.72`), and a
boundary that outshouts the thing it belongs to reads as a mark of its own. `.55`
puts it level with the eight and a step under the row's own heading.

**AND NOTHING MOVES WHEN YOU TICK A CELL.** Jaco: *"al rellenar cualquier
casilla, se mueve arriba, no hagas eso. Que se queden donde están, y sólo si
cierro y abro la tabla que se recoloquen."* Two separate movers, and the order
was innocent both times — measured, the group kept its row on every press.

**The 14px one was the flex chain gated on `:has(.pvt-scroll)`.** A flex
container does not collapse its children's margins, so the chain was plain
blocks while the table was closed and flex columns the moment it opened; every
margin above the toggle started being paid in full and the toggle rode the
difference down. It is a flex column in **both** states now — selected by
structure rather than by what is rendered. **A layout that depends on whether a
thing is on screen will move when it appears.**

**The 326.5px one is a RENAMED CLASS that broke a JS selector silently.**
`reRenderStepModal` captures and restores the table's own scroll, and it looked
for `.prv-matrix-wrap` — which v6.52 renamed to `.pvt-scroll` on this surface.
So the capture returned `null`, the restore skipped, and every cell press sent
the group you were working in back to the top of the table. No error, no
warning. Both selectors are listed now (`.pvt-scroll, .prv-matrix-wrap`) in all
four places, because the old name is still Google Play's and Steam's and the two
never co-exist. **The rule: a selector is a dependency** — renaming a class in a
builder breaks every rule and every query that named it, and the ones in JS fail
quietly where CSS at least stops painting.

**And the cache trap caught this one too**, exactly as this file's own note
predicts: the first fix measured as not working because the pane was holding
`app.js` at a version bumped BEFORE the edit landed. `reRenderStepModal
.toString()` is what caught it — the running function still had the old
selector. Bump AFTER editing, not before.

**AND THE TOGGLE DOES NOT MOVE WHEN IT CHANGES ITS MIND.** Jaco: *"el SHOW ALL
DATA TYPES está bien colocado, que el HIDE DATA TYPES esté igual, que no se
mueva."* Measured, the button went 144.4 → 118 and dragged the count badge 26.4px
with it — a control that jumps as a consequence of being pressed, the rule the
submitted card's disclosure toggle and the hold-to-submit row were both rebuilt
under. **Both labels are always in the box**, stacked in one grid cell with the
inactive one at `visibility: hidden`, so the width is the larger of the two by
construction in any language; a measured `min-width` would be one number that
goes stale the first time either string is translated. Verified: 144.41 and the
badge at 406.4 in BOTH states, delta 0. Google Play's copy of this button still
swaps its string and still jumps, and goes with that table when it is ported.

**AND ONE FADE NOW ANSWERS TO WHICHEVER SCROLLER IS REALLY MOVING.** With the
body no longer overflowing, every test in `_smModalFades` said "not scrollable",
both fades sat at 0 and the table was guillotined on the modal's bottom edge with
nothing to say there was more. It reads the body when the body scrolls and the
inner scroller otherwise — found by `[data-inner-scroll]` rather than by id, so
any step can hand its scrolling downwards later without editing that function.
One fade, not a second set: it belongs to the modal and spans the whole body,
which is exactly where the cut is, where a fade on `.pvt-scroll` would be a
second boundary a few pixels inside the first.

**THE OPENING QUESTION LANDS ON THE COLUMN, AND IT NEEDED AIR.** Jaco: *"quiero
que la primera pregunta de DOES YOUR APP etc. esté alineada a la izquierda con
los section titles, y que respire un poco más, porque es importante."* Measured,
its TEXT sat at **257** against the 245 everything else in the step uses, and its
BOX at 234 — out on both sides at once, from two offsets that are Content
Rating's rather than this step's. `.ios-q-row` pays `margin-left: -11px` and
takes it back as a 3px transparent border plus 8px of padding, which is the amber
validation rail's machinery (the bar has to hang outside the text column so
lighting it does not indent the question); `.ios-q-label` adds its own 12px, which
is what makes thirty questions read as a list under their section header.
**Neither applies to one question at the top of a step.** The air is the other
half — 34 → 46 of row and 8 → 20 of margin, and air rather than size because the
answer pills opposite are `--field-h` and growing the type would either drag them
along or leave a row whose two halves disagree.

**THE EIGHT COLUMNS ARE EQUAL ON PURPOSE.** Narrowing Linked to Identity and
Used for Tracking does read them as their own block — they are a different
question from the six purposes — but it also breaks the grid into eight
identical checkboxes drawn at two sizes. It costs ~40px of modal and buys one
grid. What separates those two is what they say, not that they are smaller.

**TWO DOORS, ONE WIDTH.** `submit-modal-privacy-wide` used to test the flip
alone (`storePreview` + a `data` flip target). But `privacy` is also a real step
— macos_full lists it — and reached that way the identical table was drawn in a
680px modal with **253px of sideways scroll**, which the old comment waved off
as *"a separate, differently-reached surface that wasn't asked for here."* Same
builder, same markup, same 748px table: same surface, different route, same
width.

**A LIVE ROW IS BLUE INK, NOT A BLUE GROUND.** The old table tinted the row at
`rgba(0,154,255,.08)`, and a tint behind the marks competes with the marks —
which are the same blue and are the thing you are reading. The name says it just
as clearly and takes nothing from them.

**Three traps this hit while being built, all of them already in this file:**

- **`.tooltip-anchor` is authored `display: inline-flex`**, for a span in prose.
  On a `<th>` that stops the element being a table cell: measured, the eight
  headings stacked into a column down the left, each still the right width
  because they were no longer cells in a row. They keep the class — it is what
  the app's ONE tooltip binds to — and take their display back.
- **`scrollbar-width: thin` cost the table its lane.** Same family as the
  `scrollbar-color` note below: either STANDARD property switches Chrome off the
  WebKit path, and on macOS the standard bar is the overlay one. Measured with
  it: `offsetWidth − clientWidth` **0**, columns spread 116/79 → 117.7/80.2.
  Without it, 11. **Do not put either property on a scroller in this app.**
- **A two-line name made its row 2.6px taller.** `td.pvt-ty` takes 2px of
  vertical padding against every other cell's 5, so "Other User Contact Info"
  asks for 32.6 and the row's own 36 decides. The height is a property of the
  ROW, not of the longest name in it.

**IT IS ITS OWN VOCABULARY (`.pvt-*`) AND THAT IS DEBT, NOT A DESIGN.**
`.prv-matrix`, `.prv-hit`, `.prv-box` and `.prv-check-cell` are shared by Google
Play's Data Safety table (eleven columns, plus a `locked` state this design has
no concept of) and Steam's Languages table. Rewriting them in place would have
changed three surfaces to fix one; scoping the new look under an extra class
would have left every rule fighting a `.prv-*` rule underneath it — the
specificity war this file has lost six times on the Mac preview alone. So there
are now two table vocabularies for what is visibly one kind of object. **Google
Play wants this treatment too, and the day it gets it `.prv-*` should GO rather
than be kept as the second dialect.** It is in the backlog below.

`state.privacyGroupExpanded` is **deleted, not left at `{}`** — a field nothing
reads is a mechanism waiting to be switched back on.

Measured: modal **807**, table **748**, columns **116 / 79 × 8**, table scrollbar
lane **9** with the modal's own at **0** and the body scrolling **0**, **zero**
horizontal scroll anywhere in the modal's subtree by either door, all rows **36**
(one-line names and two-line alike), all eight headings on one baseline, 16 groups
with 1 open and 15 dimmed, closing leaves 0 open and 0 dimmed, pressing a cell on
an untouched type creates exactly that type with exactly that purpose and takes
the badge 7 → 8 with the group staying put, and the open group is kept per
platform (`macos: Purchases` beside `macos_full: Diagnostics`). Scrolling the
table moves the preset chips by **0.0**. The question's box AND text, the URL
label, QUICK SETUP and the table all land on **246** — one column, five things.
The fades read 0/1 at the top, 1/1 mid-scroll and 1/0 at the end, off the inner
scroller.

**Both neighbours verified untouched.** Google Play — 418 hits, 76 locked, box
**92 × 30 at radius 6**, 11 headers, modal 680, an 11px body lane, no `.pvt`
anywhere. Content Rating's own question rows — still `-11px` margin, 8px padding,
a 3px border, 34px min-height and 8px below, on a 680 modal, so the scoped
`.ios-q-row` override cannot reach them. Steam Languages still routes through
`_prvCell`, which no selector here can touch.

**A FADE UNDER THE HEADER WAS BUILT AND REMOVED IN ONE VERSION (v6.65 → v6.66).**
Jaco asked for *"un mini gradiente en el top de la lista, bajo la línea divisoria
horizontal"* and, looking at it, took it back out: *"quita casi mejor el
degradado."*

It was correct on its own terms — a 36px `::after` hanging off the sticky `<th>`
(a sticky element is a positioned one, so the fade rode the scroll for free, nine
of them tiling edge to edge like the calendar's week rule), `.cr-pinned::after`'s
own stops rather than a second dialect, shown only past `scrollTop` 2. And still
wrong for this table, which is the part worth keeping: **the Mac preview's fades
dissolve a column that ends in nothing, where this list ends on an opaque header
with a 1px rule under it.** A boundary already drawn does not also need
softening — the "two marks on one object" this file has refused on the Submit
row's border, the metadata strip's second rule and the calendar's rings. Removed
whole, rule and note.

`_smModalFades` still writes `is-scrolled` on the inner scroller and it now has
**no consumer**, which is deliberate rather than an oversight: it is one line
inside a function that has to run anyway, and it is the flag the next thing that
asks "is this scrolled" will read. Not the dev bar's case — nothing is switched
off waiting to be switched back on.

**AND THE GROUP TRAVEL LOST ITS `requestAnimationFrame` — THE MOCK WAS ALREADY
RIGHT (v6.66).** Jaco: *"cuando toco algún item que está a media altura de la
tabla, hace un raro, como que baja antes de ponerse en focus centrado"*, and then
the instruction that settled it: *"si revisas el html que te pasé, me gustaba
mucho más su comportamiento, cópialo igual y no inventes."*

**Diffed against `apple-privacy-modal-990.html`, the ARITHMETIC was already
identical and the TIMING was not.** The mock restores the captured `scrollTop`
onto the fresh markup and calls `scrollTo` on the very next line — one
synchronous pass, so the restored position is never painted. The port deferred
the same block to a `requestAnimationFrame`, which is one whole frame at that
position before the ease begins.

**And in a one-at-a-time accordion that position is usually WRONG**, which is why
the frame was visible rather than merely wasted: opening a group closes the one
that was open, so if that one sat above you, everything below it jumps up by its
whole height. `reRenderStepModal` restores the scrollTop it captured — right for
a cell press, wrong here, because the same number is now a different place. What
Jaco saw was that jump, followed by a 420ms ease correcting it. Two motions for
one gesture.

**A pin was written first and thrown away**: measure the pressed row's offset
before the render, put the scroller back by the drift after. It fixes the same
frame and it is a mechanism the mock does not have — and the mock is the thing
that was approved. *Copy the approved behaviour; do not solve the same problem a
second way.*

Native `behavior: 'smooth'` is kept for that reason, against this file's own
standing preference for `_smScrollTo` on a nested scroller. If Safari misbehaves
here that is the one line to swap — and the mock is the evidence it does not.

Measured with a group open above and the table scrolled to 220: **first-frame
delta 0**, one continuous ease 220 → 218.5 → 213.5 → 200 → 167.5 → … → 77, the
pressed header landing **1.9px under the sticky head** (the +2), and closing
travelling **0**. Geometry unchanged throughout — modal 807, table 748, columns
116 / 79 × 8, data rows all 36, table lane 9, modal lane 0, zero horizontal
scroll anywhere in the subtree.

**THREE SMALL ONES ON TOP (v6.67), AND TWO OF THEM ARE THE SAME SENTENCE.**

**The modal's own top fade is off here**, gated `:has(.pvt-scroll)` beside the
`:has(.cr-pinned)` rule it copies. Jaco: *"como no tenemos scroll en el modal, no
hace falta el gradiente del top, porque la pregunta nunca cambia de posición."*
The two rules switch the same fade off for opposite reasons — there because an
opaque bar says "more above" better than a gradient can, here because **nothing
is above**: this step hands its scrolling down to `.pvt-scroll`, so the question,
the URL field and the preset chips are nailed where they are drawn and a fade
over them claims hidden content that does not exist. `_smModalFades` reads the
inner scroller once the body stops overflowing, which is what was lighting it —
correct for a scroller, about the wrong box. Gated on the table's presence rather
than on `.submit-modal-privacy-wide`, so folding the table away gives the body
its overflow and its fade back. The BOTTOM fade stays: the table really is cut on
the body's bottom edge. Measured: fade-top `display: none`, question `top` 179
before and after scrolling the table 300 — **moved 0**.

**THE CELLS LOST THEIR TOOLTIPS.** Jaco: *"no me has quitado los tooltips on
hover de cada checkmark."* Every square was a `.tooltip-anchor` naming its type
and its column, on the argument that it is "what keeps a grid of unlabelled
squares readable" — and with one group open that does not survive its own
numbers. A cell's TYPE is printed on its own row four inches left, and its COLUMN
is printed in a header that is `position: sticky` and therefore never off screen.
The tooltip repeated two labels you can already read, on **128 targets**, and a
hint that fires on every pass of the pointer across a grid is noise. The two
anchors that stay are the ones naming something NOT on screen: the row's type
name (Apple's description) and the column heading (its full unabbreviated label,
which is what earns the abbreviations). The pair moves to `aria-label`, where
"the label is elsewhere on screen" is not an answer. Measured: 0 cell anchors, 5
type names and 8 headings still anchored, `elementFromPoint` at a cell's centre
resolving to **no** `.tooltip-anchor`.

**AND THE HEADER RULE WENT `.65` → `.38`, WHICH IS WHERE THE ARGUMENT CHANGED.**
Jaco: *"tampoco has bajado el grosor/opacidad de la línea divisoria horizontal
primera."* It measurably WAS at `.65`, the value he had asked for two messages
earlier, and he was right anyway — which is only a contradiction while you read
the line against the LABELS, and that is what every value in this line's history
was solved against (1.0 → `.55`, the headings' own alpha → `.65`, a notch over it
because a hairline composites heavier than 10px type).

**The line belongs to the TABLE, and the table is drawn in white `.06` and
`.22`.** Measured, at `.65` it was the loudest horizontal thing in the modal by a
factor of three: a white rule across a grid whose every other boundary is a
whisper. Same census mistake as the calendar's filled day boxes — *"a weight that
is right once is not right four times"* — arriving here through what sits UNDER
the line rather than what sits above it.

`.38` keeps what the earlier passes bought and drops what they got wrong. Still
the strongest rule in the table by a clear step (`.38` against `.22` and `.06`),
so it still reads as the edge between two KINDS of thing rather than between two
rows; and now under the labels it underlines, which is the ceiling the first pass
wrote and the one line of the derivation nobody has argued with. 1px throughout —
the thickness has been at its floor since v6.58, so the alpha is the only lever.

**AND THE TRAVEL IS THE APP'S OWN AFTER ALL (v6.68) — v6.66 KEPT THE BROWSER'S
AND ARGUED FOR IT.** Jaco, two versions later: *"sigo viendo un recorrido
rarísimo, compruébalo de verdad"*, and then the question that ended it:
*"¿puede ser safari? ¿en chrome no pasa?"*

**Yes, and that is the whole answer.** Measured here with REAL clicks on v6.68's
predecessor logic, Chrome is clean in both cases — nothing open: 240 → 304, one
direction, biggest frame step 4px; a group open ABOVE: 260 → 115, one direction,
9.5px at the middle of the curve. So the thing he could see on every press was
never visible from this pane, which is this file's own opening heading arriving
for the second time.

**v6.66 kept `scrollTo({behavior: 'smooth'})` on the sentence *"the mock is the
evidence it does not [misbehave]"*, and that sentence is the mistake.** It is
evidence about the MOCK — a standalone file with its own boxes — not about this
DOM, and "The travel is ours, not the browser's" exists precisely because which
box an engine scrolls, and whether it honours `smooth` on a NESTED scroller whose
content changed height in the same tick, is per-engine. Safari is the engine
nobody here can drive, so that choice was unverifiable BY CONSTRUCTION and should
never have been made on an argument rather than a measurement.

**Copying the mock's TIMING was right; copying its choice of ANIMATOR was not** —
and separating those two is the rule this leaves. "Copy it exactly, don't invent"
is about behaviour, and the behaviour is *one motion starting from where your eye
is*. `_smScrollTo` delivers exactly that on the app's own 420ms sine, writing
`scrollTop` frame by frame on one named element, with no engine's smooth
implementation involved at all. Same arithmetic, same single motion, one fewer
thing that can differ between two browsers.

**AND THE PROBE MANUFACTURED THE BUG IT WAS HUNTING — carry this one.** The first
real-click attempt logged a **240 → 0 jump in a single frame**, which is exactly
the symptom being chased. It was the test: the Browser pane's screenshot
coordinate frame is **800 × 686** while the page's viewport is **1249 × 1072**, a
factor of **0.6405**, so coordinates taken straight from `getBoundingClientRect`
land elsewhere — that click went to (968, 994), outside the modal, onto the
backdrop, and CLOSED it. The 240 → 0 was the modal going away.

Two things follow. **Scale rect coordinates by `800 / innerWidth` before handing
them to the click tool**, and **confirm with `elementFromPoint` at the PAGE point
before pressing** — the check that would have caught it in one line. And the
general form, which this file has now recorded three times in three shapes: when
a probe reproduces the reported symptom, suspect the probe before you believe it
(the scroll-restore bug hid FROM measurement, the pseudo-element fill was
invisible TO it, and this one invented it).

Measured on v6.68 with real clicks and the coordinates corrected: both cases
monotone with zero direction changes, landing 2.1px under the sticky head, and
`_smScrollTo` confirmed in the running function rather than in the file.
**Safari is still unverified from here and has to be checked by hand** — but
there is now nothing engine-specific left in this path to check.

**AND THE 420 IS THE DURATION AT FULL DISTANCE, NOT AT EVERY DISTANCE (v6.69).**
Jaco, once it was one clean motion: *"quizás el scroll podía ser un pelín más
rápido."* Flat, `_smScrollTo` spent 420ms on a 145px hop and on a 515px one
alike — so the short trip crawled while the long one was correctly paced, and
"too slow" was exactly true of the case in front of him.

**A shorter constant was the wrong fix and the note above says why.** 420 is
borrowed from the card's own advance *"so two travels in one app do not run at
two speeds"*; a second number here would have taught two, and would have rushed
the Mac preview's long pill trips to fix a table nobody was looking at. Duration
as a FUNCTION of distance keeps one travel — one rate, one curve — with 420 as
what a full-length journey still costs.

**`sqrt`, not linear.** Linear is the obvious form and fails at both ends: a 60px
nudge would get 48ms, which is a jump with an ease painted on it, and the
relationship the eye reads in motion is not "twice as far, twice as long".
`420 × √(d / 520)`, floored at 170 and capped at 420 — the floor so the shortest
travel is still a motion rather than a cut, the cap because nothing here is
longer than the reference and if something ever is it must not drift slower than
the card it borrowed the number from. REF is the longest travel measured on the
Mac preview's pinned nav (515, rounded).

What it gives: 100px → 184ms, 145 → 222, 220 → 273, 300 → 319, 420 → 377,
520 and beyond → 420.

Measured with a real click on the hard case (a group open above, 220.5px):
**284ms against the old 420**, 18 frames, zero direction changes. And sampled
frame by frame over a 260px travel the curve is a clean sine — deltas ramping
−1.5 → −23 → −2, every one of them negative. **The two "direction changes" an
earlier probe reported were 0.5px of sub-pixel noise at the tails**, below a
device pixel; count a flip only when it exceeds one.

The clamp still does its job and looks like a bug if you are not expecting it:
pressing a group near the BOTTOM lands it part-way rather than under the header,
because `scrollHeight − clientHeight` has run out. Measured 51.5px short on a
group the table cannot lift any further — correct, and not something to chase.

**THE TABLE OPENS FOLDED (v6.70).** Jaco: *"cuando cierro y vuelvo a abrir la
tabla, quiero que todo esté comprimido por defecto."* `togglePrivacyMatrix`
writes `state.privacyGroupOpen[pid] = null` on the way IN, beside
`_privacyStampOrder()`, because those two are one sentence — **the table opens
fresh**: the order is frozen at the same moment the accordion is emptied, and
neither is a fact that should survive a fold. It is still keyed per platform, so
Mac and Mac Full stay independent; they now simply both start closed. Verified:
open a group, collapse, re-expand → `privacyGroupOpen.macos` null, zero open
group rows, zero visible data rows.

**AND THE TRACKING WARNING IS A PILL BESIDE THE COUNT, NOT A BOX UNDER THE
TABLE.** Jaco: *"cuando selecciono algo que requiere tracking, salta un mensaje
verde de advertencia de apple, que ahora mismo se entierra en la parte baja de
la tabla de una forma fea. Ignora ese mensaje, o añádelo como un pill de
advertencia de una palabra al lado del 'X data types selected'."*

**IT WAS IN A PLACE THAT CANNOT BE SEEN.** The `.dist-tip-box` sat AFTER
`.pvt-scroll`, and that scroller is `flex: 1` in a modal that does not scroll —
so Apple's AppTrackingTransparency requirement lived below the bottom of a box
you cannot scroll past. A warning you have to close the thing it is about in
order to read is not a warning. The count badge is the one thing in this step
that is always on screen and always about the table, so the warning joins it.

**ONE WORD, AND THE SENTENCE IS THE TOOLTIP** — which is the test v6.67 wrote
when the cells LOST theirs: an anchor earns its place by naming something NOT on
screen. A cell's type and column are both printed; ATT is printed nowhere else,
so it keeps its full text and loses only the 300px of box it was reserving.
**AMBER, WHICH IS FORCED**: green done, amber *this needs you*, red wrong — this
is work waiting outside this app, which is amber's own sentence, and it was
drawn in `.dist-tip-box`'s GREEN, a contradiction in this palette.

**AND THE ROW'S THREE TEXTS SIT ON ONE BASELINE, WHICH TOOK TWO INDEPENDENT
FIXES.** Jaco: *"que la pill de data types selected y la de la advertencia se
dibujen de tal manera que el texto dentro de ellas esté alineado exactamente con
el de Show all data types."* Both are stated at their rules in style.css; the
short version, because the pair is the general lesson:

- **`align-items: center` centres MARGIN boxes**, so an item's border-box centre
  lands at `rowHeight / 2 + itsOwnMarginTop / 2`. The toggle's `margin-top: 4px`
  was therefore sinking its text 2px below two pills carrying none — half the
  margin, whatever the boxes measure. The 4 moved onto `.prv-matrix-header`,
  where it was always a statement about the row's distance from the section
  above. Nothing moves on screen: the row is 4 shorter and starts 4 lower.
- **Equal centres are still not equal baselines**, because a line box positions
  its glyphs by half-leading. The pills inherited the modal's 1.4 against the
  `<button>`'s UA `line-height: normal`, measured as exactly **0.453px** of
  drift — (15.4 − 14.5) / 2. Both pills state `normal` now, the value the thing
  they align to already uses.

Measured after: baseline delta **0.000** on both pills, box centres identical to
0.01, the toggle unmoved, and the two gaps **8 / 8** — the badge's own
`margin-left: 8px` went with it, since it was paying the row's `gap` twice and
left one row with two distances in it.

**THREE SMALL ONES ON THE TOGGLE ROW, AND THE SCOPE IS THE INTERESTING PART.**

- **QUICK SETUP IS `.form-label`, BECAUSE IT IS ONE.** Jaco: *"que 'quick
  setup…' tenga el mismo tamaño de font que 'privacy policy url'."* Those two
  sit one row apart doing the same job — a micro-label naming the control under
  it — and were **11 / 600 / .55** against **10 / 700 / .8**. The size is what
  he asked for; the other two come with it rather than as a liberty, because at
  10px uppercase 0.8 is the app's own tracking and 0.55 would leave one surface
  setting one object two ways at one size. The colour was already `--text-dim`
  on both, which is the tell they were meant to match.

  **And the first pass measured 0.5 with `.8px` written two lines above it**:
  the rule already carried a SECOND `letter-spacing: 0.05em` further down, which
  wins silently. That em was right at 11px (0.55) and follows the size DOWN —
  exactly what a relative unit is for and exactly what is wrong here, since this
  label is matching an absolute 0.8 rather than a proportion of itself. **A
  property declared twice in one rule is invisible to a grep for its value.**

- **THE TOGGLE TAKES THE WHOLE ROW.** Jaco: *"que el show data types / hide sea
  clicable en toda su horizontal."* It was **144.4px of a 757px row** — a
  control that opens and closes the entire table was the narrowest thing above
  it, with ~430px of dead row beside it looking exactly as pressable. Same
  complaint the cells answered (*"the frames are not the button, the well is"*).
  `flex: 1`, and **the label does not move**: the button is already a flex row
  at `flex-start`, so only the box grows — measured, the label on 299.5 in both
  states, hit area 144.4 → **508.6**.

  The cost is the 8px the v6.70 baseline pass tuned: the count badge and the
  tracking pill are pushed to the right edge, so toggle → badge is elastic while
  badge → pill stays 8. Stated rather than hidden, and it is the shape this row
  was heading for — the control left, what it reports right, the release block's
  own arrangement.

- **AND THE ROW'S COLUMN IS THE TABLE'S, NOT THE SCROLLER'S**, which only had to
  be said once the badges moved. `.pvt-scroll` reserves a 9px lane, so its box
  is 757 against the table's 748 and the pill ended 9.5px right of the last
  column it is talking about. `padding-right: var(--pvt-bar)` pays the lane
  back: measured, pill right **1028.5** = the table's, to the pixel.

- **5px BEFORE THE TABLE**, from 0 — the row ended and the header band began, so
  the control and the thing it controls read as one block with a rule through
  it. It goes on the HEADER beside v6.70's `margin-top: 4px`, so one rule states
  this row's distance from both neighbours, and it is paid in full because
  `.ios-subsection` is a flex column here. Cost: `.pvt-scroll` is `flex: 1`, so
  the table is 5px shorter rather than the modal taller.

**TWO OF THE THREE ARE ON SHARED `.prv-*` CLASSES, AND THE FIRST PASS SHIPPED
THEM UNSCOPED.** `.prv-matrix-header` and `.prv-expand-btn` are ALSO Google
Play's (render.js 17268–9) — the dialect the backlog is waiting to delete — so
the 5px, the full-width press and the lane pay-back all landed on a table with
eleven columns and an 11px body lane, where two of the three are simply wrong.
Both are `.ios-subsection:has(.pvt-scroll) …` now: the same structural test the
flex chain uses, naming the SURFACE rather than the route, so folding the table
away or arriving by the other door cannot miss it. `.prv-preset-heading` has one
consumer and needed no scope.

**AND THE PROBE SAID THE SCOPE HAD FAILED WHEN IT HAD NOT** — carry this one
alongside the coordinate-frame note. Measuring Google Play after the fix showed
it taking all three values. The cause was the harness: this session had injected
FIVE `style.css?fresh=` sheets while testing, and the older ones still carried
the unscoped rules, winning on source order. **A fresh-sheet injection is
cumulative, so every snapshot of the file is still live in the document.** Drop
all but the last before measuring anything you have just re-scoped. Verified
with one sheet: Google Play `margin-bottom: 0`, `padding-right: 0`,
`flex-grow: 0`, button **144.4** in a 680 modal; App Store 5 / 9 / 1 / **508.6**
in an 807 modal with the table 748 and zero horizontal scroll.

**AND THE GROUP HEADER NAMES WHAT IS INSIDE IT (v6.48).** Jaco: *"the user
might sometimes want to see all the data types they've flagged at a glance.
Maybe we can do this by showing flagged data types in each data type section
header, where you currently have the number of flagged data types shown in
blue. That way this info is available at a glance without accordioning."*

**IT IS THE BILL FOR ONE-AT-A-TIME, AND IT IS PAID ON THE ROW THAT IS ALREADY
DRAWN.** v6.52's argument is untouched and is what makes this table readable —
*"with several open the lighter ground marks four places and stops meaning you
are here"* — but the cost was that re-reading your own answer means opening four
blocks in turn. The count says a group is not empty; the names say what it
holds, and the sixteen headers are on screen either way.

**THE COUNT STAYS.** It is the one part that always fits: the list ellipsises
when a group holds more names than the row has room for, and a truncated list
with a number beside it still answers *how many*. Without it the truncation
would be lossy. Sentence case against the group name's uppercase, so one does
not read as a continuation of the other — 11px against 12.

**IT SHRINKS, IT DOES NOT PUSH.** `flex: 0 1 auto` + `min-width: 0` against the
spacer's `flex: 1`, so the chevron stays on one x across all sixteen rows, which
is what makes the closed table read as a list. Measured: chevron at **1029** on
every row, empty or full, clipped or not; group rows **37.8** and the table
**652.75** tall with the list drawn and with it `display: none` — zero layout,
as promised.

**ONE CHANNEL, TWO COLOURS — AND THE SECOND CHANNEL WAS BUILT AND CUT IN ONE
VERSION (v6.48 → v6.49).** Jaco, spitballing first: *"I wonder if we could do
something to colour coding to indicate… not linked and not tracked / linked to
identity / used for tracking / linked to identity AND used for tracking"* — and
then, looking at the built version: *"quizás podríamos hacerlo sin los
cuadraditos rellenos o no rellenos. Simplemente azul si no hay tracking,
amarillo si sí."*

v6.48 gave the two booleans two channels: tracking took the HUE and identity
took a 7px square — `.pvt-sq` shrunk, so the mark literally WAS the cell it
reported. That is a good argument for a mark that should not have been there,
and it is worth keeping the correction rather than the design.

**THE HEADER IS A GLANCE, AND FOUR STATES IS NOT ONE.** Decoding a hue plus a
fill on 11px type is reading, not glancing, and the thing you scan this row for
is the one fact with a consequence attached. **Identity is stated in its own
column** — a click away, four inches down — and nothing about it is work waiting
on you. So the header says the one thing the table cannot say at a glance and
stops there. Same shape as the calendar dropping the band's progress split
(*"a calendar already says where today is"*): **a second channel that restates
what the grid states for free is not a second fact, it is a second reading.**

- **TRACKING IS THE HUE, AND ITS COLOUR IS FORCED.** Green done, amber *this
  needs you*, red wrong — a tracked type is work waiting OUTSIDE this app (you
  must implement AppTrackingTransparency), which is amber's own sentence, and
  it is the exact `#FFB86B` the `.pvt-trk` pill took one version earlier for
  saying the same thing. One fact, one colour, two places.
- **AND THE BASE IS TEXT, NOT BLUE (v6.50) — the correction that makes the one
  hue work.** v6.49 painted an untracked name in `--pill-on-color`, on the
  argument that a declared type is a thing you confirmed. Jaco read it:
  *"¿las subcategorías deberían ponerse en amarillo si están tracked? Entiendo
  que queda muy confuso porque azul es la base."*

  **BLUE IS NOT A BASE, IT IS A MEANING**, and that is the flaw in one sentence.
  Blue against amber is two hues both making a claim, so neither reads as the
  ordinary case: the list says *these are different from each other* without
  saying which one is the news, and the eye has to be told the code before it
  can use it — exactly what a glance cannot afford. So the ordinary case takes
  no hue at all, which is the colour table's own line (*anything informational
  wears text colours*): a declared type's NAME is information, and that it is
  declared is already said by its being printed here and counted in the badge
  beside it. That leaves amber the ONLY colour in the list — **the mark is for
  what is outstanding**, arriving on this surface again.

  Three alphas of one white, so the row reads name → contents → punctuation and
  the amber cuts through all three: the group's own `--text-dim` (160), the
  names at `.52`, the commas at `.30`.
- **IDENTITY MOVES INTO THE TOOLTIP**, which is exactly the test v6.67 wrote
  when the cells lost theirs: an anchor earns its place by naming something NOT
  on screen, and with the group closed that is precisely what identity is.
- **AND AMBER FOLLOWS THE NAME INTO THE OPEN ROW (v6.51).** Jaco, looking at an
  open group: *"¿cómo te imaginas el USER ID y el DEVICE ID — blancos? ¿o Device
  ID naranja porque está trackeado?"*

  **THE HUE IS A PROPERTY OF THE TYPE, NOT OF THE VIEW.** A tracked type needs
  AppTrackingTransparency whether or not its group happens to be open, so amber
  closed and blue open would make the colour about the ACCORDION rather than
  about the data — and it would break the one thing a press should preserve:
  you open IDENTIFIERS and Device ID is still the same object, still marked.
  Same object changing state, never changing kind.

  **AND THE BASE DIFFERS BECAUSE THE TWO LISTS DIFFER, which is the part worth
  keeping.** In the group HEADER every name printed is declared by
  construction, so blue has nothing to contrast with and is decoration — white
  there. In a ROW the list is MIXED: two of your types beside thirteen you have
  said nothing about, and blue is exactly what separates them, which is why
  `tr.has-data td.pvt-ty` keeps it. That is this file's own green-on-the-pinned-
  nav argument (*"this list is MIXED — that is the entire point of the mark"*)
  against the submitted card's all-done list, arriving a third time. **One rule,
  two bases, and amber is the exception in both.**

**AND THE SEPARATOR IS A COMMA, NOT A GAP** — Jaco's, in the same breath: *"con
comas si quieres. Name, Email…"*. A 12px gap between coloured names read as a
row of chips; a comma says *list*, which is what it is. **The comma is NOT
inside the chip**: it belongs to the list rather than to either name beside it,
so it takes neither name's hue (`.pvt-gfc`, white `.34`). Left on
`currentColor` it would have been amber after a tracked type and blue after a
declared one — punctuation reporting a state it is not about.

**AND A DOTTED RULE SAID THERE WAS A TOOLTIP — FOR ONE VERSION (v6.51 → v6.54).**
Jaco: *"the user might not know that they can hover for the tooltips, since this
deviates from our established tooltip icon paradigm."* Right, and v6.51 caused
it: the `?` discs came off these eight headings under the rule *the name IS the
handle*.

The underline was the answer for a version, on the argument that **the removal
was not reversible**: the icon's real cost was HEIGHT, not width — it rode along
as one more wrapping token and pushed the header row to 61px — and it is what
bought "Personaliz." and "Functional.". So the mark had to cost nothing, and
`text-decoration` is the one that does. It was also the web's own word for this:
a dotted underline is what `<abbr title>` has meant forever, and these headings
ARE abbreviations.

**AND THAT ARGUMENT WAS WRONG ABOUT WHAT THE COST WAS ATTACHED TO.** The height
was never a fact about the ICON, it was a fact about the icon being **INLINE** —
it wrapped with the label because it was in flow with it. Out of flow it changes
no box in any engine, which is the identical guarantee `text-decoration` was
chosen for. With the only real advantage shared, the disc wins on the ground
Jaco raised first: **it is the app's own tooltip paradigm**, and a table that
invents a second way of saying *hover me* is a second vocabulary for one fact.

**IT COSTS NOTHING TWICE, in two pieces of space already being paid for.** Jaco:
*"un tooltip muy pequeño. En el caso del header, debajo de los títulos, y en el
caso de las subcategorías, quizás a su izquierda."*

- the `<th>` pays **bottom padding** it already had, and an 11px disc sits in it,
  under the second line and centred on the column. **Both numbers always move
  together**, because the clearance below the disc and the clearance above it
  come out of the same padding — moving `bottom` alone pushes its top edge into
  the label. 13 → 17 (Jaco: *"5px de espacio después de los tooltips"*) → **23**.

  **AND THE THIRD PASS IS WHERE THE ASYMMETRY GOT NAMED.** Jaco: *"separar un
  poco más los tooltips de los títulos de dato, y de la línea horizontal
  divisoria."* At **1 above and 5 below** the disc was touching the label's line
  box, so it read as a piece of the heading — a glyph hanging off the end of
  PERSONALIZ. — while the air below detached it from the rule it belongs beside.
  **The eye reads the smaller gap as the bond**, so the handle was attached to
  the one thing it is not part of and loose from the band it is meant to occupy.
  Neither figure was wrong; the difference between them was.

  **6 and 6** — `6 + 11 + 6 = 23`, written as the sum. Equal clearance is what
  makes it a BAND rather than an appendix: eight handles on one line, which is
  what `left: 50%` already makes them horizontally. Same move the Mac preview's
  metadata strip made at 8 → 14 (*"a band of objects needs air around the band
  rather than around the words"*). Cost, stated: the header row is **59**, up
  from 53 and from the 49 before the disc came back — ten pixels of a scroller
  whose argument is that sixteen groups fit on one screen, and the first thing
  to look at if a later pass needs rows back.
- a type name is indented **30px** under its group's 14, and that indent is the
  whole of what says a row hangs off the header above it. The disc goes at 13,
  inside it, so the handles form their own column on the group names' own x and
  the names still start on 30.

**It is `.tooltip-icon` ITSELF, resized** — same disc, fill, border, `?` and
hover as everywhere else in the app, so it cannot drift into a third dialect;
only the size and the position are local. **11px against the app's 15** (and
Content Rating's 16) because this is the densest surface in the product and a
handle must not outweigh the 10px label it belongs to — this table's own
recurring rule about a value being right at one size and wrong at another.

**`pointer-events: none`, because the whole CELL is the anchor.** v6.51's own
finding: an inline box's hover area is its glyphs, so the dead centre of a
two-line heading hits nothing. The disc is the SIGN that a tooltip exists, never
the target — which is what `app.js` has always assumed, resolving on
`closest('.tooltip-anchor')`.

**AND ONLY THE `<td>` GOT `position: relative` — GIVING IT TO THE `<th>` BROKE
THE HEADER, which is the trap worth carrying.** The first version set it on
both, to "give the disc a positioning context". Jaco, immediately: *"te has
cargado que DATA TYPE se descuelga con su propia barra y perdemos los títulos de
las categorías."*

**`position` is ONE property, and `relative` REPLACES `sticky`** — it does not
add a context to it. These headings are `position: sticky; top: 0` (that is what
keeps the column labels on screen while sixteen groups scroll under them), so
the later rule silently unstuck the eight that matched it. DATA TYPE is not a
`.tooltip-anchor` and so never matched, stayed pinned, and was left hanging over
the table on its own while its eight neighbours scrolled away — which is exactly
what he saw.

And nothing was needed there in the first place: **a sticky element IS a
positioned element**, so the disc's `absolute` already resolved against the cell.
The `<td>` is the only one that has to be told. Verified with the table scrolled
200: all nine `<th>` computing `sticky` and sharing ONE top, every heading on
screen, 13 discs, rows 36, table 748, zero horizontal scroll.

**The general form, and this file has now paid for it twice** (the Mac preview's
`width: 100%` shifts): before adding a property to a selector, check what that
property is ALREADY doing on those elements. A shorthand or a single-slot
property does not accumulate — it wins.

Measured: header row **49** with the discs and **49** without — the disc itself
costs nothing, which is the whole argument; the row is **53** today only because
the 5px gap above was asked for separately and paid for in padding. Data rows
**36**, table 748, modal 807, zero horizontal scroll — the numbers the underline
was chosen to protect, all still true. The 35 type names take a disc too (6px
clear of the name, inside the 30px indent); DATA TYPE does not, because it is
not an anchor.

**AND THE BLUE LEFT THE OPEN ROW (v6.54) — v6.50's ARGUMENT ARRIVING ONE LEVEL
DOWN.** Jaco: *"necesito que aclaremos si al final marcamos en azul las
subcategorías seleccionadas, o en blanco por defecto, y dejamos las no
seleccionadas en un gris más tibio."*

**The second.** v6.50 took the group header's names off blue because *"blue is
not a base, it is a meaning"* — blue against amber is two hues each making a
claim, so neither reads as the ordinary case and the eye has to be taught the
code before it can use it. Exactly those two hues were still sitting in the OPEN
ROW, so the table taught one vocabulary closed and another open.

**v6.51 kept the blue here on a real distinction that turns out not to decide
it.** Its argument was that a header's list is declared by construction while a
row's is MIXED — true, and it establishes only that the two have to be TOLD
APART, not that the difference must be a hue. **Value says it**: white against
`.42` is a bigger step than blue against grey ever was, and it leaves **amber the
only colour in the table**, which is what keeps this surface's standing rule —
*the mark is for what is outstanding* — true in both views at once.

**And the cells already say it in blue.** Every declared row carries its marks
eight columns to the right in `--pill-on-*`; painting the name the same blue is
one fact stated twice in one colour — the "two marks on one object" this file has
refused on the Submit row's border, the metadata strip's second rule and the
calendar's rings. Now the MARKS are blue and the NAMES are not, so the row reads
*what it is* on the left and *what you said* on the right.

`.34 → .42` on the undeclared name is the *"gris más tibio"*, and it is the half
that makes white legible as a state rather than as a weight: at the old `.70`
against a white declared name the two were four points apart in a list you scan
vertically. Measured: undeclared `rgba(255,255,255,.42)`, declared
`rgba(255,255,255,.88)`, tracked `#FFB86B` — and the group header's own three
alphas are untouched, so closed and open now say the same thing the same way.

**AND THE LIST IS FORCED ONTO ONE COLUMN (v6.52).** Jaco: *"¿debería estar
alineado forzoso la lista de nombres en el header? ¿Como para que todos
estuvieran alineados y se leyeran de arriba a abajo sin confusión?"* Measured
before: the three groups carrying a list started their names at **127.6 / 120.4
/ 113.2**, because each list began wherever its own group's name happened to
end. That is fine for one row read on its own and wrong for the thing this
column IS — sixteen rows read top to bottom, which at three different left edges
are sixteen separate lines rather than one list.

**THE SLOT WRAPS THE PAIR, NOT THE NAME.** This row's own rule two notes up says
*"the count sits right against it, where it reads as part of the same phrase"* —
so fixing the NAME's width would have put every count on a column of its own and
detached it from the phrase it belongs to. `.pvt-ghead` wraps name + count, the
count stays ragged-but-adjacent, and only the thing that has to align does.

**AND THE WIDTH IS THE CONTENT'S, IN `ch`.** The longest group name is
"Health & Fitness" / "Browsing History" at **16 characters**, and the face is
monospace — 1ch IS the character advance, so 16ch IS that name at any size, the
same reason `.rel-version`'s cap is written in `ch` rather than in the pixels it
currently equals. `calc(18ch + 10px)` is that name, the pair's own 10px gap and
2ch for a two-digit count: nothing can exceed it, which is what makes it exact
rather than approximately wide enough.

**`min-width`, NEVER a hard width**, and the failure mode is the reason. A longer
name pushes THAT ONE ROW's list out of column — visible, local, and obviously a
consequence of the name. A fixed width would truncate the group's own name
instead, which is the one thing on this row you cannot lose.

**AND THE COUNT WENT TO THE SLOT'S RIGHT EDGE, WHICH REVERSES THE RULE ABOVE
(v6.53).** Jaco, looking at it: *"¿debería ir el número a la izquierda de la
lista? ¿O sobra ahora el número?"* Two questions, and the second is answered by
measurement: with every type in every group selected, **User Content's list wants
673px and gets 517 — 156px clipped**, so the row shows four names and says six.
**The count is the only thing that survives truncation**, which is exactly what
the "THE COUNT STAYS" note above claims and this is the first time it has been
proved rather than asserted.

The first is a real move and it is now the better one. The count was glued to the
NAME on this row's original argument (*"it reads as part of the same phrase"*),
written when the slot was fluid — a number floating away from a short name looked
orphaned. **A fixed slot removes exactly that failure**: right-aligned, the
sixteen counts form their own column at 153.6, ten pixels left of the list at
163.6, and a column does not read as orphaned, it reads as a column. It is also
the more honest place, because **the number counts the LIST, not the name** — and
with the list truncating, the count and the thing it is counting for should be
adjacent. `justify-content: space-between` is the whole change; the 10px `gap`
survives as the floor, so a full-width name still cannot collide with its own
count.

It costs air: `BODY` is four characters and its count sits 110px right of it. A
column is air spent on purpose, and three aligned columns across sixteen rows are
what it buys.

**AND THE COUNT CAME BACK AGAINST THE NAME, IN PARENTHESES — WHICH THE GREY IS
WHAT ALLOWED.** Jaco: *"quizás el número no tendría por qué ir alineado a la
izquierda, sino justo después del título de categoría principal, entre
paréntesis?"*

The right-aligned column was a way of stopping a bare digit from reading as part
of the name, and **it stopped being needed the moment the count lost its blue**
(next note): with name and count in ONE register a gap between them says nothing
— it is two halves of the same phrase held apart, and on `BODY` it opened 110px
of dead air mid-row. **Punctuation states the separation directly and costs no
space**, which is exactly the trade the comma already made for the list: `NAME
(2) · contents` is one phrase and then its list, where three columns were three
things.

**The slot stays and so does the one list column** — that never depended on where
the count sat inside it, only on `.pvt-ghead` having a `min-width`. The number is
re-derived: 16ch for the longest name, the count, and the 6px between them.
**6px is a SPACE, not a gap**: at 12px mono the advance is ~7.2 and the brackets
carry their own side bearings, so a full one reads as a break.

What it gives up, stated rather than hidden: the sixteen counts no longer form a
column, so *how many in each* is no longer scannable vertically. The count's real
job — surviving the list's truncation, which is why v6.53 proved it earns its
place — is unchanged and does not need a column to do it.

**AND THE COUNT IS 3ch, NOT 4 — WHICH IS WHERE THE 10px CAME FROM.** Jaco:
*"¿podemos rascar algo de espacio a la izquierda para las subcategorías en los
headers, moverlas como 10px a la izquierda?"*

The slot had been reserving a BRACKETED TWO-DIGIT count, and **no group in
`IOS_DATA_TYPES` holds ten data types** — measured, the largest is User Content
with six. So the second digit was a column of air for a number Apple's own table
cannot produce: `(6)` is three characters and always will be. `calc(20ch + 6px)`
→ **`calc(19ch + 6px)`**, the slot 150 → **142.8**, and nothing that can actually
render is a pixel tighter than it was.

**The remaining ~3px would have to come out of something real, which is why they
do not.** The 6px is the space between a name and its count and the 16ch is the
guarantee that no name pushes its own list out of column — both load-bearing,
where the fourth character was not. **If a group ever gains a tenth type that is
the line to change**: a two-digit count would push that ONE row's list 7.2px
right, which is the visible, local failure `min-width` is chosen for rather than
the silent one a hard width gives.

Measured after: the worst pair that can exist — `HEALTH & FITNESS (6)` — is
115.2 + 6 + 21.6 = **142.8**, the slot to the decimal, so it is exact rather
than approximately wide enough. `.pvt-ghead` **142.8** on all sixteen, gap
**6.0**, **one** list x, chevron on one x, group rows 37.3 / 37.8, table 748 in
an 807 modal, zero horizontal scroll in either.

**AND A GROUP THAT HOLDS SOMETHING IS 500 — WEIGHT IS THE ONE CHANNEL LEFT.**
Jaco: *"¿marcar en medium weight las categorías que tengan algo
seleccionado?"*

**THIS FILE'S RULE IS "COLOUR IS THE EMPHASIS, WEIGHT ONLY RIDES ALONG", AND
WHAT STOPS IT DECIDING THIS IS THAT COLOUR ON THIS ROW IS ALREADY SPENT THREE
TIMES.** The group name's value carries empty-vs-declared (`.34` against
`--text-dim`), open-vs-not (white) and dimmed-vs-not (`.38` / `.20`). So the one
fact you scan this column FOR loses both arguments it is in: **open a group and
every name goes white, so the distinction vanishes at exactly the moment you are
working in the table**, and dimmed, `.38` against `.20` is a much smaller step
than `.63` against `.34` was. The fact never changed; the only thing reporting it
did.

**So weight is a property of the GROUP where colour is a property of the VIEW** —
v6.51's own sentence about the amber (*"the hue is a property of the TYPE, not of
the view"*) arriving one row up, and it is what makes this a second CHANNEL
rather than a second mark: orthogonal by construction, surviving open, closed and
dimmed unchanged, which is precisely what the colour cannot do. Measured: 500 at
rest, 500 white when open, 500 at `.38` when dimmed; 400 on all thirteen empty.

**And it costs no geometry, which is the other half.** The face is IBM Plex
**Mono**, so 400 and 500 share an advance — `.pvt-ghead`'s `min-width` is in `ch`
for that reason, and a monospace weight change cannot push one row's list out of
the column that note guarantees. 500 and not 600, because the eight headings are
500 and at 600 a 12px uppercase mono row stops reading as the same object set
firmer and starts reading as a heading over the fifteen beside it. **The count
goes with it** — `.pvt-gn` only exists on a declared group, so it is the name's
own register by construction and splitting the pair would undo the parentheses
that put them back together.

**AND THE COUNT LOST ITS BLUE (v6.49) — THE LAST HUE LEAVING THIS ROW.** Jaco:
*"el numero delante de los datos, debería ser blanco? no sé, o gris."*

**Grey, and it is the group name's own `--text-dim`.** The count has been
`--pill-on-color` since the day it was the only thing telling it apart from the
name it was glued to; the PARENTHESES do that work now, so the hue was free —
and the two changes are one, in both directions: the brackets are what let the
count come back against the name, and the grey is what made the brackets
readable as punctuation rather than as a second mark. v6.54 had just taken blue out
of the open row on the argument that *blue against amber is two claims and
neither reads as ordinary* — leaving one blue digit up here would have kept
exactly the contradiction that change removed, on the one row meant to be read at
a glance.

**White was the other offer and is wrong by this file's own rule: the mark is for
what is OUTSTANDING**, and a count is not outstanding. At full white it would be
the loudest thing on a row whose subject is the group's name.

`--text-dim` rather than a fourth alpha, because the count is a fact about the
GROUP (Identifiers has two) where the names are its contents. The row is now name
and count in one register, the list a step under at `.52`, the commas at `.30` —
three levels, and **amber the only colour left in the table**, closed and open
alike.

**AND THE DIM STATE HAD ITS OWN BLUE, which is the half a one-line edit would
have missed.** `.is-dim .pvt-gn` carried `rgba(0,154,255,.70)` — the chips
declare their own colour, so the row's dim cannot reach them and every one has to
be stated — and left alone it would have put the table's only remaining blue on
the FIFTEEN rows that are meant to be stepping back. It is the `td`'s own `.38`
now, so name and count are one register dimmed as well as at rest. **A colour
change is not done until every state of that selector is checked**, which this
file has now paid for on the cell fill and the separator alpha too.

**The OPEN row's count stays grey while its name goes white**, deliberately: the
name brightens to say *this is the one you are in*, and that is a locator, which
belongs on one thing. The count is the same number open or closed and has no news
to report.

Measured: the count `rgb(160,160,160)`, identical to the group name beside it,
`rgba(255,255,255,.38)` dimmed; zero blue anywhere on a group header row; the
count's right edge 10px off the list's left across all sixteen, `.pvt-ghead`
**139.6**, chevron on one x, group rows **37.3 / 37.8**, data rows **36**, table
**748** in an **807** modal, zero horizontal scroll in the modal or the table.

Measured at v6.53: **one** list x, **163.6**, across all sixteen (from 127.6 /
120.4 / 113.2), **one** count column at **153.6**, every `.pvt-ghead` **139.6**
wide, chevron still on **1029**, group rows 37.3 / 37.8, data rows 36, table 748
in an 807 modal, **zero** horizontal scroll.

Measured at v6.51: zero `.pvt-gfsq` in the document, header names reading white
`.52` and tracked ones `rgb(255,184,107)` with the commas at white `.30`, the
group names still `rgb(160)` and the count still the one blue thing on that row;
open, Identifiers draws User ID at `rgb(82,186,255)` and Device ID at
`rgb(255,184,107)` — the same amber it wears in the header three lines up — group rows 37.8 and header row 49 with the new marks and without,
chevron on 1029 across all sixteen, a clamped list clipping with the chevron and
the row height unmoved, data rows still 36, table 748 in an 807 modal with
**zero** horizontal scroll, the dim state stepping the chips back by colour, the
chip tooltips resolving through `closest('.tooltip-anchor')` with `cursor: help`,
and the v6.45 baseline fix still reading **0.000** on both header pills. Every
new rule is `.pvt`-scoped (checked against the CSSOM, not the file), so Google
Play's `.prv-*` table and Steam's Languages table cannot be reached — verified
680px modal, zero `.pvt`, zero underlined anchors.

### The Stash badge is POWERED BY over the mark (v6.44)

`buyElHTML` (web-page.js) and `.buy-brand*` (web-page.css). Jaco: *"que
pudieras poner el texto powered by encima del logo, y luego ajustar ese pack
para que coincidiese con el botón buy now."*

The mark alone said WHOSE it was and not what the relationship is, which is the
whole sentence: the button sells the game, the badge says who powers the
selling. **Two lines because "Powered by" is a label ABOUT the mark** — set
inline beside it, it reads as one wordmark that happens to open with two
English words.

**Two things it deliberately did not disturb, both of which were already
written for this.** The badge stays a plain inline-block SIBLING of `.buy`
rather than becoming a flex wrapper on `.buy-el` — that rule's own note says
the sibling arrangement is what keeps every alignment and anchoring expression
on `.el` applying unchanged — so the new wrapper goes INSIDE, around the badge
only, and `.buy-el` still holds exactly two children in the same order. And
`edges()` already unions EVERY child rather than measuring `firstElementChild`,
in its own words "however many pieces a box ends up with": the badge becoming a
stack is precisely the case that generalisation was for, so the aligners needed
no change either.

The label is the CTA's own register — IBM Plex Mono, uppercase, tracked —
because a second face on a badge beside a button set that way would read as a
third brand on the hero. **White at 55%, not a grey**: this sits on arbitrary
key art, and a fixed grey is a colour that happens to work over one screenshot.
It takes the mark's drop-shadow rather than inventing a text-shadow, so one
`--bs` lever still moves both.

**`text-indent: .14em` is the one line that looks like a fudge and is not.**
Letter-spacing is added to the RIGHT of the last letter too, so a centred line
sits visibly left of the mark under it; paying that back puts the two optical
centres on one axis. Measured: **0.00**.

23 and 10, down from 26 / 11 — *"un pelín más pequeño"* — and both move
together, keeping their ratio (2.3 against 2.36): the pack is one object, and
shrinking the mark alone would make the label the louder half of a badge whose
whole point is the mark. They are the only two numbers in the stack that are
not `calc(… * var(--bz))`.

Measured on the real page: logo **23 × 82**, label 10px and **82 wide** — the
same width, which is the tracking pay-back landing exactly — label centred on
the logo to **0.00** and 5px above it, the PACK centred on the button to
**1.6px** (the label's line-box asymmetry), 15.9 to the button, and `.buy-el`
still **51 tall**, the button's own height, so the stack costs no vertical
space and nothing else in the hero moved.

**One measurement trap, and it is the "One live page" backlog item biting for
real.** Two surfaces render `id="site"`, so `getElementById('site')` returned
the DETACHED one and every rect came back 0 while the badge was plainly on
screen. Select by geometry (`[...querySelectorAll('.buy-el')].find(n =>
n.getBoundingClientRect().width > 0)`) until that item is fixed. A cold load
also sits on the landing page: `state.activeView = 'broadcast'` by hand is not
enough, the preview only mounts through the real door (Get started → Marketing
→ Website).

### Game Details has to fit a small laptop

`--gi-desc-h` (style.css `:root`) and `.step-nav-btn`. Jaco: *"pensando en un
ordenador que no sea muy grande… que el description box sea un poco más bajo, de
forma que en un ordenador normal pueda ver sin scrollear el botón de
'Languages'."*

**THE BOX WAS 13.5 LINES AND ITS OWN MARKUP SAID FIVE.** 290px = 264 of text at
13px/1.5 plus 26 of chrome, while the `<textarea>` carries `rows="5"` and this
`min-height` has been overriding it for as long as both have existed. That is
the finding rather than the pixel count — nobody chose thirteen lines for a store
blurb, a round number got typed. So it takes **the markup's own number**, stated
in lines the way `--spp-desc-3` is on the Mac preview: `5 × 19.5 + 26` = 123.5.
Not a fresh guess; the contradiction closes instead of being replaced.

**TWO THINGS THE ARITHMETIC GOT WRONG, AND BOTH ONLY SHOWED IN A SMALL WINDOW.**
Seven lines were tried first, from `button bottom = 537 + height` measured in a
1318-wide pane — 699.5 against a 1280×800 laptop's ~700.

- **537 IS NOT A CONSTANT.** The notice above the field wraps one line further at
  1280, so the stack above is 302 and the real figure came back **715.3**. The
  thing being designed for is exactly the thing that moves the number: **measure
  the small window, never extrapolate from the big one.**
- **AND THE FOLD IS NOT THE VIEWPORT.** `.app-footer` is `position: fixed`, 46px
  tall, and the page reserves nothing for it — so the last 46px of EVERY view in
  this app is permanently covered and the real floor at vh 700 is **654**. A bug
  of its own, and the first place to go if this box is ever asked to shrink
  again.

Measured at a true 1280×700: box **123.5** (exactly 5 lines), button bottom
**677.3**. Clears a 13-inch Air (~790 of viewport, no wrap, footer top ~744) by
**83px** — the machine that was asked about — and still sits 23 behind the footer
on a 1280×800. That 23 is not in this token: `.step-nav-row` spends **46** on
`margin-top: 26` + `padding-top: 20` for one horizontal rule.

**AND IT IS 175 NOW (v6.62), WHICH SPENDS THAT WHOLE ARGUMENT.** Jaco, looking
at it: *"amplíame la altura de la descripción a 175px, que ahora está muy
enana."* Everything above is right about how the box is BUILT and was solving
for one number too few: it made "the Languages button fits without scrolling"
the entire brief, and five lines of a 4000-character store description is a slot
rather than a field.

**The cost is measured rather than waved at**: the button's bottom goes
**677.3 → 712** against a footer top of **654**, so 23px behind becomes 58. And
that puts the real bug back where this note already said it was — **46 of the 58
is `.step-nav-row`'s own margin plus padding**, spent on one horizontal rule, and
the rest is `.app-footer` being `position: fixed` with nothing reserving its
height. Fix either and 175 clears with room; shrinking this field again pays for
those two a third time.

**AND HALF OF THAT DEBT IS PAID — THE FOOTER RULE IS GONE (v6.64).** Jaco: *"veo
que hay 38px entre la última parte del content y una raya divisoria horizontal
abajo en cada card. Esa raya divisoria, ¿siempre tiene sentido? Pregunto, porque
no la tenemos en ningún sitio."*

Right on both counts, and the second is the argument rather than the spacing.
Measured, it was **the only footer rule left in the app** — 1px of
`rgb(42,42,42)` with 26 above and 21 below — on a surface that had already
dropped every other one it had: the step modal's header and footer borders
(v6.11), its section headers (*"a line said 'a group starts here' with a graphic
element… position says it more quietly"*), the Mac preview's metadata strip, the
Submit row's divider, the calendar's launch-day rule. Each came off for the same
sentence; this one had simply never been looked at.

**The `padding-top` is DELETED rather than kept as spacing**, which is the same
two-part removal the launch-day row made — *"both extras are deleted rather than
zeroed — the margin, and the `padding-top` the border needed"*. It existed to
hold the content off the rule, and `margin-top: 26` is already the distance.

So the paragraph above pays out: the button's bottom goes **712 → 691** against
the same 654, and **58px behind the footer becomes 37**. The other 46 is still
`.app-footer` being `position: fixed` with nothing reserving its height, and that
is now the whole of the remaining debt rather than half of it.

**The one thing it could have broken did not.** `_sizeLangSearchList` solves the
open picker against Basic Info, and its own note says both readings are PANE TO
PANE *"so the sub-nav, the step-nav row and the panel's padding cancel — the
card's chrome can move, the divider question included, without touching this"*.
Written before the divider went and verified after it: at 1280×700, Basic Info
**463**, Languages closed **286.39**, open **463.00** — delta **0.00**, with the
list at 131.61. That is what a derived number is for.

**175 is written as a literal, and the lines form is what it gives up.** It is
7.64 lines — `(175 − 26) / 19.5` — so the eighth is 64% visible, a sliced row
along the bottom edge. That is exactly what stating the height in LINES was
protecting against, and it is knowingly traded for the number he measured off
the screen. Eight clean lines is **182** and seven is **162.5**: if that slice
ever reads as a fault rather than as "there is more below", those are the two
numbers and the token goes back to `calc(n * 19.5px + 26px)`.

**AND THE ASSETS DROP WELL READS THE SAME TOKEN.** Jaco: *"que el cajetín de
dropwell de assets también mida 175, por consistencia."* Those are the two big
empty boxes of that form — one where you type the copy, one where you drop the
pictures — and on one screen a 118px well beside a 175px field reads as an
accident rather than as two different kinds of thing. It takes
`min-height: var(--gi-desc-h)` rather than a second 175, so the pair cannot
drift.

**Scoped to `#ob-screenshot-dropzone` by ID, deliberately.** `.asset-dropzone`
is also Steam's two (one already `-sm` at a smaller padding), the Website
builder's and every `pk-keyart-box--*`, which are sized by the ART THEY HOLD —
the class would have stretched all of them to 175. Same trap this file has
recorded three times: a value measured against one target, applied to the
selector that happened to be open. And it is `min-height` + `justify-content:
center` rather than more padding, because the padding is precisely what those
variants override. Measured: both boxes **175.0**, the well's three lines
centred with **51.7** of air above and below.

**AND THE ASSETS CARD WAS ASKED FOR A NUMBER, WHICH IS WHY THIS ENTRY LEADS
WITH A TABLE (v6.67).** Jaco: *"¿podríamos hacer que la card de assets midiera
576 en su máxima expansión, suponiendo 2 filas de previews de thumbnails?"*

**THE CARD IS THE PANE PLUS 115**, measured — `.sec-panel` against
`.gd-pane--assets`, the difference being the sub-tab rail, the Prev/Next row
and the panel's padding. Every figure below is the CARD, at a 850px panel.

**AND "2 FILAS" IS TWO DIFFERENT NUMBERS, which is the half the question could
not know.** The library groups by KIND (`_smLibraryHTML`, app.js) — Screenshot,
Key art, Logotype, Icon, Video — and each group is a label over its own row, so
a second line of THUMBNAILS and a second line of GROUPS are different events
with different costs:

| biblioteca | antes | **después** |
|---|---|---|
| vacía | 449.19 | **419.19** |
| una línea de grupos | 544.19 | **514.19** |
| un grupo que envuelve a 2 filas | 603.19 | **573.19** |
| dos líneas de grupos | 647.19 | **607.19** |

The realistic maximum is the LAST row, not the third: a project with
screenshots, key art and a logo already draws three groups, and four or more
wrap. So 576 was 27 short of the cheap reading and **71 short of the real one**,
and the two changes below buy 40 of that.

**WHAT THE 429 OF PANE WAS MADE OF**, since that is what any further ask has to
come out of: heading 18, guidance paragraph 37.2, dropwell **175**, library 77
(18 of label + 9 + 50 of thumbnail), YouTube row 58, and ~64 of margins. The
dropwell is `--gi-desc-h` and is deliberately tied to the description box
(above), so it is the one number here that cannot be spent locally.

**THE HEADING WENT, AND ASSETS WAS THE LAST PANE NAMING ITSELF TWICE.** Jaco:
*"quita la palabra assets."* Distribution and Languages lost theirs by request
already, so this was the one Game Details pane still printing the name of the
sub-tab that opened it, lit, two inches above. Worth **30** — 18 of line plus
`.ob-section-hdr`'s own `margin-bottom: 12`. The rail keys off the SECTION's id
(`ob-sec-screenshots`), never off the heading, so nothing else moved; and the
rule keeps one live consumer (Compliance Questions), so it is not dead.

What carries the pane's meaning now is the guidance paragraph under it, which
is the half that was doing the work anyway — the heading said *Assets* and the
paragraph says what the well does with what you drop in it.

**AND THE ROW GAP IS 16, WITH A FLOOR THAT IS NOT ZERO.** Jaco: *"juntar un
poquito las dos filas de thumbnails en vertical."* `.sm-wells` was `gap: 26px
30px`, both axes tuned as one pair back when it rarely wrapped.

**The floor is the gap INSIDE a group.** A group is a label over a row at 9px,
so the distance BETWEEN groups has to outrank that clearly or a second-line
label reads as a caption of the thumbnails above it rather than as the name of
the ones below. Measured down the range: 16 pays back 10, 12 pays 14, 8 pays 18
— and 8 is *smaller than the bond it has to beat*, so the column comes apart.
16 keeps the ~2:1 the original 26/9 had. **The COLUMN gap stays 30**: groups
side by side are told apart by horizontal air and nothing about that changed.

**576 IS REACHED IN ONE OF THE TWO READINGS AND NOT THE OTHER**, stated rather
than rounded away: a single group wrapping now measures **573.19**, 2.8 under
the number asked for; two lines of groups measures **607.19**, 31 over. The
remaining 31 exists and is priced — the guidance paragraph is 37.2 — but
removing it would leave the pane with no sentence at all, which is why it was
not taken.

**If the number has to be exact whatever the project holds, the lever is not
arithmetic** — it is `max-height: 576` on the card with the library scrolling
inside, because the count of groups is a property of the developer's folder and
no sum over it stays true.

One thing it reaches that was not asked for: the Website builder renders the
same `#sm-library` (render.js 8303), so its library takes the tighter gap too.
Same component, same argument; noted rather than scoped.

**AND THE CARD ANIMATES ITS HEIGHT, WHICH IS A MEASUREMENT TRAP.**
`.sec-panel` carries `transition: all`, so a read taken on the next
`requestAnimationFrame` after a change samples the CURVE, not the layout — a
sweep of six gap values came back **578 for every one of them**, including the
baseline, which reads exactly like a rule that is not applying. Settle 500ms
before measuring anything on this card. Same family as `.prv-box`'s `.12s`
transition lying about a hover, one surface over.

**AND 578 IS THE VALUE IT PASSES THROUGH, which is worse than a wrong number.**
A second sweep at 650ms still caught three of five cases mid-curve — same 578,
plus a dropwell reading **0** — so the settle is not a constant either: a
`renderDetails()` inside a chain of awaits queues work the next timer does not
wait for. **Measure one case per evaluation and read it TWICE**, 500ms apart,
and treat the pair agreeing as the test. Every figure below is stable across
700ms and 1200ms.

**AND THE WELL GIVES ITS ROOM UP ONLY WHEN THE LIBRARY WRAPS (v6.68).** Jaco:
*"solo cambiamos el pocillo si añado 2 líneas de assets, porque si no, se
mantiene en su tamaño."* — and the option he picked over killing the YouTube row
(70px, but `#ob-trailer-url` is the ONLY door to `formData.trailerUrl`, which
the press kit reads) and over cutting the description (which the well's shared
token would have dragged onto a second sub-tab).

| biblioteca | card | pocillo | contra Basic Info (578) |
|---|---|---|---|
| vacía | 419.19 | 175 | −158.81 |
| una línea de grupos | 514.19 | 175 | −63.81 |
| un grupo que envuelve | 573.19 | 175 | −4.81 |
| **dos líneas de grupos** | **577.99** | **145.8** | **−0.01** |

**IT IS CONDITIONAL, AND THAT IS BETTER THAN THE FLAT 144 THE ARITHMETIC
ASKED FOR.** An empty Assets tab has nothing to be tight for, so the well keeps
the 175 it was given for its own sake and **the second line buys its own space
out of the box directly above it**. The one case that needed the 31px is the
only one that pays it: a single group wrapping already measures 573.19 and is
left alone.

**AND THE TIGHT HEIGHT IS SOLVED AGAINST BASIC INFO, NOT TYPED (v6.72).** Jaco:
*"quiero que me claves la altura con respecto a la card de basic info en el caso
de doble fila, para que sea perfecto."* **576 was only ever a stand-in for that
card** — measured, Basic Info is **578** and the round 144 landed Assets on
576.19, so the two were 1.8 apart and the number he actually wanted was never
the one either of us could name. `--gi-drop-h-tight` is a starting value in the
CSS now and `_smDropwellSolve` (app.js) writes the real one.

**Same shape as `_sizeLangSearchList`, one pane over**, and for that function's
own reason: 578 is what Basic Info happens to be today and is a function of
`--gi-desc-h`, the title row and the platform grid — the kind of literal this
file has watched go stale three times. **Both readings are PANE TO PANE**, so
the sub-tab rail, the Prev/Next row and the panel's padding cancel: match the
panes and the cards match, with no arithmetic about the 115 of chrome anywhere
in the function.

**THE CORRECTION IS A DELTA, WHICH IS WHY IT CANNOT OSCILLATE.** It measures the
overshoot with the well at its CURRENT height and takes that off the well, so
`want = cur − (pane − target)` is invariant at any instant of the transition and
one pass converges by construction; the second pass finds 0 and writes nothing.
Measured: **577.99 against Basic Info's 578 — 0.01 apart**, stable across 900ms
and 1400ms, with the well at 145.8 and the root variable at `145.81px`.

**THREE BUGS ON THE WAY, AND ALL THREE REPORTED SUCCESS.** Worth keeping
together, because each one measured correctly and did nothing:

1. **It ran before the pane could be measured.** `renderAssetLibrary` fires
   inside the render that builds the pane, so the solve took an early out and
   nothing came back — the `ResizeObserver` only fires when `.sm-wells` changes
   and that had already happened. Calling the same function by hand one beat
   later wrote the right number. It is deferred to a `requestAnimationFrame`
   now, with one pending flag so a render plus an observer fire in the same tick
   solve once.
2. **It wrote onto a node that gets replaced.** `renderDetails` rebuilds the
   pane with innerHTML, so the dropzone is a **different element after every
   render** (verified: `dz === previous` is false) and an inline property went
   out with the old one. The solved value lives on the ROOT now, which also
   means a freshly built well inherits it on its first paint instead of flashing
   the CSS default and easing down to it.
3. **AND THE FLOOR LIED, WHICH IS THE ONE WORTH CARRYING.** `.asset-dropzone`
   carries `transition: all 0.2s`, so setting `min-height: 0` to measure the
   content does not resize the box — **it starts an animation**, and the rect
   read on the next line is that animation's first frame. The floor came back
   **175**, so `Math.max(floor, …)` clamped the answer to exactly the value the
   solve was trying to move away from: it "converged" on 175, the root variable
   looked like it was working, and the card sat 29px over Basic Info. The read
   is wrapped in `transition: none` now, restored with a flush.

   **Third time this file has been bitten by reading a property in the turn that
   set it** — `.prv-box`'s hover and this card's own animated height are the
   other two. The rule: if you are going to measure something you just wrote,
   take the transition off first, and put it back.

**The floor is real and does its job at the narrow end.** Measured with the
panel clamped to 430px: the library wraps, the solve asks for less than the
well's own three lines and is held at **140.79**, so the card overshoots Basic
Info rather than the well collapsing. Correct, visible, and not a case this card
is designed for.

**AND ALL OF THAT IS RETIRED — THE LIBRARY MOVED INSIDE THE WELL (v6.74).**
Jaco's own second version, offered against the conditional one and better:
*"el dropwell no cambia, simplemente los thumbnails reducen un poco de tamaño y
se incluyen dentro del dropwell, en su parte baja"*, then *"el pocillo debería
medir algo como 300 o 350px de altura mínimo."*

**IT REMOVES THE PROBLEM RATHER THAN TIMING THE FIX.** Every version above is
arithmetic on a pane that is an empty invitation PLUS a growing list — so the
card's height was a function of how many files you had, and `is-tight` was a
way of shrinking one box at exactly the moment the other appeared. Inside, the
library spends the well's OWN room: one box, and the card is the same height
with nothing in it as with a folder in it.

**334 IS HIS RANGE AND THE CARD'S NUMBER AT THE SAME TIME**, which is why it is
not a pick. The empty pane was 304.19 with a 175 well; swap the well for W and
drop the library's own 95px block and the card is `304.19 − 175 + W + 115`.
Basic Info is 578, so **W = 333.81** — inside the 300–350 he asked for, and the
value that clavas the card. `_smDropwellSolve` still writes the exact one, so it
survives `--gi-desc-h` moving; the 334 in the CSS is the starting value.

| biblioteca | card | pocillo | vs Basic Info |
|---|---|---|---|
| vacía | 577.99 | 333.81 | −0.01 |
| una línea de grupos | 577.99 | 333.81 | −0.01 |
| **dos líneas de grupos** | **577.99** | **333.81** | **−0.01** |
| un grupo, catorce miniaturas | 577.99 | 333.81 | −0.01 |

**AND IT CANNOT OVERFLOW AT THE REAL WIDTH, BY CONSTRUCTION RATHER THAN BY
LUCK.** `SM_KINDS` has **seven** kinds and that is the ceiling on groups — the
classifier cannot produce an eighth — and seven wrap to two lines on an 850px
panel, measured at **170** against the 285.8 of content the well holds. The
prompt gives way first (its box is 112.8 for 61.6 of ink, so ~51 of slack before
anything has to grow), which is what `.asset-dropzone-prompt` is for.

**`stopPropagation` ON THE LIBRARY IS LOAD-BEARING, NOT DEFENSIVE.** The well's
own `onclick` opens the file dialog, so without it every press on a thumbnail,
a group label or the air between them would ALSO open a file picker — a delete
button that asks you to upload something. Verified: a real click on a thumbnail
opens it **0** times, on a group label **0**, on the prompt **1**. The drop and
dragover handlers are deliberately left to bubble, because dropping a file onto
the thumbnails is still dropping it into the well.

**50 → 42 on the thumb, scoped to this dropzone.** Smaller because the box is
shared now; the max-width, the checkerboard and the absolutely-positioned × all
scale with it, so the height is the only number that moves. The Website builder
renders its own `#sm-library` with the same classes and is not inside a well —
hence the ID in the selector, this file's own recurring lesson about a value
measured against one target.

**`is-tight`, `--gi-drop-h-tight` and the line counting are DELETED**, not
switched off: with the library inside, the pane's height no longer depends on
how the folder wraps, so there is nothing to condition on. A rule that can never
fire is a mechanism waiting to be turned back on.

**THE ONE HONEST EDGE, MEASURED RATHER THAN HIDDEN:** clamp the panel to 560 and
seven groups wrap to FOUR lines (391 tall), so the well grows to 513.59 and the
card to 794.97 against Basic Info's 590 — **205 over**. `min-height` is doing
what it says, which is what he asked for. If the card has to be constant at any
width the lever is `overflow-y: auto` on `#sm-library` inside the well, not a
smaller number.

**AND THE GROUP COUNT IS IN PARENTHESES, NOT AFTER A MIDDOT.** Jaco: *"en vez de
un punto separando la descripción (screenshots · 2) que esté justo después entre
paréntesis."* A middot is a **separator** — it holds two things apart and says
they are peers, so `SCREENSHOTS · 2` read as a list of two facts rather than as
one label carrying its own count. Brackets say the number belongs to the word,
and they cost no space to say it.

**The privacy table made this exact move for the same reason** (see "AND THE
COUNT CAME BACK AGAINST THE NAME, IN PARENTHESES"), so this is the app agreeing
with itself rather than a second idea — one plain space, because the brackets
carry their own side bearings and a wider gap re-opens the hole the middot left.
Still only past one: a group of one screenshot saying "(1)" is a count with
nothing to count against. Measured: `Screenshot (5)`, zero middots in the
library, card still **577.99**.

**AND THE GUIDANCE NAMES WHAT YOU ARE DROPPING.** Jaco: *"quítame el 'drop
everything here' — 'Drop your assets here'."* That opening was written when the
well's whole argument was that it takes any file at all, so it said something
about the TOOL rather than about your folder: *everything* is the classifier
boasting. **"Drop your assets here" names the thing in your hands, and the
sentence after it still does the boasting**, which is where it belongs. One key
in `en.json` — `render.js` reads it through `t()` with no inline fallback, so
there was no second place to update.

**AND THE LIST WENT WITH IT** — *"— screenshots, app icons, key art, logos and
video"*, Jaco's second pass. It was the SAME BOAST one clause further on: an
inventory of file types is the classifier showing its work, and it arrives
before the sentence that explains why any of it matters. **It is also answered
by the well itself**, which prints exactly those kinds back as group labels the
moment you drop anything — so the paragraph was naming the categories and the
library was naming them again, ten pixels apart, one of them hypothetical.
*"Drop your assets here."* and then the whole of the promise.

**zh-CN moves with it** rather than being left listing 截图、应用图标、主视觉图…
under an English line that no longer does: the key is one sentence and two
locales, and a locale that says more than the original is the same drift as one
that says less. `把素材拖到这里。` It costs no layout — the paragraph was two
lines and still is, **37.2**, so the card holds at 577.99.

**THE PAIR IS UNTIED, AND RE-READING THE OLD NOTE IS WHAT ALLOWED IT.** The
well read `--gi-desc-h` so *"the pair cannot drift"*, on the argument that
*"read on one screen a 118px well beside a 175px field looks like an
accident"*. Measured: **they are never on one screen.** The description is in
`.gd-pane--gamedetails` and the well in `.gd-pane--assets` — two sub-tabs of
one card that cannot both be shown. So the shared token bought a consistency
ACROSS A TAB SWITCH, not an adjacency, which is a far cheaper thing to spend.
`--gi-drop-h` starts at the same 175; only the TIGHT value is its own.

**AND CSS CANNOT COUNT WRAPPED FLEX LINES, so `_smDropwellFit` (app.js) does.**
`:has()` can ask what exists, not how it landed — and the number of GROUPS does
not predict the number of LINES either, since a Screenshot group with five
thumbs is ~480 wide against a lone Icon's ~89. It counts distinct `offsetTop`s
(siblings, so they share an offsetParent and the comparison needs no origin)
and toggles `is-tight`.

- **It cannot feed back on itself**, which is what makes the observer safe:
  the class changes the well's HEIGHT, the well is a sibling ABOVE the library,
  and wrapping is decided by WIDTH alone. Nothing it writes can change what it
  just measured.
- **The `ResizeObserver` is what covers a WINDOW RESIZE** — the case a render
  hook alone misses entirely: nothing re-renders, the row rewraps, and the card
  would keep a height solved for the other count. Verified with no render at
  all: narrowing the panel to 430 took it to two lines, `is-tight`, 144, and
  widening it back returned 175.
- **Re-armed only when the NODE changed.** `#sm-library` is rebuilt with
  innerHTML (the `_smModalFades` contract), so the watched node is replaced —
  but a `ResizeObserver` fires once on `observe()`, so re-arming inside its own
  callback calls itself forever. The node guard is the whole of that.

One honest edge, measured rather than hidden: below ~350px of panel the well
reads **156.2** rather than 144, because its own three lines wrap and the
CONTENT is taller than the floor. Correct — `min-height` stops being what
decides — and not a case this card is designed for.

**AND THE THUMBNAIL × SPEAKS IN THE APP'S BUBBLE (v6.68).** Jaco: *"al hoverear
sobre la X de thumbnails, ponme el tooltip de hold to delete."* It carried a
bare `title`, so the one control in the library whose whole problem is that
nobody can guess the gesture was also the slowest hint in it — v6.71's finding
arriving on the surface it had not swept.

`data-tip` rather than `.tooltip-anchor`, for that entry's own reason: **the
attribute is the tooltip and the class is only layout**, and this is a 20px
absolutely-positioned button that must not take `position: relative`.

**DELETE, NOT REMOVE, and both strings say it.** `smRemove` drops the record
and every slot referencing it with no undo behind it — which is why the gesture
is a hold in the first place — so the quieter verb was the one place this
control understated what it does. The `aria-label` keeps the file's name
because the accessible name has to say WHICH thumbnail; the bubble does not,
since it is drawn on the picture.

Measured with a real hover: `data-tip` present, `title` gone, bubble reading
**Hold to delete** at 126.8 wide (shrink-wrapped, v6.72's rule) and centred on
the button to **0.1px**.

**AND IT BECOMES A REPORT WHILE THE BAR RUNS (v6.81).** Jaco: *"se podría
actualizar el tooltip cuando estoy borrando a Deleting…"* A hint is normally a
constant, because a control means one thing and says it — **a HOLD is the
exception**: "Hold to delete" is an INSTRUCTION until you start and a
description of nothing once you have. Printing an instruction you are already
following is the shape this file refuses one face over (the locked Submit row
naming a gesture for a shut door).

**It is written onto the BUTTON's own `data-tip`, not pushed into the bubble**,
so the hint still lives in exactly one place: an ordinary hover a second later
reads the same attribute and gets the same answer, and no caller can put a word
on screen the control does not also carry. `smTipRefresh(anchor)` then redraws
the open bubble FROM that anchor — which is what stops it becoming a second
`smTipAt`, and it re-runs the whole of `showTip`, so the box is **re-measured**:
the bubble shrink-wraps (v6.72), and 127 → 91 has to move the box or it drifts
off the 20px button it points at. Silent when nothing is on screen, because a
hold can start with no hover behind it and a tooltip nobody asked for would be
labelling a gesture rather than a control.

**AND THE BUBBLE HAS TO BE TAKEN DOWN BY HAND WHEN THE HOLD COMPLETES.**
`renderAssetLibrary` replaces the button, so `mouseout` never fires on it —
without `hideGlobalTip()` the word "Deleting…" is left floating over a
thumbnail that no longer exists until the pointer happens to cross another
anchor. The one case on this surface where a hover tooltip ends by something
other than the pointer leaving.

Measured: hover **Hold to delete** at 127 wide, centred on the button to
**0.00**; pointerdown → **Deleting…** at 91, still `g-tip--danger`, still
centred to **0.00**, the thumb `is-arming`; release → the attribute and the
bubble both back to *Hold to delete*; a completed hold → one asset gone, the
bubble hidden, card still **577.99**.

**AND THE WELL'S BOTTOM PADDING IS ITS SIDE PADDING.** Jaco: *"baja los
thumbnails para igualar su padding izquierda y abajo."* `.asset-dropzone` is
authored `24px 20px`, which was right for a box holding three centred lines:
the top and bottom were air around a paragraph and **nothing had ever touched
the sides**. With the library inside, the bottom-left corner has a thumbnail
against both edges — measured **left 21.5, bottom 25.5** — and 4px of
difference in the one corner the eye reads as a box sitting crooked in itself.

`padding-bottom: 20px`, which is the side padding rather than a new number, so
it is exact rather than "about 5". The top keeps its 24 and nothing notices:
the prompt is `flex: 1` and centres in whatever is left, so it moves 2px, and
`_smDropwellSolve` re-solves against Basic Info either way. Measured:
**21.50 / 21.50** on the thumbnails' left and bottom, labels on the same 21.5,
card **577.99**, well **333.8**.

**AND THE WHOLE GESTURE IS THE CANCEL HOLD'S RED (v6.73).** Jaco: *"para borrar,
coge el mismo color rojito de 'cancelling submission' de las platform cards. Y
que el hover tooltip también tenga el mismo estilo exacto."* Measured, this
control was drawn in **`rgba(220,60,60)` and `rgba(214,54,54)` — a red that
appears nowhere else in the app**, invented here because this was the first
destructive hold built after the card's. The two are the same idea (press and
hold to destroy, let go to undo) in two colours, and the card's is the one with
a vocabulary behind it: the sweep, the CANCELING SUBMISSION line and the card's
own edge all carry `#ff3b78`.

All three go to it — the ×'s hover and armed fills and the thumbnail's burn bar
— and the bubble takes `data-tip-tone="danger"`, the same attribute the withdraw
button uses, so a control and its own hint are one colour rather than two. **The
burn keeps its `.55` against the card sweep's `.22`**: that bar crosses a 400px
card and this one covers a 50px thumbnail sitting on a photograph, so the alpha
is what makes it read. One hue, two sizes.

Measured: hover `rgba(255,59,120,.9)`, armed `.95`, burn `.55`; the bubble
`rgba(255,59,120,.14)` over `rgb(28,28,28)` with a `.32` border and
`rgba(255,105,150,.96)` ink — identical to the withdraw hint's — and the tone
class gone on the next anchor.

**Still on `title`: the seven THUMBNAILS themselves** (`name · w×h`). Left
deliberately and worth deciding rather than sweeping — converting them would
fire an instant bubble on every pass of the pointer across the library, which
is exactly the noise the privacy table's cell tooltips were removed for in
v6.67. The × earns one because it names a GESTURE; a thumbnail's is a caption.

**AND THE TWO LANGUAGE LABELS GAINED THEIR NOUN.** Jaco: *"en languages, cambia
primary por primary language y supported por supported languages."* One key
each in `en.json` and nothing else — `render.js` reads them through `t()` with
no inline fallback, so there was no second place to update. Worth noting that
**zh-CN already said 主要语言 / 支持语言** — *primary language*, *supported
languages* — so English was the one locale still printing the bare adjective.
Measured: both labels one line at 18px, no wrap.

**THE FOUR SUB-TABS ARE ONE CARD, SO OPENING THE LANGUAGE SEARCH STOPS AT BASIC
INFO'S HEIGHT (v6.63).** Jaco: *"coge la altura de la card de basic info y que
en languages, si doy al +, al expandirse el cajetín, la card ocupe en total los
mismos px de alto."* Measured, the expanded pane was **511.4 against Basic
Info's 463** — the card grew past the tallest thing it had ever been, for a list
whose max-height (180) was a round number nobody had solved against anything.

**THE NUMBER IS SOLVED AT THE PRESS, NEVER TYPED** (`_sizeLangSearchList`,
app.js), and both halves of that are the point:

- **The target is MEASURED, not a literal.** 463 is what Basic Info happens to
  be today and is a function of `--gi-desc-h` (175), the title row and the
  platform grid — exactly the shape of value this file has watched go stale
  three times. `_gdPaneHeight('gamedetails')` reads the real pane instead.
- **The room is measured too**, by collapsing the list to zero and reading what
  is left, so no arithmetic about the wrap's 8px margin, its two borders or its
  27px input appears anywhere. Change any of them and this still lands.
- **Both readings are PANE TO PANE**, so the sub-nav, the step-nav row and the
  panel's padding cancel. The card's chrome can move — the divider question
  below included — without touching this.
- **Sub-pixel**, deliberately: `Math.round` put the card 0.4px over, and
  rounding here is rounding the card.

**A HIDDEN PANE MEASURES 0, WHICH IS THE ONE MECHANISM WORTH READING.**
`renderDetails` renders all three panes every time and CSS shows one with
`display: none`, so the pane you need is in the DOM and has no box.
`_gdPaneHeight` lays it out for one frame **out of flow and invisible**
(`position: absolute; visibility: hidden`) with its width stated explicitly —
width is the only thing an absolutely positioned box would otherwise get wrong
and the only input the height depends on. Nothing on screen moves, nothing
flashes, and the style attribute is removed rather than left empty.

Measured at v6.68: Basic Info **599**, Languages closed **422.39**, open
**599.00** — delta **0.00** — on first open, on reopen, and after clearing a
filter; the list lands at **131.61** and still scrolls (640 of content); and
Distribution (717.09) and Assets (488.78) are untouched. Note Basic Info is NOT
the tallest sub-tab — Distribution is — so this matches the pane he named, not
a maximum.

**ARROWS AND ENTER IN THE LANGUAGE SEARCH (v6.63).** Jaco: *"si estoy buscando
idiomas y toco las teclas, deberías dejarme bajar y subir por si quisiera
seleccionar con flechas + enter también."* `langSearchKey` (app.js).

**It adds a POINTER to a row, not a second way of choosing.** The list is
already a column of real `<button>`s, so Enter calls `.click()` on the active
one rather than re-implementing `addLangFromSearch` — the two doors cannot
drift, and selecting still closes the picker exactly as a click always has.

- **Nothing is active until you press an arrow.** Every keystroke rebuilds the
  list, so a surviving highlight would point at whichever row lands in that slot
  next; and a pre-lit first row turns a bare Enter into a language you never
  looked at. From nothing, Down takes the first and Up the last — the two ends
  you are reaching for — and it wraps from then on.
- **The highlight is the HOVER's own paint** (`.lang-search-item.is-active`,
  `--panel-3`), because it answers the same question the pointer does. NOT the
  selection blue, which on this row already means *that language is in your
  set*; the rule is declared before `.is-on` so an already-selected row keeps
  its blue label and only gains the fill.
- **The reveal is scrolled BY HAND on the one box that scrolls.**
  `scrollIntoView` picks its own scroller and this list sits inside the modal's
  and the page's — "The travel is ours, not the browser's" one surface over.
  There is nothing to animate: the row is one line away.
- **In RECTS, not `offsetTop`.** This list is not positioned, so its rows'
  offsetParent is `.ob-q` two boxes up: the first version wrapped to the top and
  left the scroller at **146**. A rect difference assumes nothing about which
  ancestor the numbers are relative to.

Verified with real key events: Down/Up walk and wrap (0 → 19 → 0), the scroller
follows and clamps (0 at the top, 509 against a 508 maximum at the bottom),
typing clears the highlight, Enter with nothing aimed is a no-op, and Enter on
an aimed row writes `pl`, draws the Polish chip and closes the picker. Escape
closes it too and the card returns to 422.39.

**AND THE TIP MOVED UNDER PRIMARY LANGUAGE (v6.63).** Jaco: *"cambiame el orden
del tip de languages, ponlo debajo de primary language en vez de encima."* It
opened the sub-tab, which made it read as a preamble to the page — and what it
is about is SUPPORTED languages, shipping more of them. Between the two fields
it is the sentence that explains the question underneath it.

**It costs no height**: the 60.4px box and its own 16px gap moved as one piece
and the 36px `.ob-q` margin above it was already there, so the closed pane
measures 422.39 before and after. The asymmetry is the point — **36 above, 16
below** — because the smaller gap is what binds it to the field it is talking
about. It now lives in `buildObLangList` rather than in the section, so
`updateObLangListWrap` repaints it with the picker.

**AND PREV / NEXT ARE THE MODAL'S FOOTER BUTTON — WHICH DISSOLVES THE COLOUR
QUESTION RATHER THAN ANSWERING IT.** Jaco: *"deberían tener el mismo formato que
los botones de los modales, con stroke gradientado y el fill transparente. Tengo
duda también sobre si deberían ser morados o verdes."*

**Neither, and the colour table is why.** Green is DONE — it marks one finished
thing against others that are not, and a Next button has finished nothing.
Violet PROPOSES (Improve's) and is separately the guide's own hue. Amber is *this
needs you*, red is *wrong*. What is left is the table's last line — *anything
informational wears text colours* — and "go to the next sub-tab" is exactly that.
Which is the same answer the first half of his sentence already gives: the thing
he asked to copy, `.submit-modal-footer .imp-cta`, is the most-pressed action in
the app and carries **no hue at all**.

**It was already the same box**, which is what makes this four values rather than
a restyle: both are IBM Plex Mono 13px at `padding: 10px 18px` with a 1px border,
39 against 38 tall. Only the fill, ring, radius and weight differed — violet 14%
on a violet-32% border at radius 10 and 700, against white 12% on a transparent
border at 8 and 500. **The stroke is JOINED, not copied**: `.step-nav-btn::after`
is added to `.imp-cta::after`'s rule, the shared `::after` list's own argument one
door along.

**`.step-nav-finish` keeps its violet and is the one real exception.** Prev and
Next move between four sub-tabs of the page you are on; **Submission LEAVES Game
Details** for another top-level tab, and that is the one thing violet already
means outside Improve — the calendar lede's `.gcal-lede-go` and the submitted
card's Marketing nudge are both "a link that goes somewhere else" in this same
violet. It stays SOLID (the Release button's argument: a filled fill is this
app's shape for a call to action) and therefore **drops the ring** — a solid CTA
carries no lit edge anywhere here, and left on, that white gradient would paint
over a violet fill: a second mark on the loudest box in the row.

Measured: Prev/Next `rgba(255,255,255,.12)` on a transparent border at radius 8,
13/500, with the ring at `inset: -1px`, `padding: 1px`, the white `.40 → .12`
gradient and `mask-composite: exclude` — identical to `.imp-cta`'s; Submission
`rgb(159,104,240)` solid with its `::after` at `display: none`.

**One probe note.** The first check reported `content: normal` and no gradient —
the helper was `cs = e => getComputedStyle(e)` and the call was `cs(e,'::after')`,
so the second argument was silently dropped and the ELEMENT was measured. The
CSSOM had both selectors all along. **A one-argument helper does not warn you
about the argument it ignores**; read a pseudo with `getComputedStyle(el,
'::after')` directly.

**A VIOLET HOVER RING WAS ADDED AND REVERTED IN THE SAME SESSION, AND THE
MISTAKE IS THE ONLY REASON THIS PARAGRAPH EXISTS.** Jaco: *"necesito que
checkees que se marca el stroke en morado al hacer hover."*

**That is a request to VERIFY, and it was answered by BUILDING.** Checked
against the CSSOM, the answer was no: `.step-nav-btn:hover` changed the fill and
nothing touched `::after`. The correct reply was that one sentence. Instead a
`.step-nav-btn:hover::after` in `rgba(184,148,246,.45)` was written, and then
three paragraphs were written to justify it — a hover is about the pointer, not
the object; the value is borrowed from Apply Fix; only the ring moves. Every one
of those is true and none of them was asked for.

**And the justification walked straight past the thing it was standing on.**
Jaco: *"si en el modal el botón no tiene stroke morado, ¿por qué carajo lo has
añadido en game details?"* The entry directly above exists because these two
buttons are ONE OBJECT — the whole change was "take the modal's footer button,
whole". A hover the modal does not have is not a refinement of that, it is the
end of it: two controls in one role that now behave differently the moment you
go near them, which is the exact failure the copy was made to remove.

**So `.step-nav-btn:hover::after` is deleted, not softened**, and the CSS carries
a note saying the absence is deliberate — or the next person reads a bare
`:hover` rule as an oversight and fills it in again.

**The rule this leaves, and it is about conduct rather than colour: when the ask
is "check whether X", the deliverable is the measurement.** If X turns out to be
false and building it looks right, that is a SEPARATE proposal and it gets
offered in a sentence, not shipped inside the verification. A wrong answer is
cheap to correct; an unrequested change dressed in three paragraphs of rationale
costs two rounds and makes the file argue with itself.

Measured after the revert: both Prev/Next and the modal's footer button hover to
a white `.17` fill with the white `.40 → .12` ring untouched — one behaviour,
two places. Submission still `rgb(159,104,240)` solid with its `::after` at
`display: none`, and all of them still 39 tall.

### The import note lives in the Description's label row

`_giImportNote()` (render.js), `_giRenderImportNote()` (app.js),
`.gi-import-note` (style.css). Jaco: *"el 'Imported from Steam, Google Play etc',
con el checkmark en description, no debería mover ni el cajetín de descripción,
ni las plataformas ni cambiar el tamaño. Necesitamos encontrarle un sitio mejor,
quizás a la derecha de 'DESCRIPTION'… o a la izquierda del contador de 0/4000."*

**IT WAS A BLOCK BETWEEN TWO FIELDS, SO IT COULD ONLY EVER PUSH.**
`#ob-scenario-wrap` sits in the flow between Title and Description and held all
four of the search widget's states; the confirmed one drew a 12px line with a
10px top margin. So pressing *That's it!* moved the description box, the platform
grid and everything below them — **in the same paint that filled them in**. The
three things you had just asked for all jumped at once, which is why it reads as
a fault rather than as a result.

**THE FIX IS NOT A SMALLER NOTE, IT IS A SLOT THAT IS ALREADY PAID FOR.**
`.ob-form .gi-head` — the row a label shares with its character counter — is a
hard `height: 18px`. Anything put in it costs **zero layout by construction**, in
every state, with no number tuned and nothing to re-measure when the copy changes
or is translated. That guarantee is the whole reason the note moved here rather
than being shrunk where it was.

**IT SITS 10px AFTER THE LABEL, AND THE FIRST PASS PUT IT IN THE OTHER PLACE.**
Two homes were offered — right of DESCRIPTION, or left of the 0/4000 — and it
went left of the counter first, on the argument that both are meta and should
group flush right. Jaco: *"quiero que pongas el imported from Steam / Google Play
a la derecha de description."*

**That argument was right about the REGISTER and wrong about what the note is
attached to.** It says where this description came from, so it belongs to the
word DESCRIPTION; the counter measures what is in the box and is about the text,
not about its provenance. Grouping them put a fact about the FIELD at the far
end of the row from the field's own name.

The register stays the counter's — 11px mono, the same `#5A615D`, one value
rather than a near-miss — because register says what KIND of thing this is, not
where it sits. Against a 10px/700 uppercase label nothing here competes, so it
reads as a note beside a heading rather than as a second heading.

**And the move DELETED rules rather than swapping them.** The first version had
to take `margin-left: auto` off the counter and onto the note, because two auto
margins SPLIT the free space and park the note mid-row — which needed a
`:has(.gi-import-note)` override so no other `.gi-head` was touched. After the
labelside: the counter keeps the auto it has always had, the note is a plain
10px margin, and the `:has()` is gone. **The better position is the one that
needs no exception.**

**The tail is cut, and that is the point of the move rather than a casualty of
it.** It used to end *"— description and platforms filled in"*: a sentence
describing the two things you can see, since the box below now has text in it and
the platform tiles are lit. This file has refused that shape repeatedly. What is
left is the one fact nothing else on screen carries — WHICH stores it came from —
and the full sentence survives as the `title`.

**AND THE CHECK IS GONE.** It shipped at 9px on the argument that green is done
and an import that happened is done. Jaco: *"quizás sin checkmark verde."* Right:
green in this app is a claim about a STEP YOU FINISHED, and nobody finished this
— it is something that happened, already stated in words by the sentence beside
it. The mark also made the note a two-part object wanting its own alignment, gap
and shrink rule, next to a label that is one run of text. One span now, and the
only thing that can give way in a short row is the tail of the store list.

**AND THE `g` OF GOOGLE PLAY WAS BEING CUT OFF — `line-height` COPIED FROM A
SIBLING WITH NO DESCENDERS.** Jaco: *"se corta la g de Google Play."*

`overflow: hidden` is what the ellipsis needs, and it clips to the **content
box** — which at `line-height: 1` is exactly the font size, 11px, for a face
whose ascender-to-descender measures **14.5**. So every descender lost its tail.

**The value came from `.char-count`, and that is what made it look safe.** That
element really does sit at `line-height: 1` and always will be fine, because
"175/4000" is digits and a slash: no glyph in it ever reaches below the baseline.
Taking its register was right; taking its line-height was borrowing a number
whose correctness depended on a property of its CONTENT.

It is `18px` — the ROW's own height — so the line box can never be shorter than
what it has to hold, at any string in any language. It costs no layout, because
`.gi-head` is a hard 18 and this is a flex item inside it: measured, the ink is
14.5 in an 18px box with 1.5 clear above and 2 below, and the description box
and the platform grid have not moved.

**The general form: a `line-height` under `overflow: hidden` is a clipping
decision, not a rhythm one.** Copy a sibling's register freely; re-derive its
line-height from the box.

**The slot is emitted empty rather than inserted on confirm**, so confirming is a
write into an element that already exists. `_giRenderImportNote` is called from
inside `_renderScenarioSection` rather than beside it at each call site — the
widget and the note are two halves of one fact, and a second repaint someone has
to remember is the inventory problem this file keeps paying for.

Measured with the note present and absent, at the same scroll: description box
top, platform grid top, the head's 18px, the label's x, the counter's right edge
and the whole form's height are **identical to 0.00 in both**. Confirming now
collapses `#ob-scenario-wrap` to 0 — the result card going away, which is
correct: you pressed the button, the card has done its job. Note 11px mono
`rgb(90,97,93)`, 10px clear of the counter, counter still flush right.

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

Current version: **v6.49** → next is **v6.50**, then **v6.51**, etc. (v6.29 –
v6.31 are Mark's Distribution work, and **v6.42 and v6.48 are Adam's** —
shipped in parallel and touching none of this.)

**AND THE LIVE NUMBER CAN BE READ WITHOUT GIT — FETCH THE PAGE.** Everything
above agonises over Claude not being able to see `origin/main`, and the whole
skip-if-unsure rule exists because of that blindness. It is a blindness about
the REPO, and the question was never about the repo: *what is live* is answered
by the live site, which prints its own version in the footer badge and stamps it
on fourteen `?v=` params. `https://mtgrimm17.github.io/shipmate-prototype/`
(remote read out of `.git/config`, which is a file rather than a command) says
it in one fetch.

**It is also a BETTER answer than `origin/main` would have been**, which is the
part worth keeping. `origin/main` says what has been pushed; Pages deploys ~30s
later, so between the two there is a window where the repo has a number the
world has not been served. The cache key's rule is *never go back past what
BROWSERS HAVE*, and the page is the only surface that states exactly that.

Jaco: *"primero checkeamos porque Adam ha pusheado."* Fetched: **v6.48**, so
6.49 was free and is what this batch takes. **Do this before choosing a number
from now on** — it costs one request and it retires the guess. The skip-if-unsure
rule stays for the case the fetch cannot answer (the site down, a private repo,
a deploy still in flight), where it is still the right default.

**AND THE WELL BATCH COLLAPSED 6.82 → v6.74, WHICH IS THE FIFTH TIME.** Jaco:
*"v6.74 por favor."* Fetched before touching a line: **live is v6.48**, so every
number from 6.49 up was minted by EDITING and not one of them has bytes behind
it — the library-inside-the-well work alone burnt 6.74 through 6.82 getting
itself testable. 6.74 > 6.48, so the key still only goes UP, which is the one
thing that makes a renumber safe.

**The fetch is what turns this from a guess into a fact**, and it is the whole
reason that habit is written down: the sections below reason at length about
Claude being unable to read `origin/main`, and the live page answers the only
question that matters in one request. It also corrected this file's own
assumption — several entries above talk as though live had moved past 6.60.

**One thing it costs locally, and it is the cache trap in reverse:** this
session has already served `?v=6.74` to the pane while testing, so that number
is NOT a cache-bust here any more. It does not matter for the publish (a cold
browser has never seen it), and it does mean any further measuring in this
session needs a number above 6.82 rather than a re-load of this one. The note
headings keep their edit-time labels, as always.

**AND v6.63 – v6.67 WERE BURNT ON THE PANE'S OWN CACHE, WHICH IS THE ONE
EXCEPTION WORKING AS WRITTEN.** Live was v6.62 and this batch should have been
v6.63 — but the number had to move five times to be testable, and once for a
reason worth carrying: **the pane had already fetched `render.js?v=6.64` at an
earlier point in the same session**, so bumping BACK to a number it had seen
served the stale file while `app.js` came back fresh. The tell was
`buildObLangList.toString()` not containing the attribute that was plainly in
the file — this file's own "check the running function, not the file", one
layer out: it is the URL that is cached, so **a number you have already used is
not a cache-bust**. Collapsing to 6.63 was the tidier option and was refused for
that reason: 6.63 – 6.67 are poisoned locally, and the cost of skipping them is
the cosmetic one this section opens with. Ships as **v6.68**.

**AND THE WHOLE 6.45 – 6.70 RUN COLLAPSED BACK TO v6.45, WHICH IS THE THIRD
TIME THIS FILE RECORDS THE SAME MOVE.** Jaco: *"necesito que lo pusheemos a
6.45, ya que la live actual es 6.44."* Everything from the cell rewrite through
the accordion, the travel work and this batch was minted by EDITING — twenty-six
numbers, none of them by publishing — so live never moved off **v6.44** and not
one byte was ever served under any of them.

The rule is unchanged and is the only thing that makes this safe: **never go
back past LIVE.** 6.45 > 6.44, nothing is cached under 6.45, so the key still
only goes UP. Had any one of those twenty-six gone out, the only correct move
would have been forward.

**The note headings keep their edit-time labels** (v6.46, v6.51, v6.52–70 …),
deliberately, for the reason the v6.62 → v6.39 renumber gives: they are the
order the decisions were made in, which is what makes them readable as a
history. All of them ship together in **v6.45**. Don't go looking for a live
v6.70.

**AND THE 6.46 – 6.54 RUN COLLAPSED TO v6.46, WHICH IS THE FOURTH TIME.** Jaco:
*"me lo pushees en v6.46 por favor."* Live is **v6.45**; everything since — the
forced alignment, the count column, the tooltip discs, the blue leaving the open
row and the layout flag's storage — was minted by EDITING, nine numbers, none of
them ever served. So it all publishes as **v6.46**, and 6.47 – 6.54 are gaps
with no bytes behind them.

Safe for the one standing reason: **never go back past LIVE.** 6.46 > 6.45 and
nothing was ever cached under any of the nine. The note headings keep their
edit-time labels for the usual reason — they are the order the decisions were
made in.

**AND THEN IT WENT TO v6.47, WHICH IS THE SKIP-IF-UNSURE RULE DOING ITS JOB.**
The sticky-header fix landed minutes after that renumber, and by then *"pushees
en v6.46"* had been acted on or not — unknowable from here, because Claude
cannot read `origin/main`. Staying on 6.46 risks publishing new bytes under a
key browsers may already hold, which is the diverged-cache failure this section
exists to prevent; going up costs one number this section's own first line calls
cosmetic. So 6.47. If 6.46 never shipped, both batches simply publish together
as 6.47 and 6.46 joins the gaps.

**AND 6.48 AND 6.49 CAME BACK TO v6.47 — ASKING BEATING THE SKIP RULE TWICE IN
ONE SESSION.** The 5px tooltip gap took 6.48 and the count's colour 6.49, both
under the skip-if-unsure rule, because this session cannot read `origin/main`.
Jaco supplied the two facts it cannot get for itself — *"just minor changes so
we can push on the same?"* and then *"6.47 is fine"* — so the whole batch
publishes as **v6.47**, and 6.48 and 6.49 join the gaps with no bytes behind
them. Safe for the one standing reason and only that one: the key still only
goes UP against LIVE. The headings below keep their `(v6.48)` / `(v6.49)` labels
for the usual reason — they are the order the decisions were made in.

**AND v6.51 THROUGH v6.53 WENT THE SAME WAY, for the same reason.** v6.51 was
written up and, as far as this session could tell, never shipped; the accordion
port then needed the key to move three more times to be testable — once to load
the new `.pvt-*` rules at all, once after the `.tooltip-anchor` display fix, and
once after the scrollbar lane. So the whole port publishes as **v6.54**, one
version, and 6.51 – 6.53 are gaps with no bytes behind them.

**If v6.51 DID go live**, this is still correct and the key still only went UP —
nothing published under 6.52 – 6.54, and 6.54 > 6.51. Worth knowing which,
though, because it decides whether the v6.51 privacy-matrix work is already out
there or is riding along inside this publish.

**v6.45 THROUGH v6.50 WERE MINTED AND NEVER SERVED, which is the ordinary case
and not a mistake.** v6.44 was live, so the cell rewrite took 6.45; then the
specificity fix 6.46, the box-becomes-the-cell correction 6.47, the meta slab
6.48, the header band 6.49, the 2px scroll 6.50 and the block anchor 6.51 — each
one needing the cache key to move again to be testable at all, because `?v=` is
the only key these files have and the pane will happily serve the old bytes.

That is this section's ONE EXCEPTION — a cache that has already diverged —
working exactly as written: the number only ever went UP, and none of the six
skipped ones had bytes behind them. Nothing to reclaim, and **all seven publish
as one version**, which is the rule this section opens with. The cost of the
exception is cosmetic by design: a gap in the history, against a class of bug
that is indistinguishable from a real one.

**AND v6.43 IS WHAT ASKING BUYS.** Live went to v6.41 (ours) and then v6.42
(Adam's, nothing of ours in it), so the next free number is 6.43 — and the only
way to know that from here is that Jaco said so. Claude cannot read
`origin/main`. Left to the skip-if-unsure rule below it would have picked 6.42
and collided with a number already served, which is the one failure that rule
exists to prevent; guessing upward would then have been *wrong in the other
direction* only by luck. The ordering holds: **ask first, guess up only when
nobody can say.**

**THE SKIP-IF-UNSURE RULE, AND THE ONE THING THAT BEATS IT: ASKING.** This
batch was written up to v6.42 mid-session on the reasoning that v6.41 had been
minted by editing and Claude could not tell whether it had been served — being
barred from git, it cannot read `origin/main`. The asymmetry is real and worth
keeping: staying on a number that is LIVE publishes new bytes under a key
browsers have already cached, which is the diverged-cache failure this section
exists to prevent, where skipping one burns a number this section's own first
line calls cosmetic. **When the number's status is unknown, go up.**

**But Jaco knew** — *"push this to 6.41"* — and it shipped as v6.41, put back
across all fifteen lines. Safe for the standing reason and only that one: live
was v6.40 and **nothing had ever been served under 6.41**, so the key still only
went UP. Same move as the v6.62 → v6.39 renumber and the v6.41 → v6.40 one
before it, and the third time this file records it: the rule is not "never go
back", it is "never go back past LIVE".

So the ordering to keep is: ask the person who can read `origin/main`; skip only
when nobody can say. Guessing upward is the safe default, not the right answer.

**v6.40 shipped as the number that had been minted by EDITING and never served.**
It was briefly written up to v6.41 and put back — the same move as the v6.62 →
v6.39 renumber above, and safe for the same one reason: live was v6.39 and
nothing had ever been cached under 6.40, so the key still only went UP. Bump once
per publish; the number already sitting in the files unpublished IS the one that
publish takes. v6.41 is the next batch, minted after 6.40 really went live.

**THE NUMBER WENT BACKWARDS ONCE, ON PURPOSE — v6.62 → v6.39.** Live sat at
v6.38 while the working copy had been edited up to v6.62: twenty-three numbers
minted by EDITING, none of them by publishing, which is exactly what the "bump
once per publish" rule above exists to prevent. So the whole batch shipped as
**one** version, v6.39, and that is the number live jumped to.

Renumbering was safe for one reason and one only: **no number between 6.39 and
6.62 had ever been served.** The version string is a cache key, so it must only
ever go UP against what is LIVE — 6.39 > 6.38 and nothing had bytes cached
under any of them. Had even one of those gone out, the only correct move would
have been forward.

The other half was the collision risk this section is mostly about: picking the
next number after live is what the OTHER side will also pick. Jaco confirmed
Mark was not shipping that day, which is the check that made 6.39 free.

**The note headings below still carry their edit-time labels (v6.55, v6.58,
v6.60, v6.62 …) and are deliberately NOT rewritten.** They are the order the
decisions were made in, which is what makes them readable as a history; all of
them shipped together in v6.39. Don't go looking for a live v6.55.

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
3. Publish: `./ship.sh` (commits, pulls, pushes).

GitHub Pages auto-deploys from `main` within ~30 seconds of a push.

### The commit message comes from `.ship-message` (v6.58)

**Claude's last act on a batch of edits is to write `.ship-message`** at the
repo root, and the contributor then runs `./ship.sh` with no argument. Format:

```
v6.xx — subject line, under 72 characters
<blank line>
As long an explanation of the build as the change deserves. Paragraphs,
bullets, whatever the change needs. This is what the log will carry.
```

`ship.sh` commits it with `-F`, so the first line becomes the commit title on
GitHub and everything under it the description. The file is gitignored and is
CONSUMED on a successful push (renamed `.ship-message.sent`), so a bare run can
never re-publish the last build's description under a new one.

- **The version in the subject must match `index.html`'s footer badge.** `ship.sh`
  checks, and falls back to a file list rather than describing the wrong build.
- `./ship.sh "your own subject"` still works and still wins. Claude's note is
  set aside unused rather than left for a later bare run to pick up.
- No note at all is not an error: it publishes with `vX.YZ — update (n files)`
  and the changed-file list as the body.
- A failed push leaves the note in place for the retry.

Claude writes this file; it does not run git. Ending a batch of edits means
writing `.ship-message` and saying "run `./ship.sh`" — not handing over a
one-line subject to paste, which is what this replaced.

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

**AND THE CONFLICT IS THE THIRD WAY TO READ THE LIVE NUMBER WITHOUT GIT.** The
fetch above is the first and `.git/config` the second; this one is free,
because a conflicted file **prints both sides in the working tree** — a plain
file read, no command. `<<<<<<< HEAD` is `origin/main`'s version of those
fifteen lines and the `>>>>>>>` half is yours, so one grep answers the only
question the resolution depends on: *did the other side take my number?*

That is what `--theirs` silently assumes and cannot check. It is the right
default and it is only right while the other side's number is LOWER. v6.49 hit
this: Adam pushed `e9a92d1` after the fetch that had cleared 6.49, so the fetch
was stale by the time the rebase ran — and the markers said HEAD was still
**6.48** on all fifteen lines, i.e. his push touched `app.js`, `render.js` and
`style.css` and never bumped. 6.49 was still free, `--theirs` was still right,
and this time it was *known* rather than assumed.

**If HEAD's side is EQUAL TO OR HIGHER than yours, stop** — `--theirs` would
publish new bytes under a key browsers already hold, which is the whole failure
the Versioning section exists to prevent. Go up past both and rewrite all
fifteen lines before continuing.

```bash
grep -A1 '^<<<<<<< HEAD' index.html | grep -o 'v\?[0-9]\+\.[0-9]\+'
```

Resolving by hand is also fine and is what happened here — the hunks are only
version strings, so editing them out is as safe as `checkout --theirs` and
leaves you having read what you kept. Then `git add` both files and continue as
above; skip the `checkout` line.

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
- **TWO PRESENTATIONS BEHIND ONE FLAG, AND IT HAS TO EXPIRE.** `submission.layout`
  ('inline' | 'modal') now picks between the tab strip + inline pane (v6.29–v6.37,
  Mark's, and the default) and the platform-card grid + step modals that preceded
  it. v6.38 added two things to a flag that had neither: a way to SET it
  (`?layout=modal`, remembered in `localStorage` under `sm.layout` — the hook sits
  under the `state` literal in state.js) and the other half of what it claims to
  switch (the card grid, in `renderDashboard`; it only moved the row's click
  before).

  Nothing was reconstructed from memory. Both times the pattern was the same and
  it is worth recognising again: `dash-column` appeared **0 times in render.js and
  4 in style.css**, `dash-add-banner` **0 and 6** — markup deleted, design intact.
  The builders were never touched either, as the comment above `submissionTab()`
  says in Mark's own words: *"buildActiveCard and the four builders under it are
  still here and still correct"*. So the arm is a call site and a wrapper, not a
  fork of the rendering.

  **The default is untouched by construction.** With no `?layout=` and nothing
  stored, neither the hook nor the branch does anything, so the live site is
  exactly what it was. That is what made it safe to add without waiting.

  **AND IN v6.47 THE DEFAULT BECAME 'modal'.** Jaco: *"quiero que por defecto
  siempre tengamos ?layout=modal… no quiero que borremos nada de la
  implementación inline, pero que modal esté por defecto siempre."* It is ONE
  WORD — the literal in state.js — plus two stale statements of the default
  that had to move with it: `smSubmitLayout`'s own doc line, which still said
  "(default)" beside inline, and its `|| 'inline'` fallback, which is
  unreachable while the literal exists but was a second place naming the other
  arm. **Both arms, the `?layout=` hook and every branch that reads the flag
  are untouched**, which is the point: the decision aid stops defaulting to the
  arm nobody chose, without the loser being deleted before there is a decision.
  Verified on a cold load with nothing stored: `modal`, and `smSubmitLayout`
  still flips to `inline` and back.

  **AND IN v6.46 THE REMEMBERING WENT, WHICH IS WHAT MAKES IT A REAL DEFAULT.**
  Jaco: *"necesito que me garantices que cualquier persona que lo abra verá el
  modal flag por defecto."*

  This entry used to carry a paragraph headed *"one thing that looks like a bug
  and is not"*: a browser that ever loaded `?layout=inline` had `sm.layout`
  stored, the hook was "required to honour" it, and on that machine the new
  default did nothing until someone ran `localStorage.removeItem`. Re-read as a
  guarantee rather than as a feature, that is **a default with an invisible
  per-machine exception** — and the people who open a prototype are exactly the
  ones who cannot be told to clear a storage key.

  So `localStorage` leaves this block entirely, and **any key already written is
  REMOVED on the way past** rather than left as a dead entry: the guarantee has
  to hold on the machines that already tripped it, which is the whole point of
  being asked for one. The URL is the only door now — `?layout=inline` still
  gives the other arm, for that load — and `smSubmitLayout()` never touched
  storage, so the console switch and the reload door finally agree.

  What it costs, and it is the thing that was being bought: comparing the inline
  arm over a working day now means keeping the query string on. That was worth a
  localStorage key while the two arms were genuinely being weighed; it is not
  worth one now that the default is settled and the flag is waiting to be
  deleted.

  Verified end to end: `sm.layout` set to `inline` → cold load with no query
  comes up **modal** with the key **cleared**; `?layout=inline` → inline for
  that load and nothing stored; the next plain load → modal again.

  **AND IT IS A DECISION AID, NOT AN ARCHITECTURE.** Two presentations of the same
  surface is a real tax: every future change to the submission tab has to be
  thought about twice, and the arm nobody is looking at is the one that silently
  rots — the add banner was unreachable in the card arm for its first ten minutes
  precisely because the control that opens the picker lives in the tab strip. That
  is the failure mode, and it will recur. So this exists to let two people look at
  both and choose. **When the choice is made, the loser comes out** — the arm, the
  flag, the hook and this note, the way the dev bar was deleted rather than left
  switched off. If it is still here in a month, that is the bug.

  **AND IT RECURRED TWICE, EXACTLY AS PREDICTED.** Both of Jaco's reports from
  the card grid are one shape: a control that was re-pointed at the PANE when
  the pane arrived, leaving the card's copy aimed at a surface that is not on
  screen. Neither throws, both look like nothing happening.

  - **The gear stopped flipping the card.** `_platformHeadActions` sends the
    steps face's gear to `platformGearFromTab`, which writes
    `submission.tab` / `submission.settings` and re-renders — and in the grid
    arm nothing reads either one. `buildActiveCard` asks `showAccountFace`,
    which reads `platformFace`, which that function never writes; so the press
    changed two fields nobody was reading and `renderSubmission` rebuilt the
    identical cards. It branches on the flag now, back to
    `platformGearFromSteps`, the flip `_cacheStepsFaceHeight` and
    `buildAccountCard` are still built around. **`_flipPlatformCard`'s pane
    guard had to move with it**: `submission.settings === pid` is a fact about
    the INLINE presentation, and tested alone a value left there by a press
    under the old handler would send the next flip into
    `closePlatformSettings` — the card refusing to turn over for a reason
    belonging to another layout.
  - **`.active-cards-grid` is rendered NOWHERE**, so the height pin inside that
    flip has been a no-op for as long as `.dash-column` has been the markup.
    Found while fixing the gear, and the tell is the same one the add banner
    gave: a name with rules in style.css and zero uses in render.js.

  **AND CHOOSING A TRACK NEVER TICKED UPLOAD BUILD — that one is both arms.**
  `selectTrack` patched exactly the two boxes the pill had ever lived in, the
  submit row and the release block. Both patches were correct and both were an
  INVENTORY, and the inventory was two short: `_uploadBuildComplete` reads
  `selectedTracks`, so a destination also ticks Upload Build's disc, promotes
  its row, moves the step count and takes `.active-card` into `submit-ready`.
  So the card said the destination was chosen while the step asking for it sat
  grey. It renders now, on `_refreshBuildUI`'s own argument — "branching on
  which to do would be two code paths for one event" — and `_paintStepRow` was
  not an option, because the card builders emit `.ios-step-num` with no
  `dot-<pid>-<stepId>` and that helper returns on its first line.

  **The general form, and it is worth stating once for the rest of this flag's
  life: a surgical repaint is an inventory of consequences, and an inventory
  goes stale every time something new starts reading the value.** A render
  cannot.

  **AND THEN THE THIRD ONE, WHICH IS THE SAME SHAPE AGAIN AND ALSO A MODEL
  QUESTION.** The entry above shipped one thing DECIDED-AGAINST: uploading a
  binary did not tick Upload Build on a card, filed as the model working —
  "a build with no destination is not a finished step". Jaco: *"en el flag modal
  dudo que eso tenga que ser así? quizás debería marcarse el check sí o sí. Y
  que sólo si doy a submit y falta elegir el track, se oscurezca todo para
  elegir el track."* He is right, and the full argument is at
  `_uploadBuildComplete` (state.js) where the predicate lives. Two measurements
  settled it:

  - **The row contradicted itself.** Upload Build's row HOLDS the build pill,
    which draws a green check and the filename (`build-pill has-build`), while
    its own disc beside it stayed a bare `ios-step-num`. One row, two answers,
    six pixels apart.
  - **Gate 3 was unreachable, and gate 2 pointed at the lie.** With Upload Build
    incomplete, `submitStepClick` refused at gate 2 and spotlighted that row —
    so pressing Submit answered "finish this step" by dimming the whole card
    around the one row that looks finished.

  **A step disc answers for what the step CONTAINS**, and that is the whole
  rule: v6.29's argument is explicitly "the step now literally contains the
  question", which is true of the pane and false of the grid, where shape 4 put
  the picker in the card's own chrome two rows above the list. So the predicate
  reads the flag — not as a special case, but as how it asks where the picker
  currently lives. The destination did not stop being required; it stopped
  being a checklist item and became a property of the PRESS.

  **AND GATE 3 COULD NOT ASK FOR IT — third instance of the one shape.** Its
  branch tested `openStep[pid] !== 'uploadBuild'`, a fact about the PANE, and
  then called `toggleStepSection`, whose first line is `if (layout === 'modal')
  return openStepModal(…)`. Measured: pressing Submit with no track OPENED THE
  UPLOAD BUILD MODAL and spotlighted nothing. It asks the DOM now — the chip
  either is in the document or it is not, which is true in both arms with no
  flag at all.

  Measured end to end on a card: build in, no track → 4/4 with the disc
  `is-done` and Submit `submit-step-ready`; press Submit → no modal, card
  `is-spotlight` with the head and all five step rows at **.18**, the release
  block at **1** and the chip `is-spotlit` at 1; choose the track from there →
  spotlight cleared, gate returns `true`, Submit ready. The inline arm verified
  unchanged (false without a track, true with) and a platform with no
  `PLATFORM_TRACKS` entry still finishes on the binary alone.

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
- **Port Google Play's Data Safety table onto `.pvt-*`, and then delete
  `.prv-*`.** v6.52 gave Apple's table its own vocabulary rather than rewriting
  the shared rules, which was the right call for one change and leaves two table
  dialects for what is visibly one kind of object. The real work is not the
  look, it is that Google Play has **eleven columns** and a **`locked`** state
  (Ephemeral and Required are dead until Collected is on) that the accordion
  markup has no concept of — a 14px square that cannot be pressed needs deciding
  before anything is ported. Steam Languages is the easy half: three cells,
  never add, never locked. **When both are across, `.prv-matrix` / `.prv-hit` /
  `.prv-box` / `.prv-check-cell` and `_prvCell` should GO**, not stay as the
  second dialect — the argument the dev bar was deleted under. Until then the
  two are deliberately independent and a change to one does not reach the other.
  Note Google Play's own copy of the privacy-preset bug is still open too (below,
  under "A preset that cannot answer without the network"), and both jobs are in
  the same builder — worth doing in one pass.
- **The screenshots editor's open questions (v6.41).** Three things it leaves
  deliberately, none of them blocking: a REMOTE screenshot (IGDB through the
  proxy) taints the canvas so no preview can be baked — the transform survives
  and only the store thumbnail shows the uncropped picture; the four
  non-App-Store platforms (Android, Steam, Epic, PSN…) all get the same editor
  through the same step, but only Mac's frame ratio has been looked at against
  a real store page; and there is no way to crop a shot differently per DEVICE
  the way the reference prototype's iPhone/iPad toggle does — `SM_REQS.ios`
  carries two `shot` rows and this reads the first.
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

  **THE AFFORDANCE HALF LANDED IN v6.40 — see "An editable field wears a well".**
  The resting mark exists now (a `--bg` well with a white-14% stroke on every
  `.ias-editable`), the amber left the Mac preview entirely, and focus went from
  three colours to one. Two things that section leaves open and this brief should
  pick up: the **four non-text click targets** (Content, Screenshots, Business,
  Data privacy) now draw nothing at rest, which is a silence rather than a
  decision; and the **volume pass itself is still unstarted** — the inventory
  found the previews were too QUIET, not too loud, so whatever is genuinely
  shouting is somewhere else and has not been listed yet. Start that inventory on
  a different surface than this one.
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
