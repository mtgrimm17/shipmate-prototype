# Shipmate Prototype — Claude Context

## What This Is

Shipmate is a web app that helps game developers prepare and submit their games to app stores (iOS App Store, Google Play, Steam, Epic, PlayStation, Xbox, Nintendo). It walks developers through content ratings, data collection disclosures, business categories, screenshots, and binary analysis — using AI to infer answers where possible.

This is a **static HTML/CSS/JS prototype** hosted on GitHub Pages. There is no build system, no npm, no bundler. Everything runs directly in the browser.

Current version: **v6.17**

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

### The release block (VERSION / BUILD / TRACK)

`buildReleaseBlock()` in render.js. Two rows: what was uploaded, then where it
goes. Every number in it is derived from a constraint rather than picked —

- The label column is a **fixed 62px** + a 14px gap, so values start at 97 on
  every card. `auto` measures the longest label present, which is fine in one
  card and wrong across a grid: VERSION, BUILD and DEPLOYED are different
  widths, so the values started at a different x per platform.
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

The glint itself changes **only light**. A resting `.iv-tab` sits at
`opacity: .2`, so raising it to .85 and back on a sine
(`cubic-bezier(.37,0,.63,1)`, 900ms) is the whole animation, plus a white-8%
fill at the peak for body. The first version scaled the dot to 1.18 and threw a
7px ring out of it, which on a 28px circle reads as a control demanding a press
rather than as a hint. Keyframe 0%/100% must *be* the resting opacity, or the
dot jumps when the class is stripped on `animationend`.

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

### The destination is chosen when you send, not before

The release block's TRACK row **does not exist until a destination has been
chosen** (`buildReleaseBlock`, render.js). An empty "Select track" pill spent a
whole row of a status card asking a question, and the card's job is to say where
the build went.

The asking moved to the moment of sending. Pressing Submit with everything ready
and no destination turns the submit row itself into the question — "Send to —
[TestFlight / internal] [TestFlight / external] [Mac App Store]" — and choosing
one sets the track and submits in the same gesture (`chooseTrackAndSubmit`,
app.js). The options are `.yn-btn`, the answer pill from Content Rating, because
that is what they are.

That replaced gate 3 of `submitStepClick`, which used to spotlight the pill in
the block above: a prerequisite you could only satisfy by finding a ghost
control elsewhere on the card. Nothing is preselected, here or anywhere — the
destination is a decision, and a silent default would make it on your behalf.

Once chosen the row comes back **still a picker**, so changing your mind does not
mean going through Submit again. This is the small version of "the track belongs
to the Submit step": the full version gives Submit a body that states what each
destination implies (they are different review paths), and the row is now in the
right place to grow into it.

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

Current version: **v6.17** → next is **v6.18**, then **v6.19**, etc.

Update the version in **three places**:
1. `index.html` — all `?v=X.XX` cache-bust params on script/style tags (14 of them)
2. `index.html` — the footer badge: `<span class="app-footer-version" id="app-footer-version">vX.XX</span>`
3. `splash.html` — the version badge text (around line 1366)

Note on splash.html: the iframe that used to load it was ported into `splash.js`
back in v2.34, so nothing references `splash.html` any more. Its badge is
updated for consistency only — there is no `src="splash.html?v=X.XX"` to change,
despite what earlier versions of this file said.

Always include the new version number in the ship note, e.g. `"v6.17 — add tooltip to age rating cell"`.

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

Include the version number in the ship note: `./ship.sh "v6.17 — description of change"`.

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

See GitHub Issues for the current backlog. As of v6.17, the following items are in the queue:

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

---

## Pending AI Model Decision

The team is evaluating which AI model to use for production inference. A benchmark spec is in `shipmate-ai-benchmark-spec.md`. Current leading candidate: **Claude Sonnet 5** for real-time inference. Open-weight fine-tuning (Qwen2.5-32B range) is a future option once sufficient labeled data is collected.
