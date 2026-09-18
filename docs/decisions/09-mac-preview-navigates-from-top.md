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
